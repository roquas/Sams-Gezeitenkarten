// Explicit synthetic technical fixtures; never semantic reader/reviewer evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {importCommunityCards} from '../../scripts/lib/card-import.mjs';
import {loadCommunityProduction,createProductionPackage,packageInventory} from '../../scripts/lib/flavor-production-package.mjs';
import {technicalResponse} from '../fixtures/flavor-production.mjs';
import {openProductionStore,revisionReference} from '../../scripts/lib/flavor-production-store.mjs';
import {openQualityStore} from '../../scripts/lib/flavor-quality-store.mjs';
import {buildReaderInputs,createReaderJob,createReviewerJob} from '../../scripts/lib/flavor-quality-package.mjs';
import * as validators from '../../scripts/lib/flavor-quality-contract.mjs';
import {compareReaderItem} from '../../scripts/lib/flavor-quality-compare.mjs';
import {technicalReader,technicalReviewer,TECHNICAL_OPERATOR} from '../fixtures/flavor-quality/technical-responses.mjs';
import {auditRoleFiles,groupJobs,createGroupFiles,importInbox,renderPublicChart} from '../../scripts/lib/flavor-handoff.mjs';
import {readTree} from '../../scripts/lib/immutable-file-store.mjs';
import {openFlavorBatch} from '../../scripts/lib/flavor-batch.mjs';
import {verifyRuntime,refresh} from '../../scripts/flavor-handoff.mjs';
const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'series-handoff-')),bytes=v=>Buffer.from(JSON.stringify(v));let fixture,n=0;
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
function setup(){
 if(!fixture){const library=root+'/library',ids=['C-08','C-10','C-04','C-13','C-09'];importCommunityCards({directory:library,ids});const input=loadCommunityProduction({ids,libraryDirectory:library}),pkg=createProductionPackage(input),production=openProductionStore({directory:root+'/production',libraryDirectory:library});production.saveOrder({...pkg,origin:input.origin});const response=technicalResponse(pkg.order);response.positions.forEach((p,i)=>{p.title='TECHNICAL SYNTHETIC EPISODE '+(i+1);p.intro=['Synthetic independent background.'];});const records=production.importResponse({orderId:pkg.order.orderId,runId:'synthetic',responseBytes:bytes(response),operator:TECHNICAL_OPERATOR}).records;fixture={production,refs:records.map(revisionReference)};}
 const quality=openQualityStore({directory:root+'/quality-'+(++n),production:fixture.production});return {...fixture,quality,context:{version:1,episodes:fixture.refs}};
}
function reader(f,count=2){const job=f.quality.createBlindBatch({references:f.refs.slice(0,count),context:f.context}),saved=f.quality.loadJob(job.jobId),originals=f.refs.slice(0,count).map(r=>f.production.findRecord(r).request.source.logic.clues);return {...f,saved,reply:technicalReader(saved.job,originals),originals};}
function accept(f){return f.quality.importResponse({jobId:f.saved.job.jobId,runId:'technical-reader',responseBytes:bytes(f.reply),operator:TECHNICAL_OPERATOR});}

test('series scopes five different cards and repeated H/geo/names; own math only and complete independent relationships',()=>{
 const f=reader(setup(),5),maps=new Set(),names=[];for(const [i,item] of f.saved.job.items.entries()){
  validators.validateReaderItem(item,f.reply.items[i]);const p=item.input,series=p.seriesContext;assert.equal(series.version,2);assert.equal(series.episodes.length,4);assert.ok(!series.episodes.some(e=>e.episodeId===series.currentEpisodeId));assert.equal(p.units.filter(u=>u.scope==='series-context').length,4);assert.ok(f.reply.items[i].claims.every(c=>c.state!=='unresolved'));
  maps.add(validators.hash(p.chart.map));names.push(new Set(Object.values(p.chart.objectNames)));for(const e of series.episodes){assert.ok(f.saved.files.has(e.chartRef));const chart=JSON.parse(f.saved.files.get(e.chartRef));assert.ok(chart.start&&chart.objectNames['geo-01']);assert.ok(p.units.find(u=>u.episodeId===e.episodeId).text.includes(e.presentation.clues[0].text));}
  const comparison=compareReaderItem(item,f.reply.items[i],f.originals[i]);assert.ok(comparison.clues.every(c=>c.result==='equivalent'));assert.equal(comparison.clues.length,p.presentation.clues.length);
  const bad=structuredClone(f.reply.items[i]);bad.claims.find(c=>c.state==='formalized').episodeId=series.episodes[0].episodeId;assert.throws(()=>validators.validateReaderItem(item,bad));
  const foreign=structuredClone(f.reply.items[i]);const c=foreign.claims.find(c=>c.kind==='context');c.kind='mathematical';c.state='formalized';c.atoms=[f.originals[i][0]];assert.throws(()=>validators.validateReaderItem(item,foreign));
 }assert.equal(maps.size,5);assert.ok(names.some((s,i)=>names.some((t,j)=>i!==j&&[...s].some(x=>t.has(x)))));
 accept(f);f.quality.compare(f.saved.job.jobId);const v=f.quality.createReviewBatch({readerJobId:f.saved.job.jobId}),saved=f.quality.loadJob(v.jobId),reply=technicalReviewer(saved.job);for(const [i,item] of saved.job.items.entries()){validators.validateReviewerItem(item,reply.items[i]);assert.ok(validators.qualify(item,f.reply.items[i],item.input.comparison,reply.items[i]).qualified);}
 f.quality.importResponse({jobId:v.jobId,runId:'technical-review',responseBytes:bytes(reply),operator:TECHNICAL_OPERATOR});assert.ok(f.quality.inspect(v.jobId).items.every(i=>!i.qualified&&i.technicalWouldQualify));
});

