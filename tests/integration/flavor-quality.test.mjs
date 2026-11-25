import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {preparePilotStore} from '../../scripts/lib/flavor-quality-pilot.mjs';
import {openQualityStore} from '../../scripts/lib/flavor-quality-store.mjs';
import {json} from '../../scripts/lib/flavor-production.mjs';
import {readTree,unseal,seal,publishTree} from '../../scripts/lib/immutable-file-store.mjs';
import {packageInventory,ROOT} from '../../scripts/lib/flavor-production-package.mjs';
import {validateReviewerItem,hash} from '../../scripts/lib/flavor-quality-contract.mjs';
import {technicalReader,technicalReviewer,TECHNICAL_OPERATOR} from '../fixtures/flavor-quality/technical-responses.mjs';
import {main} from '../../scripts/flavor-quality.mjs';
const copy=structuredClone,bytes=v=>Buffer.from(json(v));
const root=fs.mkdtempSync(path.join(os.tmpdir(),'f02b-integration-'));let pilot,serial=0;
function setup({count=1,beforePublish,production:override,context}={}){
 pilot??=preparePilotStore(path.join(root,'production'));
 const production=override??pilot.production,quality=openQualityStore({directory:path.join(root,'quality-'+(++serial)),production,beforePublish});
 const batch=quality.createBlindBatch({references:pilot.references.slice(0,count),context}),saved=quality.loadJob(batch.jobId);
 const originals=pilot.references.slice(0,count).map(r=>production.findRecord(r).request.source.logic.clues),reader=technicalReader(saved.job,originals);
 return {production,quality,batch,saved,reader};
}
function acceptReader(f,reader=f.reader,runId='reader'){return f.quality.importResponse({jobId:f.batch.jobId,runId,responseBytes:bytes(reader),operator:TECHNICAL_OPERATOR});}
function review(f){acceptReader(f);f.quality.compare(f.batch.jobId);const batch=f.quality.createReviewBatch({readerJobId:f.batch.jobId}),saved=f.quality.loadJob(batch.jobId);return {...f,reviewBatch:batch,reviewSaved:saved,reviewer:technicalReviewer(saved.job)};}
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));

test('manual three-stage API keeps real pilot/F01 bytes unchanged; no external responses or model calls are fabricated',()=>{
 const f=review(setup({count:4})),before=packageInventory(readTree(f.production.directory));
 const noReview=f.quality.inspect(f.reviewBatch.jobId);assert.ok(noReview.items.every(i=>!i.qualified&&!i.review));
 const result=f.quality.importResponse({jobId:f.reviewBatch.jobId,runId:'reviewer',responseBytes:bytes(f.reviewer),operator:TECHNICAL_OPERATOR});assert.equal(result.errors.length,0);
 const state=f.quality.inspect(f.reviewBatch.jobId);assert.ok(state.items.every(i=>!i.qualified&&i.technicalWouldQualify));assert.equal(state.effort.cost,null);assert.equal(state.effort.tokens,null);
 assert.deepEqual(packageInventory(readTree(f.production.directory)),before);
 for(const r of pilot.references){const record=f.production.findRecord(r);assert.ok(Object.values(record.checkpoint.checks).every(c=>c.status==='UNCERTAIN'));}
 assert.equal(f.quality.createReviewBatch({readerJobId:f.batch.jobId}).jobId,null);
 assert.equal(f.quality.createBlindBatch({references:pilot.references}).jobId,null);
});

test('partial valid envelope advances complete items atomically; invalid items/missing items stay technically open; re-export skips completed items',()=>{
 const f=setup({count:4}),response=copy(f.reader);response.items[1].coverage.pop();response.items.pop();
 const result=acceptReader(f,response);assert.equal(result.accepted.length,2);assert.equal(result.errors.length,1);assert.equal(result.missing.length,1);
 const progress=f.quality.inspect(f.batch.jobId);assert.equal(progress.items.filter(i=>i.reader).length,2);assert.ok(progress.items.every(i=>!i.qualified));
 assert.equal(f.quality.compare(f.batch.jobId).results.length,2);
 assert.equal(f.quality.createReviewBatch({readerJobId:f.batch.jobId}).items,2);
 const remaining=f.quality.createBlindBatch({references:pilot.references});assert.equal(remaining.items,2);assert.equal(remaining.skipped.length,2);
 const fixed=copy(f.reader);fixed.items=[fixed.items[1],fixed.items[3]];const complete=acceptReader(f,fixed,'reader-rest');assert.equal(complete.accepted.length,2);
 assert.equal(f.quality.inspect(f.batch.jobId).items.filter(i=>i.reader).length,4);
});

