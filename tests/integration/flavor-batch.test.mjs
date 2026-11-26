import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {importCommunityCards} from '../../scripts/lib/card-import.mjs';
import {loadCommunityProduction,createProductionPackage} from '../../scripts/lib/flavor-production-package.mjs';
import {METHOD_HASH} from '../../scripts/lib/flavor-quality-package.mjs';
import {productionFixture,technicalResponse} from '../fixtures/flavor-production.mjs';
import {technicalReader,technicalReviewer,TECHNICAL_OPERATOR} from '../fixtures/flavor-quality/technical-responses.mjs';
import {openProductionStore,revisionReference} from '../../scripts/lib/flavor-production-store.mjs';
import {openQualityStore} from '../../scripts/lib/flavor-quality-store.mjs';
import {openFlavorBatch,manualBetaAdapter,technicalTestAdapter} from '../../scripts/lib/flavor-batch.mjs';
import {createFlavorCheckpoint} from '../../scripts/lib/flavor-contract.mjs';
import {applyScopedPatch,deriveScopedRecord} from '../../scripts/lib/flavor-scoped-repair.mjs';
import {json,contentHash,materializeFlavorRevision,createProductionRecords,validateStoredProductionRecords} from '../../scripts/lib/flavor-production.mjs';
import {packageInventory} from '../../scripts/lib/flavor-production-package.mjs';
import {readTree,seal,publishTree} from '../../scripts/lib/immutable-file-store.mjs';
const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'f02b-batch-test-')),bytes=x=>Buffer.from(json(x));let n=0,fixture;
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
function setup(count=1,budgets={},contextIndices=[]){
 fixture??=productionFixture();const dir=path.join(root,String(++n));fs.mkdirSync(dir);
 const production=openProductionStore({directory:dir+'/prod'});production.saveOrder(fixture);
 const result=production.importResponse({orderId:fixture.order.orderId,runId:'technical-seed',responseBytes:bytes(technicalResponse(fixture.order)),operator:{model:'technical-test-adapter',producedAt:null}});
 const refs=result.records.slice(0,count).map(revisionReference),quality=openQualityStore({directory:dir+'/quality',production});
 const batch=openFlavorBatch({quality,production,batchId:'test'});batch.create({references:refs,budgets,context:{version:1,episodes:contextIndices.map(i=>refs[i])}});
 const manual=manualBetaAdapter({out:dir+'/out'});return {dir,production,quality,batch,refs,manual};
}
function response(f,w){const saved=f.quality.loadJob(w.jobId);return saved.job.stage==='reader'?technicalReader(saved.job,saved.sidecar.items.map(i=>f.production.findRecord(i.revisionRef).request.source.logic.clues)):technicalReviewer(saved.job);}
function adapter(f,change=x=>x){return technicalTestAdapter(({work})=>work.map(w=>({workId:w.id,responseBytes:bytes(change(response(f,w),w))})));}
function auth(ref,targets){return {version:1,jobId:'scoped-test',predecessor:ref,sourceHash:fixture.order.positions.find(p=>p.caseId===ref.caseId).sourceHash,methodHash:'a'.repeat(64),findings:[{id:'synthetic',severity:'ERROR',rationale:'TECHNICAL TEST'}],targets,actor:'test owner',reason:'synthetic regression',timestamp:'2026-11-26T10:00:00Z'};}

test('one batch start bundles pending work; collective imports advance internally, resume does no repeated external work',()=>{
 const f=setup(2),before=packageInventory(readTree(f.production.directory));let r=f.batch.run(f.manual);assert.equal(r.work.length,2);
 const tasks=r.details.evidence.map(e=>e.work).filter(w=>w.kind==='reader');
 const replies=tasks.map(w=>({workId:w.id,responseBytes:bytes(response(f,w)),operator:TECHNICAL_OPERATOR}));
 assert.equal(f.batch.importMany(replies).filter(r=>r.created).length,2);assert.equal(f.batch.importMany(replies).filter(r=>r.created).length,0);
 r=f.batch.run(f.manual);assert.ok(r.work.every(w=>w.kind==='reviewer'));assert.equal(r.work.length,2);
 r=f.batch.run(adapter(f));assert.equal(r.summary.counts['technical-complete'],2);assert.equal(r.summary.counts.qualified,undefined);
 const jobs=fs.readdirSync(f.quality.directory+'/jobs');f.batch.run(f.manual);assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),jobs);
 assert.deepEqual(packageInventory(readTree(f.production.directory)),before);assert.equal(r.summary.effort.cost,null);
 assert.ok(!JSON.stringify(r.summary).includes(f.refs[0].caseId));
});

test('manual and technical adapter use same state transitions and technical responses never qualify',()=>{
 const f=setup();const r=f.batch.run(adapter(f));assert.deepEqual(r.summary.counts,{'technical-complete':1});
 assert.ok(r.details.evidence.filter(e=>e.quality).every(e=>f.quality.inspect(e.work.jobId).items.every(i=>!i.qualified)));
});

test('empty, truncated, bad-reference and partial responses exhaust technical budget without story revision',()=>{
 for(const kind of ['template','truncated','reference','partial']){
  const f=setup(),r=f.batch.run(f.manual),w=r.details.evidence[0].work;
  const saved=f.quality.loadJob(w.jobId);let b;
  if(kind==='template')b=saved.files.get('response-template.json');else if(kind==='truncated')b=Buffer.from('{');else {const v=response(f,w);if(kind==='reference')v.items[0].itemId='foreign';else v.items[0].coverage.pop();b=bytes(v);}
  for(let i=0;i<3;i++)assert.ok(f.batch.importMany([{workId:w.id,responseBytes:b}])[0].error);
  assert.equal(f.batch.run(f.manual).summary.status,'systematic-contract-failures');assert.equal(f.production.latestRevision(f.refs[0].caseId,f.refs[0].flavorVariantId).revision,1);
 }
});

test('combined scoped patch has one revision, exact raw provenance and validated effective materialization; rejects unapproved mutation and no-op',()=>{
 const f=setup(),prior=f.production.findRecord(f.refs[0]),ids=Object.keys(prior.draft.presentation.clueTexts).slice(0,2),targets=[{field:'title'},{field:'intro',index:0},...ids.map(id=>({field:'clue',id}))];
 const authorization=auth(f.refs[0],targets),patch={version:1,jobId:authorization.jobId,predecessor:f.refs[0],changes:targets.map((target,i)=>({target,value:'TECHNICAL PATCH '+i}))};
 const a={runId:'patch',responseBytes:bytes(patch),authorization,provenance:{kind:'external-model-patch',actor:'test',operator:TECHNICAL_OPERATOR}};
 assert.throws(()=>applyScopedPatch(prior,authorization,{...patch,changes:[{target:{field:'clue',id:'foreign'},value:'x'}]}));
 assert.throws(()=>applyScopedPatch(prior,authorization,{...patch,changes:[{target:{field:'title'},value:prior.draft.presentation.title}]}),/no-op/);
 const imported=f.production.importScopedRepair(a);assert.equal(imported.records[0].draft.revision,2);assert.equal(f.production.importScopedRepair(a).created,false);
 const store=openProductionStore({directory:f.production.directory}),ref=revisionReference(imported.records[0]),context=store.resolveRevisionContext(ref);
 assert.equal(materializeFlavorRevision(context.position,context.record).puzzle.presentation.title,'TECHNICAL PATCH 0');
 assert.equal(context.record.metadata.origin,'inherited-from-predecessor');assert.ok(fs.readFileSync(f.production.directory+'/imports/patch/response.json').equals(a.responseBytes));
 const untouched=Object.keys(prior.draft.presentation.clueTexts).filter(id=>!ids.includes(id));for(const id of untouched)assert.equal(context.record.draft.presentation.clueTexts[id],prior.draft.presentation.clueTexts[id]);
 assert.throws(()=>store.importScopedRepair({...a,runId:'late'}),/stale/);assert.equal(store.selected(ref.caseId).selected,null);
});

