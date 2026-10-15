// Phase 1 geometry contract; final raster assets are deliberately not activated.
import {CHART_BOUNDS,CHART_VIEWBOX,CHART_CENTER,HEX_BOUNDS,HEXES,ROW_ENVELOPE,offsetPolygon,pointInPolygon,rectPolygon,headingBand} from './chart-geometry.mjs';
export const CHART_ASSET_SPEC=Object.freeze({
 version:3,viewBox:CHART_VIEWBOX,...CHART_BOUNDS,
 pixelWidth:2252,pixelHeight:1892,pixelsPerUnit:4,safety:4,
 sea:'assets/seekarte/sea-blue-01.webp',frame:'assets/seekarte/frame-parchment-01.webp',
 opaqueOuter:[-27,-34.5,516,418.5],seaClip:[-27,-34.5,516,418.5],
 outerEdge:[-32,-39.5,521,423.5],
});
export function headingZones(){
 const out=[];
 for(const side of ['top','bottom','left','right'])for(let i=0;i<5;i++){
  const center=headingBand(side,i).center,column=side==='top'||side==='bottom';
  const x=column?60+i*82:center,y=column?center:56+i*68;
  const bounds=column?[x-14,y-12,x+14,y+13]:[x-14,y-14,x+14,y+14];
  // Hard ink envelope includes reserve for Georgia/serif fallback metrics.
  const hard=column?[x-11,y-11,x+11,y+12]:[x-12,y-9,x+12,y+11];
  const safe=[bounds[0]-4,bounds[1]-4,bounds[2]+4,bounds[3]+4];
  out.push({side,index:i,x,y,bounds,hard,safe,hardPolygon:rectPolygon(hard),softPolygon:rectPolygon(safe),pixelSafe:[...toAssetPixel(...safe.slice(0,2)),...toAssetPixel(...safe.slice(2))]});
 }return out;
}
// Puzzle-specific art is intentionally NOT a part of the universal frame contract.
// Assets must fit inside their own declared hex footprint; see Issue #45.
// The 8 / 10 / 14 unit regions protect the game geometry only.
const region=(distance)=>[offsetPolygon(ROW_ENVELOPE,distance)];
export const PROTECTION=region(8);
export const TRANSPARENT=region(10);
export const EDGE_LIMIT=region(14);
export const inRegion=(point,polygons)=>polygons.some(p=>pointInPolygon(point,p));
export function isOpaquePaper(x,y){return pointInPolygon([x,y],rectPolygon(CHART_ASSET_SPEC.opaqueOuter))&&!inRegion([x,y],EDGE_LIMIT);}
export function toAssetPixel(x,y){return [(x-CHART_BOUNDS.x)*4,(y-CHART_BOUNDS.y)*4];}
export function chartContract(){
 const s=CHART_ASSET_SPEC;
 return {
  format:{version:s.version,type:'raster-assets',viewBox:s.viewBox,
   svgBounds:{x:s.x,y:s.y,width:s.width,height:s.height},
   pixels:{width:s.pixelWidth,height:s.pixelHeight,perSvgUnit:s.pixelsPerUnit},
   files:{sea:s.sea,frame:s.frame},
   units:'SVG coordinates; rectangle=[left, top, right, bottom]; polygon=[[x,y], ...]; polygon closes implicitly',
   svgToPixel:{type:'affine',scale:4,translate:[-CHART_BOUNDS.x*4,-CHART_BOUNDS.y*4],formula:'px=(x-viewBox.x)*4; py=(y-viewBox.y)*4; sample at pixel centers'}},
  geometry:{type:'fixed-hex-map',centering:{method:'bounding box center of all 150 hex vertices',center:CHART_CENTER,hexBounds:HEX_BOUNDS,previousViewBoxCenter:[237.5,192.5],viewBoxShift:[7,-.5],hexTranslation:[0,0],equalAreaCentroid:[240.4,192]},
   hexes:HEXES,rowEnvelope:ROW_ENVELOPE},
  zones:{
   gameplay:{type:'polygon-union',purpose:'Hexes and hour markers only; puzzle overlays excluded',polygons:PROTECTION,rowOffset:8,reason:'28-unit hour-marker offset + 9.2 radius + 0.75 stroke exceeds hex side by 6.774; 8 covers marks and hex strokes'},
   transparent:{type:'polygon-union',purpose:'Must have frame alpha=0; independent of individual puzzles',polygons:TRANSPARENT,alpha:0,rowOffset:10},
   innerEdge:{type:'polygon-difference',purpose:'Provisional inner shoreline alpha corridor; to be reconsidered with final art',outerUnion:EDGE_LIMIT,subtractUnion:TRANSPARENT,alphaRange:[0,255]},
   opaque:{type:'polygon-difference',purpose:'Provisional required opaque parchment; label zones remain mandatory',outer:rectPolygon(s.opaqueOuter),subtractUnion:EDGE_LIMIT,alpha:255},
   outerEdge:{type:'outer-transition',purpose:'PROVISIONAL: outer alpha and beige underlay will be finalized after Photoshop delivery',outer:rectPolygon(s.outerEdge),inner:rectPolygon(s.opaqueOuter)},
   headings:{type:'coordinate-label-zones',items:headingZones(),rules:{hard:'No illustration, tear or transparency; quiet high-contrast parchment under entire text envelope',soft:'Safe rectangle minus hard rectangle; decorative overlap allowed, text remains untouched',paper:'Whole plaque bounds must remain alpha=255; four-unit safety is soft, not an illustration ban'}}
  },
  rendering:{seaClip:s.seaClip,compositing:'Sea, puzzle objects, frame, SVG labels and interaction. Frame pointer-events none. Shared viewBox; no nonuniform image scaling.',alphaReference:'frame-mask.svg contains exactly this contract as metadata; technical guide only, not approved art'},
  assetPolicy:{type:'future-asset-library-rule',issue:45,rule:'Puzzle-specific artwork must fit its declared hex (or explicitly declared multi-hex footprint) on every row, including internally adjacent hexes; the frame does not define or repair individual asset bounds.'}
 };
}
export function createChartBaseLayers(el,assets={sea:CHART_ASSET_SPEC.sea,frame:CHART_ASSET_SPEC.frame}){
 const {x,y,width,height}=CHART_ASSET_SPEC,common={'pointer-events':'none','aria-hidden':'true'};
 const sea=el('g',{'data-chart-layer':'sea',...common}),frame=el('g',{'data-chart-layer':'frame',...common});
 const clip=el('clipPath',{id:'approved-sea-clip',clipPathUnits:'userSpaceOnUse'}),[l,t,r,b]=CHART_ASSET_SPEC.seaClip;
 clip.append(el('rect',{x:l,y:t,width:r-l,height:b-t}));sea.append(clip);
 sea.append(el('image',{href:assets.sea,x,y,width,height,preserveAspectRatio:'xMidYMid meet','clip-path':'url(#approved-sea-clip)'}));
 frame.append(el('image',{href:assets.frame,x,y,width,height,preserveAspectRatio:'xMidYMid meet'}));return {sea,frame};
}
