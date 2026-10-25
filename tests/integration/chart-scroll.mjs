import {test,expect} from '@playwright/test';
import {dragTouch} from './touch-gesture.mjs';
import {selectionUse} from './webkit-startup.mjs';

const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
async function center(page,id){
 await cell(page,id).scrollIntoViewIfNeeded();
 const b=await cell(page,id).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};
}
async function horizontalCenters(page,ids){
 // Adjacent cells on one row are visible after the first scroll. Measure both
 // in one layout snapshot: separate scroll/boundingBox calls can incur
 // extra Linux-WebKit compositor waits at DPR 2. The density guards
 // retain the project density, visible art and both actual hit targets.
 await cell(page,ids[0]).scrollIntoViewIfNeeded();
 const snapshot=await page.evaluate(ids=>({ratio:devicePixelRatio,art:document.getElementById('showChart').checked,points:ids.map(id=>{
  const box=document.querySelector(`#map [data-id="${id}"]`).getBoundingClientRect();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  return {x,y,hit:document.elementFromPoint(x,y)?.closest('[data-id]')?.dataset.id};
 })}),ids);
 expect(snapshot.ratio,'gesture retains configured pixel density').toBe(test.info().project.use.deviceScaleFactor??1);
 expect(snapshot.art,'gesture retains visible chart artwork').toBe(true);
 for(let i=0;i<ids.length;i++)expect(snapshot.points[i].hit,'horizontal gesture hits '+ids[i]).toBe(ids[i]);
 return snapshot.points.map(({x,y})=>({x,y}));
}
const top=page=>page.evaluate(async()=>{
 const target=innerWidth<=880?document.getElementById('gameSurface'):window;
 target.scrollTo({top:0,behavior:'instant'});
 // Flush the programmatic reset before hit testing or observing the next gesture.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
});
const scroll=page=>page.evaluate(()=>innerWidth<=880?document.getElementById('gameSurface').scrollTop:scrollY);
async function verticalSwipe(page,browserName,point,info,id){
 const hit=await page.evaluate(point=>document.elementFromPoint(point.x,point.y)?.closest('[data-id]')?.dataset.id,point);
 expect(hit,'gesture starts on the intended cell').toBe(id);
 if(browserName==='webkit'){
  // DOM pointer events cannot focus an element or perform a native swipe.
  // Give the native keyboard probe an explicit, verified focus owner.
  await cell(page,id).focus();await expect(cell(page,id)).toBeFocused();
 }
 const before=await page.evaluate(()=>{
  const element=innerWidth<=880?document.getElementById('gameSurface'):document.scrollingElement;
  const target=innerWidth<=880?element:document;
  const probe=window.__chartScrollProbe={before:element.scrollTop,max:element.scrollHeight-element.clientHeight,ended:false};
  target.addEventListener('scrollend',()=>{probe.after=element.scrollTop;probe.ended=true;},{once:true});
  return {top:probe.before,remaining:probe.max-probe.before};
 });
 expect(before.remaining,'available scroll travel before input').toBeGreaterThan(20);
 if(browserName==='chromium'){
  const session=await page.context().newCDPSession(page);
  try{
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   for(let i=1;i<=8;i++){
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-i*12}]});
    await page.evaluate(()=>new Promise(requestAnimationFrame));
   }
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{await session.detach();}
 }else{
  // Playwright WebKit exposes native taps, but no native touch-drag API.
  // Prove event/default-action boundaries separately from native keyboard
  // scrolling (mobile WebKit also has no wheel API). Never label these DOM
  // events or PageDown as a native iOS finger swipe.
  info.annotations.push({type:'touch-driver',description:'WebKit: DOM pointer boundary plus native PageDown scrolling; physical iOS swipe remains a device check.'});
  const allowed=await page.evaluate(point=>{
   const target=document.elementFromPoint(point.x,point.y);
   const send=(type,y,buttons)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true,pointerId:501,button:0,buttons,clientX:point.x,clientY:y}));
   const down=send('pointerdown',point.y,1),move=send('pointermove',point.y-96,1);send('pointerup',point.y-96,0);
   return down&&move;
  },point);
  expect(allowed).toBe(true);
  // Keep the native key down until WebKit has applied its default action.
  // A down/up pair within one compositor frame is not a physical key press.
  await page.keyboard.down('PageDown');
  try{await expect.poll(()=>scroll(page)).toBeGreaterThan(before.top+20);}
  finally{await page.keyboard.up('PageDown');}
 }
 // The contract is useful native movement, not completion of WebKit's
 // compositor animation. Each scenario is independent. Capture the proof
 // before cancelling residual inertia so subsequent book/tap checks cannot
 // race an animation started by the test driver.
 await expect.poll(()=>scroll(page)).toBeGreaterThan(before.top+20);
 const probe=await page.evaluate(()=>{
  const element=innerWidth<=880?document.getElementById('gameSurface'):document.scrollingElement;
  const probe=window.__chartScrollProbe;probe.observed=element.scrollTop;
  (innerWidth<=880?element:window).scrollTo({top:probe.observed,behavior:'instant'});
  return {...probe,activeCell:document.activeElement?.dataset.id};
 });
 expect(probe.observed).toBeGreaterThan(before.top+20);
 await info.attach('native-scroll-'+id,{body:JSON.stringify({browserName,id,...probe}),contentType:'application/json'});
}
export function registerChartScrollTests(url){
 for(const width of [390,820,1024])test.describe(`chart touch input ${width}px`,()=>{
  test.use({viewport:{width,height:900},hasTouch:true});
  for(const [id,surface] of [['D3','water'],['B2','land']])test(`vertical scrolling starts on ${surface} without notes`,async({page,browserName},info)=>{
   await page.goto(url);await expect(cell(page,id)).toBeVisible();
   await expect(page.locator('#map')).toHaveCSS('touch-action','pan-y pinch-zoom');
   await top(page);
   const point=await center(page,id),before=await scroll(page),saved=await state(page);
   await verticalSwipe(page,browserName,point,info,id);
   expect(await scroll(page)).toBeGreaterThan(before+20);
   expect(await state(page)).toEqual(saved);
   // The same native scroll container reaches the book, not an inert overlay.
   await page.locator('.bordbook').scrollIntoViewIfNeeded();await expect(page.locator('#clueViewport')).toBeVisible();
  });
  test('vertical scrolling preserves a waiting radar and later native taps select its source',async({page,browserName},info)=>{
   // Radar activation is covered by the full click/keyboard/touch matrix.
   // Start this independent scroll contract in its actual persisted waiting
   // state instead of paying for another full DPR-2 map render first.
   await page.addInitScript(()=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:'maybe',distanceMode:true,distanceOrigin:null})));
   await page.goto(url);await expect(cell(page,'D3')).toBeVisible();
   const radar=page.locator('#toggleDistances');await expect(radar).toHaveAttribute('data-distance-state','waiting');
   await top(page);
   const point=await center(page,'D3'),before=await scroll(page);
   await verticalSwipe(page,browserName,point,info,'D3');expect(await scroll(page)).toBeGreaterThan(before+20);
   await expect(radar).toHaveAttribute('data-distance-state','waiting');await expect(page.locator('.distance-overlay')).toHaveCount(0);
   await cell(page,'B2').tap();await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','B2');
   expect((await state(page)).marks).toEqual({});await radar.tap();await expect(page.locator('.distance-overlay')).toHaveCount(0);
  });
  // Keep the complete input/history sequence in the existing CSS-pixel
  // functional profile. Short positive gesture/undo cases below independently
  // retain the project's native density, including desktop WebKit DPR 2.
  test.describe(()=>{
  test.use(selectionUse);
  test('native tap and horizontal touch drawing preserve one-step undo',async({page,browserName})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   await cell(page,'A1').tap();expect((await state(page)).marks).toEqual({'1:A1':'maybe'});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
   const first=await center(page,'A1'),second=await center(page,'B1');
   await dragTouch(page,{browserName,from:first,to:second,pointer:true});
   expect((await state(page)).marks).toEqual({'1:A1':'maybe','1:B1':'maybe'});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
  });
  });
  test('cancelled, uncaptured and diagonal touches never make accidental notes',async({page})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   for(const end of ['pointercancel','lostpointercapture','second-finger','view-switch']){
    const point=await center(page,'A1');
    await page.evaluate(({point,end})=>{
     const map=document.getElementById('map'),target=document.elementFromPoint(point.x,point.y);
     const send=(node,type,options={})=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true,pointerId:701,button:0,buttons:1,clientX:point.x,clientY:point.y,...options}));
     send(target,'pointerdown');
     if(end==='second-finger')send(target,'pointerdown',{pointerId:702,isPrimary:false});
     else if(end==='view-switch'){document.getElementById('logbookTab').click();document.getElementById('chartTab').click();}
     else if(end==='lostpointercapture')send(map,end);
     else send(target,end);
     send(map,'pointermove',{clientX:point.x+80});send(map,'pointerup',{buttons:0});
    },{point,end});
    expect((await state(page)).marks).toEqual({});
   }
   // A near-vertical diagonal belongs to scrolling, even if it ends as a tap.
   const point=await center(page,'C1');
   await page.evaluate(point=>{
    const target=document.elementFromPoint(point.x,point.y);
    for(const [type,x,y] of [['pointerdown',0,0],['pointermove',14,-20],['pointerup',14,-20]])target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true,pointerId:801,button:0,buttons:type==='pointerup'?0:1,clientX:point.x+x,clientY:point.y+y}));
   },point);
   expect((await state(page)).marks).toEqual({});
   await cell(page,'A1').tap();expect((await state(page)).marks).toEqual({'1:A1':'maybe'});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
  });
  test.describe(()=>{
  test.use(selectionUse);
  test('touch erasing is one undoable gesture',async({page,browserName})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   await cell(page,'A1').tap();await cell(page,'B1').tap();
   await page.locator('[data-tool="erase"]').tap();
   const from=await center(page,'A1'),to=await center(page,'B1');
   await dragTouch(page,{browserName,from,to,pointer:true});expect((await state(page)).marks).toEqual({});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({'1:A1':'maybe','1:B1':'maybe'});
  });
  });
  for(const erase of [false,true])test(`single touch ${erase?'erasure':'drawing'} and native undo retain project pixel density`,async({page,browserName})=>{
   const marked={'1:A1':'maybe','1:B1':'maybe'};
   if(erase)await page.addInitScript(marks=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:'erase',marks})),marked);
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   expect((await state(page)).marks).toEqual(erase?marked:{});
   const [from,to]=await horizontalCenters(page,['A1','B1']);
   await dragTouch(page,{browserName,from,to,pointer:true});
   expect((await state(page)).marks).toEqual(erase?{}:marked);
   await page.locator('#undo').click();
   expect((await state(page)).marks).toEqual(erase?marked:{});
  });
 });
}
