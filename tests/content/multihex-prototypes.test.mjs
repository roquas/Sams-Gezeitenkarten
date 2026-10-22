import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multihexPrototypes,multihexCandidates,multihexFixture} from '../../dev/multihex-prototypes.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {imageContract,placedCells} from '../../src/assets/geometry.mjs';
import {compatibility,validatePlacements} from '../../src/assets/library.mjs';
import {placeLabelLayout,labelFootprint,hexVertices,hexCenter,polygonsOverlap,containsPoint} from '../../src/ui/place-labels.mjs';
const library=JSON.parse(fs.readFileSync(new URL('../../assets/catalog/library.json',import.meta.url)));
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const board=new Set(HEXES.map(h=>h.id));
const counts={tropical:20,volcano:16,archipelago:14,harbor:16,smuggler:14,sand:10,claw:14,temple:14,tesoro:14,'tesoro-v1':14,'tesoro-v2':14,'tesoro-v3':14};
for(const p of multihexPrototypes)test(p.key+': single whole image, explicit review, every occupied hex blocked and labels safe at every valid anchor',()=>{
 const asset=library.assets.find(a=>a.id===p.id);
 assert.equal(asset.passable,false);assert.equal(asset.stage,'illustration');
 assert.equal(asset.geometry.cells.length,p.key==='tropical'?2:['volcano','archipelago','harbor','smuggler'].includes(p.key)?3:4);
 const contract=imageContract(asset.geometry.cells);
 assert.deepEqual([asset.image.width,asset.image.height],[contract.pixelWidth,contract.pixelHeight]);
 for(const bg of library.backgrounds)assert.equal(compatibility(library,p.id,bg.id),p.approved&&bg.id==='sea-blue-01'?'approved':'pending');
 const positions=reviewPositions(asset);
 assert.deepEqual(positions.map(p=>[p.parity,p.location]),p.key==='sand'?[['ungerade','Rand'],['gerade','Rand']]:[['ungerade','Rand'],['ungerade','Innen'],['gerade','Rand'],['gerade','Innen']]);
 let checked=0;
 for(const h of HEXES){
  const cells=placedCells(asset,h.id);if(!cells.every(id=>board.has(id)))continue;checked++;
  const {blocked,puzzle}=multihexFixture(library,p,h.id);
  assert.deepEqual([...blocked],cells);assert.deepEqual(puzzle.map.objects[0].cells,cells);
  assert.equal(puzzle.assetPlacements.length,1);
  const label=placeLabelLayout(cells,p.name,blocked,byId);assert.ok(label);
  assert.equal(label.cells.length,cells.length);
  const footprint=labelFootprint(label,label.margin);
  assert.ok(footprint.every(v=>containsPoint(label.polygon,v)));
  for(const water of HEXES.filter(c=>!blocked.has(c.id)))assert.equal(polygonsOverlap(footprint,hexVertices(...hexCenter(water))),false);
  const logic=puzzle.map;
  assert.equal(validatePlacements(puzzle.assetPlacements,library,logic,'sea-blue-01').some(e=>e.includes('not visually approved')),!p.approved);

 }
 assert.ok(checked>0);
});

test('round-two contract preserves south harbor, mirrored bend and four-cell identities',()=>{
 const a=key=>library.assets.find(a=>a.id===multihexPrototypes.find(p=>p.key===key).id);
 assert.deepEqual(a('harbor').geometry.cells,[[0,0],[1,0],[0,1]]);
 assert.deepEqual(a('smuggler').geometry.cells,[[0,0],[1,-1],[2,-1]]);
 assert.deepEqual(a('sand').geometry.cells,[[0,0],[1,0],[2,0],[3,0]]);
 assert.equal(new Set(multihexCandidates.map(p=>a(p.key).image.path)).size,6);
 const old=library.reviews.filter(r=>r.assetId==='land-coast.archipelago.h3.bent-reefs.v1');
 assert.ok(old.every(r=>r.status==='pending'));
});

test('historical claws retain their identities and exact footprints while Tesoro v4 has an exact sea-blue approval',()=>{
 const p=multihexPrototypes.find(p=>p.key==='claw');assert.equal(p.id,'land-coast.island.h4.crab-claw.v2');
 assert.equal(p.approved,undefined);
 assert.equal(p.historical,true);
 const old=library.assets.find(a=>a.id==='land-coast.island.h4.crab-claw.v1'),current=library.assets.find(a=>a.id===p.id);
 assert.deepEqual(current.geometry,old.geometry);assert.notEqual(current.image.path,old.image.path);
 assert.equal(multihexPrototypes.filter(p=>p.round===2&&p.approved).length,5);
 assert.equal(multihexPrototypes.some(p=>p.id===old.id),false);
 const tesoro=multihexPrototypes.find(p=>p.key==='tesoro');
 assert.equal(multihexCandidates.some(p=>p.key==='claw'),false);
 assert.ok(multihexCandidates.includes(tesoro));assert.equal(tesoro.approved,true);
 assert.equal(tesoro.id,'land-coast.settlement.h4.tesoro.v4');
 const previous=multihexPrototypes.find(p=>p.key==='tesoro-v1');
 assert.equal(multihexPrototypes.find(p=>p.key==='tesoro-v2').historical,true);
 assert.equal(multihexPrototypes.find(p=>p.key==='tesoro-v3').historical,true);
 assert.equal(previous.historical,true);assert.equal(previous.id,'land-coast.settlement.h4.tesoro.v1');
 const asset=library.assets.find(a=>a.id===tesoro.id);
 assert.deepEqual(asset.geometry.cells,[[0,0],[1,0],[0,1],[1,1]]);
 const reviews=library.reviews.filter(r=>r.assetId===tesoro.id);
 assert.equal(reviews.length,library.backgrounds.length);
 for(const review of reviews){
  const approved=review.backgroundId==='sea-blue-01';
  assert.equal(review.status,approved?'approved':'pending');
  for(const key of ['reviewer','date','assetSha256','backgroundSha256'])assert.equal(Object.hasOwn(review,key),approved);
 }
});
