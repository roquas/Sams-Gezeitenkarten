import {CHART_BOUNDS} from './chart-geometry.mjs';
import {placeLabelLayout,drawParchmentLabel} from './place-labels.mjs';

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
 let context,layer,animation,ids=[];
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function clear(){
  animation?.cancel();animation=null;layer?.remove();layer=null;ids=[];
 }
 function show(next){
  clear();if(!context)return;
  const {puzzle,byId,el}=context,wanted=new Set(next);
  ids=namedPlaceIds(puzzle).filter(id=>wanted.has(id));
  if(!ids.length)return;
  layer=el('g',{class:'place-references','pointer-events':'none','aria-hidden':'true'});
  for(const id of ids){
   const object=puzzle.map.objects.find(o=>o.id===id),name=puzzle.objectNames[id];
   const layout=placeLabelLayout(object.cells,name,byId,CHART_BOUNDS);
   if(layout)layer.append(drawParchmentLabel(el,layout,name,{objectId:id}));
  }
  svg.append(layer);
  // Constrain unusually long editorial names using actual browser font metrics.
  for(const label of layer.children){
   const text=label.querySelector('text'),width=Number(label.querySelector('rect').getAttribute('width'))-16;
   const measured=text.getComputedTextLength();
   if(measured>width)text.setAttribute('font-size',22*width/measured);
  }
  // One Web Animation for the whole group, including its hold. No timers or
  // per-label animations. Cancellation rejects finished; stale completions
  // cannot clear a newer trigger. Reduced motion holds for 3s without fades.
  const active=layer;
  animation=layer.animate(motion.matches?[{opacity:1},{opacity:1}]:[
   {opacity:0,offset:0,easing:'ease-in-out'},
   {opacity:1,offset:400/5400},
   {opacity:1,offset:3400/5400,easing:'ease-in-out'},
   {opacity:0,offset:1}
  ],{duration:motion.matches?3000:5400,fill:'both'});
  animation.finished.then(()=>{if(layer===active)clear();},()=>{});
 }
 const controller={show,clear,mount(next){
  if(context?.puzzle!==next.puzzle)clear();
  context=next;
  // Normal map redraws and frame changes preserve the same running animation.
  if(layer)svg.append(layer);
 }};
 motion.addEventListener?.('change',()=>{if(layer)show(ids.slice());});
 window.addEventListener('pagehide',clear);
 overlays.set(svg,controller);return controller;
}
