import {validateLibrary,validatePlacements,compatibility} from '../src/assets/library.mjs';
import {HEXES,CHART_BOUNDS} from '../src/ui/chart-geometry.mjs';
import {drawAssetPlacements} from '../src/ui/asset-layer.mjs';
import {placedCells,placementContract,assetRectangle} from '../src/assets/geometry.mjs';
import {renderAssetInventory} from './asset-inventory.mjs';
import {availability,catalogLabel} from './asset-curation.mjs';
import {reviewPositions} from './review-positions.mjs';
import {setupFlavorComparison,renderFlavorComparison} from './flavor-prototypes.mjs';
import {renderPrototypeComparison} from './passable-prototypes.mjs';
import {setupUsageComparison,renderUsageComparison,usageStates} from './asset-usage.mjs';

const el=(tag,attrs={},text)=>{
 const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [name,value] of Object.entries(attrs))node.setAttribute(name,value);
 if(text!==undefined)node.textContent=text;return node;
};
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const placements=[
 {id:'single',assetId:'technical.single.v1',anchor:'A1',objectId:'first-island'},
 {id:'double',assetId:'technical.double.v1',anchor:'B3',objectId:'long-island'},
 {id:'lighthouse',assetId:'technical.lighthouse.v1',anchor:'D2',objectId:'beacon'},
 {id:'decoration',assetId:'technical.decoration.v1',anchor:'C5'},
 {id:'separate',assetId:'technical.single.v1',anchor:'E5',objectId:'last-island'}
];
const map={geometry:'even-row-offset-pointy-v1',grid:{columns:5,rows:5},objects:[
 {id:'first-island',cells:['A1'],passable:false},{id:'last-island',cells:['E5'],passable:false},
 {id:'long-island',cells:['B3','C3'],passable:false},{id:'beacon',cells:['D2'],passable:true}
]};
try{
 const response=await fetch(new URL('../assets/catalog/library.json',import.meta.url));
 if(!response.ok)throw Error('Catalog HTTP '+response.status);
 const library=validateLibrary(await response.json());
 setupUsageComparison(library);
 setupFlavorComparison();
 const select=document.getElementById('background');
 for(const b of library.backgrounds){const o=document.createElement('option');o.value=b.id;o.textContent=b.id+' ('+b.family+')';select.append(o);}
 const reviewAsset=document.getElementById('reviewAsset');
 for(const a of library.assets){const o=document.createElement('option');o.value=a.id;o.textContent=catalogLabel(a)+' · '+availability(a);reviewAsset.append(o);}
 const requested=new URLSearchParams(location.search).get('asset');
 if(library.assets.some(a=>a.id===requested))reviewAsset.value=requested;
 function draw(svg,instances){
  svg.replaceChildren();
  const bg=library.backgrounds.find(b=>b.id===select.value);
  // The document base is the project root, also used by the real map renderer.
  svg.append(el('image',{href:bg.image,...CHART_BOUNDS,preserveAspectRatio:'xMidYMid meet','data-gallery-layer':'sea'}));
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
  const errors=validatePlacements(placements,library,map,select.value,{development:true});
  if(errors.length)throw Error(errors.join('; '));
  draw(document.getElementById('gallery'),placements);
  const inventory=document.getElementById('inventory');inventory.replaceChildren();
  const table=document.createElement('table');
  const headings=document.createElement('tr');
  for(const value of ['Asset-ID','Ort / Felder','Befahrbarkeit','Visuelle Freigabe']){const th=document.createElement('th');th.textContent=value;headings.append(th);}table.append(headings);
  for(const p of placements){
   const a=library.assets.find(a=>a.id===p.assetId),row=document.createElement('tr');
   for(const value of [a.id,(p.objectId??'Dekoration')+' / '+placedCells(a,p.anchor).join(', '),a.role==='decoration'?'ohne Regelbedeutung':a.passable?'befahrbar':'gesperrt',compatibility(library,a.id,select.value)]){const td=document.createElement('td');td.textContent=value;row.append(td);}table.append(row);
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
  renderAssetInventory(library,select.value);
  renderFlavorComparison(library);
  renderPrototypeComparison(library);
  renderUsageComparison(library);
 }
 for(const id of ['background','reviewAsset','flavorAsset','flavorMapPage','hexes','footprints','prototypeMarks',...usageStates.map(s=>'usageAsset-'+s.id)])document.getElementById(id).addEventListener('change',render);render();
}catch(error){document.getElementById('error').textContent=error.message;}
