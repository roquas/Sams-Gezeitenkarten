import {test,expect} from '@playwright/test';
const keys=['tropical','volcano','archipelago'];
const sizes=[[688,408],[688,768],[912,768]];
test('whole multihex sprites use production sea, labels, blocked cells and unchanged geometry in every review position',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('/dev/multihex-prototypes.html');
 const cards=page.locator('#multihexComparison svg');await expect(cards).toHaveCount(3);
 await expect(page.locator('#error')).toBeEmpty();
 for(const [i,svg] of (await cards.all()).entries()){
  await expect(svg.locator('[data-chart-layer="sea"] image')).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
  await expect(svg.locator('[data-placement-id]')).toHaveCount(1);
  await expect(svg.locator('.blocked-cell')).toHaveCount(i===0?2:3);
  await expect(svg.locator('.island-label')).toHaveCount(1);
  await expect(svg.locator('.island-label image')).toHaveAttribute('href','assets/ui/paper-grain.webp');
  expect((await svg.locator('.island-label').getAttribute('data-label-cells')).split(' ')).toHaveLength(i===0?2:3);
  const geometry=await svg.locator('[data-placement-id]').evaluate(async n=>{
   const im=new Image();im.src=n.getAttribute('href');await im.decode();
   return {size:[im.naturalWidth,im.naturalHeight],rect:[+n.getAttribute('width'),+n.getAttribute('height')],transform:n.getAttribute('transform'),clip:n.getAttribute('clip-path'),ratio:n.getAttribute('preserveAspectRatio')};
  });
  expect(geometry).toEqual({size:sizes[i],rect:sizes[i].map(v=>v/4),transform:null,clip:null,ratio:'xMidYMid meet'});
 }
 for(const key of keys){
  await page.locator('#multihexAsset').selectOption(key);
  const positions=page.locator('#multihexPositions svg');await expect(positions).toHaveCount(4);
  await expect(page.locator('#multihexPositions svg[data-parity="gerade"]')).toHaveCount(2);
  await expect(page.locator('#multihexPositions svg[data-position="Rand"]')).toHaveCount(2);
  await expect(page.locator('#multihexPositions .island-label')).toHaveCount(4);
  for(const svg of await positions.all()){
   const label=svg.locator('.island-label text');
   expect(await label.evaluate(n=>n.getComputedTextLength()<=+n.parentElement.querySelector('rect').getAttribute('width')-6+.1)).toBe(true);
   await expect(svg.locator('[data-placement-id]')).toHaveCount(1);
  }
 }
 const geometry=()=>page.locator('#multihexComparison [data-placement-id]').evaluateAll(ns=>ns.map(n=>['href','x','y','width','height'].map(k=>n.getAttribute(k))));
 const original=await geometry();
 await page.locator('#marks').check();
 await expect(page.locator('#multihexComparison .blocked-cell circle,#multihexPositions .blocked-cell circle')).toHaveCount(0);
 await expect(page.locator('#multihexComparison .blocked-cell text,#multihexComparison .blocked-cell .active-hour-edge')).toHaveCount(0);
 expect(await page.locator('#multihexComparison .cell:not(.blocked-cell) circle').count()).toBeGreaterThan(0);
 await expect(page.locator('#multihexComparison .route-stroke')).toHaveCount(3);
 await expect(page.locator('#multihexComparison [data-place-ring]')).toHaveCount(0);
 await page.locator('#hexes').uncheck();
 for(const svg of await cards.all())await expect(svg.locator('.blocked-cell polygon').first()).toHaveAttribute('visibility','hidden');
 expect(await geometry()).toEqual(original);
 await expect(page.locator('#multihexComparison .island-label')).toHaveCount(3);
 expect(errors).toEqual([]);
 await info.attach('multihex-'+info.project.name,{body:await page.locator('#multihexComparison').screenshot(),contentType:'image/png'});
});
