import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
import {cluePresentationForm} from '../../scripts/lib/clue-presentation.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
const s01=readPlaytestSource(),s02=readPlaytestSource('S02');
const first=s02.registry.entries[0],second=s02.registry.entries.find(e=>e.testName!==first.testName&&e.fingerprints.instance===first.fingerprints.instance);
const url=name=>'/?dev=b2&stock=S02'+(name?'&puzzle='+name:'');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const state=(page,name)=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),name);
test.beforeAll(()=>{
 execFileSync('node',['scripts/export-b2-playtest.mjs']);
 execFileSync('node',['scripts/export-b2-playtest.mjs','--stock','S02']);
});

test('S02 is explicit, all 96 stable names are selectable, and the regular game ignores stock alone',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto('/?stock=S02');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 expect(requests.some(p=>p.includes('/.dev/')||p.includes('/docs/'))).toBe(false);
 await page.goto(url());await expect(page.locator('h1')).toHaveText(first.testName);
 await expect(page.locator('#b2Selection label')).toHaveText('B2-Entwicklungsauswahl · Testbestand S02');
 await expect(page.locator('#puzzleSelect option')).toHaveCount(97);
 expect(await page.locator('#puzzleSelect option').evaluateAll(options=>options.map(o=>o.value)))
  .toEqual(['model-demo',...s02.registry.entries.map(e=>e.testName)]);
 await page.locator('#puzzleSelect').selectOption(s02.registry.entries.at(-1).testName);
 await expect(page.locator('h1')).toHaveText(s02.registry.entries.at(-1).testName);
 await page.reload();await expect(page.locator('h1')).toHaveText(s02.registry.entries.at(-1).testName);
 expect(new URL(page.url()).searchParams.get('stock')).toBe('S02');
 await page.goto('/?dev=b2');await expect(page.locator('h1')).toHaveText(s01.registry.entries[0].testName);
 await expect(page.locator('#b2Selection label')).toHaveText('B2-Entwicklungsauswahl · Testbestand S01');
 await expect(page.locator('#puzzleSelect option')).toHaveCount(96);
});

test('S01 and S02 state, variant state and selected puzzle remain separate',async({page})=>{
 test.setTimeout(60_000);
 const old=s01.registry.entries[0].testName;
 await page.goto('/?dev=b2&puzzle='+old);await expect(page.locator('h1')).toHaveText(old);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.locator('#hint').evaluate(node=>node.click());
 expect((await state(page,old)).penalty).toBe(10);
 await page.goto(url());await expect(page.locator('h1')).toHaveText(first.testName);
 expect((await state(page,first.testName)).marks).toEqual({});
 expect((await state(page,first.testName)).penalty).toBe(0);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.locator('#puzzleSelect').selectOption(second.testName);await expect(page.locator('h1')).toHaveText(second.testName);
 expect((await state(page,second.testName)).marks).toEqual({});
 await page.locator('#undo').click();expect((await state(page,second.testName)).marks).toEqual({});
 await page.goto('/?dev=b2&puzzle='+old);await expect(page.locator('h1')).toHaveText(old);
 expect((await state(page,old)).marks).toEqual({'1:A1':'maybe'});
 expect((await state(page,old)).penalty).toBe(10);
 const oldSecond=s01.registry.entries.find(entry=>entry.testName!==old).testName;
 await page.locator('#puzzleSelect').selectOption(oldSecond);await expect(page.locator('h1')).toHaveText(oldSecond);
 await page.goto(url());await expect(page.locator('h1')).toHaveText(second.testName);
 await page.locator('#puzzleSelect').selectOption(first.testName);await expect(page.locator('h1')).toHaveText(first.testName);
 expect((await state(page,first.testName)).marks).toEqual({'1:A1':'maybe'});
});

test('S02 public payload hides the target and the existing route tool verifies it',async({page})=>{
 const original=s02.rows.find(r=>r.fingerprints.variant===first.fingerprints.variant);
 await page.goto(url(first.testName));await expect(page.locator('h1')).toHaveText(first.testName);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 const dto=await (await page.request.get('/.dev/b2-s02/'+first.testName+'.json')).json();
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.proof).toBeUndefined();expect(dto.routeSource).toBeUndefined();
 await page.locator('[data-tool="route"]').first().click();
 for(const id of original.definition.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
});

test('all nine actual S02 forms reach the unchanged bordbook texts',async({page})=>{
 test.setTimeout(60_000);const seen=new Set();
 for(const row of s02.rows){
  if(row.definition.logic.clues.every(clue=>seen.has(cluePresentationForm(clue))))continue;
  const binding=s02.registry.entries.find(e=>e.fingerprints.variant===row.fingerprints.variant);
  await page.goto(url(binding.testName));await expect(page.locator('h1')).toHaveText(binding.testName);
  const dto=await (await page.request.get('/.dev/b2-s02/'+binding.testName+'.json')).json();
  const text=await page.locator('#allClues .clue p').evaluateAll(nodes=>nodes.map(node=>{
   const copy=node.cloneNode(true);copy.querySelectorAll('[data-coordinate]').forEach(c=>c.replaceWith(c.dataset.coordinate));
   return copy.textContent;
  }));
  expect(text).toEqual(row.definition.logic.clues.map(clue=>dto.puzzle.presentation.clueTexts[clue.id]));
  for(const clue of row.definition.logic.clues)seen.add(cluePresentationForm(clue));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect([...seen].sort()).toEqual(['CountDistanceNever','HasDistanceAt','NotDistanceAt','countDistanceToPlace',
  'direction','distanceBetweenHours','distanceToPlace','position','turn']);
});

test('unknown stocks, names from another stock and missing exports never silently select a puzzle',async({page})=>{
 await page.goto('/?dev=b2&stock=S03');await expect(page.locator('#puzzleLoadError')).toContainText('Unbekannter B2-Bestand');
 await expect(page.locator('#map .cell')).toHaveCount(0);
 await page.goto(url(s01.registry.entries[0].testName));await expect(page.locator('#puzzleLoadError')).toContainText('Unbekannter B2-Testname');
 await page.route('**/.dev/b2-s02/manifest.json',route=>route.fulfill({status:404}));
 await page.goto(url());await expect(page.locator('#puzzleLoadError')).toContainText('npm run export:b2 -- --stock S02');
});
