import test from 'node:test';
import assert from 'node:assert/strict';
import {cluePresentationForm,clueStatistics} from '../../scripts/lib/clue-presentation.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {logic as fixtureLogic} from '../fixtures/model/factories.mjs';

const map={objects:[{id:'coast',cells:['B2','C2']}]};
const count=(fromHour,toHour,count,distance=2)=>({id:'H1',type:'countDistanceToPlace',fromHour,toHour,count,placeId:'coast',distance});
for(const [clue,form,text] of [
 [count(3,3,0),'NotDistanceAt','In Stunde 3 war das Schiff nicht genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(3,3,1),'HasDistanceAt','In Stunde 3 war das Schiff genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(2,5,0),'CountDistanceNever','Von Stunde 2 bis Stunde 5 war das Schiff nie genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(2,5,1),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff genau einmal genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(2,5,2),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff genau zweimal genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(2,5,3),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff genau dreimal genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(2,5,4),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff in jeder Stunde genau 2 Hexfelder von dem Ort coast (B2, C2) entfernt.'],
 [count(3,3,0,0),'NotDistanceAt','In Stunde 3 war das Schiff nicht auf dem Ort coast (B2, C2).'],
 [count(3,3,1,0),'HasDistanceAt','In Stunde 3 war das Schiff auf dem Ort coast (B2, C2).'],
 [count(3,3,0,1),'NotDistanceAt','In Stunde 3 war das Schiff nicht neben dem Ort coast (B2, C2).'],
 [count(3,3,1,1),'HasDistanceAt','In Stunde 3 war das Schiff neben dem Ort coast (B2, C2).'],
 [count(0,0,0,0),'NotDistanceAt','In Stunde 0 war das Schiff nicht auf dem Ort coast (B2, C2).'],
 [count(0,0,1,0),'HasDistanceAt','In Stunde 0 war das Schiff auf dem Ort coast (B2, C2).'],
 [count(0,6,0,0),'CountDistanceNever','Von Stunde 0 bis Stunde 6 war das Schiff nie auf dem Ort coast (B2, C2).'],
 [count(2,5,0,1),'CountDistanceNever','Von Stunde 2 bis Stunde 5 war das Schiff nie neben dem Ort coast (B2, C2).'],
 [count(2,5,4,0),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff in jeder Stunde auf dem Ort coast (B2, C2).'],
 [count(2,5,4,1),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff in jeder Stunde neben dem Ort coast (B2, C2).'],
 [count(2,5,1,0),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff genau einmal auf dem Ort coast (B2, C2).'],
 [count(2,5,2,1),'countDistanceToPlace','Von Stunde 2 bis Stunde 5 war das Schiff genau zweimal neben dem Ort coast (B2, C2).'],
 [count(0,6,7,1),'countDistanceToPlace','Von Stunde 0 bis Stunde 6 war das Schiff in jeder Stunde neben dem Ort coast (B2, C2).']
])test(`derived ${form}: hours ${clue.fromHour}-${clue.toHour}, count ${clue.count}, distance ${clue.distance}`,()=>{
 const before=structuredClone(clue);
 assert.equal(cluePresentationForm(clue),form);
 assert.equal(technicalClueText(clue,map),text);assert.deepEqual(clue,before);
});

test('larger partial counts use natural number words',()=>{
 for(const [n,word] of [[4,'viermal'],[5,'fünfmal'],[6,'sechsmal']])
  assert.equal(technicalClueText(count(0,6,n,1),map),`Von Stunde 0 bis Stunde 6 war das Schiff genau ${word} neben dem Ort coast (B2, C2).`);
});

test('formatting preserves minimum distance to all cells of a multihex object and inclusive hour zero',()=>{
 const logic={...fixtureLogic(),steps:2,clues:[]},rules=createRules(logic),route=['C3','D3','E3'];
 assert.ok(rules.legal(route));
 assert.equal(rules.distanceToPlace('D3','port'),0,'second object cell is on the place');
 assert.equal(rules.distanceToPlace('E3','port'),1,'distance is measured to the nearest object cell');
 for(const [distance,n,phrase] of [[0,2,'genau zweimal auf dem'],[1,1,'genau einmal neben dem']]){
  const clue={...count(0,2,n,distance),placeId:'port'},before=structuredClone(clue);
  validateLogic({...logic,clues:[clue]});
  assert.ok(rules.matches(route,clue));
  assert.equal(technicalClueText(clue,logic.map),`Von Stunde 0 bis Stunde 2 war das Schiff ${phrase} Ort port (C3, D3).`);
  assert.deepEqual(clue,before);assert.ok(rules.matches(route,clue));
 }
});

test('invalid counts and reversed intervals still fail the existing validation contract',()=>{
 const logic=fixtureLogic();
 for(const clue of [count(1,1,2),count(0,1,3),count(1,0,0)])
  assert.throws(()=>validateLogic({...logic,clues:[{...clue,placeId:'port'}]}),/count exceeds inclusive interval|reversed hour interval/);
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
