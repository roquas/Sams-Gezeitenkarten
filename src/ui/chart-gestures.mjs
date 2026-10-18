// A finger tap edits on release, so a vertical scroll never starts a note or
// an undo entry. Horizontal-dominant swipes edit; a tie belongs to scrolling.
// Mouse and pen keep immediate, unrestricted drawing. Native pan-y/pinch-zoom
// decides actual scrolling; do not cancel its pointerdown/move events.
export function createChartGestures(svg,{mayStart,start,move,end}){
 let gesture=null;
 const cellAt=(x,y)=>{
  const cell=document.elementFromPoint(x,y)?.closest('[data-id]');
  return cell&&svg.contains(cell)?cell.dataset.id:null;
 };
 const finish=()=>{gesture=null;end();};
 const capture=id=>{try{svg.setPointerCapture(id)}catch{}};
 svg.addEventListener('pointerdown',event=>{
  if(!event.isPrimary){finish();return;}
  if(event.button!==0)return;
  const id=event.target.closest('[data-id]')?.dataset.id;
  if(!id||!mayStart(id))return;
  finish();
  gesture={pointer:event.pointerId,id,x:event.clientX,y:event.clientY,touch:event.pointerType==='touch',drawing:event.pointerType!=='touch'};
  if(gesture.drawing){event.preventDefault();capture(event.pointerId);start(id);}
 });
 svg.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.pointer)return;
  if(!gesture.drawing){
   const dx=Math.abs(event.clientX-gesture.x),dy=Math.abs(event.clientY-gesture.y);
   if(Math.hypot(dx,dy)<10)return;
   if(dy>=dx){finish();return;}
   gesture.drawing=true;capture(event.pointerId);start(gesture.id);
  }
  const id=cellAt(event.clientX,event.clientY);
  if(id)move(id);
 });
 window.addEventListener('pointerup',event=>{
  if(!gesture||event.pointerId!==gesture.pointer)return;
  if(gesture.touch&&!gesture.drawing&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<10)start(gesture.id);
  finish();
 });
 window.addEventListener('pointercancel',event=>{if(gesture?.pointer===event.pointerId)finish();});
 window.addEventListener('lostpointercapture',event=>{
  // Touch starts with implicit capture on the hex. Its transfer to the SVG
  // must not cancel drawing; only loss of our own capture ends that gesture.
  if(event.target===svg&&gesture?.pointer===event.pointerId)finish();
 });
 window.addEventListener('blur',finish);
 window.addEventListener('pagehide',finish);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 return finish;
}
