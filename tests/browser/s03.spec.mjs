import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';
import {execFileSync} from 'node:child_process';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
const source=readPlaytestSource('S03');
const first=source.registry.entries[0],last=source.registry.entries.at(-1);
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs','--stock','S03']));

test('S03 uses the existing selection, isolated marks, public DTO and solution control',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto('/?stock=S03');await expect(page.locator('h1')).toHaveText('Die Probefahrt');
 expect(requests.some(p=>p.includes('/.dev/'))).toBe(false);
 await page.goto('/?dev=b2&stock=S03&puzzle='+first.testName);
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
  expect((await state()).marks).toEqual({'1:A1':'maybe'});
 }
 const dto=await (await page.request.get('/.dev/b2-s03/'+first.testName+'.json')).json();
 expect(dto.puzzle.solution).toBeUndefined();expect(dto.proof).toBeUndefined();expect(dto.signals).toBeUndefined();
 expect(requests.some(p=>p.includes('/docs/')||p.includes('/evidence/'))).toBe(false);
 const row=source.rows.find(r=>r.fingerprints.variant===first.fingerprints.variant);
 await page.locator('[data-tool="route"]').first().click();
 for(const id of row.definition.solution.slice(1)){await cell(id).focus();await page.keyboard.press('Enter');}
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
