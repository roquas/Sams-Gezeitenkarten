import {CHART_BOUNDS} from './chart-geometry.mjs';
import {hexCenter,hexVertices,containsPoint,labelFootprint,polygonsOverlap,placeLabelLayout,drawParchmentLabel} from './place-labels.mjs';

export const namedPlaceIds=puzzle=>puzzle.map.objects.filter(o=>Object.hasOwn(puzzle.objectNames,o.id)&&puzzle.objectNames[o.id].trim()).map(o=>o.id);
export function cluePlaceIds(puzzle,id){
 // Editorial references describe the displayed wording; otherwise the existing
 // structured placeId is already an explicit reference. Never infer from cells,
 // motif names, text, or the route/solver (a position clue need not name a place).
 if(Object.hasOwn(puzzle.cluePlaceRefs??{},id))return puzzle.cluePlaceRefs[id];
 const clue=puzzle.clues.find(c=>c.id===id);
 return clue?.placeId?[clue.placeId]:[];
}
const overlays=new WeakMap();
export function placeReferencesFor(svg){
 if(overlays.has(svg))return overlays.get(svg);
 let context,layer,animations=[],ids=[],includeStart=false;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function clear(){
  for(const animation of animations)if(animation.playState!=='finished')animation.cancel();
  animations=[];layer?.remove();layer=null;ids=[];includeStart=false;
 }
 function show(next,{start=false}={}){
  clear();if(!context)return;
  const {puzzle,byId,el}=context,wanted=new Set(next);
  ids=namedPlaceIds(puzzle).filter(id=>wanted.has(id));
  includeStart=start;
  if(!ids.length&&!start)return;
  const startLayout=placeLabelLayout([puzzle.start],'Start',byId,CHART_BOUNDS);
  layer=el('g',{class:'place-references','pointer-events':'none','aria-hidden':'true'});
  for(const id of ids){
   const object=puzzle.map.objects.find(o=>o.id===id),name=puzzle.objectNames[id];
   // Reserve the start hex for its single, unambiguous plaque. A multihex
   // place keeps its name on the remaining footprint; puzzle data stay intact.
   const cells=object.cells.filter(cell=>cell!==puzzle.start);
   if(cells.length!==object.cells.length)includeStart=true;
   let layout=placeLabelLayout(cells,name,byId,CHART_BOUNDS);
   // A footprint surrounding the start can still have its centroid there.
   // Anchor that name on a remaining hex instead, retaining the full reference.
   if(layout&&includeStart&&object.cells.includes(puzzle.start)&&
    containsPoint(hexVertices(...hexCenter(byId[puzzle.start])),[layout.x,layout.y])){
    layout={...placeLabelLayout([cells[0]],name,byId,CHART_BOUNDS),cells};
   }
   if(layout&&object.cells.includes(puzzle.start)&&startLayout&&
    polygonsOverlap(labelFootprint(layout,3),labelFootprint(startLayout,3))){
    // Keep the plaques themselves apart, including wide names on adjacent hexes.
    const dx=(layout.width+startLayout.width)/2+6,dy=(layout.height+startLayout.height)/2+6;
    const side=Math.sign(layout.x-startLayout.x)||1;
    const candidates=[{...layout,x:startLayout.x+side*dx},
     {...layout,y:startLayout.y-dy},{...layout,y:startLayout.y+dy},
     {...layout,x:startLayout.x-side*dx}];
    const b=CHART_BOUNDS;
    layout=candidates.find(p=>labelFootprint(p,p.margin).every(([x,y])=>
     x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height))??layout;
   }
   if(layout)layer.append(drawParchmentLabel(el,layout,name,{objectId:id}));
  }
  if(includeStart){
   if(startLayout)layer.append(drawParchmentLabel(el,startLayout,'Start',{start:true}));
  }
  svg.append(layer);
  // Constrain unusually long editorial names using actual browser font metrics.
  for(const label of layer.children){
   const text=label.querySelector('text'),width=Number(label.dataset.labelWidth)-16;
   const measured=text.getComputedTextLength();
   if(measured>width)text.setAttribute('font-size',Number(text.getAttribute('font-size'))*width/measured);
  }
  // Independent paper/ink tracks share one timeline origin for the entire
  // trigger. Subscribe to every finished promise immediately, also on cancel.
  const active=layer,duration=motion.matches?3000:4900;
  const startTime=document.timeline.currentTime;
  const paper=[{opacity:0,offset:0,easing:'ease-in-out'},{opacity:1,offset:400/4900},
   {opacity:1,offset:900/4900,easing:'ease-in-out'},{opacity:0,offset:2900/4900},{opacity:0,offset:1}];
  const ink=[{opacity:0,offset:0,easing:'ease-in-out'},{opacity:1,offset:400/4900},
   {opacity:1,offset:2900/4900,easing:'ease-in-out'},{opacity:0,offset:1}];
  const finished=[];
  for(const target of layer.querySelectorAll('.label-paper,.label-ink')){
   const animation=target.animate(motion.matches?[{opacity:1},{opacity:1}]:target.classList.contains('label-paper')?paper:ink,{duration,fill:'both'});
   if(startTime!==null)animation.startTime=startTime;
   animations.push(animation);
   finished.push(animation.finished.then(()=>true,()=>false));
  }
  Promise.all(finished).then(done=>{if(layer===active&&done.every(Boolean))clear();});
 }
 const controller={show,clear,mount(next){
  if(context?.puzzle!==next.puzzle)clear();
  context=next;
  // Normal map redraws and frame changes preserve the same running animation.
  if(layer)svg.append(layer);
 }};
 motion.addEventListener?.('change',()=>{if(layer)show(ids.slice(),{start:includeStart});});
 window.addEventListener('pagehide',clear);
 overlays.set(svg,controller);return controller;
}
