import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const demo=read('puzzles/model-demo.json');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const labels=page=>page.locator('#map .reference-label');
const names=page=>labels(page).locator('text');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
function fixture(){
 const dto=structuredClone(demo),p=dto.puzzle;
 p.presentation.objectNames={o1:'Roberts Boot',o2:'Zwilling',o4:'Kiste'};
 // The first clue explicitly names two places in its editorial wording.
 p.presentation.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';
 p.presentation.cluePlaceRefs={I:['o1','o2']};
 // Existing structured placeId, independent of editorial metadata.
 p.logic.clues.splice(1,0,{id:'Ort',type:'distanceToPlace',hour:0,placeId:'o4',distance:4});
 p.presentation.clueTexts.Ort='Bei der Abfahrt waren wir vier Hexfelder von Kiste entfernt.';
 return dto;
}
async function open(page,dto=fixture()){
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
test('initial clue shows exactly its explicit places on first start and saved-game reload',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.reload();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 expect((await saved(page)).marks).toEqual({'1:A1':'maybe'});
 await expect(cell(page,'A1')).toContainText('?');
});
test('navigation replaces references, checkboxes do not retrigger, and a clue without references clears immediately',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Kiste']);
 // Check off the current clue via keyboard. The visible group stays the same.
 await page.locator('.place-references').evaluate(n=>window.referenceGroup=n);
 await page.locator('#clueTrack [data-clue]').focus();await page.keyboard.press('Space');
 expect(await page.locator('.place-references').evaluate(n=>n===window.referenceGroup)).toBe(true);
 await expect(page.locator('#clueTrack [data-clue]')).toHaveAttribute('aria-checked','true');
 await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#cluePosition')).toHaveText('II / III');await expect(labels(page)).toHaveCount(0);
 await page.keyboard.press('ArrowLeft');await expect(names(page)).toHaveText(['Kiste']);
});
test('manual action shows each named instance once, including passable hexes, excludes unnamed and flavor art',async({page,isMobile},info)=>{
 const dto=fixture(),library=read('assets/catalog/library.json');
 // Isolated transport fixture; this is no production approval of flavor art.
 const flavor=structuredClone(library.assets.find(a=>a.role==='decoration'&&a.stage==='illustration'&&a.geometry.cells.length===1));
 flavor.id='test.flavor';flavor.production='enabled';library.assets.push(flavor);
 library.reviews.push({assetId:flavor.id,backgroundId:'sea-blue-01',status:'approved',reviewer:'Intercepted test only',date:'2026-11-20',assetSha256:'a'.repeat(64),backgroundSha256:'b'.repeat(64),notes:'Test fixture'});
 dto.puzzle.presentation.assetPlacements.push({id:'flavor',assetId:flavor.id,anchor:'E4'});
 await page.route('**/assets/catalog/library.json',r=>r.fulfill({json:library}));
 await open(page,dto);
 await page.locator('#showPlaces').focus();await page.keyboard.press('Enter');
 await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 await expect(page.locator('[data-label-object="o1"]')).toHaveAttribute('data-label-cells','A5 B5');
 await expect(page.locator('[data-label-object="o2"]')).toHaveAttribute('data-label-cells','B2 C2');
 await expect(page.locator('[data-label-object="o4"]')).toHaveAttribute('data-label-cells','D3');
 await expect(page.locator('[data-placement-id="flavor"]')).toHaveCount(1);
 await expect(page.locator('[data-label-object="o3"]')).toHaveCount(0);
 const positions=await labels(page).evaluateAll(ns=>ns.map(n=>({id:n.dataset.labelObject,x:n.transform.baseVal.getItem(0).matrix.e,y:n.transform.baseVal.getItem(0).matrix.f})));
 expect(positions).toEqual([{id:'o1',x:101,y:328},{id:'o2',x:224,y:124},{id:'o4',x:306,y:192}]);
 await page.waitForTimeout(500);
 const path=info.outputPath('place-references-'+(isMobile?'mobile':'desktop')+'.png');
 await page.locator('.mapbox').screenshot({path,scale:'css'});
 await page.locator('#mapActions').screenshot({path:info.outputPath('place-actions-'+(isMobile?'mobile':'desktop')+'.png'),scale:'css'});await info.attach('multiple places including multihex',{path,contentType:'image/png'});
});
test('normal fade reaches a visible hold, completes, and restores the ordinary chart',async({page},info)=>{
 await open(page);
 // Observe in the renderer before the native trigger. Node timers and protocol
 // round trips do not measure the Web Animation's start or sampled frame time.
 // Retain phase evidence even if the test process receives it much later.
 await page.evaluate(()=>{
  const lifecycle=window.placeLifecycle={samples:[],finished:false,removed:false};
  const observer=new MutationObserver(records=>{
   const group=records.flatMap(r=>[...r.addedNodes]).find(n=>n.nodeType===1&&n.matches('.place-references'));
   if(!group)return;
   observer.disconnect();
   const animation=group.getAnimations()[0];
   const sample=()=>{
    const style=getComputedStyle(group),rect=group.getBoundingClientRect();
    const state={wall:performance.now(),currentTime:animation.currentTime,startTime:animation.startTime,
     playState:animation.playState,pending:animation.pending,opacity:+style.opacity,
     visible:group.isConnected&&style.display!=='none'&&style.visibility==='visible'&&rect.width>0&&rect.height>0,
     inViewport:rect.bottom>0&&rect.right>0&&rect.top<innerHeight&&rect.left<innerWidth};
    lifecycle.samples.push(state);
    lifecycle.removed=!group.isConnected;
    if(!group.isConnected)clearInterval(timer);
   };
   animation.finished.then(()=>{lifecycle.finished=true;},()=>{lifecycle.cancelled=true;});
   const timer=setInterval(sample,100);
   sample();
  });
  observer.observe(document.querySelector('#map'),{childList:true});
 });
 try{
  await page.locator('#showPlaces').click();
  await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
  // Visibility alone ignores opacity in Playwright. Require a rendered,
  // non-transparent hold on the actual timeline, not merely existing labels.
  await expect.poll(()=>page.evaluate(()=>window.placeLifecycle.samples.some(s=>
   s.visible&&s.inViewport&&s.opacity===1&&!s.pending&&s.playState==='running'&&s.currentTime>=400&&s.currentTime<=3400))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.placeLifecycle.samples.some(s=>
   s.currentTime>3400&&s.opacity>0&&s.opacity<1))).toBe(true);
  await expect(labels(page)).toHaveCount(0,{timeout:3500});
  await expect(page.locator('.place-references')).toHaveCount(0);
  expect(await page.evaluate(()=>window.placeLifecycle.finished)).toBe(true);
  expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
  await expect(page.locator('.start-label')).toHaveText('Start');
  await expect(page.locator('[data-start-marker]')).toHaveCount(1);
 }finally{
  await info.attach('place-lifecycle',{body:JSON.stringify(await page.evaluate(()=>window.placeLifecycle),null,2),contentType:'application/json'});
 }
});
test('place animation renders fade-in, the full hold, and fade-out at its own timeline positions',async({page})=>{
 await open(page);await page.locator('#showPlaces').click();
 const group=page.locator('.place-references');
 // A separate rendering contract samples each phase deterministically. Seeking
 // is confined to this test; the test above requires unmodified native playback
 // and natural finished/DOM cleanup, so seeking cannot hide a stalled animation.
 const phases=await group.evaluate(async node=>{
  const animation=node.getAnimations()[0];
  animation.pause();await animation.ready;
  const duration=animation.effect.getComputedTiming().duration;
  const samples=[0,200,400,1900,3399,3400,4400,5399].map(time=>{
   animation.currentTime=time;
   return {time,opacity:+getComputedStyle(node).opacity};
  });
  animation.play();
  return {duration,samples};
 });
 expect(phases.duration).toBe(5400);
 const opacity=phases.samples.map(s=>s.opacity);
 expect(opacity[0]).toBe(0);
 expect(opacity[1]).toBeGreaterThan(0);expect(opacity[1]).toBeLessThan(1);
 expect(opacity.slice(2,6)).toEqual([1,1,1,1]);
 expect(opacity[6]).toBeGreaterThan(0);expect(opacity[6]).toBeLessThan(1);
 expect(opacity[7]).toBeGreaterThanOrEqual(0);expect(opacity[7]).toBeLessThan(opacity[6]);
 await expect(labels(page)).toHaveCount(0,{timeout:3500});
 await expect(group).toHaveCount(0);
});
test('rapid manual and clue triggers replace one animation and restart its complete lifetime',async({page,browserName},info)=>{
 if(browserName==='webkit')test.setTimeout(60_000);
 await open(page);
 // Observe the same native animations returned to the controller. No pause,
 // seek, finish, cancellation, changed durations, or wall-time sleeps.
 await page.evaluate(()=>{
  const entries=[],refs=[],unhandled=[];
  window.rapidLifecycle={entries,unhandled};
  window.addEventListener('unhandledrejection',e=>unhandled.push(String(e.reason)));
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const animation=animate.apply(this,args);
   if(!this.matches('.place-references'))return animation;
   const node=this,entry={duration:animation.effect.getComputedTiming().duration,samples:[]};
   entries.push(entry);refs.push({node,animation});
   const sample=event=>{
    entry.samples.push({event,wall:performance.now(),currentTime:animation.currentTime,startTime:animation.startTime,
     playState:animation.playState,pending:animation.pending,connected:node.isConnected,
     groups:document.querySelectorAll('#map .place-references').length,labels:document.querySelectorAll('#map .reference-label').length});
    if(!node.isConnected)clearInterval(timer);
   };
   const timer=setInterval(()=>sample('interval'),100);
   sample('created');
   animation.finished.then(()=>{entry.outcome='finished';entry.finishedAt=performance.now();sample('finished');},e=>{
    entry.outcome=e.name;sample('rejected');
   });
   return animation;
  };
  new MutationObserver(()=>refs.forEach(({node},i)=>{
   if(!node.isConnected&&entries[i].removedAt===undefined)entries[i].removedAt=performance.now();
  })).observe(document.querySelector('#map'),{childList:true});
  window.rapidAnimationStates=()=>refs.map(({node,animation})=>({connected:node.isConnected,playState:animation.playState,pending:animation.pending}));
 });
 try{
  await page.locator('#showPlaces').click();
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries[0]?.samples.some(s=>
   s.connected&&s.playState==='running'&&s.currentTime>=2200))).toBe(true);
  for(let i=0;i<4;i++){await page.locator('#nextClue').click();await page.locator('#showPlaces').click();}
  await expect(page.locator('.place-references')).toHaveCount(1);
  await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
  // A replaced animation must not shorten the last group's own lifetime.
  // Keep renderer-side evidence if protocol replies arrive after this phase.
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries.at(-1)?.samples.some(s=>
   s.connected&&s.currentTime>=3400&&s.groups===1&&s.labels===3))).toBe(true);
  // playState can reach the end before WebKit dispatches the native finished
  // promise. Start the unchanged cleanup deadline at observed animation end.
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries.at(-1)?.samples.some(s=>
   s.playState==='finished'))).toBe(true);
  await expect(labels(page)).toHaveCount(0,{timeout:3500});
  await expect(page.locator('.place-references')).toHaveCount(0);
  const report=await page.evaluate(()=>({...window.rapidLifecycle,states:window.rapidAnimationStates()}));
  expect(report.entries).toHaveLength(7);
  expect(report.entries.map(e=>e.duration)).toEqual(Array(7).fill(5400));
  expect(report.entries.map(e=>e.samples[0].currentTime)).toEqual(Array(7).fill(0));
  expect(report.entries.flatMap(e=>e.samples).every(s=>s.groups<=1&&s.labels<=3)).toBe(true);
  expect(report.entries.slice(0,-1).every(e=>['AbortError','finished'].includes(e.outcome))).toBe(true);
  // Native clicks can be slow enough for an older animation to finish before
  // its next trigger. Still require actual overlapping lifetimes and aborts.
  expect(report.entries.slice(0,-1).filter(e=>e.outcome==='AbortError').length).toBeGreaterThan(0);
  const last=report.entries.at(-1);
  expect(last.outcome).toBe('finished');
  expect(last.removedAt).toBeGreaterThanOrEqual(last.finishedAt);
  expect(last.removedAt-last.finishedAt).toBeLessThan(3500);
  expect(report.states).toEqual(Array.from({length:7},()=>({connected:false,playState:'idle',pending:false})));
  expect(report.unhandled).toEqual([]);
  expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
 }finally{
  await info.attach('rapid-place-lifecycle',{body:JSON.stringify(await page.evaluate(()=>({...window.rapidLifecycle,states:window.rapidAnimationStates()})),null,2),contentType:'application/json'});
 }
});
test('reduced motion is immediate but still expires and does not retrigger on ordinary renders',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);
 expect(await page.locator('.place-references').evaluate(n=>+getComputedStyle(n).opacity)).toBe(1);
 await page.waitForTimeout(1800);await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await expect(labels(page)).toHaveCount(0,{timeout:2200});
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 await expect(labels(page)).toHaveCount(0,{timeout:4000});
});
test('overlay passes pointer and keyboard operations through, preserves route, radar, marks, undo and persistence',async({page,isMobile,browserName})=>{
 // Allow the complete sequence of native actions on software-rendered WebKit.
 // Individual assertions retain their existing timeouts.
 if(browserName==='webkit')test.setTimeout(60_000);
 await open(page);const before=await saved(page);
 if(isMobile)await page.locator('#showPlaces').tap();else await page.locator('#showPlaces').click();
 expect(await saved(page)).toEqual(before);await expect(page.locator('#showPlaces')).not.toHaveAttribute('aria-pressed',/./);
 // Kiste's plaque covers D3; the tap still reaches its actual hex.
 if(isMobile)await cell(page,'D3').tap();else await cell(page,'D3').click();
 expect((await saved(page)).marks).toEqual({'1:D3':'maybe'});
 await page.locator('#undo').click();expect((await saved(page)).marks).toEqual({});
 await page.locator('#routeTool').click();await cell(page,'B5').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.route-stroke')).toHaveCount(1);await expect(page.locator('.route-direction')).toHaveCount(1);
 await page.locator('#toggleRouteNumbers').click();await expect(page.locator('.route-numbers')).toHaveCount(1);
 await page.locator('#toggleDistances').click();await cell(page,'B2').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.distance-value')).toHaveCount(25);await expect(page.locator('[data-distance-cell="C2"]')).toHaveText('0');
 await page.locator('#showPlaces').click();
 await expect(page.locator('.route-stroke')).toHaveCount(1);await expect(page.locator('.route-direction')).toHaveCount(1);
 const geometry=await page.locator('.place-references').evaluate(n=>({events:getComputedStyle(n).pointerEvents,last:n===n.parentNode.lastElementChild,focusable:n.querySelectorAll('[tabindex],a,button').length}));
 expect(geometry).toEqual({events:'none',last:true,focusable:0});
 await page.locator('#routeBack').click();
 await expect.poll(()=>saved(page)).toMatchObject({route:['A5'],distanceOrigin:'B2',marks:{}});
 await expect(page.locator('.route-stroke')).toHaveCount(0);
 await page.locator('#undo').click();
 await expect.poll(()=>saved(page)).toMatchObject({route:['A5','B5'],distanceOrigin:'B2',marks:{}});
 await expect(page.locator('.route-stroke')).toHaveCount(1);
 const state=await saved(page);expect(state.route).toEqual(['A5','B5']);expect(state.distanceOrigin).toBe('B2');expect(state.marks).toEqual({});
 expect(Object.keys(state).some(k=>/place|overlay|reference/i.test(k))).toBe(false);
});
test('land receives the same mouse hover contour but remains blocked except for radar origins',async({page,isMobile})=>{
 test.skip(isMobile,'Mouse hover is deliberately absent on touch devices.');
 await open(page);await cell(page,'A1').hover();
 const water=await cell(page,'A1').locator('polygon').evaluate(n=>({stroke:getComputedStyle(n).stroke,width:getComputedStyle(n).strokeWidth}));
 await cell(page,'B2').hover();expect(await cell(page,'B2').locator('polygon').evaluate(n=>({stroke:getComputedStyle(n).stroke,width:getComputedStyle(n).strokeWidth}))).toEqual(water);
 expect(water.width).toBe('3px');
 await cell(page,'B2').click();await cell(page,'B2').focus();await page.keyboard.press('Space');expect((await saved(page)).marks).toEqual({});
 await page.locator('#routeTool').click();await cell(page,'B2').click();expect((await saved(page)).route).toEqual(['A5']);
 await page.locator('#toggleDistances').click();await cell(page,'B2').click();await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','B2');
});
test('puzzle selection cancels old labels and starts the new initial clue, including saved state',async({page})=>{
 const first=fixture(),other=structuredClone(first),manifest=read('puzzles/manifest.json');
 other.puzzle.id='other-demo';other.puzzle.presentation.title='Andere Karte';
 other.identity.instanceId='inst-other-demo';other.identity.variantId='var-other-demo';
 other.puzzle.presentation.cluePlaceRefs.I=['o4'];
 manifest.puzzles.push({id:'other-demo',title:'Andere Karte',path:'other-demo.json',kind:'test'});
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));
 await page.route('**/puzzles/other-demo.json',r=>r.fulfill({json:other}));
 await open(page,first);await page.locator('#showPlaces').click();
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(n=>n.closest('details').open=true);
 await page.locator('#puzzleSelect').selectOption('other-demo');
 await expect(page.locator('h1')).toHaveText('Andere Karte');await expect(names(page)).toHaveText(['Kiste']);
 await page.reload();await expect(names(page)).toHaveText(['Kiste']);
});
test('touch swipe replaces the displayed hint references without marking or checking a clue',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch navigation is checked on the mobile project.');
 await open(page);
 await page.locator('#clueViewport').dispatchEvent('touchstart',{touches:[{identifier:0,clientX:180,clientY:100}]});
 await page.locator('#clueViewport').dispatchEvent('touchend',{changedTouches:[{identifier:0,clientX:80,clientY:102}]});
 await expect(page.locator('#cluePosition')).toHaveText('Ort / III');await expect(names(page)).toHaveText(['Kiste']);
 expect((await saved(page)).doneClues).toEqual([]);expect((await saved(page)).marks).toEqual({});
});
