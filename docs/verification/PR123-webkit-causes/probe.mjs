// Diagnostic only; run from the repository root. Never patches files on disk.
import {webkit,devices,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.DIAG_BASE_URL??'http://127.0.0.1:4201';
const out=process.env.DIAG_OUT??'.dev/pr123-webkit-causes';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('src/ui/place-references.mjs','utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const analyzedHead='a69af2885ffbd00cc67db56d415460525c08124a';
if(hash(source)!==hash(execFileSync('git',['show',analyzedHead+':src/ui/place-references.mjs'])))
 throw Error('Place-reference source differs from the analyzed head');
if(hash(fs.readFileSync('puzzles/model-demo.json'))!==hash(execFileSync('git',['show',analyzedHead+':puzzles/model-demo.json'])))
 throw Error('Demo fixture differs from the analyzed head');
const patches=[
 [' function clear(){',' function clear(){\n  window.__placesAudit?.event("clear-call",layer);'],
 [' function show(next,{start=false}={}){',' function show(next,{start=false}={}){\n  window.__placesAudit?.event("show-call",layer,{requested:next,start});'],
 ['  const startTime=document.timeline.currentTime;','  const startTime=document.timeline.currentTime;\n  window.__placesAudit?.configured(layer,{duration,reduced:motion.matches,startTime});'],
 ['Promise.all(finished).then(done=>{if(layer===active&&done.every(Boolean))clear();});','Promise.all(finished).then(done=>{window.__placesAudit?.event("all-settled",active,{currentLayer:window.__placesAudit?.layerId(layer),done});if(layer===active&&done.every(Boolean))clear();});'],
 [' const controller={show,clear,mount(next){',' const controller={show,clear,mount(next){\n  window.__placesAudit?.event("mount-call",layer,{samePuzzle:context?.puzzle===next.puzzle});']
];
let instrumented=source;
for(const [needle,replacement] of patches){if(instrumented.split(needle).length!==2)throw Error('Instrumentation anchor mismatch');instrumented=instrumented.replace(needle,replacement);}
let stripped=instrumented;for(const [needle,replacement] of patches.slice().reverse())stripped=stripped.replace(replacement,needle);
if(stripped!==source)throw Error('Instrumentation changed original logic');
function installAudit(options){
 const started=performance.now(),events=[],tracks=[],layers=[],refs=[],layerIds=new WeakMap(),byAnimation=new WeakMap(),seenPromises=new WeakMap();
 let nextLayer=0,configuredCount=0,manualOrigin=null,loadTimer=null;
 const layerId=layer=>{if(!layer)return null;if(!layerIds.has(layer)){const id=++nextLayer;layerIds.set(layer,id);layers.push({id});}return layerIds.get(layer);};
 const sample=a=>({wall:performance.now()-started,timeline:document.timeline.currentTime,start:a.startTime,current:a.currentTime,state:a.playState,pending:a.pending});
 const event=(type,layer,details={})=>events.push({type,wall:performance.now()-started,timeline:document.timeline.currentTime,visibility:document.visibilityState,layer:layerId(layer),connected:layer?.isConnected??false,...details});
 const snapshot=label=>({label,wall:performance.now()-started,timeline:document.timeline.currentTime,visibility:document.visibilityState,manualOrigin,
  media:matchMedia('(prefers-reduced-motion: reduce)').matches,labels:document.querySelectorAll('#map .place-label').length,
  currentLayers:[...document.querySelectorAll('#map .place-references')].map(layerId),
  tracks:tracks.map((t,i)=>({...structuredClone(t),now:sample(refs[i]),connected:refs[i].effect.target.isConnected}))});
 window.__placesAudit={event,layerId,events,tracks,layers,snapshot,
  configured(layer,details){configuredCount++;event('configured',layer,{...details,number:configuredCount});
   if(configuredCount===2){manualOrigin=performance.now()-started;
    if(options.mode==='moderate'){
     event('moderate-start',layer);
     loadTimer=setInterval(()=>{const end=performance.now()+120;while(performance.now()<end){};},250);
     setTimeout(()=>{clearInterval(loadTimer);event('moderate-end',layer);},6000);
    }
    if(options.mode==='busy')loadTimer=setTimeout(()=>{
     event('busy-begin',layer,{state:snapshot('before-busy')});const end=performance.now()+options.busyMs;
     while(performance.now()<end){};
     event('busy-end',layer,{state:snapshot('after-busy')});
    },options.busyAt);
   }
  },
  stop(){clearInterval(window.__placesSampleTimer);clearTimeout(loadTimer);clearInterval(loadTimer);}
 };
 const animate=Element.prototype.animate;
 Element.prototype.animate=function(...args){
  const a=animate.apply(this,args),layer=this.closest('.place-references');if(!layer)return a;
  const timing=a.effect.getTiming();
  const track={id:tracks.length+1,layer:layerId(layer),targetClass:this.getAttribute('class'),
   duration:timing.duration,delay:timing.delay,endDelay:timing.endDelay,iterations:timing.iterations,
   playbackRate:a.playbackRate,keyframes:args[0],created:sample(a),finishedAccesses:0,promises:[]};
  tracks.push(track);refs.push(a);byAnimation.set(a,track);
  a.ready.then(()=>{track.ready=sample(a);event('ready',layer,{track:track.id});},e=>{track.readyRejected=e.name;});
  return a;
 };
 const desc=Object.getOwnPropertyDescriptor(Animation.prototype,'finished');
 Object.defineProperty(Animation.prototype,'finished',{...desc,get(){
  const promise=desc.get.call(this),track=byAnimation.get(this);
  if(track){track.finishedAccesses++;
   if(!seenPromises.has(promise)){
    const record={index:track.promises.length+1,status:'pending'};track.promises.push(record);seenPromises.set(promise,record);
    promise.then(()=>{record.status='fulfilled';record.finished=sample(this);event('finished',this.effect.target.closest('.place-references'),{track:track.id,promise:record.index});},e=>{
     record.status='rejected';record.error=e.name;record.finished=sample(this);event('rejected',this.effect.target.closest('.place-references'),{track:track.id,error:e.name});
    });
   }
  }
  return promise;
 }});
 const media=matchMedia('(prefers-reduced-motion: reduce)');event('audit-installed',null,{reduced:media.matches});
 media.addEventListener('change',e=>event('media-change',document.querySelector('#map .place-references'),{reduced:e.matches}));
 document.addEventListener('visibilitychange',()=>event('visibility-change',document.querySelector('#map .place-references')));
 document.addEventListener('DOMContentLoaded',()=>{
  const map=document.getElementById('map');
  new MutationObserver(records=>{for(const r of records){
   for(const n of r.addedNodes)if(n.classList?.contains('place-references'))event('inserted',n);
   for(const n of r.removedNodes)if(n.classList?.contains('place-references'))event('removed',n);
  }}).observe(map,{childList:true});
 });
 if(options.mode==='sampled')window.__placesSampleTimer=setInterval(()=>event('sample',document.querySelector('#map .place-references'),{state:snapshot('interval')}),200);
}
function fixture(){
 const dto=JSON.parse(fs.readFileSync('puzzles/model-demo.json','utf8')),p=dto.puzzle;
 p.presentation.objectNames={o1:'Roberts Boot',o2:'Zwilling',o4:'Kiste'};
 p.presentation.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';p.presentation.cluePlaceRefs={I:['o1','o2']};
 p.logic.clues.splice(1,0,{id:'Ort',type:'distanceToPlace',hour:0,placeId:'o4',distance:4});
 p.presentation.clueTexts.Ort='Bei der Abfahrt waren wir vier Hexfelder von Kiste entfernt.';return dto;
}
const modes=(process.env.DIAG_MODES??'passive,sampled,busy,background,redraw,retrigger').split(',');
for(const mode of modes)if(!['passive','sampled','busy','background','redraw','retrigger','moderate','fault'].includes(mode))throw Error('Unknown diagnostic mode: '+mode);
const browser=await webkit.launch();const results=[];
try{
 for(const mode of modes){
  const context=await browser.newContext({...devices['Desktop Safari']});
  await context.addInitScript(installAudit,{mode,busyAt:2500,busyMs:2200});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  // This explicit fault control is never the product-under-test variant.
  const served=mode==='fault'?instrumented.replace('if(layer===active&&done.every(Boolean))clear();',
   'if(layer===active&&done.every(Boolean)&&window.__placesAudit.layerId(active)!==2)clear();'):instrumented;
  await page.route('**/src/ui/place-references.mjs',r=>r.fulfill({contentType:'text/javascript',body:served}));
  await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:fixture()}));
  const run={mode,analyzedHead,browserVersion:browser.version(),sourceSha256:hash(source),instrumentedSha256:hash(served),instrumentationStripsExactly:mode!=='fault',intentionalCleanupFault:mode==='fault'};
  try{
   await page.goto(base+'/?puzzle=model-demo');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
   await expect(page.locator('#puzzleLoadError')).toBeHidden();
   run.opacity=await page.locator('.label-paper').first().evaluate(n=>+getComputedStyle(n).opacity);
   await page.waitForTimeout(1800);await page.locator('#map .cell[data-id="A1"]').focus();await page.keyboard.press('Enter');
   await expect(page.locator('#map .place-label')).toHaveCount(0,{timeout:2200});
   await page.locator('#showPlaces').click();await expect(page.locator('#map .place-label text')).toHaveText(['Roberts Boot','Zwilling','Kiste','Start']);
   run.afterShow=await page.evaluate(()=>window.__placesAudit.snapshot('after-show'));
   if(mode==='background'){const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();run.backgrounded=await page.evaluate(()=>({visibility:document.visibilityState,hidden:document.hidden}));}
   if(mode==='redraw'){
    run.beforeRedraw=await page.evaluate(()=>window.__placesAudit.snapshot('before-redraw'));
    await page.locator('#map .cell[data-id="B1"]').focus();await page.keyboard.press('Enter');
    await page.evaluate(()=>{for(const checked of [false,true]){const c=document.getElementById('showChart');c.checked=checked;c.dispatchEvent(new Event('change'));}});
    run.afterRedraw=await page.evaluate(()=>window.__placesAudit.snapshot('after-redraw'));
   }
   if(mode==='retrigger'){await page.waitForTimeout(1500);await page.locator('#showPlaces').click();run.afterRetrigger=await page.evaluate(()=>window.__placesAudit.snapshot('after-retrigger'));}
   const assertionStart=Date.now();
   try{await expect(page.locator('#map .place-label')).toHaveCount(0,{timeout:4000});run.originalFourSecondAssertion=true;}
   catch(e){run.originalFourSecondAssertion=false;run.assertionError=e.message;}
   run.assertionWallMs=Date.now()-assertionStart;run.afterAssertion=await page.evaluate(()=>window.__placesAudit.snapshot('after-assertion'));
   // Diagnostic follow-through only: never turn a failed original assertion green.
   await page.waitForTimeout(3000);run.final=await page.evaluate(()=>window.__placesAudit.snapshot('follow-through'));
   run.audit=await page.evaluate(()=>({events:window.__placesAudit.events,layers:window.__placesAudit.layers}));
   await page.evaluate(()=>window.__placesAudit.stop());
  }catch(e){run.failure=e.stack;}
  run.pageErrors=errors;results.push(run);fs.writeFileSync(out+'/'+mode+'.json',JSON.stringify(run,null,2)+'\n');
  console.log(JSON.stringify({mode,originalAssertion:run.originalFourSecondAssertion,labelsAfter:run.afterAssertion?.labels,finalLabels:run.final?.labels,configured:run.audit?.events.filter(e=>e.type==='configured').map(e=>({layer:e.layer,reduced:e.reduced,duration:e.duration})),failure:run.failure}));
  await context.close();
 }
}finally{await browser.close();fs.writeFileSync(out+'/summary.json',JSON.stringify({browser:'webkit',analyzedHead,sourceSha256:hash(source),results},null,2)+'\n');}
