import {placeReferencesFor} from './place-references.mjs';
import {CHART_BOUNDS} from './chart-geometry.mjs';
import {drawAssetPlacements} from './asset-layer.mjs';
import {frameMode,drawSea,drawFrame} from './parchment-frame.mjs';
import {hexCenter,hexVertices,drawParchmentLabel,startLabelLayout} from './place-labels.mjs';
import {CHART_VIEWBOX, parchmentHeading} from './chart-art.mjs';
import {distance as dist} from '../engine/hex.mjs';
import {distancePhase} from '../state/distance-overlay.mjs';
import {GREEK_SYMBOLS, ROWCOLORS} from './coordinates.mjs';
import {routeSegments,drawRouteInk,drawRouteNumbers} from './route-ink.mjs';
function poly(x,y){return hexVertices(x,y).map(([x,y])=>`${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
const coords=hexCenter;
const staticCharts=new WeakMap();
const observedCharts=new WeakSet();
function fitLabels(svg){
 if(!svg.getBoundingClientRect().width)return;
 for(const label of svg.querySelectorAll('.place-label')){
  const text=label.querySelector('text'),available=Number(label.querySelector('rect').getAttribute('width'))-6;
  const measured=text.getComputedTextLength();
  if(measured>available)text.setAttribute('font-size',Number(text.getAttribute('font-size'))*available/measured);
 }
}
export function drawMap({state,puzzle,rules,cells,byId,blocked,pretty,key,onActivate,frameStyle}){
 const $=id=>document.getElementById(id);
 const svg=$("map");const focusedId=svg.contains(document.activeElement)?document.activeElement?.dataset.id:null;
 // Avoid repeated viewBox writes that can invalidate WebKit SVG layout,
 // including the large cached raster layers. Geometry is immutable here.
 if(svg.getAttribute('viewBox')!==CHART_VIEWBOX)svg.setAttribute('viewBox',CHART_VIEWBOX);
 if(!observedCharts.has(svg)){
  new ResizeObserver(()=>fitLabels(svg)).observe(svg);observedCharts.add(svg);
 }
 const NS="http://www.w3.org/2000/svg";
 const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n};
 // Modulare Seekarten-Grafik: 1a Wasser, 1b transparente Motive, 1c mehrfeldrige Inseln.
 // Alle Motive sind rein dekorativ und niemals interaktive Trefferflächen.
 const requestedMode=frameStyle||frameMode(window.location.search);
 const mode=requestedMode==='quiet'?'quiet':'final';
 if(svg.dataset.frameMode!==mode)svg.dataset.frameMode=mode;
 const showArt=document.getElementById("showChart").checked;
 const cached=staticCharts.get(svg);
 if(cached?.puzzle===puzzle&&cached.mode===mode){
  for(const node of [...svg.children])if(!node.hasAttribute('data-static-chart')&&!node.classList.contains('place-references'))node.remove();
  const visibility=showArt?'visible':'hidden';
  if(cached.art.getAttribute('visibility')!==visibility)cached.art.setAttribute('visibility',visibility);
 }else{
 svg.replaceChildren();
 const art=el("g",{"pointer-events":"none","aria-hidden":"true",visibility:showArt?"visible":"hidden"});
 svg.append(el("rect",{...CHART_BOUNDS,fill:"#e9d5b0","pointer-events":"none","aria-hidden":"true"}));
 art.append(drawSea(el,mode,puzzle.background?.asset&&new URL(puzzle.background.asset,puzzle.resourceBaseUrl??document.baseURI).href));
 const objects=el('g',{'data-chart-layer':'objects','pointer-events':'none','aria-hidden':'true'});art.append(objects);
 if(puzzle.assetPlacements?.length)drawAssetPlacements(el,objects,puzzle.assetPlacements,puzzle.assetLibrary,byId,puzzle.resourceBaseUrl);
 art.append(drawFrame(el,mode));
 // The departure plaque is a game marker, independent of temporary place names.
 art.append(drawParchmentLabel(el,startLabelLayout(byId[puzzle.start]),'Start',{start:true}));
 svg.append(art);
 // Fit actual browser font metrics without expanding the safe land footprint.
 fitLabels(svg);
 // Geographic coordinate guides and margin headings remain visible even when
 // the decorative chart is disabled. The staggered rows bend column guides.
 const graticule=el("g",{class:"coordinate-guides","pointer-events":"none","aria-hidden":"true"});
 // Every guide passes through the actual centers of its five column hexes.
 // The alternating 41-unit row offset is intentional and shared with coords().
 for(let q=0;q<5;q++){
   const centers=Array.from({length:5},(_,r)=>coords({q,r}));
   let path=`M ${centers[0][0]} 29 L ${centers[0][0]} ${centers[0][1]}`;
   for(let r=1;r<centers.length;r++){
     const [px,py]=centers[r-1], [x,y]=centers[r];
     path+=` C ${px} ${py+24}, ${x} ${y-24}, ${x} ${y}`;
   }
   const [bottomX,bottomY]=centers[4];
   path+=` L ${bottomX} 362`;
   graticule.append(el("path",{d:path,fill:"none",stroke:"#f5edce","stroke-width":"9",opacity:".19","stroke-linecap":"round"}));
   graticule.append(el("path",{d:path,fill:"none",stroke:"#446d70","stroke-width":"1.7",opacity:".34","stroke-linecap":"round"}));
   // Pergamentplättchen mit unregelmäßigen Kanten, gedämpfter Tinte.
   for(const [side,x] of [['top',centers[0][0]],['bottom',bottomX]]){
     const band=parchmentHeading(side,q),y=band.center;
     const heading=el('g',{'data-margin-side':side,'data-margin-index':q,'data-margin-center':y,'data-margin-outer':band.outer,'data-margin-inner':band.inner});
     const d=`M ${x-13} ${y-10} Q ${x-4} ${y-12} ${x+12} ${y-10} L ${x+13} ${y+8} Q ${x+3} ${y+11} ${x-12} ${y+9} Z`;
     heading.append(el("path",{d,fill:"#e9d7aa",stroke:"#b39b71","stroke-width":".7",opacity:".77"}));
     heading.append(el("text",{x,y:y+5,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"17","font-style":"italic",fill:"#695037",opacity:".88"},GREEK_SYMBOLS[q]));graticule.append(heading);
   }
 }
 for(let r=0;r<5;r++){
   const y=56+r*68;
   graticule.append(el("path",{d:`M 26 ${y} C 145 ${y-9}, 295 ${y+9}, 462 ${y}`,fill:"none",stroke:"#567e78","stroke-width":"1.1",opacity:".19","stroke-dasharray":"3 7"}));
   const rc=ROWCOLORS[r];
   for(const side of ['left','right']){
     const band=parchmentHeading(side,r),x=band.center;
     const heading=el('g',{'data-margin-side':side,'data-margin-index':r,'data-margin-center':x,'data-margin-outer':band.outer,'data-margin-inner':band.inner});
     // The transparent inkblot now shows the underlying art/sea directly:
     // no beige SVG backing in the two approved parchment frames.
     // Kein UI-Kreis: asymmetrischer, leicht durchscheinender Tintenklecks.
     const d=`M ${x-8} ${y-4} Q ${x-12} ${y-11} ${x-3} ${y-10} Q ${x+5} ${y-13} ${x+9} ${y-4} Q ${x+13} ${y+3} ${x+5} ${y+9} Q ${x-4} ${y+13} ${x-9} ${y+4} Z`;
     heading.append(el("path",{d,fill:rc.hex,opacity:".57",stroke:rc.hex,"stroke-width":"1.3"}));
     heading.append(el("circle",{cx:x-10,cy:y+9,r:1.6,fill:rc.hex,opacity:".4"}));
     heading.append(el("text",{x,y:y+3.7,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"10","font-weight":"bold",fill:"#2f3633",opacity:".85"},rc.short));graticule.append(heading);
   }
 }
 svg.append(graticule);
 for(const node of svg.children)node.setAttribute('data-static-chart','true');
 staticCharts.set(svg,{puzzle,mode,art});
 }
 // K-final: art → brush/direction → radar → hex surfaces → optional numbers
 // → interactive cells with all game information → start marker.
 const selected=Number.isInteger(state.layer)?state.layer:state.route.length-1;
 const segments=routeSegments(state.route,byId);
 svg.append(drawRouteInk(el,segments,selected,svg.id+'-route'));
 // Radar retains its existing geometry, semantics and independent visibility.
 if(state.distanceMode && state.distanceOrigin){
   // Resolve the concrete logical object, independently of its name or artwork.
   // Reuse the clue engine's full-footprint distance; sea keeps point distance.
   const originObject=puzzle.map.objects.find(o=>o.cells.includes(state.distanceOrigin));
   const layer=el("g",{class:"distance-overlay","data-distance-origin":state.distanceOrigin,"pointer-events":"none","aria-hidden":"true"});
   const shades=["#bc388b","#aa438f","#80539f","#536da2","#348ca4","#259eaa","#268e98"];
   for(const c of cells){
     // Distances include island / blocked hexes too: geometry is independent of sailing.
     const d=originObject?rules.distanceToPlace(c.id,originObject.id):dist(state.distanceOrigin,c.id),[x,y]=coords(c);
     const col=shades[Math.min(d,shades.length-1)];
     layer.append(el("text",{class:"distance-value","data-distance-cell":c.id,"data-distance":d,x,y:y+17,"text-anchor":"middle","font-family":"system-ui, sans-serif","font-size":"51","font-weight":"900",fill:col,opacity:Math.max(.31,.66-d*.055),stroke:"#fff6df","stroke-width":"1.8","paint-order":"stroke"},String(d)));
   }
   svg.append(layer);
 }
 const surfaces=el('g',{class:'hex-surfaces','pointer-events':'none','aria-hidden':'true'});
 const information=el('g',{class:'cell-information'});
 svg.append(surfaces);
 if(state.showRouteNumbers)svg.append(drawRouteNumbers(el,segments,selected));
 svg.append(information);
 for(const c of cells){
  const [x,y]=coords(c),land=blocked.has(c.id),m=land?undefined:state.marks[key(state.layer,c.id)];
  const colors={no:"#c9a6a02c",maybe:"#efd38b29",yes:"#90c4a229"};
  const g=el("g",{class:land?"cell blocked-cell":"cell",tabindex:"0",role:"button","aria-label":pretty(c.id)+(land?" Land":""),"data-id":c.id,"data-object-id":puzzle.map.objects.find(o=>o.cells.includes(c.id))?.id??''});
  surfaces.append(el("polygon",{points:poly(x,y),fill:land?"transparent":colors[m]||"transparent",stroke:land?"#d6c59a":"#ece3c1","stroke-width":"1.05","stroke-opacity":land?".62":".56",...(land?{"stroke-dasharray":"4 3"}:{}),"stroke-linejoin":"round"}));
  // Keep the existing cell DOM, keyboard handler and hover outline. Its
  // transparent hit area is above decorative numbers; the visible fill/grid
  // is below them. All game annotations stay in the same interactive cell.
  g.append(el('polygon',{points:poly(x,y),fill:'transparent',stroke:'none','pointer-events':'all'}));
  // Illustrationen liegen bereits auf der unteren, markierungsunabhängigen Ebene.
  // Markierungen dürfen Motive niemals aus dem DOM entfernen.
  // The active hour highlights the entire corresponding hex EDGE, even when unmarked.
  // Hex vertices lie at 30°, 90°, ...; edge midpoints at 0°, 60°, ...
  if(!land && Number.isInteger(state.layer) && state.layer>=1 && state.layer<=puzzle.steps){
    const angle=(state.layer-2)*Math.PI/3;
    const ax=x+36*Math.cos(angle-Math.PI/6),ay=y+36*Math.sin(angle-Math.PI/6);
    const bx=x+36*Math.cos(angle+Math.PI/6),by=y+36*Math.sin(angle+Math.PI/6);
    g.append(el("path",{class:"active-hour-edge edge-contour","data-active-hour":state.layer,d:`M ${ax} ${ay} L ${bx} ${by}`,fill:"none",stroke:"#fff2d4","stroke-width":"4.6",opacity:".98","stroke-linecap":"round"}));
    g.append(el("path",{class:"active-hour-edge edge-ink","data-active-hour":state.layer,d:`M ${ax} ${ay} L ${bx} ${by}`,fill:"none",stroke:"#70502e","stroke-width":"2.2",opacity:".98","stroke-linecap":"round"}));
  }
  // Active layer is encoded by the field's central fill and a small center glyph.
  if(m){
    const glyph={no:"×",maybe:"?",yes:"✓"}[m];
    g.append(el("text",{x,y:y+9,"font-size":"20","font-weight":"800","text-anchor":"middle",fill:m==="no"?"#933c34":m==="yes"?"#216542":"#8a6221",stroke:"#f6f0de","stroke-width":"1.4","paint-order":"stroke"},glyph));
  }
  // Six compact, fixed-position side annotations: hour 1 to 6.
  // Hidden hours keep all their notes but do not clutter the overview.
  for(let h=1;h<=puzzle.steps;h++){
    const mark=state.marks[key(h,c.id)];
    if(land || !mark || (state.hiddenHours||[]).includes(h) || (state.hideRouteMarks&&state.route.includes(c.id)))continue;
    const angle=(h-2)*Math.PI/3;
    const cx=x+28*Math.cos(angle),cy=y+28*Math.sin(angle);
    const fills={no:"#a34c46",maybe:"#c69b40",yes:"#36816b"};
    g.append(el("circle",{cx,cy,r:9.2,fill:fills[mark],opacity:state.layer===h?.98:.58,stroke:state.layer===h?"#ffffff":"#f8f3e6","stroke-width":state.layer===h?"1.5":".8"}));
    g.append(el("text",{x:cx,y:cy+3.4,"font-size":"11.8","font-weight":"900","text-anchor":"middle",fill:"white",opacity:state.layer===h?1:.72},({no:"×",maybe:"?",yes:"✓"})[mark]));
  }
  // Blocked hexes are hit targets only for distance selection, never for notes
  // or route editing. Do not initiate a drag from a blocked hex in normal mode.
  const mayActivate=()=>!land||distancePhase(state)==='waiting';
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(mayActivate())onActivate(c.id,true)}});
  information.append(g);
 }
 // Distinguish the actual departure point from the wreck's identical anchor icon.
 const [sx,sy]=coords(byId[puzzle.start]);
 svg.append(el("ellipse",{cx:sx,cy:sy+5,rx:22,ry:15.5,fill:"none",stroke:"#e8c383","stroke-width":"1.5",opacity:".7","data-start-marker":"true","pointer-events":"none"}));
 // Last paint layer: temporary names take priority, never pointer events.
 placeReferencesFor(svg).mount({puzzle,byId,el});
 fitLabels(svg);
 if(focusedId)svg.querySelector(`[data-id="${focusedId}"]`)?.focus({preventScroll:true});
}
