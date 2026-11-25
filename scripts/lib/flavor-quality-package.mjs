// Public reader DTO is built field by field. Never serialize a production record.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sha256,canonicalJson} from './content-hash.mjs';
import {materializeFlavorRevision,json,same,revisionRefSchema} from './flavor-production.mjs';
import {revisionReference} from './flavor-production-store.mjs';
import {packageInventory,ROOT} from './flavor-production-package.mjs';
import {loadReleasedAssetCatalog} from './released-asset-catalog.mjs';
import {renderSavedMapSvg} from './map-contact-sheet.mjs';
import {READER_PROMPT,REVIEWER_PROMPT} from './flavor-quality-prompts.mjs';
import {COMPARE_METHOD} from './flavor-quality-compare.mjs';
import {QUALITY_VERSION,QUALITY_METHOD,UNIT_METHOD,hash,object,array,structure,textUnits,responseSchema} from './flavor-quality-contract.mjs';

const implementationFiles=['flavor-quality-contract.mjs','flavor-quality-compare.mjs','flavor-quality-package.mjs','flavor-quality-prompts.mjs','flavor-quality-store.mjs','flavor-quality-json.mjs','count-clue-normalization.mjs','../../src/engine/puzzle.mjs','../../src/engine/hex.mjs','../../src/engine/validate.mjs','../../src/puzzles/schema.mjs','../../src/puzzles/json-schema.mjs'];
const implementationHash=hash(implementationFiles.map(name=>sha256(fs.readFileSync(new URL(name,import.meta.url)))));
export const METHOD_HASH=hash({method:QUALITY_METHOD,implementationHash,units:UNIT_METHOD,comparison:COMPARE_METHOD,
 publicSourceView:'rules-job-reference-and-world-production-p01-p14-1',readerPrompt:READER_PROMPT,reviewPrompt:REVIEWER_PROMPT,readerSchema:responseSchema('reader'),reviewSchema:responseSchema('reviewer')});
