import {createActiveClock} from './clock.mjs';
import {puzzleIdentity,recordId} from './storage.mjs';
export function createBetaSession({store,puzzle,scope,replay=false,paused=false,state,host}){
 const identity=puzzleIdentity(puzzle,scope);
 store.start(identity,puzzle.title,{replay,paused,counters:state?{hints:state.hintCount,noteChecks:Math.floor(Math.max(0,state.penalty-state.hintPenalty)/5),penaltyPoints:state.penalty}:{}});
 // Existing test profiles (or browser settings) may clear storage before reload.
 const phase=()=>store.get(identity)?.phases.at(-1)??{phaseId:null,status:'removed',paused:true},phaseId=phase().phaseId;
 const isCurrentOpen=()=>phase().phaseId===phaseId&&phase().status==='open';
 const clock=createActiveClock({add:ms=>{if(isCurrentOpen())store.phaseUpdate(identity,p=>{if(p.phaseId===phaseId&&p.status==='open')p.activeMs+=ms;});}});
 clock.set({visible:!document.hidden,paused:phase().paused,open:isCurrentOpen()});
 const controls=document.createElement('div');controls.className='beta-session';
 const status=document.createElement('span');status.role='status';
 const pause=document.createElement('button');pause.type='button';pause.className='btn small';
 controls.append(status,pause);host.append(controls);
 let release,disposed=false,acquiring=false,lockingFailed=!navigator.locks;
 if(lockingFailed)store.phaseUpdate(identity,p=>{p.timeTracking='unavailable';});
 async function acquire(){
  if(disposed||document.hidden||release||acquiring||!isCurrentOpen()||clock.reason==='idle')return;
  if(lockingFailed)return;
  acquiring=true;
  try{await navigator.locks.request('gk-beta-time:'+recordId(identity),{ifAvailable:true},async lock=>{
   acquiring=false;if(!lock||disposed||document.hidden)return;
   clock.activity();clock.set({owner:true});draw();
   await new Promise(resolve=>{release=resolve;});release=null;clock.set({owner:false});
  });}catch{lockingFailed=true;clock.set({owner:false});store.phaseUpdate(identity,p=>{p.timeTracking='unavailable';});draw();}finally{acquiring=false;}
 }
 function draw(){
  if(lockingFailed&&isCurrentOpen()){status.textContent='Zeitmessung in diesem Browser nicht verfügbar. Das Rätsel bleibt spielbar.';pause.disabled=true;return;}
  const reason=clock.reason;
  status.textContent=({ended:'Bearbeitung beendet',manual:'Zeit pausiert',hidden:'Zeit pausiert (Hintergrund)',idle:'Zeit pausiert nach 15 Min. ohne Eingabe','other-tab':'Zeitmessung in einem anderen Tab',running:'Aktive Zeit läuft · Näherungswert'}[reason]);
  pause.textContent=reason==='running'?'Zeit pausieren':'Zeit fortsetzen';pause.disabled=reason==='ended';
 }
 function flush(){clock.tick();draw();}
 function visibility(){flush();clock.set({visible:!document.hidden});if(document.hidden)release?.();else{clock.activity();acquire();}draw();}
 const activity=event=>{if(event.target===pause)return;clock.activity();acquire();draw();};
 pause.onclick=()=>{const value=clock.reason==='running';store.phaseUpdate(identity,p=>{if(p.phaseId===phaseId)p.paused=value;});clock.activity();clock.set({paused:value});acquire();draw();};
 document.addEventListener('visibilitychange',visibility);
 document.addEventListener('pointerdown',activity,{passive:true});document.addEventListener('keydown',activity);
 const pagehide=()=>{flush();release?.();};window.addEventListener('pagehide',pagehide);
 const timer=setInterval(()=>{clock.set({open:isCurrentOpen(),paused:phase().paused});flush();if(!isCurrentOpen()||clock.reason==='idle')release?.();else acquire();},5000);
 acquire();draw();
 return {identity,flush,
  count(name,penalty=0){store.phaseUpdate(identity,p=>{if(p.phaseId===phaseId){p[name]++;p.penaltyPoints+=penalty;}});},
  solve(){flush();store.phaseUpdate(identity,(p,r)=>{const stamp=new Date().toISOString();if(p.phaseId===phaseId){p.status='solved';p.endedAt??=stamp;}r.solvedAt??=stamp;});clock.set({open:false});release?.();draw();},
  dispose(){flush();disposed=true;release?.();clearInterval(timer);controls.remove();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerdown',activity);document.removeEventListener('keydown',activity);window.removeEventListener('pagehide',pagehide);}
 };
}
