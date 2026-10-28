import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadCatalogRelease} from '../../scripts/lib/catalog-release.mjs';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {imageContract,placementContract,placedCells,assetRectangle,boardGraphicCell} from '../../src/assets/geometry.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';
import {HEXES,CHART_BOUNDS} from '../../src/ui/chart-geometry.mjs';
import {chartContract} from '../../src/ui/chart-asset-contract.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';

// Audit the actual approved release, never rebuild or approve a replacement.
const releaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
const root=fileURLToPath(new URL('../../',import.meta.url)),backgroundId='sea-blue-01';
// Independent enumeration: match axial differences to board cells rather than
// starting with the archived anchors or calling placedCells to select anchors.
const board=Array.from({length:25},(_,i)=>{
 const column=i%5,row=Math.floor(i/5);
 return {id:'ABCDE'[column]+(row+1),q:column-Math.floor(row/2),r:row};
});
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let release,catalog,selected,pinnedChart;
before(()=>{
 release=loadCatalogRelease({repositoryRoot:root,releaseId});
 ({catalog}=loadReleasedAssetCatalog({repositoryRoot:root,releaseId,backgroundId}));
 selected=release.selection.backgrounds.find(b=>b.backgroundId===backgroundId).geographicAssetIds
  .map(id=>release.library.assets.find(a=>a.id===id));
 const policy=JSON.parse(release.readResource('scripts/config/catalog-release-v1.json'));
 pinnedChart=JSON.parse(release.readResource(policy.productionBackgrounds.find(b=>b.id===backgroundId).chartContract));
});

test('approved motifs have exactly every fitting anchor, including edges and corners, with unchanged local geometry',()=>{
 assert.equal(selected.length,18);
 assert.deepEqual(chartContract(),pinnedChart);
 let total=0;
 for(const asset of selected){
  const expected=[],parities=new Set(),corners=new Set(),local=imageContract(asset.geometry.cells);
  for(const anchor of board){
   const cells=board.filter(target=>asset.geometry.cells.some(([dq,dr])=>target.q-anchor.q===dq&&target.r-anchor.r===dr))
    .map(h=>h.id).sort();
   const context=asset.id+'/'+anchor.id;
   if(cells.length!==asset.geometry.cells.length){
    assert.throws(()=>placementContract(asset,anchor.id),/extends beyond chart/,context);
    continue;
   }
   expected.push(anchor.id);total++;parities.add(anchor.r%2);
   for(const corner of ['A1','E1','A5','E5'])if(cells.includes(corner))corners.add(corner);
   assert.deepEqual(placedCells(asset,anchor.id).sort(),cells,context);
   assert.deepEqual(placementContract(asset,anchor.id),local,context);
   const map={geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'object',cells,passable:asset.passable}]};
   // Validate this exact motif, not a substitute of the same shape.
   assert.deepEqual(validatePlacements([{id:'art',assetId:asset.id,objectId:'object',anchor:anchor.id}],
    release.library,map,backgroundId),[],context);
   const rect=assetRectangle(asset,anchor.id,byId),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
   assert.equal(rect.width*4,asset.image.width,context);assert.equal(rect.height*4,asset.image.height,context);
   assert.ok(rect.x>=CHART_BOUNDS.x&&rect.y>=CHART_BOUNDS.y&&
    rect.x+rect.width<=CHART_BOUNDS.x+CHART_BOUNDS.width&&rect.y+rect.height<=CHART_BOUNDS.y+CHART_BOUNDS.height,context);
   // Every vertex follows only translation, in the original cell/vertex order.
   for(let i=0;i<rect.cells.length;i++)for(let j=0;j<6;j++){
    const [x,y]=local.polygons[i][j],expected=boardGraphicCell(byId[rect.cells[i]].center)[0][j];
    close(x+cx,expected[0]);close(y+cy,expected[1]);
   }
  }
  expected.sort();
  assert.deepEqual(release.validation.placements.find(p=>p.assetId===asset.id&&p.backgroundId===backgroundId).anchors,expected,asset.id);
  assert.deepEqual(catalog.verification.assets.find(p=>p.assetId===asset.id).anchors,expected,asset.id);
  assert.equal(parities.size,2,asset.id);
  // Some fixed multihex orientations cannot reach a particular corner at all.
  // All their fitting placements were still checked; single hexes reach all four.
  assert.ok(corners.size>0,asset.id);
  if(asset.geometry.cells.length===1)assert.equal(corners.size,4,asset.id);
 }
 assert.equal(total,368);
});

test('approved image bytes fit local cells and both archived frames clear every complete board cell',t=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'gk-position-proof-'));
 t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 // Materialize only verified release resources. No working-art fallback.
 const refs=new Set([...selected.map(a=>a.image.path),...Object.values(pinnedChart.format.files)]);
 for(const ref of refs){
  const target=path.join(temporary,ref);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,release.readResource(ref));
 }
 const run=(script,args=[],input)=>JSON.parse(execFileSync('python3',[path.join(root,'scripts',script),...args],{
  cwd:root,input:input===undefined?undefined:JSON.stringify(input),encoding:'utf8',maxBuffer:4*1024*1024,
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},stdio:['pipe','pipe','pipe']}));
 // Reuse the strict complete-pixel-square validator once per local image.
 // The exhaustive equality proof above transfers this result to all anchors.
 const images=run('check-catalog-release-images.py',[],{
  assets:selected.map(a=>({path:path.join(temporary,a.image.path),contract:imageContract(a.geometry.cells)})),
  backgrounds:[path.join(temporary,pinnedChart.format.files.sea)]});
 assert.equal(images.assets.length,18);
 for(let i=0;i<selected.length;i++){
  const evidence=release.validation.assets.find(a=>a.assetId===selected[i].id);
  assert.deepEqual(images.assets[i],{format:evidence.format,width:evidence.width,height:evidence.height});
 }
 const contractPath=path.join(temporary,'contract.json');fs.writeFileSync(contractPath,JSON.stringify(pinnedChart));
 const frames=run('check-chart-assets.py',['--root',temporary,'--contract',contractPath]);
 assert.equal(frames.status,'passed');assert.deepEqual(frames.errors,[]);
 for(const kind of ['frame','quietFrame'])assert.deepEqual(frames.files[kind].geographic_graphic_cells,
  {tested_pixel_squares:2234040,overlapping_alpha_pixels:0});
});
