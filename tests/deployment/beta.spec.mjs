import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('packaged landing, direct puzzle links, solved state and JSON export work below the deployment prefix',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('./');await expect(page.getByRole('heading',{name:'Sams Gezeitenkarten',exact:true})).toBeVisible();await expect(page.locator('#landingRules article')).toBeVisible();
 await page.locator('.beta-card').filter({hasText:'Die Probefahrt'}).getByRole('link',{name:'Beginnen',exact:true}).click();await expect(page.locator('#map .cell')).toHaveCount(25);expect(new URL(page.url()).pathname).toContain('/gk/pr38/');
 await page.locator('#routeTool').click();for(const id of ['B5','C5','D5']){await page.locator(`#map .cell[data-id="${id}"]`).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.getByRole('dialog')).toContainText('Richtig gelöst');await page.getByRole('button',{name:'Überspringen / Schließen'}).click();await page.locator('#backToSelection').click();await expect(page.locator('.beta-card').filter({hasText:'Die Probefahrt'})).toContainText('Gelöst');
 await page.locator('#generalFeedback').fill('Paket im Unterverzeichnis');const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Betatest-Feedback exportieren'}).click();const file=await downloading;const data=JSON.parse(readFileSync(await file.path(),'utf8'));expect(data.generalFeedback.comment).toBe('Paket im Unterverzeichnis');expect(data.puzzles[0].solvedAt).toBeTruthy();expect(errors).toEqual([]);
});
test('packaged six-hour default and illustrated rules load from the real public catalog below the prefix',async({page})=>{
 await page.goto('./');await expect(page.locator('.beta-card').first()).toContainText('Die drei Peilungen');
 await page.locator('.beta-card').first().getByRole('link',{name:'Beginnen',exact:true}).click();
 await expect(page.locator('h1')).toHaveText('Die drei Peilungen');await expect(page.locator('#hours [data-hour]:visible')).toHaveCount(6);
 await page.locator('#backToSelection').click();await page.getByRole('link',{name:'Spielregeln lesen',exact:true}).click();
 await expect(page.locator('#landingRulesTitle')).toBeInViewport();
 const rules=page.locator('#landingRules article');await expect(rules.locator('[data-coordinate="C3"]')).toHaveAccessibleName('Gamma / Violett');
 await expect(rules.locator('img')).toHaveCount(4);
 for(const img of await rules.locator('img').all()){await img.scrollIntoViewIfNeeded();expect(await img.evaluate(async e=>{await e.decode();return e.naturalWidth>0;})).toBe(true);}
 expect(new URL(page.url()).pathname).toBe('/gk/pr38/');
});
