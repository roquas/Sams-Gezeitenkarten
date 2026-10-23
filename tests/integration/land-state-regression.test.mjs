import test from 'node:test';
import assert from 'node:assert/strict';
import {puzzle as referencePuzzle} from '../fixtures/model/state.mjs';
import {restoreState} from '../../src/persistence/storage.mjs';
import {initialState} from '../../src/state/game-state.mjs';

test('land cells are valid distance origins but invalid for marking or navigation',()=>{
 const state=initialState(referencePuzzle);
 state.marks={'1:B3':'maybe','2:C3':'yes','3:E2':'no','1:E3':'yes'};
 const restored=restoreState(referencePuzzle,JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.marks,{'1:E3':'yes'});
 const distanceOrigin={...state,distanceMode:true,distanceOrigin:'B3'};
 const reloaded=restoreState(referencePuzzle,distanceOrigin);
 assert.equal(reloaded.distanceMode,true);
 assert.equal(reloaded.distanceOrigin,'B3');
 const invalidRoute={...state,route:['D4','B3']};
 assert.deepEqual(restoreState(referencePuzzle,invalidRoute).route,['D4']);
 const invalidOrigin={...state,distanceMode:true,distanceOrigin:'Z9'};
 assert.equal(restoreState(referencePuzzle,invalidOrigin).distanceOrigin,null);
});
