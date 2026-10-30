import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../../docs/reviews/a0-completion-2026-10-30/approval-manifest.json',import.meta.url)));

test('A0 catalog exposes approved variants, descriptive labels and fitting gallery positions',async({page})=>{
 const failed=[];page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)failed.push(r.url());});
 await page.goto('/dev/asset-library.html');
 await expect(page.locator('#fullInventory tr[data-catalog-asset]')).toHaveCount(55);
 await expect(page.locator('#error')).toBeEmpty();
 const productive=await page.locator('#fullInventory tr[data-catalog-asset]').evaluateAll(rows=>rows.filter(r=>r.cells[4].textContent==='Ja').length);
 expect(productive).toBe(33);
 await expect(page.locator('#reviewAsset option')).toHaveCount(55);
 await expect(page.locator('#reviewAsset')).not.toContainText('prison-island-02');
 for(const a of manifest.items){
  await page.selectOption('#reviewAsset',a.id);
  await expect(page.locator('#reviewAsset option:checked')).toContainText(a.title+' · unbefahrbar · 2 Hex · Land/Küste');
  await expect(page.locator('#positions svg')).toHaveCount(4);
  const images=page.locator('#positions [data-gallery-layer="objects"] image');
  await expect(images).toHaveCount(4);
  for(const img of await images.all())await expect(img).toHaveAttribute('href',new URL('/'+a.file,page.url()).href);
  await expect(page.locator('#error')).toBeEmpty();
 }
 await page.waitForLoadState('networkidle');
 expect(failed).toEqual([]);
 await test.info().attach('A0-catalog',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
