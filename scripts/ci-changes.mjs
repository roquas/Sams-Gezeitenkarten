// Fail-closed CI policy. No dependencies and no GitHub API pagination/300-file limit.
import {execFileSync} from 'node:child_process';
import {appendFileSync, readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Reviewed F01-only leaf files: imports flow FROM here into shared code, never back.
// Future F02 files need an explicit dependency review before joining this list.
export const OFFLINE_FLAVOR = new Set([
  'scripts/lib/flavor-contract.mjs',
  'tests/contracts/flavor.test.mjs',
  'tests/fixtures/flavor/public.mjs',
]);
const documentation = path => path === 'README.md' || (path.endsWith('.md') && /^docs\/[A-Za-z0-9_-]+\.md$/.test(path));
const full = reason => ({profile: 'full', regressions: true, reason});

export function classifyChanges(changes) {
  if (!Array.isArray(changes) || changes.length === 0) return full('No complete, nonempty diff');
  let offline = false;
  for (const change of changes) {
    // Raw Git records retain both modes; type changes, symlinks and executables
    // cannot masquerade as documentation. Renames are deletion + addition.
    if (!change || !['A', 'M', 'D'].includes(change.status) ||
        !['000000', '100644'].includes(change.oldMode) ||
        !['000000', '100644'].includes(change.newMode) ||
        typeof change.path !== 'string' ||
        (change.status === 'A' && (change.oldMode !== '000000' || change.newMode !== '100644')) ||
        (change.status === 'D' && (change.oldMode !== '100644' || change.newMode !== '000000')) ||
        (change.status === 'M' && (change.oldMode !== '100644' || change.newMode !== '100644'))) return full('Unsupported diff record or file mode');
    if (OFFLINE_FLAVOR.has(change.path)) offline = true;
    else if (!documentation(change.path)) return full(`Runtime, infrastructure or unreviewed path: ${change.path}`);
  }
  return {profile: offline ? 'offline-flavor' : 'documentation', regressions: false,
    reason: offline ? 'Only reviewed offline Flavor leaves and documentation' : 'Only standalone Markdown documentation'};
}

export function parseDiff(raw) {
  // Git's -z format keeps tabs, spaces and newlines in filenames unambiguous.
  const text = new TextDecoder('utf-8', {fatal: true}).decode(raw);
  if (!text.endsWith('\0')) throw Error('Empty or unterminated raw diff');
  const fields = text.slice(0, -1).split('\0');
  if (fields.length % 2) throw Error('Incomplete raw diff');
  const changes = [];
  for (let i = 0; i < fields.length; i += 2) {
    const match = /^:(\d{6}) (\d{6}) [a-f0-9]{40} [a-f0-9]{40} ([A-Z])$/.exec(fields[i]);
    if (!match || !fields[i + 1]) throw Error('Invalid raw diff record');
    changes.push({oldMode: match[1], newMode: match[2], status: match[3], path: fields[i + 1]});
  }
  return changes;
}

const sha = value => typeof value === 'string' && value.length === 40 && /^[a-f0-9]{40}$/.test(value) && !/^0+$/.test(value);
export function detectChanges({eventName, event, commit, cwd = process.cwd()}) {
  if (eventName === 'workflow_dispatch') return full('Manual run always executes full CI');
  try {
    const git = (...args) => execFileSync('git', args, {cwd, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
    let base, head, baseTip, baseChanges = [];
    if (eventName === 'pull_request') {
      base = event.pull_request?.base?.sha;
      head = event.pull_request?.head?.sha;
      if (!sha(base) || !sha(head)) throw Error('Missing PR base/head');
      // pull_request tests checkout refs/pull/<number>/merge, not the PR head.
      // Bind the selected diff to that exact tested merge and its ordered parents.
      if (!sha(commit)) throw Error('Missing or invalid PR merge SHA');
      if (git('rev-parse', '--verify', 'HEAD^{commit}').toString().trim() !== commit) {
        throw Error('Checkout HEAD differs from expected PR merge SHA');
      }
      const parents = git('show', '-s', '--format=%P', commit).toString().trim().split(' ');
      if (parents.length !== 2 || parents[0] !== base || parents[1] !== head) {
        throw Error('PR merge parents differ from event base/head');
      }
      // Match GitHub's PR three-dot diff; exclude unrelated base-branch commits.
      // Multiple merge bases are ambiguous and deliberately fall back to full.
      const bases = git('merge-base', '--all', base, head).toString().trim().split('\n');
      if (bases.length !== 1 || !sha(bases[0])) throw Error('Ambiguous merge base');
      base = bases[0];
      // Tests run on checkout's merge commit. If the base moved since branching,
      // also inspect that side so a shared runtime change cannot be hidden.
      baseTip = event.pull_request.base.sha;
      const rawBase = git('diff', '--raw', '--no-abbrev', '--no-renames', '-z', base, baseTip, '--');
      if (rawBase.length) baseChanges = parseDiff(rawBase);
    } else if (eventName === 'push' && event.ref === 'refs/heads/main') {
      base = event.before;
      head = event.after;
      if (!sha(base) || !sha(head) || head !== commit || event.created || event.deleted || event.forced) {
        throw Error('Incomplete, new, deleted or forced push');
      }
      git('merge-base', '--is-ancestor', base, head);
    } else return full('Unsupported event');
    const changes = parseDiff(git('diff', '--raw', '--no-abbrev', '--no-renames', '-z', base, head, '--'));
    return {...classifyChanges([...changes, ...baseChanges]), base, head, baseTip, changes, baseChanges};
  } catch (error) {
    return full(`Diff unavailable or ambiguous: ${error.message.split('\n')[0]}`);
  }
}

export function summary(result) {
  const state = result.regressions ? 'required (see job results)' : 'not required — deliberately skipped; NOT executed or passed';
  return `## Change-dependent CI\n\nProfile: **${result.profile}**\n\n${result.reason}\n\n` +
    '| Checks | Selection |\n| --- | --- |\n' +
    '| Unit, contracts, content, puzzles, HTTP; catalog history | Always required |\n' +
    '| Package tests; release ZIP validation, creation and static-deployment upload | Always required |\n' +
    `| S02/S03 reproductions; assets; Chromium; WebKit (1–6); deployment browsers | ${state} |\n\n` +
    (result.base ? `Compared: \`${result.base}\` → \`${result.head}\` (renames inspected as deletion + addition).\n\n` : '') +
    (result.baseTip ? `PR base also inspected: \`${result.base}\` → \`${result.baseTip}\`.\n\n` : '') +
    (result.changes ? '<details><summary>Changed files (JSON-escaped)</summary>\n\n```json\n' +
      JSON.stringify({headChanges: result.changes, baseChanges: result.baseChanges}, null, 2) + '\n```\n</details>\n' : 'No reliable file list: full CI.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let result;
  try {
    result = detectChanges({eventName: process.env.GITHUB_EVENT_NAME,
      event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), commit: process.env.GITHUB_SHA});
  } catch (error) { result = full(`Event unavailable: ${error.message}`); }
  // Write the suppression output only after successfully producing the summary.
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,
    `profile=${result.profile}\nregressions=${result.regressions}\n`);
  console.log(JSON.stringify(result, null, 2));
}
