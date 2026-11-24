import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {productionFixture,technicalResponse} from '../fixtures/flavor-production.mjs';
import {createProductionOrder,createProductionRecords,json,prepareBetaEditorial} from '../../scripts/lib/flavor-production.mjs';
import {createProductionPackage,ROOT} from '../../scripts/lib/flavor-production-package.mjs';
import {openProductionStore,revisionReference,readTree} from '../../scripts/lib/flavor-production-store.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {main as cli} from '../../scripts/flavor-production.mjs';
const copy=structuredClone;
const tmp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gk-flavor-production-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const list=dir=>fs.readdirSync(dir).filter(n=>!n.startsWith('.'));
function setup(t,options={}){
 const dir=tmp(t),f=productionFixture(),store=openProductionStore({directory:path.join(dir,'store'),...options});
 store.saveOrder({...f,origin:f.origin});return {dir,f,store};
}
function imported(store,f,runId='technical-run-1'){
 const responseBytes=Buffer.from(json(technicalResponse(f.order)));
 return store.importResponse({orderId:f.order.orderId,runId,responseBytes});
}
function revised(f,records,{variant,stale=false}={}){
 const positions=copy(f.order.positions);
 positions.forEach((p,i)=>{p.intent=variant?{flavorVariantId:variant,revision:1,predecessor:null}:
 {flavorVariantId:p.intent.flavorVariantId,revision:records[i].draft.revision+1,predecessor:revisionReference(records[i])};
 if(stale)p.intent.predecessor.revisionHash='0'.repeat(64);});
 return createProductionPackage({...f,positions});
}

test('exact raw response and unknown provenance persist; repeat import is idempotent and selection remains explicitly unset',t=>{
 const {f,dir,store}=setup(t),one=imported(store,f),again=imported(store,f);
 assert.equal(one.created,true);assert.equal(again.created,false);assert.deepEqual(one.records,again.records);
 assert.equal(list(path.join(dir,'store/imports')).length,1);
 const receipt=JSON.parse(fs.readFileSync(path.join(dir,'store/imports/technical-run-1/receipt.json')));
 assert.deepEqual(receipt.operator,{origin:'operator-supplied',value:{model:null,producedAt:null}});
 assert.equal(receipt.observation.origin,'technically-observed');assert.ok(receipt.observation.importedAt);
 assert.equal(receipt.responseSha256,sha256(fs.readFileSync(path.join(dir,'store/imports/technical-run-1/response.json'))));
 for(const r of one.records){assert.equal(r.metadata.origin,'model-reported');assert.deepEqual(store.selected(r.caseId),{caseId:r.caseId,selected:null});}
 const bytes=Buffer.from(json(technicalResponse(f.order))+'\n');
 assert.throws(()=>store.importResponse({orderId:f.order.orderId,runId:'technical-run-1',responseBytes:bytes}),/run reference conflict/);
 assert.throws(()=>imported(store,f,'other-run'),/variant already exists/);
});

test('whole-batch validation rejects last-position failure, manifest substitution and wrong anchor without any drafts/selections',t=>{
 const {f,dir,store}=setup(t),response=technicalResponse(f.order);
 response.positions[3].clues.pop();
 assert.throws(()=>store.importResponse({orderId:f.order.orderId,runId:'bad',responseBytes:Buffer.from(json(response))}),/P04.*clue/);
 assert.deepEqual(list(path.join(dir,'store/imports')),[]);assert.deepEqual(list(path.join(dir,'store/selections')),[]);
 response.positions[3]=technicalResponse(f.order).positions[3];response.manifest=copy(f.order);response.manifest.positions[0].request.source.logic.start='A1';
 assert.throws(()=>store.importResponse({orderId:f.order.orderId,runId:'substitution',responseBytes:Buffer.from(json(response))}));
 assert.deepEqual(list(path.join(dir,'store/imports')),[]);
 assert.throws(()=>store.importResponse({orderId:'flavor-order-'+'0'.repeat(64),runId:'wrong-anchor',responseBytes:Buffer.from(json(technicalResponse(f.order)))}));
 assert.deepEqual(list(path.join(dir,'store/imports')),[]);
});

test('new story variants and revisions preserve predecessors, names, checks and explicit selection history',t=>{
 const {f,dir,store}=setup(t),first=imported(store,f),reference=revisionReference(first.records[0]);
 const event=store.selectRevision({reference,actor:'Technical test operator',reason:'TECHNICAL TEST selection'});
 assert.deepEqual(store.selected(reference.caseId),event);
 const next=revised(f,first.records);store.saveOrder({...next,origin:f.origin});
 const second=store.importResponse({orderId:next.order.orderId,runId:'technical-revision-2',responseBytes:Buffer.from(json(technicalResponse(next.order)))});
 assert.ok(second.records.every(r=>r.draft.revision===2));
 assert.deepEqual(second.records[0].predecessor,reference);assert.deepEqual(store.findRecord(reference),first.records[0]);
 assert.deepEqual(store.selected(reference.caseId),event,'import cannot change selection');
 const secondRef=revisionReference(second.records[0]);
 assert.throws(()=>store.selectRevision({reference:secondRef,actor:'Tester',reason:'stale'}),/stale selection/);
 const selected=store.selectRevision({reference:secondRef,actor:'Tester',reason:'TECHNICAL TEST revision selection',expectedSelectionHash:event.eventHash});
 assert.equal(selected.previous,event.eventHash);assert.equal(list(path.join(dir,'store/selections')).length,2);
 const other=revised(f,first.records,{variant:'other-story'});store.saveOrder({...other,origin:f.origin});
 const third=store.importResponse({orderId:other.order.orderId,runId:'technical-variant',responseBytes:Buffer.from(json(technicalResponse(other.order)))});
 assert.ok(third.records.every(r=>r.draft.revision===1&&r.flavorVariantId==='other-story'));
 assert.deepEqual(store.selected(reference.caseId),selected);
 assert.throws(()=>store.validateIntent(next.order),/stale or conflicting predecessor/);
 assert.throws(()=>store.saveOrder({...revised(f,first.records,{stale:true}),origin:f.origin}),/stale or conflicting predecessor/);
 const before=new Map([...readTree(path.join(dir,'store/imports/technical-run-1'))].map(([p,b])=>[p,sha256(b)]));
 assert.deepEqual(new Map([...readTree(path.join(dir,'store/imports/technical-run-1'))].map(([p,b])=>[p,sha256(b)])),before);
});

