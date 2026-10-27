// Local diagnostic presentation of saved maps. No puzzle or geography generation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createInterface} from 'node:readline';
import {spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {PROGRAM_ROOT,validateBatchManifest} from './map-batch.mjs';
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

export function selectCandidateIndices(indices,count){
 assert(Array.isArray(indices)&&indices.length>0,'explicit nonempty candidate selection required');
 assert(indices.every(i=>Number.isSafeInteger(i)&&i>=0&&i<count),'candidate index outside batch');
 assert(new Set(indices).size===indices.length,'duplicate candidate index');
 return [...indices];
}

export async function readContactBatch({batch,indices,repositoryRoot=PROGRAM_ROOT}){
 const manifest=readJson(path.join(batch,'manifest.json')),options=validateBatchManifest(manifest);
 indices=selectCandidateIndices(indices,options.count);
 const released=loadReleasedAssetCatalog({repositoryRoot,...manifest.provenance});
 same(stableProvenance(manifest.provenance),stableProvenance(released.provenance),'release provenance mismatch');
 assert(/^[a-f0-9]{40}$/.test(manifest.provenance.archiveCommit),'invalid archive commit');
 const profile=options.mode==='catalog-informed'?createCatalogProfile(released.catalog,{preferencePercent:options.preferencePercent}):null;
 same(manifest.catalogProfile,profile,'catalog profile mismatch');
 const summary=readJson(path.join(batch,'summary.json'));
 assert(summary.batchFormatVersion===manifest.batchFormatVersion&&summary.status==='completed'&&
  summary.requestedCount===options.count&&summary.processedCount===options.count&&
  isDeepStrictEqual(summary.errors,{}),'completed batch summary required');
 const wanted=new Set(indices),selected=new Map(),statuses={geography:{},assignment:{}};
 const input=fs.createReadStream(path.join(batch,'candidates.jsonl'));
 const lines=createInterface({input,crlfDelay:Infinity});
 let position=0;
 try{
  for await(const line of lines){
   const row=JSON.parse(line),label='candidate '+position;
   assert(position<options.count&&row.index===position,label+': order/index mismatch');
   assert(row.generationSeed===options.seedStart+position&&row.assignmentSeed===options.assignmentSeedStart+position,label+': seed schedule mismatch');
   assert(!row.error&&row.generation,label+': failed/missing generation');
   const g=row.generation;
   assert(g.diagnostics?.seed===row.generationSeed,label+': generation seed mismatch');
   same(g.diagnostics.config,options.config,label+': generation config mismatch');
   same(g.diagnostics.generatorVersion,options.mode==='free'?manifest.versions.generator:manifest.versions.catalogGenerator,label+': generator version mismatch');
   same(g.diagnostics.catalogProfile??null,profile,label+': generation profile mismatch');
   assert(['generated','exhausted','inconclusive'].includes(g.status),label+': invalid generation status');
   statuses.geography[g.status]=(statuses.geography[g.status]??0)+1;
   if(g.map){
    assert(g.status==='generated',label+': unexpected map');validateMap(g.map);
    assert(mapFingerprint(g.map)===row.mapFingerprint,label+': map fingerprint mismatch');
    assert(row.assignment&&['complete','partial','none'].includes(row.assignment.status),label+': missing/invalid assignment');
    const status=row.assignment.status;statuses.assignment[status]=(statuses.assignment[status]??0)+1;
   }else assert(g.status!=='generated'&&row.mapFingerprint===null&&row.assignment===null,label+': missing map or unexpected assignment');
   if(wanted.has(position)){
    assert(g.map,label+': no geographic map to preview ('+g.status+')');
    // Recheck the saved selection with the approved context. Render the saved
    // placements only; never replace them or turn an exception into coverage none.
    same(row.assignment,assignAssets({map:g.map,seed:row.assignmentSeed,catalog:released.catalog}),label+': saved assignment mismatch');
    selected.set(position,row);
   }
   position++;
  }
 }finally{lines.close();input.destroy();}
 assert(position===options.count,'candidate count mismatch/truncated batch');
 same(statuses.geography,summary.geography.statuses,'summary geography status mismatch');
 same(statuses.assignment,summary.assignment.statuses,'summary assignment status mismatch');
 return {manifest,rows:indices.map(i=>selected.get(i)),released};
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
function elementFactory(resolveImage,prefix){
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

export function renderContactSvg(row,library,files,resolveImage){
 const el=elementFactory(resolveImage,'candidate-'+row.index+'-');
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:CHART_VIEWBOX,role:'img','aria-labelledby':'candidate-'+row.index+'-title'});
 svg.append(el('title',{id:'title'},'Kandidat '+row.index+' · '+row.assignment.status));
 svg.append(el('rect',{...CHART_BOUNDS,fill:'#e9d5b0'}));
 const {sea,frame}=createChartBaseLayers(el,files);svg.append(sea);
 const objects=el('g',{'data-chart-layer':'objects'});
 drawAssetPlacements(el,objects,row.assignment.placements,library,byId,new URL('https://released.invalid/'));
 svg.append(objects);
 const missing=new Set(row.assignment.objects.filter(o=>o.status==='unassigned').map(o=>o.objectId));
 const diagnostic=el('g',{'data-chart-layer':'technical-placeholders'});
 for(const object of row.generation.map.objects)if(missing.has(object.id)){
  const g=el('g',{'data-unillustrated-object':object.id});
  g.append(el('title',{},'Technischer Platzhalter: '+object.id+' · '+object.cells.join(', ')));
  for(const cell of object.cells){
   const hex=byId[cell];
   g.append(el('polygon',{points:hex.polygon.map(p=>p.join(',')).join(' '),fill:'#ff00b7','fill-opacity':'.14',stroke:'#a80078','stroke-width':2,'stroke-dasharray':'5 3'}));
   g.append(el('text',{x:hex.center[0],y:hex.center[1]+6,'text-anchor':'middle','font-family':'monospace','font-weight':'bold','font-size':17,fill:'#85005f',stroke:'#fff','stroke-width':'.7','paint-order':'stroke'},'×'));
  }
  diagnostic.append(g);
 }
 svg.append(diagnostic,frame);return svg.toString();
}

export async function createMapContactSheet({batch,indices,out,repositoryRoot=PROGRAM_ROOT}){
 const {manifest,rows,released}=await readContactBatch({batch,indices,repositoryRoot});
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
 const cards=rows.map(row=>{
  const d=row.assignment.diagnostics;
  return '<article><h2>Kandidat '+row.index+' <span class="status">'+row.assignment.status+'</span></h2>'+renderContactSvg(row,catalog.library,format.files,resolveImage)+
   '<dl><dt>Seed</dt><dd>'+row.generationSeed+' · Zuordnungsseed '+row.assignmentSeed+'</dd><dt>Objekte</dt><dd>'+d.assignedCount+' illustriert · '+d.unassignedCount+' ohne Illustration</dd><dt>Kartenfingerprint</dt><dd><code>'+escape(row.mapFingerprint)+'</code></dd></dl></article>';
 }).join('\n');
 // Also diagnose files removed/damaged after export. Classic inline JS works
 // under file://; it does not render maps or fetch remote data.
 const imageCheck='<script>Promise.all('+JSON.stringify(resources.map(r=>[paths.get(r.ref),r.ref]))+'.map(async ([url,ref])=>{const image=new Image();image.src=url;try{await image.decode();return null}catch{return ref}})).then(results=>{const failed=results.filter(Boolean);if(failed.length){const alert=document.getElementById("image-errors");alert.hidden=false;alert.textContent="Bildfehler: Grafiken fehlen oder sind beschädigt: "+failed.join(", ")}});</script>';
 const html='<!doctype html>\n<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Seekarten · Kontaktübersicht</title><style>body{margin:0;background:#eef0f2;color:#17232a;font:16px system-ui,sans-serif}header{padding:24px 32px;max-width:1100px}h1{margin:0 0 12px}h2{font-size:19px;margin:0 0 12px}.status{font:14px monospace;background:#e9edf1;padding:4px 8px;border-radius:4px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:24px;padding:0 24px 24px}article{min-width:0;padding:16px;background:white;border:1px solid #d3dce2;border-radius:8px}svg{display:block;width:100%;height:auto}dl{font-size:14px;line-height:1.6;margin-bottom:0}dt{font-weight:650}dd{margin:0 0 6px;overflow-wrap:anywhere}code{font-size:12px}.legend{color:#85005f}header code{overflow-wrap:anywhere}</style>'+ 
  '<header><h1>Seekarten · Kontaktübersicht</h1><p id="image-errors" role="alert" hidden style="color:#9b111e;font-weight:bold"></p><noscript>Die Bildfehleranzeige benötigt JavaScript. Die Karten selbst sind statische SVG-Grafiken.</noscript><p>'+rows.length+' explizit ausgewählte Kandidaten: '+rows.map(r=>r.index).join(', ')+'. Modus: '+escape(manifest.options.mode)+'.</p>'+ 
  '<p class="legend">Magenta, gestrichelte Hexkonturen und ×: technische Platzhalter für Objekte ohne Illustration.</p><p>Release: <code>'+escape(manifest.provenance.releaseId)+'</code><br>Hintergrund: '+escape(manifest.provenance.backgroundId)+
  '<br>Batch-Programmcommit: <code>'+escape(manifest.program.commit)+'</code></p></header><main>'+cards+'</main>'+imageCheck+'</html>\n';
 // Validate and render everything before reserving a new output directory.
 fs.mkdirSync(out);
 try{
  fs.mkdirSync(path.join(out,'resources'));
  for(const r of resources)fs.writeFileSync(path.join(out,'resources',r.file),r.bytes);
  fs.writeFileSync(path.join(out,'index.html'),html,{flag:'wx'});
 }catch(error){fs.rmSync(out,{recursive:true,force:true});throw error;}
 return {out:path.resolve(out,'index.html'),indices:rows.map(r=>r.index),resourceCount:resources.length};
}
