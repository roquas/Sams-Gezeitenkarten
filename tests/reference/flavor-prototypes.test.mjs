import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateAssetFiles} from '../../scripts/validate-assets.mjs';
import {validatePlacements,compatibility} from '../../src/assets/library.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {previewFixture} from '../../dev/asset-usage.mjs';
import {flavorPrototypes} from '../../dev/flavor-prototypes.mjs';

test('ten flavor illustrations remain nameless navigable decoration and cannot enter production without art approval',()=>{
 const library=validateAssetFiles(JSON.parse(fs.readFileSync(new URL('../../assets/catalog/library.json',import.meta.url))));
 assert.equal(flavorPrototypes.length,10);
 for(const p of flavorPrototypes){
  const a=library.assets.find(a=>a.id===p.id);
  assert.equal(a.role,'decoration');assert.equal(a.type,'accent');
  assert.equal(a.stage,'illustration');assert.equal(Object.hasOwn(a,'passable'),false);
  assert.deepEqual(a.geometry.cells,[[0,0]]);
  assert.deepEqual([a.image.width,a.image.height],[360,408]);
  for(const b of library.backgrounds){
   assert.equal(compatibility(library,a.id,b.id),'pending');
   const review=library.reviews.find(r=>r.assetId===a.id&&r.backgroundId===b.id);
   for(const field of ['reviewer','date','assetSha256','backgroundSha256'])assert.equal(Object.hasOwn(review,field),false);
  }
  const fixture=previewFixture(library,a.id,'flavor','');
  assert.equal(fixture.blocked.size,0);assert.deepEqual(fixture.puzzle.places,{});
  assert.equal(Object.hasOwn(fixture.puzzle.assetPlacements[0],'placeId'),false);
  for(const h of HEXES){
   const placement=[{id:'flavor',assetId:a.id,anchor:h.id}];
   const logic={grid:{columns:5,rows:5},blocked:[],places:{}};
   assert.deepEqual(validatePlacements(placement,library,logic,'sea-blue-01',{development:true}),[]);
   assert.ok(validatePlacements(placement,library,logic,'sea-blue-01').some(e=>e.includes('not visually approved')));
   assert.ok(validatePlacements([{...placement[0],placeId:'clue'}],library,{...logic,places:{clue:{cells:[h.id]}}},'sea-blue-01',{development:true}).some(e=>e.includes('decoration cannot represent')));
  }
 }
});
