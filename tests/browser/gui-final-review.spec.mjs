import {test,expect} from '@playwright/test';
const KEY='gezeitenkarten-reference-3.6-schema1-data1';
const state=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const cell=(page,id)=>page.locator('#map [data-id="'+id+'"]');
const overlay=page=>page.locator('.distance-overlay');
const rows=async locator=>locator.evaluateAll(ns=>{const ys=ns.map(n=>{const b=n.getBoundingClientRect();return b.y+b.height/2;}).sort((a,b)=>a-b);return ys.reduce((a,y)=>{if(!a.length||y-a.at(-1)>1)a.push(y);return a;},[]).length;});
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);});
const startRadar=async page=>{await page.locator('#toggleDistances').click();await cell(page,'C1').click();};
const retained=async page=>{await expect(overlay(page)).toHaveAttribute('data-distance-origin','C1');await expect(page.locator('.distance-value')).toHaveCount(25);await expect(page.locator('#toggleDistances')).toHaveAttribute('data-distance-state','showing');};
test('distance-two notes retain the independent overlay',async({page})=>{
 await startRadar(page);
 await page.locator('[data-tool="maybe"]').click();await expect(page.locator('[data-tool="maybe"]')).toHaveAttribute('aria-pressed','true');
 for(const id of ['A1','A2','D2','D3','E1']){
  await expect(page.locator(`[data-distance-cell="${id}"]`)).toHaveText('2');await cell(page,id).click();expect((await state(page)).marks['1:'+id]).toBe('maybe');await retained(page);
 }
});
test('overwriting and erasing notes retain the independent overlay',async({page})=>{
 await startRadar(page);await page.locator('[data-tool="maybe"]').click();
 for(const id of ['A1','A2','D2'])await cell(page,id).click();
 for(const [tool,id,value] of [['yes','A1','yes'],['no','A2','no'],['erase','D2',undefined]]){
  await page.locator(`[data-tool="${tool}"]`).click();await cell(page,id).click();expect((await state(page)).marks['1:'+id]).toBe(value);await retained(page);
 }
});
test('erasing all hours retains the independent overlay',async({page})=>{
 await startRadar(page);await page.locator('[data-tool="yes"]').click();await cell(page,'A1').click();
 await page.locator('[data-hour="2"]').click();await page.locator('[data-tool="yes"]').click();await cell(page,'A1').click();
 await page.locator('[data-tool="clearAll"]').click();await cell(page,'A1').click();expect(Object.keys((await state(page)).marks).filter(k=>k.endsWith(':A1'))).toEqual([]);await retained(page);
});
test('route, undo and reload retain the independent overlay',async({page})=>{
 await startRadar(page);
 await page.locator('#routeTool').click();await cell(page,'E3').click();await retained(page);await page.locator('#undo').click();expect((await state(page)).route).toEqual(['D4']);await retained(page);
 await page.reload();await retained(page);
});
test('keyboard origin changes preserve editing semantics',async({page})=>{
 const radar=page.locator('#toggleDistances');await radar.focus();await page.keyboard.press('Enter');
 await cell(page,'C1').focus();await page.keyboard.press('Enter');expect((await state(page)).marks).toEqual({});
 await radar.click();await expect(radar).toHaveAttribute('data-distance-state','waiting');await expect(overlay(page)).toHaveAttribute('data-distance-origin','C1');
 await cell(page,'B3').click();await expect(radar).toHaveAttribute('data-distance-state','showing');
 await expect(overlay(page)).toHaveAttribute('data-distance-origin','B3');
 await expect(page.locator('[data-distance-cell="B3"]')).toHaveText('0');
 await page.locator('[data-tool="no"]').click();await expect(radar).toHaveAttribute('data-distance-state','showing');await expect(overlay(page)).toHaveAttribute('data-distance-origin','B3');
 await radar.focus();await page.keyboard.press('Space');await cell(page,'A1').focus();await page.keyboard.press('Enter');await expect(overlay(page)).toHaveAttribute('data-distance-origin','A1');
 await expect(page.locator('[data-distance-cell="C1"]')).toHaveText('2');expect((await state(page)).marks).toEqual({});
});
test('cancelled selection, off and reset preserve editing semantics',async({page})=>{
 await startRadar(page);const radar=page.locator('#toggleDistances');
 await radar.click();await radar.click();await expect(overlay(page)).toHaveCount(0);await expect(radar).toHaveAttribute('data-distance-state','inactive');
 await radar.click();await page.locator('[data-tool="maybe"]').click();await cell(page,'A2').click();expect((await state(page)).marks['1:A2']).toBe('maybe');await expect(overlay(page)).toHaveCount(0);
 await radar.click();await cell(page,'C1').click();page.once('dialog',d=>d.accept());await page.locator('#reset').evaluate(el=>el.click());await expect(overlay(page)).toHaveCount(0);expect((await state(page)).distanceOrigin).toBeNull();
});
for(const width of [320,360,390,430,540,580,600,620,768,820,900,1024,1280,1440]){
 test(`lower rail centers correctly with transparent buttons at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1080});
  const chart=await page.locator('.map-panel').boundingBox(),rail=await page.locator('#mapActions').boundingBox();
  expect(await rows(page.locator('#mapActions button'))).toBe(chart.width<=560?2:1);
  const bs=await page.locator('#mapActions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));expect(bs.every(b=>b.width>=44&&b.height>=44)).toBe(true);
  if(chart.width<=560){const group=await page.locator('.route-actions').boundingBox(),first=await page.locator('#routeTool').boundingBox(),last=await page.locator('#verify').boundingBox();expect(Math.abs((first.x+last.x+last.width)/2-(rail.x+rail.width/2))).toBeLessThan(1);expect(group.y).toBeGreaterThan(bs[0].y);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('#mapActions button').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).backgroundColor==='rgba(0, 0, 0, 0)'))).toBe(true);
  const rails=await page.locator('#mapActions .brass-rail').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));expect(rails.every(w=>w>=rail.width)).toBe(true);
 });
}
test('rules incorporate all editorial corrections without inventing a global display switch',async({page})=>{
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const rules=page.locator('#gameRules');await rules.locator('summary').click();
 await expect(rules.locator('h3')).toBeVisible();
 for(const text of ['aufeinanderfolgende Blätter','Wattenmeer','wo','wann','Land ist nicht befahrbar','orangefarbener Kreis','nicht in jedem Rätsel','beispielsweise','In allen Stunden radieren','unterhalb der Karte','Stunden nacheinander','Schritte nummerieren','Notizprüfung (hier in der Hilfe weiter unten','Denkanstoß (hier in der Hilfe weiter unten'])await expect(rules).toContainText(text);
 await expect(rules).not.toContainText('eine Berührung an der Ecke');await expect(rules).not.toContainText('Das Riff bei Alpha/Violett');
 await expect(page.locator('#mapActions button')).toHaveCount(7);
});
for(const width of [1440,1024,900,768,540,390,320]){
 test(`actual rail screenshot at ${width}px`,async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width,height:width===1440?1080:844});
  await testInfo.attach('gui-review-'+width+'-rail',{body:await page.locator('#mapActions').screenshot({type:'jpeg',quality:95,scale:'css'}),contentType:'image/jpeg'});
 });
}
test('actual desktop GUI screenshot',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1080});
 await testInfo.attach('gui-review-desktop',{body:await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});
test('actual mobile overlay and rules screenshots',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});await startRadar(page);await page.locator('[data-tool="maybe"]').click();
 for(const id of ['A1','A2','D2'])await cell(page,id).click();
 await testInfo.attach('gui-review-overlay',{body:await page.locator('.mapbox').screenshot({type:'jpeg',quality:96,scale:'css'}),contentType:'image/jpeg'});
 await page.locator('#logbookTab').click();await page.locator('#gameRules').evaluate(el=>el.open=true);await page.locator('#gameRules summary').evaluate(el=>el.scrollIntoView({block:'start'}));
 await testInfo.attach('gui-review-rules-mobile',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});
