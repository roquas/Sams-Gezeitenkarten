import {CHART_VIEWBOX as VIEWBOX,headingBand} from './chart-geometry.mjs';
// Presentation references only; puzzle geometry and rules remain independent.
export const CHART_BACKGROUND='assets/seekarte/meer-pergament.webp';
import {legacyOverlay} from '../assets/legacy.mjs';
export function chartOverlays(overlays){
 // The crab accent shares its location's island illustration for now.
 return overlays.map(legacyOverlay).filter(Boolean);
}
const FRAME_X=[-44,36,439,519],FRAME_Y=[-44,30,355,429];
// Nine slices reuse the original watercolor border, widening only the parchment.
// All hex centers, polygons and pointer coordinates stay unchanged.
export function parchmentTiles(){
 const sourceX=[0,30,445,475],sourceY=[0,30,355,385];
 const targetX=FRAME_X,targetY=FRAME_Y;
 return Array.from({length:9},(_,i)=>{
  const q=i%3,r=Math.floor(i/3);
  return {x:targetX[q],y:targetY[r],width:targetX[q+1]-targetX[q],height:targetY[r+1]-targetY[r],
   viewBox:[sourceX[q],sourceY[r],sourceX[q+1]-sourceX[q],sourceY[r+1]-sourceY[r]].join(' ')};
 });
}

export const CHART_VIEWBOX=VIEWBOX;
// Visible parchment profiles sampled from the approved 858×789 watercolor.
// Each pair is the outer inked edge and the first water pixel at a guide axis.
export const PARCHMENT_PROFILES=Object.freeze({
 top:[[9,41],[12,45],[9,41],[10,47],[11,46]],
 bottom:[[5,40],[5,37],[3,49],[2,36],[5,39]],
 left:[[13,40],[13,52],[12,48],[12,44],[11,54]],
 right:[[3,39],[0,38],[0,43],[0,42],[0,45]]
});
function projectAxis(v,source,target){
 const i=v<source[1]?0:v>source[2]?2:1;
 return target[i]+(v-source[i])/(source[i+1]-source[i])*(target[i+1]-target[i]);
}
export function legacyParchmentHeading(side,index){
 const vertical=side==='top'||side==='bottom',reverse=side==='right'||side==='bottom';
 const extent=vertical?385:475,pixels=vertical?789:858;
 const convert=depth=>projectAxis((reverse?pixels-.5-depth:depth+.5)*extent/pixels,vertical?[0,30,355,385]:[0,30,445,475],vertical?FRAME_Y:FRAME_X);
 const [a,b]=PARCHMENT_PROFILES[side][index].map(convert);
 return {outer:a,inner:b,center:(a+b)/2};
}
export const parchmentHeading=headingBand;
const average=side=>PARCHMENT_PROFILES[side].reduce((n,_,i)=>n+parchmentHeading(side,i).center/5,0);
export const MARGIN_COLUMNS=[average('top'),average('bottom')];
export const MARGIN_ROWS=[average('left'),average('right')];
export {distancePhase as distanceState} from '../state/distance-overlay.mjs';
