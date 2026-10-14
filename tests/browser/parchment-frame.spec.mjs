import {test,expect} from '@playwright/test';

const geometry=page=>page.locator('#map .cell').evaluateAll(ns=>ns.map(n=>({
 id:n.dataset.id,points:n.querySelector('polygon').getAttribute('points'),
 role:n.getAttribute('role'),tabindex:n.getAttribute('tabindex')
})));
const headings=page=>page.locator('[data-margin-side]').evaluateAll(ns=>ns.map(n=>({
 side:n.dataset.marginSide,index:n.dataset.marginIndex,center:n.dataset.marginCenter
})));
test('all variants preserve geometry, coordinates and usable SVG targets',async({page})=>{
 await page.goto('/?frame=legacy');
 const original=await geometry(page),anchors=await headings(page);
 expect(original).toHaveLength(25);expect(anchors).toHaveLength(20);
 for(const mode of ['raster','modular']){
  await page.goto('/?frame='+mode);
  expect(await geometry(page)).toEqual(original);expect(await headings(page)).toEqual(anchors);
  const layers=page.locator('[data-chart-layer]');
  expect(await layers.evaluateAll(ns=>ns.map(n=>n.dataset.chartLayer))).toEqual(['sea','objects','frame']);
  expect(await layers.evaluateAll(ns=>ns.every(n=>getComputedStyle(n).pointerEvents==='none'))).toBe(true);
  if(mode==='raster'){
   const alpha=await page.evaluate(async()=>{
    const img=new Image();img.src=document.querySelector('[data-chart-layer="frame"] image').getAttribute('href');await img.decode();
    const canvas=document.createElement('canvas');canvas.width=563;canvas.height=473;
    const ctx=canvas.getContext('2d');const scale=Math.min(563/img.width,473/img.height);
    ctx.drawImage(img,(563-img.width*scale)/2,(473-img.height*scale)/2,img.width*scale,img.height*scale);
    return [...document.querySelectorAll('#map .cell polygon')].flatMap(n=>n.getAttribute('points').split(' ').map(pair=>{
     const [x,y]=pair.split(',').map(Number);return ctx.getImageData(Math.round(x+37),Math.round(y+44.5),1,1).data[3];
    }));
   });
   expect(Math.max(...alpha)).toBeLessThanOrEqual(1);
  }
  await page.locator('#map [data-id="E3"]').click();
  await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
  await page.evaluate(()=>localStorage.clear());
 }
});

test('desktop and mobile render without errors, clipping or distortion',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 for(const width of [1440,390,320])for(const mode of ['legacy','raster','modular']){
  await page.setViewportSize({width,height:1100});await page.goto('/?frame='+mode);
  await page.waitForSelector('#map .cell');await page.evaluate(()=>document.fonts.ready);
  const map=page.locator('#map');expect(await map.getAttribute('viewBox')).toBe('-37 -44.5 563 473');
  const scale=await map.evaluate(n=>{const m=n.getScreenCTM();return [m.a,m.d];});
  expect(scale[0]).toBeCloseTo(scale[1],6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('[data-margin-side]')).toHaveCount(20);
  const labels=await page.locator('[data-margin-side]').evaluateAll(ns=>ns.map(n=>{const b=n.getBBox();return [b.x,b.y,b.x+b.width,b.y+b.height];}));
  expect(labels.every(([x,y,r,b])=>x>=-37&&y>=-44.5&&r<=526&&b<=428.5)).toBe(true);
  await testInfo.attach(`${mode}-${width}`,{body:await map.screenshot(),contentType:'image/png'});
 }
 expect(errors).toEqual([]);
});
