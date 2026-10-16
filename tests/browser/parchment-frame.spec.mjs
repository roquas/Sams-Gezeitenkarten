import {test,expect} from '@playwright/test';

const geometry=page=>page.locator('#map .cell').evaluateAll(ns=>ns.map(n=>({
 id:n.dataset.id,points:n.querySelector('polygon').getAttribute('points'),
 role:n.getAttribute('role'),tabindex:n.getAttribute('tabindex')
})));
const headings=page=>page.locator('[data-margin-side]').evaluateAll(ns=>ns.map(n=>({
 side:n.dataset.marginSide,index:n.dataset.marginIndex,center:n.dataset.marginCenter
})));
test('all variants preserve geometry, coordinates and usable SVG targets',async({page})=>{
 await page.goto('/?frame=legacy');await expect(page.locator('#map .cell')).toHaveCount(25);
 const original=await geometry(page),anchors=await headings(page);
 expect(original).toHaveLength(25);expect(anchors).toHaveLength(20);
 for(const mode of ['raster','modular','final','quiet']){
  await page.goto('/?frame='+mode);await expect(page.locator('#map .cell')).toHaveCount(25);
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
 for(const width of [1440,390,320])for(const mode of ['legacy','raster','modular','final','quiet']){
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

test('both delivered frames load as independent 2252x1892 preview assets',async({page})=>{
 for(const [mode,frameName] of [['final','frame-parchment-02.webp'],['quiet','frame-parchment-01.webp']]){
  const failed=[];
  page.on('pageerror',e=>failed.push(e.message));
  await page.goto('/?frame='+mode);
  await expect(page.locator('#map .cell')).toHaveCount(25);
  expect(await page.locator('#map').getAttribute('data-frame-mode')).toBe(mode);
  const assets=await page.evaluate(async(mode)=>{
   const layers=[...document.querySelectorAll('#map [data-chart-layer="sea"] image,#map [data-chart-layer="frame"] image')].filter(el=>!el.dataset.frameVariant||el.dataset.frameVariant===mode);
   return Promise.all(layers.map(async el=>{
    const href=el.getAttribute('href');const img=new Image();img.src=href;await img.decode();
    return {href,width:img.naturalWidth,height:img.naturalHeight,preserve:el.getAttribute('preserveAspectRatio')};
   }));
  },mode);
  expect(assets).toHaveLength(2);
  expect(assets[0].href).toBe('assets/seekarte/sea-blue-01.webp');
  expect(assets[1].href).toBe('assets/seekarte/'+frameName);
  for(const asset of assets){expect([asset.width,asset.height]).toEqual([2252,1892]);expect(asset.preserve).toBe('xMidYMid meet');}
  await page.locator('#map [data-id="E3"]').click();
  await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
  await page.evaluate(()=>localStorage.clear());
  expect(failed).toEqual([]);
 }
});

for (const width of [1440,390]) test('visible frame choice works at '+width+'px and persists on reload',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width,height:900});
 await page.goto('/');
 const svg=page.locator('#map');
 await expect(svg).toHaveAttribute('data-frame-mode','final');
 const illustrated=page.locator('#map [data-chart-layer="frame"] image[data-frame-variant="final"]');
 const quiet=page.locator('#map [data-chart-layer="frame"] image[data-frame-variant="quiet"]');
 await expect(illustrated).toHaveAttribute('href','assets/seekarte/frame-parchment-02.webp');
 await expect(quiet).toHaveAttribute('href','assets/seekarte/frame-parchment-01.webp');
 await expect(illustrated).toHaveAttribute('visibility','visible');
 await expect(quiet).toHaveAttribute('visibility','hidden');
 await page.locator('#map [data-id="E3"]').click();
 await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
 const geometryBefore=await geometry(page),headingsBefore=await headings(page);
 if(width<881)await page.locator('#logbookTab').click();
 const settings=page.locator('#frameStyle').locator('xpath=ancestor::details[1]');
 await settings.locator('summary').click();
 await expect(settings).toHaveAttribute('open','');
 const picker=settings.locator('#frameStyle');
 await expect(picker).toHaveValue('final');
 await picker.selectOption('quiet');
 await expect(svg).toHaveAttribute('data-frame-mode','quiet');
 await expect(illustrated).toHaveAttribute('visibility','hidden');
 await expect(quiet).toHaveAttribute('visibility','visible');
 await expect(picker).toHaveValue('quiet');
 expect(new URL(page.url()).searchParams.get('frame')).toBe('quiet');
 await expect(page.locator('#map [data-chart-layer="frame"] image')).toHaveCount(2);
 expect(await geometry(page)).toEqual(geometryBefore);
 expect(await headings(page)).toEqual(headingsBefore);
 await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
 if(width<881)await page.locator('#chartTab').click();
 const quietScreenshot=await svg.screenshot({animations:'disabled',scale:'css'});
 await page.reload();
 await expect(svg).toHaveAttribute('data-frame-mode','quiet');
 if(width<881)await page.locator('#logbookTab').click();
 await settings.locator('summary').click();
 await expect(picker).toHaveValue('quiet');
 await picker.selectOption('final');
 await expect(svg).toHaveAttribute('data-frame-mode','final');
 await expect(illustrated).toHaveAttribute('visibility','visible');
 await expect(quiet).toHaveAttribute('visibility','hidden');
 expect(new URL(page.url()).searchParams.get('frame')).toBe('final');
 if(width<881)await page.locator('#chartTab').click();
 const illustratedScreenshot=await svg.screenshot({animations:'disabled',scale:'css'});
 expect(quietScreenshot.equals(illustratedScreenshot)).toBe(false);
 await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
 await page.evaluate(()=>localStorage.clear());
});
test('final-frame sea reaches the full SVG canvas without legacy water clipping',async({page})=>{
 for(const mode of ['final','quiet']){
  await page.goto('/?frame='+mode);
  const sea=page.locator('#map [data-chart-layer="sea"]');
  await expect(sea.locator('image')).toHaveCount(1);
  await expect(sea.locator('clipPath')).toHaveCount(0);
  const image=sea.locator('image');
  await expect(image).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
  await expect(image).not.toHaveAttribute('clip-path',/./);
  await expect(image).toHaveAttribute('preserveAspectRatio','xMidYMid meet');
 }
});

test('delivered frame rasters have visibly different pixels',async({page})=>{
 await page.goto('/');
 // Decode actual WebPs and verify that the 01 and 02 visuals are not identical.
 const differentPixels=await page.evaluate(async()=>{
  async function imageData(url){
   const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=563;canvas.height=473;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,563,473);
   return ctx.getImageData(0,0,563,473).data;
  }
  const [a,b]=await Promise.all([imageData('assets/seekarte/frame-parchment-01.webp'),imageData('assets/seekarte/frame-parchment-02.webp')]);
  let changed=0;
  for(let i=0;i<a.length;i+=4)if(
   Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>30
  )changed++;
  return changed;
 });
 expect(differentPixels).toBeGreaterThan(100);
});
