import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cellsOf,axial,adjacent,distance,direction,directions} from '../../src/engine/hex.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {puzzleSchema} from '../../src/puzzles/schema.mjs';
import {validatePuzzle} from '../../src/puzzles/validate.mjs';
import * as archived from './reference-rules.mjs';

const reference=JSON.parse(readFileSync(new URL('../../puzzles/reference-3.6.json',import.meta.url)));
// In-memory schema fixtures only; no new playable or published puzzle.
function documentFor(overrides={}){
 const logic={grid:{columns:5,rows:5},start:'D4',steps:6,blocked:[],
  places:{beacon:{kind:'lighthouse',cells:['A1']}},
  clues:[{id:'C',type:'position',hour:0,cell:'D4'}],...overrides};
 return {schemaVersion:1,dataVersion:1,id:'rules-contract',logic,presentation:{
  title:'Contract fixture',intro:['Schema validation, not a uniqueness claim.'],
  places:Object.fromEntries(Object.keys(logic.places).map(id=>[id,id])),
  clues:Object.fromEntries(logic.clues.map(c=>[c.id,c.id])),hints:[],background:'meer-pergament',overlays:[]
 }};
}
const withClue=clue=>documentFor({clues:[{id:'C',...clue}]});

test('gezeitenkarten-1 geometry agrees with the independent archive for all 625 cell pairs',()=>{
 assert.deepEqual(cellsOf({columns:5,rows:5}),archived.cells);
 assert.deepEqual(directions,archived.directions);
 for(const a of archived.cells){
  assert.deepEqual(axial(a),archived.axial(a),a);
  for(const b of archived.cells){
   assert.equal(distance(a,b),archived.distance(a,b),`${a}, ${b}`);
   assert.equal(adjacent(a,b),archived.neighbors(a,b),`${a}, ${b}`);
   assert.equal(direction(a,b),archived.direction(a,b),`${a}, ${b}`);
  }
 }
});

test('gezeitenkarten-1 keeps the 5x5 schema and accepts every supported route length',()=>{
 for(let steps=1;steps<=6;steps++){
  const d=documentFor({steps});
  validatePuzzle(d);
  assert.equal(createRules(d.logic).legal(archived.solution.slice(0,steps+1)),true);
 }
 for(const overrides of [{steps:0},{grid:{columns:4,rows:5}},{grid:{columns:5,rows:6}}]){
  assert.throws(()=>validatePuzzle(documentFor(overrides)),/Rätsel/);
 }
});

test('route legality also rejects another start, an off-board cell, a jump and an extra step',()=>{
 const rules=createRules(reference.logic),route=archived.solution;
 for(const invalid of [
  ['A5',...route.slice(1)],
  [...route.slice(0,-1),'A0'],
  [route[0],'A1',...route.slice(2)],
  [...route,'A2']
 ])assert.equal(rules.legal(invalid),false,invalid.join(' -> '));
});

test('gezeitenkarten-1 exposes exactly the seven existing clue types',()=>{
 assert.deepEqual(puzzleSchema.properties.logic.properties.clues.items.oneOf.map(s=>s.properties.type.const).sort(),
  ['adjacentToPlace','countAdjacentToPlace','direction','distanceBetweenHours','distanceToPlace','position','turn']);
});

