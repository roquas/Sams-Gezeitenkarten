import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';
import {assetRectangle,placedCells} from '../src/assets/geometry.mjs';
import {validatePlacements,compatibility} from '../src/assets/library.mjs';
import {adjacent,distance} from '../src/engine/hex.mjs';

export const multihexPrototypes=[
 {key:'tropical',id:'land-coast.island.h2.tropical-bays.v1',name:'Palmenbuchten'},
 {key:'volcano',id:'land-coast.island.h3.massive-volcano.v1',name:'Glutberg'},
 {key:'archipelago',id:'land-coast.archipelago.h3.bent-reefs.v1',name:'Splitterriffe'}
];
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
export function multihexFixture(library,prototype,anchor){
 const asset=library.assets.find(a=>a.id===prototype.id);
 const cells=placedCells(asset,anchor),blocked=new Set(cells);
 const free=HEXES.filter(h=>!blocked.has(h.id)).map(h=>h.id);
 const near=id=>Math.min(...cells.map(c=>distance(id,c)));
 const route=free.flatMap((a,i)=>free.slice(i+1).filter(b=>adjacent(a,b)).map(b=>[a,b])).sort((a,b)=>a.reduce((s,id)=>s+near(id),0)-b.reduce((s,id)=>s+near(id),0))[0];
 const places={'review-island':{name:prototype.name,cells}};
 const assetPlacements=[{id:'multihex',assetId:asset.id,anchor,placeId:'review-island'}];
 const errors=validatePlacements(assetPlacements,library,{grid:{columns:5,rows:5},blocked:cells,places},'sea-blue-01',{development:true});
 if(errors.length)throw Error(errors.join('; '));
 return {blocked,route,puzzle:{steps:6,start:free.includes('A5')?'A5':free[0],places,overlays:[],assetPlacements,assetLibrary:library}};
}
export function renderMultihex(svg,library,prototype,anchor,{marked=false,hexes=true,detail=false}={}){
 const {puzzle,blocked,route}=multihexFixture(library,prototype,anchor);
 // Deliberately include attempted notes on land: production must suppress them.
 const marks=marked?Object.fromEntries(HEXES.flatMap(c=>['yes','maybe','no','yes','maybe','no'].map((m,i)=>[(i+1)+':'+c.id,m]))):{};
 svg.id='map';
 try{drawMap({state:{layer:marked?2:null,marks,hiddenHours:[],route:marked?route:[puzzle.start],showRouteNumbers:false},
  puzzle,cells:HEXES,byId,blocked,pretty:id=>id,key:(h,id)=>h+':'+id,onActivate:()=>{},frameStyle:'final'});
 }finally{svg.removeAttribute('id');}
 if(detail){
  const r=assetRectangle(library.assets.find(a=>a.id===prototype.id),anchor,byId);
  svg.setAttribute('viewBox',[r.x+r.width/2-150,r.y+r.height/2-125,300,250].join(' '));
 }
 svg.dataset.asset=prototype.id;svg.dataset.anchor=anchor;
 for(const cell of svg.querySelectorAll('.cell')){
  cell.removeAttribute('tabindex');cell.removeAttribute('role');
  cell.querySelector('polygon').setAttribute('visibility',hexes?'visible':'hidden');
 }
}
export function multihexCaption(library,prototype,anchor){
 const {blocked}=multihexFixture(library,prototype,anchor);
 return prototype.name+' · '+[...blocked].join(' / ')+' · vollständig unbefahrbar · '+compatibility(library,prototype.id,'sea-blue-01');
}
