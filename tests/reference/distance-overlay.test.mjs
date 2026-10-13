import test from 'node:test';
import assert from 'node:assert/strict';
import {distancePhase,toggleDistance,chooseDistanceOrigin,selectChartTool} from '../../src/state/distance-overlay.mjs';
import {initialState,createHistory} from '../../src/state/game-state.mjs';
import {restoreState,loadState,saveState} from '../../src/persistence/storage.mjs';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
test('distance overlay survives every editing tool without altering notes or route',()=>{
 let s=chooseDistanceOrigin(toggleDistance(initialState(puzzle)),'C1');
 for(const tool of ['maybe','yes','no','erase','clearAll','route']){
  s=selectChartTool(s,tool);assert.equal(distancePhase(s),'showing');assert.equal(s.distanceOrigin,'C1');assert.equal(s.tool,tool);
  assert.deepEqual(s.marks,{});assert.deepEqual(s.route,[puzzle.start]);
 }
});
test('origin selection keeps the previous overlay until replaced; second radar press turns it off',()=>{
 let s=chooseDistanceOrigin(toggleDistance(initialState(puzzle)),'C1');
 const previous=structuredClone(s);s=toggleDistance(s);assert.equal(distancePhase(s),'waiting');assert.equal(s.distanceOrigin,'C1');assert.equal(previous.distanceSelecting,false);
 s=chooseDistanceOrigin(s,'A1');assert.equal(distancePhase(s),'showing');assert.equal(s.distanceOrigin,'A1');
 s=toggleDistance(toggleDistance(s));assert.equal(distancePhase(s),'inactive');assert.equal(s.distanceOrigin,null);
});
test('choosing an edit tool cancels pending origin selection and retains any existing overlay',()=>{
 let s=selectChartTool(toggleDistance(initialState(puzzle)),'yes');assert.equal(distancePhase(s),'inactive');
 s=chooseDistanceOrigin(toggleDistance(s),'C1');s=selectChartTool(toggleDistance(s),'erase');assert.equal(distancePhase(s),'showing');assert.equal(s.distanceOrigin,'C1');
});
test('undo and reload preserve an independent overlay; pending reselection is transient',()=>{
 let s=chooseDistanceOrigin(toggleDistance(initialState(puzzle)),'C1');const h=createHistory();h.push(s);s.marks['1:A1']='maybe';s=toggleDistance(s);
 s=h.undo(s);assert.equal(distancePhase(s),'waiting');assert.equal(s.distanceOrigin,'C1');assert.deepEqual(s.marks,{});
 s=restoreState(puzzle,s);assert.equal(distancePhase(s),'showing');assert.equal(s.distanceSelecting,false);assert.equal(s.distanceOrigin,'C1');
});
test('reset and another puzzle storage key start with no origin or overlay',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 saveState(puzzle,chooseDistanceOrigin(toggleDistance(initialState(puzzle)),'C1'),storage);
 for(const s of [initialState(puzzle),loadState({...puzzle,id:'other-puzzle'},storage)]){assert.equal(distancePhase(s),'inactive');assert.equal(s.distanceOrigin,null);}
 const invalid=restoreState(puzzle,{...initialState(puzzle),distanceMode:true,distanceOrigin:'B3'});assert.equal(invalid.distanceOrigin,null);
});
