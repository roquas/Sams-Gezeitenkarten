// Explicit opt-in view over a pinned legacy store, never a migration of its method.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {directory,readTree,seal,unseal,publishTree,withStoreLock,localId} from './immutable-file-store.mjs';
import {parseQualityResponse} from './flavor-quality-json.mjs';import {sha256} from './content-hash.mjs';import {hash} from './flavor-quality-contract.mjs';
import {createSupplement,evaluateSupplement,blockedClaims,METHOD_HASH} from './flavor-reader-inference.mjs';
export const CONNECTION_METHOD='f02b-inference-store-connection-1';
const json=v=>JSON.stringify(v,null,2)+'\n',parse=p=>parseQualityResponse(fs.readFileSync(p));
export function openInferenceConnection({directory:root,quality,runtimeCommit}){
 assert.match(runtimeCommit,/^[a-f0-9]{40}$/);directory(root);for(const d of ['jobs','imports'])directory(path.join(root,d));
 function source(job){
  const p=job.provenance,saved=quality.loadJob(p.legacyJobId);assert.equal(saved.job.stage,'reviewer');assert.equal(sha256(saved.files.get('job.json')),p.legacyJobHash);assert.equal(saved.job.methodHash,p.legacyMethodHash);assert.equal(runtimeCommit,p.legacyCommit);
  const item=saved.job.items.find(i=>i.itemId===p.legacyItemId);assert.ok(item);assert.equal(item.inputHash,p.legacyInputHash);
  assert.equal(hash(job.input),hash({public:item.input.public,originals:item.input.originals,reader:item.input.reader}));
  const accepted=quality.evidence(p.legacyJobId).results.find(r=>r.result.itemId===p.legacyItemId);assert.ok(accepted,'accepted historical reviewer required');
  // Verify raw accepted imports with the strict parser, including the parent Reader.
  const binding=saved.sidecar.items.find(i=>i.itemId===item.itemId),ids=[p.legacyJobId,binding.readerJobId];let reviewRaw=false;
  for(const name of fs.readdirSync(path.join(quality.directory,'imports')).filter(n=>!n.startsWith('.'))){const files=unseal(readTree(path.join(quality.directory,'imports',name))),receipt=parseQualityResponse(files.get('receipt.json'));if(!ids.includes(receipt.jobId))continue;const raw=files.get('response.json');parseQualityResponse(raw);assert.equal(sha256(raw),receipt.responseSha256);if(receipt.jobId===p.legacyJobId&&sha256(raw)===p.legacyResponseHash)reviewRaw=true;}
  assert.ok(reviewRaw,'bound accepted reviewer raw bytes required');
  const status=quality.inspect(p.legacyJobId).items.find(i=>i.itemId===p.legacyItemId);assert.ok(status?.applicable&&status.reader&&status.comparison&&status.review,'current complete historical chain required');
  assert.deepEqual(blockedClaims(status),job.claimIds);return status;
 }
 function register(job){return withStoreLock(root,()=>{assert.deepEqual(job,createSupplement(job.input,job.claimIds,job.provenance));source(job);localId(job.jobId);return publishTree(path.join(root,'jobs',job.jobId),seal(new Map([['job.json',json(job)]])));});}
 function load(id){localId(id);return parseQualityResponse(unseal(readTree(path.join(root,'jobs',id))).get('job.json'));}
 function imported(job){const at=path.join(root,'imports',job.jobId);if(!fs.existsSync(at))return null;const files=unseal(readTree(at)),raw=files.get('response.bin'),receipt=parseQualityResponse(files.get('receipt.json'));assert.equal(receipt.methodHash,METHOD_HASH);assert.equal(receipt.inputHash,job.inputHash);assert.equal(receipt.responseHash,sha256(raw));assert.ok(['external-manual','technical-test'].includes(receipt.kind));return {raw,receipt,response:parseQualityResponse(raw)};}
 function importResponse({jobId,responseBytes,kind}){return withStoreLock(root,()=>{assert.ok(['external-manual','technical-test'].includes(kind));const response=parseQualityResponse(responseBytes),job=load(jobId),status=source(job),result=evaluateSupplement(job,response,status,{kind}),prior=imported(job);if(prior){assert.deepEqual(prior.raw,responseBytes,'conflicting supplemental repeat');assert.equal(prior.receipt.kind,kind,'cannot relabel provenance');return {created:false,result};}
  const receipt={version:1,connectionMethod:CONNECTION_METHOD,methodHash:METHOD_HASH,inputHash:job.inputHash,responseHash:sha256(responseBytes),kind,model:null,producedAt:null};publishTree(path.join(root,'imports',jobId),seal(new Map([['response.bin',responseBytes],['receipt.json',json(receipt)]])));return {created:true,result};});}
 function inspect(jobId,options){const base=quality.inspect(jobId,options);return {...base,qualificationView:{method:CONNECTION_METHOD,methodHash:METHOD_HASH,runtimeCommit},items:base.items.map(status=>{
  if(base.stage!=='reviewer'||!status.applicable||!status.reader||!status.review||!status.comparison||status.evidenceKind==='technical-test')return status;
  const candidates=fs.readdirSync(path.join(root,'jobs')).filter(n=>!n.startsWith('.')).map(load).filter(j=>j.provenance.legacyJobId===jobId&&j.provenance.legacyItemId===status.itemId);
  for(const job of candidates){const accepted=imported(job);if(!accepted||accepted.receipt.kind!=='external-manual')continue;let result;try{source(job);result=evaluateSupplement(job,accepted.response,status,{kind:accepted.receipt.kind});}catch{continue;}if(!result.supportedUnderSupplement)continue;
   return {...status,qualified:true,technicalWouldQualify:null,reasons:[],qualificationMethod:CONNECTION_METHOD,qualificationMethodHash:METHOD_HASH,legacyResult:status,supplement:{jobId:job.jobId,responseHash:accepted.receipt.responseHash,methodHash:METHOD_HASH}};
  }return status;
 })};}
 const view=Object.freeze({...quality,inspect});
 return {method:CONNECTION_METHOD,methodHash:METHOD_HASH,register,importResponse,inspect,quality:view};
}
export function connectInferenceBatch({openFlavorBatch,connection,production,batchId}){
 const base=openFlavorBatch({quality:connection.quality,production,batchId}),decorate=r=>({...r,qualificationView:{method:CONNECTION_METHOD,methodHash:METHOD_HASH}});
 return Object.freeze({...base,report:()=>decorate(base.report()),run:adapter=>decorate(base.run(adapter))});
}
