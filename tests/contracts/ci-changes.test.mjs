import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {classifyChanges, parseDiff, detectChanges, summary, OFFLINE_FLAVOR} from '../../scripts/ci-changes.mjs';

const record = (path, status = 'M') => ({path, status,
  oldMode: status === 'A' ? '000000' : '100644', newMode: status === 'D' ? '000000' : '100644'});
const profile = paths => classifyChanges(paths.map(p => typeof p === 'string' ? record(p) : p));
for (const [name, paths, expected] of [
  ['documentation', ['README.md', 'docs/PUZZLE-FORMAT.md'], 'documentation'],
  ['F01 PR', [...OFFLINE_FLAVOR, 'docs/FLAVOR-PIPELINE-F01.md', 'docs/PUZZLE-FORMAT.md'], 'offline-flavor'],
  ['browser code', ['src/ui/game.mjs'], 'full'],
  ['engine shared by Flavor and browser', ['src/engine/validate.mjs', ...OFFLINE_FLAVOR], 'full'],
  ['map assets', ['assets/seekarte/frame-parchment-01.webp'], 'full'],
  ['puzzle data', ['puzzles/manifest.json'], 'full'],
  ['archive release', ['archive/releases/new/manifest.json'], 'full'],
  ['browser tests', ['tests/browser/chart.spec.mjs'], 'full'],
  ['Playwright config', ['playwright.config.mjs', 'playwright.webkit.config.mjs'], 'full'],
  ['package', ['package.json'], 'full'],
  ['lock', ['package-lock.json'], 'full'],
  ['workflow', ['.github/workflows/tests.yml'], 'full'],
  ['shared tools', ['scripts/lib/content-hash.mjs'], 'full'],
  ['detector', ['scripts/ci-changes.mjs'], 'full'],
  ['detector tests', ['tests/contracts/ci-changes.test.mjs'], 'full'],
  ['unknown', ['new/unreviewed.mjs'], 'full'],
  ['unknown Markdown', ['src/README.md'], 'full'],
  ['new Flavor-looking module requires review', ['scripts/lib/flavor-runtime.mjs'], 'full'],
  ['new Flavor-looking fixture requires review', ['tests/fixtures/flavor/new.json'], 'full'],
  ['executable data under docs', ['docs/seekarte-template/contract.json'], 'full'],
  ['hashed Markdown under docs', ['docs/verification/S03/contract.md'], 'full'],
  ['deleted Flavor leaf', [record('scripts/lib/flavor-contract.mjs', 'D')], 'offline-flavor'],
  ['deleted runtime', [record('src/ui/game.mjs', 'D')], 'full'],
  ['renamed docs', [record('docs/OLD.md', 'D'), record('docs/NEW.md', 'A')], 'documentation'],
  ['runtime renamed into documentation', [record('src/ui/game.mjs', 'D'), record('docs/game.md', 'A')], 'full'],
  ['offline leaf moved to shared runtime', [record('scripts/lib/flavor-contract.mjs', 'D'), record('src/flavor.mjs', 'A')], 'full'],
  ['empty diff', [], 'full'],
]) test(`selection: ${name} => ${expected}`, () => assert.equal(profile(paths).profile, expected));

test('malformed records, modes and path tricks cannot suppress regressions', () => {
  for (const changes of [undefined, {}, [null], [record('../README.md')], [record('docs/../README.md')],
    [record('docs/nested/README.md')], [record('README.md\n')], [record('docs/NOTE.md\n')],
    [{...record('README.md'), status: 'T'}], [{...record('README.md'), newMode: '120000'}],
    [{...record('README.md'), newMode: '100755'}], [{...record('README.md'), oldMode: '000000'}],
    [{path: 'README.md', status: 'M'}]]) assert.equal(classifyChanges(changes).regressions, true);
});

test('raw NUL diff is strict, preserves filename delimiters and inspects both rename sides', () => {
  const header = ':100644 100644 ' + '1'.repeat(40) + ' ' + '2'.repeat(40) + ' M\0';
  assert.equal(parseDiff(Buffer.from(header + 'docs/file\twith\nnewline.md\0'))[0].path, 'docs/file\twith\nnewline.md');
  for (const raw of ['', header, header + 'README.md', 'M\0README.md\0', header + '\0', header + 'README.md\0extra\0']) {
    assert.throws(() => parseDiff(Buffer.from(raw)));
  }
  assert.throws(() => parseDiff(Buffer.from([0xff, 0])));
});

