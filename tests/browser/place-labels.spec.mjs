import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('small translucent place labels and their text fit blocked polygons at mobile and desktop',async({page})=>{
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  const results=await page.locator('#map .place-label').evaluateAll(async labels=>{
   const {containsPoint}=await import('/src/ui/place-labels.mjs');
   return labels.map(g=>{
    const id=g.dataset.labelCell,cell=document.querySelector(`#map [data-id="${id}"]`);
    const polygon=cell.querySelector('polygon').getAttribute('points').split(' ').map(p=>p.split(',').map(Number));
    const b=g.getBBox(),m=g.transform.baseVal.consolidate().matrix;
    const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>[x+m.e,y+m.f]);
    const text=g.querySelector('text'),rect=g.querySelector('rect');
    return {id,land:cell.classList.contains('blocked-cell'),inside:corners.every(p=>containsPoint(polygon,p)),width:Number(rect.getAttribute('width')),opacity:Number(rect.getAttribute('opacity')),font:Number(text.getAttribute('font-size')),fits:text.getComputedTextLength()<=Number(rect.getAttribute('width'))-5.9,clip:g.parentElement.getAttribute('clip-path')};
   });
  });
  expect(results.map(r=>r.id).sort()).toEqual(['B3','E2']);
  expect(results.every(r=>r.land&&r.inside&&r.width<55&&r.opacity<=.65&&r.font>=11&&r.fits&&r.clip.startsWith('url('))).toBe(true);
 }
 await expect(page.locator('#map .place-label').filter({hasText:'Leuchtturm'})).toHaveCount(0);
 await page.locator('#map [data-id="C1"]').click();await expect(page.locator('#map [data-id="C1"]')).toContainText('?');
});
test('actual browser screenshots of land-contained labels',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>scrollTo(0,0));
 await testInfo.attach('labels-desktop',{body:await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 await testInfo.attach('labels-chart-detail',{body:await page.locator('#map').screenshot({type:'jpeg',quality:96,scale:'css'}),contentType:'image/jpeg'});
 await page.setViewportSize({width:390,height:844});await page.locator('#map').scrollIntoViewIfNeeded();
 await testInfo.attach('labels-mobile',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});
