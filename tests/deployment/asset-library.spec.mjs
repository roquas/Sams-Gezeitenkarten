import {test,expect} from '@playwright/test';
import {interceptNewAssets} from '../integration/asset-library.mjs';

test('actual ZIP serves JSON catalog and fixed PNGs through rewritten modules under a subpath',async({page,request},info)=>{
 const response=await request.get('assets/catalog/library.json');expect(response.ok()).toBe(true);
 const library=await response.json();
 expect(library.assets.filter(a=>a.stage==='technical-placeholder')).toHaveLength(4);
 for(const id of ['land-coast.island.h1.basalt-spire.v1','land-coast.island.h1.basalt-spire-water.v1']){
  const asset=library.assets.find(a=>a.id===id);
  expect(asset).toMatchObject({stage:'illustration',passable:false,geometry:{cells:[[0,0]]},image:{width:360,height:408}});
  expect(library.reviews.find(r=>r.assetId===id&&r.backgroundId==='sea-blue-01')?.status).toBe(id==='land-coast.island.h1.basalt-spire-water.v1'?'approved':'pending');
  const png=await request.get(asset.image.path);expect(png.ok()).toBe(true);
  const size=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return [i.naturalWidth,i.naturalHeight];},new URL('../../'+asset.image.path,response.url()).href);
  expect(size).toEqual([360,408]);
 }
 expect(library.reviews.filter(r=>r.status==='approved').map(r=>[r.assetId,r.backgroundId])).toEqual([['land-coast.island.h1.basalt-spire-water.v1','sea-blue-01']]);
 expect(library.reviews.filter(r=>r.status==='pending')).toHaveLength(library.reviews.length-1);
 const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{requests.push(r.url());if(r.status()>=400)errors.push(r.url());});
 await interceptNewAssets(page);await page.goto('./');
 await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
 const sizes=await page.locator('#map [data-placement-id]').evaluateAll(async ns=>Promise.all(ns.map(async n=>{const i=new Image();i.src=n.getAttribute('href');await i.decode();return [i.naturalWidth,i.naturalHeight];})));
 expect(sizes).toEqual([[360,408],[688,408],[360,408],[360,408]]);
 expect(requests.some(u=>u.includes('/gk/pr38/src/assets/library.js'))).toBe(true);
 expect(requests.some(u=>u.endsWith('.mjs'))).toBe(false);
 await page.locator('#map [data-id="D1"]').press('Enter');await expect(page.locator('#map [data-id="D1"]')).toContainText('?');
 await expect(page.locator('#map [data-id="B3"]')).not.toContainText('?');
 await info.attach('packaged-assets-'+info.project.name,{body:await page.locator('#map').screenshot(),contentType:'image/png'});
 expect(errors).toEqual([]);
});
