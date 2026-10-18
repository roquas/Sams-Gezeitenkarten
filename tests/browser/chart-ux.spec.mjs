import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);});
// A formatter is shared by the full book, single page, route and distance status.
test('coordinate notation is shared and accessible across all outputs',async({page})=>{
 await expect(page.locator('#routeView [data-coordinate="D4"]')).toHaveAttribute('aria-label','Delta / Blau');
 for(let i=0;i<4;i++)await page.locator('#nextClue').click();
 const single=page.locator('#clueTrack [data-coordinate="C1"]'),list=page.locator('#allClues [data-coordinate="C1"]');
 await expect(single).toHaveAttribute('aria-label','Gamma / Cyan');
 expect(await single.innerHTML()).toBe(await list.innerHTML());
 await page.locator('#toggleDistances').click();await page.locator('#map [data-id="C1"]').click();
 expect(await page.locator('#distanceStatus [data-coordinate="C1"]').innerHTML()).toBe(await single.innerHTML());
 await expect(page.locator('#gameRules [data-coordinate="C3"]')).toHaveAttribute('aria-label','Gamma / Violett');
});
test('distance phases announce selection, cancel and preserve notes',async({page})=>{
 const button=page.locator('#toggleDistances');
 await expect(button).toHaveAttribute('data-distance-state','inactive');await expect(page.locator('#distanceStatus')).toBeHidden();
 await button.focus();await page.keyboard.press('Enter');
 await expect(button).toHaveAttribute('data-distance-state','waiting');await expect(button).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#distanceStatus')).toContainText('Jetzt ein Feld auf der Karte wählen.');
 await page.locator('#map [data-id="C1"]').focus();await page.keyboard.press('Enter');
 await expect(button).toHaveAttribute('data-distance-state','showing');await expect(button).toHaveClass(/active/);
 await expect(page.locator('#distanceStatus [data-coordinate="C1"]')).toHaveAttribute('aria-label','Gamma / Cyan');
 await page.locator('[data-tool="yes"]').click();await expect(button).toHaveAttribute('data-distance-state','showing');
 await page.locator('#map [data-id="A1"]').click();
 await button.click();await expect(button).toHaveAttribute('data-distance-state','inactive');
 await page.locator('[data-tool="clearAll"]').click();await button.click();await page.locator('#map [data-id="A1"]').click();
 await expect(button).toHaveAttribute('data-distance-state','showing');
 await expect(page.locator('#map [data-id="A1"]')).toContainText('✓');
});
test.describe('mobile overview at 390px',()=>{
 test.use({viewport:{width:390,height:844}});
 test('mobile overview shows every clue and preserves game, scroll, keyboard and undo',async({page})=>{
 await page.locator('[data-hour="4"]').click();await page.locator('[data-tool="yes"]').click();await page.locator('#map [data-id="A1"]').click();
 await page.locator('#gameSurface').evaluate(el=>el.scrollTop=300);const mapScroll=await page.locator('#gameSurface').evaluate(el=>el.scrollTop);
 await page.locator('#logbookTab').click();
 const surface=await page.locator('#gameSurface').boundingBox(),nav=await page.locator('.mobile-view-nav').boundingBox();expect(surface.y+surface.height).toBeLessThanOrEqual(nav.y+.5);
 await expect(page.locator('.map-panel')).toBeHidden();await expect(page.locator('#logbook')).toBeVisible();
 for(const id of ['I','II','III','IV','V','VI','VII'])await expect(page.locator(`#allClues [data-clue="${id}"]`)).toBeVisible();
 await page.locator('#allClues [data-clue="V"]').focus();await page.keyboard.press('Space');
 await expect(page.locator('#allClues [data-clue="V"]')).toHaveAttribute('aria-checked','true');
 await page.locator('#gameSurface').evaluate(el=>el.scrollTop=400);const bookScroll=await page.locator('#gameSurface').evaluate(el=>el.scrollTop);
 await page.locator('#chartTab').click();await expect(page.locator('[data-hour="4"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-tool="yes"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('#gameSurface').evaluate(el=>el.scrollTop)).toBe(mapScroll);
 await page.locator('#logbookTab').focus();await page.keyboard.press('Enter');expect(await page.locator('#gameSurface').evaluate(el=>el.scrollTop)).toBe(bookScroll);
 await page.keyboard.press('Escape');await expect(page.locator('.map-panel')).toBeVisible();
 await page.locator('#undo').click();await expect(page.locator('#allClues [data-clue="V"]')).toHaveAttribute('aria-checked','false');
 await expect(page.locator('#map [data-id="A1"]')).toContainText('✓');
 await page.setViewportSize({width:1440,height:1080});await expect(page.locator('.mobile-view-nav')).toBeHidden();await expect(page.locator('#logbook')).toBeVisible();
 });
});
for(const width of [320,390,768])test.describe(`mobile navigation layout ${width}px`,()=>{
 test.use({viewport:{width,height:844}});
 test('mobile overview keeps navigation and clue controls reachable',async({page})=>{
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const sizes=await page.locator('.mobile-view-nav button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));expect(sizes.every(h=>h>=44)).toBe(true);
  await page.locator('#chartTab').click();
  await page.locator('#nextClue').scrollIntoViewIfNeeded();
  const controls=await page.locator('.bordbook .clue-nav').boundingBox(),navigation=await page.locator('.mobile-view-nav').boundingBox();expect(controls.y+controls.height).toBeLessThanOrEqual(navigation.y);
 });
});
test('chart labels sit in parchment, are legible and do not intercept map controls',async({page})=>{
 await expect(page.locator('#map .place-label')).toHaveCount(3);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  const labels=await page.locator('#map .place-label').evaluateAll(ns=>ns.map(n=>{
   const text=n.querySelector('text'),style=getComputedStyle(text);
   return {text:text.textContent,cell:n.dataset.labelCell,events:getComputedStyle(n).pointerEvents,size:Number(text.getAttribute('font-size')),computed:style.fontSize,family:style.fontFamily,measured:text.getComputedTextLength(),box:text.getBBox().width,available:Number(n.querySelector('rect').getAttribute('width'))-6,scale:text.getScreenCTM().a};
  }));
  expect(labels.every(l=>l.events==='none'&&l.size>=11),`viewport ${width}: ${JSON.stringify(labels)}`).toBe(true);
  const bounds=await page.locator('#map .coordinate-guides').evaluate(g=>{const b=g.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};});
  expect(bounds.x).toBeGreaterThan(-35);expect(bounds.y).toBeGreaterThan(-35);expect(bounds.x+bounds.width).toBeLessThan(510);expect(bounds.y+bounds.height).toBeLessThan(420);
 }
 await page.locator('#map [data-id="E3"]').click();await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
});
for(const surface of ['desktop','mobile-chart','mobile-bordbook','mobile-logbook','mobile-logbook-later'])test.describe(`coordinate and logbook screenshot ${surface}`,()=>{
 const desktop=surface==='desktop';
 test.use({viewport:desktop?{width:1440,height:1080}:{width:390,height:844}});
 test('actual browser screenshot for coordinate and logbook review',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(let i=0;i<4;i++)await page.locator('#nextClue').click();
  await page.locator('#toggleDistances').click();await page.locator('#allClues').evaluate(el=>el.closest('details').open=true);await page.evaluate(()=>scrollTo(0,0));
  if(!desktop)await page.locator('#gameSurface').evaluate(el=>el.scrollTop=0);
  if(surface!=='desktop'&&surface!=='mobile-chart')await page.locator('#map [data-id="C1"]').click();
  if(surface==='mobile-bordbook')await page.locator('.bordbook').scrollIntoViewIfNeeded();
  if(surface.startsWith('mobile-logbook')){
   await page.locator('#logbookTab').click();await page.evaluate(()=>scrollTo(0,0));
   await page.locator('#gameSurface').evaluate(el=>el.scrollTop=0);
   if(surface==='mobile-logbook-later')await page.locator('#allClues [data-clue="VI"]').scrollIntoViewIfNeeded();
  }
  const fullPage=['desktop','mobile-chart','mobile-logbook'].includes(surface);
  await testInfo.attach('ux-'+surface,{body:await page.screenshot({fullPage,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 });
});
