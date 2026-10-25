import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareAssetCatalog} from '../../scripts/lib/asset-catalog.mjs';
import {sha256} from '../../scripts/lib/publication-archive.mjs';
import {assignAssets,createCatalogProfile} from '../../src/assets/assignment.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {imageContract,placedCells} from '../../src/assets/geometry.mjs';
import {asset as makeAsset,catalog} from '../fixtures/model/factories.mjs';

function fixture(t,{empty=false,cells=[[0,0]]}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'f04b-catalog-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const library=catalog([makeAsset('test.island',cells)]),asset=library.assets[0],background=library.backgrounds[0];
 const contract=imageContract(cells),top=contract.polygons[0][1];
 fs.mkdirSync(path.join(root,'assets/test'),{recursive:true});
 execFileSync('python3',['-c',
  "from PIL import Image; import sys; a=Image.new('RGBA',(int(sys.argv[4]),int(sys.argv[5]))); a.putpixel((int(sys.argv[6]),int(sys.argv[7])),(0,80,100,int(sys.argv[3]))); a.save(sys.argv[1]); Image.new('RGB',(8,8),(0,80,100)).save(sys.argv[2],format='WEBP')",
  path.join(root,asset.image.path),path.join(root,background.image),empty?'0':'1',
  String(contract.pixelWidth),String(contract.pixelHeight),String(Math.floor(4*(top[0]+contract.width/2))),String(Math.ceil(4*(top[1]+contract.height/2))+5)]);
 library.reviews[0].assetSha256=sha256(fs.readFileSync(path.join(root,asset.image.path)));
 library.reviews[0].backgroundSha256=sha256(fs.readFileSync(path.join(root,background.image)));
 return {library,backgroundId:background.id,resourceRoot:root};
}
const map=cell=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'shore',cells:[cell],passable:false}]});

test('adapter accepts a locally legal upper-tip pixel at A1 and C3 with all 25 profile positions',t=>{
 const input=fixture(t),context=prepareAssetCatalog(input),check=context.verification.assets[0];
 // Contract correction: the full local tip is allowed at the boundary too.
 assert.equal(check.anchors.length,25);assert.equal(check.rejected,undefined);
 assert.equal(assignAssets({map:map('A1'),seed:0,catalog:context}).status,'complete');
 assert.equal(assignAssets({map:map('C3'),seed:0,catalog:context}).status,'complete');
 assert.equal(createCatalogProfile(context).placements.length,25);
 assert.deepEqual(prepareAssetCatalog(input),context);
});

test('real decoded horizontal, diagonal and asymmetric tip pixels fit every geometric anchor',t=>{
 const board=new Set(HEXES.map(h=>h.id));
 for(const cells of [[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[1,1]]]){
  const context=prepareAssetCatalog(fixture(t,{cells})),asset=context.library.assets[0];
  const anchors=HEXES.map(h=>h.id).filter(anchor=>placedCells(asset,anchor).every(c=>board.has(c))).sort();
  assert.deepEqual([...context.verification.assets[0].anchors].sort(),anchors);
  assert.equal(createCatalogProfile(context).placements.length,anchors.length);
  for(const anchor of anchors){
   const m={...map(anchor),objects:[{id:'shore',cells:placedCells(asset,anchor),passable:false}]};
   assert.equal(assignAssets({map:m,seed:0,catalog:context}).status,'complete',JSON.stringify({cells,anchor}));
  }
 }
});

test('old position-dependent verifications must be prepared again under the corrected contract',t=>{
 const context=prepareAssetCatalog(fixture(t));
 context.verification.version='asset-placement-pixels-1';
 assert.throws(()=>assignAssets({map:map('A1'),seed:0,catalog:context}),/Stale or unsupported/);
 assert.throws(()=>createCatalogProfile(context),/Stale or unsupported/);
});

test('adapter rejects stale approvals and corrupt backgrounds; pure services never infer pixel validity',t=>{
 const input=fixture(t);fs.appendFileSync(path.join(input.resourceRoot,input.library.assets[0].image.path),'changed');
 assert.throws(()=>prepareAssetCatalog(input),/Stale visual approval/);
 const other=fixture(t);fs.writeFileSync(path.join(other.resourceRoot,other.library.backgrounds[0].image),'not an image');
 other.library.reviews[0].backgroundSha256=sha256(Buffer.from('not an image'));
 assert.throws(()=>prepareAssetCatalog(other),/pixel verification failed/);
});

test('invalid but hash-bound local images produce explicit image failures and no generation footprints',t=>{
 const context=prepareAssetCatalog(fixture(t,{empty:true}));assert.match(context.verification.assets[0].error,/empty image/);
 assert.equal(assignAssets({map:map('C3'),seed:0,catalog:context}).objects[0].reason,'IMAGE_CONTRACT_REJECTED');
 assert.deepEqual(createCatalogProfile(context).placements,[]);
});
