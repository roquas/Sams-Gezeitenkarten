import {test,expect} from '@playwright/test';
const KEY='gezeitenkarten-reference-3.6-v0.1';
test.beforeEach(async({page})=>{await page.goto('/index.html');await page.evaluate(k=>localStorage.removeItem(k),KEY);await page.reload();});
const state=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const cell=(page,id)=>page.locator('#map [data-id="'+id+'"]').first();
test('initial state, hour navigation, and persistence',async({page})=>{
 expect((await state(page)).route).toEqual(['D4']);
 await page.locator('[data-hour="2"]').click();
 await expect(page.locator('#layerTitle')).toContainText('Stunde 2');
 await cell(page,'A1').click();
 expect((await state(page)).marks['2:A1']).toBe('maybe');
 await page.reload();
 expect((await state(page)).marks['2:A1']).toBe('maybe');
 expect((await state(page)).layer).toBe(2);
});
test('undo restores mark and does not survive reload',async({page})=>{
 await cell(page,'A1').click();expect((await state(page)).marks['1:A1']).toBe('maybe');
 await page.locator('#undo').click();expect((await state(page)).marks['1:A1']).toBeUndefined();
 await cell(page,'A1').click();await page.reload();await page.locator('#undo').click();
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
test('hint has cost and is currently undoable (3.6 characterization)',async({page})=>{
 const help=page.locator('.logbook-section details').filter({has:page.locator('#hint')});
 // On mobile the logbook is in a scrollable pane; expand via DOM rather than
 // requiring Playwright to scroll the summary into the viewport.
 await help.evaluate(el=>{el.open=true;});
 await page.locator('#hint').evaluate(el=>el.click());
 expect((await state(page)).penalty).toBe(10);
 await page.locator('#undo').click();expect((await state(page)).penalty).toBe(0);
});
test('chart illustration toggle does not enter state and survives undo',async({page})=>{
 await cell(page,'A1').click();
 const checkbox=page.locator('#showChart');await checkbox.check();
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

