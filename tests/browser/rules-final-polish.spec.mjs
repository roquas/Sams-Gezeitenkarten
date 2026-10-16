import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);});
test('editorial rules remain collapsed and offer the complete structured introduction',async({page})=>{
 const rules=page.locator('#gameRules');
 await expect(rules).not.toHaveAttribute('open','');
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await rules.locator('summary').click();
 await expect(rules.locator('h3')).toHaveText('So liest man eine Gezeitenkarte');
 await expect(rules.locator('h3')).toBeVisible();
 await expect(rules.locator('h4')).toHaveCount(8);
 await expect(rules).toContainText('Landhindernisse verlängern diese geometrische Distanz nicht');
 await expect(rules).toContainText('5 Strafpunkte');await expect(rules).toContainText('10 Strafpunkte');
 await expect(rules.locator('ol li')).toHaveCount(6);
 await expect(rules).not.toContainText('Bildplatzhalter');
 await rules.locator('summary').focus();await page.keyboard.press('Enter');await expect(rules).not.toHaveAttribute('open','');
});
for(const width of [320,360,390,600,900,1440]){
 test(`compact controls and centered radar in all states at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await expect(page.locator('#toggleRouteNumbers .route-numerals')).toHaveText('①②··');
  await expect(page.locator('#verify .verify-label')).toHaveCount(0);
  await expect(page.locator('#verify')).toHaveAccessibleName('Route überprüfen');
  const colors=await page.locator('.hourglass-emblem,.marking-feather').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).backgroundColor));expect(colors.every(c=>c==='rgba(0, 0, 0, 0)')).toBe(true);
  for(const state of ['inactive','waiting','showing']){
   await expect(page.locator('#toggleDistances')).toHaveAttribute('data-distance-state',state);
   const delta=await page.locator('#toggleDistances').evaluate(b=>{const x=b.getBoundingClientRect(),y=b.firstElementChild.getBoundingClientRect();return [y.x+y.width/2-x.x-x.width/2,y.y+y.height/2-x.y-x.height/2];});
   expect(Math.abs(delta[0])).toBeLessThanOrEqual(1.1);expect(Math.abs(delta[1])).toBeLessThanOrEqual(1.6);
   if(state==='inactive')await page.locator('#toggleDistances').click();
   if(state==='waiting')await page.locator('#map [data-id="E3"]').click();
  }
  await page.locator('#toggleDistances').click();await page.locator('#toggleDistances').click();
 });
}
for(const width of [1440,390,320]){
 test(`actual polished controls and expanded rules screenshots at ${width}px`,async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width,height:width===1440?1080:844});
  if(width<601)await page.locator('#chartTab').click();
  await page.locator('.chart-toolbar').scrollIntoViewIfNeeded();
  await testInfo.attach('rules-polish-'+width+'-chart',{body:await page.screenshot({type:'jpeg',quality:94,fullPage:width===1440}),contentType:'image/jpeg'});
  await page.locator('#mapActions').scrollIntoViewIfNeeded();
  await testInfo.attach('rules-polish-'+width+'-controls',{body:await page.locator('#mapActions').screenshot({type:'jpeg',quality:96}),contentType:'image/jpeg'});
  if(width<601)await page.locator('#logbookTab').click();
  await page.locator('#gameRules').evaluate(el=>el.open=true);
  await page.locator('#gameRules summary').scrollIntoViewIfNeeded();
  await testInfo.attach('rules-polish-'+width+'-rules',{body:width<601?await page.screenshot({type:'jpeg',quality:94,scale:'css'}):await page.locator('#gameRules').screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
  await page.locator('#gameRules').evaluate(el=>el.open=false);
 });
}
