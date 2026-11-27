import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {sha256} from './lib/content-hash.mjs';
import {hash} from './lib/flavor-quality-contract.mjs';
import {json} from './lib/flavor-production.mjs';
import {directory,readTree,withStoreLock,publishTree} from './lib/immutable-file-store.mjs';
import {packageInventory} from './lib/flavor-production-package.mjs';
import {groupJobs,createGroupFiles,writeGroup,importInbox,publishedIntegrity,verifyPublished} from './lib/flavor-handoff.mjs';
const viewRecipe=hash([fs.readFileSync(fileURLToPath(import.meta.url)),fs.readFileSync(new URL('./lib/flavor-handoff.mjs',import.meta.url)),fs.readFileSync(new URL('./render-quality-chart.py',import.meta.url))].map(sha256));
const parse=p=>JSON.parse(fs.readFileSync(p)),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function verifyRuntime(root,commit){assert.match(commit,/^[a-f0-9]{40}$/);assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),commit,'runtime commit mismatch');assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim(),'','runtime has tracked changes');}
export async function openPlan(file){
 const plan=parse(file),base=path.dirname(path.resolve(file));assert.equal(plan.version,1);const resolve=p=>path.resolve(base,p),datasets=[];
 for(const d of plan.datasets){
  const code=resolve(d.codeRoot);verifyRuntime(code,d.codeCommit);const module=n=>import(pathToFileURL(path.join(code,'scripts/lib/'+n+'.mjs')).href);
  const [{openProductionStore},{openQualityStore},{openFlavorBatch},validators]=await Promise.all([module('flavor-production-store'),module('flavor-quality-store'),module('flavor-batch'),module('flavor-quality-contract')]);
  const production=openProductionStore({directory:resolve(d.production),libraryDirectory:resolve(d.library)}),quality=openQualityStore({directory:resolve(d.quality),production}),batch=openFlavorBatch({quality,production,batchId:d.batchId});
  datasets.push({...d,production,quality,batch,validators,jobIds:[]});
 }
 return {plan,base,datasets,python:plan.python?resolve(plan.python):'python3'};
}
const noExecution={kind:'manual-beta',exports:[],execute:()=>[]};
function pendingJobs(datasets){
 const entries=[];
 for(const d of datasets){
  const report=d.batch.run(noExecution);d.report=report;d.jobIds=[...new Set(report.details.evidence.filter(e=>['reader','reviewer'].includes(e.work.kind)).map(e=>e.work.jobId))];
  const pending=new Set(report.work.map(w=>w.id)),byJob=new Map();
  for(const task of report.work.filter(w=>['reader','reviewer'].includes(w.kind))){
   const e=report.details.evidence.find(e=>e.work.id===task.id);assert.ok(e,'missing bound work evidence');
   const saved=d.quality.loadJob(e.work.jobId),binding=saved.sidecar.items.find(b=>e.work.itemId?b.itemId===e.work.itemId:hash(b.revisionRef)===hash(e.work.reference));
   const prior=byJob.get(saved.job.jobId);if(prior)prior.itemIds.push(binding.itemId);else byJob.set(saved.job.jobId,{datasetId:d.id,saved,itemIds:[binding.itemId],workId:e.work.id});
  }
  entries.push(...byJob.values());
  d.importResponse=({jobId,responseBytes,operator})=>{
   const response=JSON.parse(responseBytes),saved=d.quality.loadJob(jobId),works=d.report.details.evidence.filter(e=>e.work.jobId===jobId),match=works.find(e=>response.items.some(i=>i.itemId===(e.work.itemId??saved.sidecar.items.find(b=>hash(b.revisionRef)===hash(e.work.reference))?.itemId)));
   assert.ok(match,'no bound batch work');
   for(const i of response.items){const b=saved.sidecar.items.find(b=>b.itemId===i.itemId);assert.ok(b);assert.ok(!d.report.details.variantHistory.some(e=>e.type==='discarded'&&e.data.reference.caseId===b.revisionRef.caseId&&e.data.reference.flavorVariantId===b.revisionRef.flavorVariantId),'discarded variant');}
   const beforeImports=d.quality.inspect(jobId).effort.importedResponses;const r=d.batch.importMany([{workId:match.work.id,responseBytes,operator}])[0],after=d.quality.evidence(jobId).results,accepted=[],errors=[];
   for(const i of response.items){if(after.some(x=>hash(x.result)===hash(i)))accepted.push(i);else errors.push({itemId:i.itemId,kind:'not-accepted'});}
   if(r.error&&!accepted.length)throw Error(r.error);return {created:d.quality.inspect(jobId).effort.importedResponses>beforeImports,accepted,errors,missing:saved.job.items.filter(i=>!response.items.some(r=>r.itemId===i.itemId)).map(i=>i.itemId)};
  };
 }
 return entries;
}
function atomic(file,bytes){if(fs.existsSync(file)&&fs.readFileSync(file).equals(Buffer.from(bytes)))return;const tmp=file+'.new';fs.writeFileSync(tmp,bytes);fs.renameSync(tmp,file);}
export function refresh(context){
 const {base,datasets,python}=context;directory(base);return withStoreLock(base,()=>{
  const pending=pendingJobs(datasets),renderOptions={python,...(context.render?{render:context.render}:{})},stateFile=path.join(base,'transport-state.json'),state=fs.existsSync(stateFile)?parse(stateFile):{version:1,groups:[]};
  const assigned=new Set(state.groups.flatMap(g=>g.members.map(m=>m.datasetId+'/'+m.jobId)));
  for(const g of groupJobs(pending.filter(j=>!assigned.has(j.datasetId+'/'+j.saved.job.jobId)),{maxItems:context.plan.maxItems??2})){
   const prefix=g.stage==='reader'?'R':'V',number=prefix+String(state.groups.filter(g=>g.number.startsWith(prefix)).length+1).padStart(2,'0');state.groups.push({number,stage:g.stage,members:g.jobs.map(j=>({datasetId:j.datasetId,jobId:j.saved.job.jobId,initialItems:j.itemIds}))});
  }
  const rows=[];
  for(const g of state.groups){
   const jobs=g.members.map(m=>pending.find(j=>j.datasetId===m.datasetId&&j.saved.job.jobId===m.jobId)).filter(Boolean),count=jobs.reduce((n,j)=>n+j.itemIds.length,0);
   if(!count){
    let missing=0,stale=false;for(const m of g.members){const d=datasets.find(d=>d.id===m.datasetId),status=d.quality.inspect(m.jobId);for(const i of status.items.filter(i=>m.initialItems.includes(i.itemId))){stale ||= !i.applicable;if(i.applicable&&!(g.stage==='reader'?i.reader:i.review))missing++;}}
    const heldForInference=g.members.some(m=>datasets.find(d=>d.id===m.datasetId)?.report.heldWork?.some(w=>datasets.find(d=>d.id===m.datasetId).report.details.evidence.find(e=>e.work.id===w.id)?.work.jobId===m.jobId));rows.push({...g,count:missing,blocked:missing>0,status:missing?(heldForInference?'wartet auf unabhängigen Ergänzungsnachweis – keinen Reader starten':'technisch blockiert – lokale Fehlerdetails prüfen'):stale?'überholt – keine erneute Ausführung':'Antworten vollständig (keine Freigabe)',packages:g.packages??null});continue;
   }
   const cacheKey=hash({viewRecipe,jobs:jobs.map(j=>({dataset:j.datasetId,jobId:j.saved.job.jobId,inventory:hash(packageInventory(j.saved.files)),itemIds:j.itemIds}))});
   if(g.cacheKey===cacheKey&&g.packages){
    const verify=(p)=>{const out=path.dirname(path.resolve(base,p.start)),zip=path.resolve(base,p.zip);assert.ok(out.startsWith(path.join(base,'pakete',g.number)+path.sep),'cached package outside group');verifyPublished(out,zip,p.integrity);};verify(g.packages);g.packages.fallbacks.forEach(verify);
    rows.push({...g,count,status:g.number==='R01'||g.number==='V01'?'zuerst: kleine Bedienprobe nach Review':'vorbereitet: erst nach kleiner Bedienprobe'});continue;
   }
   const group={stage:g.stage,jobs},created=createGroupFiles(group,g.number,renderOptions),digest=hash([...created.files].map(([n,b])=>[n,hash(Buffer.from(b).toString('base64'))])).slice(0,20),dir=path.join(base,'pakete',g.number,digest,g.number);
   directory(path.dirname(dir));const result=writeGroup(dir,group,g.number,{...renderOptions,prepared:created});
   const fallbacks=[];let slot=0;for(const j of jobs)for(const itemId of j.itemIds){const num=g.number+'-'+(++slot),out=path.join(path.dirname(dir),num),r=writeGroup(out,{stage:g.stage,jobs:[{...j,itemIds:[itemId]}]},num,renderOptions);fallbacks.push({number:num,zip:path.relative(base,r.zip),start:path.relative(base,path.join(out,num+'-START.txt')),reading:path.relative(base,path.join(out,num+'-LESEFASSUNG.html')),integrity:publishedIntegrity(out,r.zip)});}
   g.cacheKey=cacheKey;g.packages={integrity:publishedIntegrity(dir,result.zip),zip:path.relative(base,result.zip),start:path.relative(base,path.join(dir,g.number+'-START.txt')),reading:path.relative(base,path.join(dir,g.number+'-LESEFASSUNG.html')),expected:created.manifest.work.map(w=>w.expectedFile),images:created.manifest.derivedPngs.map(f=>path.relative(base,path.join(dir,f.file))),fallbacks};rows.push({...g,count,status:g.number==='R01'||g.number==='V01'?'zuerst: kleine Bedienprobe nach Review':'vorbereitet: erst nach kleiner Bedienprobe'});
  }
  const snapshot=json({version:1,datasets:datasets.map(d=>({id:d.id,status:d.report.summary.status,counts:d.report.summary.counts,...(d.report.qualificationView?{qualificationView:d.report.qualificationView}:{})})),rows}),snapId=hash(JSON.parse(snapshot));directory(path.join(base,'status-snapshots'));publishTree(path.join(base,'status-snapshots',snapId),new Map([['status.json',snapshot]]));atomic(stateFile,json(state));
  const html='<!doctype html><html lang="de"><meta charset="utf-8"><title>Reader und Reviewer – Start</title><style>body{font:18px system-ui;max-width:1100px;margin:auto;padding:24px}article{border-top:2px solid #aaa;padding:18px 0}pre{white-space:pre-wrap}a{margin-right:15px}</style><h1>Reader UND Reviewer – nummerierter Start</h1><p>Zuerst genau R01 (zwei Serienfolgen) und V01 (zwei akzeptierte Einzelgeschichten) nach unabhängiger technischer Review erproben. Je ein frischer Rollenchat. Alle heruntergeladenen JSON-Dateien unverändert in EINGANG legen; keine Umbenennung. Dann IMPORT.command ausführen. Erst danach übrige vorbereitete Gruppen beginnen. Serien-Reviewer entstehen erst nach gültigen neuen Readerantworten.</p>'+(fs.existsSync(path.join(base,'LETZTER-IMPORT.json'))?'<p><a href="LETZTER-IMPORT.txt">Letzter Sammelimport – Übersicht</a></p>':'')+'<h2>Fortsetzungsstatus</h2><ul>'+datasets.map((d,i)=>'<li>Prüfbereich '+(i+1)+': '+esc(d.report.summary.status)+' · '+esc(JSON.stringify(d.report.summary.counts))+'</li>').join('')+'</ul>'+rows.map(r=>'<article><h2>'+esc(r.number)+' · '+(r.stage==='reader'?'Reader':'Reviewer')+' · '+r.count+' offen</h2><p>'+esc(r.status)+'</p>'+(r.count&&!r.blocked?'<p><a href="'+esc(r.packages.zip)+'">ZIP</a><a href="'+esc(r.packages.reading)+'">Direkt anhängbare Lesefassung</a><a href="'+esc(r.packages.start)+'">Starttext kopieren</a></p><pre>'+esc(fs.readFileSync(path.join(base,r.packages.start),'utf8'))+'</pre><p>Rückgaben: '+r.packages.expected.map(esc).join(', ')+'</p><p>PNG direkt zusätzlich zur Lesefassung anhängen: '+r.packages.images.map(f=>'<a href="'+esc(f)+'">'+esc(path.basename(f))+'</a>').join(' · ')+'</p><p>Einzel-Fallback nur alternativ, nicht zusätzlich ausführen: '+r.packages.fallbacks.map(f=>'<a href="'+esc(f.zip)+'">'+esc(f.number)+'</a> <a href="'+esc(f.start)+'">Starttext</a>').join(' · ')+'</p>':'')+'</article>').join('')+'<p>Kein semantisches Bestehen, keine Auswahl oder Veröffentlichung. Details bleiben in den privaten Stores; die Übersicht enthält keine Storytitel.</p></html>\n';
  atomic(path.join(base,'START.html'),html);atomic(path.join(base,'STATUS.json'),snapshot);directory(path.join(base,'EINGANG'));return {groups:rows.filter(r=>r.count).map(r=>({number:r.number,role:r.stage,items:r.count,status:r.status})),start:'START.html'};
 });
}
export async function main(args=process.argv.slice(2)){
 const [command,...rest]=args;assert.ok(['refresh','import'].includes(command),'Use refresh|import --plan FILE');assert.equal(rest[0],'--plan');assert.equal(rest.length,2);const context=await openPlan(rest[1]);
 let imported;if(command==='import'){
  withStoreLock(context.base,()=>{pendingJobs(context.datasets);imported=importInbox({directory:path.join(context.base,'EINGANG'),archive:path.join(context.base,'rueckgaben'),datasets:context.datasets,evidenceKind:context.plan.evidenceKind??'external-manual'});});
  const name=hash(imported.details);directory(path.join(context.base,'import-reports'));publishTree(path.join(context.base,'import-reports',name),new Map([['details.json',json(imported.details)],['summary.json',json(imported.summary)]]));
  atomic(path.join(context.base,'LETZTER-IMPORT.json'),json({...imported.summary,privateReport:'import-reports/'+name+'/details.json'}));
  atomic(path.join(context.base,'LETZTER-IMPORT.txt'),`Sammelimport: ${imported.summary.files} Dateien; ${imported.summary.accepted} angenommen; ${imported.summary.unchanged} unverändert; ${imported.summary.partialInvalid} teilweise ungültig; ${imported.summary.rejected} zurückgewiesen.\nPrivate Details: import-reports/${name}/details.json (nicht an Modelle geben).\n`);
 }
 return {imports:imported?.summary??null,transport:refresh(context)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)try{console.log(json(await main()));}catch(error){
 const category=/runtime/.test(error.message)?'runtime-pin':/PNG|Python|Pillow|renderer/.test(error.message)?'png-renderer':/lock/.test(error.message)?'store-lock':/positive-list|role|fact/.test(error.message)?'role-projection':'operator-plan-or-store';
 const messages={'runtime-pin':'Gepinnter Code fehlt, ist verändert oder hat einen anderen Commit.','png-renderer':'PNG-Erzeugung fehlgeschlagen: Python mit Pillow/numpy prüfen.','store-lock':'Ein Store wird bereits geschrieben. Erst nach Abschluss oder kontrollierter Wiederaufnahme erneut starten.','role-projection':'Rollenpaket verletzt die Positivliste; es wurde nicht freigegeben.','operator-plan-or-store':'Plan oder gebundener Store konnte nicht vollständig geprüft werden.'};
 try{const at=process.argv.indexOf('--plan'),base=path.dirname(path.resolve(process.argv[at+1]));directory(path.join(base,'operator-diagnostics'));publishTree(path.join(base,'operator-diagnostics',hash(error.message)),new Map([['detail.json',json({category,diagnostic:error.message})]]));}catch{}
 console.error(json({status:'blocked',category,message:messages[category],details:'operator-diagnostics/ (private)'}));process.exitCode=1;
}
