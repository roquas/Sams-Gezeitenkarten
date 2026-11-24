import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Lexer, Parser, Evaluator, data} from '@actions/expressions';
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
  const merge = (baseSha, headSha) => {
    git('checkout', '--detach', baseSha);
    git('merge', '--no-ff', '-m', 'synthetic PR merge', headSha);
    return git('rev-parse', 'HEAD');
  };
  const pr = (baseSha, headSha, commit = git('rev-parse', 'HEAD')) => detectChanges({cwd, eventName: 'pull_request', commit,
    event: {pull_request: {base: {sha: baseSha}, head: {sha: headSha}}}});
  return {cwd, git, write, commit, base, push, pr, merge};
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
  r.merge(r.base, head);
  assert.equal(r.pr(r.base, head).profile, 'offline-flavor');
  r.git('checkout', 'main'); r.write('docs/PRODUCT.md', 'base docs'); const docsBase = r.commit();
  r.merge(docsBase, head);
  const result = r.pr(docsBase, head);
  assert.equal(result.profile, 'offline-flavor'); assert.equal(result.base, r.base);
  r.git('checkout', 'main'); r.write('src/ui/game.mjs', 'new runtime on main'); const runtimeBase = r.commit();
  r.merge(runtimeBase, head);
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
    assert.match(block, /RUN_REGRESSIONS: 'true'/);
    const steps = block.split(/^      - /m).slice(1);
    const selector = steps.shift();
    assert.match(selector, /^name: Validate detector outputs and select regressions/);
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

test('R2: only an exact PR merge checkout with ordered event parents can reduce CI', t => {
  const r = repository(t); r.git('checkout', '-b', 'pr');
  r.write('README.md', 'docs'); const head = r.commit();
  const merge = r.merge(r.base, head);
  assert.notEqual(merge, head);
  assert.equal(r.pr(r.base, head, merge).profile, 'documentation');
  for (const commit of [undefined, '', 'invalid', '0'.repeat(40), 'f'.repeat(40), merge + '\n', head]) {
    // Explicit missing commit cannot use the convenience helper's default.
    assert.equal(detectChanges({cwd: r.cwd, eventName: 'pull_request', commit,
      event: {pull_request: {base: {sha: r.base}, head: {sha: head}}}}).profile, 'full');
  }
  r.git('checkout', '--detach', head);
  assert.equal(r.pr(r.base, head, merge).profile, 'full'); // SHA correct, checkout wrong
  assert.equal(r.pr(r.base, head, head).profile, 'full'); // PR head is not the merge
  r.git('checkout', '--detach', merge);
  assert.equal(r.pr(head, head, merge).profile, 'full'); // first parent wrong
  assert.equal(r.pr(r.base, r.base, merge).profile, 'full'); // second parent wrong
  const tree = r.git('rev-parse', merge + '^{tree}');
  const swapped = r.git('commit-tree', tree, '-p', head, '-p', r.base, '-m', 'reversed parents');
  r.git('checkout', '--detach', swapped);
  assert.equal(r.pr(r.base, head, swapped).profile, 'full');
  r.git('checkout', '-b', 'runtime-pr', head);
  r.write('src/ui/game.mjs', 'runtime PR'); const runtimeHead = r.commit();
  const runtimeMerge = r.merge(r.base, runtimeHead);
  assert.equal(r.pr(r.base, runtimeHead, runtimeMerge).profile, 'full');
});

test('R2 reproduction: stale event base cannot hide runtime changes in tested merge', t => {
  const r = repository(t); r.git('checkout', '-b', 'pr');
  r.write('README.md', 'only docs on PR'); const head = r.commit();
  const staleMerge = r.merge(r.base, head);
  r.git('checkout', 'main'); r.write('src/ui/game.mjs', 'new base runtime'); const advanced = r.commit();
  const actualMerge = r.merge(advanced, head);
  const staleEvent = r.pr(r.base, head, actualMerge);
  assert.equal(staleEvent.profile, 'full');
  assert.match(staleEvent.reason, /merge parents/);
  assert.equal(r.pr(advanced, head, staleMerge).profile, 'full'); // expected SHA stale
  assert.equal(r.pr(advanced, head, actualMerge).profile, 'full'); // consistent, runtime base
  r.git('checkout', '--detach', staleMerge);
  assert.equal(r.pr(r.base, head, staleMerge).profile, 'documentation'); // original consistent run
});

const expressionData = value => value == null ? new data.Null() :
  typeof value === 'string' ? new data.StringData(value) :
  typeof value === 'boolean' ? new data.BooleanData(value) :
  new data.Dictionary(...Object.entries(value).map(([key, v]) => ({key, value: expressionData(v)})));
function evaluateActions(expression, context, status = {}) {
  const functions = new Map(['success', 'failure', 'cancelled', 'always'].map(name =>
    [name, {name, minArgs: 0, maxArgs: 0, call: () => new data.BooleanData(status[name] ?? (name === 'success' || name === 'always'))}]));
  const source = expression.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
  const ast = new Parser(new Lexer(source).lex().tokens, Object.keys(context), [...functions.values()]).parse();
  return new Evaluator(ast, expressionData(context), functions).evaluate();
}

