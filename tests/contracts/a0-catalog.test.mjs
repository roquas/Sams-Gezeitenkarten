import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateLibrary,productionEnabled,compatibility,validatePlacements} from '../../src/assets/library.mjs';
import {placedCells,placementContract,imageContract} from '../../src/assets/geometry.mjs';
import {catalogLabel} from '../../dev/asset-curation.mjs';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url));
const json=p=>JSON.parse(read(p));
const library=validateLibrary(json('assets/catalog/library.json'));
const manifest=json('docs/reviews/a0-completion-2026-10-30/approval-manifest.json');
const prior=json('docs/reviews/a0-completion-2026-10-30/prior-approval-manifest.json');
const sha=p=>createHash('sha256').update(read(p)).digest('hex');
const board=Array.from({length:25},(_,i)=>({id:'ABCDE'[i%5]+(Math.floor(i/5)+1),q:i%5-Math.floor(Math.floor(i/5)/2),r:Math.floor(i/5)}));

test('A0 includes exactly eleven approved round-5 exports and excludes prison island 02',()=>{
 assert.deepEqual(manifest.items.map(a=>a.variant),[
  'nebelwald-01-r5','nebelwald-02-r5','nebelwald-03-r5',
  'gefaengnis-01-r5','gefaengnis-03-r5','huetten-01-r5','huetten-02-r5','huetten-03-r5',
  'aussichtsbucht-01-r5','aussichtsbucht-02-r5','aussichtsbucht-03-r5']);
 assert.equal(manifest.excluded[0].variant,'gefaengnis-02-r5');
 assert.ok(!library.assets.some(a=>a.id.includes('prison-island-02')));
 assert.equal(library.assets.length,55);
 assert.equal(library.reviews.filter(r=>r.status==='approved').length,34);
 assert.equal(library.assets.filter(a=>productionEnabled(library,a.id,'sea-blue-01')).length,33);
 for(const item of manifest.items){
  const a=library.assets.find(a=>a.id===item.id);
  assert.equal(a.passable,false);assert.equal(a.role,'geographic');assert.equal(a.family,'land-coast');
  assert.equal(a.geometry.cells.length,2);assert.equal(a.image.path,item.file);
  assert.equal(sha(item.file),item.sha256);
  const r=library.reviews.find(r=>r.assetId===a.id&&r.backgroundId==='sea-blue-01');
  assert.equal(r.assetSha256,item.sha256);assert.equal(r.backgroundSha256,sha('assets/seekarte/sea-blue-01.webp'));
  assert.equal(productionEnabled(library,a.id,'sea-blue-01'),true);
  for(const bg of ['legacy-parchment-sea','prototype-sea']){
   assert.equal(compatibility(library,a.id,bg),'pending');assert.equal(productionEnabled(library,a.id,bg),false);
  }
  assert.match(catalogLabel(a),/unbefahrbar · 2 Hex · Land\/Küste$/);
 }
});

test('A0 preserves all ten previously accepted images and their exact background approvals',()=>{
 assert.equal(prior.items.length,10);
 for(const item of prior.items){
  const a=library.assets.find(a=>a.id===item.id);
  assert.equal(sha(a.image.path),item.sha256,item.id);
  assert.equal(a.passable,item.passable);assert.equal(a.geometry.cells.length,1);
  const review=library.reviews.find(r=>r.assetId===item.id&&r.backgroundId===prior.backgroundId);
  assert.equal(review.status,'approved');assert.equal(review.assetSha256,item.sha256);
  assert.equal(review.backgroundSha256,prior.backgroundSha256);
 }
});

test('all 206 new anchors match independent axial enumeration and exact object footprints on both row parities',()=>{
 let total=0;
 for(const item of manifest.items){
  const a=library.assets.find(a=>a.id===item.id),anchors=[],parities=new Set();
  for(const h of board){
   const cells=board.filter(b=>item.geometry.some(([q,r])=>b.q-h.q===q&&b.r-h.r===r)).map(b=>b.id).sort();
   if(cells.length!==2){assert.throws(()=>placementContract(a,h.id),/extends beyond chart/);continue;}
   anchors.push(h.id);parities.add(h.r%2);total++;
   assert.deepEqual(placedCells(a,h.id).sort(),cells);
   assert.deepEqual(placementContract(a,h.id),imageContract(item.geometry));
   const map={geometry:'even-row-offset-pointy-v1',grid:{columns:5,rows:5},objects:[{id:'island',cells,passable:false}]};
   assert.deepEqual(validatePlacements([{id:'art',assetId:a.id,objectId:'island',anchor:h.id}],library,map,'sea-blue-01'),[]);
  }
  assert.deepEqual(anchors.sort(),[...item.validAnchors].sort());assert.equal(parities.size,2);
 }
 assert.equal(total,206);
});
