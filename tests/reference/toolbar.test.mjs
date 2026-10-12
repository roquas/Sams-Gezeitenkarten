import test from 'node:test';
import assert from 'node:assert/strict';
import {hourEdge} from '../../src/ui/toolbar.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
test('hour edges rotate around the same hex in six distinct positions',()=>{
 const edges=Array.from({length:6},(_,i)=>hourEdge(i+1));
 assert.equal(new Set(edges.map(e=>JSON.stringify(e))).size,6);
 for(const e of edges){assert.ok(Math.abs(Math.hypot(e.x1-16,e.y1-16)-14)<1e-10);assert.ok(Math.abs(Math.hypot(e.x2-16,e.y2-16)-14)<1e-10);}
});
test('verification readiness requires six legal segments, independently of clue success',()=>{
 const rules=createRules(puzzle);
 assert.equal(rules.legal(puzzle.solution),true);
 assert.equal(rules.legal(puzzle.solution.slice(0,-1)),false);
 assert.equal(rules.legal(['D4','E3','D2','C2','B2','B1','B2']),false);
 assert.equal(rules.legal(['D4','E3','E2','C2','B2','B1','A1']),false);
 const other=[...rules.routes()].find(r=>r.join()!==puzzle.solution.join());
 assert.equal(rules.legal(other),true);assert.equal(puzzle.clues.every(c=>rules.matches(other,c)),false);
});
