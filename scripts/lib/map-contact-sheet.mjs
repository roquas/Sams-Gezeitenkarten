// Local diagnostic presentation of saved maps. No puzzle or geography generation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createInterface} from 'node:readline';
import {spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {PROGRAM_ROOT,validateBatchManifest,createBatchSummary,batchDecision} from './map-batch.mjs';
import {loadReleasedAssetCatalog} from './released-asset-catalog.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {sha256} from './content-hash.mjs';
import {assignAssets,createCatalogProfile} from '../../src/assets/assignment.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {HEXES,CHART_BOUNDS,CHART_VIEWBOX} from '../../src/ui/chart-geometry.mjs';
import {CHART_ASSET_SPEC,createChartBaseLayers} from '../../src/ui/chart-asset-contract.mjs';
import {drawAssetPlacements} from '../../src/ui/asset-layer.mjs';

const assert=(ok,message)=>{if(!ok)throw Error('map-contact-sheet: '+message);};
const same=(a,b,message)=>assert(isDeepStrictEqual(a,b),message);
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stableProvenance=({archiveCommit,...stable})=>stable;

export function selectAcceptedIndices(indices,count){
 assert(Array.isArray(indices)&&indices.length>0,'explicit nonempty accepted selection required');
 assert(indices.every(i=>Number.isSafeInteger(i)&&i>=0&&i<count),'accepted index outside batch');
 assert(new Set(indices).size===indices.length,'duplicate accepted index');
 return [...indices];
}

// Both handoff streams are read with bounded memory. Only explicitly selected
// cards are retained; accepted rows must be the exact ordered subset of attempts.
async function* jsonRows(file){
 const input=fs.createReadStream(file),lines=createInterface({input,crlfDelay:Infinity});
 try{for await(const line of lines)yield JSON.parse(line);}
 finally{lines.close();input.destroy();}
}

export async function readContactBatch(input){
 assert(Object.keys(input).every(k=>['batch','acceptedIndices','repositoryRoot'].includes(k)),'unknown contact batch option');
 const {batch,acceptedIndices,repositoryRoot=PROGRAM_ROOT}=input;
 const manifest=readJson(path.join(batch,'manifest.json')),options=validateBatchManifest(manifest);
 const released=loadReleasedAssetCatalog({repositoryRoot,...manifest.provenance});
 same(stableProvenance(manifest.provenance),stableProvenance(released.provenance),'release provenance mismatch');
 assert(/^[a-f0-9]{40}$/.test(manifest.provenance.archiveCommit),'invalid archive commit');
 const profile=createCatalogProfile(released.catalog);
 same(manifest.catalogProfile,profile,'catalog profile mismatch');
 const summary=readJson(path.join(batch,'summary.json'));
 assert(summary.batchFormatVersion===manifest.batchFormatVersion,'summary batch format mismatch');
 const {attemptedCount,acceptedCount,rejectedCount}=summary;
 assert(summary.targetCount===options.targetCount&&summary.maxAttempts===options.maxAttempts&&
  Number.isSafeInteger(attemptedCount)&&attemptedCount>=1&&attemptedCount<=options.maxAttempts&&
  Number.isSafeInteger(acceptedCount)&&acceptedCount>=0&&acceptedCount<=Math.min(attemptedCount,options.targetCount)&&
  rejectedCount===attemptedCount-acceptedCount,'invalid target batch counts');
 assert(summary.status===(acceptedCount===options.targetCount?'target-reached':'target-unreached')&&
  (summary.status==='target-reached'||attemptedCount===options.maxAttempts),'regularly finished target batch required');
 // Offline consumers can explicitly request the entire validated stream,
 // including a regularly completed batch with zero accepted maps.
 const selection=acceptedIndices==='all'?Array.from({length:acceptedCount},(_,i)=>i):selectAcceptedIndices(acceptedIndices,acceptedCount),wanted=new Set(selection),selected=new Map();
 const attemptedTotals=createBatchSummary(),acceptedTotals=createBatchSummary(),rejectionCounts={},repetitionHistogram={};
 const accepted=jsonRows(path.join(batch,'accepted.jsonl'));
 let position=0,acceptedPosition=0;
 try{
  for await(const row of jsonRows(path.join(batch,'candidates.jsonl'))){
   const label='candidate '+position;
   assert(position<attemptedCount&&row.index===position,label+': order/index mismatch');
   assert(row.generationSeed===options.seedStart+position&&row.assignmentSeed===options.assignmentSeedStart+position,label+': seed schedule mismatch');
   assert(!row.error&&row.generation,label+': failed/missing generation');
   const g=row.generation;
   assert(g.diagnostics?.seed===row.generationSeed,label+': generation seed mismatch');
   same(g.diagnostics.config,options.config,label+': generation config mismatch');
   same(g.diagnostics.generatorVersion,manifest.versions.generator,label+': generator version mismatch');
   same(g.diagnostics.catalogProfile,profile,label+': generation profile mismatch');
   assert(['generated','exhausted','inconclusive'].includes(g.status),label+': invalid generation status');
   if(g.map){
    assert(g.status==='generated',label+': unexpected map');validateMap(g.map,{separateObjects:true});
    assert(mapFingerprint(g.map)===row.mapFingerprint,label+': map fingerprint mismatch');
    // Recheck every concrete saved assignment, including unselected rows and
    // rejected partial assignments. Rendering always uses the stored placements.
    same(row.assignment,assignAssets({map:g.map,seed:row.assignmentSeed,catalog:released.catalog}),label+': saved assignment mismatch');
   }else assert(g.status!=='generated'&&row.mapFingerprint===null&&row.assignment===null,label+': missing map or unexpected assignment');
   const decision=batchDecision(row);
   same({decision:row.decision,rejectionReasons:row.rejectionReasons},decision,label+': acceptance decision/reasons mismatch');
   attemptedTotals.record(row);
   if(row.decision==='accepted'){
    assert(acceptedPosition<acceptedCount,label+': too many accepted candidates');
    const next=await accepted.next();assert(!next.done,label+': missing accepted row');
    same(next.value,row,label+': accepted row differs from original attempt');
    if(wanted.has(acceptedPosition))selected.set(acceptedPosition,row);
    acceptedPosition++;acceptedTotals.record(row);
    const repeated=Object.values(row.assignment.diagnostics.assetUsage).reduce((sum,n)=>sum+Math.max(0,n-1),0);
    repetitionHistogram[repeated]=(repetitionHistogram[repeated]??0)+1;
    assert(acceptedPosition<options.targetCount||position===attemptedCount-1,'attempts after target reached');
   }else for(const reason of row.rejectionReasons)rejectionCounts[reason]=(rejectionCounts[reason]??0)+1;
   position++;
  }
  assert((await accepted.next()).done,'unexpected extra accepted row');
 }finally{await accepted.return();}
 assert(position===attemptedCount&&acceptedPosition===acceptedCount,'candidate/accepted count mismatch/truncated batch');
 const metrics=({geography,assignment,errors})=>({geography,assignment,errors});
 same(metrics(attemptedTotals.summary),summary.attempted,'attempted summary mismatch');
 same({...metrics(acceptedTotals.summary),repetitionHistogram},summary.accepted,'accepted summary mismatch');
 same(rejectionCounts,summary.rejectionCounts,'summary rejection counts mismatch');
 return {manifest,summary,rows:selection.map(i=>selected.get(i)),acceptedIndices:selection,released};
}

// Decode only: no alpha/footprint inspection, pixel reapproval or image changes.
// All inputs have already passed the release loader's pinned inventory checks.
export function decodeContactImages(resources){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-contact-decode-'));
 try{
  const inventory=resources.map(({ref,bytes},i)=>{
   const file=path.join(directory,String(i));fs.writeFileSync(file,bytes);return {ref,file};
  });
  const input=path.join(directory,'images.json');fs.writeFileSync(input,JSON.stringify(inventory));
  const worker=spawnSync('python3',['-c',`import json, sys
from PIL import Image
with open(sys.argv[1]) as source: items = json.load(source)
for item in items:
 try:
  with Image.open(item['file']) as image:
   image.load()
   if image.format not in ('PNG', 'WEBP'): raise ValueError('unsupported image format')
 except Exception as error:
  sys.exit('Image decode failed: ' + item['ref'] + ': ' + str(error))
`,input],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:4*1024*1024});
  if(worker.error)throw worker.error;
  assert(worker.status===0,worker.stderr.trim()||'image decoder failed (python3 and Pillow required)');
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
}

// Tiny XML sink lets the existing DOM-independent renderers write static SVG.
// Resource URLs are rewritten only at serialization, never in library metadata.
export function elementFactory(resolveImage,prefix){
 return (tag,attributes={},text)=>{
  const attrs={...attributes};
  if(tag==='image')attrs.href=resolveImage(attrs.href);
  if(attrs.id)attrs.id=prefix+attrs.id;
  if(attrs['clip-path'])attrs['clip-path']=attrs['clip-path'].replace('url(#','url(#'+prefix);
  const children=[];
  return {append(...nodes){children.push(...nodes);},toString(){
   return '<'+tag+Object.entries(attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+escape(text??'')+children.join('')+'</'+tag+'>';
  }};
 };
}

// Saved geography is the only category source. Reuse the inner gameplay hexes,
// not the larger illustration footprints or asset placement rectangles.
function createGeographicGrid(el,map){
 const occupied=new Map(map.objects.flatMap(object=>object.cells.map(cell=>[cell,object.passable?'passable':'blocked'])));
 const grid=el('g',{'data-chart-layer':'geography',display:'none','pointer-events':'none','aria-hidden':'true',fill:'none','stroke-width':2,'stroke-opacity':0.8,'stroke-linejoin':'round'});
 for(const hex of HEXES){
  const category=occupied.get(hex.id)??'water';
  grid.append(el('polygon',{'data-cell':hex.id,'data-category':category,points:hex.polygon.map(p=>p.join(',')).join(' '),
   stroke:{water:'#216b9b',passable:'#c56a16',blocked:'#851f2a'}[category],'stroke-dasharray':category==='blocked'?'5 3':'none'}));
 }
 return grid;
}

export function renderContactSvg(row,library,files,resolveImage){
 assert(row.decision==='accepted'&&row.assignment?.status==='complete','only accepted complete maps can be rendered');
 const el=elementFactory(resolveImage,'candidate-'+row.index+'-');
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:CHART_VIEWBOX,role:'img','aria-labelledby':'candidate-'+row.index+'-title'});
 svg.append(el('title',{id:'title'},'Versuch '+row.index+' · '+row.assignment.status));
 svg.append(el('rect',{...CHART_BOUNDS,fill:'#e9d5b0'}));
 const {sea,frame}=createChartBaseLayers(el,files);svg.append(sea);
 const objects=el('g',{'data-chart-layer':'objects'});
 drawAssetPlacements(el,objects,row.assignment.placements,library,byId,new URL('https://released.invalid/'));
 svg.append(objects);
 svg.append(frame);
 svg.append(createGeographicGrid(el,row.generation.map));return svg.toString();
}