test('bounded fresh clarification resolves reader failure without cosmetic repairs; advisory creates no loop',()=>{
 for(const advisory of [false,true]){
  const f=setup();let reviews=0;
  const r=f.batch.run(adapter(f,(v,w)=>{if(w.kind==='reviewer'&&reviews++===0){const unit=f.quality.loadJob(w.jobId).job.items[0].input.public.units[0].id;
   v.items[0].findings=[{id:'f1',severity:advisory?'ADVISORY':'UNCERTAIN',requirement:'synthetic',unitIds:[unit],factRefs:['public.rules'],rationale:'TECHNICAL TEST unresolved reader question',claimIds:[],method:'technical-test',evidenceRefs:['reader'],repairTarget:null}];}return v;}));
  assert.equal(r.summary.counts['technical-complete'],1);assert.equal(r.details.events.filter(e=>e.type==='clarification').length,advisory?0:1);assert.equal(f.production.latestRevision(f.refs[0].caseId,f.refs[0].flavorVariantId).revision,1);
  const readers=r.details.evidence.filter(e=>e.work.kind==='reader');assert.equal(readers.length,advisory?1:2);for(const e of readers)assert.ok(!JSON.stringify(e.quality.job).includes('priorReview'));
 }
});

test('persisted human acceptance does not change independent result or automatic qualification',()=>{
 const f=setup(1,{clarifications:0});
 const r=f.batch.run(adapter(f,(v,w)=>{if(w.kind==='reviewer'){const unit=f.quality.loadJob(w.jobId).job.items[0].input.public.units[0].id;v.items[0].findings=[{id:'f1',severity:'UNCERTAIN',requirement:'synthetic',unitIds:[unit],factRefs:['public.rules'],rationale:'TECHNICAL TEST',claimIds:[],method:'technical-test',evidenceRefs:['comparison'],repairTarget:null}];}return v;}));
 const w=r.details.evidence.find(e=>e.work.kind==='reviewer').work,before=f.quality.inspect(w.jobId);
 f.batch.decide({type:'human-acceptance',reference:f.refs[0],reviewJobId:w.jobId,findingId:'f1',actor:'test owner',reason:'explicit synthetic acceptance'});
 assert.deepEqual(f.quality.inspect(w.jobId),before);assert.equal(f.batch.report().summary.humanAcceptances,1);assert.equal(f.production.selected(f.refs[0].caseId).selected,null);
});

test('exactly two failed repair revisions discard variant; replacement begins at one and finite replacement limit blocks',()=>{
 const f=setup(1,{clarifications:0,replacements:1});let step=0;
 const a=technicalTestAdapter(({work})=>work.map(w=>{
  let value;
  if(w.kind==='repair'){
   const job=JSON.parse(w.files.get('job.json'));value={version:1,jobId:job.jobId,predecessor:job.predecessor,changes:job.authorization.targets.map(target=>({target,value:'TECHNICAL REPAIR '+(++step)}))};
  }else if(w.kind==='replacement')value=technicalResponse(JSON.parse(w.files.get('order.json')));
  else{value=response(f,w);if(w.kind==='reviewer'){
   const unit=f.quality.loadJob(w.jobId).job.items[0].input.public.units.find(u=>u.field==='title').id;
   value.items[0].findings=[{id:'f1',severity:'ERROR',requirement:'synthetic mandatory text issue',unitIds:[unit],factRefs:['public.rules'],rationale:'TECHNICAL TEST',claimIds:[],method:'technical-test',evidenceRefs:['comparison'],repairTarget:'title'}];
  }}
  return {workId:w.id,responseBytes:bytes(value)};
 }));
 const r=f.batch.run(a);assert.equal(r.summary.status,'settled');assert.equal(r.summary.counts.blocked,1);assert.equal(r.summary.discardedStories,2);
 const discarded=r.details.events.filter(e=>e.type==='discarded');assert.ok(discarded.every(e=>e.data.revisions===3));
 const replacement=r.details.events.find(e=>e.type==='replacement-accepted');assert.equal(replacement.data.reference.revision,1);
 assert.notEqual(replacement.data.reference.flavorVariantId,f.refs[0].flavorVariantId);assert.equal(f.production.latestRevision(f.refs[0].caseId,f.refs[0].flavorVariantId).revision,3);
 const late=r.details.evidence.find(e=>e.work.kind==='reader').work;
 assert.equal(f.batch.importMany([{workId:late.id,responseBytes:bytes(response(f,late)),operator:TECHNICAL_OPERATOR}])[0].created,false);
 assert.equal(f.batch.report().summary.discardedStories,2);assert.equal(f.production.selected(f.refs[0].caseId).selected,null);
});

test('new revision invalidates all three checks; abandoned scoped import recovered without duplicate revision',()=>{
 const f=setup();f.batch.run(adapter(f));const prior=f.production.findRecord(f.refs[0]),authorization=auth(f.refs[0],[{field:'title'}]);
 const patch={version:1,jobId:authorization.jobId,predecessor:f.refs[0],changes:[{target:{field:'title'},value:'TECHNICAL NEW REVISION'}]};
 authorization.exactChanges=patch.changes;
 const imported=f.production.importScopedRepair({runId:'outside',responseBytes:bytes(patch),authorization,provenance:{kind:'human-editorial',actor:'test owner',authorship:'assistant-proposed, owner-approved'}});
 const ref=revisionReference(imported.records[0]),r=f.batch.run(f.manual);assert.equal(r.work.length,1);assert.equal(r.work[0].kind,'reader');assert.equal(r.details.positions[0].reference.revision,2);
 const jobs=r.details.evidence.filter(e=>e.work.reference.revisionHash===ref.revisionHash);assert.equal(jobs.length,1);assert.equal(jobs[0].quality.results.length,0);
});

test('writer lock and corrupted batch evidence fail closed',()=>{
 const f=setup(),lock=f.batch.directory+'/.write-lock';fs.writeFileSync(lock,'test');try{assert.throws(()=>f.batch.run(f.manual),/writer lock/);}finally{fs.unlinkSync(lock);}
 f.batch.run(f.manual);const name=fs.readdirSync(f.batch.directory+'/events')[0],file=f.batch.directory+'/events/'+name+'/event.json';fs.appendFileSync(file,' ');assert.throws(()=>f.batch.report(),/integrity/);
});

test('resume recovers accepted production patch after interruption before quality progress, then requests all fresh stages',()=>{
 const f=setup(1,{clarifications:0});
 let pending;
 const pause={kind:'technical-test',execute({work}){
  pending=work.find(w=>w.kind==='repair');if(pending)return [];
  return work.map(w=>{const v=response(f,w);if(w.kind==='reviewer'){
   const unit=f.quality.loadJob(w.jobId).job.items[0].input.public.units.find(u=>u.field==='title').id;
   v.items[0].findings=[{id:'f1',severity:'ERROR',requirement:'synthetic',unitIds:[unit],factRefs:['public.rules'],rationale:'TECHNICAL TEST',claimIds:[],method:'technical-test',evidenceRefs:['comparison'],repairTarget:'title'}];
  }return {workId:w.id,responseBytes:bytes(v),operator:TECHNICAL_OPERATOR};});
 }};
 f.batch.run(pause);assert.ok(pending);const job=JSON.parse(pending.files.get('job.json')),patch={version:1,jobId:job.jobId,predecessor:job.predecessor,changes:[{target:{field:'title'},value:'TECHNICAL RECOVERED PATCH'}]};
 const args={runId:'repair-'+contentHash(['test',pending.id]).slice(0,40),responseBytes:bytes(patch),authorization:job.authorization,provenance:{kind:'external-model-patch',actor:'test',operator:TECHNICAL_OPERATOR}};
 const interrupted=openProductionStore({directory:f.production.directory,beforePublish:()=>{throw Error('injected pre-publication crash');}});
 assert.throws(()=>interrupted.importScopedRepair(args),/injected/);assert.equal(f.production.latestRevision(f.refs[0].caseId,f.refs[0].flavorVariantId).revision,1);
 f.production.importScopedRepair(args);const reopened=openFlavorBatch({quality:f.quality,production:f.production,batchId:'test'}),r=reopened.run(f.manual);
 assert.equal(r.details.positions[0].reference.revision,2);assert.equal(r.work.length,1);assert.equal(r.work[0].kind,'reader');
 assert.ok(r.details.events.some(e=>e.type==='accepted'&&e.data.recoveredProductionRevision));
 const done=reopened.run(adapter(f));assert.equal(done.summary.counts['technical-complete'],1);assert.equal(f.production.latestRevision(f.refs[0].caseId,f.refs[0].flavorVariantId).revision,2);
 const stages=done.details.evidence.filter(e=>e.work.reference.revision===2).map(e=>e.work.kind);assert.deepEqual(stages.sort(),['reader','reviewer']);assert.equal(f.production.importScopedRepair(args).created,false);
});

