import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateLibrary,compatibility,validatePlacements} from '../../src/assets/library.mjs';
import {imageContract,geometryErrors,placedCells,assetRectangle} from '../../src/assets/geometry.mjs';
import {validateAssetFiles} from '../../scripts/validate-assets.mjs';
import {LEGACY_ASSETS} from '../../src/assets/legacy.mjs';
import {chartOverlays} from '../../src/ui/chart-art.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {previewFixture} from '../../dev/asset-usage.mjs';

const read=ref=>JSON.parse(fs.readFileSync(new URL('../../'+ref,import.meta.url)));
const catalog=()=>read('assets/catalog/library.json');
const source=()=>read('puzzles/reference-3.6.json');
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const placement={id:'island',assetId:'technical.single.v1',anchor:'B3',placeId:'tesoro'};
const errors=(placements=[placement],library=catalog(),logic=source().logic)=>validatePlacements(placements,library,logic,'sea-blue-01',{development:true});
function approved(){
 const c=catalog();c.assets[0].stage='illustration';
 Object.assign(c.reviews[0],{status:'approved',reviewer:'Test fixture only',date:'2026-10-18',assetSha256:'0'.repeat(64),backgroundSha256:'0'.repeat(64)});
 return c;
}
test('catalog files, stable IDs, provenance and separated review catalog validate',()=>{
 const c=validateAssetFiles(catalog());
 assert.equal(c.assets.filter(a=>a.stage==='technical-placeholder').length,4);
 for(const id of ['land-coast.island.h1.basalt-spire.v1','land-coast.island.h1.basalt-spire-water.v1']){
  const spire=c.assets.find(a=>a.id===id);
  assert.equal(spire.passable,false);
  assert.equal(spire.stage,'illustration');
  assert.deepEqual(spire.geometry.cells,[[0,0]]);
  const isWaterRich=id==='land-coast.island.h1.basalt-spire-water.v1';
  assert.equal(compatibility(c,spire.id,'sea-blue-01'),isWaterRich?'approved':'pending');
  assert.equal(validatePlacements([{id:'spire',assetId:spire.id,anchor:'B3'}],c,source().logic,'sea-blue-01').some(e=>e.includes('not visually approved')),!isWaterRich);
  for(const background of c.backgrounds.filter(b=>b.id!=='sea-blue-01'))assert.equal(compatibility(c,spire.id,background.id),'pending');
 }
 assert.deepEqual(c.reviews.filter(r=>r.status==='approved').map(r=>[r.assetId,r.backgroundId]),[
  'land-coast.island.h1.basalt-spire-water.v1','navigation.lighthouse.h1.offcenter-beacon.v1',
  'land-coast.atoll.h1.broken-passages.v1','navigation.wreck.h1.offcenter-sloop.v1',
  'land-coast.island.h2.tropical-bays.v1','land-coast.island.h3.massive-volcano.v1',
  'land-coast.archipelago.h3.sand-reefs.v2','land-coast.island.h3.south-harbor.v1','land-coast.island.h3.smuggler-cove.v1','land-coast.island.h4.long-sand.v1','land-coast.island.h4.jungle-temple.v1','land-coast.settlement.h4.tesoro.v4'
 ].map(id=>[id,'sea-blue-01']));
 assert.equal(new Set(LEGACY_ASSETS.map(a=>a.id)).size,8);
 assert.ok(LEGACY_ASSETS.every(a=>a.stage==='legacy'&&a.exception));
});
test('three passable illustrations are hash-approved only on sea-blue-01',()=>{
 const c=validateAssetFiles(catalog());
 const ids=['navigation.lighthouse.h1.offcenter-beacon.v1','land-coast.atoll.h1.broken-passages.v1','navigation.wreck.h1.offcenter-sloop.v1'];
 for(const id of ids){
  const a=c.assets.find(a=>a.id===id);
  assert.equal(a.passable,true);assert.equal(a.stage,'illustration');
  assert.deepEqual(a.geometry.cells,[[0,0]]);
  const placements=[{id:'prototype',assetId:id,anchor:'B3',placeId:'test-place'}];
  const logic={grid:{columns:5,rows:5},blocked:[],places:{'test-place':{cells:['B3']}}};
  for(const b of c.backgrounds){
   assert.equal(compatibility(c,id,b.id),b.id==='sea-blue-01'?'approved':'pending');
   if(b.id!=='sea-blue-01')assert.ok(validatePlacements(placements,c,logic,b.id).some(e=>e.includes('not visually approved')));
  }
  assert.deepEqual(validatePlacements(placements,c,logic,'sea-blue-01',{development:true}),[]);
  assert.deepEqual(validatePlacements(placements,c,logic,'sea-blue-01'),[]);
  const changed=catalog();changed.reviews.find(r=>r.assetId===id).assetSha256='0'.repeat(64);
  assert.throws(()=>validateAssetFiles(changed),/Stale visual approval/);
 }
});
test('gallery naming is a placement state; Flavor preserves asset metadata and blocked cells',()=>{
 const c=catalog(),before=structuredClone(c);
 for(const asset of c.assets){
  const flavor=previewFixture(c,asset.id,'flavor','Prüfort');
  assert.deepEqual(flavor.puzzle.places,{});
  assert.equal(Object.hasOwn(flavor.puzzle.assetPlacements[0],'placeId'),false);
  if(asset.role==='geographic'){
   const usage=asset.passable?'named-passable':'named-blocked';
   const named=previewFixture(c,asset.id,usage,'Prüfort');
   assert.deepEqual(named.blocked,flavor.blocked);
   assert.deepEqual(named.puzzle.places['review-place'].cells,placedCells(asset,'B3'));
   assert.throws(()=>previewFixture(c,asset.id,asset.passable?'named-blocked':'named-passable','Prüfort'),/passability/);
  }else assert.throws(()=>previewFixture(c,asset.id,'named-passable','Prüfort'),/passability/);
 }
 assert.deepEqual(c,before);
});
test('invalid/duplicate identities, file paths and unsupported metadata are rejected',()=>{
 for(const mutate of [c=>c.assets.push(c.assets[0]),c=>c.backgrounds.push(c.backgrounds[0]),c=>c.assets[0].id='Bad ID',c=>c.assets[0].image.path='../escape.png',c=>c.assets[0].rotation=60,c=>c.assets[0].image.width=1,c=>c.assets[0].provenance.rights='']){
  const c=catalog();mutate(c);assert.throws(()=>validateLibrary(c));
 }
 const c=catalog();c.assets[0].image.path='assets/library/missing.png';assert.throws(()=>validateAssetFiles(c),/ENOENT/);
});
test('geometry rejects empty, fractional, duplicate, disconnected and missing origins',()=>{
 for(const cells of [[],[[0,0],[.5,0]],[[0,0],[0,0]],[[0,0],[2,0]],[[1,0]],[[0,0,0]]])assert.ok(geometryErrors(cells).length);
 assert.deepEqual(geometryErrors([[0,0],[1,0],[0,1]]),[]);
});
test('old proposals retain meaningful connected forms without inventing artwork',()=>{
 const c=read('assets/catalog/asset-proposals.json');assert.equal(c.stage,'proposals-only');
 for(const a of c.assets){assert.deepEqual(geometryErrors(a.geometry.cells),[]);assert.equal(a.image,null);assert.equal(a.backgroundReview.seaBlue01,'pending');}
});
test('graphic type has no implicit passability; decoration omits it',()=>{
 const c=catalog();c.assets[0].type='lighthouse';assert.equal(validateLibrary(c).assets[0].passable,false);
 c.assets[0].passable=true;assert.equal(validateLibrary(c).assets[0].passable,true);
 delete c.assets[0].passable;assert.throws(()=>validateLibrary(c),/passable/);
 const d=catalog();d.assets[3].passable=true;assert.throws(()=>validateLibrary(d),/decoration/);
});
test('fixed canvas and centroid preserve the actual chart lattice at both row parities',()=>{
 assert.deepEqual([imageContract([[0,0]]).pixelWidth,imageContract([[0,0]]).pixelHeight],[360,408]);
 const a=catalog().assets[1];assert.equal(imageContract(a.geometry.cells).pixelWidth,688);
 for(const anchor of ['B2','B3']){
  const p=assetRectangle(a,anchor,byId),centers=p.cells.map(c=>byId[c].center);
  assert.equal(p.x+p.width/2,(centers[0][0]+centers[1][0])/2);
  assert.equal(p.y+p.height/2,(centers[0][1]+centers[1][1])/2);
 }
 const diagonal={...a,geometry:{cells:[[0,0],[0,1]]}};
 assert.deepEqual(placedCells(diagonal,'B2'),['B2','C3']);assert.deepEqual(placedCells(diagonal,'B3'),['B3','B4']);
 assert.throws(()=>assetRectangle(a,'E1',byId),/beyond/);
});
test('placement rejects all transforms, file-name coupling, extra sizes and wrong membership',()=>{
 for(const extra of [{rotation:60},{mirror:true},{scale:2},{dx:1},{width:20},{cells:['C3']},{image:'x.png'}])assert.ok(errors([{...placement,...extra}]).length);
 assert.ok(errors([{...placement,anchor:'Z9'}]).length);
 assert.ok(errors([{...placement,placeId:'missing'}]).length);
 assert.ok(errors([{...placement,anchor:'A1'}]).length);
 assert.ok(errors([placement,{...placement}]).length);
 assert.ok(errors([{...placement,assetId:'unknown'}]).length);
});
test('separated assets can belong to one named place; decorations never change blocked cells',()=>{
 const logic=source().logic;logic.blocked.push('E5');logic.places.tesoro.cells.push('E5');
 const before=structuredClone(logic);
 assert.deepEqual(errors([placement,{...placement,id:'separate',anchor:'E5'}, {id:'accent',assetId:'technical.decoration.v1',anchor:'A1'}],catalog(),logic),[]);
 assert.deepEqual(logic,before);
 assert.ok(errors([{id:'accent',assetId:'technical.decoration.v1',anchor:'A1',placeId:'tesoro'}]).length);
 assert.ok(errors([{...placement,assetId:'technical.lighthouse.v1'}]).length);
});
test('review statuses are explicit, hash-bound, and family candidates never approve new variants',()=>{
 const c=approved();assert.equal(compatibility(c,placement.assetId,'sea-blue-01'),'approved');
 c.backgrounds.push({id:'sea-blue-02',family:'blue-sea',image:c.backgrounds[0].image});
 assert.equal(compatibility(c,placement.assetId,'sea-blue-02'),'pending');
 c.reviews[0].status='rejected';assert.equal(compatibility(c,placement.assetId,'sea-blue-01'),'rejected');
 c.reviews.push({...c.reviews[0],backgroundId:'*',status:'approved'});
 assert.equal(compatibility(c,placement.assetId,'sea-blue-01'),'rejected');
 assert.equal(compatibility(c,placement.assetId,'sea-blue-02'),'approved');
 delete c.reviews.at(-1).reviewer;assert.throws(()=>validateLibrary(c),/reviewer/);
 assert.throws(()=>validateAssetFiles(approved()),/Stale visual approval/);
});
test('even a transparent placeholder cannot enter published puzzles without visual approval',()=>{
 const d=source();d.presentation.assetBackground='sea-blue-01';d.presentation.assetPlacements=[placement];
 assert.throws(()=>compilePuzzle(d),/library required/);
 assert.throws(()=>compilePuzzle(d,{assetLibrary:catalog()}),/visually approved/);
 const p=compilePuzzle(d,{assetLibrary:approved()});assert.deepEqual(p.solution,d.solution);assert.deepEqual(p.blocked,d.logic.blocked);
});
test('JSON loader fetches the catalog only for new placements and preserves solver output',async()=>{
 const d=source();d.presentation.assetBackground='sea-blue-01';d.presentation.assetPlacements=[placement];
 const requests=[];
 const loader=createPuzzleLoader({manifestUrl:new URL('https://example.test/sub/puzzles/manifest.json'),fetcher:async url=>{
  requests.push(String(url));return {ok:true,json:async()=>String(url).endsWith('manifest.json')?read('puzzles/manifest.json'):String(url).endsWith('library.json')?approved():d};
 }});
 assert.deepEqual((await loader.load(d.id)).solution,d.solution);
 await loader.load(d.id);assert.equal(requests.filter(u=>u.endsWith('/sub/assets/catalog/library.json')).length,1);
});
test('legacy migration preserves every historical presentation value across every puzzle',()=>{
 for(const p of read('puzzles/manifest.json').puzzles){
  const d=read('puzzles/'+p.path),compiled=compilePuzzle(d);
  assert.deepEqual(compiled.overlays,d.presentation.overlays);
  for(const o of chartOverlays(compiled.overlays)){
   const entry=LEGACY_ASSETS.find(a=>a.id===o.assetId),original=d.presentation.overlays.find(a=>a.asset===entry.reference);
   const dims=original.cells.length>2?original:entry.motif;
   for(const k of ['w','h','dx','dy'])assert.equal(o[k],dims[k]);
   assert.deepEqual(o.cells,original.cells);assert.equal(o.opacity,original.opacity);
  }
 }
});
test('file validation rejects a symlink escaping the asset root',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'asset-library-'));
 try{const c=catalog();fs.mkdirSync(path.join(temp,'assets/library'),{recursive:true});fs.symlinkSync(new URL('../../README.md',import.meta.url),path.join(temp,c.assets[0].image.path));assert.throws(()=>validateAssetFiles(c,temp),/symlink/i);}
 finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('sea-blue-01 is bound to the exact file used by the renderer, even with the same ID',()=>{
 const c=catalog();c.backgrounds[0].image='assets/seekarte/meer-pergament.webp';
 assert.throws(()=>validateLibrary(c),/rendered background/);
 const p=source();p.presentation.assetBackground='sea-blue-01';p.presentation.assetPlacements=[placement];
 assert.throws(()=>compilePuzzle(p,{assetLibrary:c}),/rendered background/);
});
test('internal file aliases and symlink path components are unsupported',()=>{
 for(const directory of [false,true]){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'asset-alias-'));
  try{
   const c=catalog();fs.mkdirSync(path.join(temp,'assets'),{recursive:true});
   if(directory)fs.symlinkSync(new URL('../../assets/library/',import.meta.url),path.join(temp,'assets/library'));
   else{
    fs.mkdirSync(path.join(temp,'assets/library'));
    fs.copyFileSync(new URL('../../assets/library/technical-single.png',import.meta.url),path.join(temp,'assets/library/original.png'));
    fs.symlinkSync('original.png',path.join(temp,c.assets[0].image.path));
   }
   assert.throws(()=>validateAssetFiles(c,temp),/symlinks are not supported/);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
 }
});
test('decoration cannot claim cells already owned by another asset',()=>{
 assert.ok(errors([placement,{id:'accent',assetId:'technical.decoration.v1',anchor:'B3'}]).some(e=>e.includes('overlapping asset footprints')));
});

test('five explicitly approved round-two images retain exact bytes and sea-blue-01 hash binding',()=>{
 const c=validateAssetFiles(catalog());
 const records=read('docs/reviews/multihex-completion/approval-preservation-audit.json');
 assert.equal(records.length,5);
 for(const record of records){
  const a=c.assets.find(a=>a.id===record.id),reviews=c.reviews.filter(r=>r.assetId===a.id);
  assert.equal(a.image.path,record.image);
  for(const r of reviews){
   assert.equal(r.status,r.backgroundId==='sea-blue-01'?'approved':'pending');
   if(r.status==='approved'){
    assert.equal(r.assetSha256,record.assetSha256);assert.equal(r.backgroundSha256,record.backgroundSha256);
    assert.match(r.reviewer,/roquas/);
   }
  }
  const changed=catalog();changed.reviews.find(r=>r.assetId===a.id&&r.status==='approved').assetSha256='0'.repeat(64);
  assert.throws(()=>validateAssetFiles(changed),/Stale visual approval/);
 }
 for(const id of ['land-coast.island.h4.crab-claw.v1','land-coast.island.h4.crab-claw.v2'])
  assert.ok(c.reviews.filter(r=>r.assetId===id).every(r=>r.status==='pending'));
});
