import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {productionFixture,technicalResponse} from '../fixtures/flavor-production.mjs';
import {technicalReader,technicalReviewer,TECHNICAL_OPERATOR} from '../fixtures/flavor-quality/technical-responses.mjs';
import {openProductionStore,revisionReference} from '../../scripts/lib/flavor-production-store.mjs';
import {openQualityStore} from '../../scripts/lib/flavor-quality-store.mjs';
import {openFlavorBatch,manualBetaAdapter,technicalTestAdapter} from '../../scripts/lib/flavor-batch.mjs';
import {applyScopedPatch} from '../../scripts/lib/flavor-scoped-repair.mjs';
import {json,contentHash,materializeFlavorRevision} from '../../scripts/lib/flavor-production.mjs';
import {packageInventory} from '../../scripts/lib/flavor-production-package.mjs';
import {readTree} from '../../scripts/lib/immutable-file-store.mjs';
const root=fs.mkdtempSync('/private/tmp/f02b-batch-test-'),bytes=x=>Buffer.from(json(x));let n=0,fixture;
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
function setup(count=1,budgets={}){
 fixture??=productionFixture();const dir=path.join(root,String(++n));fs.mkdirSync(dir);
 const production=openProductionStore({directory:dir+'/prod'});production.saveOrder(fixture);
 const result=production.importResponse({orderId:fixture.order.orderId,runId:'technical-seed',responseBytes:bytes(technicalResponse(fixture.order)),operator:{model:'technical-test-adapter',producedAt:null}});
 const refs=result.records.slice(0,count).map(revisionReference),quality=openQualityStore({directory:dir+'/quality',production});
 const batch=openFlavorBatch({quality,production,batchId:'test'});batch.create({references:refs,budgets});
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