test('synchronous verified read session invalidates imported results and newly published comparison; later corruption is rechecked',()=>{
 const f=setup();const r=f.batch.run(f.manual),w=r.details.evidence[0].work;
 f.quality.readSession(()=>{
  assert.equal(f.quality.inspect(w.jobId).items[0].reader,false);
  f.quality.importResponse({jobId:w.jobId,runId:'session',responseBytes:bytes(response(f,w)),operator:TECHNICAL_OPERATOR});
  assert.equal(f.quality.inspect(w.jobId).items[0].reader,true);assert.equal(f.quality.inspect(w.jobId).items[0].comparison,false);
  f.quality.compare(w.jobId);assert.equal(f.quality.inspect(w.jobId).items[0].comparison,true);assert.equal(f.quality.createReviewBatch({readerJobId:w.jobId}).items,1);
 });
 fs.appendFileSync(f.quality.directory+'/imports/session/response.json',' ');assert.throws(()=>f.quality.inspect(w.jobId),/integrity/);
});

test('resume finishes a persisted random job intent after interruption before quality job publication',()=>{
 const f=setup();let fail=true;
 const quality={...f.quality,createBlindBatch:args=>{if(fail){fail=false;throw Error('injected before quality job publication');}return f.quality.createBlindBatch(args);}};
 const b=openFlavorBatch({quality,production:f.production,batchId:'test'});assert.throws(()=>b.run(f.manual),/injected/);
 assert.equal(fs.readdirSync(f.quality.directory+'/jobs').length,0);
 const r=b.run(f.manual);assert.equal(r.work.length,1);assert.equal(fs.readdirSync(f.batch.directory+'/work').length,1);assert.equal(fs.readdirSync(f.quality.directory+'/jobs').length,1);
 assert.match(r.details.evidence[0].work.jobId,/^job-[a-f0-9-]{36}$/);
});

function blockingReview(f,v,w){
 if(w.kind==='reviewer'){
  const unit=f.quality.loadJob(w.jobId).job.items[0].input.public.units.find(u=>u.field==='title').id;
  v.items[0].findings=[{id:'f1',severity:'ERROR',requirement:'synthetic mandatory issue',unitIds:[unit],factRefs:['public.rules'],rationale:'TECHNICAL TEST',claimIds:[],method:'technical-test',evidenceRefs:['reader'],repairTarget:'title'}];
 }return v;
}
function pauseRepair(f){return f.batch.run(technicalTestAdapter(({work})=>work.some(w=>w.kind==='repair')?[]:work.map(w=>({workId:w.id,responseBytes:bytes(blockingReview(f,response(f,w),w))}))));}
function importPatch(f,reference,id,value='TECHNICAL PATCH '+id){
 const authorization={...auth(reference,[{field:'title'}]),jobId:id,sourceHash:f.production.findRecord(reference).request.sourceHash};
 return f.production.importScopedRepair({runId:id,responseBytes:bytes({version:1,jobId:id,predecessor:reference,changes:[{target:{field:'title'},value}]}),authorization,provenance:{kind:'external-model-patch',actor:'test',operator:TECHNICAL_OPERATOR}});
}

test('repair context is checked at import, and production lock checks only the actual bound dependencies',()=>{
 for(const bound of [true,false]){
  const f=setup(2,{clarifications:0},bound?[1]:[]);
  // Process only the first position; the second is a context dependency/source.
  const one=openFlavorBatch({quality:f.quality,production:f.production,batchId:'one'});one.create({references:[f.refs[0]],context:{version:1,episodes:bound?[f.refs[1]]:[]},budgets:{clarifications:0}});f.batch=one;
  const r=pauseRepair(f),w=r.details.evidence.find(e=>e.work.kind==='repair').work;
  importPatch(f,f.refs[1],'other-episode');
  const patch={version:1,jobId:w.id,predecessor:w.reference,changes:[{target:{field:'title'},value:'TECHNICAL CONTEXT PATCH'}]},args={runId:'direct-context',responseBytes:bytes(patch),authorization:w.authorization,provenance:{kind:'external-model-patch',actor:'test',operator:TECHNICAL_OPERATOR}};
  if(bound){
   const result=f.batch.importMany([{workId:w.id,responseBytes:bytes(patch),operator:TECHNICAL_OPERATOR}])[0];assert.ok(result.error);
   assert.throws(()=>f.production.importScopedRepair(args),/stale repair context/);
   assert.equal(f.production.latestRevision(w.reference.caseId,w.reference.flavorVariantId).revision,1);
  }else{
   // Even a second writer arriving after the batch check is serialized by production.
   fs.writeFileSync(f.production.directory+'/.write-lock','synthetic concurrent writer');
   try{assert.throws(()=>f.production.importScopedRepair(args),/writer lock/);}finally{fs.unlinkSync(f.production.directory+'/.write-lock');}
   assert.equal(f.batch.importMany([{workId:w.id,responseBytes:bytes(patch),operator:TECHNICAL_OPERATOR}])[0].created,true);
  }
 }
});

test('unreviewed patch ancestors are not failed full repairs; resume counts each completed failed revision once',()=>{
 const f=setup(1,{clarifications:0,replacements:0});let ref=f.refs[0];
 for(const id of ['unreviewed-1','unreviewed-2'])ref=revisionReference(importPatch(f,ref,id).records[0]);
 let r=pauseRepair(f);assert.equal(r.summary.discardedStories,0);assert.equal(r.summary.counts['waiting-repair'],1);
 assert.equal(r.details.events.filter(e=>e.type==='failed-repair-review').length,1);
 r=pauseRepair(f);assert.equal(r.details.events.filter(e=>e.type==='failed-repair-review').length,1);
 const w=r.details.evidence.find(e=>e.work.kind==='repair').work,patch={version:1,jobId:w.id,predecessor:w.reference,changes:[{target:{field:'title'},value:'TECHNICAL ACTUAL SECOND FAILED REPAIR'}]};
 assert.equal(f.batch.importMany([{workId:w.id,responseBytes:bytes(patch),operator:TECHNICAL_OPERATOR}])[0].created,true);
 r=pauseRepair(f);assert.equal(r.summary.discardedStories,1);assert.equal(r.details.events.filter(e=>e.type==='failed-repair-review').length,2);
 const reopened=openFlavorBatch({quality:f.quality,production:f.production,batchId:'test'}).run(f.manual);assert.equal(reopened.summary.discardedStories,1);
});

test('preexisting current multi-item reader/comparison and completed chain are reused without re-export or rebinding',()=>{
 const f=setup(2),reader=f.quality.createBlindBatch({references:f.refs}),saved=f.quality.loadJob(reader.jobId);
 f.quality.importResponse({jobId:reader.jobId,runId:'prior-reader',responseBytes:bytes(technicalReader(saved.job,f.refs.map(r=>f.production.findRecord(r).request.source.logic.clues))),operator:TECHNICAL_OPERATOR});f.quality.compare(reader.jobId);
 let r=f.batch.run(f.manual);assert.equal(r.work.length,2);assert.ok(r.work.every(w=>w.kind==='reviewer'));
 assert.equal(r.details.evidence.filter(e=>e.work.kind==='reader').length,2);assert.ok(r.details.evidence.filter(e=>e.work.kind==='reader').every(e=>e.work.jobId===reader.jobId));
 r=f.batch.run(adapter(f));assert.equal(r.summary.counts['technical-complete'],2);assert.equal(r.summary.effort.qualityImports,3);
 const before=fs.readdirSync(f.quality.directory+'/jobs'),batch=openFlavorBatch({quality:f.quality,production:f.production,batchId:'next'});batch.create({references:f.refs});r=batch.run(f.manual);
 assert.equal(r.work.length,0);assert.equal(r.summary.counts['technical-complete'],2);assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),before);
 assert.equal(r.summary.counts.qualified,undefined);
 // Changed actual context cannot reuse either old stage, even for unchanged text.
 const contextBatch=openFlavorBatch({quality:f.quality,production:f.production,batchId:'context'});contextBatch.create({references:[f.refs[0]],context:{version:1,episodes:[f.refs[1]]}});
 assert.equal(contextBatch.run(f.manual).work[0].kind,'reader');
 const next=revisionReference(importPatch(f,f.refs[0],'new-current-revision').records[0]);
 assert.equal(f.quality.findReusable({reference:next,stage:'reader'}),null);
});

