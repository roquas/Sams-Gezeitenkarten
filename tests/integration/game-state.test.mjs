import {test} from 'node:test';
import assert from 'node:assert/strict';
import {puzzle} from '../fixtures/model/state.mjs';
import {initialState,createHistory} from '../../src/state/game-state.mjs';
import {restoreState,loadState,saveState,storageKey} from '../../src/persistence/storage.mjs';
test('undo preserves current display, navigation and paid hint after an older edit',()=>{
 const history=createHistory(),state=initialState(puzzle);history.push(state);
 state.marks['1:A1']='maybe';
 Object.assign(state,{layer:3,tool:'route',showRouteNumbers:true,hideRouteMarks:true,distanceMode:true,distanceOrigin:'A2',hiddenHours:[2],penalty:10,hintPenalty:10,hintCount:1,help:'hint'});
 const undone=history.undo(state);
 assert.deepEqual(undone.marks,{});
 for(const key of ['layer','tool','showRouteNumbers','hideRouteMarks','distanceMode','distanceOrigin','hiddenHours','penalty','hintCount','help'])assert.deepEqual(undone[key],state[key]);
});
test('undo restores edits and note-check cost, while retaining later hint cost',()=>{
 const history=createHistory();let state=initialState(puzzle);
 history.push(state);state.route.push('E3');state.doneClues.push('I');
 history.push(state);state.penalty+=5;
 state.penalty+=10;state.hintPenalty+=10;state.hintCount++;
 state=history.undo(state);assert.equal(state.penalty,10);assert.deepEqual(state.route,['D4','E3']);
 state=history.undo(state);assert.equal(state.penalty,10);assert.deepEqual(state.route,['D4']);assert.deepEqual(state.doneClues,[]);
 history.clear();assert.equal(history.undo(state),state);
});
test('persisted invalid routes safely reset instead of crashing rendering',()=>{
 for(const route of [null,[],['D4','B3'],['D4','A1'],['D4','E3','D4'],['D4','Z9']])assert.deepEqual(restoreState(puzzle,{route}),initialState(puzzle));
});
test('restore sanitizes notes, settings and transient HTML',()=>{
 const state=restoreState(puzzle,{route:['D4'],layer:0,tool:'unknown',marks:{'0:A1':'yes','1:B3':'yes','2:A1':'maybe','3:E3':'bad'},hiddenHours:[0,1,1,7],doneClues:['I','bad'],help:'<img onerror=bad>',result:'<script>bad</script>'});
 assert.equal(state.layer,1);assert.equal(state.tool,'maybe');assert.deepEqual(state.marks,{'2:A1':'maybe'}); // Blocked land is measurement-only.
 assert.deepEqual(state.hiddenHours,[1]);assert.deepEqual(state.doneClues,['I']);assert.equal(state.help,'');assert.equal(state.result,'');
});
test('storage is isolated per puzzle, reloads without history and tolerates unavailable storage',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const state=initialState(puzzle);state.marks['2:A1']='yes';assert.equal(saveState(puzzle,state,storage),true);
 assert.deepEqual(loadState(puzzle,storage).marks,state.marks);assert.equal(data.has('gezeitenkarten-fall5-v1'),false);
 assert.equal(storageKey({...puzzle,id:'other'}),'gezeitenkarten-other-schema2-data1');
 assert.deepEqual(loadState(puzzle,undefined),initialState(puzzle));assert.equal(saveState(puzzle,state,undefined),false);
 storage.setItem(storageKey(puzzle),'{');assert.deepEqual(loadState(puzzle,storage),initialState(puzzle));
});
