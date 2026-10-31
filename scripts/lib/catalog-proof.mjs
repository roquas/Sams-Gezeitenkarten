// Offline presentation of a verified candidate; no selection or approval policy.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {loadCatalogReleaseCandidate} from './catalog-release.mjs';
import {resourcePath} from './catalog-release-format.mjs';
import {sha256} from './content-hash.mjs';
import {decodeContactImages,elementFactory} from './map-contact-sheet.mjs';
import {HEXES,CHART_BOUNDS,CHART_VIEWBOX} from '../../src/ui/chart-geometry.mjs';
import {drawAssetPlacements} from '../../src/ui/asset-layer.mjs';
import {assetRectangle,placedCells} from '../../src/assets/geometry.mjs';
import {drawAssetReviewLayers} from '../../dev/asset-review-layers.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
import {motifName} from '../../dev/asset-curation.mjs';

const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const assert=(ok,message)=>{if(!ok)throw Error('catalog-proof: '+message);};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=p=>p.anchor+' · '+p.location+' · '+p.parity+' Zeile · '+p.cells.join(', ');
const classes=['ungerade','gerade'].flatMap(parity=>['Rand','Innen'].map(location=>({parity,location})));

export function proofPositions(asset,anchors){
 // Agreement with the verified candidate is mandatory before using today's
 // presentation helpers. Fixed asset orientations are part of their identity.
 const actual=HEXES.filter(h=>placedCells(asset,h.id).every(c=>byId[c])).map(h=>h.id).sort();
 assert(isDeepStrictEqual(actual,[...anchors].sort()),'runtime/candidate anchor mismatch: '+asset.id);
 const positions=reviewPositions(asset);
 assert(positions.length>0&&positions.every(p=>anchors.includes(p.anchor)),'no valid review positions: '+asset.id);
 const missingClasses=classes.filter(c=>!positions.some(p=>p.parity===c.parity&&p.location===c.location));
 return {positions,missingClasses};
}

export function renderProofSvg({asset,position,library,background,resolveImage,preview=false}){
 const el=elementFactory(resolveImage,''),rect=assetRectangle(asset,position.anchor,byId);
 // Zoom is a viewport only. The original geometry and transforms stay intact.
 const zoom=[rect.x-24,rect.y-24,rect.width+48,rect.height+48].join(' ');
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:zoom,'data-zoom':zoom,'data-board':CHART_VIEWBOX,
  role:'img','aria-label':motifName(asset)+' · '+label(position),'data-anchor':position.anchor});
 svg.append(el('image',{href:background.image,...CHART_BOUNDS,preserveAspectRatio:'xMidYMid meet'}));
 const objects=el('g',{'data-gallery-layer':'objects'}),instances=[{id:'review',assetId:asset.id,anchor:position.anchor}];
 drawAssetPlacements(el,objects,instances,library,byId,new URL('https://candidate.invalid/'));svg.append(objects);
 if(!preview)drawAssetReviewLayers(el,svg,instances,library);
 return svg.toString();
}