test('replacement collective import retains explicit technical provenance across reload, repair and later externally declared full checks',()=>{
 const f=setup(1,{clarifications:0});let replacement;
 f.batch.run(technicalTestAdapter(({work})=>{
  if(work.some(w=>w.kind==='replacement')){replacement=work.find(w=>w.kind==='replacement');return [];}
  return work.map(w=>{let v;if(w.kind==='repair'){const job=JSON.parse(w.files.get('job.json'));v={version:1,jobId:job.jobId,predecessor:job.predecessor,changes:[{target:{field:'title'},value:'TECHNICAL REPAIR '+job.predecessor.revision}]};}else v=blockingReview(f,response(f,w),w);return {workId:w.id,responseBytes:bytes(v)};});
 }));assert.ok(replacement);
 const result=f.batch.importMany([{workId:replacement.id,responseBytes:bytes(technicalResponse(JSON.parse(replacement.files.get('order.json')))),operator:TECHNICAL_OPERATOR}]);assert.equal(result[0].created,true);
 const production=openProductionStore({directory:f.production.directory}),w=JSON.parse(fs.readFileSync(f.batch.directory+'/work/'+replacement.id+'/work.json')),ref=production.latestRevision(f.refs[0].caseId,w.variant);
 const receipt=JSON.parse(fs.readFileSync(production.directory+'/imports/replacement-'+contentHash(['test',w.id]).slice(0,40)+'/receipt.json'));
 assert.equal(receipt.operator.value.kind,'technical-test');assert.deepEqual(receipt.replacementOf,w.reference);assert.equal(production.isTechnicalRevision(ref),true);
 // Simulated declarations only: no external execution occurs in this regression.
 const r=f.batch.run({kind:'manual-beta',execute:({work})=>work.map(w=>({workId:w.id,responseBytes:bytes(response(f,w)),operator:{kind:'external-manual',model:null,producedAt:null}}))});
 assert.equal(r.summary.counts.qualified,undefined);assert.equal(r.summary.counts['technical-complete'],1);
 const next=revisionReference(importPatch(f,ref,'post-replacement').records[0]);assert.equal(openProductionStore({directory:f.production.directory}).isTechnicalRevision(next),true);
});

test('nonpilot replacement uses the connected library and pins request/card/names while returning normal variant revision one',()=>{
 const dir=path.join(root,'nonpilot'),library=dir+'/library';importCommunityCards({directory:library,ids:['C-01']});
 const inputs=loadCommunityProduction({ids:['C-01'],libraryDirectory:library}),pkg=createProductionPackage(inputs),production=openProductionStore({directory:dir+'/prod',libraryDirectory:library});production.saveOrder({...pkg,origin:inputs.origin});
 const records=production.importResponse({orderId:pkg.order.orderId,runId:'technical',responseBytes:bytes(technicalResponse(pkg.order)),operator:TECHNICAL_OPERATOR}).records;
 const f={dir,production,refs:records.map(revisionReference)};f.quality=openQualityStore({directory:dir+'/quality',production});f.batch=openFlavorBatch({quality:f.quality,production,batchId:'nonpilot'});f.batch.create({references:f.refs,budgets:{clarifications:0}});
 let replacement;
 f.batch.run(technicalTestAdapter(({work})=>{
  if(work.some(w=>w.kind==='replacement')){replacement=work.find(w=>w.kind==='replacement');return [];}
  return work.map(w=>{let v;if(w.kind==='repair'){const j=JSON.parse(w.files.get('job.json'));v={version:1,jobId:j.jobId,predecessor:j.predecessor,changes:[{target:{field:'title'},value:'TECHNICAL NONPILOT '+j.predecessor.revision}]};}else v=blockingReview(f,response(f,w),w);return {workId:w.id,responseBytes:bytes(v)};});
 }));assert.ok(replacement);
 const p=JSON.parse(replacement.files.get('order.json')).positions[0],prior=production.findRecord(f.refs[0]);
 assert.deepEqual(p.request,prior.request);assert.equal(p.cardRef,prior.cardRef);assert.deepEqual(p.card.objectNames,pkg.order.positions[0].card.objectNames);assert.equal(p.intent.revision,1);assert.notEqual(p.intent.flavorVariantId,prior.flavorVariantId);
});

test('CLI failure paths hide response/title markers in stdout and stderr, persist details separately and exit unsuccessfully',()=>{
 const f=setup(),marker='SYNTHETIC_PRIVATE_TITLE_AND_REPLY';importPatch(f,f.refs[0],'title-marker',marker);
 const r=f.batch.run(f.manual),w=r.details.evidence[0].work,v=response(f,w);
 v.items[0].claims[0].meaning=marker;f.batch.importMany([{workId:w.id,responseBytes:bytes(v),operator:TECHNICAL_OPERATOR}]);v.items[0].claims[0].meaning+=' CONFLICT';
 fs.writeFileSync(f.dir+'/reply.json',bytes(v));fs.writeFileSync(f.dir+'/responses.json',json([{workId:w.id,file:'reply.json',operator:TECHNICAL_OPERATOR}]));
 const run=args=>spawnSync(process.execPath,['scripts/flavor-batch.mjs',...args],{cwd:new URL('../../',import.meta.url),encoding:'utf8'});
 const args=['import','--production-store',f.production.directory,'--quality-store',f.quality.directory,'--batch','test','--responses',f.dir+'/responses.json','--out',f.dir+'/cli-out','--report',f.dir+'/reports'];
 let cli=run(args);assert.equal(cli.status,1);assert.ok(!cli.stdout.includes(marker)&&!cli.stderr.includes(marker));assert.match(cli.stderr,/Import rejected/);
 const details=fs.readdirSync(f.batch.directory+'/rejected').map(id=>fs.readFileSync(f.batch.directory+'/rejected/'+id+'/diagnostic.txt','utf8')).join('\n');assert.ok(details.includes(marker));
 fs.writeFileSync(f.dir+'/responses.json','{"'+marker+'":');cli=run(args);assert.equal(cli.status,1);assert.ok(!cli.stdout.includes(marker)&&!cli.stderr.includes(marker));assert.match(cli.stderr,/Command failed/);
 assert.ok(fs.readdirSync(f.dir+'/reports').some(n=>n.endsWith('-DETAILS.txt')));
 for(const command of ['start','resume','report','decide','unknown']){cli=run([command,'--'+marker]);assert.equal(cli.status,1);assert.ok(!(cli.stdout+cli.stderr).includes(marker));}
});

test('completed clarification chain is reused with its original fresh reader and bound comparative reviewer',()=>{
 const f=setup();let reviews=0;
 f.batch.run(adapter(f,(v,w)=>{if(w.kind==='reviewer'&&reviews++===0){blockingReview(f,v,w);v.items[0].findings[0].repairTarget=null;}return v;}));
 const before=fs.readdirSync(f.quality.directory+'/jobs'),batch=openFlavorBatch({quality:f.quality,production:f.production,batchId:'clarification-reuse'});batch.create({references:f.refs});
 const result=batch.run(f.manual);assert.equal(result.work.length,0);assert.equal(result.summary.counts['technical-complete'],1);assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),before);
 const reviewers=result.details.evidence.filter(e=>e.work.kind==='reviewer');assert.ok(reviewers.some(e=>e.quality.sidecar.clarification));
});

test('explicit externally declared production remains separate from technical provenance even with a technical-looking model label',()=>{
 fixture??=productionFixture();const dir=path.join(root,'manual-provenance'),production=openProductionStore({directory:dir});production.saveOrder(fixture);
 const operator={kind:'external-manual',model:'technical-test-adapter',producedAt:null},seed=production.importResponse({orderId:fixture.order.orderId,runId:'declared-manual',responseBytes:bytes(technicalResponse(fixture.order)),operator}),ref=revisionReference(seed.records[0]);
 // Synthetic transport declaration test only; content is not an actual model run.
 assert.equal(production.isTechnicalRevision(ref),false);
 const inputs=loadCommunityProduction({ids:[ref.caseId],intents:[{flavorVariantId:'manual-replacement',revision:1,predecessor:null}]}),pkg=createProductionPackage(inputs);production.saveOrder({...pkg,origin:inputs.origin});
 const result=production.importResponse({orderId:pkg.order.orderId,runId:'manual-replacement',responseBytes:bytes(technicalResponse(pkg.order)),operator,replacementOf:ref}),replacement=revisionReference(result.records[0]);
 assert.equal(openProductionStore({directory:dir}).isTechnicalRevision(replacement),false);
});

