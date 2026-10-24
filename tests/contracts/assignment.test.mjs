import test from 'node:test';
import assert from 'node:assert/strict';
import {assignAssets,createCatalogProfile} from '../../src/assets/assignment.mjs';
import {placedCells} from '../../src/assets/geometry.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';
import {asset,catalog} from '../fixtures/model/factories.mjs';
import {syntheticCatalog} from '../fixtures/model/asset-context.mjs';

const mapOf=objects=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
const object=(id,cells,passable=false)=>({id,cells,passable});
const run=(map,c,seed=0)=>assignAssets({map,seed,catalog:c});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

test('assignment translates exact one/multicell footprints across row parities without mutating inputs',()=>{
 const a=asset('test.diagonal',[[0,0],[0,1]]),c=freeze(syntheticCatalog(catalog([a])));
 for(const anchor of ['B2','B3']){
  const map=freeze(mapOf([object('shore',placedCells(a,anchor))])),before=JSON.stringify(map);
  const r=run(map,c);assert.equal(r.status,'complete');assert.equal(r.placements[0].anchor,anchor);
  assert.deepEqual(validatePlacements(r.placements,c.library,map,c.backgroundId),[]);
  assert.equal(JSON.stringify(map),before);assert.deepEqual(r,run(map,c));
 }
 const single=syntheticCatalog(catalog());assert.equal(run(mapOf([object('one',['E5'])]),single).status,'complete');
});

test('asymmetric rotations and mirrors never match; cell order and translation do',()=>{
 const cells=[[0,0],[1,0],[1,1]],a=asset('test.asymmetric',cells),c=syntheticCatalog(catalog([a]));
 const actual=placedCells(a,'B2');assert.equal(run(mapOf([object('s',[...actual].reverse())]),c).status,'complete');
 for(const changed of [cells.map(([q,r])=>[-r,q+r]),cells.map(([q,r])=>[r,q]),[[0,0],[1,0],[2,0]]]){
  const r=run(mapOf([object('s',placedCells({geometry:{cells:changed}},'C3'))]),c);
  assert.equal(r.status,'none');assert.equal(r.objects[0].reason,'NO_EXACT_FOOTPRINT');
 }
});

test('full, partial, absent and empty coverage remain separate from map validity; reuse is legal',()=>{
 const c=syntheticCatalog(catalog()),map=mapOf([object('a',['B2']),object('b',['D4']),object('multi',['B3','C3'],true)]);
 const r=run(map,c);assert.equal(r.status,'partial');assert.equal(r.diagnostics.assignedCount,2);
 assert.equal(r.placements[0].assetId,r.placements[1].assetId);assert.equal(r.objects[2].reason,'NO_EXACT_FOOTPRINT');
 assert.equal(run(mapOf([map.objects[2]]),c).status,'none');
 const empty=run(mapOf([]),c);assert.equal(empty.status,'complete');assert.equal(empty.diagnostics.objectCount,0);
 const none=run(map,syntheticCatalog(catalog([])));assert.equal(none.objects[0].reason,'NO_GEOGRAPHIC_ASSETS');
});

test('passability, production, exact background approval and image/position failures have explicit reasons',()=>{
 const map=mapOf([object('shore',['B2'])]);
 const cases=[
  [c=>c.library.assets[0].passable=true,'PASSABILITY_MISMATCH'],
  [c=>c.library.assets[0].production='draft','PRODUCTION_DISABLED'],
  [c=>c.library.assets[0].stage='technical-placeholder','PRODUCTION_DISABLED'],
  [c=>c.library.reviews[0].status='pending','BACKGROUND_NOT_APPROVED'],
  [c=>delete c.verification,'PIXEL_VERIFICATION_MISSING'],
  [c=>c.verification.assets[0].error='synthetic alpha overflow','IMAGE_CONTRACT_REJECTED'],
  [c=>c.verification.assets[0].anchors=['C3'],'PIXEL_POSITION_REJECTED']];
 for(const [change,reason] of cases){
  const c=syntheticCatalog(catalog());change(c);
  if(c.verification)c.verification.librarySnapshot=JSON.stringify(c.library);
  const r=run(map,c);assert.equal(r.status,'none');assert.equal(r.objects[0].reason,reason);
  assert.equal(r.diagnostics.rejectionCounts[reason],1);
  assert.equal(createCatalogProfile(c).placements.length,reason==='PIXEL_POSITION_REJECTED'?1:reason==='PASSABILITY_MISMATCH'?25:0);
 }
 const deco=asset('test.decoration');deco.role='decoration';deco.semanticClass='decoration';delete deco.passable;
 assert.equal(run(map,syntheticCatalog(catalog([deco]))).objects[0].reason,'NO_GEOGRAPHIC_ASSETS');
});

test('catalog semantics/version and stale metadata attestation are enforced without guessing object classes',()=>{
 const map=mapOf([object('shore',['B2'])]);
 for(const change of [l=>l.semanticVersion=2,l=>l.assets[0].semanticClass='from-filename',l=>delete l.assets[0].semanticClass]){
  const l=catalog();change(l);assert.throws(()=>run(map,syntheticCatalog(l)));
 }
 const l=catalog();l.assets[0].semanticClass='lighthouse';
 const r=run(map,syntheticCatalog(l));assert.equal(r.objects[0].semanticClass,'lighthouse');
 const c=syntheticCatalog(catalog());c.library.assets[0].passable=true;
 assert.throws(()=>run(map,c),/Stale/);
});

test('multiple paintings use a separate reproducible stream, sorted candidates, and expose type usage',()=>{
 const c=syntheticCatalog(catalog([asset('test.z'),asset('test.a')]));
 const map=mapOf([object('s',['B2'])]),selected=new Set();
 for(let seed=0;seed<20;seed++){
  const r=run(map,c,seed);selected.add(r.placements[0].assetId);assert.equal(r.objects[0].candidateCount,2);
  const reversed=structuredClone(c);reversed.library.assets.reverse();reversed.library.reviews.reverse();
  reversed.verification.librarySnapshot=JSON.stringify(reversed.library);
  assert.deepEqual(r,run(map,reversed,seed));assert.equal(r.diagnostics.assetTypes.island,1);
 }
 assert.equal(selected.size,2);
 const profile=createCatalogProfile(c);assert.equal(profile.placements.length,25);
 assert.deepEqual(Object.keys(profile.placements[0]).sort(),['cells','passable']);
});
