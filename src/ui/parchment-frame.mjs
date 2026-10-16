import {CHART_BOUNDS} from './chart-geometry.mjs';
import {CHART_ASSET_SPEC} from './chart-asset-contract.mjs';
// Presentation-only experiment. No puzzle, coordinate or input configuration.
export const FRAME_ASSET='assets/seekarte/pergament-rahmen-prototyp.webp';
export const SEA_ASSET='assets/seekarte/meer-ohne-objekte-prototyp.webp';
export const FRAME_BOUNDS=Object.freeze(CHART_BOUNDS);
export function frameMode(search=''){
 const mode=new URLSearchParams(search).get('frame');
 return ['legacy','modular','final','quiet'].includes(mode)?mode:'raster';
}
// Eight slices, no opaque center. Native-image crops retain narrow borders.
// Corners retain their aspect ratio; only the long edge direction stretches.
export function frameTiles(){
 const sx=[0,110,1259,1369],sy=[0,110,1039,1149];
 const corner=110*563/1369;
 const {x,y,width,height}=FRAME_BOUNDS;
 const tx=[x,x+corner,x+width-corner,x+width];
 const ty=[y,y+corner,y+height-corner,y+height];
 return Array.from({length:9},(_,i)=>{
  const c=i%3,r=Math.floor(i/3);
  return {x:tx[c],y:ty[r],width:tx[c+1]-tx[c],height:ty[r+1]-ty[r],
   viewBox:[sx[c],sy[r],sx[c+1]-sx[c],sy[r+1]-sy[r]].join(' ')};
 }).filter((_,i)=>i!==4);
}
export function drawSea(el,mode='raster'){
 const sea=el('g',{'data-chart-layer':'sea','pointer-events':'none','aria-hidden':'true'});
 // Keep water beneath the opaque band, never outside its torn outer edge.
 const clip=el('clipPath',{id:'frame-sea-clip',clipPathUnits:'userSpaceOnUse'});
 const finalAsset=mode==='final'||mode==='quiet';
 const [l,t,r,b]=finalAsset?CHART_ASSET_SPEC.seaClip:[FRAME_BOUNDS.x+18,FRAME_BOUNDS.y+18,FRAME_BOUNDS.x+545,FRAME_BOUNDS.y+455];
 clip.append(el('rect',{x:l,y:t,width:r-l,height:b-t}));
 sea.append(clip);
 sea.append(el('image',{href:finalAsset?CHART_ASSET_SPEC.sea:SEA_ASSET,...FRAME_BOUNDS,preserveAspectRatio:finalAsset?'xMidYMid meet':'xMidYMid slice','clip-path':'url(#frame-sea-clip)'}));
 return sea;
}
export function drawFrame(el,mode){
 const frame=el('g',{'data-chart-layer':'frame','data-frame-mode':mode,'pointer-events':'none','aria-hidden':'true'});
 if(mode==='modular'){
  for(const tile of frameTiles()){
   const slice=el('svg',{...tile,preserveAspectRatio:'none',overflow:'hidden'});
   slice.append(el('image',{href:FRAME_ASSET,width:1369,height:1149}));
   frame.append(slice);
  }
 }else {
  const href=mode==='final'?CHART_ASSET_SPEC.frame:mode==='quiet'?CHART_ASSET_SPEC.quietFrame:FRAME_ASSET;
  frame.append(el('image',{href,...FRAME_BOUNDS,preserveAspectRatio:'xMidYMid meet'}));
 }
 return frame;
}
