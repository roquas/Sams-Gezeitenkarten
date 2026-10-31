import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {catalogProofFixture,project} from '../fixtures/catalog-proof.mjs';
import {loadCatalogReleaseCandidate} from '../../scripts/lib/catalog-release.mjs';
import {createCatalogProof,proofPositions,renderProofSvg} from '../../scripts/lib/catalog-proof.mjs';
import {decodeContactImages} from '../../scripts/lib/map-contact-sheet.mjs';
import {main} from '../../scripts/render-catalog-proof.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {assetRectangle,imageContract,placementContract} from '../../src/assets/geometry.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';

let fixture,loaded,output,result,report,html,serial=0;
before(()=>{
 fixture=catalogProofFixture();
 loaded=loadCatalogReleaseCandidate({repositoryRoot:project,candidate:fixture.candidate});
 output=path.join(fixture.directory,'proof');
 result=createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out:output,expectedCount:33});
 report=JSON.parse(fs.readFileSync(result.report));html=fs.readFileSync(result.html,'utf8');
});
after(()=>fixture?.cleanup());
const fresh=name=>path.join(fixture.directory,name+'-'+serial++);

test('exactly the verified selection appears once, without extra assets or inferred approval',()=>{
 const ids=loaded.selection.backgrounds[0].geographicAssetIds;
 assert.deepEqual([...html.matchAll(/data-overview-asset="([^"]+)"/g)].map(m=>m[1]),ids);
 assert.deepEqual(report.selectedAssetIds,ids);assert.deepEqual(report.assets.map(a=>a.assetId),ids);
 assert.equal(report.renderedCount,ids.length);assert.equal(report.selectedCount,ids.length);
 assert.equal(report.completeness.status,'passed');assert.deepEqual(report.missingOrUnrenderable,[]);
 assert.equal(report.sourceCommit,fixture.source);assert.equal(report.candidateId,fixture.built.releaseId);
 assert.equal(report.manifestSha256,fixture.built.manifestSha256);
 assert.equal(report.states.manualVisualReview,'pending');assert.equal(report.states.formalCatalogApproval,'not-performed');
 assert.deepEqual(fs.readdirSync(fixture.candidate).sort(),['inventory.json','manifest.json','selection.json','validation.json']);
});

test('exact game polygons, complete multihex art and local graphic contracts match single review at every representative',()=>{
 const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
 let singlePassable=false,multi=false,anchorCount=0;
 for(const entry of report.assets){
  const asset=loaded.library.assets.find(a=>a.id===entry.assetId);
  const checked=loaded.validation.placements.find(p=>p.assetId===entry.assetId&&p.backgroundId===report.backgroundId);
  assert.deepEqual(entry.positions,reviewPositions(asset));
  if(asset.passable&&asset.geometry.cells.length===1)singlePassable=true;
  if(asset.geometry.cells.length>1)multi=true;
  for(const anchor of checked.anchors){
   assert.deepEqual(placementContract(asset,anchor),imageContract(asset.geometry.cells));anchorCount++;
  }
  for(const position of entry.positions){
   const svg=renderProofSvg({asset,position,library:loaded.library,background:loaded.library.backgrounds[0],resolveImage:ref=>ref});
   const rect=assetRectangle(asset,position.anchor,byId);
   assert.ok(svg.includes('data-art-cells="'+position.cells.join(' ')+'"'));
   const image=svg.match(/<image[^>]*data-asset-id[^>]*>/)[0];
   for(const key of ['x','y','width','height'])assert.ok(image.includes(key+'="'+rect[key]+'"'));
   for(const h of HEXES)assert.ok(svg.includes('data-cell="'+h.id+'" points="'+h.polygon.map(p=>p.join(',')).join(' ')+'"'));
   const polygons=placementContract(asset,position.anchor).polygons;
   assert.equal((svg.match(/data-footprint=/g)??[]).length,asset.geometry.cells.length);
   for(const polygon of polygons)assert.ok(svg.includes('points="'+polygon.map(([x,y])=>[x+rect.x+rect.width/2,y+rect.y+rect.height/2].join(',')).join(' ')+'"'));
  }
 }
 assert.ok(singlePassable&&multi);assert.ok(anchorCount>0);
});

test('unavailable classes remain explicit and anchor disagreement is rejected',()=>{
 const entry=report.assets.find(a=>a.missingClasses.length);
 assert.ok(entry,'the current multihex catalog includes unavailable classes');
 const asset=loaded.library.assets.find(a=>a.id===entry.assetId);
 assert.ok(html.includes('Nicht vorhanden:'));
 assert.throws(()=>proofPositions(asset,[]),/anchor mismatch/);
 const huge={id:'board',geometry:{cells:HEXES.map(h=>[h.q-Math.floor(h.r/2),h.r])}};
 const positions=proofPositions(huge,['A1']);
 assert.equal(positions.positions.length,1);assert.equal(positions.missingClasses.length,3);
});

test('export is byte deterministic, uses pinned resource bytes, preserves the candidate and refuses overwrite',()=>{
 const before=new Map(fs.readdirSync(fixture.candidate).map(f=>[f,fs.readFileSync(path.join(fixture.candidate,f))]));
 const second=fresh('second');createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out:second,expectedCount:33});
 const files=['index.html','review-manifest.json',...fs.readdirSync(path.join(output,'resources')).map(f=>'resources/'+f)];
 for(const f of files)assert.deepEqual(fs.readFileSync(path.join(output,f)),fs.readFileSync(path.join(second,f)));
 for(const r of report.resources){
  const bytes=fs.readFileSync(path.join(output,r.path));
  assert.equal(sha256(bytes),r.sha256);assert.deepEqual(bytes,loaded.readResource(r.source));
 }
 for(const [f,bytes] of before)assert.deepEqual(bytes,fs.readFileSync(path.join(fixture.candidate,f)));
 assert.throws(()=>createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out:output}),/EEXIST/);
 assert.throws(()=>createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out:path.join(fixture.candidate,'proof')}),/outside candidate/);
});

