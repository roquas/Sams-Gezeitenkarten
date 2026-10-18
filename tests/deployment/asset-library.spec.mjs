import {test,expect} from '@playwright/test';
import {interceptNewAssets} from '../integration/asset-library.mjs';

test('actual ZIP serves JSON catalog and fixed PNGs through rewritten modules under a subpath',async({page,request},info)=>{
 const response=await request.get('assets/catalog/library.json');expect(response.ok()).toBe(true);
 const library=await response.json();expect(library.assets).toHaveLength(4);
 expect(library.reviews.every(r=>r.status==='pending')).toBe(true);
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
