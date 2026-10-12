import test from 'node:test';
import assert from 'node:assert/strict';
import {referencePuzzle} from '../../puzzles/reference-3.6.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {distance,direction} from '../../src/engine/hex.mjs';
import {blocked,solution,solutions as referenceSolutions,routes as referenceRoutes} from './reference-rules.mjs';
test('data definition reproduces archived map and solution',()=>{
 const rules=createRules(referencePuzzle);
 assert.deepEqual([...rules.blocked],[...blocked]);
 assert.equal([...rules.routes()].length,referenceRoutes().length);
 assert.deepEqual(rules.solutions(),referenceSolutions());
 assert.deepEqual(referencePuzzle.solution,solution);
 assert.ok(referencePuzzle.clues.every(clue=>rules.matches(solution,clue)));
});
test('geometry matches archived known cases',()=>{
 assert.equal(distance('B3','C3'),1);
 assert.equal(direction('D4','E3'),'NE');
 assert.equal(direction('E3','D2'),'NW');
});
test('blocked cells and place coast are supplied by puzzle data',()=>{
 const altered={...referencePuzzle,blocked:['A1'],places:{...referencePuzzle.places,tesoro:{...referencePuzzle.places.tesoro,cells:['A1']}}};
 const rules=createRules(altered);
 assert.equal(rules.blocked.has('B3'),false);
 assert.equal(rules.blocked.has('A1'),true);
 assert.equal(rules.coast('B1','tesoro'),true);
 assert.equal(rules.coast('A1','tesoro'),false);
 assert.equal(rules.legal(solution),false);
});