test('legacy synthetic v1 production and scoped receipts retain their exact bytes/hashes while a fresh scoped import creates v2',()=>{
 fixture??=productionFixture();const dir=path.join(root,'legacy-store'),production=openProductionStore({directory:dir});production.saveOrder(fixture);
 const raw=bytes(technicalResponse(fixture.order)),records=createProductionRecords(fixture.order,JSON.parse(raw)).map(record=>{
  const {revisionHash,draftHash,...body}=structuredClone(record);body.draft.contractVersion=1;
  const startObject=body.request.source.logic.map.objects.find(o=>o.cells.includes(body.request.source.logic.start));delete body.draft.presentation.objectNames[startObject.id];
  body.checkpoint=createFlavorCheckpoint(body.request,body.draft);return {...body,revisionHash:contentHash(body),draftHash:contentHash(body.draft)};
 });validateStoredProductionRecords(fixture.order,JSON.parse(raw),records);
 const responseSha256=packageInventory(new Map([['response.json',raw]])).files[0].sha256;
 publishTree(dir+'/imports/legacy-original',seal(new Map([['response.json',raw],['records.json',json(records)],['receipt.json',json({schemaVersion:1,orderId:fixture.order.orderId,runId:'legacy-original',responseSha256,operator:{origin:'operator-supplied',value:{model:'technical-test-adapter',producedAt:null}}})]])));
 const prior=records[0],reference=revisionReference(prior),authorization={...auth(reference,[{field:'title'}]),sourceHash:prior.request.sourceHash},patch={version:1,jobId:authorization.jobId,predecessor:reference,changes:[{target:{field:'title'},value:'TECHNICAL HISTORICAL PATCH'}]},provenance={kind:'external-model-patch',actor:'synthetic test',operator:TECHNICAL_OPERATOR};
 const legacy=deriveScopedRecord(prior,authorization,patch,provenance,{historical:true}),rawPatch=bytes(patch),receipt={schemaVersion:1,kind:'scoped-repair-v1',runId:'legacy-repair',orderId:prior.orderId,responseSha256:packageInventory(new Map([['response.json',rawPatch]])).files[0].sha256,provenance};
 publishTree(dir+'/imports/legacy-repair',seal(new Map([['response.json',rawPatch],['authorization.json',json(authorization)],['receipt.json',json(receipt)],['records.json',json([legacy])]])));
 const before=packageInventory(readTree(dir)),reopened=openProductionStore({directory:dir}),oldRef=revisionReference(legacy);assert.deepEqual(reopened.findRecord(reference),prior);assert.deepEqual(reopened.findRecord(oldRef),legacy);
 const nextAuth={...authorization,jobId:'new-v2',predecessor:oldRef},nextPatch={...patch,jobId:nextAuth.jobId,predecessor:oldRef,changes:[{target:{field:'title'},value:'TECHNICAL CURRENT PATCH'}]};
 const result=reopened.importScopedRepair({runId:'current',responseBytes:bytes(nextPatch),authorization:nextAuth,provenance}),current=result.records[0];assert.equal(current.draft.contractVersion,2);assert.equal(current.checkpoint.contractVersion,2);
 assert.deepEqual(current.draft.presentation.objectNames,prior.request.source.presentation.objectNames);assert.deepEqual(current.draft.presentation.clueTexts,prior.draft.presentation.clueTexts);assert.deepEqual(current.draft.presentation.intro,prior.draft.presentation.intro);
 const after=packageInventory(readTree(dir));for(const entry of before.files)assert.deepEqual(after.files.find(f=>f.path===entry.path),entry);
 assert.deepEqual(openProductionStore({directory:dir}).findRecord(oldRef),legacy);
});

function anotherBatch(f,id,references=f.refs,budgets={clarifications:0,replacements:0},context={version:1,episodes:[]}){
 const b=openFlavorBatch({quality:f.quality,production:f.production,batchId:id});b.create({references,budgets,context});return b;
}
function acceptWorkPatch(f,w,label){return f.batch.importMany([{workId:w.id,responseBytes:bytes({version:1,jobId:w.id,predecessor:w.reference,changes:[{target:{field:'title'},value:'TECHNICAL '+label}]}),operator:TECHNICAL_OPERATOR}])[0];}

test('variant-wide failures survive batch changes and duplicate proofs; discarded variants cannot be reactivated or accept late work',()=>{
 const f=setup(1,{clarifications:0,replacements:0});const r2=revisionReference(importPatch(f,f.refs[0],'cross-r2').records[0]);
 const sourceBatch=f.batch;let first=pauseRepair(f);assert.equal(first.summary.discardedStories,0);const oldRepair=first.details.evidence.find(e=>e.work.kind==='repair').work;
 // The same complete negative proof is observed in another batch, not counted twice.
 f.batch=anotherBatch(f,'duplicate-r2',[r2]);let duplicate=pauseRepair(f);assert.equal(duplicate.summary.discardedStories,0);assert.equal(duplicate.details.positions[0].failedRepairs,1);
 const r3=revisionReference(importPatch(f,r2,'cross-r3').records[0]),parallel=anotherBatch(f,'parallel-r3',[r3]);const parallelPending=parallel.run(f.manual).details.evidence.find(e=>e.work.kind==='reader').work;f.batch=anotherBatch(f,'second-revision',[r3]);const result=pauseRepair(f);
 assert.equal(result.summary.discardedStories,1);assert.equal(result.summary.counts.blocked,1);assert.equal(result.work.length,0);
 const proofs=result.details.variantHistory.filter(e=>e.type==='failed-repair-review');assert.equal(new Set(proofs.map(e=>e.data.reference.revisionHash)).size,2);
 const jobs=fs.readdirSync(f.quality.directory+'/jobs');f.batch=anotherBatch(f,'after-discard',[r3]);
 for(let i=0;i<2;i++){const again=f.batch.run(f.manual);assert.equal(again.work.length,0);assert.equal(again.summary.discardedStories,1);assert.equal(again.summary.counts.blocked,1);}
 assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),jobs);
 assert.ok(sourceBatch.importMany([{workId:oldRepair.id,responseBytes:bytes({version:1,jobId:oldRepair.id,predecessor:oldRepair.reference,changes:[{target:{field:'title'},value:'TECHNICAL LATE OLD PATCH'}]}),operator:TECHNICAL_OPERATOR}])[0].error);assert.equal(f.production.latestRevision(r3.caseId,r3.flavorVariantId).revision,3);
 const late=parallel.importMany([{workId:parallelPending.id,responseBytes:bytes(response(f,parallelPending)),operator:TECHNICAL_OPERATOR}])[0];assert.ok(late.error);assert.equal(parallel.run(f.manual).summary.counts.blocked,1);
 const events=result.details.variantHistory.filter(e=>e.type==='discarded');assert.equal(events.length,1);
});

test('variant-wide discard shares one bounded replacement across batches and does not block independent cases or variants',()=>{
 const f=setup(2,{clarifications:0,replacements:0});f.batch=anotherBatch(f,'terminal-a',[f.refs[0]]);
 let ref=f.refs[0];for(const id of ['terminal-r2','terminal-r3']){ref=revisionReference(importPatch(f,ref,id).records[0]);pauseRepair(f);}
 f.batch=anotherBatch(f,'replacement-b',[ref],{clarifications:0,replacements:1});let r=f.batch.run(f.manual);assert.equal(r.work[0].kind,'replacement');const w=r.details.evidence.find(e=>e.work.kind==='replacement').work;
 const orders=fs.readdirSync(f.production.directory+'/orders');const b=anotherBatch(f,'replacement-c',[ref],{clarifications:0,replacements:1});let c=b.run(f.manual);
 assert.equal(c.work.length,1);assert.equal(c.work[0].id,w.id);assert.deepEqual(fs.readdirSync(f.production.directory+'/orders'),orders);
 const order=f.production.loadOrder(w.orderId).order;assert.equal(order.positions[0].intent.revision,1);assert.notEqual(w.variant,ref.flavorVariantId);
 assert.equal(f.batch.importMany([{workId:w.id,responseBytes:bytes(technicalResponse(order)),operator:TECHNICAL_OPERATOR}])[0].created,true);
 f.batch=b;r=f.batch.run(adapter(f));assert.equal(r.summary.counts['technical-complete'],1);assert.equal(r.details.positions[0].replacements,1);
 const replacement=r.details.positions[0].reference;f.batch=anotherBatch(f,'direct-replacement-start',[replacement],{clarifications:0,replacements:1});
 let current=replacement;for(const id of ['replacement-r2','replacement-r3']){current=revisionReference(importPatch(f,current,id).records[0]);pauseRepair(f);}
 r=f.batch.run(f.manual);assert.equal(r.summary.counts.blocked,1);assert.equal(r.work.length,0);assert.equal(r.summary.discardedStories,2);
 f.batch=anotherBatch(f,'unrelated-case',[f.refs[1]]);assert.equal(f.batch.run(adapter(f)).summary.counts['technical-complete'],1);
 const inputs=loadCommunityProduction({ids:[ref.caseId],intents:[{flavorVariantId:'independent-other',revision:1,predecessor:null}]}),pkg=createProductionPackage(inputs);f.production.saveOrder({...pkg,origin:inputs.origin});
 const fresh=f.production.importResponse({orderId:pkg.order.orderId,runId:'other-independent',responseBytes:bytes(technicalResponse(pkg.order)),operator:TECHNICAL_OPERATOR}).records[0];
 f.batch=anotherBatch(f,'unrelated-variant',[revisionReference(fresh)]);r=f.batch.run(adapter(f));assert.equal(r.summary.counts['technical-complete'],1);assert.equal(r.summary.discardedStories,0);
});

