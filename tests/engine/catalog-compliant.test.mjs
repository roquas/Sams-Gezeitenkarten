import test from 'node:test';
import assert from 'node:assert/strict';
import {asset,catalog} from '../fixtures/model/factories.mjs';
import {syntheticCatalog} from '../fixtures/model/asset-context.mjs';
import {assignAssets,createCatalogProfile,CONSTRAINED_ASSIGNMENT_VERSION} from '../../src/assets/assignment.mjs';
import {generateMap,CONSTRAINED_GENERATOR_VERSION} from '../../src/generation/maps.mjs';
import {normalizeCatalogProfile} from '../../src/generation/catalog-profile.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';
import {adjacent} from '../../src/engine/hex.mjs';

const context=assets=>syntheticCatalog(catalog(assets));
const map=objects=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
const object=(id,cells,passable=false)=>({id,cells,passable});
const assign=(m,c,seed=0)=>assignAssets({map:m,catalog:c,seed,reusePolicy:'catalog-compliant'});
function check(m,c,a){
 validateMap(m,{separateObjects:true});assert.equal(a.status,'complete');
 assert.deepEqual(validatePlacements(a.placements,c.library,m,c.backgroundId),[]);
 const blocked=new Set();
 for(const p of a.placements){
  const motif=c.library.assets.find(x=>x.id===p.assetId);
  if(!motif.passable){assert.ok(!blocked.has(motif.id));blocked.add(motif.id);}
 }
 for(let i=0;i<m.objects.length;i++)for(let j=0;j<i;j++)
  assert.ok(m.objects[i].cells.every(a=>m.objects[j].cells.every(b=>!adjacent(a,b))));
}

test('global matching prevents blocked reuse, permits distinct paintings of a form and diagnoses shortage',()=>{
 const c=context([asset('test.one'),asset('test.two')]);
 const m=map([object('a',['A1']),object('b',['C3']),object('c',['E5'])]);
 const a=assign(m,c);assert.equal(a.status,'partial');assert.equal(a.placements.length,2);
 assert.equal(new Set(a.placements.map(p=>p.assetId)).size,2);
 assert.deepEqual(a.diagnostics.rejectionCounts,{ASSET_REUSE_EXHAUSTED:1});
 assert.equal(assignAssets({map:m,catalog:c,seed:0}).status,'complete'); // legacy allows reuse
 const pair=map(m.objects.slice(0,2));check(pair,c,assign(pair,c));
});

test('matching finds full assignments across overlapping candidate sets and maximizes passable diversity',()=>{
 for(const passable of [false,true]){
  const c=context([asset('test.flexible',[[0,0]],passable),asset('test.limited',[[0,0]],passable)]);
  c.verification.assets.find(a=>a.assetId==='test.limited').anchors=['A1'];
  const m=map([object('a',['A1'],passable),object('b',['C3'],passable)]);
  for(let seed=0;seed<24;seed++){
   const a=assign(m,c,seed);check(m,c,a);
   assert.equal(new Set(a.placements.map(p=>p.assetId)).size,2);
   assert.equal(a.placements.find(p=>p.objectId==='a').assetId,'test.limited');
   assert.deepEqual(a,assign(m,c,seed));
  }
 }
});

test('passable paintings are distinct before reuse, then least-used matching paintings are preferred',()=>{
 const c=context([asset('test.one',[[0,0]],true),asset('test.two',[[0,0]],true)]);
 const m=map([object('a',['A1'],true),object('b',['C1'],true),object('c',['E1'],true),object('d',['A5'],true),object('e',['E5'],true)]);
 for(let seed=0;seed<16;seed++){
  const a=assign(m,c,seed);check(m,c,a);
  assert.deepEqual(Object.values(a.diagnostics.assetUsage).sort(),[2,3]);
  assert.equal(a.diagnostics.assignmentVersion,CONSTRAINED_ASSIGNMENT_VERSION);
 }
 assert.throws(()=>assignAssets({map:m,catalog:c,seed:0,reusePolicy:'other'}),/Unsupported/);
});

