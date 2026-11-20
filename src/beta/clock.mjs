// Monotonic, delta-only accounting. The browser adapter owns the exclusive lock.
export const IDLE_MS=15*60*1000;
export function createActiveClock({now=()=>performance.now(),add,idleMs=IDLE_MS}={}){
 let last=now(),activity=last,visible=true,owner=false,paused=false,open=true;
 function tick(){
  const current=now(),end=Math.min(current,activity+idleMs),delta=Math.max(0,end-last);
  // A suspended event loop is not evidence of active thought. Never count sleep gaps.
  if(visible&&owner&&!paused&&open&&current-last<=10000&&delta)add(Math.round(delta));
  last=current;
 }
 return {tick,activity(){tick();activity=now();},
  set(values){tick();if('visible'in values)visible=values.visible;if('owner'in values)owner=values.owner;if('paused'in values)paused=values.paused;if('open'in values)open=values.open;},
  get reason(){return !open?'ended':paused?'manual':!visible?'hidden':now()-activity>=idleMs?'idle':!owner?'other-tab':'running';}
 };
}
