// Historical evidence binds the program used at construction. A later optional
// clue-production policy may change that source hash without changing the
// historical definition, proofs, traces or public bytes. Verify BOTH hashes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

export function assertHistoricalEvidence(storedBytes,currentBytes){
 const stored=JSON.parse(storedBytes),current=JSON.parse(currentBytes);
 const ref='scripts/lib/puzzle-clues.mjs';
 const old=stored.inputs.find(i=>i.path===ref),now=current.inputs.find(i=>i.path===ref);
 assert.ok(old&&now);
 assert.equal(old.sha256,sha256(execFileSync('git',['show',stored.baseCommit+':'+ref],{cwd:ROOT})));
 assert.equal(now.sha256,sha256(fs.readFileSync(path.join(ROOT,ref))));
 // This is the only allowed provenance difference. All mathematical evidence,
 // public-file hashes and other source hashes must still match byte-for-byte.
 now.sha256=old.sha256;
 assert.equal(JSON.stringify(current,null,2)+'\n',storedBytes);
}
