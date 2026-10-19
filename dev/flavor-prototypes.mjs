import {renderAssetPreview} from './asset-usage.mjs';
import {compatibility,validatePlacements} from '../src/assets/library.mjs';
import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';

// Review captions only: these names never become puzzle places or map labels.
export const flavorPrototypes=[
 ['barrels','Treibende Fässer'],['buoy','Einzelne Boje'],['gulls','Seevögel'],
 ['dolphins','Delphine'],['rowboat','Ruderboot'],['crate','Treibende Kiste'],
 ['foam','Sanfte Schaumströmung'],['bottle','Flaschenpost'],
 ['driftwood','Treibholz und Seetang'],['turtle','Meeresschildkröte']
].map(([key,name])=>({key,name,id:'sea-life.accent.h1.'+key+'.v1'}));

export function setupFlavorComparison(){
 const select=document.getElementById('flavorAsset');
 for(const p of flavorPrototypes){
  const option=document.createElement('option');option.value=p.key;option.textContent=p.name;select.append(option);
 }
}

let lastLibrary,lastOptions,lastDetail;
export function renderFlavorComparison(library){
 const options={marked:document.getElementById('prototypeMarks').checked,hexes:document.getElementById('hexes').checked};
 const optionsKey=JSON.stringify(options);
 // Other gallery selectors need not rebuild eleven unchanged production maps.
 if(lastLibrary!==library||lastOptions!==optionsKey){
  const map=document.getElementById('flavorMap');
  const anchors=['A1','C1','E1','B2','D2','A3','C3','E3','B4','D4'];
  const placements=flavorPrototypes.map((p,i)=>({id:'flavor-'+p.key,assetId:p.id,anchor:anchors[i]}));
  const errors=validatePlacements(placements,library,{grid:{columns:5,rows:5},blocked:[],places:{}},'sea-blue-01',{development:true});
  if(errors.length)throw Error(errors.join('; '));
  map.id='map';
  try{drawMap({state:{layer:options.marked?2:null,marks:options.marked?{'2:A3':'yes','2:B3':'maybe','2:C3':'no'}:{},hiddenHours:[],route:options.marked?['A3','B3','C3']:['A5'],showRouteNumbers:false},
   puzzle:{steps:6,start:'A5',places:{},overlays:[],assetPlacements:placements,assetLibrary:library},cells:HEXES,byId:Object.fromEntries(HEXES.map(h=>[h.id,h])),blocked:new Set(),pretty:id=>id,key:(h,id)=>h+':'+id,onActivate:()=>{},frameStyle:'final'});
  }finally{map.id='flavorMap';}
  for(const cell of map.querySelectorAll('.cell')){
   cell.removeAttribute('tabindex');cell.removeAttribute('role');
   cell.querySelector('polygon').setAttribute('visibility',options.hexes?'visible':'hidden');
  }
  const container=document.getElementById('flavorComparison');container.replaceChildren();
  for(const p of flavorPrototypes){
   const figure=document.createElement('figure'),caption=document.createElement('figcaption');
   caption.textContent=p.name+' · '+compatibility(library,p.id,'sea-blue-01');
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.dataset.flavor=p.key;svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
   figure.append(caption,svg);container.append(figure);
   renderAssetPreview(svg,library,p.id,'flavor','',options);
  }
 }
 const p=flavorPrototypes.find(p=>p.key===document.getElementById('flavorAsset').value);
 const detailKey=optionsKey+p.id;
 if(lastLibrary!==library||lastDetail!==detailKey){
  const svg=document.getElementById('flavorDetail');
  svg.dataset.flavor=p.key;svg.setAttribute('aria-label',p.name+' · vergrößert auf sea-blue-01 · pending');
  renderAssetPreview(svg,library,p.id,'flavor','',options);
 }
 lastLibrary=library;lastOptions=optionsKey;lastDetail=detailKey;
}
