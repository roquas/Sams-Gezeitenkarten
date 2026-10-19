import {renderAssetPreview} from './asset-usage.mjs';
import {compatibility,validatePlacements} from '../src/assets/library.mjs';
import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';
import {flavorPrototypes,passableSmallPlaces,freeMotifReviewPages} from './asset-curation.mjs';
export {flavorPrototypes,passableSmallPlaces} from './asset-curation.mjs';

export function setupFlavorComparison(){
 const select=document.getElementById('flavorAsset');
 for(const p of flavorPrototypes){const o=document.createElement('option');o.value=p.key;o.textContent=p.name;select.append(o);}
 select.value='gulls';
 const pages=document.getElementById('flavorMapPage');
 freeMotifReviewPages.forEach((keys,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=(i+1)+' · '+keys.map(key=>flavorPrototypes.find(p=>p.key===key).name).join(', ');pages.append(o);});
}

const signatures=new Map();
function changed(key,signature){if(signatures.get(key)===signature)return false;signatures.set(key,signature);return true;}
export function renderFlavorComparison(library){
 const options={marked:document.getElementById('prototypeMarks').checked,hexes:document.getElementById('hexes').checked};
 const optionsKey=JSON.stringify(options);
 const seaReviews=JSON.stringify(library.reviews.filter(r=>r.backgroundId==='sea-blue-01'));
 function card(container,p,usage){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  caption.textContent=p.name+' · '+compatibility(library,p.id,'sea-blue-01');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.dataset.flavor=p.key;svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
  figure.append(caption,svg);container.append(figure);
  renderAssetPreview(svg,library,p.id,usage,p.name,options);
 }
 if(changed('cards',optionsKey+seaReviews)){
  const container=document.getElementById('flavorComparison');container.replaceChildren();
  for(const p of flavorPrototypes)card(container,p,'flavor');
  const places=document.getElementById('smallPlacesComparison');places.replaceChildren();
  for(const p of passableSmallPlaces)card(places,p,'named-passable');
 }
 const page=Number(document.getElementById('flavorMapPage').value);
 if(changed('map',optionsKey+page+seaReviews)){
  const map=document.getElementById('flavorMap');
  const anchors=['B2','D3','B4'];
  // Deliberate, development-only examples. No random placement or generator change.
  const placements=freeMotifReviewPages[page].map((key,i)=>({id:'free-'+key,assetId:flavorPrototypes.find(p=>p.key===key).id,anchor:anchors[i]}));
  const errors=validatePlacements(placements,library,{grid:{columns:5,rows:5},blocked:[],places:{}},'sea-blue-01',{development:true});
  if(errors.length)throw Error(errors.join('; '));
  map.id='map';
  try{drawMap({state:{layer:options.marked?2:null,marks:options.marked?{'2:B2':'yes','2:D3':'maybe','2:B4':'no'}:{},hiddenHours:[],route:options.marked?['B2','C2','D3']:['A5'],showRouteNumbers:false},
   puzzle:{steps:6,start:'A5',places:{},overlays:[],assetPlacements:placements,assetLibrary:library},cells:HEXES,byId:Object.fromEntries(HEXES.map(h=>[h.id,h])),blocked:new Set(),pretty:id=>id,key:(h,id)=>h+':'+id,onActivate:()=>{},frameStyle:'final'});
  }finally{map.id='flavorMap';}
  for(const cell of map.querySelectorAll('.cell')){
   cell.removeAttribute('tabindex');cell.removeAttribute('role');cell.querySelector('polygon').setAttribute('visibility',options.hexes?'visible':'hidden');
  }
 }
 const p=flavorPrototypes.find(p=>p.key===document.getElementById('flavorAsset').value);
 if(changed('detail',optionsKey+p.id+seaReviews)){
  const svg=document.getElementById('flavorDetail');svg.dataset.flavor=p.key;
  svg.setAttribute('aria-label',p.name+' · vergrößert auf sea-blue-01 · '+compatibility(library,p.id,'sea-blue-01'));
  renderAssetPreview(svg,library,p.id,'flavor','',options);
 }
}