test('series dependencies, added current math, hint outsourcing and deduction disclosure remain blocking',()=>{
 const f=reader(setup(),1);accept(f);f.quality.compare(f.saved.job.jobId);const v=f.quality.createReviewBatch({readerJobId:f.saved.job.jobId}),saved=f.quality.loadJob(v.jobId),item=saved.job.items[0],baseline=technicalReviewer(saved.job).items[0];
 for(const conclusion of ['dependency','contradiction','additional-condition','deduction-disclosure','uncertain']){const review=structuredClone(baseline);review.series[0].conclusion=conclusion;assert.equal(validators.qualify(item,f.reply.items[0],item.input.comparison,review).qualified,false);}
 const outsourcing=structuredClone(baseline);outsourcing.clues[0].selfContained=false;assert.equal(validators.qualify(item,f.reply.items[0],item.input.comparison,outsourcing).qualified,false);
 const extra=structuredClone(f.reply.items[0]),claim={...extra.claims.find(c=>c.state==='formalized'),id:'new-current-condition',clueId:null,unitIds:[f.saved.job.items[0].input.units.find(u=>u.scope==='series-context').id]};extra.claims.push(claim);extra.coverage.find(c=>c.unitId===claim.unitIds[0]).claimIds.push(claim.id);validators.validateReaderItem(f.saved.job.items[0],extra);
 const review=structuredClone(baseline);review.claims.push({claimId:claim.id,disposition:'supported',unitIds:claim.unitIds,factRefs:[],rationale:'TECHNICAL TEST: current transfer is not authorized'});assert.equal(validators.qualify(item,extra,item.input.comparison,review).qualified,false);
 const extraComparison=compareReaderItem(f.saved.job.items[0],extra,f.originals[0]),extraJob=createReviewerJob({readerJob:f.saved.job,readerSidecar:f.saved.sidecar,readerResults:[extra],comparisons:[extraComparison],originals:f.originals,files:f.saved.files}),scopeOnly=technicalReviewer(extraJob.job).items[0];scopeOnly.claims.find(c=>c.claimId===claim.id).disposition='authorized';scopeOnly.claims.find(c=>c.claimId===claim.id).factRefs=['public.episode','series.'+f.saved.job.items[0].input.seriesContext.episodes[0].episodeId+'.presentation'];assert.throws(()=>validators.validateReviewerItem(extraJob.job.items[0],scopeOnly),/authority/);
 const wrong=structuredClone(baseline);wrong.claims.find(c=>item.input.reader.claims.find(r=>r.id===c.claimId).scope==='current-episode').disposition='context-only';assert.throws(()=>validators.validateReviewerItem(item,wrong));
 const missing=structuredClone(f.reply.items[0]);missing.series.pop();assert.throws(()=>validators.validateReaderItem(f.saved.job.items[0],missing));
});

