// Phase 1 contract only: not activated until the two delivered assets pass review.
import {parchmentHeading} from './chart-art.mjs';
export const CHART_ASSET_SPEC=Object.freeze({
 version:1,viewBox:'-44 -44 563 473',x:-44,y:-44,width:563,height:473,
 pixelWidth:2252,pixelHeight:1892,pixelsPerUnit:4,safety:4,
 sea:'assets/seekarte/sea-blue-01.webp',frame:'assets/seekarte/frame-parchment-01.webp',
 // All rectangles use x1,y1,x2,y2, in unchanged map coordinates.
 opaqueOuter:[-30,-32,512,425],opaqueOpening:[23,8,467,381],
 transparentOpening:[26,10,465,378],seaClip:[-30,-32,512,425],
 illustrationZones:[[-26,-28,36,1],[412,-28,508,1],[-26,387,36,421],[412,387,508,421]]
});
export function headingZones(){
 const out=[];
 for(const side of ['top','bottom','left','right'])for(let i=0;i<5;i++){
  const center=parchmentHeading(side,i).center;
  const column=side==='top'||side==='bottom';
  const x=column?60+i*82:center,y=column?center:56+i*68;
  // Conservative envelopes include ink, paths, circles, strokes and font reserve.
  const bounds=column?[x-14,y-12,x+14,y+13]:[x-14,y-14,x+14,y+14];
  const s=CHART_ASSET_SPEC.safety;
  out.push({side,index:i,x,y,bounds,safe:[bounds[0]-s,bounds[1]-s,bounds[2]+s,bounds[3]+s]});
 }
 return out;
}
export function isOpaquePaper(x,y){
 const [l,t,r,b]=CHART_ASSET_SPEC.opaqueOuter,[il,it,ir,ib]=CHART_ASSET_SPEC.opaqueOpening;
 return x>=l&&x<=r&&y>=t&&y<=b&&!(x>il&&x<ir&&y>it&&y<ib);
}
export function toAssetPixel(x,y){return [(x+44)*4,(y+44)*4];}
// Phase 2 renderer: one image per layer, same dimensions, uniform scaling only.
// Caller inserts frame before coordinates/labels and after decorative objects.
export function createChartBaseLayers(el,assets={sea:CHART_ASSET_SPEC.sea,frame:CHART_ASSET_SPEC.frame}){
 const {x,y,width,height}=CHART_ASSET_SPEC;
 const common={'pointer-events':'none','aria-hidden':'true'};
 const sea=el('g',{'data-chart-layer':'sea',...common});
 const frame=el('g',{'data-chart-layer':'frame',...common});
 const clip=el('clipPath',{id:'approved-sea-clip',clipPathUnits:'userSpaceOnUse'});
 const [l,t,r,b]=CHART_ASSET_SPEC.seaClip;
 clip.append(el('rect',{x:l,y:t,width:r-l,height:b-t}));sea.append(clip);
 sea.append(el('image',{href:assets.sea,x,y,width,height,preserveAspectRatio:'xMidYMid meet','clip-path':'url(#approved-sea-clip)'}));
 frame.append(el('image',{href:assets.frame,x,y,width,height,preserveAspectRatio:'xMidYMid meet'}));
 return {sea,frame};
}
