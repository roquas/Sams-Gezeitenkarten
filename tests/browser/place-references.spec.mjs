import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';
import {observePlaceReferenceCompletion} from '../helpers/place-reference-completion.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const demo=read('puzzles/model-demo.json');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const labels=page=>page.locator('#map .place-label');
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
 await page.goto('/?puzzle=model-demo');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
test('initial clue shows exactly its explicit places on first start and saved-game reload',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.reload();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 expect((await saved(page)).marks).toEqual({'1:A1':'maybe'});
 await expect(cell(page,'A1')).toContainText('?');
});
test('navigation replaces references, checkboxes do not retrigger, and a clue without references clears immediately',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
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
 await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste','Start']);
 await expect(page.locator('[data-label-object="o1"]')).toHaveAttribute('data-label-cells','B5');
 await expect(page.locator('[data-label-object="o2"]')).toHaveAttribute('data-label-cells','B2 C2');
 await expect(page.locator('[data-label-object="o4"]')).toHaveAttribute('data-label-cells','D3');
 await expect(page.locator('[data-placement-id="flavor"]')).toHaveCount(1);
 await expect(page.locator('[data-label-object="o3"]')).toHaveCount(0);
 const positions=await labels(page).evaluateAll(ns=>ns.map(n=>({id:n.dataset.labelObject,x:n.transform.baseVal.getItem(0).matrix.e,y:n.transform.baseVal.getItem(0).matrix.f})));
 expect(positions.map(p=>({...p,x:Math.round(p.x*100)/100}))).toEqual([{id:'o1',x:178.74,y:328},{id:'o2',x:224,y:124},{id:'o4',x:306,y:192},{id:undefined,x:60,y:328}]);
 await page.waitForTimeout(500);
 const path=info.outputPath('place-references-'+(isMobile?'mobile':'desktop')+'.png');
 await page.locator('.mapbox').screenshot({path,scale:'css'});
 await page.locator('#mapActions').screenshot({path:info.outputPath('place-actions-'+(isMobile?'mobile':'desktop')+'.png'),scale:'css'});await info.attach('multiple places including multihex',{path,contentType:'image/png'});
});
test('independent paper and ink phases share a clock and finish at 4.9 seconds',async({page})=>{
 await open(page);await page.locator('#showPlaces').click();
 const phases=await page.locator('.place-references').evaluate(layer=>{
  const animations=layer.getAnimations({subtree:true}),starts=animations.map(a=>a.startTime);
  const phases=[0,200,400,900,1900,2900,3900,4899].map(time=>{
   animations.forEach(a=>{a.pause();a.currentTime=time;});
   return {time,paper:+getComputedStyle(layer.querySelector('.label-paper')).opacity,ink:+getComputedStyle(layer.querySelector('.label-ink')).opacity};
  });
  return {starts,durations:animations.map(a=>a.effect.getTiming().duration),phases};
 });
 expect(phases.starts).toHaveLength(8);expect(phases.starts.every(t=>Number.isFinite(t))).toBe(true);
 expect(new Set(phases.starts).size).toBe(1);expect(phases.durations).toEqual(Array(8).fill(4900));
 for(const p of phases.phases){
  if(p.time===0){expect(p.paper).toBe(0);expect(p.ink).toBe(0);}
  if(p.time===200){expect(p.paper).toBeGreaterThan(0);expect(p.paper).toBeLessThan(1);expect(p.ink).toBeCloseTo(p.paper);}
  if(p.time===400||p.time===900){expect(p.paper).toBe(1);expect(p.ink).toBe(1);}
  if(p.time===1900){expect(p.paper).toBeGreaterThan(0);expect(p.paper).toBeLessThan(1);expect(p.ink).toBe(1);}
  if(p.time>=2900)expect(p.paper).toBe(0);
  if(p.time===2900)expect(p.ink).toBe(1);
  if(p.time===3900){expect(p.ink).toBeGreaterThan(0);expect(p.ink).toBeLessThan(1);}
 }
 await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>{a.finish();}));
 await expect(labels(page)).toHaveCount(0);expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
});
test('natural 4.9-second tracks finish and their delivered completion removes the overlay',async({page},info)=>{
 await open(page);
 // CI #477/#479 delivered native completion up to 1101 ms after the nominal
 // end. Allow 3000 ms delivery headroom, not a longer animation. After the
 // last finished callback, cleanup has its own, much shorter 1000 ms limit.
 const deliveryTimeout=4900+3000,cleanupTimeout=1000;
 const timing=await page.evaluate(observePlaceReferenceCompletion,{deliveryTimeout,cleanupTimeout});
 await info.attach('natural-animation-timing',{body:JSON.stringify(timing,null,2),contentType:'application/json'});
 expect(timing.reason,JSON.stringify(timing)).toBe('complete');
 expect(timing.elapsed,JSON.stringify(timing)).toBeLessThanOrEqual(deliveryTimeout);
 expect(timing.tracks).toHaveLength(8);
 const starts=timing.tracks.map(t=>t.created.start);
 expect(starts.every(t=>Number.isFinite(t))).toBe(true);expect(new Set(starts).size).toBe(1);
 for(const track of timing.tracks){
  expect(track).toMatchObject({duration:4900,delay:0,endDelay:0,iterations:1,endTime:4900,playbackRate:1,
   created:{start:starts[0],current:0,state:'running'},ready:{start:starts[0]},
   finished:{start:starts[0],current:4900,state:'finished'}});
  expect(track.rejected).toBeUndefined();expect(track.readyRejected).toBeUndefined();
 }
 expect(timing.removed.timeline-starts[0]).toBeGreaterThanOrEqual(4900);
 expect(timing.cleanupAfterLastTrack,JSON.stringify(timing)).toBeLessThanOrEqual(cleanupTimeout);
 expect(timing).toMatchObject({overlayConnected:false,overlays:0,labels:0,svgAnimations:0,connectedTargets:0});
 await expect(labels(page)).toHaveCount(0);await expect(page.locator('.start-label, #map ellipse[data-start-marker]')).toHaveCount(0);
 await expect(page.locator('.start-glow')).toHaveCount(1);
});
test('rapid manual and clue triggers replace one animation and restart its complete lifetime',async({page,browserName},info)=>{
 if(browserName==='webkit')test.setTimeout(60_000);
 await open(page);
 // PR #117 observes native timeline/finished delivery rather than wall-time
 // sleeps. A2b now has two tracks per label, so observe all tracks per group.
 await page.evaluate(()=>{
  const entries=[],refs=[],byNode=new WeakMap(),unhandled=[];
  window.rapidLifecycle={entries,unhandled};
  const rejection=e=>unhandled.push(String(e.reason));
  window.addEventListener('unhandledrejection',rejection);
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const animation=animate.apply(this,args),node=this.closest('.place-references');
   if(!node)return animation;
   let ref=byNode.get(node);
   if(!ref){
    const entry={tracks:[],samples:[]};ref={node,entry,animations:[]};
    entries.push(entry);refs.push(ref);byNode.set(node,ref);
    ref.sample=event=>{
     entry.samples.push({event,wall:performance.now(),currentTimes:ref.animations.map(a=>a.currentTime),
      states:ref.animations.map(a=>a.playState),connected:node.isConnected,
      groups:document.querySelectorAll('#map .place-references').length,labels:document.querySelectorAll('#map .place-label').length});
     if(!node.isConnected)clearInterval(ref.timer);
    };
    ref.timer=setInterval(()=>ref.sample('interval'),100);
   }
   ref.animations.push(animation);
   const track={duration:animation.effect.getComputedTiming().duration,createdCurrent:animation.currentTime};
   ref.entry.tracks.push(track);ref.sample('created');
   animation.finished.then(()=>{
    track.outcome='finished';
    if(ref.entry.tracks.every(t=>t.outcome==='finished'))ref.entry.finishedAt=performance.now();
    ref.sample('finished');
   },error=>{track.outcome=error.name;ref.sample('rejected');});
   return animation;
  };
  const observer=new MutationObserver(()=>refs.forEach(({node,entry})=>{
   if(!node.isConnected&&entry.removedAt===undefined)entry.removedAt=performance.now();
  }));
  observer.observe(document.querySelector('#map'),{childList:true});
  window.rapidAnimationStates=()=>refs.flatMap(({node,animations})=>animations.map(animation=>({connected:node.isConnected,playState:animation.playState,pending:animation.pending})));
  window.disposeRapidProbe=()=>{
   observer.disconnect();refs.forEach(ref=>clearInterval(ref.timer));
   Element.prototype.animate=animate;window.removeEventListener('unhandledrejection',rejection);
  };
 });
 try{
  await page.locator('#showPlaces').click();
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries[0]?.samples.some(s=>
   s.connected&&s.states.every(v=>v==='running')&&s.currentTimes.every(t=>t>=2200)))).toBe(true);
  for(let i=0;i<4;i++){await page.locator('#nextClue').click();await page.locator('#showPlaces').click();}
  await expect(page.locator('.place-references')).toHaveCount(1);
  await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste','Start']);
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries.at(-1)?.samples.some(s=>
   s.connected&&s.currentTimes.every(t=>t>=3400)&&s.groups===1&&s.labels===4))).toBe(true);
  // Preserve PR #117's 3.5s cleanup deadline, starting at native end observation.
  await expect.poll(()=>page.evaluate(()=>window.rapidLifecycle.entries.at(-1)?.samples.some(s=>
   s.states.every(v=>v==='finished')))).toBe(true);
  await expect(labels(page)).toHaveCount(0,{timeout:3500});
  await expect(page.locator('.place-references')).toHaveCount(0);
  const report=await page.evaluate(()=>({...window.rapidLifecycle,states:window.rapidAnimationStates()}));
  expect(report.entries).toHaveLength(7);
  // Returning to clue I includes Start beside the multihex place's name.
  expect(report.entries.map(e=>e.tracks.length)).toEqual([8,2,8,8,8,6,8]);
  const tracks=report.entries.flatMap(e=>e.tracks);
  expect(tracks.map(t=>t.duration)).toEqual(Array(48).fill(4900));
  expect(tracks.map(t=>t.createdCurrent)).toEqual(Array(48).fill(0));
  expect(report.entries.flatMap(e=>e.samples).every(s=>s.groups<=1&&s.labels<=4)).toBe(true);
  expect(tracks.every(t=>['AbortError','finished'].includes(t.outcome))).toBe(true);
  expect(tracks.filter(t=>t.outcome==='AbortError').length).toBeGreaterThan(0);
  const last=report.entries.at(-1);
  expect(last.tracks.every(t=>t.outcome==='finished')).toBe(true);
  expect(last.removedAt).toBeGreaterThanOrEqual(last.finishedAt);
  expect(last.removedAt-last.finishedAt).toBeLessThan(3500);
  const endObservedAt=last.samples.find(s=>s.states.every(v=>v==='finished')).wall;
  expect(last.removedAt).toBeGreaterThanOrEqual(endObservedAt);
  expect(last.removedAt-endObservedAt).toBeLessThan(3500);
  expect(report.states.every(s=>!s.connected&&!s.pending&&['idle','finished'].includes(s.playState))).toBe(true);
  expect(report.unhandled).toEqual([]);
  expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
 }finally{
  await info.attach('rapid-place-lifecycle',{body:JSON.stringify(await page.evaluate(()=>({...window.rapidLifecycle,states:window.rapidAnimationStates()})),null,2),contentType:'application/json'});
  await page.evaluate(()=>window.disposeRapidProbe());
 }
});
test('reduced motion is immediate but still expires and does not retrigger on ordinary renders',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);
 expect(await page.locator('.label-paper').first().evaluate(n=>+getComputedStyle(n).opacity)).toBe(1);
 await page.waitForTimeout(1800);await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await expect(labels(page)).toHaveCount(0,{timeout:2200});
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste','Start']);
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
 await expect(page.locator('h1')).toHaveText('Andere Karte');await expect(names(page)).toHaveText(['Kiste','Start']);
 await page.reload();await expect(names(page)).toHaveText(['Kiste','Start']);
});
test('touch swipe replaces the displayed hint references without marking or checking a clue',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch navigation is checked on the mobile project.');
 await open(page);
 await page.locator('#clueViewport').dispatchEvent('touchstart',{touches:[{identifier:0,clientX:180,clientY:100}]});
 await page.locator('#clueViewport').dispatchEvent('touchend',{changedTouches:[{identifier:0,clientX:80,clientY:102}]});
 await expect(page.locator('#cluePosition')).toHaveText('Ort / III');await expect(names(page)).toHaveText(['Kiste']);
 expect((await saved(page)).doneClues).toEqual([]);expect((await saved(page)).marks).toEqual({});
});