test('variant-wide failure counting excludes changed relevant contexts, incomplete stages and transport failures',()=>{
 const f=setup(2,{clarifications:0,replacements:0});f.batch=anotherBatch(f,'context-a',[f.refs[0]],{clarifications:0,replacements:0},{version:1,episodes:[f.refs[1]]});
 const r2=revisionReference(importPatch(f,f.refs[0],'bound-r2').records[0]);pauseRepair(f);
 const sibling=revisionReference(importPatch(f,f.refs[1],'changed-bound-sibling').records[0]),r3=revisionReference(importPatch(f,r2,'bound-r3').records[0]);
 f.batch=anotherBatch(f,'context-b',[r3],{clarifications:0,replacements:0},{version:1,episodes:[sibling]});let r=f.batch.run(f.manual),w=r.details.evidence.find(e=>e.work.kind==='reader').work;
 assert.ok(f.batch.importMany([{workId:w.id,responseBytes:Buffer.from('{'),operator:TECHNICAL_OPERATOR}])[0].error);
 assert.equal(f.batch.report().details.variantHistory.filter(e=>e.type==='failed-repair-review').filter(e=>e.data.reference.revisionHash===r3.revisionHash).length,0);
 // Only the reader is accepted; missing independent review cannot create failure evidence.
 f.batch.importMany([{workId:w.id,responseBytes:bytes(response(f,w)),operator:TECHNICAL_OPERATOR}]);r=f.batch.run(f.manual);assert.equal(r.work[0].kind,'reviewer');
 assert.equal(r.summary.discardedStories,0);r=pauseRepair(f);assert.equal(r.summary.discardedStories,0);assert.equal(r.details.positions[0].failedRepairs,1);
 // Damage to a foreign batch's history is rejected, never interpreted as reset.
 const event=f.quality.directory+'/batches/context-a/events/0000000001/event.json';fs.appendFileSync(event,' ');assert.throws(()=>f.batch.report(),/integrity/);
 fs.renameSync(f.quality.directory+'/batches/context-a/plan',f.quality.directory+'/batches/context-a/.lost-plan');assert.throws(()=>f.batch.report(),/missing batch plan/);
});

function partialClarification(f){
 return f.batch.run(technicalTestAdapter(({work})=>{
  if(work.some(w=>w.kind==='reviewer'&&f.quality.loadJob(w.jobId).sidecar.clarification))return [];
  return work.map(w=>{const value=response(f,w);if(w.kind==='reviewer'){blockingReview(f,value,w);value.items[0].findings[0].repairTarget=null;}return {workId:w.id,responseBytes:bytes(value)};});
 }));
}
test('partial clarification reuses accepted fresh readers and comparisons across batch IDs; only original reviewer work remains',()=>{
 const f=setup(2);const first=partialClarification(f);assert.equal(first.work.length,2);assert.ok(first.work.every(w=>w.kind==='reviewer'));
 const before=fs.readdirSync(f.quality.directory+'/jobs'),oldReviews=first.details.evidence.filter(e=>e.work.kind==='reviewer'&&e.quality.sidecar.clarification).map(e=>e.work.jobId).sort();
 const readerFiles=first.details.evidence.filter(e=>e.work.kind==='reader').map(e=>[e.work.jobId,packageInventory(f.quality.loadJob(e.work.jobId).files)]);
 f.batch=anotherBatch(f,'partial-clarification-b',f.refs,{clarifications:1,replacements:0});let next=f.batch.run(f.manual);
 assert.ok(next.work.every(w=>w.kind==='reviewer'));assert.equal(next.work.length,2);assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),before);
 assert.deepEqual(next.details.evidence.filter(e=>e.work.kind==='reviewer'&&e.quality.sidecar.clarification).map(e=>e.work.jobId).sort(),oldReviews);
 assert.equal(next.summary.effort.qualityImports,6);next=f.batch.run(f.manual);assert.deepEqual(fs.readdirSync(f.quality.directory+'/jobs'),before);
 const replies=next.details.evidence.filter(e=>next.work.some(w=>w.id===e.work.id)).map(e=>({workId:e.work.id,responseBytes:bytes(response(f,e.work)),operator:TECHNICAL_OPERATOR}));
 assert.equal(f.batch.importMany(replies).filter(r=>r.created).length,2);next=f.batch.run(f.manual);assert.equal(next.work.length,0);assert.equal(next.summary.counts['technical-complete'],2);assert.equal(next.summary.effort.qualityImports,8);
 for(const [id,inventory] of readerFiles)assert.deepEqual(packageInventory(f.quality.loadJob(id).files),inventory);
});

test('partial clarification ancestry distinguishes multiple multi-item paths; context/revision changes and missing readers are not relabeled',()=>{
 const f=setup(2),prior=f.quality.createBlindBatch({references:f.refs}),saved=f.quality.loadJob(prior.jobId);
 f.quality.importResponse({jobId:prior.jobId,runId:'multi-initial-reader',responseBytes:bytes(technicalReader(saved.job,f.refs.map(r=>f.production.findRecord(r).request.source.logic.clues))),operator:TECHNICAL_OPERATOR});f.quality.compare(prior.jobId);
 const review=f.quality.createReviewBatch({readerJobId:prior.jobId}),rv=f.quality.loadJob(review.jobId),reply=technicalReviewer(rv.job);
 for(const item of reply.items)item.findings=[{id:'synthetic-open',severity:'UNCERTAIN',requirement:'technical',unitIds:[rv.job.items.find(i=>i.itemId===item.itemId).input.public.units[0].id],factRefs:['public.rules'],rationale:'TECHNICAL TEST',claimIds:[],method:'technical-test',evidenceRefs:['reader'],repairTarget:null}];
 f.quality.importResponse({jobId:review.jobId,runId:'multi-initial-review',responseBytes:bytes(reply),operator:TECHNICAL_OPERATOR});
 const refs=rv.sidecar.items.map(b=>({jobId:review.jobId,itemId:b.itemId})),fresh=[];
 for(let i=0;i<2;i++){
  const j=f.quality.createBlindBatch({references:[f.refs[i]],omitCompleted:false,clarification:refs[i]}),s=f.quality.loadJob(j.jobId);fresh.push(s);
  if(i===0){f.quality.importResponse({jobId:j.jobId,runId:'fresh-only-first',responseBytes:bytes(technicalReader(s.job,[f.production.findRecord(f.refs[i]).request.source.logic.clues])),operator:TECHNICAL_OPERATOR});f.quality.compare(j.jobId);}
  assert.ok(!s.files.get('job.json').toString().includes(review.jobId));assert.ok(!s.files.get('job.json').toString().includes('clarification'));
 }
 assert.equal(f.quality.findReusable({reference:f.refs[0],stage:'reader',clarification:refs[0]}).jobId,fresh[0].job.jobId);
 assert.equal(f.quality.findReusable({reference:f.refs[1],stage:'reader',clarification:refs[1]}),null);
 assert.equal(f.quality.findReusable({reference:f.refs[1],stage:'reader',clarification:refs[1],includePending:true}).jobId,fresh[1].job.jobId);
 assert.equal(f.quality.findReusable({reference:f.refs[0],stage:'reader',clarification:refs[1]}),null);
 assert.equal(f.quality.findReusable({reference:f.refs[0],context:{version:1,episodes:[f.refs[1]]},stage:'reader',clarification:refs[0]}),null);
 assert.throws(()=>f.quality.createReviewBatch({readerJobId:prior.jobId,clarification:refs[0]}),/ancestry/);
 // A second coherent interpretation for the same item must remain a distinct chain.
 const second=f.quality.createBlindBatch({references:[f.refs[0]],omitCompleted:false}),secondReader=f.quality.loadJob(second.jobId),secondReply=technicalReader(secondReader.job,[f.production.findRecord(f.refs[0]).request.source.logic.clues]);secondReply.items[0].claims[0].meaning+=' SECOND INTERPRETATION';
 f.quality.importResponse({jobId:second.jobId,runId:'second-interpretation',responseBytes:bytes(secondReply),operator:TECHNICAL_OPERATOR});f.quality.compare(second.jobId);
 const secondReview=f.quality.createReviewBatch({readerJobId:second.jobId}),secondSaved=f.quality.loadJob(secondReview.jobId),secondResult=technicalReviewer(secondSaved.job);secondResult.items[0].findings=[{...reply.items[0].findings[0],unitIds:[secondSaved.job.items[0].input.public.units[0].id]}];
 f.quality.importResponse({jobId:secondReview.jobId,runId:'second-review',responseBytes:bytes(secondResult),operator:TECHNICAL_OPERATOR});
 const secondRef={jobId:secondReview.jobId,itemId:secondSaved.job.items[0].itemId},secondFresh=f.quality.createBlindBatch({references:[f.refs[0]],omitCompleted:false,clarification:secondRef}),secondFreshSaved=f.quality.loadJob(secondFresh.jobId);
 f.quality.importResponse({jobId:secondFresh.jobId,runId:'second-fresh',responseBytes:bytes(technicalReader(secondFreshSaved.job,[f.production.findRecord(f.refs[0]).request.source.logic.clues])),operator:TECHNICAL_OPERATOR});f.quality.compare(secondFresh.jobId);
 assert.equal(f.quality.findReusable({reference:f.refs[0],stage:'reader',clarification:refs[0]}).jobId,fresh[0].job.jobId);assert.equal(f.quality.findReusable({reference:f.refs[0],stage:'reader',clarification:secondRef}).jobId,secondFresh.jobId);
 assert.throws(()=>f.quality.createReviewBatch({readerJobId:fresh[0].job.jobId,clarification:secondRef}),/ancestry/);
 const count=fs.readdirSync(f.quality.directory+'/jobs').length;f.batch=anotherBatch(f,'multi-partial',f.refs,{clarifications:1,replacements:0});const report=f.batch.run(f.manual);
 assert.deepEqual(report.work.map(w=>w.kind).sort(),['reader','reviewer']);assert.equal(fs.readdirSync(f.quality.directory+'/jobs').length,count+1);
 const pendingReader=report.details.evidence.find(e=>report.work.some(w=>w.id===e.work.id&&w.kind==='reader'));assert.equal(pendingReader.work.jobId,fresh[1].job.jobId);
 const pendingReviewer=report.details.evidence.find(e=>report.work.some(w=>w.id===e.work.id&&w.kind==='reviewer')),parent=f.quality.loadJob(pendingReviewer.quality.sidecar.items[0].readerJobId);
 assert.deepEqual(pendingReviewer.quality.sidecar.clarification,parent.sidecar.clarification);assert.deepEqual(pendingReviewer.quality.job.items[0].input.reader,f.quality.evidence(parent.job.jobId).results[0].result);
 const next=revisionReference(importPatch(f,f.refs[0],'clarification-new-revision').records[0]);assert.equal(f.quality.findReusable({reference:next,stage:'reader',clarification:refs[0]}),null);
});

