import {assetRectangle} from '../assets/geometry.mjs';

// Shared by the game and the development gallery. No per-instance transform,
// size, offset, clipping or aspect-ratio override can enter this renderer.
export function drawAssetPlacements(el,layer,placements,library,byId){
 for(const p of placements){
  const a=library.assets.find(a=>a.id===p.assetId);
  if(!a)throw Error('Unknown asset: '+p.assetId);
  const {cells,...rect}=assetRectangle(a,p.anchor,byId);
  const href=new URL('../../'+a.image.path,import.meta.url).href;
  layer.append(el('image',{href,...rect,preserveAspectRatio:'xMidYMid meet',
   'data-asset-id':a.id,'data-placement-id':p.id,'data-art-cells':cells.join(' '),
   'pointer-events':'none','aria-hidden':'true'}));
 }
}
