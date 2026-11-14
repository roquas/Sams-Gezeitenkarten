import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
test.use({...selectionUse,reducedMotion:'reduce'});

const examples=[
 ['S01','B2-S01-M000-A3-R00-V01',[
  ['H1','Von Stunde 1 bis Stunde 4 war das Schiff genau einmal genau 6 Hexfelder von dem Ort geo-03 (E4) entfernt.'],
  ['H2','Von Stunde 5 bis Stunde 6 war das Schiff in jeder Stunde genau 2 Hexfelder von dem Ort geo-04 (D3) entfernt.']]],
 ['S02','B2-S02-M000-A1-R00-V02',[
  ['H1','Von Stunde 1 bis Stunde 6 war das Schiff nie genau 2 Hexfelder von dem Ort geo-03 (A5) entfernt.'],
  ['H2','In Stunde 6 war das Schiff neben dem Ort geo-02 (C1, D1).']]],
 ['BC','B2-BC-T02-M017-A4-R00',[
  ['H1','Von Stunde 2 bis Stunde 3 war das Schiff nie neben dem Ort geo-03 (A4).'],
  ['H2','Von Stunde 1 bis Stunde 5 war das Schiff genau einmal genau 2 Hexfelder von dem Ort geo-02 (D1, E1, E2) entfernt.'],
  ['H3','Von Stunde 0 bis Stunde 4 war das Schiff genau zweimal genau 3 Hexfelder von dem Ort geo-02 (D1, E1, E2) entfernt.']]]
];

// Coordinates render as individual spans. Restore their logical labels when
// comparing the complete sentence in the list and the visible book page.
const plainText=locator=>locator.evaluate(node=>{
 const copy=node.cloneNode(true);
 copy.querySelectorAll('[data-coordinate]').forEach(c=>c.replaceWith(c.dataset.coordinate));
 return copy.textContent;
});

for(const [stock,name,clues] of examples)test(`${stock}: natural count sentences render in both bordbook views`,async({page})=>{
 execFileSync('node',['scripts/export-b2-playtest.mjs','--stock',stock]);
 await page.goto(`/?dev=b2&stock=${stock}&puzzle=${name}`);
 await expect(page.locator('h1')).toHaveText(name);
 for(const [index,[id,text]] of clues.entries()){
  if(index)await page.locator('#nextClue').click();
  const book=page.locator(`#clueTrack [data-clue="${id}"] p`);
  await expect(book).toBeVisible();
  expect(await plainText(book)).toBe(text);
  expect(await plainText(page.locator(`#allClues [data-clue="${id}"] p`))).toBe(text);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
