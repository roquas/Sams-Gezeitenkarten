import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {catalogProofFixture,project} from '../fixtures/catalog-proof.mjs';
import {loadCatalogReleaseCandidate} from '../../scripts/lib/catalog-release.mjs';
import {createCatalogProof,relativeReviewGeometry,renderProofSvg} from '../../scripts/lib/catalog-proof.mjs';
import {decodeContactImages} from '../../scripts/lib/map-contact-sheet.mjs';
import {main} from '../../scripts/render-catalog-proof.mjs';
import {imageContract} from '../../src/assets/geometry.mjs';
import {hexCenter,hexVertices} from '../../src/ui/place-labels.mjs';
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

test('one relative shape uses original image contracts and gameplay vertices for all selected motifs',()=>{
 let passable=false,blocked=false,multi=false;
 for(const entry of report.assets){
  const asset=loaded.library.assets.find(a=>a.id===entry.assetId);
  assert.deepEqual(entry.occupiedCells,asset.geometry.cells);
  assert.equal(entry.occupiedHexCount,asset.geometry.cells.length);assert.equal(entry.passable,asset.passable);
  passable ||= asset.passable;blocked ||= !asset.passable;multi ||= asset.geometry.cells.length>1;
  const {contract,hexPolygons}=relativeReviewGeometry(asset);
  assert.deepEqual(contract,imageContract(asset.geometry.cells));
  // hexCenter's offset-row domain is nonnegative. A common axial translation
  // into that domain cancels at the centroid; no board anchor is selected.
  const rowShift=-Math.min(0,...asset.geometry.cells.map(c=>c[1]));
  const centers=asset.geometry.cells.map(([q,r])=>{r+=rowShift;return hexCenter({q:q+Math.floor(r/2),r});});
  const centroid=[0,1].map(axis=>centers.reduce((n,c)=>n+c[axis]/centers.length,0));
  centers.forEach((center,i)=>hexVertices(center[0]-centroid[0],center[1]-centroid[1]).forEach((v,j)=>{
   for(let axis=0;axis<2;axis++)assert.ok(Math.abs(v[axis]-hexPolygons[i][j][axis])<1e-10);
  }));
  const svg=renderProofSvg({asset,background:loaded.library.backgrounds[0],resolveImage:ref=>ref});
  const image=svg.match(/<image[^>]*data-asset-id[^>]*>/)[0];
  for(const [key,value] of Object.entries({x:-contract.width/2,y:-contract.height/2,width:contract.width,height:contract.height}))assert.ok(image.includes(key+'="'+value+'"'));
  assert.equal((svg.match(/data-relative-cell=/g)??[]).length,2*asset.geometry.cells.length);
  for(const polygon of [...contract.polygons,...hexPolygons])assert.ok(svg.includes('points="'+polygon.map(p=>p.join(',')).join(' ')+'"'));
 }
 assert.ok(passable&&blocked&&multi);
 assert.equal((html.match(/data-detail="/g)??[]).length,report.selectedCount);
 assert.equal(report.reviewSchemaVersion,2);assert.equal(report.resourceIntegrity.status,'passed');
 assert.doesNotMatch(JSON.stringify(report),/positions|anchor|parity|missingClasses|positionSelection/i);
 assert.doesNotMatch(html,/Prüfposition|Lageklasse|Innenlage|Zeilenparität|whole-board|data-anchor|position-select| Anker/);
});

test('relative display adds no board-fitting restrictions and preserves concave and negative-coordinate shapes',()=>{
 const shapes=[[[0,0]],[[0,0],[-1,0],[0,-1]],[[0,0],[1,-1],[2,-1],[2,0],[1,1],[0,1]],Array.from({length:25},(_,q)=>[q,0])];
 for(const cells of shapes){
  const asset={id:'relative-form',geometry:{cells},image:{path:'test.png'}};
  const {contract,hexPolygons}=relativeReviewGeometry(asset);
  assert.deepEqual(contract,imageContract(cells));assert.equal(hexPolygons.length,cells.length);
  const svg=renderProofSvg({asset,background:loaded.library.backgrounds[0],resolveImage:ref=>ref});
  assert.equal((svg.match(/data-relative-cell=/g)??[]).length,2*cells.length);
  assert.ok(svg.includes('width="'+contract.width+'"'));assert.ok(svg.includes('height="'+contract.height+'"'));
 }
 const invalid={geometry:{cells:[[0,0],[2,0]]}};
 assert.throws(()=>relativeReviewGeometry(invalid),/edge-connected/);
 assert.throws(()=>imageContract(invalid.geometry.cells),/edge-connected/);
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
