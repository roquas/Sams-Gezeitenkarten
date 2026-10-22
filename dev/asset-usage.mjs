import {flavorPrototypes} from './asset-curation.mjs';
import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';
import {validatePlacements,compatibility} from '../src/assets/library.mjs';
import {placedCells,assetRectangle} from '../src/assets/geometry.mjs';

const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
export const usageStates=[
 {id:'named-blocked',label:'Benannter unbefahrbarer Ort',asset:'land-coast.island.h1.basalt-spire-water.v1'},
 {id:'named-passable',label:'Benannter befahrbarer Ort',asset:'navigation.lighthouse.h1.offcenter-beacon.v1'},
 {id:'flavor',label:'Freies Kartenmotiv – keine Hinweisreferenz',asset:'sea-life.accent.h1.foam.v1'}
];

// Naming belongs to the puzzle placement. Never change an asset's role or
// passability to demonstrate a usage; Flavor simply has no logical place.
export function previewFixture(library,assetId,usage,name){
 const asset=library.assets.find(a=>a.id===assetId);
 if(!asset||!usageStates.some(s=>s.id===usage))throw Error('Unknown asset preview');
 if(usage!=='flavor'&&(asset.role!=='geographic'||asset.passable!==(usage==='named-passable')))throw Error('Usage conflicts with asset passability');
 const cells=placedCells(asset,'B3');
 const isGeo=asset.role==='geographic';
 const placements=[{id:'prototype',assetId,anchor:'B3',...(isGeo?{objectId:'review-place'}:{})}];
 const map={geometry:'even-row-offset-pointy-v1',grid:{columns:5,rows:5},objects:isGeo?[{id:'review-place',cells,passable:asset.passable}]:[]};
 const blocked=isGeo&&!asset.passable?cells:[];
 const errors=validatePlacements(placements,library,map,'sea-blue-01',{development:true});
 if(errors.length)throw Error(errors.join('; '));
 return {blocked:new Set(blocked),puzzle:{steps:6,start:'A5',map,objectNames:usage==='flavor'?{}:{'review-place':name},assetPlacements:placements,assetLibrary:library}};

}

export function renderAssetPreview(svg,library,assetId,usage,name,{marked=false,hexes=true}={}){
 const {puzzle,blocked}=previewFixture(library,assetId,usage,name);
 const sailing=marked&&!blocked.has('B3');
 const marks=sailing?Object.fromEntries(['yes','maybe','no','yes','maybe','no'].map((m,i)=>[(i+1)+':B3',m])):{};
 // drawMap targets #map. Mount each development SVG synchronously, then
 // restore its ID; production renderer and its layer order stay unchanged.
 const originalId=svg.id;svg.id='map';
 try{
  drawMap({state:{layer:sailing?2:null,marks,hiddenHours:[],route:sailing?['A3','B3','C3']:['A5'],showRouteNumbers:false},
   puzzle,cells:HEXES,byId,blocked,pretty:id=>id,key:(h,id)=>h+':'+id,onActivate:()=>{},frameStyle:'final'});
 }finally{if(originalId)svg.id=originalId;else svg.removeAttribute('id');}
 const rect=assetRectangle(library.assets.find(a=>a.id===assetId),'B3',byId);
 svg.setAttribute('viewBox',[rect.x-55,rect.y-34,rect.width+110,rect.height+68].join(' '));
 for(const cell of svg.querySelectorAll('.cell')){
  cell.removeAttribute('tabindex');cell.removeAttribute('role');
  cell.querySelector('polygon').setAttribute('visibility',hexes?'visible':'hidden');
 }
}

export function setupUsageComparison(library){
 for(const state of usageStates){
  const select=document.getElementById('usageAsset-'+state.id);
  for(const asset of library.assets.filter(a=>(state.id==='flavor'?flavorPrototypes.some(p=>p.id===a.id):a.role==='geographic'&&a.passable===(state.id==='named-passable')))){
   const option=document.createElement('option');option.value=asset.id;option.textContent=asset.id;select.append(option);
  }
  select.value=state.asset;
 }
}

export function renderUsageComparison(library){
 for(const state of usageStates){
  const id=document.getElementById('usageAsset-'+state.id).value;
  const svg=document.querySelector('#usageComparison [data-usage="'+state.id+'"]');
  svg.dataset.previewAsset=id;
  document.getElementById('usageStatus-'+state.id).textContent='B3 · sea-blue-01 · '+compatibility(library,id,'sea-blue-01');
  renderAssetPreview(svg,library,id,state.id,'Prüfort',{marked:document.getElementById('prototypeMarks').checked,hexes:document.getElementById('hexes').checked});
 }
}
