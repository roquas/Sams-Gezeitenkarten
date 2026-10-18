import {validateLibrary,validatePlacements,compatibility} from '../src/assets/library.mjs';
import {HEXES,CHART_BOUNDS} from '../src/ui/chart-geometry.mjs';
import {drawAssetPlacements} from '../src/ui/asset-layer.mjs';
import {placedCells,placementContract,assetRectangle} from '../src/assets/geometry.mjs';
import {reviewPositions} from './review-positions.mjs';

const el=(tag,attrs={},text)=>{
 const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [name,value] of Object.entries(attrs))node.setAttribute(name,value);
 if(text!==undefined)node.textContent=text;return node;
};
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const placements=[
 {id:'single',assetId:'technical.single.v1',anchor:'A1',placeId:'twin-islands'},
 {id:'double',assetId:'technical.double.v1',anchor:'B3',placeId:'long-island'},
 {id:'lighthouse',assetId:'technical.lighthouse.v1',anchor:'D2',placeId:'beacon'},
 {id:'decoration',assetId:'technical.decoration.v1',anchor:'C5'},
 {id:'separate',assetId:'technical.single.v1',anchor:'E5',placeId:'twin-islands'}
];
const logic={grid:{columns:5,rows:5},blocked:['A1','B3','C3','E5'],places:{
 'twin-islands':{cells:['A1','E5']},'long-island':{cells:['B3','C3']},beacon:{cells:['D2']}
}};
try{
 const response=await fetch('../assets/catalog/library.json');
 if(!response.ok)throw Error('Catalog HTTP '+response.status);
 const library=validateLibrary(await response.json());
 const select=document.getElementById('background');
 for(const b of library.backgrounds){const o=document.createElement('option');o.value=b.id;o.textContent=b.id+' ('+b.family+')';select.append(o);}
 const reviewAsset=document.getElementById('reviewAsset');
 for(const a of library.assets){const o=document.createElement('option');o.value=a.id;o.textContent=a.id;reviewAsset.append(o);}
 function draw(svg,instances){
  svg.replaceChildren();
  const bg=library.backgrounds.find(b=>b.id===select.value);
  // Asset paths are relative to the deployment root; this page lives in dev/.
  svg.append(el('image',{href:'../'+bg.image,...CHART_BOUNDS,preserveAspectRatio:'xMidYMid meet','data-gallery-layer':'sea'}));
  const objects=el('g',{'data-gallery-layer':'objects','pointer-events':'none'});
  drawAssetPlacements(el,objects,instances,library,byId);
  svg.append(objects);
  const footprints=el('g',{'data-gallery-layer':'footprints',visibility:document.getElementById('footprints').checked?'visible':'hidden','pointer-events':'none'});
  for(const p of instances){
   const a=library.assets.find(a=>a.id===p.assetId),rect=assetRectangle(a,p.anchor,byId);
   for(const polygon of placementContract(a,p.anchor).polygons){
    footprints.append(el('polygon',{points:polygon.map(([x,y])=>[x+rect.x+rect.width/2,y+rect.y+rect.height/2].join(',')).join(' '),fill:'#48ddb9','fill-opacity':.14,'data-footprint':p.id}));
   }
  }
  svg.append(footprints);
  const hexes=el('g',{'data-gallery-layer':'hexes',visibility:document.getElementById('hexes').checked?'visible':'hidden','pointer-events':'none'});
  for(const h of HEXES){
   hexes.append(el('polygon',{points:h.polygon.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#fff4d5','stroke-width':1}));
   hexes.append(el('text',{x:h.center[0],y:h.center[1]+30,'text-anchor':'middle','font-size':9,fill:'#272139'},h.id));
  }
  svg.append(hexes);
 }
 function render(){
  const errors=validatePlacements(placements,library,logic,select.value,{development:true});
  if(errors.length)throw Error(errors.join('; '));
  draw(document.getElementById('gallery'),placements);
  const inventory=document.getElementById('inventory');inventory.replaceChildren();
  const table=document.createElement('table');
  const headings=document.createElement('tr');
  for(const value of ['Asset-ID','Ort / Felder','Befahrbarkeit','Visuelle Freigabe']){const th=document.createElement('th');th.textContent=value;headings.append(th);}table.append(headings);
  for(const p of placements){
   const a=library.assets.find(a=>a.id===p.assetId),row=document.createElement('tr');
   for(const value of [a.id,(p.placeId??'Dekoration')+' / '+placedCells(a,p.anchor).join(', '),a.role==='decoration'?'ohne Regelbedeutung':a.passable?'befahrbar':'gesperrt',compatibility(library,a.id,select.value)]){const td=document.createElement('td');td.textContent=value;row.append(td);}table.append(row);
  }
  inventory.append(table);
  const positions=document.getElementById('positions');positions.replaceChildren();
  const selected=library.assets.find(a=>a.id===reviewAsset.value);
  for(const {anchor,parity,location} of reviewPositions(selected)){
   const figure=document.createElement('figure'),caption=document.createElement('figcaption');
   caption.textContent=anchor+' · '+parity+' Zeile · '+location;figure.append(caption);
   const svg=el('svg',{viewBox:'-37 -44.5 563 473',role:'img','aria-label':caption.textContent,'data-anchor':anchor,'data-row-parity':parity,'data-position':location});
   draw(svg,[{id:'review',assetId:selected.id,anchor}]);figure.append(svg);positions.append(figure);
  }
  document.getElementById('status').textContent='Technische Testansicht · '+select.value+' · Einzelprüfung: '+selected.id+' / '+compatibility(library,selected.id,select.value);
 }
 for(const id of ['background','reviewAsset','hexes','footprints'])document.getElementById(id).addEventListener('change',render);render();
}catch(error){document.getElementById('error').textContent=error.message;}
