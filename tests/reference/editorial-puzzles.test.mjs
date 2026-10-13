import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
for(const [id,legalRouteCount] of [['quittung-nombreo',521],['ankerbuch-tesoro',209]]){
 test(`${id}: independent enumeration agrees with authored route and preserves editorial content`,()=>{
  const d=JSON.parse(fs.readFileSync(new URL(`../../puzzles/${id}.json`,import.meta.url)));
  const independent=solvePuzzle(d.logic),p=compilePuzzle(d);
  assert.equal(independent.legalRouteCount,legalRouteCount);
  assert.equal(independent.count,1);assert.deepEqual(independent.solutions,[d.solution]);
  assert.deepEqual(p.resultTexts,d.resultTexts);assert.deepEqual(p.intro,d.presentation.intro);
  assert.deepEqual(p.hints,d.presentation.hints);assert.deepEqual(p.overlays,d.presentation.overlays);
  assert.deepEqual(p.clues.map(c=>c.text),d.logic.clues.map(c=>d.presentation.clues[c.id]));
  assert.equal(d.metadata.kind,'editorial');
 });
}
