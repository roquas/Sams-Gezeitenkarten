import {test,expect} from '@playwright/test';
import {flavorPrototypes} from '../../dev/flavor-prototypes.mjs';

test('flavor round uses complete fixed sprites on actual navigable sea at 1:1 and enlarged, with no place markers',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('/dev/asset-library.html#minigrafiken');
 await expect(page.locator('#flavorComparison svg')).toHaveCount(10);
 await expect(page.locator('#error')).toBeEmpty();
 const geometry=svg=>svg.locator('[data-placement-id]').evaluate(n=>['href','x','y','width','height','transform','clip-path'].map(k=>n.getAttribute(k)));
 for(const p of flavorPrototypes){
  const normal=page.locator('#flavorComparison svg[data-flavor="'+p.key+'"]');
  await expect(normal.locator('[data-chart-layer="sea"] image')).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
  await expect(normal.locator('.blocked-cell,.island-label,[data-place-ring]')).toHaveCount(0);
  const art=normal.locator('[data-placement-id]');
  await expect(art).toHaveAttribute('data-asset-id',p.id);
  await expect(art).toHaveAttribute('width','90');await expect(art).toHaveAttribute('height','102');
  const decoded=await art.evaluate(async n=>{const im=new Image();im.src=n.getAttribute('href');await im.decode();return [im.naturalWidth,im.naturalHeight];});
  expect(decoded).toEqual([360,408]);
  expect(await normal.evaluate(n=>n.getBoundingClientRect().width/n.viewBox.baseVal.width)).toBeCloseTo(1,8);
  await page.locator('#flavorAsset').selectOption(p.key);
  const detail=page.locator('#flavorDetail');
  expect(await geometry(detail)).toEqual(await geometry(normal));
  expect(await detail.evaluate(n=>n.getBoundingClientRect().width/n.viewBox.baseVal.width)).toBeGreaterThan(1);
  await expect(detail.locator('.blocked-cell,.island-label,[data-place-ring]')).toHaveCount(0);
  await page.locator('#reviewAsset').selectOption(p.id);
  await expect(page.locator('#positions [data-asset-id="'+p.id+'"]')).toHaveCount(4);
 }
 const before=await page.locator('#flavorComparison [data-placement-id]').evaluateAll(ns=>ns.map(n=>n.outerHTML));
 await page.locator('#prototypeMarks').check();
 await expect(page.locator('#flavorComparison .route-stroke')).toHaveCount(20);
 await expect(page.locator('#flavorComparison [data-id="B3"] circle')).toHaveCount(60);
 await expect(page.locator('#flavorComparison .blocked-cell,#flavorComparison .island-label,#flavorComparison [data-place-ring]')).toHaveCount(0);
 expect(await page.locator('#flavorComparison [data-placement-id]').evaluateAll(ns=>ns.map(n=>n.outerHTML))).toEqual(before);
 await page.locator('#prototypeMarks').uncheck();await page.locator('#hexes').uncheck();
 for(const svg of await page.locator('#flavorComparison svg').all())await expect(svg.locator('[data-id="B3"] polygon')).toHaveAttribute('visibility','hidden');
 await info.attach('flavor-round-'+info.project.name,{body:await page.locator('#flavorComparison').screenshot(),contentType:'image/png'});
 expect(errors).toEqual([]);
});