function repository(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'ci-diff-'));
  t.after(() => rmSync(cwd, {recursive: true, force: true}));
  const git = (...args) => execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  git('init', '-b', 'main'); git('config', 'user.name', 'CI Test'); git('config', 'user.email', 'ci@example.invalid');
  const write = (name, content) => {mkdirSync(path.dirname(path.join(cwd, name)), {recursive: true}); writeFileSync(path.join(cwd, name), content);};
  const commit = () => {git('add', '.'); git('commit', '-m', 'fixture'); return git('rev-parse', 'HEAD');};
  write('README.md', 'base'); write('src/ui/game.mjs', 'base runtime');
  const base = commit();
  const push = (before, after, overrides = {}) => detectChanges({cwd, eventName: 'push', commit: after,
    event: {ref: 'refs/heads/main', before, after, ...overrides}});
  const pr = (baseSha, headSha) => detectChanges({cwd, eventName: 'pull_request',
    event: {pull_request: {base: {sha: baseSha}, head: {sha: headSha}}}});
  return {cwd, git, write, commit, base, push, pr};
}

test('push spans every commit, not only HEAD^; a runtime edit in an earlier commit forces full', t => {
  const r = repository(t); r.write('src/ui/game.mjs', 'changed runtime'); r.commit();
  r.write('README.md', 'documentation in final commit'); const head = r.commit();
  assert.equal(r.push(r.base, head).profile, 'full');
  const previous = r.git('rev-parse', 'HEAD^');
  assert.equal(r.push(previous, head).profile, 'documentation');
});

test('PR diff uses merge base; runtime changes on the merged base also force full', t => {
  const r = repository(t); r.git('checkout', '-b', 'pr');
  r.write('scripts/lib/flavor-contract.mjs', 'offline fixture'); const head = r.commit();
  assert.equal(r.pr(r.base, head).profile, 'offline-flavor');
  r.git('checkout', 'main'); r.write('docs/PRODUCT.md', 'base docs'); const docsBase = r.commit();
  const result = r.pr(docsBase, head);
  assert.equal(result.profile, 'offline-flavor'); assert.equal(result.base, r.base);
  r.write('src/ui/game.mjs', 'new runtime on main'); const runtimeBase = r.commit();
  assert.equal(r.pr(runtimeBase, head).profile, 'full');
});

test('real Git deletions, renames and symlinks cannot hide a runtime path', t => {
  const r = repository(t); mkdirSync(path.join(r.cwd, 'docs')); r.git('mv', 'README.md', 'docs/README.md');
  r.write('docs/NOTE.md', 'doc'); const head = r.commit();
  const result = r.push(r.base, head);
  assert.equal(result.profile, 'documentation'); assert.deepEqual(result.changes.map(c => c.status).sort(), ['A', 'A', 'D']);
  r.git('reset', '--hard', r.base); mkdirSync(path.join(r.cwd, 'docs'), {recursive: true}); r.git('mv', 'src/ui/game.mjs', 'docs/RUNTIME.md');
  assert.equal(r.push(r.base, r.commit()).profile, 'full');
  r.git('reset', '--hard', r.base); rmSync(path.join(r.cwd, 'README.md'));
  symlinkSync('src/ui/game.mjs', path.join(r.cwd, 'README.md'));
  assert.equal(r.push(r.base, r.commit()).profile, 'full');
});

