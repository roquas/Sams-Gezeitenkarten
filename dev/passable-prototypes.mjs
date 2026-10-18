import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';
import {validatePlacements} from '../src/assets/library.mjs';

const prototypes=[
 {id:'navigation.lighthouse.h1.offcenter-beacon.v1',name:'Leuchtturm'},
 {id:'land-coast.atoll.h1.broken-passages.v1',name:'Aufgebrochenes Atoll'},
 {id:'navigation.wreck.h1.offcenter-sloop.v1',name:'Segelschiffswrack'}
];
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));

// Development fixture only: real gameplay UI without asset approval or edits
// to a published puzzle. All three use B3 and the same map scale.
export function renderPrototypeComparison(library){
 const container=document.getElementById('prototypeComparison');container.replaceChildren();
 const marked=document.getElementById('prototypeMarks').checked;
 const hexes=document.getElementById('hexes').checked;
 for(const prototype of prototypes){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  caption.textContent=prototype.name+' · B3 · befahrbar · pending';figure.append(caption);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id='map';svg.dataset.prototype=prototype.id;
  svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
  figure.append(svg);container.append(figure);
  const placements=[{id:'prototype',assetId:prototype.id,anchor:'B3',placeId:'review-place'}];
  const places={'review-place':{name:prototype.name,cells:['B3']}};
  const logic={grid:{columns:5,rows:5},blocked:[],places};
  const errors=validatePlacements(placements,library,logic,'sea-blue-01',{development:true});
  if(errors.length)throw Error(errors.join('; '));
  const marks=marked?Object.fromEntries(['yes','maybe','no','yes','maybe','no'].map((m,i)=>[(i+1)+':B3',m])):{};
  drawMap({state:{layer:marked?2:null,marks,hiddenHours:[],route:marked?['A3','B3','C3']:['A5'],showRouteNumbers:false},
   puzzle:{steps:6,start:'A5',places,overlays:[],assetPlacements:placements,assetLibrary:library},
   cells:HEXES,byId,blocked:new Set(),pretty:id=>id,key:(h,id)=>h+':'+id,onActivate:()=>{},frameStyle:'final'});
  svg.removeAttribute('id');
  // The view crops the complete map around B3 and neighbours; it preserves
  // the production 90×102 asset rectangle, alpha and gameplay layer order.
  svg.setAttribute('viewBox','42 107 200 170');
  for(const cell of svg.querySelectorAll('.cell')){
   cell.removeAttribute('tabindex');cell.removeAttribute('role');
   cell.querySelector('polygon').setAttribute('visibility',hexes?'visible':'hidden');
  }
  if(!marked)for(const node of svg.querySelectorAll('[data-place-ring]'))node.remove();
 }
}
