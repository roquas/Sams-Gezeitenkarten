import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {contactBatchFixture} from '../fixtures/contact-sheet/batch.mjs';
import {createMapContactSheet} from '../../scripts/lib/map-contact-sheet.mjs';
import {CHART_VIEWBOX} from '../../src/ui/chart-geometry.mjs';

let fixture,sheet;
test.beforeAll(async()=>{
 fixture=contactBatchFixture();sheet=path.join(fixture.directory,'sheet');
 await createMapContactSheet({batch:fixture.batch,indices:[10,0,9],out:sheet});
});
test.afterAll(()=>fixture?.cleanup());

test('file contact sheet decodes real art offline with complete, partial and none coverage',async({page},testInfo)=>{
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{if(/^https?:/.test(request.url()))network.push(request.url());});
 await page.goto(pathToFileURL(path.join(sheet,'index.html')).href);
 await expect(page.locator('article')).toHaveCount(3);
 await expect(page.locator('.status')).toHaveText(['complete','partial','none']);
 const decoded=await page.evaluate(async()=>{
  const images=[...document.querySelectorAll('svg image')];
  await Promise.all(images.map(async node=>{const image=new Image();image.src=node.href.baseVal;await image.decode();}));
  return images.length;
 });
 expect(decoded).toBeGreaterThan(6);
 await expect(page.locator('#image-errors')).toBeHidden();
 await expect(page.locator('article').nth(0).locator('[data-unillustrated-object]')).toHaveCount(0);
 expect(await page.locator('article').nth(1).locator('[data-unillustrated-object]').count()).toBeGreaterThan(0);
 await expect(page.locator('article').nth(2).locator('[data-asset-id]')).toHaveCount(0);
 expect(await page.locator('article').nth(2).locator('[data-unillustrated-object]').count()).toBeGreaterThan(0);
 expect(await page.locator('svg').evaluateAll((nodes,viewBox)=>nodes.every(n=>n.getAttribute('viewBox')===viewBox),CHART_VIEWBOX)).toBeTruthy();
 const clipping=await page.locator('svg').evaluateAll(nodes=>nodes.flatMap(svg=>{
  const view=svg.viewBox.baseVal;
  return [...svg.querySelectorAll('[data-asset-id]')].filter(image=>{
   const x=image.x.baseVal.value,y=image.y.baseVal.value,w=image.width.baseVal.value,h=image.height.baseVal.value;
   return x<view.x||y<view.y||x+w>view.x+view.width||y+h>view.y+view.height;
  }).map(n=>n.getAttribute('data-asset-id'));
 }));
 expect(clipping).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
 expect(errors).toEqual([]);expect(network).toEqual([]);
 await page.screenshot({path:testInfo.outputPath('contact-sheet.png'),fullPage:true});
});

test('a resource removed after export produces a visible diagnostic with its original reference',async({page})=>{
 const broken=path.join(fixture.directory,'broken');fs.cpSync(sheet,broken,{recursive:true});
 const file=fs.readdirSync(path.join(broken,'resources'))[0];fs.unlinkSync(path.join(broken,'resources',file));
 await page.goto(pathToFileURL(path.join(broken,'index.html')).href);
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.getByRole('alert')).toContainText('Bildfehler');
 await expect(page.getByRole('alert')).toContainText('assets/');
});
