import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {catalogProofFixture,project} from '../fixtures/catalog-proof.mjs';
import {createCatalogProof} from '../../scripts/lib/catalog-proof.mjs';

test('offline catalog proof: complete overview, independent overlays, positions, navigation and damaged files',async({page,isMobile})=>{
 test.skip(isMobile,'Desktop review artifact');test.setTimeout(240000);
 const fixture=catalogProofFixture();
 try{
  const out=path.join(fixture.directory,'proof'),result=createCatalogProof({repositoryRoot:project,candidate:fixture.candidate,out});
  const report=JSON.parse(fs.readFileSync(result.report)),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(result.html).href);
  await expect(page.locator('[data-overview-asset]')).toHaveCount(report.selectedCount);
  await expect(page.locator('#image-errors')).toBeHidden();
  for(let i=0;i<report.assets.length;i++){
   await page.locator('[data-open="'+i+'"]').click();
   const article=page.locator('[data-detail="'+i+'"]');await expect(article).toBeVisible();
   await expect(article.locator('code')).toHaveText(report.assets[i].assetId);
   for(let p=0;p<report.assets[i].positions.length;p++){
    await article.locator('select').selectOption(String(p));
    await expect(article.locator('.position:visible svg')).toHaveAttribute('data-anchor',report.assets[i].positions[p].anchor);
   }
   await page.locator('#back').click();
  }
  await page.locator('[data-open="0"]').click();
  const svg=page.locator('[data-detail="0"] .position:visible svg');
  const hexes=svg.locator('[data-gallery-layer="hexes"]'),areas=svg.locator('[data-gallery-layer="footprints"]');
  await expect(hexes).toBeHidden();await expect(areas).toBeHidden();
  await page.locator('#hexes').check();await expect(hexes).toBeVisible();await expect(areas).toBeHidden();
  await page.locator('#footprints').check();await expect(hexes).toBeVisible();await expect(areas).toBeVisible();
  await page.locator('#hexes').uncheck();await expect(hexes).toBeHidden();await expect(areas).toBeVisible();
  await page.locator('#normal').click();await expect(areas).toBeHidden();
  await page.locator('#whole-board').check();await expect(svg).toHaveAttribute('viewBox',await svg.getAttribute('data-board'));
  await page.locator('#whole-board').uncheck();await expect(svg).toHaveAttribute('viewBox',await svg.getAttribute('data-zoom'));
  await expect(page.locator('#previous')).toBeDisabled();await page.locator('#next').click();await expect(page.locator('[data-detail="1"]')).toBeVisible();
  await page.locator('#previous').click();await expect(page.locator('[data-detail="0"]')).toBeVisible();
  await page.locator('#back').click();await page.locator('[data-open="'+(report.selectedCount-1)+'"]').click();await expect(page.locator('#next')).toBeDisabled();
  const image=report.resources.find(r=>r.source!==report.resources[0].source);
  fs.writeFileSync(path.join(out,image.path),'damaged');await page.reload();
  await expect(page.locator('#image-errors')).toBeVisible();await expect(page.locator('.card.failed')).not.toHaveCount(0);
  fs.unlinkSync(path.join(out,report.resources[0].path));await page.reload();await expect(page.locator('#image-errors')).toContainText(report.resources[0].source);
  await expect(page.locator('.card.failed')).toHaveCount(report.selectedCount);
  expect(errors).toEqual([]);expect(remote).toEqual([]);
 }finally{fixture.cleanup();}
});
