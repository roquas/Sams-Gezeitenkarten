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
 await page.evaluate(({from,to,pointer})=>{
  const first=document.elementFromPoint(from.x,from.y);
  if(!first)throw Error('Touch start is outside the rendered page');
  if(pointer){
   const send=(type,point,buttons)=>{
    const target=document.elementFromPoint(point.x,point.y);
    if(!target)throw Error('Touch point is outside the rendered page');
    target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,view:window,pointerType:'touch',pointerId:91,isPrimary:true,button:0,buttons,clientX:point.x,clientY:point.y}));
   };
   send('pointerdown',from,1);send('pointermove',to,1);send('pointerup',to,0);
  }else{
   const send=(type,point,end=false)=>{
    const touch=new Touch({identifier:91,target:first,clientX:point.x,clientY:point.y,pageX:point.x+scrollX,pageY:point.y+scrollY,screenX:point.x,screenY:point.y,radiusX:1,radiusY:1,force:.5});
    first.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:end?[]:[touch],targetTouches:end?[]:[touch],changedTouches:[touch]}));
   };
   send('touchstart',from);send('touchmove',to);send('touchend',to,true);
  }
 },{from,to,pointer});
}
