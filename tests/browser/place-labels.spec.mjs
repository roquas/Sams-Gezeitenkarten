import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);});
test('small translucent place labels and their text fit blocked polygons at mobile and desktop',async({page})=>{
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  const results=await page.locator('#map .island-label').evaluateAll(async labels=>{
   const {containsPoint,polygonsOverlap}=await import('/src/ui/place-labels.mjs');
   return labels.map(g=>{
    const id=g.dataset.labelCell,cell=document.querySelector(`#map [data-id="${id}"]`);
    const clipId=g.parentElement.getAttribute('clip-path').slice(5,-1);
    const polygon=document.getElementById(clipId).querySelector('polygon').getAttribute('points').split(' ').map(p=>p.split(',').map(Number));
    const b=g.getBBox(),m=g.transform.baseVal.consolidate().matrix;
    const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>[x+m.e,y+m.f]);
    const water=[...document.querySelectorAll('#map .cell:not(.blocked-cell) polygon')].map(p=>p.getAttribute('points').split(' ').map(v=>v.split(',').map(Number)));
    const avoidsWater=water.every(p=>!polygonsOverlap(corners,p));
    const text=g.querySelector('text'),rect=g.querySelector('rect');
    return {avoidsWater,id,land:cell.classList.contains('blocked-cell'),inside:corners.every(p=>containsPoint(polygon,p)),width:Number(rect.getAttribute('width')),opacity:Number(rect.getAttribute('opacity')),font:Number(text.getAttribute('font-size')),fits:text.getComputedTextLength()<=Number(rect.getAttribute('width'))-5.9,clip:g.parentElement.getAttribute('clip-path')};
   });
  });
  expect(results.map(r=>r.id).sort()).toEqual(['B3','E2']);
  expect(results.every(r=>r.land&&r.inside&&r.avoidsWater&&r.width<55&&r.opacity<=.65&&r.font>=11&&r.fits&&r.clip.startsWith('url('))).toBe(true);
 }
 await expect(page.locator('#map .place-label').filter({hasText:'Leuchtturm'})).toHaveCount(0);
 await page.locator('#map [data-id="C1"]').click();await expect(page.locator('#map [data-id="C1"]')).toContainText('?');
});
test('actual browser screenshots of final chart graphics',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>scrollTo(0,0));
 await testInfo.attach('final-desktop',{body:await page.screenshot({fullPage:true,type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
 await testInfo.attach('final-chart-detail',{body:await page.locator('#map').screenshot({type:'jpeg',quality:96,scale:'css'}),contentType:'image/jpeg'});
 await page.setViewportSize({width:390,height:844});await page.locator('#map').scrollIntoViewIfNeeded();
 await testInfo.attach('final-mobile',{body:await page.screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
});

test('whole-island center, rust-red Start, visible land outlines and centered margin headings',async({page})=>{
 const island=page.locator('.island-label').filter({hasText:'Tesoro'});
 await expect(island).toHaveAttribute('transform','translate(183 210)');
 const start=page.locator('.start-label');await expect(start).toContainText('Start');
 await expect(start.locator('text')).toHaveAttribute('fill','#8c3e2c');
 await expect(start.locator('rect')).toHaveAttribute('opacity','.62');
 await expect(page.locator('#map [data-id="D4"]')).toHaveAttribute('aria-label','Delta / Blau');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  const headings=await page.locator('[data-margin-side]').evaluateAll(ns=>ns.map(n=>{const b=n.getBBox(),side=n.dataset.marginSide,vertical=side==='top'||side==='bottom';return {center:Number(n.dataset.marginCenter),outer:Number(n.dataset.marginOuter),inner:Number(n.dataset.marginInner),min:vertical?b.y:b.x,max:vertical?b.y+b.height:b.x+b.width};}));
  expect(headings).toHaveLength(20);for(const p of headings){expect(p.center).toBeCloseTo((p.outer+p.inner)/2,5);expect(p.min).toBeGreaterThan(Math.min(p.outer,p.inner));expect(p.max).toBeLessThan(Math.max(p.outer,p.inner));}
  const outlines=await page.locator('.blocked-cell polygon').evaluateAll(ns=>ns.map(n=>({stroke:n.getAttribute('stroke'),width:Number(n.getAttribute('stroke-width')),opacity:Number(n.getAttribute('stroke-opacity')),fill:n.getAttribute('fill')})));
  expect(outlines).toHaveLength(3);expect(outlines.every(p=>p.stroke!=='none'&&p.width===1.05&&p.opacity===.62&&p.fill==='transparent')).toBe(true);
 }
});
