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
import {catalog} from '../fixtures/model/factories.mjs';

function fixture(t,{empty=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'f04b-catalog-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const library=catalog(),asset=library.assets[0],background=library.backgrounds[0];
 fs.mkdirSync(path.join(root,'assets/test'),{recursive:true});
 execFileSync('python3',['-c',
  "from PIL import Image; import sys; a=Image.new('RGBA',(360,408)); a.putpixel((180,24),(0,80,100,int(sys.argv[3]))); a.save(sys.argv[1]); Image.new('RGB',(8,8),(0,80,100)).save(sys.argv[2],format='WEBP')",
  path.join(root,asset.image.path),path.join(root,background.image),empty?'0':'1']);
 library.reviews[0].assetSha256=sha256(fs.readFileSync(path.join(root,asset.image.path)));
 library.reviews[0].backgroundSha256=sha256(fs.readFileSync(path.join(root,background.image)));
 return {library,backgroundId:background.id,resourceRoot:root};
}
const map=cell=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'shore',cells:[cell],passable:false}]});

test('adapter uses decoded complete pixels to reject a locally legal image at unsafe edge anchors',t=>{
 const input=fixture(t),context=prepareAssetCatalog(input),check=context.verification.assets[0];
 assert.ok(check.anchors.includes('C3'));assert.ok(!check.anchors.includes('A1'));
 assert.ok(check.rejected.some(p=>p.anchor==='A1'&&p.error.includes('map boundary')));
 assert.equal(assignAssets({map:map('A1'),seed:0,catalog:context}).objects[0].reason,'PIXEL_POSITION_REJECTED');
 assert.equal(assignAssets({map:map('C3'),seed:0,catalog:context}).status,'complete');
 assert.ok(createCatalogProfile(context).placements.every(p=>!p.cells.includes('A1')));
 assert.deepEqual(prepareAssetCatalog(input),context);
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
