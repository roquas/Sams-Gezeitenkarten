import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {distance} from '../../src/engine/hex.mjs';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
test.describe.configure({timeout:60000});
const source=readPlaytestSource('S03-V2');
const first=source.registry.entries[0],last=source.registry.entries.at(-1);
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs','--stock','S03-V2']));

test('S03 v2 uses the existing selection, isolated marks, public DTO and solution control',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto('/?stock=S03-V2');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 expect(requests.some(p=>p.includes('/.dev/'))).toBe(false);
 await page.goto('/?dev=b2&stock=S03-V2&puzzle='+first.testName);
 await expect(page.locator('h1')).toHaveText(first.testName);
 await expect(page.locator('#puzzleSelect option')).toHaveCount(source.rows.length+1);
 const cell=id=>page.locator(`#map .cell[data-id="${id}"]`);
 await cell('A1').focus();await page.keyboard.press('Enter');
 const state=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),first.testName);
 expect((await state()).marks).toEqual({'1:A1':'maybe'});
 if(first.testName!==last.testName){
  await page.locator('#puzzleSelect').selectOption(last.testName);await expect(page.locator('h1')).toHaveText(last.testName);
  await page.reload();await expect(page.locator('h1')).toHaveText(last.testName);
  await page.locator('#puzzleSelect').selectOption(first.testName);
  await expect(page.locator('h1')).toHaveText(first.testName);
  expect((await state()).marks).toEqual({'1:A1':'maybe'});
 }
 const dto=await (await page.request.get('/.dev/b2-s03-v2/'+first.testName+'.json')).json();
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.proof).toBeUndefined();expect(dto.signals).toBeUndefined();
 expect(requests.some(p=>p.includes('/docs/')||p.includes('/evidence/'))).toBe(false);
 const row=source.rows.find(r=>r.fingerprints.variant===first.fingerprints.variant);
 await page.locator('[data-tool="route"]').first().click();
 for(const id of row.definition.solution.slice(1)){await cell(id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

const plainText=locator=>locator.evaluate(node=>{
 const copy=node.cloneNode(true);
 copy.querySelectorAll('[data-coordinate]').forEach(c=>c.replaceWith(c.dataset.coordinate));
 return copy.textContent;
});

test('all selected v2 clue texts reach the book and complete list from the actual public export',async({page})=>{
 for(const row of source.rows){
  await page.goto('/?dev=b2&stock=S03-V2&puzzle='+row.testName);
  await expect(page.locator('h1')).toHaveText(row.testName);
  const dto=await (await page.request.get('/.dev/b2-s03-v2/'+row.testName+'.json')).json();
  for(const [i,clue] of row.definition.logic.clues.entries()){
   if(i)await page.locator('#nextClue').click();
   const book=page.locator(`#clueTrack [data-clue="${clue.id}"] p`);
   await expect(book).toBeVisible();
   expect(await plainText(book)).toBe(dto.puzzle.presentation.clueTexts[clue.id]);
   expect(await plainText(page.locator(`#allClues [data-clue="${clue.id}"] p`))).toBe(dto.puzzle.presentation.clueTexts[clue.id]);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('the released multihex radar uses the full footprint of a real v2 exported object',async({page,isMobile})=>{
 const row=source.rows.find(r=>r.definition.logic.map.objects.some(o=>o.cells.length>1));
 expect(row).toBeDefined();
 const object=row.definition.logic.map.objects.find(o=>o.cells.length>1);
 await page.goto('/?dev=b2&stock=S03-V2&puzzle='+row.testName);
 await expect(page.locator('h1')).toHaveText(row.testName);
 const expected=Object.fromEntries(Array.from({length:25},(_,i)=>{
  const cell=String.fromCharCode(65+i%5)+(Math.floor(i/5)+1);
  return [cell,Math.min(...object.cells.map(origin=>distance(cell,origin)))];
 }));
 for(const origin of object.cells){
  const radar=page.locator('#toggleDistances');
  if(await radar.getAttribute('data-distance-state')==='showing')await radar.click();
  await radar.click();await expect(radar).toHaveAttribute('data-distance-state','waiting');
  const cell=page.locator(`#map .cell[data-id="${origin}"]`);
  if(isMobile)await cell.tap();else await cell.click();
  await expect(radar).toHaveAttribute('data-distance-state','showing');
  const values=await page.locator('.distance-value').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.distanceCell,Number(n.dataset.distance)])));
  expect(values).toEqual(expected);
 }
 const state=await page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),row.testName);
 expect(state.marks).toEqual({});expect(state.route).toEqual([row.definition.logic.start]);
});