test('expected count mismatch is visible and never changes the selection',()=>{
 const out=fresh('unexpected'),r=createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out,expectedCount:1});
 assert.ok(r.complete);assert.equal(r.warnings.length,1);
 const m=JSON.parse(fs.readFileSync(r.report));assert.deepEqual(m.selectedAssetIds,report.selectedAssetIds);
 assert.ok(fs.readFileSync(r.html,'utf8').includes('Erwartet: 1 Motive'));
});

test('missing/corrupt candidate evidence and image resources fail explicitly',()=>{
 for(const name of ['selection.json','validation.json']){
  const copy=fresh('bad');fs.cpSync(fixture.candidate,copy,{recursive:true});fs.unlinkSync(path.join(copy,name));
  assert.throws(()=>createCatalogProof({repositoryRoot:project,candidate:copy,out:fresh('rejected')}),/incomplete candidate/);
 }
 const copy=fresh('tampered');fs.cpSync(fixture.candidate,copy,{recursive:true});fs.writeFileSync(path.join(copy,'selection.json'),'{}');
 assert.throws(()=>createCatalogProof({repositoryRoot:project,candidate:copy,out:fresh('rejected')}),/selection hash mismatch/);
 assert.throws(()=>loaded.readResource('assets/missing.png'),/not in candidate/);
 assert.throws(()=>decodeContactImages([{ref:'broken.png',bytes:Buffer.from('broken')}]),/decode failed: broken.png/i);
});

test('read-only candidate handle uses Git bytes when working resources are missing or subsequently modified',()=>{
 const root=fresh('clone');execFileSync('git',['clone','--quiet','--shared',project,root],{stdio:['ignore','pipe','pipe']});
 fs.rmSync(path.join(root,'assets'),{recursive:true});
 const handle=loadCatalogReleaseCandidate({repositoryRoot:root,candidate:fixture.candidate});
 const ref=report.resources[0].source,original=handle.readResource(ref);handle.readResource(ref).fill(0);
 assert.deepEqual(handle.readResource(ref),original);assert.ok(Object.isFrozen(handle.library));
 const r=createCatalogProof({repositoryRoot:root,candidate:fixture.candidate,out:fresh('pinned')});assert.ok(r.complete);
});

test('CLI requires explicit candidate and output; rejects duplicate/unknown options',()=>{
 for(const args of [[],['--candidate','x'],['--candidate','x','--out','x','--out','y'],['--unknown','x'],['--candidate','x','--out','y','--expected-count','-1']])assert.throws(()=>main(args));
});
