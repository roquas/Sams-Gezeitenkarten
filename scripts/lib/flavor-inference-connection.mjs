// Explicit opt-in view over a pinned legacy store, never a migration of its method.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {directory,readTree,seal,unseal,publishTree,withStoreLock,localId} from './immutable-file-store.mjs';
import {parseQualityResponse} from './flavor-quality-json.mjs';import {sha256} from './content-hash.mjs';import {hash} from './flavor-quality-contract.mjs';
import {createSupplement,evaluateSupplement,blockedClaims,METHOD_HASH} from './flavor-reader-inference.mjs';
export const CONNECTION_METHOD='f02b-inference-store-connection-1';
const json=v=>JSON.stringify(v,null,2)+'\n',parse=p=>parseQualityResponse(fs.readFileSync(p));
export function openInferenceConnection({directory:root,quality,runtimeCommit}){
 assert.match(runtimeCommit,/^[a-f0-9]{40}$/);directory(root);for(const d of ['jobs','imports'])directory(path.join(root,d));
 function source(job){return quality.readSession(()=>sourceSnapshot(job));}
 function sourceSnapshot(job){
  const p=job.provenance,saved=quality.loadJob(p.legacyJobId);assert.equal(saved.job.stage,'reviewer');assert.equal(sha256(saved.files.get('job.json')),p.legacyJobHash);assert.equal(saved.job.methodHash,p.legacyMethodHash);assert.equal(runtimeCommit,p.legacyCommit);
  const item=saved.job.items.find(i=>i.itemId===p.legacyItemId);assert.ok(item);assert.equal(item.inputHash,p.legacyInputHash);
  assert.equal(hash(job.input),hash({public:item.input.public,originals:item.input.originals,reader:item.input.reader}));
  const accepted=quality.evidence(p.legacyJobId).results.find(r=>r.result.itemId===p.legacyItemId);assert.ok(accepted,'accepted historical reviewer required');
  // Verify raw accepted imports with the strict parser, including the parent Reader.
  const binding=saved.sidecar.items.find(i=>i.itemId===item.itemId),ids=[p.legacyJobId,binding.readerJobId];let reviewRaw=false;
  for(const name of fs.readdirSync(path.join(quality.directory,'imports')).filter(n=>!n.startsWith('.'))){const files=unseal(readTree(path.join(quality.directory,'imports',name))),receipt=parseQualityResponse(files.get('receipt.json'));if(!ids.includes(receipt.jobId))continue;const raw=files.get('response.json');const response=parseQualityResponse(raw);assert.equal(sha256(raw),receipt.responseSha256);if(receipt.jobId===p.legacyJobId&&sha256(raw)===p.legacyResponseHash){assert.equal(hash(response.items.find(i=>i.itemId===p.legacyItemId)),hash(accepted.result),'bound raw must contain the accepted review');reviewRaw=true;}}
  assert.ok(reviewRaw,'bound accepted reviewer raw bytes required');
  const status=quality.inspect(p.legacyJobId).items.find(i=>i.itemId===p.legacyItemId);assert.ok(status?.applicable&&status.reader&&status.comparison&&status.review,'current complete historical chain required');
  assert.deepEqual(blockedClaims(status),job.claimIds);
  // Never use an earlier assessment to bypass an answered clarification or a discard.
  for(const id of fs.readdirSync(path.join(quality.directory,'jobs')).filter(n=>!n.startsWith('.'))){const child=quality.loadJob(id);if(child.job.stage==='reader'&&child.sidecar.clarification?.jobId===p.legacyJobId&&child.sidecar.clarification.itemId===p.legacyItemId)assert.equal(quality.evidence(id).results.length,0,'answered clarification supersedes earlier inference target');}
  const batches=path.join(quality.directory,'batches');if(fs.existsSync(batches))for(const id of fs.readdirSync(batches).filter(n=>!n.startsWith('.'))){const events=path.join(batches,id,'events');if(!fs.existsSync(events))continue;for(const n of fs.readdirSync(events).filter(n=>!n.startsWith('.'))){const event=parseQualityResponse(unseal(readTree(path.join(events,n))).get('event.json'));if(event.type==='discarded')assert.ok(event.data.caseId!==status.revisionRef.caseId||event.data.variant!==status.revisionRef.flavorVariantId,'discarded variant cannot be requalified');}}
  return status;
 }
 function register(job){return withStoreLock(root,()=>{assert.deepEqual(job,createSupplement(job.input,job.claimIds,job.provenance));source(job);localId(job.jobId);for(const id of fs.readdirSync(path.join(root,'jobs')).filter(n=>!n.startsWith('.'))){const existing=load(id);if(existing.provenance.legacyJobId===job.provenance.legacyJobId&&existing.provenance.legacyItemId===job.provenance.legacyItemId)assert.equal(existing.jobId,job.jobId,'an assessment already has a fixed supplemental binding');}return publishTree(path.join(root,'jobs',job.jobId),seal(new Map([['job.json',json(job)]])));});}
 function load(id){localId(id);return parseQualityResponse(unseal(readTree(path.join(root,'jobs',id))).get('job.json'));}
 function imported(job){const at=path.join(root,'imports',job.jobId);if(!fs.existsSync(at))return null;const files=unseal(readTree(at)),raw=files.get('response.bin'),receipt=parseQualityResponse(files.get('receipt.json'));assert.equal(receipt.methodHash,METHOD_HASH);assert.equal(receipt.inputHash,job.inputHash);assert.equal(receipt.responseHash,sha256(raw));assert.ok(['external-manual','technical-test'].includes(receipt.kind));assert.deepEqual(receipt,{version:1,connectionMethod:CONNECTION_METHOD,methodHash:METHOD_HASH,inputHash:job.inputHash,responseHash:sha256(raw),kind:receipt.kind,model:null,producedAt:null});return {raw,receipt,response:parseQualityResponse(raw)};}
 function importResponse({jobId,responseBytes,kind}){return withStoreLock(root,()=>{assert.ok(['external-manual','technical-test'].includes(kind));const response=parseQualityResponse(responseBytes),job=load(jobId),status=source(job),result=evaluateSupplement(job,response,status,{kind}),prior=imported(job);if(prior){assert.equal(hash(prior.response),hash(response),'conflicting supplemental repeat');assert.equal(prior.receipt.kind,kind,'cannot relabel provenance');if(!prior.raw.equals(responseBytes)){directory(path.join(root,'duplicates',jobId));publishTree(path.join(root,'duplicates',jobId,sha256(responseBytes)),seal(new Map([['response.bin',responseBytes]])));}return {created:false,result};}
  const receipt={version:1,connectionMethod:CONNECTION_METHOD,methodHash:METHOD_HASH,inputHash:job.inputHash,responseHash:sha256(responseBytes),kind,model:null,producedAt:null};publishTree(path.join(root,'imports',jobId),seal(new Map([['response.bin',responseBytes],['receipt.json',json(receipt)]])));return {created:true,result};});}
 function inspect(jobId,options){return quality.readSession(()=>inspectSnapshot(jobId,options));}
 function inspectSnapshot(jobId,options){const base=quality.inspect(jobId,options);return {...base,baseMethodHash:base.methodHash,methodHash:METHOD_HASH,qualificationView:{method:CONNECTION_METHOD,methodHash:METHOD_HASH,runtimeCommit},items:base.items.map(status=>{
  if(base.stage!=='reviewer'||!status.applicable||!status.reader||!status.review||!status.comparison||status.evidenceKind==='technical-test')return status;
  const candidates=fs.readdirSync(path.join(root,'jobs')).filter(n=>!n.startsWith('.')).map(load).filter(j=>j.provenance.legacyJobId===jobId&&j.provenance.legacyItemId===status.itemId);
  for(const job of candidates){const accepted=imported(job);if(!accepted||accepted.receipt.kind!=='external-manual')continue;let result;try{source(job);result=evaluateSupplement(job,accepted.response,status,{kind:accepted.receipt.kind});}catch{continue;}if(!result.supportedUnderSupplement)continue;
   return {...status,method:CONNECTION_METHOD,qualified:true,technicalWouldQualify:null,reasons:[],qualificationMethod:CONNECTION_METHOD,qualificationMethodHash:METHOD_HASH,legacyResult:status,supplement:{jobId:job.jobId,responseHash:accepted.receipt.responseHash,methodHash:METHOD_HASH}};
  }return status;
 })};}
 const view=Object.freeze({...quality,inspect});
 function pendingReferences(){return quality.readSession(pendingSnapshot);}
 function pendingSnapshot(){const pending=[];for(const id of fs.readdirSync(path.join(root,'jobs')).filter(n=>!n.startsWith('.'))){const job=load(id);try{const status=source(job);if(!inspect(job.provenance.legacyJobId).items.find(i=>i.itemId===job.provenance.legacyItemId)?.qualified)pending.push(status.revisionRef);}catch{}}return pending;}
 return {method:CONNECTION_METHOD,methodHash:METHOD_HASH,register,importResponse,inspect,pendingReferences,quality:view};
}
export function connectInferenceBatch({openFlavorBatch,connection,production,batchId}){
 const base=openFlavorBatch({quality:connection.quality,production,batchId});
 const heldIds=()=>new Set(connection.pendingReferences().map(r=>r.revisionHash));
 function decorate(r){const held=heldIds(),evidence=new Map(r.details.evidence.map(e=>[e.work.id,e.work])),heldWork=r.work.filter(w=>held.has(evidence.get(w.id)?.reference.revisionHash)),work=r.work.filter(w=>!held.has(evidence.get(w.id)?.reference.revisionHash)),positions=r.details.positions.map(p=>held.has(p.reference.revisionHash)&&p.state==='waiting-quality'?{...p,state:'waiting-inference'}:p),counts={};positions.forEach(p=>counts[p.state]=(counts[p.state]??0)+1);const view={method:CONNECTION_METHOD,methodHash:METHOD_HASH};return {...r,summary:{...r.summary,status:heldWork.length&&!work.length?'waiting-inference':r.summary.status,counts,inference:{pendingEpisodes:heldWork.length},qualificationView:view},details:{...r.details,legacyPositions:r.details.positions,positions},work,heldWork,qualificationView:view};}
 function run(adapter){const wrapped={...adapter,execute:args=>{const held=heldIds();return adapter.execute({...args,work:args.work.flatMap(w=>{if(!w.job)return [w];const saved=connection.quality.loadJob(w.jobId),requestedItemIds=w.requestedItemIds.filter(id=>!held.has(saved.sidecar.items.find(b=>b.itemId===id)?.revisionRef.revisionHash));return requestedItemIds.length?[{...w,requestedItemIds}]:[];})});}};return decorate(base.run(wrapped));}
 return Object.freeze({...base,report:()=>decorate(base.report()),run});
}
