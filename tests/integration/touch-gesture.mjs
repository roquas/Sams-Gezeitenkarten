// Playwright exposes native touch dragging through Chromium CDP only. Keep that
// path intact; exercise WebKit's gesture handlers with standard DOM events.
// Actual WebKit touchscreen taps are covered by puzzle selection and ZIP tests.
export async function dragTouch(page,{browserName,from,to,pointer=false}){
 if(browserName==='chromium'){
  const session=await page.context().newCDPSession(page);
  try{
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{await session.detach();}
  return;
 }
 if(!pointer){
  // Playwright's dispatcher constructs WebKit TouchLists with createTouch /
  // createTouchList; WebKit does not support Chromium's new Touch() path.
  const target=await page.evaluateHandle(({x,y})=>document.elementFromPoint(x,y),from);
  const element=target.asElement();
  if(!element){await target.dispose();throw Error('Touch start is outside the rendered page');}
  try{
   for(const [type,point,end] of [['touchstart',from,false],['touchmove',to,false],['touchend',to,true]]){
    const touch={identifier:91,clientX:point.x,clientY:point.y,screenX:point.x,screenY:point.y,radiusX:1,radiusY:1,rotationAngle:0,force:.5};
    await element.dispatchEvent(type,{touches:end?[]:[touch],targetTouches:end?[]:[touch],changedTouches:[touch]});
   }
  }finally{await target.dispose();}
  return;
 }
 await page.evaluate(({from,to})=>{
  const first=document.elementFromPoint(from.x,from.y);
  if(!first)throw Error('Touch start is outside the rendered page');
  const send=(type,point,buttons)=>{
   const target=document.elementFromPoint(point.x,point.y);
   if(!target)throw Error('Touch point is outside the rendered page');
   target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,view:window,pointerType:'touch',pointerId:91,isPrimary:true,button:0,buttons,clientX:point.x,clientY:point.y}));
  };
  send('pointerdown',from,1);send('pointermove',to,1);send('pointerup',to,0);
 },{from,to});
}