test('interrupted staging is invisible, damaged completed snapshots and exclusive locks fail closed',t=>{
 const {f,dir,store}=setup(t);
 const failing=openProductionStore({directory:store.directory,beforePublish:()=>{throw Error('TECHNICAL TEST interrupted publish');}});
 assert.throws(()=>imported(failing,f),/interrupted publish/);assert.deepEqual(list(path.join(dir,'store/imports')),[]);
 const pending=path.join(dir,'store/imports/.pending-aborted');fs.mkdirSync(pending);fs.writeFileSync(path.join(pending,'records.json'),'{');
 assert.deepEqual(store.selected('C-06'),{caseId:'C-06',selected:null});
 fs.writeFileSync(path.join(dir,'store/.write-lock'),'TECHNICAL TEST interrupted lock');assert.throws(()=>imported(store,f),/writer lock/);
 fs.unlinkSync(path.join(dir,'store/.write-lock'));imported(store,f);
 const raw=path.join(dir,'store/imports/technical-run-1/response.json');fs.writeFileSync(raw,'{}');
 assert.throws(()=>store.findRecord({caseId:'C-06',flavorVariantId:'independent-1',revision:1,revisionHash:'0'.repeat(64)}),/snapshot integrity/);
});

test('saved package and origin are immutable, verify before import, and exports reuse only exact bytes',t=>{
 const {f,dir,store}=setup(t),out=path.join(dir,'public');
 assert.equal(store.exportOrder(f.order.orderId,out).created,true);assert.equal(store.exportOrder(f.order.orderId,out).created,false);
 const file=path.join(out,'prompt.md');fs.appendFileSync(file,'changed');
 assert.throws(()=>store.exportOrder(f.order.orderId,out),/immutable snapshot conflict/);assert.match(fs.readFileSync(file,'utf8'),/changed$/);
 const origin=copy(f.origin);origin.positions[0].cardIntegritySha256='0'.repeat(64);
 assert.throws(()=>store.saveOrder({...f,origin}));
 const orderDir=path.join(dir,'store/orders',f.order.orderId);fs.appendFileSync(path.join(orderDir,'public/world/world.md'),'changed');
 assert.throws(()=>imported(store,f),/snapshot integrity/);assert.deepEqual(list(path.join(dir,'store/imports')),[]);
});

test('two independent import processes cannot accept conflicting revisions',async t=>{
 const {f,dir,store}=setup(t),a=technicalResponse(f.order),b=copy(a);b.positions[0].title+=' conflicting';
 const responseA=path.join(dir,'a.json'),responseB=path.join(dir,'b.json');fs.writeFileSync(responseA,json(a));fs.writeFileSync(responseB,json(b));
 const run=(name,file)=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['scripts/flavor-production.mjs','import','--store',store.directory,'--order',f.order.orderId,'--run',name,'--response',file],{cwd:ROOT});
  let stderr='';child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('exit',code=>resolve({code,stderr}));
 });
 const results=await Promise.all([run('racing-a',responseA),run('racing-b',responseB)]);
 assert.equal(results.filter(r=>r.code===0).length,1);assert.match(results.find(r=>r.code!==0).stderr,/writer lock|variant already exists/);
 assert.equal(list(path.join(dir,'store/imports')).length,1);
 assert.equal(store.selected('C-06').selected,null);
});

test('CLI requires explicit targets, prepares only a selected beta draft and never edits beta source',t=>{
 assert.throws(()=>cli(['pilot']),/Usage/);assert.throws(()=>cli(['pilot','--store','x','--out','y','--bad','x']),/Usage/);
 const {f,dir,store}=setup(t),original=fs.readFileSync(path.join(ROOT,'content/community-beta/s04-c-v1/editorial.json'));
 const output=path.join(dir,'editorial-draft.json');
 assert.throws(()=>cli(['materialize','--store',store.directory,'--case','C-06','--data-version','2','--out',output]),/no selected revision/);
 const result=imported(store,f);store.selectRevision({reference:revisionReference(result.records[0]),actor:'Tester',reason:'TECHNICAL TEST'});
 const report=cli(['materialize','--store',store.directory,'--case','C-06','--data-version','2','--out',output]);
 assert.equal(report.status,'draft');const editorial=JSON.parse(fs.readFileSync(output));assert.equal(editorial.cases.find(c=>c.id==='C-06').semanticReview,null);
 assert.deepEqual(fs.readFileSync(path.join(ROOT,'content/community-beta/s04-c-v1/editorial.json')),original);
 assert.throws(()=>cli(['materialize','--store',store.directory,'--case','C-06','--data-version','3','--out',output]),/EEXIST/);
});
