import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('raster upper materials load, stay clear of hit targets and render at desktop and mobile',async({page},testInfo)=>{
 const failed=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
 await page.reload();
 await expect(page.locator('.chart-toolbar .brass-rail')).toHaveCount(2);
 await expect(page.locator('.chart-toolbar .raster-icon')).toHaveCount(8);
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
test('all material exports decode and the page turn keeps one accessible hint',async({page})=>{
 const decoded=await page.evaluate(async()=>{const {MATERIAL_ASSETS}=await import('/src/ui/material-icons.mjs');return Promise.all(MATERIAL_ASSETS.map(async src=>{const im=new Image();im.src=src;await im.decode();return {src,width:im.naturalWidth,height:im.naturalHeight};}));});
 expect(decoded.every(im=>im.width>0&&im.height>0)).toBe(true);
 const backgrounds=await page.locator('.raster-icon').evaluateAll(ns=>ns.map(el=>getComputedStyle(el).backgroundImage));
 expect(backgrounds.every(bg=>/tool-(atlas|refinements)\.webp/.test(bg))).toBe(true);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#nextClue').click();
 await expect(page.locator('#cluePosition')).toHaveText('II / VII');
 await expect(page.locator('#clueTrack [role="checkbox"]')).toHaveCount(1);
 const leaf=page.locator('.turning-leaf');
 if(await leaf.count())await expect(leaf).toHaveAttribute('aria-hidden','true');
 await expect(leaf).toHaveCount(0,{timeout:2000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#nextClue').click();
 await expect(leaf).toHaveCount(0);
 expect(await page.locator('#clueViewport').evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 await page.locator('#clueTrack [data-clue="III"]').focus();await page.keyboard.press('Space');
 await expect(page.locator('#clueTrack [data-clue="III"]')).toHaveAttribute('aria-checked','true');
});
test('actual browser screenshots of the complete material composition',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>scrollTo(0,0));
 const desktop=await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'});
 await testInfo.attach('material-complete-desktop',{body:desktop,contentType:'image/jpeg'});
 await testInfo.attach('material-complete-upper',{body:await page.locator('.chart-toolbar').screenshot({type:'jpeg',quality:96,scale:'css'}),contentType:'image/jpeg'});
 await testInfo.attach('material-complete-book',{body:await page.locator('.bordbook').screenshot({type:'jpeg',quality:96,scale:'css'}),contentType:'image/jpeg'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
 await testInfo.attach('material-complete-mobile',{body:await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});
test('all seven clues stay legible above page controls at narrow and tablet widths',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,620,768]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:'overflow at '+width}).toBe(true);
  for(let i=0;i<7;i++){
   const text=await page.locator('#clueTrack p').boundingBox(),nav=await page.locator('.bordbook .clue-nav').boundingBox(),viewport=await page.locator('#clueViewport').boundingBox();
   expect(text.x+text.width,`right edge of clue ${i} at ${width}`).toBeLessThanOrEqual(viewport.x+viewport.width+.5);
   expect(text.y+text.height,`page controls overlap clue ${i} at ${width}`).toBeLessThanOrEqual(nav.y+.5);
   expect(await page.locator('#clueTrack p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
   await page.locator('#nextClue').click();
  }
 }
});

test('refined icons keep hour geometry, shared writing tools and equal toggle eyes',async({page})=>{
 await expect(page.locator('.marking-tools [data-tool]')).toHaveCount(5);
 await expect(page.locator('#routeBack .icon-routeBack')).toHaveCount(1);
 await expect(page.locator('#prevClue .icon-previous')).toHaveCount(1);
 await expect(page.locator('#nextClue .icon-next')).toHaveCount(1);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const eyes=await page.locator('#toggleHourMarks .icon-eye,#toggleRouteNumbers .icon-eye').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));
  expect(eyes[0]).toBe(eyes[1]);
  const hex=await page.locator('[data-hour="1"] .hour-mini').boundingBox();expect(hex.width).toBeGreaterThanOrEqual(39);
 }
 await page.locator('[data-hour="6"]').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-hour="6"]')).toHaveAttribute('aria-pressed','true');
});
