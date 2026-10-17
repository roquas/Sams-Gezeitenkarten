import {test,expect} from '@playwright/test';

const key='gezeitenkarten-reference-3.6-schema1-data1';
const marks=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).marks,key);
async function center(page,id){
 const box=await page.locator(`#map [data-id="${id}"]`).boundingBox();
 return {x:box.x+box.width/2,y:box.y+box.height/2};
}
test.beforeEach(async({page})=>{
 await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
});

for(const button of ['right','middle'])test(`${button} mouse button leaves notes and undo unchanged`,async({page})=>{
 await page.locator('#map [data-id="A1"]').click();
 await page.locator('#map [data-id="B1"]').click({button});
 await page.keyboard.press('Escape');
 expect(await marks(page)).toEqual({'1:A1':'maybe'});
 await page.locator('#undo').click();
 expect(await marks(page)).toEqual({});
});

for(const end of ['pointercancel','lostpointercapture'])test(`${end} ends a marking gesture`,async({page})=>{
 const first=await center(page,'A1'),second=await center(page,'B1');
 await page.evaluate(()=>{
  document.getElementById('map').addEventListener('pointerdown',event=>window.gesturePointer=event.pointerId,{once:true});
 });
 await page.mouse.move(first.x,first.y);
 await page.mouse.down();
 try{
  expect(await marks(page)).toEqual({'1:A1':'maybe'});
  await page.evaluate(end=>{
   const map=document.getElementById('map');
   if(end==='lostpointercapture')map.releasePointerCapture(window.gesturePointer);
   else map.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:window.gesturePointer}));
  },end);
  // No new pointerdown: subsequent movement must not extend the old gesture.
  await page.mouse.move(second.x,second.y,{steps:5});
  expect(await marks(page)).toEqual({'1:A1':'maybe'});
 }finally{await page.mouse.up();}
 await page.locator('#undo').click();
 expect(await marks(page)).toEqual({});
 // A new gesture still works after cancellation and undo.
 await page.locator('#map [data-id="B1"]').click();
 expect(await marks(page)).toEqual({'1:B1':'maybe'});
});
