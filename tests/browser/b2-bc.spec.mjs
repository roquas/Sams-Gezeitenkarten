import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
const source=readPlaytestSource('BC'),entries=source.registry.entries;
const url=name=>'/?dev=b2&stock=BC'+(name?'&puzzle='+name:'');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const state=(page,name)=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),name);
test.beforeAll(()=>{
 for(const stock of ['BC','S01','S02'])execFileSync('node',['scripts/export-b2-playtest.mjs','--stock',stock]);
});

test('all eight BC variants render original clues without a solution, and existing stocks remain separate',async({page})=>{
 test.setTimeout(90_000);
 const privateRequests=[];page.on('request',r=>{if(/\/(docs|scripts)\//.test(new URL(r.url()).pathname))privateRequests.push(r.url());});
 await page.goto('/?stock=BC');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 await expect(page.locator('#b2Selection')).toHaveCount(0);
 await page.goto(url());await expect(page.locator('h1')).toHaveText(entries[0].testName);
 await expect(page.locator('#b2Selection label')).toHaveText('B2-Entwicklungsauswahl · Testbestand BC');
 expect(await page.locator('#puzzleSelect option').evaluateAll(options=>options.map(o=>o.value)))
  .toEqual(['model-demo',...entries.map(e=>e.testName)]);
 for(const entry of entries){
  await page.locator('#puzzleSelect').selectOption(entry.testName);
  await expect(page.locator('h1')).toHaveText(entry.testName);
  expect(new URL(page.url()).searchParams.get('stock')).toBe('BC');
  const dto=await (await page.request.get('/.dev/b2-bc/'+entry.testName+'.json')).json();
  const original=source.rows.find(r=>r.candidateId===entry.candidateId);
  expect(dto.puzzle.logic).toEqual(original.definition.logic);
  for(const privateKey of ['solution','proof','diagnosis','strategy','candidateId','sourceTarget']){
   expect(dto[privateKey]).toBeUndefined();expect(dto.puzzle[privateKey]).toBeUndefined();
  }
  await expect(page.locator('#map .route-stroke')).toHaveCount(0);
  await expect(page.locator('#allClues .clue p')).toHaveCount(original.definition.logic.clues.length);
  const texts=await page.locator('#allClues .clue p').evaluateAll(nodes=>nodes.map(node=>{
   const copy=node.cloneNode(true);copy.querySelectorAll('[data-coordinate]').forEach(c=>c.replaceWith(c.dataset.coordinate));return copy.textContent;
  }));
  expect(texts).toEqual(original.definition.logic.clues.map(c=>dto.puzzle.presentation.clueTexts[c.id]));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.reload();await expect(page.locator('h1')).toHaveText(entries.at(-1).testName);
 for(const [query,count] of [['?dev=b2',96],['?dev=b2&stock=S02',97]]){
  await page.goto('/'+query);await expect(page.locator('#puzzleSelect option')).toHaveCount(count);
 }
 await page.goto(url());await expect(page.locator('h1')).toHaveText(entries.at(-1).testName);
 expect(privateRequests).toEqual([]);
});

test('BC reuses notes, undo, saved state and route verification without crossing variant state',async({page})=>{
 test.setTimeout(60_000);
 const [first,second]=entries;
 await page.goto(url(first.testName));await expect(page.locator('h1')).toHaveText(first.testName);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 expect((await state(page,first.testName)).marks).toEqual({'1:A1':'maybe'});
 await page.locator('#undo').click();expect((await state(page,first.testName)).marks).toEqual({});
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.locator('#puzzleSelect').selectOption(second.testName);await expect(page.locator('h1')).toHaveText(second.testName);
 expect((await state(page,second.testName)).marks).toEqual({});
 await page.locator('#undo').click();expect((await state(page,second.testName)).marks).toEqual({});
 await page.locator('#puzzleSelect').selectOption(first.testName);await expect(page.locator('h1')).toHaveText(first.testName);
 expect((await state(page,first.testName)).marks).toEqual({'1:A1':'maybe'});
 const original=source.rows.find(r=>r.candidateId===first.candidateId);
 await page.locator('[data-tool="route"]').first().click();
 for(const id of original.definition.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
});

test('BC rejects names from another stock and explains missing exports',async({page})=>{
 await page.goto(url('B2-S02-M000-A1-R00-V01'));
 await expect(page.locator('#puzzleLoadError')).toContainText('Unbekannter B2-Testname');
 await expect(page.locator('#map .cell')).toHaveCount(0);
 await page.route('**/.dev/b2-bc/manifest.json',route=>route.fulfill({status:404}));
 await page.goto(url());await expect(page.locator('#puzzleLoadError')).toContainText('npm run export:b2 -- --stock BC');
});
