import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {contactBatchFixture} from '../fixtures/contact-sheet/batch.mjs';
import {readB1Experiment} from '../../scripts/lib/puzzle-experiment.mjs';
import {canonicalJson,sha256} from '../../scripts/lib/content-hash.mjs';

let fixture,b1,serial=0;
const read=(directory,file)=>JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
const write=(directory,file,value)=>fs.writeFileSync(path.join(directory,file),JSON.stringify(value)+'\n');
const mapRows=directory=>fs.readFileSync(path.join(directory,'maps.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const changeMaps=(directory,change)=>{const rows=mapRows(directory);change(rows);fs.writeFileSync(path.join(directory,'maps.jsonl'),rows.map(JSON.stringify).join('\n')+'\n');};
before(()=>{
 fixture=contactBatchFixture({targetCount:3,maxAttempts:40,assignmentSeedStart:100000,config:{objectCount:{min:0,max:7},maxMapAttempts:1}});
 b1=path.join(fixture.directory,'b1');
 execFileSync(process.execPath,[path.join(fixture.program,'scripts/run-route-experiment.mjs'),'--batch',fixture.batch,
  '--accepted-indices','1,2','--max-nodes-per-start','100000','--out',b1]);
});
after(()=>fixture?.cleanup());
const copy=()=>{const directory=path.join(fixture.directory,'tampered-'+serial++);fs.cpSync(b1,directory,{recursive:true});return directory;};
function rebindSource(directory,batch){
 const manifest=read(directory,'manifest.json');
 manifest.input.files=manifest.input.files.map(({file})=>({file,sha256:sha256(fs.readFileSync(path.join(batch,file)))}));
 manifest.input.batchManifest=read(batch,'manifest.json');manifest.input.batchSummary=read(batch,'summary.json');
 const {experimentId:oldId,input,...settings}=manifest;
 const identity=(kind,value)=>`gk-b1-${kind}-sha256:${sha256(canonicalJson(value))}`;
 manifest.experimentId=identity('run',{...settings,input:{files:input.files,acceptedIndices:input.acceptedIndices}});
 write(directory,'manifest.json',manifest);
 const rows=mapRows(directory);
 for(const row of rows){
  row.experimentId=manifest.experimentId;row.mapTrialId=identity('map',{experimentId:row.experimentId,acceptedIndex:row.source.acceptedIndex,mapFingerprint:row.mapFingerprint});
  for(const start of row.starts)start.trialId=identity('start',{mapTrialId:row.mapTrialId,start:start.cell});
 }
 fs.writeFileSync(path.join(directory,'maps.jsonl'),rows.map(JSON.stringify).join('\n')+'\n');
 const summary=read(directory,'summary.json');summary.experimentId=manifest.experimentId;write(directory,'summary.json',summary);
}

test('P2-2: valid existing B1 format-1 experiments remain readable with their original batch',async()=>{
 const result=await readB1Experiment(b1,{batch:fixture.batch});assert.equal(result.rows.length,2);
 assert.equal(result.manifest.experimentFormatVersion,1);
});

test('P2-2: unchanged B1 example from reviewed c74899a is accepted with its hash-bound original source',async()=>{
 const b1=new URL('../../docs/verification/B2-example/b1/',import.meta.url);
 const batch=new URL('../../docs/verification/B2-example/source-batch/',import.meta.url);
 const result=await readB1Experiment(b1.pathname,{batch:batch.pathname});
 assert.equal(result.rows.length,4);assert.equal(result.manifest.program.commit,'948b29ec5ddc09952e5edd2a34d86627d89914ad');
});

test('P2-2: valid B1 budget-incomplete counts remain acceptable',async()=>{
 const directory=path.join(fixture.directory,'b1-incomplete');
 execFileSync(process.execPath,[path.join(fixture.program,'scripts/run-route-experiment.mjs'),'--batch',fixture.batch,
  '--accepted-indices','1,2','--max-nodes-per-start','1','--out',directory]);
 const result=await readB1Experiment(directory,{batch:fixture.batch});assert.equal(result.summary.countExact,false);
 assert.ok(result.rows.some(row=>row.status==='unknown'));
});

test('P2-2: a regularly completed source with zero accepted maps retains valid empty B1 selection',async()=>{
 const empty=contactBatchFixture({targetCount:1,maxAttempts:1,config:{objectCount:1,objectSizes:[25],maxMapAttempts:1}});
 try{
  const directory=path.join(empty.directory,'b1');
  execFileSync(process.execPath,[path.join(empty.program,'scripts/run-route-experiment.mjs'),'--batch',empty.batch,
   '--accepted-indices','all','--max-nodes-per-start','100000','--out',directory]);
  const result=await readB1Experiment(directory,{batch:empty.batch});assert.deepEqual(result.rows,[]);
 }finally{empty.cleanup();}
});

for(const [name,change] of [
 ['nonexistent embedded release',directory=>{const manifest=read(directory,'manifest.json');manifest.input.batchManifest.provenance.releaseId='gk-catalog-release-v1-sha256-'+'0'.repeat(64);write(directory,'manifest.json',manifest);}],
 ['nonexistent saved motif',directory=>changeMaps(directory,rows=>{rows[0].assetPlacements[0].assetId='nonexistent-motif';})],
 ['negative assignment seed',directory=>changeMaps(directory,rows=>{rows[0].source.assignmentSeed=-1;})],
 ['wrong generation seed',directory=>changeMaps(directory,rows=>{rows[0].source.generationSeed++;})],
 ['wrong original candidate index',directory=>changeMaps(directory,rows=>{rows[0].source.candidateIndex++;})],
 ['changed embedded seed plan',directory=>{const manifest=read(directory,'manifest.json');manifest.input.batchManifest.options.assignmentSeedStart=-1;write(directory,'manifest.json',manifest);}],
 ['changed embedded batch summary',directory=>{const manifest=read(directory,'manifest.json');manifest.input.batchSummary.attemptedCount++;write(directory,'manifest.json',manifest);}]
])test('P2-2: rejects '+name,async()=>{
 const directory=copy();change(directory);
 await assert.rejects(async()=>readB1Experiment(directory,{batch:fixture.batch}));
});

test('P2-2: the recorded source hashes bind exact original bytes, including unselected records',async()=>{
 const batch=path.join(fixture.directory,'changed-source');fs.cpSync(fixture.batch,batch,{recursive:true});
 // Semantically unchanged JSONL still has different bytes. The original B1
 // hashes must reject it before a newly validated batch can replace provenance.
 fs.appendFileSync(path.join(batch,'candidates.jsonl'),'\n');
 await assert.rejects(async()=>readB1Experiment(b1,{batch}));
});

for(const [name,change,expected] of [
 ['release',batch=>{const manifest=read(batch,'manifest.json');manifest.provenance.releaseId='gk-catalog-release-v1-sha256-'+'0'.repeat(64);write(batch,'manifest.json',manifest);},/release/],
 ['seed plan',batch=>{const manifest=read(batch,'manifest.json');manifest.options.assignmentSeedStart=-1;write(batch,'manifest.json',manifest);},/seed|Seed/],
 ['unselected assignment',batch=>{
  for(const file of ['candidates.jsonl','accepted.jsonl']){
   const rows=fs.readFileSync(path.join(batch,file),'utf8').trim().split('\n').map(JSON.parse);
   rows.find(row=>row.assignment?.placements.length).assignment.placements[0].assetId='nonexistent-motif';
   fs.writeFileSync(path.join(batch,file),rows.map(JSON.stringify).join('\n')+'\n');
  }
 },/saved assignment mismatch/]
])test('P2-2: existing batch/release validator rejects forged '+name+' even after all B1 source hashes are rebound',async()=>{
 const directory=copy(),batch=path.join(fixture.directory,'forged-source-'+serial++);
 fs.cpSync(fixture.batch,batch,{recursive:true});change(batch);rebindSource(directory,batch);
 await assert.rejects(()=>readB1Experiment(directory,{batch}),expected);
});

test('P2-2: CLI rejects manipulated provenance before reserving output or starting candidate search',()=>{
 for(const change of [
  directory=>{const manifest=read(directory,'manifest.json');manifest.input.batchManifest.provenance.releaseId='nonexistent-release';write(directory,'manifest.json',manifest);},
  directory=>changeMaps(directory,rows=>{rows[0].assetPlacements[0].assetId='nonexistent-motif';}),
  directory=>changeMaps(directory,rows=>{rows[0].source.assignmentSeed=-1;})
 ]){
  const directory=copy(),out=path.join(fixture.directory,'refused-'+serial++);change(directory);
  const result=spawnSync(process.execPath,[path.join(fixture.program,'scripts/run-puzzle-experiment.mjs'),
   '--b1',directory,'--batch',fixture.batch,'--out',out,'--seed','42','--route-indices','0',
   '--max-nodes-per-start','1','--max-clue-parameters','100000','--max-restarts','6','--max-solver-checks','2000',
   '--max-match-evaluations','5000000','--max-route-filter-evaluations','20000000'],{encoding:'utf8'});
  assert.ifError(result.error);assert.equal(result.status,1);assert.equal(result.stdout,'');assert.ok(!fs.existsSync(out));
 }
});
