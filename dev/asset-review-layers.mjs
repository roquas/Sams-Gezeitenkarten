import {HEXES} from '../src/ui/chart-geometry.mjs';
import {assetRectangle,placementContract} from '../src/assets/geometry.mjs';

const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));

// Shared by the interactive single-asset review and the offline catalog proof.
// Serialize original coordinates without rounding or edge-specific clipping.
export function drawAssetReviewLayers(el,svg,instances,library,{footprints=true,hexes=true}={}){
 const areas=el('g',{'data-gallery-layer':'footprints',visibility:footprints?'visible':'hidden','pointer-events':'none'});
 for(const p of instances){
  const asset=library.assets.find(a=>a.id===p.assetId),rect=assetRectangle(asset,p.anchor,byId);
  for(const polygon of placementContract(asset,p.anchor).polygons){
   areas.append(el('polygon',{points:polygon.map(([x,y])=>[x+rect.x+rect.width/2,y+rect.y+rect.height/2].join(',')).join(' '),fill:'#48ddb9','fill-opacity':.14,'data-footprint':p.id}));
  }
 }
 svg.append(areas);
 const grid=el('g',{'data-gallery-layer':'hexes',visibility:hexes?'visible':'hidden','pointer-events':'none'});
 for(const h of HEXES){
  grid.append(el('polygon',{'data-cell':h.id,points:h.polygon.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#fff4d5','stroke-width':1}));
  grid.append(el('text',{x:h.center[0],y:h.center[1]+30,'text-anchor':'middle','font-size':9,fill:'#272139'},h.id));
 }
 svg.append(grid);
}
