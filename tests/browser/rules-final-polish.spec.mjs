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
 await expect(rules).toContainText('Nordost (Stunde 1), Ost (Stunde 2), Südost (Stunde 3), Südwest (Stunde 4), West (Stunde 5) und Nordwest (Stunde 6)');
 await expect(rules).toContainText('sie schreibt Sam keinen Kurs vor');
 await expect(rules).toContainText('eine kräftige Doppelkante hebt die gerade gewählte Stunde hervor');
 await expect(rules).toContainText('Ein weiterer Druck auf das Radar schaltet die Anzeige sofort aus');
 await expect(rules).not.toContainText('Zweimal');
 await expect(rules).toContainText('ein Logbuch voller Beobachtungen');
 await expect(rules).not.toContainText('sieben Beobachtungen');
 await expect(rules.locator('ol li')).toHaveCount(6);
 await expect(rules).not.toContainText('Bildplatzhalter');
 await rules.locator('summary').focus();await page.keyboard.press('Enter');await expect(rules).not.toHaveAttribute('open','');
});
for(const width of [320,360,390,600,900,1440])test.describe(`controls viewport ${width}px`,()=>{
 test.use({viewport:{width,height:1000}});
 test(`compact controls and centered radar in all states at ${width}px`,async({page})=>{
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
  await page.locator('#toggleDistances').click();
 });
});
for(const width of [1440,390,320])test.describe(`rules screenshot viewport ${width}px`,()=>{
 test.use({viewport:{width,height:width===1440?1080:844}});
 test(`actual polished controls and expanded rules screenshots at ${width}px`,async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  if(width<601){
   const target=page.locator('#chartTab');
   const metrics=await target.evaluate(button=>{
    const r=button.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),v=visualViewport;
    return {hit:button===hit||button.contains(hit),target:r.toJSON(),hitElement:hit?.outerHTML.slice(0,200),inner:[innerWidth,innerHeight],client:[document.documentElement.clientWidth,document.documentElement.clientHeight],visual:v?{width:v.width,height:v.height,top:v.offsetTop,left:v.offsetLeft,scale:v.scale}:null,screen:[screen.width,screen.height],scroll:[scrollX,scrollY],body:document.body.getBoundingClientRect().toJSON()};
   });
   expect(metrics,'native mobile navigation hit-test for configured viewport: '+JSON.stringify(metrics)).toMatchObject({hit:true});
   await target.click();
  }
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
});
