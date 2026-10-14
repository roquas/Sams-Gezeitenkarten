// Phase 1 geometry contract; final raster assets are deliberately not activated.
import {CHART_BOUNDS,CHART_VIEWBOX,CHART_CENTER,HEX_BOUNDS,HEXES,ROW_ENVELOPE,offsetPolygon,pointInPolygon,rectPolygon,headingBand} from './chart-geometry.mjs';
import {chartOverlays} from './chart-art.mjs';
import {referencePuzzle} from '../../puzzles/reference-3.6.mjs';
export const CHART_ASSET_SPEC=Object.freeze({
 version:2,viewBox:CHART_VIEWBOX,...CHART_BOUNDS,
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
const objects=chartOverlays(referencePuzzle.overlays).map(o=>{
 const centers=o.cells.map(id=>HEXES.find(h=>h.id===id).center),x=centers.reduce((n,p)=>n+p[0],0)/centers.length+o.dx,y=centers.reduce((n,p)=>n+p[1],0)/centers.length+o.dy;
 return {asset:o.asset,cells:o.cells,bounds:[x-o.w/2,y-o.h/2,x+o.w/2,y+o.h/2]};
});
const expand=(r,d)=>[r[0]-d,r[1]-d,r[2]+d,r[3]+d];
// Region is a UNION of polygons. No even-odd holes at overlaps.
const region=(distance,objectMargin)=>[offsetPolygon(ROW_ENVELOPE,distance),...objects.map(o=>rectPolygon(expand(o.bounds,objectMargin)))];
export const PROTECTION=region(8,1);
export const TRANSPARENT=region(10,2);
export const EDGE_LIMIT=region(14,6);
export const inRegion=(point,polygons)=>polygons.some(p=>pointInPolygon(point,p));
export function isOpaquePaper(x,y){return pointInPolygon([x,y],rectPolygon(CHART_ASSET_SPEC.opaqueOuter))&&!inRegion([x,y],EDGE_LIMIT);}
export function toAssetPixel(x,y){return [(x-CHART_BOUNDS.x)*4,(y-CHART_BOUNDS.y)*4];}
export function chartContract(){
 return {...CHART_ASSET_SPEC,
  units:'SVG user units; rect=[left,top,right,bottom]; polygon=[[x,y],...], closed implicitly',
  svgToPixel:{scale:4,translate:[-CHART_BOUNDS.x*4,-CHART_BOUNDS.y*4],formula:'px=(x-viewBox.x)*4; py=(y-viewBox.y)*4; sample at pixel centers'},
  centering:{method:'axis-aligned bounding-box center of all 150 hex vertices',center:CHART_CENTER,hexBounds:HEX_BOUNDS,previousViewBoxCenter:[237.5,192.5],viewBoxShift:[7,-.5],hexTranslation:[0,0],equalAreaCentroid:[240.4,192]},
  hexes:HEXES,rowEnvelope:ROW_ENVELOPE,objects,
  protection:{operation:'union',polygons:PROTECTION,rowOffset:8,objectMargin:1,reason:'28-unit hour-marker offset + 9.2 radius + 0.75 stroke exceeds hex side by 6.774; 8 covers marks and hex strokes; CSS focus outlines render above frame without clipping'},
  transparent:{operation:'union',polygons:TRANSPARENT,alpha:0,rowOffset:10,objectMargin:2},
  innerEdgeCorridor:{operation:'difference',outerUnion:EDGE_LIMIT,subtractUnion:TRANSPARENT,alphaRange:[0,255],rule:'Inner paper edge may run anywhere in this corridor; never enter guaranteed transparent union'},
  opaque:{operation:'difference',outer:rectPolygon(CHART_ASSET_SPEC.opaqueOuter),subtractUnion:EDGE_LIMIT,alpha:255},
  outerEdgeCorridor:{outer:rectPolygon(CHART_ASSET_SPEC.outerEdge),inner:rectPolygon(CHART_ASSET_SPEC.opaqueOuter),rule:'Outside outer polygon alpha=0; inside inner polygon follow inner-edge contract'},
  headings:headingZones(),
  labelRules:{hard:'No illustration, tear or transparency; quiet high-contrast parchment under entire text envelope',soft:'Safe rectangle minus hard rectangle; decorative overlap allowed, text remains untouched',paper:'Whole plaque bounds must remain alpha=255; four-unit safety is soft, not an illustration ban'},
  illustrationZones:[
   {id:'NW',motif:'six-ray compass N NO SO S SW NW',candidate:rectPolygon([-27,-34.5,110,90])},
   {id:'NE',motif:'small islands and coast drawings',candidate:rectPolygon([365,-34.5,516,90])},
   {id:'SW',motif:'parrot at helm with sextant; protect face, body and sextant together',candidate:rectPolygon([-27,294,110,418.5])},
   {id:'SE',motif:'cropped wooden table, spilling leather coin purse, beer mug, plain worn wooden flute',candidate:rectPolygon([365,294,516,418.5])}
  ].map(z=>({...z,operation:'difference',subtractUnion:[...EDGE_LIMIT,...headingZones().map(h=>h.hardPolygon)],essentialParts:'Entire essential silhouette must fit resulting region. No automatic semantic cropping.'})),
  freeIllustration:{operation:'difference',outer:rectPolygon(CHART_ASSET_SPEC.opaqueOuter),subtractUnion:[...EDGE_LIMIT,...headingZones().map(h=>h.hardPolygon)]},
  compositing:'Sea, objects, frame, SVG guides/labels/interaction. Frame pointer-events none. All in same viewBox; no nonuniform image scaling.',
  alphaReference:'frame-mask.svg chooses transparency through the entire outerUnion of innerEdgeCorridor; metadata contains exact contract; no illustrated artwork',
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
