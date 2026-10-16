import {test,expect} from '@playwright/test';
const KEY='gezeitenkarten-reference-3.6-schema1-data1';
test.beforeEach(async({page})=>{await page.goto('/index.html');await page.evaluate(k=>localStorage.removeItem(k),KEY);await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);});
const state=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const cell=(page,id)=>page.locator('#map [data-id="'+id+'"]').first();
test('initial state, hour navigation, and persistence',async({page})=>{
 expect((await state(page)).route).toEqual(['D4']);
 await page.locator('[data-hour="2"]').click();
 await expect(page.locator('#layerTitle')).toContainText('Stunde 2');
 await cell(page,'A1').click();
 expect((await state(page)).marks['2:A1']).toBe('maybe');
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 expect((await state(page)).marks['2:A1']).toBe('maybe');
 expect((await state(page)).layer).toBe(2);
});
test('undo restores mark and does not survive reload',async({page})=>{
 await cell(page,'A1').click();expect((await state(page)).marks['1:A1']).toBe('maybe');
 await page.locator('#undo').click();expect((await state(page)).marks['1:A1']).toBeUndefined();
 await cell(page,'A1').click();await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await page.locator('#undo').click();
 expect((await state(page)).marks['1:A1']).toBe('maybe');
});
test('clear all hours removes one cell across layers',async({page})=>{
 await cell(page,'A1').click();
 await page.locator('[data-hour="2"]').click();await cell(page,'A1').click();
 await page.locator('[data-tool="clearAll"]').click();await cell(page,'A1').click();
 expect(Object.keys((await state(page)).marks).filter(k=>k.endsWith(':A1'))).toEqual([]);
});
test('route, backstep, and verification of known solution',async({page})=>{
 await page.locator('[data-tool="route"]').click();
 for(const id of ['E3','D2','C2','B2','B1','A1'])await cell(page,id).click();
 expect((await state(page)).route).toEqual(['D4','E3','D2','C2','B2','B1','A1']);
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await page.locator('#routeBack').click();expect((await state(page)).route).toHaveLength(6);
});
test('paid hint survives undo',async({page})=>{
 const help=page.locator('.logbook-section details').filter({has:page.locator('#hint')});
 // On mobile the logbook is in a scrollable pane; expand via DOM rather than
 // requiring Playwright to scroll the summary into the viewport.
 await help.evaluate(el=>{el.open=true;});
 await cell(page,'A1').click();
 await page.locator('#hint').evaluate(el=>el.click());
 expect((await state(page)).penalty).toBe(10);
 await page.locator('#undo').click();expect((await state(page)).penalty).toBe(10);
});
test('chart illustration toggle does not enter state and survives undo',async({page,isMobile})=>{
 await cell(page,'A1').click();
 if(isMobile)await page.locator('#logbookTab').click();
 const checkbox=page.locator('#showChart');await checkbox.evaluate(el=>el.closest('details').open=true);await expect(checkbox).toBeChecked();
 await checkbox.uncheck();await checkbox.check();if(isMobile)await page.locator('#chartTab').click();
 await page.locator('#undo').click();await expect(checkbox).toBeChecked();
});
test('display option undo regression is known in 3.6',async({page})=>{
 await cell(page,'A1').click();
 await page.locator('#toggleRouteNumbers').click();
 expect((await state(page)).showRouteNumbers).toBe(true);
 await cell(page,'A2').click();await page.locator('#undo').click();
 // This test characterizes current behavior, not the future requirement (#13).
 expect((await state(page)).showRouteNumbers).toBe(true);
});

