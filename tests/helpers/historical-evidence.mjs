// Historical evidence binds the program used at construction. A later optional
// clue-production policy or presentation metadata may change source hashes
// without changing definitions, proofs, traces or public bytes. Verify BOTH hashes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

export function assertHistoricalEvidence(storedBytes,currentBytes){
 const stored=JSON.parse(storedBytes),current=JSON.parse(currentBytes);
 // Explicitly allow the optional A2b presentation contract alongside the
 // existing clue-production policy. Verify both historical and live hashes;
 // mathematical evidence and public-file bytes must still match in full.
 for(const ref of ['scripts/lib/puzzle-clues.mjs','src/puzzles/schema.mjs','src/puzzles/public.mjs','src/puzzles/validate.mjs']){
  const old=stored.inputs.find(i=>i.path===ref),now=current.inputs.find(i=>i.path===ref);
  assert.ok(old&&now);
  assert.equal(old.sha256,sha256(execFileSync('git',['show',stored.baseCommit+':'+ref],{cwd:ROOT})));
  assert.equal(now.sha256,sha256(fs.readFileSync(path.join(ROOT,ref))));
  now.sha256=old.sha256;
 }
 assert.equal(JSON.stringify(current,null,2)+'\n',storedBytes);
}
