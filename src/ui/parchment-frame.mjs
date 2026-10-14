// Presentation-only experiment. No puzzle, coordinate or input configuration.
export const FRAME_ASSET='assets/seekarte/pergament-rahmen-prototyp.webp';
export const SEA_ASSET='assets/seekarte/meer-ohne-objekte-prototyp.webp';
export const FRAME_BOUNDS=Object.freeze({x:-44,y:-44,width:563,height:473});
export function frameMode(search=''){
 const mode=new URLSearchParams(search).get('frame');
 return ['legacy','modular'].includes(mode)?mode:'raster';
}
// Eight slices, no opaque center. Native-image crops retain narrow borders.
// Corners retain their aspect ratio; only the long edge direction stretches.
export function frameTiles(){
 const sx=[0,110,1259,1369],sy=[0,110,1039,1149];
 const corner=110*563/1369;
 const tx=[-44,-44+corner,519-corner,519];
 const ty=[-44,-44+corner,429-corner,429];
 return Array.from({length:9},(_,i)=>{
  const c=i%3,r=Math.floor(i/3);
  return {x:tx[c],y:ty[r],width:tx[c+1]-tx[c],height:ty[r+1]-ty[r],
   viewBox:[sx[c],sy[r],sx[c+1]-sx[c],sy[r+1]-sy[r]].join(' ')};
 }).filter((_,i)=>i!==4);
}
export function drawSea(el){
 const sea=el('g',{'data-chart-layer':'sea','pointer-events':'none','aria-hidden':'true'});
 // Keep water beneath the opaque band, never outside its torn outer edge.
 const clip=el('clipPath',{id:'frame-sea-clip',clipPathUnits:'userSpaceOnUse'});
 clip.append(el('rect',{x:-26,y:-26,width:527,height:437}));
 sea.append(clip);
 sea.append(el('image',{href:SEA_ASSET,...FRAME_BOUNDS,preserveAspectRatio:'xMidYMid slice','clip-path':'url(#frame-sea-clip)'}));
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
 }else frame.append(el('image',{href:FRAME_ASSET,...FRAME_BOUNDS,preserveAspectRatio:'xMidYMid meet'}));
 return frame;
}
