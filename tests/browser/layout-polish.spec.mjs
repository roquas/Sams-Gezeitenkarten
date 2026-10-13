import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
const rows=async locator=>locator.evaluateAll(ns=>{const tops=ns.map(n=>n.getBoundingClientRect().top+n.getBoundingClientRect().height/2).sort((a,b)=>a-b);return tops.reduce((a,v)=>{if(!a.length||v-a.at(-1)>1)a.push(v);return a;},[]).length;});
test('instrument placement, two mobile rows, generous hit areas and compact route numbers',async({page})=>{
 await expect(page.locator('.chart-toolbar .wheel-emblem,.chart-toolbar .hour-label')).toHaveCount(0);
 await expect(page.locator('.hours-group .hourglass-emblem')).toHaveCount(1);
 await expect(page.locator('#tools [data-tool]')).toHaveCount(5);
 await expect(page.locator('#mapActions button')).toHaveCount(7);
 await expect(page.locator('#toggleRouteNumbers .route-numerals')).toHaveText('①②··');
 for(const width of [320,390,600,900,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const boxes=await page.locator('.chart-toolbar button,#mapActions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));
  expect(boxes.every(b=>b.width>=43.9&&b.height>=44)).toBe(true);
  expect(await rows(page.locator('.chart-toolbar button'))).toBe(width<=600||(width>=881&&width<=1050)?2:1);
  expect(await rows(page.locator('#mapActions button'))).toBe(width<=600?2:1);
  if(width<=600){const verify=await page.locator('#verify').boundingBox();expect(verify.width).toBe(48);const numbers=await page.locator('#toggleRouteNumbers').boundingBox();expect(numbers.width).toBeLessThanOrEqual(72);}
 }
 await page.locator('#routeTool').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#routeTool')).toHaveAttribute('aria-pressed','true');
 await page.locator('#map [data-id="E3"]').click();await expect(page.locator('#routeBack')).toBeEnabled();
 await page.locator('#routeBack').focus();await page.keyboard.press('Enter');await expect(page.locator('#routeBack')).toBeDisabled();
 await page.locator('[data-tool="yes"]').click();await expect(page.locator('#routeTool')).toHaveAttribute('aria-pressed','false');
});
test('one book composition preserves both covers, wheel leaf, heading and clue navigation',async({page})=>{
 for(const width of [320,390,620,1440]){
  await page.setViewportSize({width,height:1000});
  await expect(page.locator('.book-vignette')).toBeVisible();
  expect(await page.locator('.book-heading').textContent()).toBe('');
  await expect(page.locator('.book-page-heading strong')).toHaveText('Aus Robins Logbuch');
  const b=await page.locator('.bordbook').boundingBox(),left=await page.locator('.book-heading').boundingBox(),right=await page.locator('.book-page').boundingBox();
  expect(left.width/b.width).toBeGreaterThan(.1);expect(left.width/b.width).toBeLessThan(.2);expect(right.width/b.width).toBeGreaterThan(.8);
  const images=await page.locator('.bordbook').evaluate(el=>['::before','::after'].map(p=>({background:getComputedStyle(el,p).backgroundImage,position:getComputedStyle(el,p).backgroundPosition})));
  expect(images.every(p=>p.background.includes('open-bordbook.webp'))).toBe(true);expect(images[0].position).not.toBe(images[1].position);
 }
 await page.locator('#nextClue').click();await expect(page.locator('#cluePosition')).toHaveText('II / VII');
 await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#cluePosition')).toHaveText('III / VII');
 await page.locator('#clueTrack [data-clue]').focus();await page.keyboard.press('Space');await expect(page.locator('#clueTrack [data-clue]')).toHaveAttribute('aria-checked','true');
 expect(await page.evaluate(()=>!!(document.getElementById('routeView').compareDocumentPosition(document.getElementById('toolLegend'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
});
test('lowered labels retain footprint safety and column guides stay behind hex ink',async({page})=>{
 const start=await page.locator('.start-label').getAttribute('transform');expect(start).toContain('269.');
 await expect(page.locator('.island-label').filter({hasText:'Tesoro'})).toHaveAttribute('transform','translate(183 210)');
 const guides=await page.locator('.coordinate-guides>path').evaluateAll(ns=>ns.filter(n=>!n.hasAttribute('stroke-dasharray')).map(n=>Number(n.getAttribute('opacity'))));
 expect(guides.every(o=>o>=.19&&o<.56)).toBe(true);
});
test('actual browser screenshots of six layout refinements',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>scrollTo(0,0));
 for(const [name,locator] of [['layout-desktop',null],['layout-upper',page.locator('.chart-toolbar')],['layout-lower',page.locator('#mapActions')],['layout-book',page.locator('.bordbook')]]){
  await testInfo.attach(name,{body:locator?await locator.screenshot({type:'jpeg',quality:96,scale:'css'}):await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#gameSurface').evaluate(el=>el.scrollTop=0);
 await testInfo.attach('layout-mobile-upper',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 await page.locator('.bordbook').scrollIntoViewIfNeeded();
 await testInfo.attach('layout-mobile-book',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 await page.setViewportSize({width:320,height:780});await page.locator('#mapActions').scrollIntoViewIfNeeded();
 await testInfo.attach('layout-mobile-320',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});