test('ambiguous/foreign envelope, duplicate JSON keys and unknown fields never yield partial success',()=>{
 const f=setup({count:2});const before=packageInventory(readTree(f.quality.directory));
 const mutations=[r=>r.items.push(copy(r.items[0])),r=>r.items[1].itemId='foreign',r=>r.jobId='foreign',r=>r.methodHash='0'.repeat(64),r=>r.qualified=true];
 for(const mutate of mutations){const bad=copy(f.reader);mutate(bad);assert.throws(()=>acceptReader(f,bad));}
 const raw=json(f.reader).replace('"stage": "reader"','"stage": "reviewer", "stage": "reader"');
 assert.throws(()=>f.quality.importResponse({jobId:f.batch.jobId,runId:'bad-json',responseBytes:Buffer.from(raw)}),/duplicate JSON key/);
 assert.deepEqual(packageInventory(readTree(f.quality.directory)),before);
});

test('exact bytes are idempotent, conflicting repeats are rejected and explicit writer lock blocks concurrent mutation',()=>{
 const f=setup();assert.equal(acceptReader(f).created,true);assert.equal(acceptReader(f).created,false);
 const changed=copy(f.reader);changed.items[0].claims[0].meaning+=' different';assert.throws(()=>acceptReader(f,changed,'reader'),/run conflict/);
 assert.throws(()=>acceptReader(f,changed,'other-run'),/contradictory repeat/);
 assert.equal(fs.readdirSync(path.join(f.quality.directory,'imports')).length,1);
 const lock=path.join(f.quality.directory,'.write-lock');fs.writeFileSync(lock,'test-held-lock');
 try{assert.throws(()=>acceptReader(f,f.reader,'blocked'),/writer lock exists/);}finally{fs.unlinkSync(lock);}
 assert.equal(acceptReader(f,f.reader,'next-run').created,true);
});

