import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {readPositiveDefinition,POSITIVE_ID} from '../../scripts/lib/b2-positive.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
const url='/?dev=b2&stock=POSITIVE&puzzle='+POSITIVE_ID;
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs','--stock','POSITIVE']));

test('positive stock loads public clues, keeps the route hidden and notes undoable and persistent',async({page})=>{
 const definition=readPositiveDefinition(),privateRequests=[],errors=[];
 page.on('request',r=>{if(/\/(docs|scripts|tests)\//.test(new URL(r.url()).pathname))privateRequests.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 await expect(page.locator('#allClues .clue')).toHaveCount(5);
 await expect(page.locator('#puzzleSelect option')).toHaveCount(2);
 const dto=await (await page.request.get('/.dev/b2-positive/'+POSITIVE_ID+'.json')).json();
 expect(dto.puzzle.logic).toEqual(definition.logic);
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.puzzle.presentation.hints).toEqual([]);
 const state=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),POSITIVE_ID);
 await cell(page,definition.logic.start).focus();await page.keyboard.press('Enter');
 expect(Object.keys((await state()).marks)).toHaveLength(1);
 await page.locator('#undo').click();expect((await state()).marks).toEqual({});
 await cell(page,definition.logic.start).focus();await page.keyboard.press('Enter');
 await page.reload();await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 expect(Object.keys((await state()).marks)).toHaveLength(1);
 await page.locator('#puzzleSelect').selectOption('model-demo');
 await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 await page.locator('#puzzleSelect').selectOption(POSITIVE_ID);
 await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await expect(page.locator('#map .route-stroke')).toHaveCount(0);
 expect(new URL(page.url()).searchParams.get('stock')).toBe('POSITIVE');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(privateRequests).toEqual([]);expect(errors).toEqual([]);
});

test('existing route verification works and absent positive exports have an actionable error',async({page})=>{
 const definition=readPositiveDefinition();
 await page.goto(url);await expect(page.locator('h1')).toHaveText(definition.presentation.title);
 await page.locator('[data-tool="route"]').first().click();
 for(const id of definition.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await page.route('**/.dev/b2-positive/manifest.json',route=>route.fulfill({status:404}));
 await page.goto(url);await expect(page.locator('#puzzleLoadError')).toContainText('npm run export:b2 -- --stock POSITIVE');
 await expect(page.locator('#map .cell')).toHaveCount(0);
});
