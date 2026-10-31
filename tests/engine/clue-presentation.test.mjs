import test from 'node:test';
import assert from 'node:assert/strict';
import {cluePresentationForm,clueStatistics} from '../../scripts/lib/clue-presentation.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';

const map={objects:[{id:'coast',cells:['B2','C2']}]};
const count=(fromHour,toHour,count,distance=2)=>({id:'H1',type:'countDistanceToPlace',fromHour,toHour,count,placeId:'coast',distance});
for(const [clue,form,text] of [
 [count(3,3,0),'NotDistanceAt','In Stunde 3 beträgt der Hexabstand zu Ort coast (B2, C2) nicht genau 2.'],
 [count(3,3,1),'HasDistanceAt','In Stunde 3 beträgt der Hexabstand zu Ort coast (B2, C2) genau 2.'],
 [count(2,5,0),'CountDistanceNever','In den Stunden 2 bis 5 (beide einschließlich) beträgt der Hexabstand zu Ort coast (B2, C2) niemals genau 2.'],
 [count(2,5,1),'countDistanceToPlace','In den Stunden 2 bis 5 (beide einschließlich) beträgt der Hexabstand zu Ort coast (B2, C2) in genau 1 Stunden genau 2.'],
 [count(2,5,3),'countDistanceToPlace','In den Stunden 2 bis 5 (beide einschließlich) beträgt der Hexabstand zu Ort coast (B2, C2) in genau 3 Stunden genau 2.'],
 [count(0,0,0,0),'NotDistanceAt','In Stunde 0 beträgt der Hexabstand zu Ort coast (B2, C2) nicht genau 0.'],
 [count(0,0,1,0),'HasDistanceAt','In Stunde 0 beträgt der Hexabstand zu Ort coast (B2, C2) genau 0.'],
 [count(0,6,0,0),'CountDistanceNever','In den Stunden 0 bis 6 (beide einschließlich) beträgt der Hexabstand zu Ort coast (B2, C2) niemals genau 0.']
])test(`derived ${form}: hours ${clue.fromHour}-${clue.toHour}, count ${clue.count}, distance ${clue.distance}`,()=>{
 const before=structuredClone(clue);
 assert.equal(cluePresentationForm(clue),form);assert.equal(cluePresentationForm(clue),form);
 assert.equal(technicalClueText(clue,map),text);assert.deepEqual(clue,before);
});

test('other logical types keep their presentation form',()=>{
 for(const type of ['position','direction','turn','distanceToPlace','distanceBetweenHours'])assert.equal(cluePresentationForm({type}),type);
});

test('S01 presentation statistics derive from historical clues without migrating artifacts or identities',()=>{
 const source=readPlaytestSource(),before=structuredClone(source);
 const clues=source.rows.flatMap(row=>row.definition.logic.clues),stats=clueStatistics(clues);
 assert.equal(stats.byType.countDistanceToPlace,306);
 assert.deepEqual(['countDistanceToPlace','CountDistanceNever','HasDistanceAt','NotDistanceAt'].map(k=>stats.byPresentationForm[k]),[210,57,23,16]);
 assert.equal(Object.values(stats.byType).reduce((a,b)=>a+b,0),clues.length);
 assert.equal(Object.values(stats.byPresentationForm).reduce((a,b)=>a+b,0),clues.length);
 for(const [type,n] of Object.entries(stats.byType)){
  assert.equal(type==='countDistanceToPlace'?
   ['countDistanceToPlace','CountDistanceNever','HasDistanceAt','NotDistanceAt'].reduce((sum,k)=>sum+stats.byPresentationForm[k],0):stats.byPresentationForm[type],n);
 }
 for(const row of source.rows){
  assert.equal(row.properties.cluePresentationForms,undefined,'historical rows have no derived fields');
  for(const clue of row.definition.logic.clues)technicalClueText(clue,row.definition.logic.map);
  assert.deepEqual(logicalFingerprints(row.definition),row.fingerprints);
 }
 assert.deepEqual(source,before);
});

test('different forms of one logical type count once each within a candidate',()=>{
 const clues=[count(0,0,0),count(1,1,1),count(2,5,0),count(2,5,1),count(2,5,2)];
 assert.deepEqual(clueStatistics(clues),{byType:{countDistanceToPlace:5},
  byPresentationForm:{NotDistanceAt:1,HasDistanceAt:1,CountDistanceNever:1,countDistanceToPlace:2}});
 assert.deepEqual(clueStatistics([]),{byType:{},byPresentationForm:{}});
});
