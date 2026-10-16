import test from 'node:test';
import assert from 'node:assert/strict';
import {referencePuzzle} from '../../puzzles/reference-3.6.mjs';
import {restoreState} from '../../src/persistence/storage.mjs';
import {initialState} from '../../src/state/game-state.mjs';

test('blocked land annotations persist, without making blocked route or distance origins legal',()=>{
 const state=initialState(referencePuzzle);
 state.marks={'1:B3':'maybe','2:C3':'yes','3:E2':'no','1:E3':'yes'};
 const restored=restoreState(referencePuzzle,JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.marks,state.marks);
 const invalidOrigin={...state,distanceMode:true,distanceOrigin:'B3'};
 assert.equal(restoreState(referencePuzzle,invalidOrigin).distanceOrigin,null);
 const invalidRoute={...state,route:['D4','B3']};
 assert.deepEqual(restoreState(referencePuzzle,invalidRoute).route,['D4']);
});