test('variant-wide terminal history survives a method change but obsolete failures cannot count toward a new-method repair limit',()=>{
 const repo=path.join(root,'old-method-repo'),data=path.join(root,'old-method-data'),project=new URL('../../',import.meta.url);
 execFileSync('git',['clone','--quiet','--shared',project.pathname,repo]);
 for(const folder of ['scripts','src'])fs.cpSync(new URL('../../'+folder,import.meta.url),path.join(repo,folder),{recursive:true});
 fs.copyFileSync(new URL('../fixtures/flavor-quality/batch-history.mjs',import.meta.url),repo+'/tests/fixtures/flavor-quality/batch-history.mjs');
 fs.appendFileSync(repo+'/scripts/lib/flavor-quality-prompts.mjs','\n// Synthetic historical method boundary; no real model run.\n');
 fs.mkdirSync(data);execFileSync(process.execPath,[repo+'/tests/fixtures/flavor-quality/batch-history.mjs',data],{encoding:'utf8'});
 const [one,two]=JSON.parse(fs.readFileSync(data+'/history.json'));assert.notEqual(one.methodHash,METHOD_HASH);
 for(const source of [one,two]){
  const production=openProductionStore({directory:source.directory+'/production'}),quality=openQualityStore({directory:source.directory+'/quality',production}),f={production,quality,refs:[source.reference]};
  if(source===one){
   assert.equal(quality.findReusable({reference:source.reference,stage:'reader',clarification:source.partialClarification.reference,includePending:true}),null);
   assert.equal(quality.inspect(source.partialClarification.readerJobId).items[0].qualified,false);
   const current=revisionReference(importPatch(f,source.reference,'new-method-r3').records[0]);f.batch=anotherBatch(f,'current-method',[current]);
   const report=pauseRepair(f);assert.equal(report.summary.discardedStories,0);assert.equal(report.details.positions[0].failedRepairs,1);
  }else{
   f.batch=anotherBatch(f,'current-method',[source.reference]);const before=packageInventory(readTree(quality.directory+'/jobs')),report=f.batch.run(manualBetaAdapter({out:source.directory+'/out'}));
   assert.equal(report.work.length,0);assert.equal(report.summary.counts.blocked,1);assert.equal(report.summary.discardedStories,1);assert.deepEqual(packageInventory(readTree(quality.directory+'/jobs')),before);
  }
 }
});

test('variant-wide counting excludes positive and advisory revisions but retains two failed revisions when only the series self-reference advances',()=>{
 const f=setup(1,{clarifications:0,replacements:0});let ref=revisionReference(importPatch(f,f.refs[0],'positive-r2').records[0]);
 let result=f.batch.run(adapter(f,(v,w)=>{if(w.kind==='reviewer'){blockingReview(f,v,w);v.items[0].findings[0].severity='ADVISORY';}return v;}));assert.equal(result.summary.counts['technical-complete'],1);
 ref=revisionReference(importPatch(f,ref,'negative-r3').records[0]);f.batch=anotherBatch(f,'after-positive',[ref]);result=pauseRepair(f);assert.equal(result.summary.discardedStories,0);assert.equal(result.details.positions[0].failedRepairs,1);
 const g=setup(1,{clarifications:0,replacements:0});let own=revisionReference(importPatch(g,g.refs[0],'self-r2').records[0]);g.batch=anotherBatch(g,'self-a',[own],{clarifications:0,replacements:0},{version:1,episodes:[own]});pauseRepair(g);
 own=revisionReference(importPatch(g,own,'self-r3').records[0]);g.batch=anotherBatch(g,'self-b',[own],{clarifications:0,replacements:0},{version:1,episodes:[own]});result=pauseRepair(g);assert.equal(result.summary.discardedStories,1);assert.equal(result.summary.counts.blocked,1);
});

// Sealed d461120 plan/work format, built synthetically without rewriting snapshots.
function persistedMultiWork(f,jobId,references=f.refs,stage='reader',parent=null){
 const saved=f.quality.loadJob(jobId),id='persisted-'+(++n),base=f.quality.directory+'/batches/'+id;
 fs.mkdirSync(base+'/events',{recursive:true});fs.mkdirSync(base+'/work');
 const plan={version:1,id,method:'afebf95e6a50d41d7962ed78d5540700179938cd83ee78856f893317ef9c035d',qualityMethod:METHOD_HASH,references,context:{version:1,episodes:[]},budgets:{clarifications:1,technicalRetries:2,systematicFailures:3,replacements:1}};
 publishTree(base+'/plan',seal(new Map([['plan.json',json(plan)]])));
 const works=references.map((reference,i)=>{
  const b=saved.sidecar.items.find(b=>b.revisionRef.revisionHash===reference.revisionHash),readerItemId=stage==='reviewer'?b.readerItemId:null;
  const w={version:1,id:'legacy-work-'+i,kind:stage,jobId,itemId:b.itemId,reused:true,reference,round:0,binding:contentHash({reference,context:plan.context,method:METHOD_HASH,round:0,stage,parent,clarification:null,readerItemId}),parent,clarification:null};
  publishTree(base+'/work/'+w.id,seal(new Map([['work.json',json(w)]])));return w;
 });
 const before=packageInventory(readTree(base+'/plan')),workBefore=works.map(w=>packageInventory(readTree(base+'/work/'+w.id)));
 return {batch:openFlavorBatch({quality:f.quality,production:f.production,batchId:id}),works,unchanged(){assert.deepEqual(packageInventory(readTree(base+'/plan')),before);works.forEach((w,i)=>assert.deepEqual(packageInventory(readTree(base+'/work/'+w.id)),workBefore[i]));}};
}
function partialReply(f,jobId,index){const saved=f.quality.loadJob(jobId),reply=saved.job.stage==='reader'?technicalReader(saved.job,saved.sidecar.items.map(b=>f.production.findRecord(b.revisionRef).request.source.logic.clues)):technicalReviewer(saved.job);reply.items=[reply.items[index]];return reply;}