test('six hours and all display settings survive undo across an earlier edit',async({page})=>{
 await expect(page.locator('#hours [data-hour]')).toHaveCount(6);
 await cell(page,'A1').click();
 await page.locator('[data-hour="3"]').click();
 await page.locator('#toggleRouteNumbers').click();
 await page.locator('#toggleHourMarks').click();
 await page.locator('#toggleDistances').click();await cell(page,'A2').click();
 await page.locator('#hideRouteMarks').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change'));});
 await page.locator('#undo').click();
 const s=await state(page);expect(s.marks['1:A1']).toBeUndefined();expect(s.layer).toBe(3);
 expect(s.showRouteNumbers).toBe(true);expect(s.hiddenHours).toEqual([3]);expect(s.hideRouteMarks).toBe(true);
 expect(s.distanceMode).toBe(true);expect(s.distanceOrigin).toBe('A2');
});
test('switching tools preserves distance overlay and next click marks immediately',async({page})=>{
 await page.locator('#toggleDistances').click();await cell(page,'C1').click();
 expect((await state(page)).distanceOrigin).toBe('C1');
 await page.locator('[data-tool="yes"]').click();
 expect((await state(page)).distanceMode).toBe(true);expect((await state(page)).distanceOrigin).toBe('C1');
 await cell(page,'A1').click();expect((await state(page)).marks['1:A1']).toBe('yes');
});
test('blocked, repeated and nonadjacent route clicks do not change route',async({page})=>{
 await page.locator('[data-tool="route"]').click();
 for(const id of ['B3','A1','D4'])await cell(page,id).click();
 expect((await state(page)).route).toEqual(['D4']);
 await cell(page,'E3').click();await cell(page,'D4').click();expect((await state(page)).route).toEqual(['D4','E3']);
});
test('invalid saved route recovers to playable initial state',async({page})=>{
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({route:['D4','Z9'],marks:null})),KEY);await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 expect((await state(page)).route).toEqual(['D4']);await cell(page,'A1').click();expect((await state(page)).marks['1:A1']).toBe('maybe');
});
test('keyboard input, per-hour erasing, note checking and confirmed reset',async({page})=>{
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 expect((await state(page)).marks['1:A1']).toBe('maybe');
 await page.locator('[data-hour="2"]').click();await cell(page,'A1').click();
 await page.locator('#clearLayer').evaluate(el=>el.click());
 expect((await state(page)).marks['2:A1']).toBeUndefined();expect((await state(page)).marks['1:A1']).toBe('maybe');
 await page.locator('#checkMarks').evaluate(el=>el.click());expect((await state(page)).penalty).toBe(5);
 await page.locator('#undo').click();expect((await state(page)).penalty).toBe(0);
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#reset').evaluate(el=>el.click());expect((await state(page)).marks['1:A1']).toBe('maybe');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#reset').evaluate(el=>el.click());expect((await state(page)).marks).toEqual({});expect((await state(page)).route).toEqual(['D4']);
});
test('paid hint cost and count persist after reload and another undo',async({page})=>{
 await page.locator('#hint').evaluate(el=>el.click());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await cell(page,'A1').click();await page.locator('#undo').click();
 expect((await state(page)).penalty).toBe(10);expect((await state(page)).hintCount).toBe(1);
});
test('chart assets load and playing has no browser errors or horizontal overflow',async({page},testInfo)=>{
 const errors=[],failures=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))failures.push(response.url());});
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await page.locator('[data-tool="route"]').click();for(const id of ['E3','D2','C2','B2','B1','A1'])await cell(page,id).click();
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 expect(errors).toEqual([]);expect(failures).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await testInfo.attach('version-0.1',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
test('mobile logbook opens and closes through its visible controls',async({page,isMobile})=>{
 test.skip(!isMobile,'Mobile drawer only');
 await page.locator('#logbookTab').click();await expect(page.locator('#logbookTab')).toHaveAttribute('aria-expanded','true');
 await page.locator('#chartTab').click();await expect(page.locator('#logbookTab')).toHaveAttribute('aria-expanded','false');
});
test('one mouse or touch drag marks two fields and undoes as one gesture',async({page,isMobile})=>{
 const center=async id=>{const b=await cell(page,id).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
 const first=await center('A1'),second=await center('B1');
 if(isMobile){
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[second]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
 }else{
  await page.mouse.move(first.x,first.y);await page.mouse.down();await page.mouse.move(second.x,second.y,{steps:5});await page.mouse.up();
 }
 expect((await state(page)).marks['1:A1']).toBe('maybe');expect((await state(page)).marks['1:B1']).toBe('maybe');
 await page.locator('#undo').click();expect((await state(page)).marks).toEqual({});
});
