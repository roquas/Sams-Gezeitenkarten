// Separate immutable evidence lifecycle; drafts/revisions stay in production.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {sha256,canonicalJson} from './content-hash.mjs';
import {json,same} from './flavor-production.mjs';
import {packageInventory} from './flavor-production-package.mjs';
import {localId,parseJsonBytes as parse,directory,readTree,publishTree,seal,unseal,withStoreLock} from './immutable-file-store.mjs';
import {hash,object,text,nullable,structure,validateEnvelope,validateReaderItem,validateReviewerItem,qualify} from './flavor-quality-contract.mjs';
import {METHOD_HASH,EMPTY_CONTEXT,contextSchema,buildReaderInputs,createReaderJob,createReviewerJob,verifyQualityPackage} from './flavor-quality-package.mjs';
import {parseQualityResponse} from './flavor-quality-json.mjs';
import {compareReaderItem} from './flavor-quality-compare.mjs';

const operatorSchema=object({model:nullable(text),producedAt:nullable(text),kind:{enum:['external-manual','technical-test']}});
const names=dir=>fs.readdirSync(dir).filter(n=>!n.startsWith('.')).sort();
export function openQualityStore({directory:target,production,beforePublish}={}){
 assert.ok(typeof target==='string'&&target.trim(),'flavor quality: explicit quality store required');assert.ok(production,'flavor quality: production trust anchor required');
 // Cache verified immutable reads only for one synchronous operation. Every
 // subsequent API call reopens/revalidates disk state (including corruptions).
 let memo=null;
 const cached=(key,work)=>{if(!memo)return work();if(!memo.has(key))memo.set(key,work());return memo.get(key);};
 const operation=work=>{if(memo)return work();memo=new Map();try{return work();}finally{memo=null;}};
 const anchor=production;
 production={directory:anchor.directory,
  findRecord:ref=>cached('production-record:'+canonicalJson(ref),()=>anchor.findRecord(ref)),
  loadOrder:id=>cached('production-order:'+id,()=>anchor.loadOrder(id)),
  latestRevision:(c,v)=>cached('production-latest:'+canonicalJson([c,v]),()=>anchor.latestRevision(c,v))};

 directory(target);const root=fs.realpathSync(target);
 assert.ok(root!==production.directory&&!root.startsWith(production.directory+path.sep)&&!production.directory.startsWith(root+path.sep),'flavor quality: separate, non-nested production and quality stores required');
 for(const sub of ['jobs','imports','comparisons','exports'])directory(path.join(root,sub));
 const locked=work=>withStoreLock(root,work);
 const location=(sub,id)=>{localId(id);return path.join(root,sub,id);};
 const rawJob=(jobId)=>cached('rawJob:'+jobId,()=>rawJobUncached(jobId));
 function rawJobUncached(jobId){
  const stored=unseal(readTree(location('jobs',jobId))),sidecar=parse(stored.get('binding.json'));
  const files=new Map([...stored].filter(([n])=>n.startsWith('public/')).map(([n,b])=>[n.slice(7),b]));
  const job=parse(files.get('job.json'));assert.equal(job.jobId,jobId);assert.equal(sidecar.jobId,jobId);assert.equal(sidecar.methodHash,job.methodHash);
  same(parse(files.get('inventory.json')),packageInventory(new Map([...files].filter(([n])=>n!=='inventory.json'))),'quality historical inventory');
  const historical=job.methodHash!==METHOD_HASH;
  if(!historical)verifyQualityPackage(files);
  return {job,sidecar,files,historical};
 }
 const loadJob=(jobId)=>cached('loadJob:'+jobId,()=>loadJobUncached(jobId));
 function loadJobUncached(jobId){
  const saved=rawJob(jobId),{job,sidecar}=saved;
  if(saved.historical)return saved;
  if(job.stage==='reader'){
   const inputs=buildReaderInputs({production,references:sidecar.items.map(i=>i.revisionRef),context:sidecar.context});
   const expected=createReaderJob(inputs,{jobId,itemIds:job.items.map(i=>i.itemId)});
   same(sidecar,expected.sidecar,'quality local source binding');same(packageInventory(saved.files),packageInventory(expected.files),'quality job trust anchor');
  }else{
   assert.equal(job.stage,'reviewer');
   const parentIds=[...new Set(sidecar.items.map(i=>i.readerJobId))];assert.equal(parentIds.length,1,'flavor quality: ambiguous reader dependency');
   const parent=loadJob(parentIds[0]),accepted=acceptedResults(parent),readerItems=sidecar.items.map(b=>parent.job.items.find(p=>p.itemId===b.readerItemId));
   assert.ok(readerItems.every(Boolean),'flavor quality: missing reader dependency');
   const readerResults=readerItems.map(p=>accepted.get(p.itemId)?.result),comparisons=readerItems.map(p=>loadComparison(parent,p.itemId));
   const inputs=buildReaderInputs({production,references:parent.sidecar.items.map(i=>i.revisionRef),context:parent.sidecar.context});
   const originals=readerItems.map(p=>inputs.entries[parent.job.items.findIndex(x=>x.itemId===p.itemId)].originals);
   const clarification=sidecar.clarification?clarificationEvidence(sidecar.clarification):null;
   const expected=createReviewerJob({clarification,clarificationReference:sidecar.clarification??null,readerJob:{...parent.job,items:readerItems},readerSidecar:{...parent.sidecar,items:readerItems.map(p=>parent.sidecar.items.find(b=>b.itemId===p.itemId))},
    readerResults,comparisons,originals,files:parent.files},{jobId,itemIds:job.items.map(i=>i.itemId)});
   same(sidecar,expected.sidecar,'review dependency binding');same(packageInventory(saved.files),packageInventory(expected.files),'review job trust anchor');
  }
  return saved;
 }
 function current(saved,context=saved.sidecar.context,items=saved.sidecar.items){
  structure(context,contextSchema);
  if(saved.historical)return false;
  if(canonicalJson(context)!==canonicalJson(saved.sidecar.context))return false;
  return [...items.map(i=>i.revisionRef),...context.episodes].every(ref=>canonicalJson(production.latestRevision(ref.caseId,ref.flavorVariantId))===canonicalJson(ref));
 }
 function currentItem(saved,itemId,context){
  const binding=saved.sidecar.items.find(i=>i.itemId===itemId);assert.ok(binding,'flavor quality: unknown source binding');
  return current(saved,context,[binding]);
 }
 function responseApplicability(saved,response,context){
  const staleItemIds=response.items.filter(i=>!currentItem(saved,i.itemId,context)).map(i=>i.itemId);
  return {applicable:response.items.length?staleItemIds.length===0:current(saved,context),staleItemIds};
 }
 function evaluate(saved,response){
  validateEnvelope(saved.job,response);const accepted=[],errors=[];
  for(const result of response.items){
   const item=saved.job.items.find(i=>i.itemId===result.itemId);
   try{(saved.job.stage==='reader'?validateReaderItem:validateReviewerItem)(item,result);accepted.push(result);}
   catch(error){errors.push({itemId:result.itemId,kind:'technical-invalid-item',message:error.message});}
  }
  return {accepted,errors,missing:saved.job.items.filter(i=>!response.items.some(r=>r.itemId===i.itemId)).map(i=>i.itemId)};
 }
 const importSnapshots=(saved)=>cached('importSnapshots:'+saved.job.jobId,()=>importSnapshotsUncached(saved));
 function importSnapshotsUncached(saved){
  const snapshots=[];
  for(const runId of names(path.join(root,'imports'))){
   const files=unseal(readTree(location('imports',runId))),receipt=parse(files.get('receipt.json'));
   assert.equal(receipt.runId,runId,'flavor quality: import identity integrity');
   // Inspect every receipt's exact bytes even when it belongs to another job.
   assert.equal(sha256(files.get('response.json')),receipt.responseSha256,'flavor quality: imported response integrity');
   if(receipt.jobId!==saved.job.jobId)continue;
   assert.equal(receipt.methodHash,METHOD_HASH,'flavor quality: import method integrity');
   const result=evaluate(saved,parseQualityResponse(files.get('response.json')));same(parse(files.get('results.json')),result,'quality import validation');
   same(receipt.bindings,saved.sidecar.items,'quality import source binding');structure(receipt.operator,operatorSchema);
   snapshots.push({receipt,...result});
  }
  return snapshots;
 }
 const acceptedResults=(saved)=>cached('acceptedResults:'+saved.job.jobId,()=>acceptedResultsUncached(saved));
 function acceptedResultsUncached(saved){
  const accepted=new Map();
  for(const snapshot of importSnapshots(saved))for(const result of snapshot.accepted){
   if(accepted.has(result.itemId))same(accepted.get(result.itemId).result,result,'conflicting immutable quality result');
   else accepted.set(result.itemId,{result,operator:snapshot.receipt.operator,responseSha256:snapshot.receipt.responseSha256});
   if(snapshot.receipt.operator.kind==='technical-test')accepted.get(result.itemId).operator={...accepted.get(result.itemId).operator,kind:'technical-test'};
  }
  return accepted;
 }
 function saveJob(pkg){
  const files=seal(new Map([...pkg.files].map(([n,b])=>['public/'+n,b]).concat([['binding.json',json(pkg.sidecar)]])));
  return {jobId:pkg.job.jobId,stage:pkg.job.stage,items:pkg.job.items.length,
   created:publishTree(location('jobs',pkg.job.jobId),files,beforePublish)};
 }
 function createBlindBatch({references,context=EMPTY_CONTEXT,omitCompleted=true,jobId}){
  return locked(()=>{
   let inputs=buildReaderInputs({production,references,context}),skipped=[];
   assert.ok(current({sidecar:{context,items:inputs.entries.map(e=>e.binding)}}),'flavor quality: stale production revision/context');
   if(omitCompleted){
    const done=new Set();
    for(const jobId of names(path.join(root,'jobs'))){
     const raw=rawJob(jobId);if(raw.historical||raw.job.stage!=='reader')continue;
     const prior=loadJob(jobId),accepted=acceptedResults(prior);
     for(const b of prior.sidecar.items)if(accepted.has(b.itemId)&&currentItem(prior,b.itemId))done.add(b.sourceBinding);
    }
    skipped=inputs.entries.filter(e=>done.has(e.binding.sourceBinding)).map(e=>e.binding.revisionRef);
    const pending=references.filter((r,i)=>!done.has(inputs.entries[i].binding.sourceBinding));
    if(!pending.length)return {jobId:null,stage:'reader',items:0,skipped,created:false};
    inputs=buildReaderInputs({production,references:pending,context});
   }
   const pkg=createReaderJob(inputs,jobId?{jobId}:{});assert.ok(current(pkg),'flavor quality: stale production revision/context');return {...saveJob(pkg),skipped};
  });
 }
 function exportJob(jobId,out){
  assert.ok(typeof out==='string'&&out.trim(),'flavor quality: explicit export directory required');
  return locked(()=>{const saved=loadJob(jobId);directory(path.dirname(path.resolve(out)));
   const destination=path.resolve(out),created=publishTree(destination,saved.files,beforePublish);
   const packageHash=hash(packageInventory(saved.files)),eventId='export-'+hash([jobId,destination,packageHash]),eventPath=location('exports',eventId);
   if(fs.existsSync(eventPath)){const prior=parse(unseal(readTree(eventPath)).get('export.json'));same([prior.jobId,prior.out,prior.packageHash],[jobId,destination,packageHash],'export receipt binding');}
   else publishTree(eventPath,seal(new Map([['export.json',json({version:1,jobId,out:destination,packageHash,observedAt:new Date().toISOString()})]])),beforePublish);
   return {jobId,out:destination,created};});
 }
 function importResponse({jobId,runId,responseBytes,operator={model:null,producedAt:null,kind:'external-manual'},context}){
  localId(runId);assert.ok(Buffer.isBuffer(responseBytes),'flavor quality: exact UTF-8 response bytes required');structure(operator,operatorSchema);
  return locked(()=>{
   const saved=loadJob(jobId);assert.ok(!saved.historical,'flavor quality: obsolete method; historical evidence retained but not accepted as current');
   const response=parseQualityResponse(responseBytes),result=evaluate(saved,response),responseSha256=sha256(responseBytes),dest=location('imports',runId);
   if(fs.existsSync(dest)){
    const old=unseal(readTree(dest)),receipt=parse(old.get('receipt.json'));
    same([receipt.jobId,receipt.responseSha256,receipt.operator],[jobId,responseSha256,operator],'quality run conflict');
    assert.equal(sha256(old.get('response.json')),responseSha256);same(parse(old.get('results.json')),result,'idempotent quality import');
    return {runId,created:false,responseSha256,...responseApplicability(saved,response,context),...result};
   }
   // Structural acceptance is immutable evidence for the pinned revision. A
   // mixed reply may retain stale siblings as history without blocking current
   // items. Only item-level applicability permits further active processing.
   const submitted=response.items.length?response.items:saved.job.items;
   assert.ok(submitted.some(i=>currentItem(saved,i.itemId,context)),'flavor quality: stale production revision/context; historical job retained');
   const prior=acceptedResults(saved);
   for(const item of result.accepted)if(prior.has(item.itemId))same(prior.get(item.itemId).result,item,'contradictory repeat result');
   const receipt={version:1,jobId,runId,methodHash:METHOD_HASH,responseSha256,bindings:saved.sidecar.items,operator:structuredClone(operator),
    observedAt:new Date().toISOString(),limits:'Manual declaration; execution/model/time and hidden chat sources not independently observed.'};
   publishTree(dest,seal(new Map([['response.json',responseBytes],['receipt.json',json(receipt)],['results.json',json(result)]])),beforePublish);
   memo?.clear();
   return {runId,created:true,responseSha256,...responseApplicability(saved,response,context),...result};
  });
 }
 function comparisonId(saved,itemId){
  const accepted=acceptedResults(saved).get(itemId);assert.ok(accepted,'flavor quality: reader item technically open');
  const binding=saved.sidecar.items.find(i=>i.itemId===itemId);
  return 'compare-'+hash({jobId:saved.job.jobId,itemId,readerHash:hash(accepted.result),binding,methodHash:METHOD_HASH});
 }
 const loadComparison=(saved,itemId)=>cached('loadComparison:'+saved.job.jobId+':'+itemId,()=>loadComparisonUncached(saved,itemId));
 function loadComparisonUncached(saved,itemId){
  const dest=location('comparisons',comparisonId(saved,itemId));if(!fs.existsSync(dest))return null;
  const files=unseal(readTree(dest)),result=parse(files.get('comparison.json')),proof=parse(files.get('binding.json'));
  const item=saved.job.items.find(i=>i.itemId===itemId),binding=saved.sidecar.items.find(i=>i.itemId===itemId),reader=acceptedResults(saved).get(itemId).result;
  same(proof,{version:1,jobId:saved.job.jobId,itemId,sourceBinding:binding.sourceBinding,readerHash:hash(reader),comparisonHash:hash(result),methodHash:METHOD_HASH},'comparison dependencies');
  const {record}=(()=>{const record=production.findRecord(binding.revisionRef);return {record};})();
  same(result,compareReaderItem(item,reader,record.request.source.logic.clues),'deterministic comparison integrity');return result;
 }
 function compare(jobId){
  return locked(()=>{
   const saved=loadJob(jobId);assert.equal(saved.job.stage,'reader');
   const currentItems=saved.job.items.filter(i=>currentItem(saved,i.itemId));
   assert.ok(currentItems.length,'flavor quality: stale comparison source');
   const accepted=acceptedResults(saved),results=[];
   for(const item of currentItems){
    if(!accepted.has(item.itemId))continue;
    const binding=saved.sidecar.items.find(i=>i.itemId===item.itemId),record=production.findRecord(binding.revisionRef),reader=accepted.get(item.itemId).result;
    const result=compareReaderItem(item,reader,record.request.source.logic.clues);
    const proof={version:1,jobId,itemId:item.itemId,sourceBinding:binding.sourceBinding,readerHash:hash(reader),comparisonHash:hash(result),methodHash:METHOD_HASH};
    const created=publishTree(location('comparisons',comparisonId(saved,item.itemId)),seal(new Map([['comparison.json',json(result)],['binding.json',json(proof)]])),beforePublish);
    memo?.delete('loadComparison:'+saved.job.jobId+':'+item.itemId);
    results.push({itemId:item.itemId,created,result});
   }
   return {jobId,results,missing:currentItems.filter(i=>!accepted.has(i.itemId)).map(i=>i.itemId),
    staleItemIds:saved.job.items.filter(i=>!currentItem(saved,i.itemId)).map(i=>i.itemId)};
  });
 }
 function createReviewBatch({readerJobId,readerItemIds=null,omitCompleted=true,clarification=null,jobId}){
  return locked(()=>{
   const parent=loadJob(readerJobId);assert.equal(parent.job.stage,'reader');
   if(readerItemIds)assert.ok(readerItemIds.length&&readerItemIds.every(id=>parent.job.items.some(i=>i.itemId===id)),'review reader item selection');
   const currentItems=parent.job.items.filter(i=>(!readerItemIds||readerItemIds.includes(i.itemId))&&currentItem(parent,i.itemId));
   assert.ok(currentItems.length,'flavor quality: stale review source');
   if(clarification){const prior=loadJob(clarification.jobId);assert.equal(prior.job.stage,'reviewer');
    const binding=prior.sidecar.items.find(i=>i.itemId===clarification.itemId);assert.ok(binding);
    assert.ok(parent.sidecar.items.every(i=>i.sourceBinding===binding.sourceBinding),'clarification exact source binding');same(parent.sidecar.context,prior.sidecar.context,'clarification context');
   }
   const accepted=acceptedResults(parent),done=new Set();
   if(omitCompleted)for(const jobId of names(path.join(root,'jobs'))){
    const raw=rawJob(jobId);if(raw.historical||raw.job.stage!=='reviewer')continue;
    const review=loadJob(jobId),complete=acceptedResults(review);
    for(const b of review.sidecar.items)if(complete.has(b.itemId)&&currentItem(review,b.itemId))done.add(hash([b.sourceBinding,b.readerHash,b.comparisonHash]));
   }
   const items=currentItems.filter(i=>{
    if(!accepted.has(i.itemId))return false;
    const c=loadComparison(parent,i.itemId);if(!c)return false;
    const binding=parent.sidecar.items.find(b=>b.itemId===i.itemId);
    return !done.has(hash([binding.sourceBinding,hash(accepted.get(i.itemId).result),hash(c)]));
   });
   if(!items.length)return {jobId:null,stage:'reviewer',items:0,created:false};
   const inputs=buildReaderInputs({production,references:parent.sidecar.items.map(b=>b.revisionRef),context:parent.sidecar.context});
   const pkg=createReviewerJob({clarification:clarification?clarificationEvidence(clarification):null,clarificationReference:clarification,readerJob:{...parent.job,items},readerSidecar:{...parent.sidecar,items:items.map(i=>parent.sidecar.items.find(b=>b.itemId===i.itemId))},
    readerResults:items.map(i=>accepted.get(i.itemId).result),comparisons:items.map(i=>loadComparison(parent,i.itemId)),
    originals:items.map(i=>inputs.entries[parent.job.items.findIndex(p=>p.itemId===i.itemId)].originals),files:parent.files},jobId?{jobId}:{});
   return saveJob(pkg);
  });
 }
 function evidence(jobId){
  const saved=loadJob(jobId);assert.ok(!saved.historical,'historical evidence cannot drive current orchestration');
  return {job:saved.job,sidecar:saved.sidecar,results:[...acceptedResults(saved).values()].map(v=>structuredClone(v))};
 }
 // Reuse the original job/item, never rebind an answer to a new identity.
 // Exact sourceBinding includes method, revision, source and actual context;
 // inspect retains the original technical/manual provenance on reused evidence.
 function findReusable({reference,context=EMPTY_CONTEXT,stage,readerJobId=null,readerItemId=null,clarification=null}){
  const input=buildReaderInputs({production,references:[reference],context}).entries[0],matches=[];
  for(const jobId of names(path.join(root,'jobs'))){
   const raw=rawJob(jobId);if(raw.historical||raw.job.stage!==stage)continue;
   if(stage==='reviewer'&&canonicalJson(raw.sidecar.clarification??null)!==canonicalJson(clarification))continue;
   const bindings=raw.sidecar.items.filter(b=>b.sourceBinding===input.binding.sourceBinding&&
    (stage==='reader'||(b.readerJobId===readerJobId&&b.readerItemId===readerItemId)));
   if(!bindings.length)continue;
   const saved=loadJob(jobId),accepted=acceptedResults(saved);
   for(const b of bindings)if(currentItem(saved,b.itemId,context)&&accepted.has(b.itemId))matches.push({jobId,itemId:b.itemId});
  }
  // Prefer the already completed full chain over a sibling reader-only run.
  if(stage==='reader')for(const match of matches){
   if(findReusable({reference,context,stage:'reviewer',readerJobId:match.jobId,readerItemId:match.itemId,clarification}))return match;
  }
  // A clarification must not reuse the very first interpretation as a fresh
  // blind reading. Only an already bound clarification chain is reusable here.
  if(stage==='reader'&&clarification)return null;
  return matches[0]??null;
 }
 function clarificationEvidence(reference){
  const prior=evidence(reference.jobId);assert.equal(prior.job.stage,'reviewer');
  const item=prior.job.items.find(i=>i.itemId===reference.itemId),binding=prior.sidecar.items.find(i=>i.itemId===reference.itemId);
  const result=prior.results.find(r=>r.result.itemId===reference.itemId);assert.ok(item&&result,'complete prior review required');
  return {priorInput:item.input,priorReview:result.result,revisionRef:binding.revisionRef,
   instruction:'Resolve the actual differences with specific text and source evidence. Agreement or a majority is not a resolution. A reader error does not justify changing a correct story. All current standard checks remain mandatory.'};
 }
 function inspect(jobId,{context}={}){
  const saved=loadJob(jobId);
  if(saved.historical)return {jobId,stage:saved.job.stage,methodHash:saved.job.methodHash,items:saved.sidecar.items.map(b=>({itemId:b.itemId,revisionRef:b.revisionRef,qualified:false,applicable:false,reasons:['obsolete-method']})),limits:'Historical bytes retained. This runtime does not replay an obsolete method or transfer its findings.'};
  const accepted=acceptedResults(saved),imports=importSnapshots(saved);
  const items=saved.job.items.map(item=>{
   const binding=saved.sidecar.items.find(b=>b.itemId===item.itemId),applicable=currentItem(saved,item.itemId,context);
   let reader,comparison,review,operators=[];
   if(saved.job.stage==='reader'){
    const found=accepted.get(item.itemId);reader=found?.result;if(found)operators.push(found.operator);
    comparison=reader?loadComparison(saved,item.itemId):null;
   }else{
    reader=item.input.reader;comparison=item.input.comparison;const found=accepted.get(item.itemId);review=found?.result;if(found)operators.push(found.operator);
    const parent=loadJob(binding.readerJobId);operators.push(acceptedResults(parent).get(binding.readerItemId).operator);
   }
   const derived=qualify(item,reader,comparison,review),technical=operators.some(o=>o.kind==='technical-test')||!!anchor.isTechnicalRevision?.(binding.revisionRef);
   return {itemId:item.itemId,revisionRef:binding.revisionRef,sourceBinding:binding.sourceBinding,applicable,
    reader:!!reader,comparison:!!comparison,review:!!review,...derived,
    technicalWouldQualify:technical?derived.qualified:null,qualified:applicable&&!technical&&derived.qualified,
    evidenceKind:technical?'technical-test':'manual-declaration',
    reasons:[...derived.reasons,...(!applicable?['stale-binding']:[]),...(technical?['technical-test-evidence']:[])]};
  });
  return {jobId,stage:saved.job.stage,methodHash:METHOD_HASH,items,
   effort:{exportsNotModelCalls:true,exportedTargets:names(path.join(root,'exports')).filter(n=>parse(unseal(readTree(location('exports',n))).get('export.json')).jobId===jobId).length,manualModelCalls:null,packageBytes:[...saved.files.values()].reduce((n,b)=>n+Buffer.byteLength(b),0),
    importedResponses:imports.length,declaredModels:imports.map(i=>i.receipt.operator.model),tokens:null,cost:null},
   limits:'No external model invocation. F01/checkpoints, selection and publication unchanged.'};
 }
 return Object.freeze({directory:root,readSession:work=>operation(work),...Object.fromEntries(Object.entries({createBlindBatch,exportJob,loadJob,importResponse,compare,createReviewBatch,inspect,evidence,findReusable}).map(([name,fn])=>[name,(...args)=>operation(()=>fn(...args))]))});
}