test('clue parameter boundaries include hour zero, both distance limits and singleton intervals',()=>{
 const valid=[
  {type:'position',hour:0,cell:'A1'},{type:'position',hour:6,cell:'E5'},
  ...directions.map(direction=>({type:'direction',hour:1,direction})),
  {type:'direction',hour:6,direction:'NE'},
  ...[-180,-120,-60,0,60,120,180].map(degrees=>({type:'turn',hour:2,degrees})),
  {type:'turn',hour:6,degrees:0},
  {type:'adjacentToPlace',hour:0,place:'beacon'},{type:'adjacentToPlace',hour:6,place:'beacon'},
  {type:'distanceToPlace',hour:0,place:'beacon',distance:0},{type:'distanceToPlace',hour:6,place:'beacon',distance:8},
  {type:'distanceBetweenHours',hours:[0,0],distance:0},{type:'distanceBetweenHours',hours:[0,6],distance:8},
  {type:'countAdjacentToPlace',hours:[0,0],place:'beacon',count:0},
  {type:'countAdjacentToPlace',hours:[0,6],place:'beacon',count:7}
 ];
 // Validation accepts syntax/references, even when a clue cannot be satisfied on this map.
 for(const clue of valid)assert.doesNotThrow(()=>validatePuzzle(withClue(clue)),JSON.stringify(clue));
 const invalid=[
  {type:'position',hour:-1,cell:'A1'},{type:'position',hour:1,cell:'F1'},
  {type:'direction',hour:1,direction:'N'},{type:'turn',hour:1,degrees:0},
  ...[-1,.5,9].map(distance=>({type:'distanceToPlace',hour:1,place:'beacon',distance})),
  ...[-1,.5,9].map(distance=>({type:'distanceBetweenHours',hours:[0,1],distance})),
  {type:'distanceBetweenHours',hours:[0],distance:0},{type:'distanceBetweenHours',hours:[0,1,2],distance:1},
  ...[-1,.5,8].map(count=>({type:'countAdjacentToPlace',hours:[0,6],place:'beacon',count})),
  {type:'countAdjacentToPlace',hours:[2,2],place:'beacon',count:2}
 ];
 for(const clue of invalid)assert.throws(()=>validatePuzzle(withClue(clue)),/Rätsel/,JSON.stringify(clue));
});

test('every clue type is bounded by the actual number of steps, not just the schema maximum',()=>{
 const clues=[
  {type:'position',hour:2,cell:'A1'},{type:'direction',hour:2,direction:'E'},
  {type:'turn',hour:2,degrees:0},{type:'adjacentToPlace',hour:2,place:'beacon'},
  {type:'distanceToPlace',hour:2,place:'beacon',distance:1},
  {type:'distanceBetweenHours',hours:[0,2],distance:1},
  {type:'countAdjacentToPlace',hours:[0,2],place:'beacon',count:1}
 ];
 for(const clue of clues)assert.throws(()=>validatePuzzle(documentFor({steps:1,clues:[{id:'C',...clue}]})),/Stunde überschreitet/);
});

test('place kinds validate passability without changing blocked cells',()=>{
 for(const kind of ['lighthouse','reef','wreck','landmark']){
  validatePuzzle(documentFor({places:{beacon:{kind,cells:['A1']}}}));
  assert.throws(()=>validatePuzzle(documentFor({blocked:['A1'],places:{beacon:{kind,cells:['A1']}}})),/Befahrbarkeit/);
 }
 validatePuzzle(documentFor({blocked:['A1'],places:{beacon:{kind:'island',cells:['A1']}}}));
 assert.throws(()=>validatePuzzle(documentFor({places:{beacon:{kind:'island',cells:['A1']}}})),/Befahrbarkeit/);
});

test('a multi-cell place can have two true exact distances; distanceToPlace is not the minimum',()=>{
 const rules=createRules(reference.logic),route=archived.solution;
 assert.deepEqual(reference.logic.places.tesoro.cells.map(c=>distance(route[6],c)),[2,3]);
 for(const d of [2,3])assert.equal(rules.matches(route,{type:'distanceToPlace',hour:6,place:'tesoro',distance:d}),true);
 for(const d of [1,4])assert.equal(rules.matches(route,{type:'distanceToPlace',hour:6,place:'tesoro',distance:d}),false);
});

test('turns preserve clockwise sign, wrap-around and the straight course',()=>{
 const rules=createRules({grid:{columns:5,rows:5},start:'C3',steps:2,blocked:[],places:{},clues:[]});
 for(const [degrees,route] of [
  [60,['C3','C2','D2']],[-60,['C3','D3','D2']],
  [120,['C3','D3','C4']],[-120,['C3','D3','C2']],[0,['C3','D3','E3']]
 ]){
  assert.equal(rules.legal(route),true);
  assert.equal(rules.matches(route,{type:'turn',hour:2,degrees}),true);
 }
 // Both 180-degree parameters are schema-valid, but require an illegal immediate revisit.
 for(const route of rules.routes())for(const degrees of [-180,180]){
  assert.equal(rules.matches(route,{type:'turn',hour:2,degrees}),false);
 }
});