test('start inner glow is unique, clipped to illustrated start hex, and below route and interaction ink',async({page,isMobile})=>{
 const dto=structuredClone(demo);dto.puzzle.logic.start='D3';
 for(const clue of dto.puzzle.logic.clues){
  clue.direction='W';dto.puzzle.presentation.clueTexts[clue.id]=`In Stunde ${clue.hour} fuhren wir nach Westen.`;
 }
 dto.puzzle.presentation.hints=['Die erste Etappe führt von D3 nach C3.'];
 await open(page,dto);await page.locator('#nextClue').click();await expect(page.locator('.start-label')).toHaveCount(0);
 await expect(page.locator('#map ellipse[data-start-marker], [data-static-chart] .place-label')).toHaveCount(0);
 await expect(page.locator('.start-glow')).toHaveCount(1);
 const glow=await page.locator('.start-glow').evaluate(n=>{
  const svg=n.ownerSVGElement,polygon=n.querySelector(':scope > g > polygon'),clip=n.querySelector('clipPath polygon');
  return {cell:n.dataset.startCell,events:getComputedStyle(n).pointerEvents,points:polygon.getAttribute('points'),clip:clip.getAttribute('points'),
   interactive:svg.querySelector('.cell[data-id="D3"] polygon').getAttribute('points'),color:polygon.getAttribute('stroke'),
   below:['.route-ink','.hex-surfaces','.cell-information'].every(s=>!!(n.compareDocumentPosition(svg.querySelector(s))&Node.DOCUMENT_POSITION_FOLLOWING))};
 });
 expect(glow).toMatchObject({cell:'D3',events:'none',color:'#694934',below:true});expect(glow.points).toBe(glow.clip);expect(glow.points).toBe(glow.interactive);
 await expect(page.locator('image[data-placement-id="beacon"]')).toHaveCount(1);
 await page.locator('#routeTool').click();await cell(page,'C3').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.route-stroke,.route-direction')).toHaveCount(2);await expect(cell(page,'D3').locator('.edge-ink')).toHaveCount(1);
 if(!isMobile){await cell(page,'D3').hover();expect(await cell(page,'D3').locator('polygon').evaluate(n=>getComputedStyle(n).strokeWidth)).toBe('3px');}
});
test('square accessible X action fits all existing responsive action rows',async({page})=>{
 await open(page);const button=page.getByRole('button',{name:'Orte zeigen',exact:true});
 await expect(button).toHaveAttribute('title','Orte zeigen');await expect(button).not.toHaveAttribute('aria-pressed',/./);await expect(button).toHaveText('');
 for(const width of [320,390,600,900,1440]){
  await page.setViewportSize({width,height:1000});
  await expect.poll(()=>button.evaluate(n=>Math.abs(n.clientWidth-n.clientHeight))).toBe(0);
  const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);
  const style=await button.evaluate(n=>({clip:getComputedStyle(n,'::after').clipPath,bezel:getComputedStyle(n,'::before').borderImageSource}));
  expect(style.clip).toContain('polygon');expect(style.bezel).toContain('brass-bezel.webp');
  const count=await page.locator('#mapActions button').evaluateAll(ns=>new Set(ns.map(n=>Math.round(n.getBoundingClientRect().top+n.getBoundingClientRect().height/2))).size);
  expect(count).toBe((await page.locator('.map-panel').boundingBox()).width<=560?2:1);
 }
});
test('redraws preserve animation identity and long names fit organic paper in all three visual phases',async({page,isMobile},info)=>{
 const dto=fixture();dto.puzzle.presentation.objectNames.o1='Roberts verborgene Zuflucht hinter den flüsternden Klippen der vergessenen Gezeiten';
 await open(page,dto);await page.locator('#showPlaces').click();
 const before=await page.locator('.place-references').evaluate(n=>{window.activePlaces=n;window.activeTracks=n.getAnimations({subtree:true});return window.activeTracks.map(a=>a.startTime);});
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.evaluate(()=>{
  const art=document.getElementById('showChart'),frame=document.getElementById('frameStyle');
  for(const value of [false,true]){art.checked=value;art.dispatchEvent(new Event('change'));}
  for(const value of ['quiet','final']){frame.value=value;frame.dispatchEvent(new Event('change'));}
 });
 expect(await page.locator('.place-references').evaluate(n=>n===window.activePlaces&&n.getAnimations({subtree:true}).every(a=>window.activeTracks.includes(a)))).toBe(true);
 expect(await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).map(a=>a.startTime))).toEqual(before);
 const long=page.locator('[data-label-object="o1"]');
 const fitting=await long.evaluate(n=>{
  const text=n.querySelector('text');
  return {measured:text.getComputedTextLength(),available:Number(n.dataset.labelWidth)-16,fontSize:+text.getAttribute('font-size'),computedFont:getComputedStyle(text).fontSize,scale:text.getScreenCTM().a};
 });
 await info.attach('long-name-fitting',{body:JSON.stringify(fitting,null,2),contentType:'application/json'});
 // Linux/Chromium font quantization can leave 0.14 SVG units of residual
 // width after fitting. Half a unit is <0.35 CSS px in the mobile profile
 // and still preserves at least 15.5 units of the 16-unit text padding.
 expect(fitting.measured,JSON.stringify(fitting)).toBeLessThanOrEqual(fitting.available+.5);
 expect(await long.locator('text').evaluate(n=>+n.getAttribute('font-size'))).toBeLessThan(18);
 expect(await long.locator('.label-paper>path').first().getAttribute('d')).toContain(' Q ');
 // Use a representative atmospheric name for the phase comparison images.
 dto.puzzle.presentation.objectNames={o2:'Die Bucht der flüsternden Gezeiten',o4:'Kiste'};
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await page.locator('#showPlaces').click();await page.evaluate(()=>document.activeElement?.blur());
 await page.mouse.move(0,0);
 for(const [phase,time] of [['paper',650],['ink',3000],['normal',4900]]){
  await page.locator('.place-references').evaluate((n,time)=>n.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time;if(time===4900)a.finish();}),time);
  if(time===4900)await expect(labels(page)).toHaveCount(0);
  const path=info.outputPath(`polish-${isMobile?'mobile':'desktop'}-${phase}.png`);
  await page.locator('.mapbox').screenshot({path,scale:'css',animations:'allow'});
  await info.attach(phase,{path,contentType:'image/png'});
 }
 const path=info.outputPath(`polish-${isMobile?'mobile':'desktop'}-actions.png`);
 await page.locator('#mapActions').screenshot({path,scale:'css'});await info.attach('actions',{path,contentType:'image/png'});
});

