import test from 'node:test';
import assert from 'node:assert/strict';
import {clueComposition} from '../../scripts/lib/b2-diagnostics.mjs';

const count=(fromHour,toHour,count,distance=0)=>({type:'countDistanceToPlace',fromHour,toHour,count,distance,placeId:'place'});
test('composition counts occurrences once and uses every existing presentation identifier',()=>{
 const clues=[count(0,0,0),count(0,0,1),count(0,6,0),count(1,6,1),count(1,6,2),
  ...['position','direction','turn','distanceToPlace','distanceBetweenHours'].map(type=>({type}))];
 const before=structuredClone(clues),report=clueComposition(clues);
 assert.equal(report.totalClues,10);
 assert.deepEqual(report.byType,{countDistanceToPlace:5,direction:1,distanceBetweenHours:1,distanceToPlace:1,position:1,turn:1});
 assert.deepEqual(report.byPresentationForm,{CountDistanceNever:1,HasDistanceAt:1,NotDistanceAt:1,countDistanceToPlace:2,
  direction:1,distanceBetweenHours:1,distanceToPlace:1,position:1,turn:1});
 assert.deepEqual(report.crossTable.counts.countDistanceToPlace,{CountDistanceNever:1,HasDistanceAt:1,NotDistanceAt:1,
  countDistanceToPlace:2,direction:0,distanceBetweenHours:0,distanceToPlace:0,position:0,turn:0});
 assert.equal(report.percentByType.countDistanceToPlace,50);
 assert.equal(report.percentByPresentationForm.NotDistanceAt,10);
 for(const type of ['direction','distanceBetweenHours','distanceToPlace','position','turn']){
  assert.equal(report.crossTable.counts[type][type],1);
  assert.equal(Object.values(report.crossTable.counts[type]).reduce((a,b)=>a+b,0),1);
 }
 assert.deepEqual(report.crossTable.rowTotals,report.byType);
 assert.deepEqual(report.crossTable.columnTotals,report.byPresentationForm);
 assert.equal(report.crossTable.total,10);
 assert.deepEqual(clueComposition([...clues].reverse()),report);
 assert.deepEqual(clues,before);
});
test('identical parameters are occurrences, not distinct-clue or candidate-form counters',()=>{
 const clue=count(1,6,2),report=clueComposition([clue,{...clue}]);
 assert.equal(report.totalClues,2);assert.equal(report.byType.countDistanceToPlace,2);
 assert.equal(report.crossTable.counts.countDistanceToPlace.countDistanceToPlace,2);
});
test('empty populations have zero totals and unknown types are not invented report categories',()=>{
 assert.deepEqual(clueComposition([]),{totalClues:0,byType:{},byPresentationForm:{},percentByType:{},percentByPresentationForm:{},
  crossTable:{types:[],forms:[],counts:{},rowTotals:{},columnTotals:{},total:0}});
 assert.throws(()=>clueComposition([{type:'invented'}]),/unknown logical clue type/);
});