test('same-role pairs keep original job identities, shared public atlas, complete offline views and numbered fallback',()=>{
 const f=reader(setup(),2),saved=f.saved,entry={saved,itemIds:saved.job.items.map(i=>i.itemId)},png=Buffer.from([137,80,78,71,13,10,26,10]);let calls=0;
 const g=groupJobs([entry]);assert.equal(g.length,1);const result=createGroupFiles(g[0],'R01',{render:()=>{calls++;return png;}});assert.equal(calls,5);assert.equal(result.manifest.itemCount,2);assert.equal(result.manifest.derivedPngs.length,5);assert.equal(result.manifest.work[0].jobId,saved.job.jobId);assert.equal(result.manifest.work[0].expectedFile,'R01-01.response.json');
 const html=result.files.get('R01-LESEFASSUNG.html');assert.match(html,/R01 · Reader · 2 Episoden/);assert.doesNotMatch(html,/(src|href)="https?:/);assert.match(result.files.get('R01-START.txt'),/^R01 · Reader · 2 Episoden/);assert.ok(!html.includes('revisionRef'));assert.ok(!html.includes('sourceBinding'));
 const fallback=createGroupFiles({stage:'reader',jobs:[{saved,itemIds:[entry.itemIds[0]]}]},'R01-1',{render:()=>png});assert.equal(fallback.manifest.work[0].jobId,saved.job.jobId);assert.match(fallback.files.get('R01-1-START.txt'),/^R01-1 · Reader · 1 Episode/);
 const historical=createReaderJob(buildReaderInputs({production:f.production,references:f.refs.slice(0,1),context:f.context,seriesVersion:1}));const oldView=createGroupFiles({stage:'reader',jobs:[{saved:historical,itemIds:historical.job.items.map(i=>i.itemId)}]},'R02',{render:()=>png});assert.match(oldView.files.get('R02-START.txt'),/^R02 · Reader · 1 Episode/);
 const corrupt=structuredClone(saved.job);corrupt.items[0].input.chart.map.objects[0].privateProducer='SECRET';corrupt.items[0].inputHash=validators.hash(corrupt.items[0].input);const files=new Map(saved.files);files.set('job.json',bytes(corrupt));assert.throws(()=>auditRoleFiles({job:corrupt,files}));
 accept(f);f.quality.compare(saved.job.jobId);const review=f.quality.createReviewBatch({readerJobId:saved.job.jobId}),reviewSaved=f.quality.loadJob(review.jobId);auditRoleFiles(reviewSaved);const rv=createGroupFiles({stage:'reviewer',jobs:[{saved:reviewSaved,itemIds:reviewSaved.job.items.map(i=>i.itemId)}]},'V01',{render:()=>png});assert.match(rv.files.get('V01-START.txt'),/^V01 · Reviewer · 2 Episoden/);assert.ok(rv.files.get('V01-LESEFASSUNG.html').includes('original.H1'));assert.throws(()=>createGroupFiles({stage:'reader',jobs:[{saved:reviewSaved,itemIds:reviewSaved.job.items.map(i=>i.itemId)}]},'R02',{render:()=>png}));
});

test('download inbox matches envelopes, retains bytes, supports partial/multiple jobs, suffix duplicates and rejects conflicts safely',()=>{
 const f=reader(setup(),2),second=reader({...setup(),context:{version:1,episodes:[]}},1),inbox=root+'/inbox',archive=root+'/arrivals';fs.mkdirSync(inbox);const datasets=[{quality:f.quality,validators,jobIds:[f.saved.job.jobId]},{quality:second.quality,validators,jobIds:[second.saved.job.jobId]}];
 const partial={...f.reply,items:[f.reply.items[0]]},raw=bytes(partial);fs.writeFileSync(inbox+'/arbitrary name (4).json',raw);fs.writeFileSync(inbox+'/copy (1).json',raw);fs.writeFileSync(inbox+'/download.dat',bytes(second.reply));
 let result=importInbox({directory:inbox,archive,datasets});assert.equal(result.summary.rejected,0);assert.equal(result.summary.newImports,2);assert.equal(result.summary.unchanged,1);assert.deepEqual(f.quality.inspect(f.saved.job.jobId).items.map(i=>i.reader),[true,false]);
 const stored=readTree(archive);assert.ok([...stored].some(([n,b])=>n.endsWith('raw-response.bin')&&b.equals(raw)));result=importInbox({directory:inbox,archive,datasets});assert.equal(result.summary.newImports,0);assert.equal(result.summary.rejected,0);
 const rest={...f.reply,items:[f.reply.items[1]]};fs.writeFileSync(inbox+'/next with any suffix.json',bytes(rest));fs.writeFileSync(inbox+'/broken.json','{"PRIVATE_INPUT_MARKER"');const foreign=structuredClone(f.reply);foreign.jobId='foreign';fs.writeFileSync(inbox+'/foreign.json',bytes(foreign));const conflict=structuredClone(partial);conflict.items[0].claims[0].meaning+=' CONFLICT';fs.writeFileSync(inbox+'/conflict.json',bytes(conflict));
 result=importInbox({directory:inbox,archive,datasets});assert.equal(result.summary.newImports,1);assert.equal(result.summary.rejected,3);assert.ok(!JSON.stringify(result.summary).includes('PRIVATE_INPUT_MARKER'));assert.ok(f.quality.inspect(f.saved.job.jobId).items.every(i=>i.reader));
});

test('real PNG contains the complete public legend/start with no carried source metadata',()=>{
 const wrapper=root+'/seekable-python';fs.writeFileSync(wrapper,"#!/usr/bin/env python3\nimport os,stat,runpy,sys\nassert stat.S_ISREG(os.fstat(0).st_mode), 'renderer input must have a finite file EOF'\nrunpy.run_path(sys.argv[1],run_name='__main__')\n");fs.chmodSync(wrapper,0o755);
 const f=reader(setup(),1),chart=f.saved.job.items[0].input.chart,png=renderPublicChart(chart,f.saved.files,'R01 / episode-01',{python:wrapper});assert.ok(png.length>10000);assert.equal(png.readUInt32BE(16),1126);let p=8,tags=[];while(p<png.length){const len=png.readUInt32BE(p);tags.push(png.subarray(p+4,p+8).toString());p+=12+len;}assert.ok(!tags.some(x=>['tEXt','zTXt','iTXt','eXIf'].includes(x)));fs.writeFileSync(root+'/rendered-test.png',png);
});

test('runtime pin rejects a wrong commit or tracked drift instead of reinterpreting historical methods',()=>{
 const repo=root+'/runtime';fs.mkdirSync(repo);execFileSync('git',['init','--quiet'],{cwd:repo});fs.writeFileSync(repo+'/marker','pinned');execFileSync('git',['add','marker'],{cwd:repo});execFileSync('git',['-c','user.name=Technical Test','-c','user.email=technical@example.invalid','commit','--quiet','-m','synthetic'],{cwd:repo});const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();verifyRuntime(repo,commit);assert.throws(()=>verifyRuntime(repo,'a'.repeat(40)));fs.writeFileSync(repo+'/marker','changed');assert.throws(()=>verifyRuntime(repo,commit));
});


test('authoritative batch refresh exports pairs once, retains stable groups and displays exhausted budgets as blocked',()=>{
 const f=setup(),batch=openFlavorBatch({quality:f.quality,production:f.production,batchId:'transport-guard'});batch.create({references:f.refs.slice(0,2),context:f.context});
 let renders=0;const base=root+'/operator',d={id:'current',quality:f.quality,production:f.production,batch,validators},ctx={base,plan:{maxItems:2},datasets:[d],render:()=>{renders++;return Buffer.from([137,80,78,71,13,10,26,10]);}};
 const first=refresh(ctx);assert.equal(first.groups.length,1);assert.equal(first.groups[0].items,2);const originalState=fs.readFileSync(base+'/transport-state.json');const members=JSON.parse(originalState).groups[0].members;assert.deepEqual(members.map(m=>f.quality.loadJob(m.jobId).sidecar.items[0].revisionRef),f.refs.slice(0,2));const beforeRenders=renders;refresh(ctx);assert.equal(renders,beforeRenders,'unchanged groups must not be rendered/exported again');assert.deepEqual(fs.readFileSync(base+'/transport-state.json'),originalState);
 const report=batch.report(),w=report.details.evidence.find(e=>e.work.kind==='reader').work,saved=f.quality.loadJob(w.jobId),originals=saved.sidecar.items.map(b=>f.production.findRecord(b.revisionRef).request.source.logic.clues);
 for(let i=0;i<3;i++){const bad=technicalReader(saved.job,originals);bad.items[0].coverage.pop();bad.items[0].coverage[0].assessment+=' BAD '+i;assert.ok(batch.importMany([{workId:w.id,responseBytes:bytes(bad),operator:TECHNICAL_OPERATOR}])[0].error);}
 const stopped=refresh(ctx);assert.match(stopped.groups[0].status,/blockiert/);const state=JSON.parse(fs.readFileSync(base+'/STATUS.json'));assert.equal(state.rows[0].blocked,true);assert.equal(state.rows[0].count,2);assert.match(fs.readFileSync(base+'/START.html','utf8'),/technisch blockiert/);assert.equal(batch.report().summary.effort.technicalFailures,3);
});
