import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('packaged logbook preserves place action, shared ink checks, keyboard and saved state',async({page})=>{
 const dto=JSON.parse(readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
 dto.puzzle.presentation.clueTexts.I='Zwilling lag fern, als wir in der ersten Stunde nach Osten fuhren.';
 dto.puzzle.presentation.cluePlaceRefs={I:['o2']};
 await page.route('**/puzzles/model-demo.json',route=>route.fulfill({json:dto}));
 await page.goto('./?puzzle=model-demo');await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('.bordbook .book-page-heading')).toHaveCount(0);
 await page.locator('#showCluePlace').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#map .place-label text')).toHaveText(['Zwilling']);
 const clue=page.locator('#clueTrack [data-clue="I"]'),item=page.locator('#allClues [data-clue="I"]');
 await clue.focus();await page.keyboard.press('Space');await expect(item).toHaveAttribute('aria-checked','true');
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const details=page.locator('#allClues').locator('..');
 if(!await details.evaluate(el=>el.open))await details.locator('summary').click();
 await expect(details.locator('summary')).toHaveText('Aus Robins Logbuch');
 await expect(page.locator('#logbook .book-place-action,#logbook .clue-nav')).toHaveCount(0);
 expect(await item.evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
 expect(await item.locator('p').evaluate(el=>getComputedStyle(el).textDecorationLine)).toBe('none');
 await item.focus();await page.keyboard.press('Enter');await expect(clue).toHaveAttribute('aria-checked','false');
 await page.keyboard.press('Space');await expect(clue).toHaveAttribute('aria-checked','true');
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(clue).toHaveAttribute('aria-checked','true');await expect(item).toHaveAttribute('aria-checked','true');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
 expect(saved.doneClues).toEqual(['I']);expect(saved.route).toEqual(['A5']);expect(saved.marks).toEqual({});
});