test('two real concurrent import processes serialize or reject lock contention without losing/changing accepted bytes',async()=>{
 const f=setup(),file=path.join(root,'concurrent-response.json');fs.writeFileSync(file,bytes(f.reader));
 const args=['scripts/flavor-quality.mjs','reader-import','--production-store',f.production.directory,'--quality-store',f.quality.directory,'--job',f.batch.jobId,
  '--run','concurrent','--response',file,'--evidence-kind','technical-test'];
 function run(){return new Promise(resolve=>{const child=spawn(process.execPath,args,{cwd:ROOT,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('close',code=>resolve({code,output}));});}
 const results=await Promise.all([run(),run()]);assert.ok(results.some(r=>r.code===0));for(const r of results)if(r.code!==0)assert.match(r.output,/writer lock exists/);
 assert.equal(f.quality.inspect(f.batch.jobId).items[0].reader,true);assert.equal(fs.readdirSync(path.join(f.quality.directory,'imports')).length,1);
});

test('interruption before publication exposes no partial import, releases own lock and permits exact retry',()=>{
 let interrupt=false;const f=setup({beforePublish:()=>{if(interrupt)throw Error('TECHNICAL injected interruption');}});interrupt=true;
 assert.throws(()=>acceptReader(f),/injected interruption/);assert.deepEqual(fs.readdirSync(path.join(f.quality.directory,'imports')),[]);
 assert.equal(fs.existsSync(path.join(f.quality.directory,'.write-lock')),false);assert.equal(f.quality.inspect(f.batch.jobId).items[0].reader,false);
 interrupt=false;assert.equal(acceptReader(f).created,true);
});

test('stale revision, context switch and changed actual series production invalidate applicability and reject new imports',()=>{
 pilot??=preparePilotStore(path.join(root,'production'));let latest=pilot.references[0];
 const production={...pilot.production,latestRevision:(c,v)=>c===pilot.references[0].caseId?latest:pilot.production.latestRevision(c,v)};
 const f=setup({production});const changedContext={version:1,episodes:[pilot.references[1]]};
 assert.throws(()=>f.quality.importResponse({jobId:f.batch.jobId,runId:'context',responseBytes:bytes(f.reader),context:changedContext}),/stale production revision\/context/);
 assert.equal(f.quality.inspect(f.batch.jobId,{context:changedContext}).items[0].applicable,false);
 latest={...latest,revision:2,revisionHash:'0'.repeat(64)};
 assert.throws(()=>acceptReader(f),/stale production revision\/context/);assert.equal(f.quality.inspect(f.batch.jobId).items[0].applicable,false);
 assert.equal(fs.readdirSync(path.join(f.quality.directory,'imports')).length,0);
});

function revisablePilot(){
 pilot??=preparePilotStore(path.join(root,'production'));
 const latest=new Map();
 const production={...pilot.production,latestRevision:(c,v)=>latest.get(c+'/'+v)??pilot.production.latestRevision(c,v)};
 return {production,revise:ref=>latest.set(ref.caseId+'/'+ref.flavorVariantId,{...ref,revision:ref.revision+1,revisionHash:'0'.repeat(64)})};
}

test('independent mixed-revision items retain reader/comparison/review progress without a repeated blind run',()=>{
 const source=revisablePilot(),f=review(setup({count:2,production:source.production}));
 const before=packageInventory(readTree(f.production.directory)),[changed,unchanged]=f.saved.job.items;
 source.revise(pilot.references[0]);
 for(const jobId of [f.batch.jobId,f.reviewBatch.jobId]){
  const items=f.quality.inspect(jobId).items;assert.deepEqual(items.map(i=>i.applicable),[false,true]);
  assert.ok(items[0].reasons.includes('stale-binding'));assert.ok(!items[1].reasons.includes('stale-binding'));
 }
 const comparison=f.quality.compare(f.batch.jobId);
 assert.deepEqual(comparison.results.map(i=>i.itemId),[unchanged.itemId]);assert.deepEqual(comparison.staleItemIds,[changed.itemId]);
 const next=f.quality.createReviewBatch({readerJobId:f.batch.jobId});assert.equal(next.items,1);
 const selected=f.quality.loadJob(next.jobId);assert.equal(selected.sidecar.items[0].revisionRef.caseId,'C-02');
 assert.equal(selected.sidecar.items[0].readerItemId,unchanged.itemId);
 // A late mixed reviewer reply retains old evidence, but only C-02 applies.
 const imported=f.quality.importResponse({jobId:f.reviewBatch.jobId,runId:'late-mixed-review',responseBytes:bytes(f.reviewer),operator:TECHNICAL_OPERATOR});
 assert.equal(imported.accepted.length,2);assert.equal(imported.applicable,false);
 assert.deepEqual(imported.staleItemIds,[f.reviewSaved.job.items[0].itemId]);
 const state=f.quality.inspect(f.reviewBatch.jobId).items;
 assert.deepEqual(state.map(i=>i.applicable),[false,true]);assert.equal(state[1].technicalWouldQualify,true);assert.ok(state.every(i=>!i.qualified));
 assert.equal(f.quality.createReviewBatch({readerJobId:f.batch.jobId}).jobId,null);
 const skipped=f.quality.createBlindBatch({references:[pilot.references[1]]});assert.equal(skipped.jobId,null);assert.equal(skipped.skipped.length,1);
 assert.deepEqual(packageInventory(readTree(f.production.directory)),before);
});

test('late mixed reader replies advance unchanged siblings and do not compare or review stale items',()=>{
 const source=revisablePilot(),f=setup({count:2,production:source.production}),[changed,unchanged]=f.saved.job.items;
 source.revise(pilot.references[0]);
 const result=acceptReader(f);assert.equal(result.accepted.length,2);assert.equal(result.applicable,false);assert.deepEqual(result.staleItemIds,[changed.itemId]);
 const replay=acceptReader(f);assert.equal(replay.created,false);assert.deepEqual(replay.staleItemIds,[changed.itemId]);
 const staleOnly=copy(f.reader);staleOnly.items=[staleOnly.items[0]];
 assert.throws(()=>acceptReader(f,staleOnly,'stale-only'),/stale production revision\/context/);
 const currentOnly=copy(f.reader);currentOnly.items=[currentOnly.items[1]];
 assert.equal(acceptReader(f,currentOnly,'current-only').applicable,true);
 assert.deepEqual(f.quality.inspect(f.batch.jobId).items.map(i=>i.applicable),[false,true]);
 assert.deepEqual(f.quality.compare(f.batch.jobId).results.map(i=>i.itemId),[unchanged.itemId]);
 const next=f.quality.createReviewBatch({readerJobId:f.batch.jobId});assert.equal(next.items,1);
 assert.equal(f.quality.loadJob(next.jobId).sidecar.items[0].revisionRef.caseId,'C-02');
});

test('changed shared series revisions still invalidate every dependent item while independent context remains available',()=>{
 const source=revisablePilot(),context={version:1,episodes:[pilot.references[2]]};
 const f=review(setup({count:2,production:source.production,context}));source.revise(pilot.references[2]);
 for(const jobId of [f.batch.jobId,f.reviewBatch.jobId])assert.ok(f.quality.inspect(jobId).items.every(i=>!i.applicable&&i.reasons.includes('stale-binding')));
 assert.throws(()=>acceptReader(f,f.reader,'changed-context'),/stale production revision\/context/);
 assert.throws(()=>f.quality.importResponse({jobId:f.reviewBatch.jobId,runId:'changed-context-review',responseBytes:bytes(f.reviewer),operator:TECHNICAL_OPERATOR}),/stale production revision\/context/);
 assert.throws(()=>f.quality.compare(f.batch.jobId),/stale comparison source/);
 assert.throws(()=>f.quality.createReviewBatch({readerJobId:f.batch.jobId}),/stale review source/);
 const independent=f.quality.createBlindBatch({references:[pilot.references[1]]});assert.equal(independent.items,1);
});

test('stored source, response, comparison and public package corruption fail closed; incoming response cannot replace local job',()=>{
 const f=setup();acceptReader(f);f.quality.compare(f.batch.jobId);
 const targets=[path.join(f.quality.directory,'imports/reader/response.json'),path.join(f.quality.directory,'jobs',f.batch.jobId,'binding.json'),
 path.join(f.quality.directory,'jobs',f.batch.jobId,'public/job.json'),path.join(f.quality.directory,'comparisons',fs.readdirSync(path.join(f.quality.directory,'comparisons'))[0],'comparison.json')];
 for(const file of targets){const old=fs.readFileSync(file);fs.appendFileSync(file,' ');try{assert.throws(()=>f.quality.inspect(f.batch.jobId),/integrity|mismatch/);}finally{fs.writeFileSync(file,old);}}
 const response=copy(f.reader);response.job={...f.saved.job};assert.throws(()=>acceptReader(f,response,'replacement'),/unknown|unbekannt/);
});

test('review requires every area/unit/clue/claim and source evidence; missing/defective review and open ERROR/UNCERTAIN block',()=>{
 const f=review(setup()),job=f.reviewSaved.job,item=job.items[0],good=f.reviewer.items[0];
 validateReviewerItem(item,good);
 const invalid=[r=>r.coverage.pop(),r=>r.checks.pop(),r=>r.claims.pop(),r=>r.clues.pop(),r=>r.observations.pop(),r=>r.checks[0].factRefs=['foreign'],r=>r.clues[0].factRefs=[],r=>r.qualified=true,
  r=>r.readerHash='0'.repeat(64),r=>r.comparisonHash='0'.repeat(64)];
 for(const mutate of invalid){const bad=copy(good);mutate(bad);assert.throws(()=>validateReviewerItem(item,bad));}
 const incomplete=copy(f.reviewer);incomplete.items[0].checks.pop();const result=f.quality.importResponse({jobId:job.jobId,runId:'incomplete',responseBytes:bytes(incomplete),operator:TECHNICAL_OPERATOR});assert.equal(result.errors.length,1);assert.equal(f.quality.inspect(job.jobId).items[0].review,false);
 for(const severity of ['ERROR','UNCERTAIN','ADVISORY']){
  const g=review(setup()),r=g.reviewer.items[0],unitId=g.reviewSaved.job.items[0].input.public.units[0].id;
  r.findings.push({id:'f1',severity,requirement:'TECHNICAL synthetic finding',unitIds:[unitId],factRefs:['public.rules'],rationale:'TECHNICAL test only',claimIds:[],method:'technical-test',evidenceRefs:['comparison'],repairTarget:null});
  g.quality.importResponse({jobId:g.reviewBatch.jobId,runId:'review',responseBytes:bytes(g.reviewer),operator:TECHNICAL_OPERATOR});
  const state=g.quality.inspect(g.reviewBatch.jobId).items[0];assert.equal(state.technicalWouldQualify,severity==='ADVISORY');
 }
});

test('equal effect cannot waive deduction disclosure, incomplete clue or reader-error; creative observations alone remain non-blocking',()=>{
 for(const change of ['deduction','incomplete','reader-error','area']){
  const f=review(setup()),r=f.reviewer.items[0];
  if(change==='deduction')r.clues[0].informationBoundary='deduction';
  if(change==='incomplete')r.clues[0].selfContained=false;
  if(change==='reader-error')r.claims[0].disposition='reader-error';
  if(change==='area')r.checks[0].conclusion='uncertain';
  f.quality.importResponse({jobId:f.reviewBatch.jobId,runId:'review',responseBytes:bytes(f.reviewer),operator:TECHNICAL_OPERATOR});
  assert.equal(f.quality.inspect(f.reviewBatch.jobId).items[0].technicalWouldQualify,false);
 }
 const f=review(setup());f.reviewer.items[0].observations[2].value='TECHNICAL: Piraten, Bier, Geister, absurde [N]-Ideen sind erlaubt';
 f.quality.importResponse({jobId:f.reviewBatch.jobId,runId:'review',responseBytes:bytes(f.reviewer),operator:TECHNICAL_OPERATOR});
 assert.equal(f.quality.inspect(f.reviewBatch.jobId).items[0].technicalWouldQualify,true);
});

test('CLI help and executable manual path use explicit separate stores and refuse wrong stages/unsafe output overwrites',()=>{
 assert.match(main(['--help']),/prepare-pilot[\s\S]*reader-import[\s\S]*compare[\s\S]*review-export[\s\S]*review-import[\s\S]*inspect/);
 const f=setup(),out=path.join(root,'public-cli');
 const args=['--production-store',f.production.directory,'--quality-store',f.quality.directory];
 assert.equal(main(['export',...args,'--job',f.batch.jobId,'--out',out]).created,true);assert.equal(main(['export',...args,'--job',f.batch.jobId,'--out',out]).created,false);
 const input=path.join(root,'cli-reader.json');fs.writeFileSync(input,bytes(f.reader));
 assert.throws(()=>main(['review-import',...args,'--job',f.batch.jobId,'--run','wrong-stage','--response',input]),/Incorrect import stage/);
 assert.equal(main(['reader-import',...args,'--job',f.batch.jobId,'--run','cli-reader','--response',input,'--evidence-kind','technical-test']).accepted.length,1);
 assert.equal(main(['compare',...args,'--job',f.batch.jobId]).results.length,1);
 const reviewOut=path.join(root,'review-cli'),reviewBatch=main(['review-export',...args,'--reader-job',f.batch.jobId,'--out',reviewOut]);assert.equal(reviewBatch.stage,'reviewer');
 const reviewFile=path.join(root,'cli-review.json');fs.writeFileSync(reviewFile,bytes(technicalReviewer(f.quality.loadJob(reviewBatch.jobId).job)));
 assert.equal(main(['review-import',...args,'--job',reviewBatch.jobId,'--run','cli-review','--response',reviewFile,'--evidence-kind','technical-test']).accepted.length,1);
 assert.equal(main(['inspect',...args,'--job',reviewBatch.jobId]).items[0].technicalWouldQualify,true);
 fs.appendFileSync(path.join(out,'prompt.txt'),'CHANGED');assert.throws(()=>main(['export',...args,'--job',f.batch.jobId,'--out',out]),/immutable snapshot conflict/);
 assert.throws(()=>main(['inspect',...args,'--job',f.batch.jobId,'--unknown','x']));
});

test('method changes preserve historical bytes but never transfer qualification or block a new current export',()=>{
 const f=setup(),jobDir=path.join(f.quality.directory,'jobs',f.batch.jobId),oldFiles=unseal(readTree(jobDir));
 const job=JSON.parse(oldFiles.get('public/job.json')),binding=JSON.parse(oldFiles.get('binding.json'));job.methodHash='0'.repeat(64);binding.methodHash=job.methodHash;
 oldFiles.set('public/job.json',json(job));oldFiles.set('binding.json',json(binding));
 const body=new Map([...oldFiles].filter(([n])=>n.startsWith('public/')&&n!=='public/inventory.json').map(([n,b])=>[n.slice(7),b]));oldFiles.set('public/inventory.json',json(packageInventory(body)));
 fs.rmSync(jobDir,{recursive:true});publishTree(jobDir,seal(oldFiles));
 const state=f.quality.inspect(f.batch.jobId);assert.equal(state.items[0].qualified,false);assert.equal(state.items[0].applicable,false);assert.deepEqual(state.items[0].reasons,['obsolete-method']);
 assert.throws(()=>acceptReader(f),/obsolete method/);
 assert.equal(f.quality.createBlindBatch({references:pilot.references.slice(0,1)}).items,1);
});
