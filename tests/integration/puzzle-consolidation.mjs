import {test,expect} from '@playwright/test';
const ids=['reference-3.6','quittung-nombreo','ankerbuch-tesoro'];
const key=id=>`gezeitenkarten-${id}-schema1-data1`;
const saved=(page,id)=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key(id));
async function chart(page){if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();}
async function settings(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const details=page.locator('#puzzleSelect').locator('xpath=ancestor::details[1]');
 if(await details.getAttribute('open')===null)await details.locator('summary').click();
}
async function choose(page,id){
 await settings(page);await page.locator('#puzzleSelect').selectOption(id);
 await expect(page.locator('#puzzleSelect')).toBeEnabled();
 await expect(page.locator('h1')).toHaveText((await (await page.request.get(`puzzles/${id}.json`)).json()).presentation.title);
 await chart(page);
}
export function registerConsolidationTests(){
 for(const id of ids)test(`consolidated ${id}: land radar, frame preference and isolated reload/reset`,async({page,request})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=await (await request.get(`puzzles/${id}.json`)).json();
  await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
  await choose(page,id);
  const before=await page.locator('#map .cell polygon').evaluateAll(ns=>ns.map(n=>n.getAttribute('points')));
  const land=data.logic.blocked[0],water=data.solution[1];
  await page.locator(`[data-id="${land}"]`).click();expect((await saved(page,id)).marks).toEqual({});
  await page.locator('#toggleDistances').click();await page.locator(`[data-id="${land}"]`).click();
  await expect(page.locator('.distance-value')).toHaveCount(25);
  await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin',land);
  await page.locator('[data-tool="yes"]').click();await page.locator(`[data-id="${water}"]`).click();
  await page.locator('#clueTrack [data-clue]').click();
  await settings(page);await page.locator('#frameStyle').selectOption('quiet');await chart(page);
  const previous=await saved(page,id),other=ids.find(x=>x!==id);
  await choose(page,other);await expect(page.locator('#map')).toHaveAttribute('data-frame-mode','quiet');
  expect((await saved(page,other)).marks).toEqual({});
  await choose(page,id);expect(await saved(page,id)).toEqual(previous);
  expect(await page.locator('#map .cell polygon').evaluateAll(ns=>ns.map(n=>n.getAttribute('points')))).toEqual(before);
  await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
  await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin',land);
  await expect(page.locator('#map')).toHaveAttribute('data-frame-mode','quiet');
  expect((await saved(page,id)).marks[`1:${water}`]).toBe('yes');
  await settings(page);page.once('dialog',d=>d.accept());await page.locator('#reset').click();
  expect((await saved(page,id)).marks).toEqual({});expect((await saved(page,id)).route).toEqual([data.logic.start]);
  await chart(page);await expect(page.locator('#map')).toHaveAttribute('data-frame-mode','quiet');
  await choose(page,other);await choose(page,id);expect((await saved(page,id)).marks).toEqual({});
  expect(errors).toEqual([]);
 });
 test('tablet settings and clipped full-size sepia logbook remain usable',async({page},info)=>{
  await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
  for(const width of [768,1024]){
   await page.setViewportSize({width,height:1024});await choose(page,'ankerbuch-tesoro');
   await expect(page.locator('#map .cell')).toHaveCount(25);
   await expect(page.locator('#map [data-margin-side]')).toHaveCount(20);
   const leaves=await page.locator('.bordbook').evaluate(n=>['::before','::after'].map(p=>({w:parseFloat(getComputedStyle(n,p).width),x:parseFloat(getComputedStyle(n,p).left)})));
   expect(leaves[0].w).toBeCloseTo(leaves[1].w,0);expect(leaves[0].x).toBeLessThan(0);
   expect(await page.locator('.book-vignette').evaluate(n=>getComputedStyle(n).backgroundImage)).toContain('logbook-chart.svg');
   await expect(page.locator('.book-vignette svg,.book-vignette img')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await info.attach(`consolidated-tablet-${width}`,{body:await page.locator('.bordbook').screenshot({scale:'css'}),contentType:'image/png'});
  }
 });
}
