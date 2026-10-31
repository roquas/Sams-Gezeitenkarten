import test from 'node:test';
import assert from 'node:assert/strict';
import {map,asset,catalog} from '../fixtures/model/factories.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';
import {generateTrueClues,validateB2Places} from '../../scripts/lib/puzzle-clues.mjs';
import {clueStatistics} from '../../scripts/lib/clue-presentation.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';

const chart=map();chart.objects.push({id:'buoy',cells:['E3'],passable:true});
const logic={map:chart,start:'C3',steps:6,clues:[]},rules=createRules(logic);
const target=[...rules.routes()].find(route=>route.includes('D3')&&route.includes('E3'));
const options={maxClueParameters:100000},pool=generateTrueClues(logic,target,options);
const deco=asset('test.deco');deco.role='decoration';deco.semanticClass='decoration';delete deco.passable;
const library=catalog([asset('test.port',[[0,0],[1,0]],true),asset('test.shore',[[0,0],[1,0]]),asset('test.buoy',[[0,0]],true),deco]);
const context={library,backgroundId:'test-sea'};
const placements=[{id:'port',objectId:'port',assetId:'test.port',anchor:'C3'},
 {id:'shore',objectId:'shore',assetId:'test.shore',anchor:'B2'},
 {id:'buoy',objectId:'buoy',assetId:'test.buoy',anchor:'E3'},
 {id:'decoration',assetId:'test.deco',anchor:'A1'}];

test('position enumeration uses all actual object cells, excludes decoration and sea, and keeps sea routes legal',()=>{
 validateB2Places(chart,placements,context);
 const occupied=new Set(chart.objects.flatMap(o=>o.cells));
 const positions=pool.clues.filter(c=>c.type==='position');
 assert.ok(positions.some(c=>c.cell==='C3'));assert.ok(positions.some(c=>c.cell==='D3'));
 assert.ok(positions.some(c=>c.cell==='E3'));
 assert.ok(positions.every(c=>occupied.has(c.cell)&&c.cell!=='A1'));
 assert.ok(target.some(c=>!occupied.has(c)));assert.equal(rules.legal(target),true);
 // Historical positions on free sea remain a valid engine contract.
 const hour=target.findIndex(c=>!occupied.has(c));
 const historical={id:'old',type:'position',hour,cell:target[hour]};
 validateLogic({...logic,clues:[historical]});assert.equal(rules.matches(target,historical),true);
 assert.deepEqual({byType:pool.byType,byPresentationForm:pool.byPresentationForm},clueStatistics(pool.clues));
});

test('position domains are restricted before truth checks and budgets; object order cannot change enumeration',()=>{
 const m={...chart,objects:[{id:'start',cells:['C3'],passable:true}]},l={map:m,start:'C3',steps:6,clues:[]};
 const route=createRules(l).routes().next().value;
 const tiny=generateTrueClues(l,route,{maxClueParameters:3});
 assert.deepEqual(tiny.clues.filter(c=>c.type==='position').map(({hour,cell})=>({hour,cell})),[{hour:0,cell:'C3'}]);
 assert.deepEqual({byType:tiny.byType,byPresentationForm:tiny.byPresentationForm},clueStatistics(tiny.clues));
 assert.equal(tiny.parametersExamined,3);assert.equal(tiny.completed,false);
 // A 2-cell object has exactly 14 position parameters, versus 7 for one cell.
 const double={...m,objects:[{id:'start',cells:['C3','D3'],passable:true}]};
 const other=generateTrueClues({...l,map:double},route,options),single=generateTrueClues(l,route,options);
 assert.equal(other.parametersExamined-single.parametersExamined,7);
 const reordered={...logic,map:{...chart,objects:chart.objects.toReversed().map(o=>({...o,cells:o.cells.toReversed()}))}};
 assert.deepEqual(generateTrueClues(reordered,target,options),pool);
});

test('distance clues including zero remain bound to passable and blocked objects with all their cells',()=>{
 for(const type of ['distanceToPlace','countDistanceToPlace']){
  const clues=pool.clues.filter(c=>c.type===type);
  assert.ok(clues.every(c=>chart.objects.some(o=>o.id===c.placeId)));
  assert.ok(clues.every(c=>rules.matches(target,c)));
  assert.ok(clues.some(c=>c.placeId==='shore'),'blocked places remain reference objects');
  assert.ok(clues.some(c=>c.placeId==='port'&&c.distance===0));
  if(type==='countDistanceToPlace')assert.ok(clues.some(c=>c.placeId==='shore'&&c.distance===0&&c.count===0));
 }
 const exact=pool.clues.filter(c=>c.type==='distanceToPlace'&&c.placeId==='port'&&c.distance===0);
 assert.deepEqual(exact.map(c=>target[c.hour]),target.filter(cell=>['C3','D3'].includes(cell)));
 assert.ok(pool.clues.some(c=>c.type==='countDistanceToPlace'&&c.placeId==='port'&&c.distance===0&&c.count===2));
});

test('B2 requires complete approved object illustrations while general placement validation permits partial maps',()=>{
 const partial=placements.filter(p=>p.objectId!=='shore');
 assert.deepEqual(validatePlacements(partial,library,chart,'test-sea'),[]);
 assert.throws(()=>validateB2Places(chart,partial,context),/incomplete/);
 for(const mutate of [
  p=>p[0].assetId='missing',p=>p[0].anchor='A5',p=>p[0].assetId='test.deco',
  p=>p.push({...p[0],id:'duplicate'})
 ]){const changed=structuredClone(placements);mutate(changed);assert.throws(()=>validateB2Places(chart,changed,context));}
 for(const mutate of [
  c=>c.assets[0].stage='technical-placeholder',c=>c.assets[0].production='draft',c=>c.reviews[0].status='pending'
 ]){const changed=structuredClone(library);mutate(changed);assert.throws(()=>validateB2Places(chart,placements,{...context,library:changed}));}
});