export function createCatalogProof({repositoryRoot,candidate,out,backgroundId,expectedCount}){
 const loaded=loadCatalogReleaseCandidate({repositoryRoot,candidate});
 const {manifest,manifestSha256,library,selection,validation}=loaded;
 // Refuse to interpret a historical candidate with changed game geometry or
 // rendering code, even if the list of board anchors happens to be unchanged.
 const runtimeContracts=['src/assets/geometry.mjs','src/engine/hex.mjs','src/ui/chart-geometry.mjs','src/ui/place-labels.mjs','src/ui/asset-layer.mjs'].map(ref=>{
  const expected=validation.implementation.files.find(f=>f.path===ref);
  const digest=sha256(fs.readFileSync(new URL('../../'+ref,import.meta.url)));
  assert(expected?.sha256===digest,'runtime/candidate geometry or renderer mismatch: '+ref);
  return {path:ref,sha256:digest};
 });
 if(backgroundId===undefined){assert(selection.backgrounds.length===1,'specify --background for multiple backgrounds');backgroundId=selection.backgrounds[0].backgroundId;}
 const selected=selection.backgrounds.find(b=>b.backgroundId===backgroundId);
 assert(selected,'background absent from candidate selection: '+backgroundId);
 const ids=selected.geographicAssetIds,background=library.backgrounds.find(b=>b.id===backgroundId);
 const warnings=[];
 if(expectedCount!==undefined&&ids.length!==expectedCount)warnings.push('Erwartet: '+expectedCount+' Motive; Kandidat enthält '+ids.length+'. Die vollständige tatsächliche Auswahl wird dargestellt.');
 const resources=new Map(),resolveImage=url=>{
  const ref=url.startsWith('https://candidate.invalid/')?new URL(url).pathname.slice(1):url;
  assert(resources.has(ref),'unresolved image: '+ref);return resources.get(ref).url;
 };
 function capture(ref){
  if(resources.has(ref))return;
  const bytes=loaded.readResource(resourcePath(manifest.resourceBase,ref));
  assert(/\.(png|webp)$/.test(ref),'unsupported image: '+ref);
  decodeContactImages([{ref,bytes}]);
  resources.set(ref,{ref,bytes,url:'resources/'+sha256(bytes)+path.extname(ref)});
 }
 let backgroundError;
 try{capture(background.image);}catch(error){backgroundError=error.message;}
 const entries=[],cards=[],details=[];
 for(const [index,id] of ids.entries()){
  const asset=library.assets.find(a=>a.id===id),entry={assetId:id,status:'failed',positions:[],missingClasses:[]};
  let preview='',views='',error;
  try{
   assert(asset?.role==='geographic','selected geographic asset missing: '+id);
   const record=validation.placements.find(p=>p.backgroundId===backgroundId&&p.assetId===id);
   assert(record,'candidate placement evidence missing: '+id);
   Object.assign(entry,{name:motifName(asset),passable:asset.passable,occupiedHexCount:asset.geometry.cells.length,allowedAnchorCount:record.anchors.length},proofPositions(asset,record.anchors));
   if(backgroundError)throw Error(backgroundError);
   capture(asset.image.path);
   preview=renderProofSvg({asset,position:entry.positions[0],library,background,resolveImage,preview:true});
   views=entry.positions.map((position,i)=>'<div class="position" data-position-index="'+i+'"'+(i?' hidden':'')+'>'+renderProofSvg({asset,position,library,background,resolveImage})+'</div>').join('');
   entry.status='rendered';
  }catch(cause){error=cause.message;entry.error=error;}
  const unavailable=entry.missingClasses.map(c=>c.location+' / '+c.parity).join(', ');
  const status=error?'Nicht vollständig prüfbar: '+error:'Vollständig technisch darstellbar';
  cards.push('<button type="button" class="card" data-overview-asset="'+escape(id)+'" data-open="'+index+'">'+preview+'<strong>'+escape(entry.name??id)+'</strong><code>'+escape(id)+'</code><span>'+escape(asset?.passable?'Befahrbar':'Unbefahrbar')+' · '+(entry.occupiedHexCount??'?')+' Hex · '+(entry.allowedAnchorCount??'?')+' Anker</span><span class="asset-status"'+(error?' role="alert"':'')+'>'+escape(status)+'</span></button>');
  details.push('<article data-detail="'+index+'" hidden><h2>'+escape(entry.name??id)+'</h2><code>'+escape(id)+'</code><p class="asset-status">'+escape(status)+'</p>'+
   '<p>'+entry.positions.length+' Prüfpositionen. '+(unavailable?'Nicht vorhanden: '+escape(unavailable):'Alle vier Lageklassen vorhanden.')+' Feste Ausrichtung gemäß Assetdefinition; keine freie Drehung.</p>'+
   '<label>Prüfposition <select class="position-select"'+(error?' disabled':'')+'>'+entry.positions.map((p,i)=>'<option value="'+i+'">'+escape(label(p))+'</option>').join('')+'</select></label>'+views+'</article>');
  entries.push(entry);
 }
 const rendered=entries.filter(e=>e.status==='rendered').map(e=>e.assetId),failed=entries.filter(e=>e.status!=='rendered').map(e=>({assetId:e.assetId,error:e.error}));
 const complete=failed.length===0&&isDeepStrictEqual(rendered,ids)&&new Set(ids).size===ids.length;
 const report={reviewSchemaVersion:1,sourceCommit:manifest.sourceCommit,candidateId:manifest.releaseId,catalogId:manifest.catalogId,manifestSha256,selectionSha256:manifest.selectionSha256,
  backgroundId,libraryAssetCount:library.assets.length,selectedCount:ids.length,selectedAssetIds:ids,renderedCount:rendered.length,missingOrUnrenderable:failed,
  completeness:{status:complete?'passed':'failed',basis:'verified candidate selection.json',overviewCount:entries.length,uniqueCount:new Set(entries.map(e=>e.assetId)).size},
  states:{candidate:'technically-verified',proof:complete?'complete':'incomplete',manualVisualReview:'pending',formalCatalogApproval:'not-performed'},
  expectedCount:expectedCount??null,warnings,runtimeContracts,positionSelection:'dev/review-positions.mjs: first row-major anchor of each available parity/location class',assets:entries,
  resources:[...resources.values()].map(r=>({source:r.ref,path:r.url,sha256:sha256(r.bytes)}))};
 const css=fs.readFileSync(new URL('../../dev/catalog-proof.css',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../../dev/catalog-proof.mjs',import.meta.url),'utf8');
 const html='<!doctype html>\n<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Katalog · Korrekturfahne</title><style>'+css+'</style>'+
  '<header><h1>Katalog · Korrekturfahne</h1><p>Technisch verifizierter Kandidat · '+rendered.length+' / '+ids.length+' Motive dargestellt · Vollständigkeit: '+(complete?'bestanden':'FEHLER')+'</p><p>Manuelle Sichtprüfung ausstehend. Keine Katalogfreigabe.</p>'+
  '<details><summary>Herkunft und Prüfbericht</summary><p>Quellcommit: <code>'+manifest.sourceCommit+'</code><br>Kandidat: <code>'+manifest.releaseId+'</code><br>Manifest SHA-256: <code>'+manifestSha256+'</code><br>Hintergrund: '+escape(backgroundId)+'</p><a href="review-manifest.json">Maschinenlesbarer Prüfbericht</a></details>'+
  warnings.map(w=>'<p role="alert">'+escape(w)+'</p>').join('')+'<p id="image-errors" role="alert" hidden></p><noscript>Die Detailnavigation benötigt JavaScript. Alle Motive stehen in der Übersicht.</noscript></header>'+
  '<main><div id="overview">'+cards.join('\n')+'</div><section id="detail" hidden aria-label="Detailprüfung"><nav><button id="back" type="button">Übersicht</button><button id="previous" type="button">← Vorheriges Motiv</button><span id="counter"></span><button id="next" type="button">Nächstes Motiv →</button></nav>'+
  '<div class="controls"><label><input id="hexes" type="checkbox"> Spielhexgrenzen (gelb)</label><label><input id="footprints" type="checkbox"> Zulässige Grafikfläche (türkis)</label><label><input id="whole-board" type="checkbox"> Gesamte Karte</label><button id="normal" type="button">Normalansicht</button></div>'+details.join('\n')+'</section></main>'+
  '<script id="proof-data" type="application/json">'+JSON.stringify({ids,resources:report.resources,assets:entries.map(e=>({assetId:e.assetId,resource:library.assets.find(a=>a.id===e.assetId)?.image.path})),background:background.image}).replace(/</g,'\\u003c')+'</script><script>'+js+'</script></html>\n';
 // All rendering precedes publication. Reserve a new directory, never overwrite
 // either a previous proof or the input candidate (also through symlinks).
 const destination=path.join(fs.realpathSync(path.dirname(path.resolve(out))),path.basename(out));
 const candidatePath=fs.realpathSync(candidate);
 assert(destination!==candidatePath&&!destination.startsWith(candidatePath+path.sep),'output must be outside candidate');
 const archive=path.join(fs.realpathSync(repositoryRoot),'archive');
 assert(destination!==archive&&!destination.startsWith(archive+path.sep),'output must be outside archive');
 fs.mkdirSync(destination);
 try{
  fs.mkdirSync(path.join(destination,'resources'));
  for(const r of resources.values())fs.writeFileSync(path.join(destination,r.url),r.bytes);
  fs.writeFileSync(path.join(destination,'index.html'),html);
  fs.writeFileSync(path.join(destination,'review-manifest.json'),JSON.stringify(report,null,2)+'\n');
 }catch(error){fs.rmSync(destination,{recursive:true,force:true});throw error;}
 return {html:path.join(destination,'index.html'),report:path.join(destination,'review-manifest.json'),candidateId:manifest.releaseId,sourceCommit:manifest.sourceCommit,renderedCount:rendered.length,complete,warnings};
}