for (const [name, result, profile, regressions, expected] of [
  ['valid documentation', 'success', 'documentation', 'false', false],
  ['valid offline Flavor', 'success', 'offline-flavor', 'false', false],
  ['valid full', 'success', 'full', 'true', true],
  ['contradictory full/false', 'success', 'full', 'false', true],
  ['missing profile', 'success', undefined, 'false', true],
  ['unknown profile', 'success', 'unknown', 'false', true],
  ['uppercase FALSE', 'success', 'documentation', 'FALSE', true],
  ['mixed FaLsE', 'success', 'documentation', 'FaLsE', true],
  ['uppercase profile', 'success', 'DOCUMENTATION', 'false', true],
  ['whitespace', 'success', 'documentation', 'false ', true],
  ['failed detector', 'failure', 'documentation', 'false', true],
  ['skipped detector', 'skipped', 'documentation', 'false', true],
  ['missing detector result', undefined, 'documentation', 'false', true],
  ['missing outputs', 'success', undefined, undefined, true],
  ['missing regression output', 'success', 'documentation', undefined, true],
  ['unexpected regression output', 'success', 'documentation', 'unknown', true],
]) test(`R1 actual workflow selection and Actions expressions: ${name}`, t => {
  const workflow = readFileSync('.github/workflows/tests.yml', 'utf8');
  const blocks = [...workflow.slice(workflow.indexOf('jobs:\n')).matchAll(/^  ([a-z][a-z0-9-]*):\n([\s\S]*?)(?=^  [a-z][a-z0-9-]*:\n|$(?![\s\S]))/gm)];
  const folder = mkdtempSync(path.join(tmpdir(), 'ci-selection-'));
  t.after(() => rmSync(folder, {recursive: true, force: true}));
  let checked = 0;
  for (const [, id, block] of blocks) {
    const steps = block.split(/^      - /m).slice(1);
    if (!steps[0]?.startsWith('name: Validate detector outputs and select regressions')) continue;
    checked++;
    const context = {needs: {changes: {result, outputs: {profile, regressions}}}};
    assert.equal(evaluateActions('${{ env.value == \'false\' }}', {env: {value: 'FaLsE'}}).value, true,
      'The official evaluator must reproduce case-insensitive Actions comparison');
    const selector = steps.shift();
    const envFile = path.join(folder, id);
    const env = {...process.env, GITHUB_ENV: envFile};
    for (const match of selector.matchAll(/^          (DETECTOR_[A-Z]+): (\$\{\{.*\}\})$/gm)) {
      env[match[1]] = evaluateActions(match[2], context).coerceString();
    }
    const script = selector.split('        run: |\n')[1].split('\n').map(line => line.slice(10)).join('\n');
    execFileSync('bash', ['-e', '-c', script], {env}); // Execute the real YAML selection, without checkout.
    assert.equal(readFileSync(envFile, 'utf8'), `RUN_REGRESSIONS=${expected}\n`, id);
    context.env = {RUN_REGRESSIONS: /^RUN_REGRESSIONS=(true|false)\n$/.exec(readFileSync(envFile, 'utf8'))[1]};
    assert.equal(evaluateActions(/^    if: (.+)$/m.exec(block)[1], context, {cancelled: true}).value, false);
    for (const step of steps) {
      const expression = /^\s*if: (.+)$/m.exec(step)?.[1];
      if (!expression) { assert.equal(id, 'deployment'); continue; } // Packaging always runs.
      const omitted = step.startsWith('name: Record deliberately omitted');
      const failing = expression.includes('failure()');
      assert.equal(evaluateActions(expression, context).value, failing ? false : omitted ? !expected : expected, `${id}: ${expression}`);
      if (failing) assert.equal(evaluateActions(expression, context, {failure: true, success: false}).value, expected);
    }
  }
  assert.equal(checked, 6, 'All six conditional jobs, including the static WebKit matrix, exercised');
});

test('R2 CLI: GITHUB_SHA is the expected synthetic merge, and is mandatory', t => {
  const r = repository(t); r.git('checkout', '-b', 'pr'); r.write('README.md', 'docs'); const head = r.commit();
  const merge = r.merge(r.base, head), eventFile = path.join(r.cwd, '.git', 'event.json');
  writeFileSync(eventFile, JSON.stringify({pull_request: {base: {sha: r.base}, head: {sha: head}}}));
  for (const [sha, expected] of [[merge, 'documentation'], [undefined, 'full'], ['invalid', 'full'], [head, 'full']]) {
    const env = {...process.env, GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: eventFile};
    delete env.GITHUB_OUTPUT; delete env.GITHUB_STEP_SUMMARY; delete env.GITHUB_SHA;
    if (sha !== undefined) env.GITHUB_SHA = sha;
    const actual = JSON.parse(execFileSync(process.execPath, [path.resolve('scripts/ci-changes.mjs')], {cwd: r.cwd, env, encoding: 'utf8'}));
    assert.equal(actual.profile, expected);
  }
});
