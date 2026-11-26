// Deterministic local orchestration. External execution is a small injected boundary.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {json,contentHash,same,structure,revisionRefSchema} from './flavor-production.mjs';
import {revisionReference} from './flavor-production-store.mjs';
import {METHOD_HASH,EMPTY_CONTEXT,contextSchema,resolveRevision} from './flavor-quality-package.mjs';
import {parseQualityResponse} from './flavor-quality-json.mjs';
import {scopedPatchSchema,targetKey} from './flavor-scoped-repair.mjs';
import {loadCommunityProduction,createProductionPackage,packageInventory} from './flavor-production-package.mjs';
import {localId,directory,readTree,unseal,seal,publishTree,withStoreLock,parseJsonBytes as parse} from './immutable-file-store.mjs';
const entries=dir=>fs.readdirSync(dir).filter(n=>!n.startsWith('.')).sort();
export const BATCH_VERSION=1;
export const DEFAULT_BUDGETS=Object.freeze({clarifications:1,technicalRetries:2,systematicFailures:3,replacements:1});
export const BATCH_METHOD=contentHash({version:BATCH_VERSION,quality:METHOD_HASH,implementation:fs.readFileSync(new URL('./flavor-batch.mjs',import.meta.url),'utf8')});
const key=ref=>ref.caseId+'/'+ref.flavorVariantId;
const op={kind:'external-manual',model:null,producedAt:null};
export function openFlavorBatch({quality,production,batchId,beforePublish}={}){
 localId(batchId);assert.ok(quality&&production,'production and quality anchors required');
 const base=path.join(quality.directory,'batches');directory(base);const root=path.join(base,batchId);directory(root);
 for(const sub of ['events','work'])directory(path.join(root,sub));
 let workCache=null,eventCache=null;const loadedWork=new Map();
 const locked=fn=>withStoreLock(root,()=>{workCache=null;eventCache=null;loadedWork.clear();try{return fn();}finally{workCache=null;eventCache=null;loadedWork.clear();}});
 const planFile=path.join(root,'plan');
 function plan(){const value=parse(unseal(readTree(planFile)).get('plan.json'));assert.equal(value.id,batchId);return value;}
 function events(){
  if(eventCache)return eventCache;let previous=null;
  return eventCache=entries(path.join(root,'events')).map((n,i)=>{const e=parse(unseal(readTree(path.join(root,'events',n))).get('event.json'));
   assert.equal(n,String(i+1).padStart(10,'0'));assert.equal(e.sequence,i+1);assert.equal(e.previous,previous);
   const {hash,...body}=e;assert.equal(hash,contentHash(body),'batch event integrity');previous=hash;return e;});
 }
 function append(type,data){const history=events(),body={version:1,sequence:history.length+1,previous:history.at(-1)?.hash??null,type,data,observedAt:new Date().toISOString()};
  const e={...body,hash:contentHash(body)};publishTree(path.join(root,'events',String(e.sequence).padStart(10,'0')),seal(new Map([['event.json',json(e)]])),beforePublish);eventCache=null;return e;}
 function once(type,data){const found=events().find(e=>e.type===type&&contentHash(e.data)===contentHash(data));return found??append(type,data);}
 function create({references,context=EMPTY_CONTEXT,budgets={}}){return locked(()=>{
  assert.ok(Array.isArray(references)&&references.length,'explicit revisions required');references.forEach(r=>{structure(r,revisionRefSchema);production.findRecord(r);same(production.latestRevision(r.caseId,r.flavorVariantId),r,'batch current revision');});
  assert.equal(new Set(references.map(r=>r.caseId)).size,references.length,'one active variant per position');structure(context,contextSchema);
  assert.ok(Object.keys(budgets).every(k=>Object.hasOwn(DEFAULT_BUDGETS,k)),'unknown budget');const limits={...DEFAULT_BUDGETS,...budgets};
  for(const n of Object.values(limits))assert.ok(Number.isSafeInteger(n)&&n>=0&&n<=20,'finite small budgets required');assert.ok(limits.systematicFailures>0);
  const p={version:1,id:batchId,method:BATCH_METHOD,qualityMethod:METHOD_HASH,references,context,budgets:limits};
  publishTree(planFile,seal(new Map([['plan.json',json(p)]])),beforePublish);return p;
 });}
 function work(id){localId(id);if(!loadedWork.has(id))loadedWork.set(id,parse(unseal(readTree(path.join(root,'work',id))).get('work.json')));return loadedWork.get(id);}
 function allWork(){return workCache??=entries(path.join(root,'work')).map(work);}
 function saveWork(w,files){publishTree(path.join(root,'work',w.id),seal(new Map([['work.json',json(w)],...files.map(([n,b])=>['public/'+n,b])])),beforePublish);workCache=null;loadedWork.set(w.id,w);return w;}
 function contextFor(p){return {...p.context,episodes:p.context.episodes.map(initial=>{let r=initial;for(const e of events().filter(e=>e.type==='replacement-accepted'))if(key(r)===key(e.data.replaces))r=e.data.reference;return production.latestRevision(r.caseId,r.flavorVariantId)??r;})};}
 function active(p){const history=events();return p.references.map(initial=>{
  const switches=history.filter(e=>e.type==='replacement-accepted'&&e.data.caseId===initial.caseId);
  const ref=switches.at(-1)?.data.reference??initial;
  return {initial,reference:production.latestRevision(ref.caseId,ref.flavorVariantId)??ref,replacements:switches.length};
 });}
 function qualityWork(p,reference,round,stage,parent=null,clarification=null,readerItemId=null){
  const context=contextFor(p),binding=contentHash({reference,context,method:METHOD_HASH,round,stage,parent,clarification,readerItemId});
  let w=allWork().find(w=>w.binding===binding);
  // Persist the random identity before publishing the quality job. Resume can
  // finish either side of this boundary without exposing private binding hashes.
  if(!w){
   const reusable=quality.findReusable({reference,context,stage,readerJobId:parent,readerItemId,clarification});
   w={version:1,id:'work-'+randomUUID(),kind:stage,jobId:reusable?.jobId??'job-'+randomUUID(),...(reusable?{itemId:reusable.itemId,reused:true}:{}),reference,round,binding,parent,clarification};saveWork(w,[]);
  }
  if(!fs.existsSync(path.join(quality.directory,'jobs',w.jobId))){
   if(stage==='reader')quality.createBlindBatch({references:[reference],context,omitCompleted:false,jobId:w.jobId});
   else quality.createReviewBatch({readerJobId:parent,readerItemIds:[readerItemId],omitCompleted:false,clarification,jobId:w.jobId});
  }
  return w;
 }
 function qualityStatus(w){return quality.inspect(w.jobId).items.find(i=>w.itemId?i.itemId===w.itemId:i.revisionRef.revisionHash===w.reference.revisionHash);}
 function accepted(w){const evidence=quality.evidence(w.jobId),binding=evidence.sidecar.items.find(i=>w.itemId?i.itemId===w.itemId:i.revisionRef.revisionHash===w.reference.revisionHash);
  const saved={...evidence,job:{...evidence.job,items:evidence.job.items.filter(i=>i.itemId===binding.itemId)},sidecar:{...evidence.sidecar,items:[binding]}};
  return {saved,result:saved.results.find(r=>r.result.itemId===binding.itemId)?.result??null};}
 function targets(review,job){
  const out=[];
  if(review.findings.some(f=>f.severity!=='ADVISORY'&&/source|karte|namen|start|logic/i.test(f.repairTarget??'')&&!/intro|title|titel|clue|hinweis|einleitung/i.test(f.repairTarget??'')))return out;
  for(const f of review.findings.filter(f=>f.severity!=='ADVISORY'&&f.repairTarget))for(const id of f.unitIds){
   const unit=job.items[0].input.public.units.find(u=>u.id===id);if(!unit)continue;
   let t;if(unit.field==='title')t={field:'title'};else if(/^intro\.\d+$/.test(unit.field))t={field:'intro',index:Number(unit.field.slice(6))};else if(unit.field.startsWith('clues.'))t={field:'clue',id:unit.field.slice(6)};
   if(t&&!out.some(v=>targetKey(v)===targetKey(t)))out.push(t);
  }
  return out;
 }
 function repairWork(reference,reviewWork){
  const existing=allWork().find(w=>w.kind==='repair'&&w.parent===reviewWork.id);if(existing)return existing;
  const {saved,result}=accepted(reviewWork),allowed=targets(result,saved.job);if(!allowed.length)return null;
  const record=production.findRecord(reference),id='work-'+randomUUID();
  const authorization={version:1,jobId:id,predecessor:reference,sourceHash:record.request.sourceHash,methodHash:METHOD_HASH,context:saved.sidecar.context,reviewerJobId:reviewWork.jobId,reviewerItemId:result.itemId,
   findings:result.findings.filter(f=>f.severity!=='ADVISORY'&&f.repairTarget),targets:allowed,actor:'deterministic quality batch',reason:'Mandatory unresolved text findings after bounded clarification',timestamp:new Date().toISOString()};
  const source=resolveRevision(production,reference),publicJob={version:1,kind:'scoped-repair',jobId:id,predecessor:reference,authorization,
   presentation:source.puzzle.presentation,source:record.request.source,editorial:source.stored.order.editorial,
   seriesContext:contextFor(plan()).episodes.map(r=>resolveRevision(production,r).puzzle.presentation),
   instructions:'Apply only the authorized sparse targets. Preserve story and style. No cosmetic changes. Return scopedPatchSchema, no full answer and no revision selection.'};
  const sources=[...source.stored.files].filter(([n])=>n==='rules.md'||n.startsWith('world/')||n.startsWith('maps/')||n.startsWith('resources/'));
  return saveWork({version:1,id,kind:'repair',reference,parent:reviewWork.id,authorization},[['job.json',json(publicJob)],['response.schema.json',json(scopedPatchSchema)],...sources]);
 }
 function replacementWork(p,item){
  const existing=allWork().find(w=>w.kind==='replacement'&&contentHash(w.reference)===contentHash(item.reference));if(existing)return existing;
  const prior=resolveRevision(production,item.reference),variant='replacement-'+contentHash([batchId,item.initial,item.replacements+1]).slice(0,20);
  const inputs=loadCommunityProduction({ids:[item.reference.caseId],intents:[{flavorVariantId:variant,revision:1,predecessor:null}],libraryDirectory:production.libraryDirectory});
  inputs.positions[0].positionId=prior.position.positionId;same(inputs.positions[0].request,prior.record.request,'replacement pinned source');
  const manifest=parse(prior.stored.files.get('world/manifest.json')),world={manifest,reference:prior.stored.order.world,files:new Map([...prior.stored.files].filter(([n])=>n.startsWith('world/')).map(([n,b])=>[n.slice(6),b]))};
  const editorial=structuredClone(prior.stored.order.editorial),series=contextFor(p).episodes.map(r=>resolveRevision(production,r).puzzle.presentation);
  if(series.length)editorial.context=json({originalEditorialContext:editorial.context,actualSeries:series});
  const pkg=createProductionPackage({...inputs,world,editorial});production.saveOrder({...pkg,origin:inputs.origin});
  return saveWork({version:1,id:'work-'+randomUUID(),kind:'replacement',reference:item.reference,orderId:pkg.order.orderId,variant},[...pkg.files]);
 }
 function failures(w){return events().filter(e=>e.type==='technical-failure'&&e.data.workId===w.id).length;}
 function imported(w){return events().some(e=>e.type==='accepted'&&e.data.workId===w.id);}
 function lineage(reference){const records=[];let r=production.findRecord(reference);while(['scoped-repair-v1','scoped-repair-v2'].includes(r.derivation?.kind)){records.push(r);r=production.findRecord(r.predecessor);}return records;}
 function failedRepairs(reference){
  const hashes=new Set(lineage(reference).map(r=>r.revisionHash)),failed=new Set();
  for(const e of events().filter(e=>e.type==='failed-repair-review'&&hashes.has(e.data.reference.revisionHash))){
   assert.equal(e.data.methodHash,METHOD_HASH,'failed repair method proof');
   const saved=quality.evidence(e.data.reviewJobId),status=quality.inspect(e.data.reviewJobId).items.find(i=>i.itemId===e.data.itemId);
   same(saved.sidecar.context,e.data.context,'failed repair context proof');
   assert.ok(status&&status.revisionRef.revisionHash===e.data.reference.revisionHash&&status.reader&&status.comparison&&status.review,'complete failed repair proof');
   assert.ok(status.reasons.some(r=>!['stale-binding','technical-test-evidence'].includes(r)),'unsuccessful repair proof');
   failed.add(e.data.reference.revisionHash);
  }
  return failed.size;
 }
 function analyze(){return quality.readSession(analyzeSnapshot);}
 function analyzeSnapshot(){
  const p=plan();assert.equal(p.method,BATCH_METHOD,'batch method changed; retain history and create a new batch plan');
  const context=contextFor(p);if(contentHash(context)!==contentHash(p.context))once('context-change',{context});
  const pending=[],positions=[],history=events();
  const errorGroups={};for(const e of history.filter(e=>e.type==='technical-failure'))errorGroups[e.data.category]=(errorGroups[e.data.category]??0)+1;
  const systematic=Object.values(errorGroups).some(n=>n>=p.budgets.systematicFailures);
  for(const item of active(p)){
   const ref=item.reference,discarded=history.some(e=>e.type==='discarded'&&e.data.caseId===ref.caseId&&e.data.variant===ref.flavorVariantId);
   if(discarded){
    if(item.replacements>=p.budgets.replacements){positions.push({...item,state:'blocked',reason:'replacement-budget-exhausted'});continue;}
    const w=replacementWork(p,item);if(!imported(w))pending.push(w);positions.push({...item,state:'waiting-replacement'});continue;
   }
   let finalReview=null,finalStatus=null,round=0;
   for(;round<=p.budgets.clarifications;round++){
    const clarification=finalReview?{jobId:finalReview.jobId,itemId:accepted(finalReview).result.itemId}:null;
    const r=qualityWork(p,ref,round,'reader',null,clarification);const rs=qualityStatus(r);
    if(!rs.reader){pending.push(r);break;}
    quality.compare(r.jobId);
    const v=qualityWork(p,ref,round,'reviewer',r.jobId,clarification,rs.itemId);const vs=qualityStatus(v);
    if(!vs.review){pending.push(v);break;}
    finalReview=v;finalStatus=vs;
    if(vs.qualified||vs.technicalWouldQualify)break;
    if(round<p.budgets.clarifications)once('clarification',{reference:ref,round:round+1,priorReview:v.jobId,reason:vs.reasons});
   }
   if(pending.some(w=>w.reference.revisionHash===ref.revisionHash)){positions.push({...item,state:'waiting-quality'});continue;}
   if(finalStatus?.qualified||finalStatus?.technicalWouldQualify){positions.push({...item,state:finalStatus.qualified?'qualified':'technical-complete',evidence:finalReview.jobId});continue;}
   assert.ok(finalReview&&finalStatus?.review,'missing checks never pass');
   if(lineage(ref).length&&!events().some(e=>e.type==='failed-repair-review'&&e.data.reference.revisionHash===ref.revisionHash)){
    once('failed-repair-review',{reference:ref,reviewJobId:finalReview.jobId,itemId:finalStatus.itemId,context:accepted(finalReview).saved.sidecar.context,methodHash:METHOD_HASH});
   }
   const repairs=failedRepairs(ref);
   if(repairs>=2){once('discarded',{caseId:ref.caseId,variant:ref.flavorVariantId,reference:ref,revisions:lineage(ref).length+1,reviewJobId:finalReview.jobId,reason:finalStatus.reasons});
    positions.push({...item,state:'discarded'});continue;}
   const w=repairWork(ref,finalReview);
   if(w){pending.push(w);positions.push({...item,state:'waiting-repair',failedRepairs:repairs});}
   else positions.push({...item,state:'blocked',reason:'source-or-unresolved-reader-conflict',evidence:finalReview.jobId});
  }
  const stopped=pending.filter(w=>failures(w)>p.budgets.technicalRetries);
  return {p,positions,pending:systematic||stopped.length?[]:pending,stopped:systematic?'systematic-contract-failures':stopped.length?'technical-budget-exhausted':null};
 }
 function importOne({workId,responseBytes,operator=op}){
  const w=work(workId),p=plan();assert.equal(p.method,BATCH_METHOD,'obsolete batch method');
  assert.ok(Buffer.isBuffer(responseBytes),'exact response bytes required');const digest=contentHash([...responseBytes]);
  const already=events().find(e=>e.type==='accepted'&&e.data.workId===workId&&e.data.responseHash===digest);
  if(already)return {created:false,workId};
  try{
   assert.ok(active(p).some(i=>contentHash(i.reference)===contentHash(w.reference)),'stale active variant or revision');
   let result;
   if(w.kind==='reader'||w.kind==='reviewer'){
    result=quality.importResponse({jobId:w.jobId,runId:'batch-'+contentHash([batchId,workId,digest]).slice(0,40),responseBytes,operator,context:contextFor(p)});
    if(!result.accepted.length||result.errors.length||result.missing.length)throw Error('technical incomplete/invalid standard response; accepted complete items retained');
   }else if(w.kind==='repair'){
    same(w.authorization.context,contextFor(p),'stale repair context');
    result=production.importScopedRepair({runId:'repair-'+contentHash([batchId,workId]).slice(0,40),responseBytes,authorization:w.authorization,
     provenance:{kind:'external-model-patch',actor:'batch operator',operator:structuredClone(operator)}});
   }else{
    result=production.importResponse({orderId:w.orderId,runId:'replacement-'+contentHash([batchId,workId]).slice(0,40),responseBytes,operator:structuredClone(operator),replacementOf:w.reference});
    once('replacement-accepted',{caseId:w.reference.caseId,workId,reference:revisionReference(result.records[0]),replaces:w.reference});
   }
   once('accepted',{workId,responseHash:digest,operator});return {created:result.created,workId};
  }catch(error){
   // Technical diagnostics stay local. A retry exports the exact same public data.
   const dir=path.join(root,'rejected'),detailId=contentHash([workId,digest,error.message]);directory(dir);publishTree(path.join(dir,detailId),seal(new Map([['response.json',responseBytes],['diagnostic.txt',error.message]])));
   if(/stale active|stale production|stale repair context/.test(error.message))once('stale-result',{workId,responseHash:digest,diagnostic:error.message});
   else append('technical-failure',{workId,responseHash:digest,category:error instanceof SyntaxError?'invalid-json':/duplicate JSON/.test(error.message)?'ambiguous-json':/reference|foreign|inputHash|jobId/.test(error.message)?'reference-contract':'response-contract',diagnostic:error.message});
   return {created:false,workId,error:'Import rejected; inspect the separate local rejected snapshot before retrying.',detailId};
  }
 }
 function recover(){
  const p=plan();for(const w of allWork()){
   if(imported(w))continue;
   if(w.kind==='repair'){
    const latest=production.latestRevision(w.reference.caseId,w.reference.flavorVariantId);if(latest&&latest.revision>w.reference.revision){
     let record=production.findRecord(latest);while(record.predecessor&&record.draft.revision>w.reference.revision){
      if(record.derivation?.jobId===w.id){const receiptFiles=unseal(readTree(path.join(production.directory,'imports','repair-'+contentHash([batchId,w.id]).slice(0,40))));
       once('accepted',{workId:w.id,responseHash:contentHash([...receiptFiles.get('response.json')]),recoveredProductionRevision:revisionReference(record)});break;}record=production.findRecord(record.predecessor);
     }
    }
   }else if(w.kind==='replacement'){
    const ref=production.latestRevision(w.reference.caseId,w.variant);if(ref)once('replacement-accepted',{caseId:w.reference.caseId,workId:w.id,reference:ref,replaces:w.reference});
   }
  }
 }
 function importMany(responses){return locked(()=>{recover();return responses.map(importOne);});}
 function decide({type,reference,reviewJobId,findingId,actor,reason,timestamp=new Date().toISOString()}){return locked(()=>{
  assert.equal(type,'human-acceptance');assert.ok(actor?.trim()&&reason?.trim());production.findRecord(reference);
  const ev=quality.evidence(reviewJobId),b=ev.sidecar.items.find(b=>contentHash(b.revisionRef)===contentHash(reference));assert.ok(b,'decision revision binding');
  const result=ev.results.find(r=>r.result.itemId===b.itemId)?.result;assert.ok(result?.findings.some(f=>f.id===findingId),'decision finding binding');
  return once('editorial-decision',{type,reference,methodHash:METHOD_HASH,reviewJobId,findingId,actor,reason,timestamp});
 });}
 function run(adapter){assert.ok(['manual-beta','technical-test'].includes(adapter.kind),'adapter kind required');return locked(()=>{
  recover();once('execution-mode',{kind:adapter.kind});let state;
  for(let step=0;step<1000;step++){
   state=analyze();
   if(!state.pending.length){if(state.positions.some(i=>i.state==='discarded'))continue;return report(state);}
   const responses=adapter.execute({batchId,work:state.pending.map(w=>publicWork(w))});
   for(const exportRecord of adapter.exports??[])once('manual-export',exportRecord);
   if(!responses?.length)return report(state);
   const results=responses.map(importOne);if(results.every(r=>!r.created)&&!results.some(r=>r.error))return report(analyze());
  }
  throw Error('finite internal transition budget exhausted');
 });}
 function publicWork(w){
  if(w.kind==='reader'||w.kind==='reviewer'){
   const saved=quality.loadJob(w.jobId);return {id:w.id,kind:w.kind,jobId:w.jobId,files:saved.files,job:saved.job};
  }
  const files=new Map([...unseal(readTree(path.join(root,'work',w.id)))].filter(([n])=>n.startsWith('public/')).map(([n,b])=>[n.slice(7),b]));
  return {id:w.id,kind:w.kind,jobId:w.id,files};
 }
 function report(state=analyze()){return quality.readSession(()=>reportSnapshot(state));}
 function reportSnapshot(state){
  const history=events(),counts={};for(const i of state.positions)counts[i.state]=(counts[i.state]??0)+1;
  const stages={reader:{complete:0,open:0},comparison:{complete:0,open:0},reviewer:{complete:0,open:0}};
  for(const position of state.positions){const pending=state.pending.find(w=>w.reference.revisionHash===position.reference.revisionHash);
   const completed=['qualified','technical-complete','blocked','waiting-repair','discarded','waiting-replacement'].includes(position.state);
   for(const role of ['reader','comparison','reviewer']){const done=completed||(pending?.kind==='reviewer'&&role!=='reviewer');stages[role][done?'complete':'open']++;}
  }
  const discardedRevisionCounts={};for(const e of history.filter(e=>e.type==='discarded'))discardedRevisionCounts[e.data.revisions]=(discardedRevisionCounts[e.data.revisions]??0)+1;
  const findings={ERROR:0,UNCERTAIN:0,ADVISORY:0},observations={},abstractThemes={};let exports=0,bytes=0,imports=0;
  for(const w of allWork())if(w.kind==='reviewer'){
   const {result}=accepted(w);if(result){for(const f of result.findings)findings[f.severity]++;for(const o of result.observations){observations[o.category]=(observations[o.category]??0)+1;
     if(['form','theme','motif','invention'].includes(o.category))for(const [label,pattern] of [['maritime',/meer|schiff|nautik|maritim/i],['fantastical',/magie|geist|fantast|zauber/i],['humorous',/humor|absurd|komisch/i],['epistolary',/brief|tagebuch|logbuch/i]])if(pattern.test(o.value))abstractThemes[label]=(abstractThemes[label]??0)+1;}}
  }
  const countedJobs=new Set();
  for(const w of allWork())if(['reader','reviewer'].includes(w.kind)&&!countedJobs.has(w.jobId)){
   countedJobs.add(w.jobId);const e=quality.inspect(w.jobId).effort;exports+=e.exportedTargets;bytes+=e.packageBytes;imports+=e.importedResponses;
  }
  const summary={version:1,mode:history.some(e=>e.type==='execution-mode'&&e.data.kind==='technical-test')?'includes-technical-test':'manual-beta',status:state.stopped??(state.pending.length?'waiting-manual-transport':'settled'),counts,stages,findings,discardedRevisionCounts,
   independentObservationCounts:observations,abstractIndependentThemes:abstractThemes,discardedStories:history.filter(e=>e.type==='discarded').length,humanAcceptances:history.filter(e=>e.type==='editorial-decision').length,
   effort:{qualityExports:exports,manualPackageExports:history.filter(e=>e.type==='manual-export').length,manualExportBytes:history.filter(e=>e.type==='manual-export').reduce((n,e)=>n+e.data.bytes,0),qualityPackageBytes:bytes,qualityImports:imports,repairImports:history.filter(e=>e.type==='accepted'&&work(e.data.workId).kind==='repair').length,
    technicalFailures:history.filter(e=>e.type==='technical-failure').length,observedModelCalls:null,tokens:null,cost:null},
   calibration:{falseAcceptedErrors:null,falseFlaggedTexts:null,unnecessaryRepairs:null,empiricalReliability:'open; technical fixtures are not empirical model observations'},
   limits:'Manual beta transport; no live operation or empirical model reliability proved. Technical evidence cannot qualify. No selection or publication.',details:'Separate local detail report contains actual references and text.'};
  const details={version:1,plan:state.p,positions:state.positions,pending:state.pending.map(w=>({id:w.id,kind:w.kind})),events:history,
   evidence:allWork().map(w=>({work:w,...(['reader','reviewer'].includes(w.kind)?{quality:quality.evidence(w.jobId)}:{})}))};
  return {summary,details,work:state.pending.map(w=>({id:w.id,kind:w.kind}))};
 }
 return Object.freeze({directory:root,create,run,importMany,decide,report:()=>locked(()=>{recover();return report();})});
}
// The adapter receives only role-specific public files. It returns exact standard
// envelopes; transport bundling never invents a second model-response contract.
export function manualBetaAdapter({out}){
 assert.ok(out,'explicit manual transport output required');directory(out);
 const adapter={kind:'manual-beta',exports:[],execute({work}){
  const wave=contentHash(work.map(w=>[w.id,packageInventory(w.files)])),target=path.join(out,wave);directory(target);
  for(const w of work)publishTree(path.join(target,w.id),w.files);
  adapter.exports=work.map(w=>({workId:w.id,role:w.kind,out:path.join(target,w.id),packageHash:contentHash(packageInventory(w.files)),bytes:[...w.files.values()].reduce((n,b)=>n+Buffer.byteLength(b),0)}));
  publishTree(path.join(target,'manifest'),new Map([['work-list.json',json({version:1,mode:'waiting-manual-beta',work:work.map(w=>({workId:w.id,role:w.kind,directory:'../'+w.id,isolatedFreshContext:true})),instructions:'Give only one role directory to its fresh isolated model context. Never provide the parent manifest or private repository. Import multiple returned standard envelopes together.'})]]));
  return [];
 }};return adapter;
}
export function technicalTestAdapter(execute){
 assert.equal(typeof execute,'function');return {kind:'technical-test',execute(input){return execute(input).map(r=>({...r,operator:{model:'technical-test-adapter',producedAt:null,kind:'technical-test'}}));}};
}
