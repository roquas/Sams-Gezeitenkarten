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
 await createMapContactSheet({batch:fixture.batch,acceptedIndices:[10,0,9],out:sheet});
});
test.afterAll(()=>fixture?.cleanup());

test('geographic grid toggles every static map without layout or resource changes',async({page},testInfo)=>{
 const errors=[],network=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{requests.push(request.url());if(/^https?:/.test(request.url()))network.push(request.url());});
 await page.goto(pathToFileURL(path.join(sheet,'index.html')).href);
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.querySelectorAll('svg image')].map(async node=>{const image=new Image();image.src=node.href.baseVal;await image.decode();}));
 });
 const toggle=page.getByRole('checkbox',{name:'Hexraster anzeigen'}),grids=page.locator('[data-chart-layer="geography"]');
 await expect(toggle).not.toBeChecked();await expect(grids).toHaveCount(3);
 for(const grid of await grids.all())await expect(grid).toBeHidden();
 await expect(page.getByRole('list',{name:'Legende des Hexrasters'})).toBeVisible();
 const bounds=()=>page.locator('article, article > svg').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height];}));
 const chart=page.locator('article > svg').first();
 const before=await chart.screenshot();
 const beforeBounds=await bounds(),beforeRequests=requests.length;
 await page.evaluate(()=>{
  window.originalResources=[...document.querySelectorAll('svg')].map(svg=>[...svg.children].filter(n=>n.dataset.chartLayer!=='geography'));
  window.originalMarkup=window.originalResources.map(nodes=>nodes.map(n=>n.outerHTML));
  window.svgMutations=[];
  window.svgObserver=new MutationObserver(records=>window.svgMutations.push(...records.map(r=>r.type)));
  document.querySelectorAll('svg').forEach(svg=>window.svgObserver.observe(svg,{subtree:true,childList:true,attributes:true,characterData:true}));
 });
 await toggle.check();
 const accepted=fs.readFileSync(path.join(fixture.batch,'accepted.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 for(const [i,grid] of (await grids.all()).entries()){
  await expect(grid).toBeVisible();await expect(grid.locator('polygon')).toHaveCount(25);
  expect(await grid.evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
  const objects=accepted[[10,0,9][i]].generation.map.objects;
  const actual=await grid.locator('polygon').evaluateAll(nodes=>nodes.map(n=>({cell:n.dataset.cell,category:n.dataset.category,stroke:getComputedStyle(n).stroke,dash:getComputedStyle(n).strokeDasharray,fill:getComputedStyle(n).fill})));
  for(const hex of actual){
   const owner=objects.find(o=>o.cells.includes(hex.cell)),category=owner?(owner.passable?'passable':'blocked'):'water';
   expect(hex.category).toBe(category);
   expect(hex.stroke).toBe({water:'rgb(33, 107, 155)',passable:'rgb(197, 106, 22)',blocked:'rgb(133, 31, 42)'}[category]);
   expect(hex.dash==='none').toBe(category!=='blocked');expect(hex.fill).toBe('none');
  }
 }
 expect(await bounds()).toEqual(beforeBounds);
 expect((await chart.screenshot()).equals(before)).toBeFalsy();
 // A viewport capture preserves the viewport and text metrics during layout checks.
 await page.screenshot({path:testInfo.outputPath('geographic-grid-enabled.png')});
 await toggle.uncheck();
 for(const grid of await grids.all())await expect(grid).toBeHidden();
 expect(await bounds()).toEqual(beforeBounds);
 expect((await chart.screenshot()).equals(before)).toBeTruthy();
 expect(await page.evaluate(()=>{
  const current=[...document.querySelectorAll('svg')].map(svg=>[...svg.children].filter(n=>n.dataset.chartLayer!=='geography'));
  return current.every((nodes,i)=>nodes.every((node,j)=>node===window.originalResources[i][j]&&node.outerHTML===window.originalMarkup[i][j]))&&window.svgMutations.length===0;
 })).toBeTruthy();
 // With the hidden overlay removed, the original rendered chart is pixel-identical.
 await page.locator('article').first().locator('[data-chart-layer="geography"]').evaluate(node=>node.remove());
 expect((await chart.screenshot()).equals(before)).toBeTruthy();
 await expect(page.getByRole('alert')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
 expect(requests.length).toBe(beforeRequests);expect(network).toEqual([]);expect(errors).toEqual([]);
});

test('file contact sheet decodes real art offline with complete coverage',async({page},testInfo)=>{
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{if(/^https?:/.test(request.url()))network.push(request.url());});
 await page.goto(pathToFileURL(path.join(sheet,'index.html')).href);
 await expect(page.locator('article')).toHaveCount(3);
 await expect(page.locator('.status')).toHaveText(['complete','complete','complete']);
 const decoded=await page.evaluate(async()=>{
  const images=[...document.querySelectorAll('svg image')];
  await Promise.all(images.map(async node=>{const image=new Image();image.src=node.href.baseVal;await image.decode();}));
  return images.length;
 });
 expect(decoded).toBeGreaterThan(6);
 await expect(page.locator('#image-errors')).toBeHidden();
 await expect(page.locator('article').nth(0).locator('[data-unillustrated-object]')).toHaveCount(0);
 await expect(page.locator('[data-unillustrated-object]')).toHaveCount(0);
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

test('catalog-compliant images keep accepted indices, attempt indices and original asset rectangles',async({page},testInfo)=>{
 const target=contactBatchFixture({assignmentSeedStart:1000,config:{maxMapAttempts:1}});
 try{
  const out=path.join(target.directory,'sheet'),selection=[11,0,7];
  await createMapContactSheet({batch:target.batch,acceptedIndices:selection,out});
  const accepted=fs.readFileSync(path.join(target.batch,'accepted.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const expected=selection.map(i=>accepted[i]);
  await page.goto(pathToFileURL(path.join(out,'index.html')).href);
  await expect(page.locator('.status')).toHaveText(['complete','complete','complete']);
  await expect(page.locator('[data-unillustrated-object]')).toHaveCount(0);
  for(const [i,row] of expected.entries()){
   const card=page.locator('article').nth(i);
   await expect(card).toHaveAttribute('data-result-index',String(selection[i]));
   await expect(card).toHaveAttribute('data-attempt-index',String(row.index));
   await expect(card).toContainText(row.mapFingerprint);
   await expect(card).toContainText(row.generationSeed+' · Zuordnungsseed '+row.assignmentSeed);
   await expect(card.locator('[data-asset-id]')).toHaveCount(row.assignment.placements.length);
   await card.locator('summary').click();
   for(const p of row.assignment.placements){
    await expect(card.locator('li').filter({hasText:p.assetId})).toContainText('Anker '+p.anchor);
    const image=card.locator('[data-placement-id="'+p.id+'"]');
    await expect(image).toHaveAttribute('data-asset-id',p.assetId);
    await expect(image).not.toHaveAttribute('transform',/.+/);
   }
  }
  await page.evaluate(async()=>{
   await Promise.all([...document.querySelectorAll('svg image')].map(async node=>{const image=new Image();image.src=node.href.baseVal;await image.decode();}));
  });
  await expect(page.getByRole('alert')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  await page.screenshot({path:testInfo.outputPath('catalog-compliant-contact-sheet.png'),fullPage:true});
 }finally{target.cleanup();}
});