test('hour-zero positions, navigable places and self/start distances retain their semantics',()=>{
 const rules=createRules({...reference.logic,places:{...reference.logic.places,departure:{kind:'landmark',cells:['D4']}}}),route=archived.solution;
 assert.equal(rules.matches(route,{type:'position',hour:0,cell:'D4'}),true);
 assert.equal(rules.matches(route,{type:'position',hour:0,cell:'A1'}),false);
 assert.equal(rules.matches(route,{type:'adjacentToPlace',hour:0,place:'wreck'}),true);
 assert.equal(rules.matches(route,{type:'distanceToPlace',hour:0,place:'departure',distance:0}),true);
 assert.equal(rules.matches(route,{type:'adjacentToPlace',hour:0,place:'departure'}),false);
 assert.equal(rules.matches(route,{type:'distanceBetweenHours',hours:[0,0],distance:0}),true);
 assert.equal(rules.matches(route,{type:'distanceBetweenHours',hours:[0,0],distance:1}),false);
 assert.equal(rules.matches(route,{type:'distanceBetweenHours',hours:[0,6],distance:5}),true);
});

test('coast counts include both interval ends and count a multi-cell contact only once per hour',()=>{
 const rules=createRules({...reference.logic,places:{...reference.logic.places,last:{kind:'landmark',cells:['B1']}}});
 for(const [hours,place,count] of [[[0,0],'wreck',1],[[5,6],'last',1],[[4,4],'tesoro',1],[[6,6],'tesoro',0]]){
  assert.equal(rules.matches(archived.solution,{type:'countAdjacentToPlace',hours,place,count}),true);
  assert.equal(rules.matches(archived.solution,{type:'countAdjacentToPlace',hours,place,count:count+1}),false);
 }
});

test('solver removal counts agree with archived predicates for the irredundant six-clue reference subset',()=>{
 const base={...reference.logic,clues:reference.logic.clues.filter(c=>c.id!=='I')};
 const result=solvePuzzle(base),routes=archived.routes();
 assert.equal(result.status,'unique');
 assert.deepEqual(result.solutions,[archived.solution]);
 const expected=base.clues.map((clue,i)=>({clueId:clue.id,
  count:routes.filter(r=>archived.predicates.every((p,j)=>j===0||j===i+1||p(r))).length}));
 assert.deepEqual(result.metrics.withoutClue,expected);
 assert.ok(expected.every(c=>c.count>=2));
 assert.deepEqual(result.metrics.redundantClueIds,[]);
});

test('individually redundant clues cannot all be removed at once',()=>{
 const logic={grid:{columns:5,rows:5},start:'C3',steps:1,blocked:[],places:{},
  clues:[{id:'A',type:'direction',hour:1,direction:'E'},{id:'B',type:'direction',hour:1,direction:'E'}]};
 const result=solvePuzzle(logic);
 assert.equal(result.count,1);
 assert.deepEqual(result.metrics.withoutClue,[{clueId:'A',count:1},{clueId:'B',count:1}]);
 assert.deepEqual(result.metrics.redundantClueIds,['A','B']);
 assert.equal(solvePuzzle({...logic,clues:[]}).count,6);
});

test('different unique clue sets, counts and redundancy share the same provisional difficulty score',()=>{
 const variants=[reference.logic.clues,reference.logic.clues.filter(c=>c.id!=='I'),
  archived.solution.slice(1).map((cell,i)=>({id:'P'+i,type:'position',hour:i+1,cell}))];
 assert.deepEqual(variants.map(c=>c.length),[7,6,6]);
 const results=variants.map(clues=>solvePuzzle({...reference.logic,clues}));
 for(const result of results){
  assert.equal(result.status,'unique');
  assert.deepEqual(result.solutions,[archived.solution]);
  assert.equal(result.metrics.difficulty.provisional,true);
  assert.equal(result.metrics.difficulty.score,Math.log2(519));
  assert.equal(result.metrics.forcedPositions.length,7);
  assert.equal(result.metrics.forcedEarlySteps.length,6);
 }
 assert.deepEqual(results[0].metrics.redundantClueIds,['I']);
 assert.deepEqual(results[1].metrics.redundantClueIds,[]);
});
