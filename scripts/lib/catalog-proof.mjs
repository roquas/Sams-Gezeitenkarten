// Offline presentation of a verified candidate; no selection or approval policy.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {loadCatalogReleaseCandidate} from './catalog-release.mjs';
import {resourcePath} from './catalog-release-format.mjs';
import {sha256} from './content-hash.mjs';
import {decodeContactImages,elementFactory} from './map-contact-sheet.mjs';
import {CHART_BOUNDS,CHART_CENTER} from '../../src/ui/chart-geometry.mjs';
import {hexVertices} from '../../src/ui/place-labels.mjs';
import {imageContract,GRAPHIC_CELL} from '../../src/assets/geometry.mjs';
import {motifName} from '../../dev/asset-curation.mjs';

const assert=(ok,message)=>{if(!ok)throw Error('catalog-proof: '+message);};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function relativeReviewGeometry(asset){
 const contract=imageContract(asset.geometry.cells);
 // imageContract already centers the permitted graphic cells on the image.
 // Recover each cell's translation from the original GRAPHIC_CELL vertex;
 // hexVertices supplies the exact inner gameplay hex at that local center.
 // No board anchor, lattice formula, clipping or additional validity rule.
 const hexPolygons=contract.polygons.map(polygon=>hexVertices(
  polygon[0][0]-GRAPHIC_CELL[0][0],polygon[0][1]-GRAPHIC_CELL[0][1]));
 return {contract,hexPolygons};
}

export function renderProofSvg({asset,background,resolveImage,preview=false}){
 const el=elementFactory(resolveImage,''),{contract,hexPolygons}=relativeReviewGeometry(asset);
 const rect={x:-contract.width/2,y:-contract.height/2,width:contract.width,height:contract.height};
 const viewBox=[rect.x-24,rect.y-24,rect.width+48,rect.height+48].join(' ');
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox,
  role:'img','aria-label':motifName(asset)+' · relative Belegungsform'});
 // Preserve the intended sea's scale, centered as a neutral texture sample.
 svg.append(el('image',{href:background.image,...CHART_BOUNDS,x:CHART_BOUNDS.x-CHART_CENTER[0],y:CHART_BOUNDS.y-CHART_CENTER[1],preserveAspectRatio:'xMidYMid meet'}));
 const objects=el('g',{'data-gallery-layer':'objects','data-asset-mosaic':'',style:'isolation:isolate'});
 objects.append(el('image',{href:asset.image.path,...rect,preserveAspectRatio:'xMidYMid meet',style:'mix-blend-mode:plus-lighter',
  'data-asset-id':asset.id,'data-occupied-cells':JSON.stringify(asset.geometry.cells),'pointer-events':'none','aria-hidden':'true'}));
 svg.append(objects);
 if(!preview){
  for(const [name,polygons] of [['footprints',contract.polygons],['hexes',hexPolygons]]){
   const layer=el('g',{'data-gallery-layer':name,'pointer-events':'none'});
   polygons.forEach((polygon,i)=>layer.append(el('polygon',{points:polygon.map(p=>p.join(',')).join(' '),
    'data-relative-cell':asset.geometry.cells[i].join(','),fill:'none'})));
   svg.append(layer);
  }
 }
 return svg.toString();
}

