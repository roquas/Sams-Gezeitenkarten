import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
const {registry,rows}=readPlaytestSource();
const first=registry.entries[0],second=registry.entries.find(e=>e.testName!==first.testName&&e.fingerprints.instance===first.fingerprints.instance);
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const state=(page,name)=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),name);
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs']));
test('developer catalog is opt-in; regular entry never requests private or experimental content',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto('/');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 await expect(page.locator('#puzzleSelect option')).toHaveCount(1);
 await expect(page.locator('#b2Selection')).toHaveCount(0);
 expect(requests.some(p=>p.includes('/.dev/')||p.includes('/docs/'))).toBe(false);
});
test('all named variants are selectable; state, undo, radar, clues and penalties stay separate',async({page})=>{
 await page.goto('/?dev=b2');await expect(page.locator('h1')).toHaveText(first.testName);
 await expect(page.locator('#b2Selection')).toBeVisible();
 await expect(page.locator('#puzzleSelect option')).toHaveCount(96);
 expect(await page.locator('#puzzleSelect option').evaluateAll(options=>options.map(o=>o.value))).toEqual(['model-demo',...registry.entries.map(e=>e.testName)]);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 const original=rows.find(r=>r.fingerprints.variant===first.fingerprints.variant);
 await page.locator('[data-tool="route"]').first().click();
 await cell(page,original.definition.solution[1]).focus();await page.keyboard.press('Enter');
 await page.locator('#clueTrack [data-clue]').click();
 await page.locator('#toggleDistances').click();await cell(page,'B2').focus();await page.keyboard.press('Enter');
 await page.locator('#hint').evaluate(n=>n.click());
 expect((await state(page,first.testName)).penalty).toBe(10);
 await page.locator('#puzzleSelect').selectOption(second.testName);await expect(page.locator('h1')).toHaveText(second.testName);
 expect((await state(page,second.testName)).marks).toEqual({});
 expect((await state(page,second.testName)).doneClues).toEqual([]);
 expect((await state(page,second.testName)).distanceMode).toBe(false);
 expect((await state(page,second.testName)).penalty).toBe(0);
 await page.locator('#undo').click();expect((await state(page,second.testName)).marks).toEqual({});
 const source=rows.find(r=>r.fingerprints.variant===second.fingerprints.variant);
 expect((await state(page,second.testName)).route).toEqual([source.definition.logic.start]);
 await expect(page.locator('#verifyStatus')).toBeEmpty();await expect(page.locator('#helpStatus')).toBeEmpty();
 await page.reload();await expect(page.locator('h1')).toHaveText(second.testName);
 await page.locator('#puzzleSelect').selectOption(first.testName);await expect(page.locator('h1')).toHaveText(first.testName);
 expect((await state(page,first.testName)).marks).toEqual({'1:A1':'maybe'});
 expect((await state(page,first.testName)).penalty).toBe(10);
 await page.locator('#puzzleSelect').selectOption('model-demo');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
});
test('target route stays hidden and existing route tool verifies a B2 solution',async({page})=>{
 const original=rows.find(r=>r.fingerprints.variant===first.fingerprints.variant);
 await page.goto('/?dev=b2&puzzle='+first.testName);await expect(page.locator('h1')).toHaveText(first.testName);
 expect((await state(page,first.testName)).route).toEqual([original.definition.logic.start]);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 await expect(page.locator('#verifyStatus')).toBeEmpty();
 const dto=await (await page.request.get('/.dev/b2/'+first.testName+'.json')).json();
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.proof).toBeUndefined();expect(dto.routeSource).toBeUndefined();
 await page.locator('[data-tool="route"]').first().click();
 for(const id of original.definition.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await expect(page.locator('#map .route-stroke')).toHaveCount(6);
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
});
test('all six technical clue types reach the existing bordbook with coordinate markup intact',async({page})=>{
 const seen=new Set();
 for(const row of rows){
  const missing=row.definition.logic.clues.filter(c=>!seen.has(c.type));
  if(!missing.length)continue;
  const binding=registry.entries.find(e=>e.fingerprints.variant===row.fingerprints.variant);
  await page.goto('/?dev=b2&puzzle='+binding.testName);
  await expect(page.locator('h1')).toHaveText(binding.testName);
  const dto=await (await page.request.get('/.dev/b2/'+binding.testName+'.json')).json();
  const actual=await page.locator('#allClues .clue p').evaluateAll(nodes=>nodes.map(n=>{
   const copy=n.cloneNode(true);
   copy.querySelectorAll('[data-coordinate]').forEach(c=>c.replaceWith(c.dataset.coordinate));
   return copy.textContent;
  }));
  expect(actual).toEqual(row.definition.logic.clues.map(c=>dto.puzzle.presentation.clueTexts[c.id]));
  for(const c of row.definition.logic.clues)seen.add(c.type);
  await expect(page.locator('#puzzleLoadError')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(seen.size).toBe(6);
});
test('missing local export reports the export command',async({page})=>{
 await page.route('**/.dev/b2/manifest.json',r=>r.fulfill({status:404}));
 await page.goto('/?dev=b2');await expect(page.locator('#puzzleLoadError')).toContainText('npm run export:b2');
});
test('unknown explicit test name does not silently launch another candidate',async({page})=>{
 await page.goto('/?dev=b2&puzzle=unknown');
 await expect(page.locator('#puzzleLoadError')).toContainText('Unbekannter B2-Testname: unknown');
 await expect(page.locator('#map .cell')).toHaveCount(0);
});
