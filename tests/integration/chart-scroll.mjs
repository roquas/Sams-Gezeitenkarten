import {test,expect} from '@playwright/test';
import {dragTouch} from './touch-gesture.mjs';

const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-reference-3.6-schema1-data1')));
async function center(page,id){
 await cell(page,id).scrollIntoViewIfNeeded();
 const b=await cell(page,id).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};
}
const top=page=>page.evaluate(()=>{if(innerWidth<=880)document.getElementById('gameSurface').scrollTop=0;else scrollTo(0,0);});
const scroll=page=>page.evaluate(()=>innerWidth<=880?document.getElementById('gameSurface').scrollTop:scrollY);
async function verticalSwipe(page,browserName,point,info){
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
  await page.evaluate(point=>document.elementFromPoint(point.x,point.y)?.closest('[data-id]')?.focus({preventScroll:true}),point);
  await page.keyboard.press('PageDown');
 }
}
export function registerChartScrollTests(url){
 for(const width of [390,820,1024])test.describe(`chart touch input ${width}px`,()=>{
  test.use({viewport:{width,height:900},hasTouch:true});
  test('vertical scrolling starts on water and land without notes or a radar source',async({page,browserName},info)=>{
   await page.goto(url);await expect(cell(page,'D3')).toBeVisible();
   await expect(page.locator('#map')).toHaveCSS('touch-action','pan-y pinch-zoom');
   for(const id of ['D3','B3']){
    await top(page);
    const point=await center(page,id),before=await scroll(page),saved=await state(page);
    await verticalSwipe(page,browserName,point,info);
    await expect.poll(()=>scroll(page)).toBeGreaterThan(before+20);
    expect(await state(page)).toEqual(saved);
   }
   const radar=page.locator('#toggleDistances');await radar.tap();
   await top(page);
   const point=await center(page,'D3'),before=await scroll(page);
   await verticalSwipe(page,browserName,point,info);await expect.poll(()=>scroll(page)).toBeGreaterThan(before+20);
   await expect(radar).toHaveAttribute('data-distance-state','waiting');await expect(page.locator('.distance-overlay')).toHaveCount(0);
   await cell(page,'B3').tap();await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','B3');
   expect((await state(page)).marks).toEqual({});await radar.tap();await expect(page.locator('.distance-overlay')).toHaveCount(0);
   // The same native scroll container reaches the book, not an inert overlay.
   await page.locator('.bordbook').scrollIntoViewIfNeeded();await expect(page.locator('#clueViewport')).toBeVisible();
  });
  test('native tap and horizontal touch drawing preserve one-step undo',async({page,browserName})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   await cell(page,'A1').tap();expect((await state(page)).marks).toEqual({'1:A1':'maybe'});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
   const first=await center(page,'A1'),second=await center(page,'B1');
   await dragTouch(page,{browserName,from:first,to:second,pointer:true});
   expect((await state(page)).marks).toEqual({'1:A1':'maybe','1:B1':'maybe'});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
  });
  test('cancelled, uncaptured and diagonal touches never make accidental notes',async({page})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   for(const end of ['pointercancel','lostpointercapture','second-finger']){
    const point=await center(page,'A1');
    await page.evaluate(({point,end})=>{
     const map=document.getElementById('map'),target=document.elementFromPoint(point.x,point.y);
     const send=(node,type,options={})=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true,pointerId:701,button:0,buttons:1,clientX:point.x,clientY:point.y,...options}));
     send(target,'pointerdown');
     if(end==='second-finger')send(target,'pointerdown',{pointerId:702,isPrimary:false});
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
  test('touch erasing is one undoable gesture',async({page,browserName})=>{
   await page.goto(url);await expect(cell(page,'A1')).toBeVisible();
   await cell(page,'A1').tap();await cell(page,'B1').tap();
   await page.locator('[data-tool="erase"]').tap();
   const from=await center(page,'A1'),to=await center(page,'B1');
   await dragTouch(page,{browserName,from,to,pointer:true});expect((await state(page)).marks).toEqual({});
   await page.locator('#undo').click();expect((await state(page)).marks).toEqual({'1:A1':'maybe','1:B1':'maybe'});
  });
 });
}