export function createCatalogProof({repositoryRoot,candidate,out,backgroundId,expectedCount}){
 const loaded=loadCatalogReleaseCandidate({repositoryRoot,candidate});
 const {manifest,manifestSha256,library,selection,validation}=loaded;
 // Refuse to interpret a historical candidate with changed geometry code.
 const runtimeContracts=['src/assets/geometry.mjs','src/ui/chart-geometry.mjs','src/ui/place-labels.mjs'].map(ref=>{
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
 const resources=new Map(),resourceErrors=[],resolveImage=ref=>{
  assert(resources.has(ref),'unresolved image: '+ref);return resources.get(ref).url;
 };
 function capture(ref){
  if(resources.has(ref))return;
  try{
   const bytes=loaded.readResource(resourcePath(manifest.resourceBase,ref));
   assert(/\.(png|webp)$/.test(ref),'unsupported image: '+ref);
   decodeContactImages([{ref,bytes}]);
   resources.set(ref,{ref,bytes,url:'resources/'+sha256(bytes)+path.extname(ref)});
  }catch(error){resourceErrors.push({source:ref,error:error.message});throw error;}
 }
 let backgroundError;
 try{capture(background.image);}catch(error){backgroundError=error.message;}
 const entries=[],cards=[],details=[];
 for(const [index,id] of ids.entries()){
  const asset=library.assets.find(a=>a.id===id),entry={assetId:id,status:'failed'};
  let preview='',views='',error;
  try{
   assert(asset?.role==='geographic','selected geographic asset missing: '+id);
   Object.assign(entry,{name:motifName(asset),passable:asset.passable,occupiedHexCount:asset.geometry.cells.length,occupiedCells:structuredClone(asset.geometry.cells)});
   if(backgroundError)throw Error(backgroundError);
   capture(asset.image.path);
   preview=renderProofSvg({asset,background,resolveImage,preview:true});
   views=renderProofSvg({asset,background,resolveImage});
   entry.status='rendered';
  }catch(cause){error=cause.message;entry.error=error;}
  const status=error?'Nicht vollständig prüfbar: '+error:'Vollständig technisch darstellbar';
  cards.push('<button type="button" class="card" data-overview-asset="'+escape(id)+'" data-open="'+index+'">'+preview+'<strong>'+escape(entry.name??id)+'</strong><code>'+escape(id)+'</code><span>'+escape(asset?.passable?'Befahrbar':'Unbefahrbar')+' · '+(entry.occupiedHexCount??'?')+' Hex</span><span class="asset-status"'+(error?' role="alert"':'')+'>'+escape(status)+'</span></button>');
  details.push('<article data-detail="'+index+'" hidden><h2>'+escape(entry.name??id)+'</h2><code>'+escape(id)+'</code><p class="asset-status">'+escape(status)+'</p>'+
   '<p>Relative Belegungsform · '+(entry.occupiedHexCount??'?')+' Hex · '+(asset?.passable?'Befahrbar':'Unbefahrbar')+'</p>'+views+'</article>');
  entries.push(entry);
 }
 const rendered=entries.filter(e=>e.status==='rendered').map(e=>e.assetId),failed=entries.filter(e=>e.status!=='rendered').map(e=>({assetId:e.assetId,error:e.error}));
 const complete=failed.length===0&&isDeepStrictEqual(rendered,ids)&&new Set(ids).size===ids.length;
 const report={reviewSchemaVersion:2,sourceCommit:manifest.sourceCommit,candidateId:manifest.releaseId,catalogId:manifest.catalogId,manifestSha256,selectionSha256:manifest.selectionSha256,
  backgroundId,libraryAssetCount:library.assets.length,selectedCount:ids.length,selectedAssetIds:ids,renderedCount:rendered.length,missingOrUnrenderable:failed,
  completeness:{status:complete?'passed':'failed',basis:'verified candidate selection.json',overviewCount:entries.length,uniqueCount:new Set(entries.map(e=>e.assetId)).size},
  states:{candidate:'technically-verified',proof:complete?'complete':'incomplete',manualVisualReview:'pending',formalCatalogApproval:'not-performed'},
  expectedCount:expectedCount??null,warnings,runtimeContracts,
  geometry:{graphic:'imageContract(asset.geometry.cells)',hexes:'hexVertices at relative imageContract cell centers',coordinates:'image-centered SVG units; occupiedCells are axial'},assets:entries,
  resourceIntegrity:{status:resourceErrors.length?'failed':'passed',method:'verified Git bytes, SHA-256 and image decoding',errors:resourceErrors},
  resources:[...resources.values()].map(r=>({source:r.ref,path:r.url,sha256:sha256(r.bytes)}))};
 const css=fs.readFileSync(new URL('../../dev/catalog-proof.css',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../../dev/catalog-proof.mjs',import.meta.url),'utf8');
 const html='<!doctype html>\n<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Katalog · Korrekturfahne</title><style>'+css+'</style>'+
  '<header><h1>Katalog · Korrekturfahne</h1><p>Technisch verifizierter Kandidat · '+rendered.length+' / '+ids.length+' Motive dargestellt · Vollständigkeit: '+(complete?'bestanden':'FEHLER')+'</p><p>Manuelle Sichtprüfung ausstehend. Keine Katalogfreigabe.</p>'+
  '<details><summary>Herkunft und Prüfbericht</summary><p>Quellcommit: <code>'+manifest.sourceCommit+'</code><br>Kandidat: <code>'+manifest.releaseId+'</code><br>Manifest SHA-256: <code>'+manifestSha256+'</code><br>Hintergrund: '+escape(backgroundId)+'</p><a href="review-manifest.json">Maschinenlesbarer Prüfbericht</a></details>'+
  warnings.map(w=>'<p role="alert">'+escape(w)+'</p>').join('')+'<p id="image-errors" role="alert" hidden></p><noscript>Die Detailnavigation benötigt JavaScript. Alle Motive stehen in der Übersicht.</noscript></header>'+
  '<main><div id="overview">'+cards.join('\n')+'</div><section id="detail" hidden aria-label="Detailprüfung"><nav><button id="back" type="button">Übersicht</button><button id="previous" type="button">← Vorheriges Motiv</button><span id="counter"></span><button id="next" type="button">Nächstes Motiv →</button></nav>'+
  '<div class="controls"><label><input id="hexes" type="checkbox"> Relative Hex-Belegungsfläche (gelb)</label><label><input id="footprints" type="checkbox"> Zulässige Grafikfläche (türkis)</label><button id="normal" type="button">Normalansicht</button></div>'+details.join('\n')+'</section></main>'+
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
