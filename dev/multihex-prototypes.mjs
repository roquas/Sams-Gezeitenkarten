import {drawMap} from '../src/ui/map.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';
import {assetRectangle,placedCells,imageContract} from '../src/assets/geometry.mjs';
import {validatePlacements,compatibility} from '../src/assets/library.mjs';
import {adjacent,distance} from '../src/engine/hex.mjs';

export const multihexPrototypes=[
 {
  "key": "tropical",
  "id": "land-coast.island.h2.tropical-bays.v1",
  "name": "Palmenbuchten",
  "approved": true,
  "round": 1
 },
 {
  "key": "volcano",
  "id": "land-coast.island.h3.massive-volcano.v1",
  "name": "Glutberg",
  "approved": true,
  "round": 1
 },
 {
  "key": "archipelago",
  "id": "land-coast.archipelago.h3.sand-reefs.v2",
  "name": "Sandriffbogen",
  "round": 2,
  "approved": true
 },
 {
  "key": "harbor",
  "id": "land-coast.island.h3.south-harbor.v1",
  "name": "Südhafen",
  "round": 2,
  "approved": true
 },
 {
  "key": "smuggler",
  "id": "land-coast.island.h3.smuggler-cove.v1",
  "name": "Schmugglerbucht",
  "round": 2,
  "approved": true
 },
 {
  "key": "sand",
  "id": "land-coast.island.h4.long-sand.v1",
  "name": "Langer Strand",
  "round": 2,
  "approved": true
 },
 {
  "key": "claw",
  "id": "land-coast.island.h4.crab-claw.v2",
  "name": "Krabbenzange",
  "round": 2,
  "historical": true
 },
 {
  "key": "tesoro-v1",
  "id": "land-coast.settlement.h4.tesoro.v1",
  "name": "Tesoro",
  "round": 3,
  "historical": true
 },
 {
  "key": "tesoro",
  "id": "land-coast.settlement.h4.tesoro.v2",
  "name": "Tesoro",
  "round": 3
 },
 {
  "key": "temple",
  "id": "land-coast.island.h4.jungle-temple.v1",
  "name": "Tempel der Gezeiten",
  "round": 2,
  "approved": true
 }
];
export const multihexCandidates=multihexPrototypes.filter(p=>p.round>=2&&!p.historical);
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
  svg.setAttribute('viewBox',[r.x+r.width/2-190,r.y+r.height/2-150,380,300].join(' '));
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

// Development-only diagnostic: actual uncut Voronoi graphic cells, not a mask.
export function drawGraphicFootprint(svg,asset,anchor,visible=true){
 const rect=assetRectangle(asset,anchor,byId),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 const group=document.createElementNS('http://www.w3.org/2000/svg','g');
 group.dataset.graphicFootprint=asset.id;group.setAttribute('pointer-events','none');
 group.setAttribute('visibility',visible?'visible':'hidden');
 for(const polygon of imageContract(asset.geometry.cells).polygons){
  const node=document.createElementNS(group.namespaceURI,'polygon');
  node.setAttribute('points',polygon.map(([x,y])=>[x+cx,y+cy].join(',')).join(' '));
  node.setAttribute('fill','#e5dcff');node.setAttribute('fill-opacity','.13');
  node.setAttribute('stroke','#eee4ff');node.setAttribute('stroke-width','1');
  node.setAttribute('stroke-dasharray','3 2');group.append(node);
 }
 svg.append(group);
}