for(const multihex of [false,true])test(`named ${multihex?'multihex':'single-hex'} start has one Start plaque across initial, manual, clue and puzzle changes`,async({page},info)=>{
 const dto=fixture(),p=dto.puzzle;
 p.logic.map.objects.find(o=>o.id==='o1').cells=multihex?['A5','B5']:['A5'];
 p.presentation.objectNames.o1='Startwrack';
 p.presentation.intro=['Das Startwrack liegt bei A5.'];
 p.presentation.clueTexts.I='Vom Startwrack fuhren wir ostwärts; Zwilling lag fern.';
 p.presentation.cluePlaceRefs.II=['o1'];
 const expected=multihex?['Startwrack','Zwilling','Start']:['Zwilling','Start'];
 async function checkStart(){
  await expect(page.locator('.start-label')).toHaveCount(1);
  await expect(page.locator('.start-label text')).toHaveText('Start');
  await expect(page.locator('[data-label-cell="A5"]')).toHaveCount(1);
  await expect(page.locator('[data-label-object="o1"]')).toHaveCount(multihex?1:0);
  if(multihex)await expect(page.locator('[data-label-object="o1"]')).toHaveAttribute('data-label-cells','B5');
  if(multihex){
   const overlap=await page.locator('.place-references').evaluate(layer=>{
    const box=n=>{const t=n.transform.baseVal.getItem(0).matrix;return {x:t.e,y:t.f,w:+n.dataset.labelWidth,h:28};};
    const a=box(layer.querySelector('.start-label')),b=box(layer.querySelector('[data-label-object="o1"]'));
    return Math.abs(a.x-b.x)<(a.w+b.w)/2+5.9&&Math.abs(a.y-b.y)<(a.h+b.h)/2+5.9;
   });
   expect(overlap).toBe(false);
  }
 }
 await open(page,dto);await expect(names(page)).toHaveText(expected);await checkStart();
 await expect(page.locator('#puzzleStory')).toContainText('Startwrack');
 await expect(page.locator('#clueViewport')).toContainText('Startwrack');
 await page.reload();await expect(names(page)).toHaveText(expected);await checkStart();
 await page.locator('#showPlaces').click();
 await expect(names(page)).toHaveText(multihex?['Startwrack','Zwilling','Kiste','Start']:['Zwilling','Kiste','Start']);await checkStart();
 await expect(page.locator('[data-label-object="o2"]')).toHaveAttribute('data-label-cells','B2 C2');
 await expect(page.locator('[data-label-object="o4"]')).toHaveAttribute('data-label-cells','D3');
 await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=650;}));
 await info.attach('named-start-'+(multihex?'multihex':'single-hex'),{body:await page.locator('.mapbox').screenshot({animations:'allow',scale:'css'}),contentType:'image/png'});
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Kiste']);
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(multihex?['Startwrack','Start']:['Start']);await checkStart();
 await page.locator('#nextClue').click();await expect(labels(page)).toHaveCount(0);
 // Switch to the public puzzle and back; old references must not survive.
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(n=>n.closest('details').open=true);
 await page.locator('#puzzleSelect').selectOption('drei-peilungen');
 await expect(page.locator('h1')).toHaveText('Die drei Peilungen');
 await page.locator('#puzzleSelect').selectOption('model-demo');
 await expect(names(page)).toHaveText(expected);await checkStart();
});
test('a multihex place surrounding the start keeps its name anchored outside the start hex',async({page})=>{
 const dto=fixture();dto.puzzle.logic.start='B3';
 dto.puzzle.logic.clues.find(c=>c.id==='Ort').distance=2;
 dto.puzzle.presentation.clueTexts.Ort='Bei der Abfahrt waren wir zwei Hexfelder von Kiste entfernt.';
 dto.puzzle.logic.map.objects.find(o=>o.id==='o1').cells=['A3','B3','C3'];
 await open(page,dto);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 const geometry=await page.locator('[data-label-object="o1"]').evaluate(n=>({
  cells:n.dataset.labelCells,x:n.transform.baseVal.getItem(0).matrix.e,y:n.transform.baseVal.getItem(0).matrix.f
 }));
 expect(geometry).toEqual({cells:'A3 C3',x:60,y:158});
 await expect(page.locator('[data-label-cell="B3"] text')).toHaveText('Start');
});