test('manual, unsupported, missing, stale, forced, shallow or failed diff detection means full', t => {
  const r = repository(t); r.write('README.md', 'docs'); const head = r.commit();
  assert.equal(detectChanges({eventName: 'workflow_dispatch'}).profile, 'full');
  assert.equal(detectChanges({eventName: 'schedule'}).profile, 'full');
  for (const overrides of [{before: undefined}, {before: '0'.repeat(40)}, {before: 'f'.repeat(40)},
    {after: r.base}, {created: true}, {deleted: true}, {forced: true}, {ref: 'refs/heads/other'}]) {
    assert.equal(r.push(r.base, head, overrides).profile, 'full');
  }
  assert.equal(r.push(head, head).profile, 'full');
  assert.equal(r.push(head, r.base).profile, 'full');
  assert.equal(r.pr(undefined, head).profile, 'full');
  assert.equal(r.pr(r.base, 'f'.repeat(40)).profile, 'full');
  assert.equal(detectChanges({cwd: '/definitely/missing/ci-repo', eventName: 'push', commit: head,
    event: {ref: 'refs/heads/main', before: r.base, after: head}}).profile, 'full');
  const shallow = path.join(r.cwd, 'shallow');
  r.git('clone', '--depth=1', `file://${r.cwd}`, shallow);
  assert.equal(detectChanges({cwd: shallow, eventName: 'push', commit: head,
    event: {ref: 'refs/heads/main', before: r.base, after: head}}).profile, 'full');
});

test('CLI writes only fixed policy outputs and explicitly distinguishes omitted tests', t => {
  const r = repository(t); r.write('README.md', 'docs'); const head = r.commit();
  const eventFile = path.join(r.cwd, 'event.json'), output = path.join(r.cwd, 'output'), report = path.join(r.cwd, 'summary');
  writeFileSync(eventFile, JSON.stringify({ref: 'refs/heads/main', before: r.base, after: head}));
  const run = () => execFileSync(process.execPath, [path.resolve('scripts/ci-changes.mjs')], {cwd: r.cwd,
    env: {...process.env, GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: eventFile, GITHUB_SHA: head,
      GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: report}});
  run();
  assert.equal(readFileSync(output, 'utf8'), 'profile=documentation\nregressions=false\n');
  assert.match(readFileSync(report, 'utf8'), /NOT executed or passed/);
  writeFileSync(eventFile, '{broken'); writeFileSync(output, ''); run();
  assert.equal(readFileSync(output, 'utf8'), 'profile=full\nregressions=true\n');
  assert.match(summary(profile(['src/ui/game.mjs'])), /required \(see job results\)/);
});

test('workflow safety contract: stable checks, explicit opt-out, full on failed or missing detection', () => {
  const workflow = readFileSync('.github/workflows/tests.yml', 'utf8');
  const blocks = new Map([...workflow.slice(workflow.indexOf('jobs:\n')).matchAll(/^  ([a-z][a-z0-9-]*):\n([\s\S]*?)(?=^  [a-z][a-z0-9-]*:\n|$(?![\s\S]))/gm)].map(m => [m[1], m[2]]));
  assert.deepEqual([...blocks.keys()], ['changes', 'unit', 'catalog-releases', 'b2-s02-reproduction',
    's03-reproduction', 'assets', 'browser', 'webkit', 'deployment']);
  assert.doesNotMatch(workflow, /^\s+paths(?:-ignore)?:/m);
  assert.match(blocks.get('webkit'), /shard: \[1, 2, 3, 4, 5, 6\]/);
  assert.match(blocks.get('changes'), /with: \{fetch-depth: 0\}/);
  for (const id of ['b2-s02-reproduction', 's03-reproduction', 'assets', 'browser', 'webkit', 'deployment']) {
    const block = blocks.get(id);
    assert.match(block, /^    needs: changes$/m);
    assert.match(block, /^    if: \$\{\{ !cancelled\(\) \}\}$/m);
    assert.ok(block.includes("RUN_REGRESSIONS: ${{ needs.changes.result != 'success' || needs.changes.outputs.regressions != 'false' }}"));
    const steps = block.split(/^      - /m).slice(1);
    const summary = steps.pop();
    assert.match(summary, /if: env.RUN_REGRESSIONS == 'false'/);
    assert.match(summary, /NOT executed or passed/);
    if (id !== 'deployment') for (const step of steps) assert.ok(step.includes("env.RUN_REGRESSIONS == 'true'"), `${id} has an unguarded step`);
    else {
      for (const step of steps.filter(s => /npm ci|playwright|Extract actual/.test(s))) {
        assert.ok(step.includes("env.RUN_REGRESSIONS == 'true'"));
      }
      for (const step of steps.filter(s => /tests\/test_.*package|sh scripts\/package.sh|name: static-deployment/.test(s))) {
        assert.doesNotMatch(step, /if:/);
      }
    }
  }
});
