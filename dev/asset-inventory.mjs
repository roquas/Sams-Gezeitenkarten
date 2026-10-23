import {compatibility,productionEnabled} from '../src/assets/library.mjs';
import {conceptualRole,availability,motifName} from './asset-curation.mjs';
export function renderAssetInventory(library,backgroundId){
 const container=document.getElementById('fullInventory');container.replaceChildren();
 const table=document.createElement('table'),head=document.createElement('tr');
 for(const title of ['Asset / Datei','Technische Rolle','Einordnung / Verwendung','Künstlerische Freigabe','Produktiv verwendbar','Freigabe-Hash (Bild / Hintergrund)']){
  const th=document.createElement('th');th.textContent=title;head.append(th);
 }
 table.append(head);
 for(const a of library.assets){
  const row=document.createElement('tr');row.dataset.catalogAsset=a.id;
  const review=library.reviews.find(r=>r.assetId===a.id&&r.backgroundId===backgroundId);
  const td=document.createElement('td'),id=document.createElement('div'),link=document.createElement('a');
  id.textContent=motifName(a)+' · '+a.id;link.href=a.image.path;link.textContent=a.image.path;link.target='_blank';link.rel='noopener';td.append(id,link);row.append(td);
  const values=[a.role+' / '+a.semanticClass+' / '+a.geometry.cells.length+' Hex · '+(a.role==='decoration'?'befahrbar, ohne Regelwirkung':a.passable?'befahrbar':'unbefahrbar'),conceptualRole(a)+' · '+availability(a),compatibility(library,a.id,backgroundId),productionEnabled(library,a.id,backgroundId)?'Ja':'Nein · '+(a.production==='enabled'?'Hintergrund nicht freigegeben':availability(a)),review?.status==='approved'?review.assetSha256+' / '+review.backgroundSha256:'—'];
  for(const value of values){const td=document.createElement('td');td.textContent=value;row.append(td);}
  table.append(row);
 }
 container.append(table);
 document.getElementById('fullInventoryStatus').textContent=library.assets.length+' Katalogeinträge · Freigaben ausschließlich für '+backgroundId+'. Historische und zurückgestellte Varianten sind keine aktuellen Empfehlungen.';
}
