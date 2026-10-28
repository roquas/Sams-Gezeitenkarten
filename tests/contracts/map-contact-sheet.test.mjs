import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {contactBatchFixture,project,releaseId} from '../fixtures/contact-sheet/batch.mjs';
import {readContactBatch,selectCandidateIndices,renderContactSvg,createMapContactSheet,decodeContactImages} from '../../scripts/lib/map-contact-sheet.mjs';
import {main} from '../../scripts/render-map-contact-sheet.mjs';
import {assetRectangle} from '../../src/assets/geometry.mjs';
import {HEXES,CHART_VIEWBOX,CHART_BOUNDS} from '../../src/ui/chart-geometry.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';

let fixture,loaded,serial=0;
before(async()=>{fixture=contactBatchFixture();loaded=await readContactBatch({batch:fixture.batch,indices:[10,0,9]});});
after(()=>fixture?.cleanup());
const fresh=name=>path.join(fixture.directory,name+'-'+serial++);
function modified(change){
 const batch=fresh('modified');fs.cpSync(fixture.batch,batch,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(batch,'manifest.json'))),rows=fs.readFileSync(path.join(batch,'candidates.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 change({manifest,rows,batch});
 fs.writeFileSync(path.join(batch,'manifest.json'),JSON.stringify(manifest));
 fs.writeFileSync(path.join(batch,'candidates.jsonl'),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');return batch;
}

test('selection is explicit, zero-based, unique and preserves caller order',()=>{
 assert.deepEqual(selectCandidateIndices([10,0,9],24),[10,0,9]);
 for(const value of [undefined,[],[1,1],[-1],[24],[1.5],['0'],[Number.MAX_SAFE_INTEGER+1]])assert.throws(()=>selectCandidateIndices(value,24));
 assert.deepEqual(loaded.rows.map(r=>r.index),[10,0,9]);
 assert.deepEqual(loaded.rows.map(r=>r.assignment.status),['complete','partial','none']);
 assert.equal(loaded.released.provenance.releaseId,releaseId);
 assert.equal(loaded.manifest.program.commit,'e671d1875813740aecc993437783e65c345c9926');
});

test('refuses format, profile, provenance, seeds, fingerprints and saved assignment drift before output',async()=>{
 for(const change of [
  ({manifest:m})=>m.batchFormatVersion=2,({manifest:m})=>m.versions.assignment='other',
  ({manifest:m})=>m.program.commit='invalid',({manifest:m})=>m.catalogProfile=null,
  ({manifest:m})=>m.provenance.releaseId='latest',({manifest:m})=>m.provenance.backgroundId='unapproved',
  ({manifest:m})=>m.provenance.catalogSha256='0'.repeat(64),({manifest:m})=>m.provenance.sourceCommit='0'.repeat(40),
  ({rows:r})=>r[0].index=1,({rows:r})=>r[23].assignmentSeed++,({rows:r})=>r[23].mapFingerprint='wrong',
  ({rows:r})=>r[0].generation.diagnostics.seed++,({rows:r})=>r[0].generation.diagnostics.config.passableProbability=0,
  ({rows:r})=>r[0].generation.diagnostics.catalogProfile=null,({rows:r})=>r[0].assignment.diagnostics.assignedCount++,
  ({rows:r})=>r[0].assignment.placements[0].anchor='E5',({rows:r})=>r[0].error={phase:'assignment'},
  ({rows:r})=>r.pop(),({rows:r})=>r.push(r[0]),
  ({batch})=>fs.unlinkSync(path.join(batch,'summary.json')),
  ({batch})=>{const p=path.join(batch,'summary.json'),s=JSON.parse(fs.readFileSync(p));s.assignment.statuses.partial++;fs.writeFileSync(p,JSON.stringify(s));}
 ]){
  const batch=modified(change),out=fresh('refused');
  await assert.rejects(createMapContactSheet({batch,indices:[0],out}));assert.ok(!fs.existsSync(out));
 }
 const batch=modified(()=>{});fs.appendFileSync(path.join(batch,'candidates.jsonl'),'{"index":');
 await assert.rejects(readContactBatch({batch,indices:[0]}));
});

test('mapless outcomes are reported explicitly instead of silently skipping chosen candidates',async()=>{
 const batch=modified(({rows})=>{
  const r=rows[0];r.generation.status='exhausted';r.generation.map=null;r.mapFingerprint=null;r.assignment=null;
 });
 await assert.rejects(readContactBatch({batch,indices:[0]}),/no geographic map to preview/);
});

test('free batches and empty complete maps render without invented objects',async()=>{
 const empty=contactBatchFixture({mode:'free',count:2,config:{objectCount:0}});
 try{
  const out=path.join(empty.directory,'sheet');
  await createMapContactSheet({batch:empty.batch,indices:[1,0],out});
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.ok(html.includes('Modus: free'));assert.ok(html.includes('0 illustriert · 0 ohne Illustration'));
  assert.ok(!html.includes('data-unillustrated-object='));assert.ok(!html.includes('data-asset-id='));
 }finally{empty.cleanup();}
});

test('SVG reuses full chart bounds, exact asset rectangles and actual missing hex polygons',()=>{
 const byId=Object.fromEntries(HEXES.map(h=>[h.id,h])),library=loaded.released.catalog.library;
 for(const row of loaded.rows){
  const svg=renderContactSvg(row,library,loaded.released.chartContract.format.files,ref=>ref);
  assert.ok(svg.includes('viewBox="'+CHART_VIEWBOX+'"'));
  for(const p of row.assignment.placements){
   const asset=library.assets.find(a=>a.id===p.assetId),{cells,...rect}=assetRectangle(asset,p.anchor,byId);
   const image=svg.match(new RegExp('<image[^>]*data-placement-id="'+p.id+'"[^>]*>'))[0];
   for(const [key,value] of Object.entries(rect))assert.ok(image.includes(key+'="'+value+'"'),key);
   assert.ok(image.includes('preserveAspectRatio="xMidYMid meet"'));
   assert.ok(image.includes('mix-blend-mode:plus-lighter'));
   assert.ok(image.includes('data-art-cells="'+cells.join(' ')+'"'));
  }
  for(const object of row.generation.map.objects){
   const missing=row.assignment.objects.find(o=>o.objectId===object.id).status==='unassigned';
   assert.equal(svg.includes('data-unillustrated-object="'+object.id+'"'),missing);
   if(missing)for(const cell of object.cells)assert.ok(svg.includes('points="'+byId[cell].polygon.map(p=>p.join(',')).join(' ')+'"'));
  }
  assert.ok(svg.indexOf('data-chart-layer="sea"')<svg.indexOf('data-chart-layer="objects"'));
  assert.ok(svg.indexOf('data-chart-layer="technical-placeholders"')<svg.indexOf('data-chart-layer="frame"'));
  assert.ok(svg.includes('id="candidate-'+row.index+'-approved-sea-clip"'));
  for(const [key,value] of Object.entries(CHART_BOUNDS))assert.ok(svg.includes(key+'="'+value+'"'));
 }
});

test('decode errors name the resource; valid approved transparent PNG/WebP bytes decode without a pixel checker',()=>{
 const {released}=loaded;
 const refs=[released.chartContract.format.files.sea,released.chartContract.format.files.frame,
  released.catalog.library.assets.find(a=>a.id===loaded.rows[0].assignment.placements[0].assetId).image.path];
 decodeContactImages(refs.map(ref=>({ref,bytes:released.readResource(ref)})));
 assert.throws(()=>decodeContactImages([{ref:'damaged.webp',bytes:Buffer.from('not an image')}]),/decode failed: damaged.webp/i);
 assert.throws(()=>released.readResource('assets/missing.png'),/resource not in release/);
});

test('static output is byte reproducible, deduplicates pinned resources and never overwrites',async()=>{
 const first=fresh('sheet'),second=fresh('sheet'),args={batch:fixture.batch,indices:[10,0,9]};
 await createMapContactSheet({...args,out:first});await createMapContactSheet({...args,out:second});
 const files=fs.readdirSync(path.join(first,'resources')).sort();
 assert.deepEqual(files,fs.readdirSync(path.join(second,'resources')).sort());
 for(const file of ['index.html',...files.map(f=>'resources/'+f)])assert.deepEqual(fs.readFileSync(path.join(first,file)),fs.readFileSync(path.join(second,file)));
 const html=fs.readFileSync(path.join(first,'index.html'),'utf8');
 assert.equal((html.match(/<article\b/g)??[]).length,3);assert.ok(!html.includes('<script src='));
 assert.ok(!html.includes('https://released.invalid'));
 for(const row of loaded.rows)assert.ok(html.includes(row.mapFingerprint));
 for(const file of files)assert.equal(sha256(fs.readFileSync(path.join(first,'resources',file))),file.split('.')[0]);
 await assert.rejects(createMapContactSheet({...args,out:first}),/EEXIST/);
 assert.equal(fs.readFileSync(path.join(first,'index.html'),'utf8'),html);
});

test('release reads ignore absent working assets, reject unavailable releases, and never use a fallback',async()=>{
 const root=fresh('data');execFileSync('git',['clone','--quiet','--shared',project,root],{stdio:['ignore','pipe','pipe']});
 fs.rmSync(path.join(root,'assets'),{recursive:true});
 const out=fresh('pinned');await createMapContactSheet({batch:fixture.batch,indices:[10,0,9],repositoryRoot:root,out});
 const bad=modified(({manifest:m})=>m.provenance.releaseId='gk-catalog-release-v1-sha256-'+'0'.repeat(64));
 await assert.rejects(readContactBatch({batch:bad,indices:[0],repositoryRoot:root}),/incomplete release/);
});

test('CLI rejects malformed, implicit or duplicate selection options',async()=>{
 for(const args of [[],['--batch','x'],['--batch','x','--indices','1-12','--out','x'],['--batch','x','--indices','00','--out','x'],
  ['--batch','x','--indices','0','--out','x','--indices','1'],['--unknown','x']])await assert.rejects(main(args));
});
