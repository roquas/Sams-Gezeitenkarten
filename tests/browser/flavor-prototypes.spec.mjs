import {test,expect} from '@playwright/test';
import {flavorPrototypes,passableSmallPlaces,freeMotifReviewPages} from '../../dev/asset-curation.mjs';

test('flavor round uses complete fixed sprites on actual navigable sea at 1:1 and enlarged, with no place markers',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('/dev/asset-library.html#minigrafiken');
 await expect(page.locator('#flavorComparison svg')).toHaveCount(8);
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
 await expect(page.locator('#flavorComparison .route-stroke')).toHaveCount(16);
 await expect(page.locator('#flavorComparison [data-id="B3"] circle')).toHaveCount(48);
 await expect(page.locator('#flavorComparison .blocked-cell,#flavorComparison .island-label,#flavorComparison [data-place-ring]')).toHaveCount(0);
 expect(await page.locator('#flavorComparison [data-placement-id]').evaluateAll(ns=>ns.map(n=>n.outerHTML))).toEqual(before);
 await page.locator('#prototypeMarks').uncheck();await page.locator('#hexes').uncheck();
 for(const svg of await page.locator('#flavorComparison svg').all())await expect(svg.locator('[data-id="B3"] polygon')).toHaveAttribute('visibility','hidden');
 await info.attach('flavor-round-'+info.project.name,{body:await page.locator('#flavorComparison').screenshot(),contentType:'image/png'});
 expect(errors).toEqual([]);
});


test('six approved reference places, sparse review maps and complete inventory keep the three editorial meanings separate',async({page})=>{
 await page.goto('/dev/asset-library.html#minigrafiken');
 await expect(page.locator('#smallPlacesComparison svg')).toHaveCount(6);
 for(const p of passableSmallPlaces){
  const svg=page.locator('#smallPlacesComparison svg[data-flavor="'+p.key+'"]');
  await expect(svg.locator('[data-placement-id]')).toHaveAttribute('data-asset-id',p.id);
  await expect(svg.locator('.blocked-cell,.island-label,[data-place-ring]')).toHaveCount(0);
  await expect(svg.locator('..')).toContainText('approved');
  expect(await page.locator('#usageAsset-named-passable option').evaluateAll(ns=>ns.map(n=>n.value))).toContain(p.id);
  expect(await page.locator('#usageAsset-flavor option').evaluateAll(ns=>ns.map(n=>n.value))).not.toContain(p.id);
 }
 expect(await page.locator('#usageAsset-flavor option').evaluateAll(ns=>ns.map(n=>n.value))).toEqual(flavorPrototypes.map(p=>p.id));
 for(let i=0;i<freeMotifReviewPages.length;i++){
  await page.locator('#flavorMapPage').selectOption(String(i));
  await expect(page.locator('#flavorMap [data-placement-id]')).toHaveCount(freeMotifReviewPages[i].length);
  expect(await page.locator('#flavorMap [data-placement-id]').count()).toBeLessThanOrEqual(3);
  await expect(page.locator('#flavorMap .blocked-cell,#flavorMap .island-label,#flavorMap [data-place-ring]')).toHaveCount(0);
 }
 await expect(page.locator('#minigrafiken svg [data-asset-id="sea-life.accent.h1.turtle.v1"]')).toHaveCount(0);
 await expect(page.locator('#minigrafiken svg [data-asset-id="sea-life.accent.h1.gulls.v1"]')).toHaveCount(0);
 await expect(page.locator('#minigrafiken svg [data-asset-id="sea-life.accent.h1.dolphins.v1"]')).toHaveCount(0);
 await page.locator('#allAssets summary').click();
 await expect(page.locator('#fullInventory tr[data-catalog-asset]')).toHaveCount(40);
 const turtle=page.locator('#fullInventory tr[data-catalog-asset="sea-life.accent.h1.turtle.v1"]');
 await expect(turtle).toContainText('Zurückgestellt');await expect(turtle).toContainText('pending');
 const barrel=page.locator('#fullInventory tr[data-catalog-asset="sea-life.accent.h1.barrels.v1"]');
 await expect(barrel).toContainText('Befahrbarer Ort');await expect(barrel).toContainText('geographic');await expect(barrel).toContainText('approved');
 await page.locator('#background').selectOption('prototype-sea');await expect(barrel).toContainText('pending');
 await expect(page.locator('#fullInventoryStatus')).toContainText('prototype-sea');
 await expect(page.locator('#error')).toBeEmpty();
});
