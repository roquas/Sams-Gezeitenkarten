import {assetRectangle} from '../assets/geometry.mjs';

// Shared by the game and the development gallery. No per-instance transform,
// size, offset, clipping or aspect-ratio override can enter this renderer.
export function drawAssetPlacements(el,layer,placements,library,byId){
 // Source pixel squares have disjoint footprints. Responsive image filtering
 // may nevertheless sample two neighbours into one screen pixel. Add their
 // premultiplied coverage in an isolated group, then composite once over sea.
 // This reconstructs a mosaic without order-dependent source-over occlusion.
 const mosaic=el('g',{'data-asset-mosaic':'','style':'isolation:isolate'});
 for(const p of placements){
  const a=library.assets.find(a=>a.id===p.assetId);
  if(!a)throw Error('Unknown asset: '+p.assetId);
  const {cells,...rect}=assetRectangle(a,p.anchor,byId);
  const href=new URL('../../'+a.image.path,import.meta.url).href;
  mosaic.append(el('image',{href,...rect,preserveAspectRatio:'xMidYMid meet',style:'mix-blend-mode:plus-lighter',
   'data-asset-id':a.id,'data-placement-id':p.id,'data-art-cells':cells.join(' '),
   'pointer-events':'none','aria-hidden':'true'}));
 }
 layer.append(mosaic);
}