export async function createMapContactSheet(input){
 assert(Object.keys(input).every(k=>['batch','acceptedIndices','out','repositoryRoot'].includes(k)),'unknown contact sheet option');
 const {batch,acceptedIndices,out,repositoryRoot=PROGRAM_ROOT}=input;
 const {manifest,summary,rows,acceptedIndices:resultIndices,released}=await readContactBatch({batch,acceptedIndices,repositoryRoot});
 const {catalog,chartContract,readResource}=released,format=chartContract.format;
 same(format.version,CHART_ASSET_SPEC.version,'unsupported released chart contract');
 same(format.viewBox,CHART_VIEWBOX,'released SVG viewBox mismatch');
 same(format.svgBounds,CHART_BOUNDS,'released SVG bounds mismatch');
 same(chartContract.rendering.seaClip,CHART_ASSET_SPEC.seaClip,'released sea clipping mismatch');
 const background=catalog.library.backgrounds.find(b=>b.id===manifest.provenance.backgroundId);
 assert(format.files.sea===background.image,'released sea/background mismatch');
 const refs=[...new Set([format.files.sea,format.files.frame,...rows.flatMap(row=>row.assignment.placements.map(p=>
  catalog.library.assets.find(a=>a.id===p.assetId).image.path))])].sort();
 const resources=refs.map(ref=>{
  const bytes=readResource(ref);assert(/\.(png|webp)$/.test(ref),'unsupported image resource: '+ref);
  return {ref,bytes,file:sha256(bytes)+path.extname(ref)};
 });
 decodeContactImages(resources);
 const paths=new Map(resources.map(r=>[r.ref,'resources/'+r.file]));
 const resolveImage=ref=>{
  const key=ref.startsWith('https://released.invalid/')?new URL(ref).pathname.slice(1):ref;
  assert(paths.has(key),'unresolved released image: '+key);return paths.get(key);
 };
 const cards=rows.map((row,i)=>{
  const d=row.assignment.diagnostics;
  const identity='Ergebnis '+resultIndices[i]+' · Versuch '+row.index;
  const placements='<details><summary>Motivbelegung ('+row.assignment.placements.length+')</summary><ul>'+row.assignment.placements.map(p=>
   '<li><code>'+escape(p.objectId)+'</code> → <code>'+escape(p.assetId)+'</code> · Anker '+escape(p.anchor)+'</li>').join('')+'</ul></details>';
  return '<article data-attempt-index="'+row.index+'" data-result-index="'+resultIndices[i]+'"><h2>'+identity+' <span class="status">'+row.assignment.status+'</span></h2>'+renderContactSvg(row,catalog.library,format.files,resolveImage)+
   '<dl><dt>Seed</dt><dd>'+row.generationSeed+' · Zuordnungsseed '+row.assignmentSeed+'</dd><dt>Objekte</dt><dd>'+d.assignedCount+' illustriert · '+d.unassignedCount+' ohne Illustration</dd><dt>Kartenfingerprint</dt><dd><code>'+escape(row.mapFingerprint)+'</code></dd><dt>Innere Kartenversuche</dt><dd>'+row.generation.diagnostics.attempts+'</dd></dl>'+placements+'</article>';
 }).join('\n');
 // Also diagnose files removed/damaged after export. Classic inline JS works
 // under file://; it does not render maps or fetch remote data.
 const imageCheck='<script>Promise.all('+JSON.stringify(resources.map(r=>[paths.get(r.ref),r.ref]))+'.map(async ([url,ref])=>{const image=new Image();image.src=url;try{await image.decode();return null}catch{return ref}})).then(results=>{const failed=results.filter(Boolean);if(failed.length){const alert=document.getElementById("image-errors");alert.hidden=false;alert.textContent="Bildfehler: Grafiken fehlen oder sind beschädigt: "+failed.join(", ")}});</script>';
 const html='<!doctype html>\n<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Seekarten · Kontaktübersicht</title><style>body{margin:0;background:#eef0f2;color:#17232a;font:16px system-ui,sans-serif}header{padding:24px 32px;max-width:1100px}h1{margin:0 0 12px}h2{font-size:19px;margin:0 0 12px}.status{font:14px monospace;background:#e9edf1;padding:4px 8px;border-radius:4px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:24px;padding:0 24px 24px}article{min-width:0;padding:16px;background:white;border:1px solid #d3dce2;border-radius:8px}svg{display:block;width:100%;height:auto}dl{font-size:14px;line-height:1.6;margin-bottom:0}dt{font-weight:650}dd{margin:0 0 6px;overflow-wrap:anywhere}code{font-size:12px}header code,details{overflow-wrap:anywhere}details{font-size:13px;margin-top:12px}summary{cursor:pointer}li{margin:8px 0}</style>'+
  '<style>.show-hex-grid [data-chart-layer="geography"]{display:inline}.grid-toggle{display:flex;align-items:center;gap:10px;min-height:44px;width:fit-content;cursor:pointer}.grid-toggle input{width:22px;height:22px;margin:0;accent-color:#216b9b}.grid-toggle:focus-within{outline:2px solid #216b9b;outline-offset:4px}.grid-legend{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;margin:8px 0 0;padding:0;list-style:none}.grid-legend li{display:flex;align-items:center;gap:8px;margin:0}.grid-legend span{width:28px;border-top:3px solid #216b9b}.grid-legend .passable{border-color:#c56a16}.grid-legend .blocked{border-color:#851f2a;border-top-style:dashed}</style>'+
  '<header><h1>Seekarten · Kontaktübersicht</h1><p id="image-errors" role="alert" hidden style="color:#9b111e;font-weight:bold"></p><noscript>Die Bildfehleranzeige und der Rasterschalter benötigen JavaScript. Die Karten selbst sind statische SVG-Grafiken.</noscript><p>'+rows.length+' explizit ausgewählte Karten: '+resultIndices.join(', ')+' (akzeptierte Ergebnisindizes).</p>'+
  '<p>Batchstatus: '+escape(summary.status)+' · '+summary.acceptedCount+' / '+summary.targetCount+' akzeptiert · '+summary.attemptedCount+' Versuche · '+summary.rejectedCount+' verworfen. Ergebnis- und Versuchsindizes sind nullbasiert.</p>'+
  '<p>Release: <code>'+escape(manifest.provenance.releaseId)+'</code><br>Hintergrund: '+escape(manifest.provenance.backgroundId)+
  '<br>Batch-Programmcommit: <code>'+escape(manifest.program.commit)+'</code></p>'+
  '<label class="grid-toggle"><input id="hex-grid-toggle" type="checkbox">Hexraster anzeigen</label>'+
  '<ul class="grid-legend" aria-label="Legende des Hexrasters"><li><span aria-hidden="true"></span>Freies Wasserfeld</li><li><span class="passable" aria-hidden="true"></span>Befahrbares Objekt</li><li><span class="blocked" aria-hidden="true"></span>Unbefahrbares Objekt</li></ul>'+
  '</header><main>'+cards+'</main><script>const gridToggle=document.getElementById("hex-grid-toggle");gridToggle.checked=false;gridToggle.addEventListener("change",()=>document.documentElement.classList.toggle("show-hex-grid",gridToggle.checked));</script>'+imageCheck+'</html>\n';
 // Validate and render everything before reserving a new output directory.
 fs.mkdirSync(out);
 try{
  fs.mkdirSync(path.join(out,'resources'));
  for(const r of resources)fs.writeFileSync(path.join(out,'resources',r.file),r.bytes);
  fs.writeFileSync(path.join(out,'index.html'),html,{flag:'wx'});
 }catch(error){fs.rmSync(out,{recursive:true,force:true});throw error;}
 return {out:path.resolve(out,'index.html'),indices:rows.map(r=>r.index),resourceCount:resources.length,acceptedIndices:resultIndices};
}
