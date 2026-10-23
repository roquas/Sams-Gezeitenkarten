import {test,expect} from '@playwright/test';
import fs from 'node:fs';
// Long editorial text is a layout fixture, independent of the optional catalog.
test('long clue text stays readable above the page controls at narrow widths',async({page})=>{
 const dto=JSON.parse(fs.readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
 dto.puzzle.presentation.clueTexts.I='In der ersten Stunde hielten wir Kurs nach Osten. Sam hatte den Kompass sicher verstaut, während Robin die Beobachtung sorgfältig ins Logbuch schrieb. Auch die Kiste mit den Seekarten blieb an Bord; wir fuhren genau eine Etappe weiter.';
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:950});
  const text=page.locator('#clueTrack p'),nav=page.locator('.bordbook .clue-nav'),viewport=page.locator('#clueViewport');
  const [t,n,v]=await Promise.all([text.boundingBox(),nav.boundingBox(),viewport.boundingBox()]);
  expect(t.y+t.height).toBeLessThanOrEqual(n.y+.5);expect(t.x+t.width).toBeLessThanOrEqual(v.x+v.width+.5);
  expect(await text.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 }
});
