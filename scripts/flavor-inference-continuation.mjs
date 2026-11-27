// Operates exclusively on an explicitly isolated continuation copy, never its sources.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {parseQualityResponse} from './lib/flavor-quality-json.mjs';import {sha256} from './lib/content-hash.mjs';import {publishTree,seal,directory,withStoreLock} from './lib/immutable-file-store.mjs';
import {openPlan,refresh} from './flavor-handoff.mjs';import {openInferenceConnection,connectInferenceBatch} from './lib/flavor-inference-connection.mjs';
const json=v=>JSON.stringify(v,null,2)+'\n',parse=p=>parseQualityResponse(fs.readFileSync(p));
export async function openContinuation(file){
 const config=parse(file),root=fs.realpathSync(path.dirname(path.resolve(file)));assert.equal(config.version,1);assert.equal(config.mode,'isolated-continuation');
 const operatorFile=path.resolve(root,config.operatorPlan);assert.ok(operatorFile.startsWith(root+path.sep),'operator plan must be inside isolated root');const operator=parse(operatorFile),operatorRoot=path.dirname(operatorFile);
 for(const d of operator.datasets)for(const field of ['production','quality']){const real=fs.realpathSync(path.resolve(operatorRoot,d[field]));assert.ok(real.startsWith(root+path.sep),'store must be inside isolated continuation root');}
 const ctx=await openPlan(operatorFile),connections=new Map();
 for(const id of new Set(config.cases.map(c=>c.datasetId))){const d=ctx.datasets.find(d=>d.id===id);assert.ok(d);const connection=openInferenceConnection({directory:path.join(root,'inference-store',id),quality:d.quality,runtimeCommit:d.codeCommit}),{openFlavorBatch}=await import(pathToFileURL(path.resolve(operatorRoot,d.codeRoot,'scripts/lib/flavor-batch.mjs')).href);connections.set(id,connection);d.batch=connectInferenceBatch({openFlavorBatch,connection,production:d.production,batchId:d.batchId});d.quality=connection.quality;}
 const jobs=new Map();for(const c of config.cases){const job=parse(path.resolve(root,c.package,'review/job.json'));assert.ok(!jobs.has(job.jobId));connections.get(c.datasetId).register(job);jobs.set(job.jobId,{connection:connections.get(c.datasetId),job});}
 return {root,ctx,config,jobs};
}
export async function runContinuation(file,{importResponses=false}={}){
 const {root,ctx,config,jobs}=await openContinuation(file);directory(root+'/EINGANG');directory(root+'/arrivals');const imports=[];
 if(importResponses)withStoreLock(root,()=>{for(const name of fs.readdirSync(root+'/EINGANG').sort()){
  const p=path.join(root,'EINGANG',name);if(!fs.lstatSync(p).isFile()||fs.lstatSync(p).isSymbolicLink()){imports.push({status:'rejected',diagnostic:'regular files only'});continue;}
  const raw=fs.readFileSync(p),digest=sha256(raw);publishTree(root+'/arrivals/'+digest,seal(new Map([['response.bin',raw]])));
  try{const response=parseQualityResponse(raw),entry=jobs.get(response.jobId);assert.ok(entry,'unknown job');const result=entry.connection.importResponse({jobId:response.jobId,responseBytes:raw,kind:config.evidenceKind??'external-manual'});imports.push({status:result.created?'accepted':'unchanged',jobId:response.jobId});}catch(error){publishTree(root+'/arrivals/'+digest+'-diagnostic',seal(new Map([['diagnostic.txt',error.message]])));imports.push({status:'rejected'});}
 }});
 const transport=refresh(ctx),report={version:1,connection:'f02b-inference-store-connection-1',imports,transport,datasets:ctx.datasets.map(d=>({id:d.id,qualificationView:d.report.qualificationView??null,summary:d.report.summary,work:d.report.work.map(w=>({kind:w.kind,jobId:w.jobId}))}))};
 fs.writeFileSync(root+'/CONTINUATION.json',json(report));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{const [cmd,file]=process.argv.slice(2);assert.ok(['resume','import'].includes(cmd));const r=await runContinuation(file,{importResponses:cmd==='import'});console.log(json({connection:r.connection,imports:r.imports.reduce((a,i)=>(a[i.status]=(a[i.status]??0)+1,a),{}),datasets:r.datasets.map(d=>({id:d.id,counts:d.summary.counts}))}));}catch{console.error('Continuation blocked; check private bindings and isolated paths.');process.exitCode=1;}}
