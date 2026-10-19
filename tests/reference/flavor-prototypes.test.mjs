import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateAssetFiles} from '../../scripts/validate-assets.mjs';
import {validatePlacements,compatibility} from '../../src/assets/library.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {previewFixture} from '../../dev/asset-usage.mjs';
import {flavorPrototypes,passableSmallPlaces,freeMotifReviewPages,historicalIds,deferredIds} from '../../dev/asset-curation.mjs';
const catalog=()=>validateAssetFiles(JSON.parse(fs.readFileSync(new URL('../../assets/catalog/library.json',import.meta.url))));

test('six explicitly approved small motifs are passable logical places using existing accent type and exact background approvals',()=>{
 const library=catalog();assert.equal(passableSmallPlaces.length,6);
 for(const p of passableSmallPlaces){
  const a=library.assets.find(a=>a.id===p.id);
  assert.equal(a.type,'accent');assert.equal(a.role,'geographic');assert.equal(a.passable,true);
  assert.deepEqual(a.geometry.cells,[[0,0]]);
  const fixture=previewFixture(library,a.id,'named-passable',p.name);
  assert.equal(fixture.blocked.size,0);assert.equal(fixture.puzzle.assetPlacements[0].placeId,'review-place');
  assert.equal(fixture.puzzle.places['review-place'].name,p.name);
  for(const h of HEXES){
   const logic={grid:{columns:5,rows:5},blocked:[],places:{reference:{cells:[h.id]}}};
   assert.deepEqual(validatePlacements([{id:'place',assetId:a.id,anchor:h.id,placeId:'reference'}],library,logic,'sea-blue-01'),[]);
  }
  for(const b of library.backgrounds)assert.equal(compatibility(library,a.id,b.id),b.id==='sea-blue-01'?'approved':'pending');
 }
});

test('eight curated free motifs never represent hints; seven revised/new files stay pending, only exact foam v1 is approved',()=>{
 const library=catalog();assert.equal(flavorPrototypes.length,8);
 for(const p of flavorPrototypes){
  const a=library.assets.find(a=>a.id===p.id),approved=p.key==='foam';
  assert.equal(a.role,'decoration');assert.equal(a.type,'accent');assert.equal(Object.hasOwn(a,'passable'),false);
  assert.deepEqual(a.geometry.cells,[[0,0]]);assert.deepEqual([a.image.width,a.image.height],[360,408]);
  assert.equal(historicalIds.has(a.id)||deferredIds.has(a.id),false);
  for(const b of library.backgrounds){
   const expected=approved&&b.id==='sea-blue-01';assert.equal(compatibility(library,a.id,b.id),expected?'approved':'pending');
   const r=library.reviews.find(r=>r.assetId===a.id&&r.backgroundId===b.id);
   for(const field of ['reviewer','date','assetSha256','backgroundSha256'])assert.equal(Object.hasOwn(r,field),expected);
  }
  const fixture=previewFixture(library,a.id,'flavor','');assert.equal(fixture.blocked.size,0);assert.deepEqual(fixture.puzzle.places,{});
  for(const h of HEXES){
   const placement=[{id:'free',assetId:a.id,anchor:h.id}],logic={grid:{columns:5,rows:5},blocked:[],places:{}};
   assert.deepEqual(validatePlacements(placement,library,logic,'sea-blue-01',{development:true}),[]);
   assert.equal(validatePlacements(placement,library,logic,'sea-blue-01').some(e=>e.includes('not visually approved')),!approved);
   assert.ok(validatePlacements([{...placement[0],placeId:'clue'}],library,{...logic,places:{clue:{cells:[h.id]}}},'sea-blue-01',{development:true}).some(e=>e.includes('decoration cannot represent')));
  }
 }
});

test('curation keeps old animal variants historical and turtle deferred; fixed demonstration maps never exceed three free motifs',()=>{
 const library=catalog(),active=new Set([...flavorPrototypes,...passableSmallPlaces].map(p=>p.id));
 for(const id of ['sea-life.accent.h1.gulls.v1','sea-life.accent.h1.dolphins.v1'])assert.ok(historicalIds.has(id));
 assert.ok(deferredIds.has('sea-life.accent.h1.turtle.v1'));
 for(const id of [...historicalIds,...deferredIds]){
  assert.equal(active.has(id),false);
  assert.ok(library.reviews.filter(r=>r.assetId===id).every(r=>r.status==='pending'));
 }
 const keys=new Set();for(const page of freeMotifReviewPages){assert.ok(page.length<=3);for(const key of page){assert.ok(flavorPrototypes.some(p=>p.key===key));keys.add(key);}}
 assert.equal(keys.size,8);
});
