import {test,expect} from '@playwright/test';
const KEY='gezeitenkarten-reference-3.6-schema1-data1';
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const state=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
async function pressHex(page,id,hasTouch,dx=0,dy=0){
 const polygon=cell(page,id).locator('polygon');await polygon.scrollIntoViewIfNeeded();
 const b=await polygon.boundingBox(),x=b.x+b.width*(.5+dx),y=b.y+b.height*(.5+dy);
 // Real browser hit testing, including the transparent interior, not dispatchEvent.
 expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('.cell')?.dataset.id,{x,y})).toBe(id);
 if(hasTouch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function picture(page,info,name){
 await info.attach(name+'-'+info.project.name,{body:await page.locator('#map').screenshot({type:'jpeg',quality:95,scale:'css'}),contentType:'image/jpeg'});
}
test('blocked hex interiors accept notes and erasers without becoming navigable',async({page,hasTouch})=>{
 await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
 for(const id of ['B3','C3','E2']){
  await expect(cell(page,id)).toHaveAttribute('tabindex','0');
  for(const [tool,glyph,dx,dy] of [['maybe','?',0,0],['yes','✓',.35,0],['no','×',0,.35]]){
   await page.locator(`[data-tool="${tool}"]`).click();await pressHex(page,id,hasTouch,dx,dy);
   expect((await state(page)).marks[`1:${id}`]).toBe(tool);await expect(cell(page,id)).toContainText(glyph);
  }
  await page.locator('[data-tool="erase"]').click();await pressHex(page,id,hasTouch,-.35,0);
  expect((await state(page)).marks[`1:${id}`]).toBeUndefined();
  await page.locator('#undo').click();expect((await state(page)).marks[`1:${id}`]).toBe('no');
 }
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 for(const id of ['B3','C3','E2'])expect((await state(page)).marks[`1:${id}`]).toBe('no');
 await page.locator('[data-hour="2"]').click();await page.locator('[data-tool="maybe"]').click();
 await pressHex(page,'B3',hasTouch);await page.locator('[data-tool="clearAll"]').click();await pressHex(page,'B3',hasTouch,0,-.35);
 expect(Object.keys((await state(page)).marks).filter(k=>k.endsWith(':B3'))).toEqual([]);
 await page.locator('#toggleDistances').click();await pressHex(page,'B3',hasTouch);
 await expect(page.locator('#toggleDistances')).toHaveAttribute('data-distance-state','waiting');
 await pressHex(page,'C1',hasTouch);await page.locator('[data-tool="maybe"]').click();
 for(const id of ['B3','A1','A2','D2'])await pressHex(page,id,hasTouch);
 await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');
 for(const id of ['A1','A2','D2'])await expect(page.locator(`[data-distance-cell="${id}"]`)).toHaveText('2');
 await page.locator('[data-tool="route"]').click();await pressHex(page,'C3',hasTouch);
 expect((await state(page)).route).toEqual(['D4']);
 await pressHex(page,'E3',hasTouch);expect((await state(page)).route).toEqual(['D4','E3']);
 await expect(page.locator('.blocked-cell .active-hour-edge')).toHaveCount(0);
 await expect(page.locator('.cell:not(.blocked-cell) .active-hour-edge')).toHaveCount(44);
});
test('blocked hex keyboard access and visible subordinate outlines',async({page},info)=>{
 await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
 // E2 follows D2 in the normal tab order; focus is not injected into the land cell.
 await cell(page,'D2').focus();await page.keyboard.press('Tab');await expect(cell(page,'E2')).toBeFocused();
 await page.keyboard.press('Enter');expect((await state(page)).marks['1:E2']).toBe('maybe');
 await page.locator('[data-tool="erase"]').click();await cell(page,'D2').focus();await page.keyboard.press('Tab');await page.keyboard.press('Space');
 expect((await state(page)).marks['1:E2']).toBeUndefined();
 const land=page.locator('.blocked-cell polygon');await expect(land).toHaveCount(3);
 for(const polygon of await land.all()){
  await expect(polygon).toHaveAttribute('pointer-events','all');await expect(polygon).toHaveAttribute('fill','transparent');
  await expect(polygon).toHaveAttribute('stroke','#d6c59a');await expect(polygon).toHaveAttribute('stroke-width','1.05');await expect(polygon).toHaveAttribute('stroke-opacity','.62');await expect(polygon).toHaveAttribute('stroke-dasharray','4 3');
 }
 await page.locator('[data-hour="4"]').click();await picture(page,info,'after-landhex');
 if(process.env.LAND_BASELINE_ROOT){
  await page.goto('http://127.0.0.1:4176/gk/pr38/');await expect(page.locator('#map .cell')).toHaveCount(25);
  await page.locator('[data-hour="4"]').click();await picture(page,info,'before-landhex');
  await page.locator('[data-tool="maybe"]').click();await cell(page,'B3').click();expect((await state(page)).marks['4:B3']).toBeUndefined();
 }
});
