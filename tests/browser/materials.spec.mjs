import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('raster upper materials load, stay clear of hit targets and render at desktop and mobile',async({page},testInfo)=>{
 const failed=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
 await page.reload();
 await expect(page.locator('.chart-toolbar .brass-rail')).toHaveCount(2);
 await expect(page.locator('.chart-toolbar .raster-icon')).toHaveCount(7);
 await page.locator('[data-hour="3"]').click();await expect(page.locator('[data-hour="3"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-tool="yes"]').click();await page.locator('#map [data-id="A1"]').click();
 await expect(page.locator('[data-tool="yes"]')).toHaveAttribute('aria-pressed','true');
 expect(failed).toEqual([]);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:'horizontal overflow at '+width}).toBe(true);
  const controls=await page.locator('.chart-toolbar button').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  expect(controls.every(b=>b.w>=43.9&&b.h>=44)).toBe(true);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>scrollTo(0,0));
 await testInfo.attach('material-upper-desktop',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await testInfo.attach('material-upper-closeup',{body:await page.locator('.chart-toolbar').screenshot(),contentType:'image/png'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
 await testInfo.attach('material-upper-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
