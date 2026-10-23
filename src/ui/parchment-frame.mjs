import {CHART_BOUNDS} from './chart-geometry.mjs';
import {CHART_ASSET_SPEC} from './chart-asset-contract.mjs';
export const FRAME_BOUNDS=Object.freeze(CHART_BOUNDS);
export function frameMode(search=''){
 return new URLSearchParams(search).get('frame')==='quiet'?'quiet':'final';
}
export function drawSea(el,mode='final',backgroundUrl){
 const sea=el('g',{'data-chart-layer':'sea','pointer-events':'none','aria-hidden':'true'});
 sea.append(el('image',{href:backgroundUrl??CHART_ASSET_SPEC.sea,...FRAME_BOUNDS,preserveAspectRatio:'xMidYMid meet'}));
 return sea;
}
export function drawFrame(el,mode='final'){
 const frame=el('g',{'data-chart-layer':'frame','data-frame-mode':mode,'pointer-events':'none','aria-hidden':'true'});
 // Both guaranteed variants stay decoded for fast frame selection in WebKit.
 for(const [variant,href] of [['final',CHART_ASSET_SPEC.frame],['quiet',CHART_ASSET_SPEC.quietFrame]]){
  frame.append(el('image',{href,...FRAME_BOUNDS,preserveAspectRatio:'xMidYMid meet','data-frame-variant':variant,visibility:mode===variant?'visible':'hidden'}));
 }
 return frame;
}