test('multi-item transport: pending reuse stays single-item; two old open items get independent complete jobs',()=>{
 const f=setup(2),old=f.quality.createBlindBatch({references:f.refs}),before=packageInventory(readTree(f.quality.directory+'/jobs/'+old.jobId));
 const r=f.batch.run(f.manual),readers=r.details.evidence.filter(e=>e.work.kind==='reader');
 assert.equal(readers.length,2);assert.equal(new Set(readers.map(e=>e.work.jobId)).size,2);assert.equal(f.manual.exports.length,2);
 for(const e of readers){assert.notEqual(e.work.jobId,old.jobId);assert.equal(e.quality.job.items.length,1);assert.deepEqual(e.quality.sidecar.items[0].revisionRef,e.work.reference);}
 const a=readers[0].work,reply={workId:a.id,responseBytes:bytes(response(f,a)),operator:TECHNICAL_OPERATOR};
 assert.ok(!f.batch.importMany([reply])[0].error);assert.equal(f.batch.importMany([reply])[0].created,false);
 const next=f.batch.run(f.manual);assert.deepEqual(next.work.map(w=>w.kind).sort(),['reader','reviewer']);assert.equal(next.summary.effort.technicalFailures,0);
 assert.deepEqual(packageInventory(readTree(f.quality.directory+'/jobs/'+old.jobId)),before);
 const g=setup(),single=g.quality.createBlindBatch({references:g.refs}),pending=g.batch.run(g.manual);assert.equal(pending.details.evidence[0].work.jobId,single.jobId);
});

test('multi-item transport: persisted single-needed reader accepts partial reply and three identical retries without failures',()=>{
 const f=setup(2),old=f.quality.createBlindBatch({references:f.refs}),legacy=persistedMultiWork(f,old.jobId,[f.refs[0]]),w=legacy.works[0];
 const reply={workId:w.id,responseBytes:bytes(partialReply(f,old.jobId,0)),operator:TECHNICAL_OPERATOR};
 for(let i=0;i<3;i++){const result=legacy.batch.importMany([reply])[0];assert.ok(!result.error);assert.equal(result.created,i===0);}
 legacy.batch.create({references:[f.refs[0]]});
 let report=legacy.batch.run(f.manual);assert.deepEqual(report.work.map(w=>w.kind),['reviewer']);assert.equal(report.summary.effort.technicalFailures,0);
 assert.deepEqual(f.quality.inspect(old.jobId).items.map(i=>i.reader),[true,false]);
 report=legacy.batch.run(f.manual);assert.equal(report.summary.status,'waiting-manual-transport');assert.equal(report.summary.effort.technicalFailures,0);legacy.unchanged();
});

test('multi-item transport: persisted shared reader exports once; sibling reply advances only its own item',()=>{
 const f=setup(2),old=f.quality.createBlindBatch({references:f.refs}),legacy=persistedMultiWork(f,old.jobId),[a,b]=legacy.works;
 let report=legacy.batch.run(f.manual);assert.equal(f.manual.exports.length,1);assert.equal(report.summary.effort.manualPackageExports,1);
 assert.deepEqual(f.manual.exports[0].itemIds,[a.itemId,b.itemId]);
 const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(f.manual.exports[0].out),'manifest/work-list.json')));assert.deepEqual(manifest.work[0].itemIds,[a.itemId,b.itemId]);
 // Valid B-only answer submitted through A transport must leave A open.
 const reply={workId:a.id,responseBytes:bytes(partialReply(f,old.jobId,1)),operator:TECHNICAL_OPERATOR};assert.ok(!legacy.batch.importMany([reply])[0].error);
 assert.equal(legacy.batch.importMany([{...reply,workId:b.id}])[0].created,false);
 report=legacy.batch.run(f.manual);assert.deepEqual(report.work.map(w=>w.kind).sort(),['reader','reviewer']);assert.deepEqual(f.quality.inspect(old.jobId).items.map(i=>i.reader),[false,true]);
 assert.equal(report.work.find(w=>w.kind==='reader').id,a.id);assert.equal(report.summary.effort.technicalFailures,0);
 assert.deepEqual(f.manual.exports.find(e=>e.role==='reader').itemIds,[a.itemId]);
 assert.equal(legacy.batch.importMany([reply])[0].created,false);
 const other={workId:a.id,responseBytes:bytes(partialReply(f,old.jobId,0)),operator:TECHNICAL_OPERATOR};assert.ok(!legacy.batch.importMany([other])[0].error);
 report=legacy.batch.run(f.manual);assert.ok(report.work.every(w=>w.kind==='reviewer'));assert.equal(report.work.length,2);assert.equal(report.summary.effort.technicalFailures,0);
 assert.equal(report.summary.effort.qualityImports,2);
 // A genuinely foreign envelope/item still fails, with spoiler-free diagnostics.
 const foreign=partialReply(f,old.jobId,0);foreign.items[0].itemId='foreign-private-marker';const rejected=legacy.batch.importMany([{workId:b.id,responseBytes:bytes(foreign)}])[0];assert.ok(rejected.error);assert.ok(!rejected.error.includes('private-marker'));
 const wrong=partialReply(f,old.jobId,0);wrong.jobId='foreign-job';assert.ok(legacy.batch.importMany([{workId:a.id,responseBytes:bytes(wrong)}])[0].error);
 // Recheck only original work snapshots; new reviewer work is legitimately appended.
 for(const w of legacy.works)assert.deepEqual(JSON.parse(readTree(f.quality.directory+'/batches/'+report.details.plan.id+'/work/'+w.id).get('work.json')),w);
});

test('multi-item transport: persisted reviewer partial reply retains provenance and leaves sibling review pending',()=>{
 const f=setup(2),reader=f.quality.createBlindBatch({references:f.refs});
 f.quality.importResponse({jobId:reader.jobId,runId:'complete-reader',responseBytes:bytes(technicalReader(f.quality.loadJob(reader.jobId).job,f.refs.map(r=>f.production.findRecord(r).request.source.logic.clues))),operator:TECHNICAL_OPERATOR});f.quality.compare(reader.jobId);
 const review=f.quality.createReviewBatch({readerJobId:reader.jobId}),legacy=persistedMultiWork(f,review.jobId,f.refs,'reviewer',reader.jobId),a=legacy.works[0];
 const reply={workId:a.id,responseBytes:bytes(partialReply(f,review.jobId,0)),operator:TECHNICAL_OPERATOR};
 for(let i=0;i<3;i++)assert.ok(!legacy.batch.importMany([reply])[0].error);
 const report=legacy.batch.run(f.manual);assert.deepEqual(f.quality.inspect(review.jobId).items.map(i=>i.review),[true,false]);assert.equal(report.work.length,1);assert.equal(report.work[0].kind,'reviewer');assert.equal(report.work[0].id,legacy.works[1].id);assert.deepEqual(f.manual.exports[0].itemIds,[legacy.works[1].itemId]);
 assert.equal(report.summary.counts['technical-complete'],1);assert.equal(report.summary.counts.qualified,undefined);assert.equal(report.summary.effort.technicalFailures,0);
 assert.ok(report.details.evidence.filter(e=>e.work.kind==='reader').every(e=>e.work.jobId===reader.jobId));
});

test('multi-item transport: new one-position batch leaves old sibling open and accepts only its regular single-item reply',()=>{
 const f=setup(2),old=f.quality.createBlindBatch({references:f.refs}),batch=anotherBatch(f,'one-needed-item',[f.refs[0]]);
 let report=batch.run(f.manual);assert.equal(report.work.length,1);const w=report.details.evidence.find(e=>e.work.kind==='reader').work,saved=f.quality.loadJob(w.jobId);
 assert.notEqual(w.jobId,old.jobId);assert.equal(saved.job.items.length,1);assert.deepEqual(saved.sidecar.items[0].revisionRef,f.refs[0]);
 assert.ok(!batch.importMany([{workId:w.id,responseBytes:bytes(response(f,w)),operator:TECHNICAL_OPERATOR}])[0].error);
 report=batch.run(f.manual);assert.deepEqual(report.work.map(w=>w.kind),['reviewer']);assert.equal(report.summary.effort.technicalFailures,0);assert.deepEqual(f.quality.inspect(old.jobId).items.map(i=>i.reader),[false,false]);
});
