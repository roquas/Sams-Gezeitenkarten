import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {withPlacementValidator,validatePlacements} from '../../src/assets/library.mjs';
import {assignAssets} from '../../src/assets/assignment.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';
import {asset,catalog,map} from '../fixtures/model/factories.mjs';
import {syntheticCatalog} from '../fixtures/model/asset-context.mjs';
import {assignmentCases,placementCases} from '../fixtures/model/assignment-cases.mjs';

const reviewed=JSON.parse(fs.readFileSync(new URL('../fixtures/model/assignment-catalog-1.json',import.meta.url)));
const outcome=fn=>{try{return {result:fn()};}catch(error){return {error:{name:error.name,message:error.message}};}};
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};

test('assignment matches all 23 outcomes under catalog-assignment-1, including diagnostics and reference failures',()=>{
 for(const {name,input} of assignmentCases()){
  const {name:label,...expected}=reviewed.cases.find(c=>c.name===name);
  assert.deepEqual(outcome(()=>assignAssets(freeze(input))),expected,name);
 }
});

test('standalone and scoped candidates preserve reviewed validation errors and their order',()=>{
 for(const {name,input:i} of placementCases()){
  const {name:label,...expected}=reviewed.placements.find(c=>c.name===name);freeze(i);
  assert.deepEqual(outcome(()=>validatePlacements(i.placements,i.library,i.map,i.backgroundId,i.options)),expected,name);
  if(i.placements.length===1)assert.deepEqual(outcome(()=>withPlacementValidator(i.library,i.map,i.backgroundId,
   validator=>validator.candidateErrors(i.placements[0]),i.options)),expected,name+' scoped');
 }
});

test('final validation still rejects overlaps, duplicate IDs and duplicate object illustrations between valid candidates',()=>{
 const library=catalog([asset('test.shore',[[0,0],[1,0]])]),m=map();
 const a={id:'first',assetId:'test.shore',anchor:'B2',objectId:'shore'},b={...a,id:'second'};
 withPlacementValidator(library,m,'test-sea',v=>{
  assert.deepEqual(v.candidateErrors(a),[]);assert.deepEqual(v.candidateErrors(b),[]);
 });
 const errors=validatePlacements([a,b,a],library,m,'test-sea');
 assert.ok(errors.some(e=>e.includes('overlapping')));assert.ok(errors.some(e=>e.includes('duplicate object')));
 assert.ok(errors.some(e=>e.includes('Duplicate placement ID')));
});

test('scoped indices cannot escape, survive an exception, run asynchronously or accept metadata changes',()=>{
 const library=catalog(),m=map();let saved;
 withPlacementValidator(library,m,'test-sea',v=>{saved=v;assert.equal(v.productionEnabled('test.island'),true);});
 assert.throws(()=>saved.candidateErrors({}),/Expired/);assert.throws(()=>saved.compatibility('test.island'),/Expired/);
 assert.throws(()=>withPlacementValidator(library,m,'test-sea',v=>{saved=v;throw Error('stop');}),/stop/);
 assert.throws(()=>saved.productionEnabled('test.island'),/Expired/);
 assert.throws(()=>withPlacementValidator(library,m,'test-sea',()=>Promise.resolve()),/synchronous/);
 for(const change of [()=>library.assets[0].production='draft',()=>m.objects[0].passable=false]){
  assert.throws(()=>withPlacementValidator(library,m,'test-sea',v=>{saved=v;change();}),/Stale/);
  assert.throws(()=>saved.candidateErrors({}),/Expired/);
 }
 const c=syntheticCatalog(catalog());c.library.assets[0].image.path='assets/changed.png';
 assert.throws(()=>assignAssets({map:m,seed:0,catalog:c}),/Stale/);
});

test('28/128/512 assets need exactly two full catalog validations rather than one per candidate',()=>{
 const m={geometry:GEOMETRY,grid:{columns:5,rows:5},objects:cellsOf({columns:5,rows:5}).map((cell,i)=>({id:'geo-'+i,cells:[cell],passable:false}))};
 for(const count of [28,128,512]){
  const library=catalog(Array.from({length:count},(_,i)=>asset('test.'+i)));let validations=0;
  library.assets[0].candidateFamilies=new Proxy(library.assets[0].candidateFamilies,{get(target,key,receiver){
   if(key==='some')validations++;
   return Reflect.get(target,key,receiver);
  }});
  const r=assignAssets({map:m,seed:0,catalog:syntheticCatalog(library)});
  assert.equal(r.diagnostics.candidateChecks,25*count);assert.equal(r.status,'complete');
  assert.equal(validations,2,'initial scope + final full validation, independent of candidate count');
 }
});