test('capacity profile derives forms, availability and counts from eligible catalog entries only',()=>{
 const a=asset('test.blocked'),b=asset('test.other'),p=asset('test.port',[[0,0]],true),draft=asset('test.draft');draft.production='draft';
 const c=context([a,b,p,draft]),profile=createCatalogProfile(c,{mode:'catalog-compliant'});
 assert.deepEqual(profile.capacities,[{shape:'0,0',passable:false,count:2},{shape:'0,0',passable:true,count:1}]);
 assert.deepEqual(profile,normalizeCatalogProfile(profile));
 assert.equal(profile.placements.length,50);assert.ok(!JSON.stringify(profile).includes('test.blocked'));
 for(const mutate of [p=>p.capacities[0].count=0,p=>p.capacities.push(p.capacities[0]),
  p=>p.capacities[0].shape='different',p=>p.placements[0].rotation=60,p=>p.capacities[0].extra=1]){
  const changed=structuredClone(profile);mutate(changed);assert.throws(()=>normalizeCatalogProfile(changed),{code:'INVALID_CONFIG'});
 }
 assert.throws(()=>generateMap({seed:0,catalogProfile:profile}),{code:'INVALID_CONFIG'});
 assert.throws(()=>generateMap({seed:0,mode:'catalog-compliant'}),{code:'INVALID_CONFIG'});
});

test('constrained generation uses only covered shapes, respects all edges and preserves geographic/asset separation',()=>{
 const c=context([asset(),asset('test.port',[[0,0]],true),asset('test.double',[[0,0],[1,0]]),asset('test.triple',[[0,0],[1,0],[1,1]])]);
 const profile=createCatalogProfile(c,{mode:'catalog-compliant'}),corners=new Set(),sizes=new Set(),fingerprints=new Set();
 for(let seed=0;seed<128;seed++){
  const options={seed,mode:'catalog-compliant',catalogProfile:profile,config:{objectCount:4}};
  const g=generateMap(options);assert.equal(g.status,'generated');
  assert.deepEqual(g,generateMap(options));assert.equal(g.diagnostics.generatorVersion,CONSTRAINED_GENERATOR_VERSION);
  assert.deepEqual(Object.keys(g.map).sort(),['geometry','grid','objects']);
  for(const o of g.map.objects){
   assert.deepEqual(Object.keys(o).sort(),['cells','id','passable']);
   sizes.add(o.cells.length);if(o.passable)assert.equal(o.cells.length,1);
   for(const cell of o.cells)if(['A1','E1','A5','E5'].includes(cell))corners.add(cell);
  }
  check(g.map,c,assign(g.map,c,seed));fingerprints.add(JSON.stringify(g.map));
 }
 assert.equal(corners.size,4);assert.ok(sizes.has(1)&&sizes.has(2)&&sizes.has(3));assert.ok(fingerprints.size>100);
});

test('capacity, passability, size and spacing shortages exhaust the explicit budget without relaxation',()=>{
 for(const [assets,config,reason] of [
  [[asset()],{objectCount:2,objectSizes:[1],passableProbability:0},'CATALOG_CAPACITY_EXHAUSTED'],
  [[asset()],{objectCount:1,passableProbability:1},'CATALOG_PASSABILITY_UNAVAILABLE'],
  [[asset('test.port',[[0,0]],true)],{objectCount:1,objectSizes:[2],passableProbability:1},'CATALOG_SIZE_UNAVAILABLE'],
  [[asset('test.port',[[0,0]],true)],{objectCount:25,objectSizes:[1],passableProbability:1},'OBJECT_SPACING_EXHAUSTED']]){
  const profile=createCatalogProfile(context(assets),{mode:'catalog-compliant'});
  const g=generateMap({seed:0,mode:'catalog-compliant',catalogProfile:profile,config:{...config,maxMapAttempts:2}});
  assert.equal(g.status,'exhausted');assert.equal(g.map,null);assert.equal(g.diagnostics.attempts,2);
  assert.deepEqual(g.diagnostics.rejectionCounts,{[reason]:2});
 }
 const cornerPair=map([object('a',['A1']),object('b',['A2'],true)]);
 assert.doesNotThrow(()=>validateMap(cornerPair));assert.throws(()=>validateMap(cornerPair,{separateObjects:true}),/shared edge/);
});
