import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {readPositiveV2Definition,POSITIVE_V2_ID} from '../../scripts/lib/b2-positive-v2.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
const url='/?dev=b2&stock=POSITIVE-V2&puzzle='+POSITIVE_V2_ID;
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs','--stock','POSITIVE-V2']));

test('positive stock loads public clues, keeps the route hidden and notes undoable and persistent',async({page})=>{
 const definition=readPositiveV2Definition(),privateRequests=[],errors=[];
 page.on('request',r=>{if(/\/(docs|scripts|tests)\//.test(new URL(r.url()).pathname))privateRequests.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 await expect(page.locator('#allClues .clue')).toHaveCount(6);
 await expect(page.locator('#puzzleSelect option')).toHaveCount(2);
 const dto=await (await page.request.get('/.dev/b2-positive-v2/'+POSITIVE_V2_ID+'.json')).json();
 expect(dto.puzzle.logic).toEqual(definition.logic);
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.puzzle.presentation.hints).toEqual([]);
 const state=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),POSITIVE_V2_ID);
 await cell(page,definition.logic.start).focus();await page.keyboard.press('Enter');
 expect(Object.keys((await state()).marks)).toHaveLength(1);
 await page.locator('#undo').click();expect((await state()).marks).toEqual({});
 await cell(page,definition.logic.start).focus();await page.keyboard.press('Enter');
 await page.reload();await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 expect(Object.keys((await state()).marks)).toHaveLength(1);
 await page.locator('#puzzleSelect').selectOption('model-demo');
 await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 await page.locator('#puzzleSelect').selectOption(POSITIVE_V2_ID);
 await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 expect(new URL(page.url()).searchParams.get('stock')).toBe('POSITIVE-V2');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(privateRequests).toEqual([]);expect(errors).toEqual([]);
});

test('existing route verification works and absent positive exports have an actionable error',async({page})=>{
 const definition=readPositiveV2Definition();
 await page.goto(url);await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await page.locator('[data-tool="route"]').first().click();
 for(const id of definition.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await page.route('**/.dev/b2-positive-v2/manifest.json',route=>route.fulfill({status:404}));
 await page.goto(url);await expect(page.locator('#puzzleLoadError')).toContainText('npm run export:b2 -- --stock POSITIVE-V2');
 await expect(page.locator('#map .cell')).toHaveCount(0);
});

test('the documented local intermediate sets fit the existing hour cards and persist',async({page})=>{
 await page.goto(url);await expect(page.locator('h1')).toHaveText('Die drei Peilungen');
 const state=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),POSITIVE_V2_ID);
 const mark=async(hour,id,tool)=>{
  await page.locator(`#hours [data-hour="${hour}"]`).click();
  await page.locator(`[data-tool="${tool}"]`).first().click();
  await cell(page,id).focus();await page.keyboard.press('Enter');
 };
 await mark(5,'D2','yes');await mark(4,'D1','yes');
 for(const id of ['C1','C2'])await mark(3,id,'maybe');
 for(const id of ['C1','B2'])await mark(2,id,'maybe');
 await page.reload();await expect(page.locator('h1')).toHaveText('Die drei Peilungen');
 expect((await state()).marks).toEqual({'5:D2':'yes','4:D1':'yes','3:C1':'maybe','3:C2':'maybe','2:C1':'maybe','2:B2':'maybe'});
 await mark(3,'C1','no');await mark(3,'C2','yes');await mark(6,'E2','yes');
 expect((await state()).marks['3:C1']).toBe('no');
 expect((await state()).marks['3:C2']).toBe('yes');
 expect((await state()).marks['6:E2']).toBe('yes');
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
});
