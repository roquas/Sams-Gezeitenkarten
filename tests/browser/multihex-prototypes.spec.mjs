import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {multihexPrototypes} from '../../dev/multihex-prototypes.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
const library=JSON.parse(fs.readFileSync(new URL('../../assets/catalog/library.json',import.meta.url)));
test('whole multihex sprites use production sea, labels, blocked cells and unchanged geometry in every review position',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('/dev/multihex-prototypes.html');
 const cards=page.locator('#multihexComparison svg');await expect(cards).toHaveCount(6);
 await expect(page.locator('#multihexApproved svg')).toHaveCount(2);
 await expect(page.locator('#error')).toBeEmpty();
 await expect(page.locator('#multihexAsset')).toHaveValue('tesoro');
 const tesoro=page.locator('#multihexComparison svg[data-asset="land-coast.settlement.h4.tesoro.v1"]');
 await expect(tesoro.locator('.blocked-cell')).toHaveCount(4);
 await expect(page.locator('#multihexComparison svg[data-asset*="crab-claw"]')).toHaveCount(0);
 const enlarged=page.locator('#tesoroDetail svg');
 await expect(enlarged).toHaveAttribute('data-asset','land-coast.settlement.h4.tesoro.v1');
 const artGeometry=svg=>svg.locator('[data-placement-id]').evaluate(n=>['href','x','y','width','height','transform','clip-path'].map(k=>n.getAttribute(k)));
 expect(await artGeometry(enlarged)).toEqual(await artGeometry(tesoro));
 await expect(enlarged.locator('.island-label text')).toHaveText('Tesoro');
 await expect(enlarged.locator('.island-label')).toHaveAttribute('visibility','hidden');
 const detailGeometry=await artGeometry(enlarged);
 await page.locator('#detailLabels').check();
 await expect(enlarged.locator('.island-label')).toHaveAttribute('visibility','visible');
 expect(await artGeometry(enlarged)).toEqual(detailGeometry);
 await page.locator('#detailLabels').uncheck();
 await expect(tesoro.locator('.island-label')).toBeVisible();
 if(info.project.name==='chromium')expect(await enlarged.evaluate(n=>n.getBoundingClientRect().width)).toBeGreaterThan(await tesoro.evaluate(n=>n.getBoundingClientRect().width));
 const captions=await page.locator('#multihexComparison figcaption').allTextContents();
 expect(captions.filter(t=>t.endsWith('approved'))).toHaveLength(5);
 expect(captions.filter(t=>t.endsWith('pending'))).toHaveLength(1);
 await expect(page.locator('#clawGeometry svg')).toHaveCount(2);
 for(const version of ['v1','v2']){
  const svg=page.locator('#clawGeometry svg[data-asset="land-coast.island.h4.crab-claw.'+version+'"]');
  await expect(svg.locator('[data-placement-id]')).toHaveCount(1);
  await expect(svg.locator('.blocked-cell')).toHaveCount(4);
  await expect(svg.locator('[data-graphic-footprint] polygon')).toHaveCount(4);
  await expect(svg.locator('[data-placement-id]')).not.toHaveAttribute('clip-path');
 }
 const clawGeometry=()=>page.locator('#clawGeometry [data-placement-id]').evaluateAll(ns=>ns.map(n=>['href','x','y','width','height','transform','clip-path'].map(k=>n.getAttribute(k))));
 const clawBefore=await clawGeometry();await page.locator('#footprint').uncheck();
 for(const g of await page.locator('#clawGeometry [data-graphic-footprint]').all())await expect(g).toHaveAttribute('visibility','hidden');
 expect(await clawGeometry()).toEqual(clawBefore);await page.locator('#footprint').check();
 for(const svg of await page.locator('#multihexComparison svg,#multihexApproved svg').all()){
  const id=await svg.getAttribute('data-asset'),asset=library.assets.find(a=>a.id===id);
  const size=[asset.image.width,asset.image.height],cells=asset.geometry.cells.length;
  await expect(svg.locator('[data-chart-layer="sea"] image')).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
  await expect(svg.locator('[data-placement-id]')).toHaveCount(1);
  await expect(svg.locator('.blocked-cell')).toHaveCount(cells);
  await expect(svg.locator('.island-label')).toHaveCount(1);
  await expect(svg.locator('.island-label image')).toHaveAttribute('href','assets/ui/paper-grain.webp');
  expect((await svg.locator('.island-label').getAttribute('data-label-cells')).split(' ')).toHaveLength(cells);
  const geometry=await svg.locator('[data-placement-id]').evaluate(async n=>{
   const im=new Image();im.src=n.getAttribute('href');await im.decode();
   return {size:[im.naturalWidth,im.naturalHeight],rect:[+n.getAttribute('width'),+n.getAttribute('height')],transform:n.getAttribute('transform'),clip:n.getAttribute('clip-path'),ratio:n.getAttribute('preserveAspectRatio')};
  });
  expect(geometry).toEqual({size,rect:size.map(v=>v/4),transform:null,clip:null,ratio:'xMidYMid meet'});
  expect(await svg.evaluate(n=>{const box=n.viewBox.baseVal,im=n.querySelector('[data-placement-id]');return +im.getAttribute('x')>=box.x&&+im.getAttribute('y')>=box.y&&+im.getAttribute('x')+(+im.getAttribute('width'))<=box.x+box.width&&+im.getAttribute('y')+(+im.getAttribute('height'))<=box.y+box.height;})).toBe(true);
 }
 for(const p of multihexPrototypes){
  await page.locator('#multihexAsset').selectOption(p.key);
  const asset=library.assets.find(a=>a.id===p.id),expected=reviewPositions(asset);
  const positions=page.locator('#multihexPositions svg');await expect(positions).toHaveCount(expected.length);
  for(const position of expected)await expect(page.locator(`#multihexPositions svg[data-anchor="${position.anchor}"]`)).toHaveAttribute('data-parity',position.parity);
  await expect(page.locator('#multihexPositions .island-label')).toHaveCount(expected.length);
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
 await expect(page.locator('#multihexComparison .route-stroke')).toHaveCount(6);
 await expect(page.locator('#multihexComparison [data-place-ring]')).toHaveCount(0);
 await page.locator('#hexes').uncheck();
 for(const svg of await cards.all())await expect(svg.locator('.blocked-cell polygon').first()).toHaveAttribute('visibility','hidden');
 expect(await geometry()).toEqual(original);
 await expect(page.locator('#multihexComparison .island-label')).toHaveCount(6);
 expect(errors).toEqual([]);
 await info.attach('multihex-'+info.project.name,{body:await page.locator('#multihexComparison').screenshot(),contentType:'image/png'});
});
