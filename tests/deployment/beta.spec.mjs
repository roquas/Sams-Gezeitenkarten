import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('packaged landing, direct puzzle links, solved state and JSON export work below the deployment prefix',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('./');await expect(page.getByRole('heading',{name:'Sams Gezeitenkarten',exact:true})).toBeVisible();await expect(page.locator('#landingRules article')).toBeVisible();
 await page.getByRole('link',{name:'Beginnen',exact:true}).click();await expect(page.locator('#map .cell')).toHaveCount(25);expect(new URL(page.url()).pathname).toContain('/gk/pr38/');
 await page.locator('#routeTool').click();for(const id of ['B5','C5','D5']){await page.locator(`#map .cell[data-id="${id}"]`).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.getByRole('dialog')).toContainText('Richtig gelöst');await page.getByRole('button',{name:'Überspringen / Schließen'}).click();await page.locator('#backToSelection').click();await expect(page.locator('.beta-card')).toContainText('Gelöst');
 await page.locator('#generalFeedback').fill('Paket im Unterverzeichnis');const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Betatest-Feedback exportieren'}).click();const file=await downloading;const data=JSON.parse(readFileSync(await file.path(),'utf8'));expect(data.generalFeedback.comment).toBe('Paket im Unterverzeichnis');expect(data.puzzles[0].solvedAt).toBeTruthy();expect(errors).toEqual([]);
});