export const contextSchema=object({version:{const:1},episodes:array(revisionRefSchema)});
export const EMPTY_CONTEXT={version:1,episodes:[]};
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(o,k)).map(k=>[k,structuredClone(o[k])]));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cachedReleases=new Map();
function releaseFor(origin){
 const opts={repositoryRoot:ROOT,releaseId:origin.link.release.releaseId,backgroundId:origin.link.release.backgroundId};
 const key=canonicalJson(opts);if(!cachedReleases.has(key))cachedReleases.set(key,loadReleasedAssetCatalog(opts));return cachedReleases.get(key);
}
export function resolveRevision(production,reference){
 const record=production.findRecord(reference),stored=production.loadOrder(record.orderId);
 const position=stored.order.positions.find(p=>p.positionId===record.positionId);
 const {puzzle,presentationHash}=materializeFlavorRevision(position,record);
 return {record,position,puzzle,presentationHash,stored};
}
function publicPresentation(puzzle){
 return {title:puzzle.presentation.title,intro:structuredClone(puzzle.presentation.intro),
 clues:Object.entries(puzzle.presentation.clueTexts).map(([id,text])=>({id,text}))};
}
export function buildReaderInputs({production,references,context=EMPTY_CONTEXT}){
 structure(context,contextSchema);assert.ok(references.length&&new Set(references.map(r=>canonicalJson(r))).size===references.length,'flavor quality: distinct revision references required');
 // editorial.context is deliberately not a source of actual series player text.
 assert.equal(new Set(context.episodes.map(r=>canonicalJson(r))).size,context.episodes.length,'flavor quality: duplicate series episode');
 const resolvedContext=context.episodes.map(r=>resolveRevision(production,r));
 const series={version:1,episodes:resolvedContext.map(r=>({presentation:publicPresentation(r.puzzle)}))};
 const contextBinding=hash({snapshot:context,presentations:resolvedContext.map(r=>r.puzzle.presentation)}),files=new Map(),entries=[];
 for(const [i,ref] of references.entries()){
  const r=resolveRevision(production,ref),{position,puzzle,stored,record}=r;
  const sourceRules=stored.files.get('rules.md');assert.ok(sourceRules);assert.equal(sha256(sourceRules),stored.order.inputHashes.rules);
  const rules=Buffer.from(sourceRules.toString().replace('Diese versionierte Erklärung beschreibt src/engine/puzzle.mjs und hex.mjs.\nDie verbindlichen konkreten Daten stehen je Position in request.source.logic.', 'Diese versionierte öffentliche Erklärung beschreibt die geltenden Engine-Regeln.\nDie konkreten öffentlichen Kartendaten, Start und Etappen stehen je Episode in job.json.'));
  // P15/P16 are private pilot-selection/calibration and future scope, not world/style facts.
  // Pin this public view; the complete unchanged source package remains locally bound.
  const productionSource=stored.files.get('world/production.md').toString();
  assert.ok(productionSource.includes('## P15 –'),'flavor quality: unsupported production source public view');
  const productionRules=Buffer.from(productionSource.split('## P15 –')[0].trimEnd()+'\n');
  // Same rules and world are required for a single batch; no silent cross-world mix.
  const common=new Map([['rules.md',rules],...['world.md','style.md','production.md'].map(name=>['world/'+name,name==='production.md'?productionRules:stored.files.get('world/'+name)])]);
  const worldManifest=JSON.parse(stored.files.get('world/manifest.json'));
  for(const [name,bytes] of common){assert.ok(bytes,'flavor quality: missing public source');if(files.has(name))assert.equal(sha256(files.get(name)),sha256(bytes),'flavor quality: mixed public sources');else files.set(name,bytes);}
  const origin=stored.binding.origin.positions.find(o=>o.caseId===position.caseId),released=releaseFor(origin),library=released.catalog.library,chartFiles=released.chartContract.format.files;
  const resources=[...new Set([chartFiles.sea,chartFiles.frame,...position.card.assetPlacements.map(p=>library.assets.find(a=>a.id===p.assetId).image.path)])],paths=new Map();
  for(const resource of resources){
   assert.match(resource,/\.(png|webp)$/);const bytes=released.readResource(resource),name='resources/'+sha256(bytes)+path.extname(resource);paths.set(resource,name);
   if(files.has(name))assert.equal(sha256(files.get(name)),sha256(bytes));else files.set(name,bytes);
  }
  const mapName='maps/m'+String(i+1).padStart(3,'0')+'.svg';
  const svg=renderSavedMapSvg({map:position.card.map,placements:position.card.assetPlacements,prefix:'m'+(i+1)+'-',title:'Öffentliche Karte',coordinates:true},library,chartFiles,resource=>{
   const ref=resource.startsWith('https://released.invalid/')?new URL(resource).pathname.slice(1):resource;assert.ok(paths.has(ref),'flavor quality: external resource');return '../'+paths.get(ref);
  });files.set(mapName,svg+'\n');
  const presentation=publicPresentation(puzzle);
  const chart={map:pick(position.card.map,['geometry','grid','objects']),start:puzzle.logic.start,steps:puzzle.logic.steps,
   objectNames:structuredClone(position.card.objectNames),background:position.card.background,
   assetPlacements:position.card.assetPlacements.map(p=>pick(p,['id','assetId','anchor','objectId'])),
   assets:[...new Set(position.card.assetPlacements.map(p=>p.assetId))].map(assetId=>{
    const a=library.assets.find(x=>x.id===assetId);return {id:assetId,image:paths.get(a.image.path)};
   }),image:mapName,imageSha256:sha256(svg+'\n')};
  const sources={rules:{version:puzzle.rulesVersion,sha256:sha256(rules)},world:{packageId:worldManifest.packageId,version:worldManifest.version,publicView:'production-p01-p14-1',
   files:['world.md','style.md','production.md'].map(name=>({path:'world/'+name,sha256:sha256(common.get('world/'+name))}))}};
  const input={presentation,chart,sources,seriesContext:series,unitMethod:UNIT_METHOD,units:textUnits(presentation,series)};
  const binding={revisionRef:revisionReference(record),sourceHash:position.sourceHash,presentationHash:r.presentationHash,contextHash:contextBinding,
   sourceBinding:hash({methodHash:METHOD_HASH,revisionRef:ref,request:record.request,presentation:puzzle.presentation,sources,
    world:stored.order.world,sourceRulesSha256:sha256(sourceRules),context,contextBinding}),publicInputHash:hash(input)};
  entries.push({input,binding,originals:structuredClone(puzzle.logic.clues)});
 }
 return {entries,files,context};
}
export function createReaderJob(inputs,{jobId='job-'+randomUUID(),itemIds=inputs.entries.map(()=>'item-'+randomUUID())}={}){
 assert.equal(itemIds.length,inputs.entries.length);assert.equal(new Set(itemIds).size,itemIds.length);
 const job={transportVersion:QUALITY_VERSION,stage:'reader',jobId,methodHash:METHOD_HASH,
 items:inputs.entries.map((e,i)=>({itemId:itemIds[i],inputHash:hash(e.input),input:e.input}))};
 const sidecar={version:1,stage:'reader',jobId,methodHash:METHOD_HASH,context:structuredClone(inputs.context),
 items:inputs.entries.map((e,i)=>({itemId:itemIds[i],...e.binding}))};
 return {job,sidecar,files:packageFiles(job,inputs.files)};
}
export function reviewFacts(publicInput,originals){
 return [{id:'public.map',value:publicInput.chart.map},{id:'public.names',value:publicInput.chart.objectNames},
 {id:'public.start',value:publicInput.chart.start},{id:'public.steps',value:publicInput.chart.steps},{id:'public.rules',value:publicInput.sources.rules},
 ...publicInput.sources.world.files.map(f=>({id:'world.'+path.basename(f.path,'.md'),value:f})),
 ...originals.map(c=>({id:'original.'+c.id,value:c}))];
}
export function createReviewerJob({readerJob,readerSidecar,readerResults,comparisons,originals,files},
 {jobId='job-'+randomUUID(),itemIds=readerJob.items.map(()=>'item-'+randomUUID())}={}){
 const items=readerJob.items.map((p,i)=>{
  const reader=readerResults[i],comparison=comparisons[i];assert.ok(reader&&comparison,'flavor quality: reader and comparison required');
  const input={public:p.input,originals:originals[i],facts:reviewFacts(p.input,originals[i]),reader,comparison};
  return {itemId:itemIds[i],inputHash:hash(input),input};
 });
 const job={transportVersion:1,stage:'reviewer',jobId,methodHash:METHOD_HASH,items};
 const sidecar={version:1,stage:'reviewer',jobId,methodHash:METHOD_HASH,context:readerSidecar.context,
 items:readerSidecar.items.map((b,i)=>({...b,itemId:itemIds[i],publicInputHash:items[i].inputHash,
  readerJobId:readerJob.jobId,readerItemId:readerJob.items[i].itemId,readerHash:hash(readerResults[i]),comparisonHash:hash(comparisons[i])}))};
 const sourceFiles=new Map([...files].filter(([name])=>name==='rules.md'||name.startsWith('world/')||name.startsWith('maps/')||name.startsWith('resources/')));
 return {job,sidecar,files:packageFiles(job,sourceFiles)};
}
export function packageFiles(job,sources){
 const files=new Map(sources),schema=responseSchema(job.stage);
 files.set('job.json',json(job));files.set('prompt.txt',job.stage==='reader'?READER_PROMPT:REVIEWER_PROMPT);files.set('response.schema.json',json(schema));
 const items=job.items.map(i=>job.stage==='reader'?{itemId:i.itemId,inputHash:i.inputHash,coverage:[],claims:[],interpretations:i.input.presentation.clues.map(c=>({clueId:c.id,claimIds:[]}))}:
  {itemId:i.itemId,inputHash:i.inputHash,readerHash:hash(i.input.reader),comparisonHash:hash(i.input.comparison),coverage:[],checks:[],claims:[],clues:[],findings:[],observations:[]});
 files.set('response-template.json',json({transportVersion:1,stage:job.stage,jobId:job.jobId,methodHash:METHOD_HASH,items}));
 const article=job.items.map(item=>{
  const p=job.stage==='reader'?item.input:item.input.public;
  const rows=p.chart.map.objects.map(o=>'<tr><td>'+escape(o.id)+'</td><td>'+escape(p.chart.objectNames[o.id])+'</td><td>'+o.cells.join(', ')+'</td><td>'+o.passable+'</td></tr>').join('');
  return '<article><h2>'+escape(p.presentation.title)+'</h2><p>Aufgabe: '+escape(item.itemId)+'. Start: '+escape(p.chart.start)+'. Etappen: '+p.chart.steps+'</p>'+p.presentation.intro.map(t=>'<p class="text">'+escape(t)+'</p>').join('')+'<object type="image/svg+xml" data="'+p.chart.image+'"></object><table><tr><th>ID</th><th>Name</th><th>Fläche</th><th>Befahrbar</th></tr>'+rows+'</table><ol>'+p.presentation.clues.map(c=>'<li class="text">'+escape(c.id)+': '+escape(c.text)+'</li>').join('')+'</ol></article>';
 }).join('\n');
 files.set('index.html','<!doctype html><html lang="de"><meta charset="utf-8"><title>Unabhängige Prüfung</title><style>body{font:16px system-ui;max-width:1000px;margin:auto;padding:24px}object{width:100%;aspect-ratio:563/473}td,th{border:1px solid #aaa;padding:6px}table{border-collapse:collapse}.text{white-space:pre-wrap}article{margin-bottom:60px}</style><h1>Unabhängige Prüfung</h1><p>Verbindlicher kompletter Auftrag: job.json, prompt.txt, rules.md, world/, response.schema.json. Tatsächlicher Serienkontext und Textabdeckung stehen vollständig in job.json.</p>'+article+'</html>\n');
 files.set('README.txt','Nur dieses gesamte Verzeichnis in einen frischen getrennten Chat ohne Repository-/Projektzugriff geben. prompt.txt ist die genaue Anweisung für alle Episoden. Keine lokalen Bindungen, Herkunfts-/Kalibrierungsdaten oder weiteren Anhänge hinzufügen. Alle Bilder sind offline relativ auflösbar. JSON-Ergebnis als unveränderte UTF-8-Datei zurückgeben. Die leere Vorlage ist kein Prüfergebnis.\n');
 files.set('inventory.json',json(packageInventory(files)));verifyQualityPackage(files);return files;
}
export function verifyQualityPackage(files){
 const body=new Map([...files].filter(([name])=>name!=='inventory.json'));
 same(JSON.parse(files.get('inventory.json')),packageInventory(body),'quality package inventory');
 const job=JSON.parse(files.get('job.json'));assert.equal(job.methodHash,METHOD_HASH,'flavor quality: unsupported method');
 same(JSON.parse(files.get('response.schema.json')),responseSchema(job.stage),'quality response schema');
 for(const item of job.items){
  assert.equal(item.inputHash,hash(item.input),'flavor quality: public item integrity');
  const p=job.stage==='reader'?item.input:item.input.public;
  assert.equal(sha256(files.get(p.chart.image)),p.chart.imageSha256,'flavor quality: chart integrity');
  assert.equal(sha256(files.get('rules.md')),p.sources.rules.sha256);
  for(const f of p.sources.world.files)assert.equal(sha256(files.get(f.path)),f.sha256);
 }
 // Every static SVG URL must resolve into this exact inventory; external URLs
 // and dangling resources are rejected before anything is exported.
 for(const [name,bytes] of files)if(name.endsWith('.svg')){
  for(const match of bytes.toString().matchAll(/(?:href|xlink:href)="([^"]+)"/g)){
   const ref=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));
   assert.ok(!match[1].includes(':')&&!ref.startsWith('../')&&files.has(ref),'flavor quality: unresolved/external static image');
  }
 }
 return job;
}
