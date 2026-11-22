import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';

test.describe.configure({timeout:60000});

const demo=JSON.parse(readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const names=page=>page.locator('#map .place-label text');
async function fixture(page){
 const dto=structuredClone(demo);
 dto.puzzle.presentation.objectNames={o1:'Roberts Boot',o2:'Zwilling'};
 dto.puzzle.presentation.clueTexts.I='Von Roberts Boot aus lag Zwilling in Sicht.';
 dto.puzzle.presentation.cluePlaceRefs={I:['o1','o2']};
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
}
async function download(page){
 const waiting=page.waitForEvent('download');await page.locator('#exportFeedback').click();
 return JSON.parse(readFileSync(await (await waiting).path(),'utf8'));
}
async function picture(page,info,name){
 if(name!=='result')await page.evaluate(()=>window.scrollTo(0,0));
 const path=info.outputPath(`ink-b1-a2b-${name}.png`);
 await page.screenshot({path,animations:'allow'});await info.attach(name,{path,contentType:'image/png'});
}

test('landing navigation and reload retain A2b places, route ink, touch and hover with B1 feedback export',async({page,isMobile},info)=>{
 await fixture(page);await page.goto('/');await expect(page.locator('#landing')).toBeVisible();
 await picture(page,info,'landing');
 await page.getByRole('link',{name:'Beginnen',exact:true}).click();
 await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 await expect(page.locator('.start-glow')).toHaveCount(1);
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 if(isMobile){
  await page.locator('#clueViewport').dispatchEvent('touchstart',{touches:[{identifier:0,clientX:180,clientY:100}]});
  await page.locator('#clueViewport').dispatchEvent('touchend',{changedTouches:[{identifier:0,clientX:80,clientY:102}]});
 }else{
  await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');
 }
 await expect(page.locator('#cluePosition')).toHaveText('II / III');await expect(names(page)).toHaveCount(0);
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 if(isMobile)await cell(page,'A1').tap();else{
  await cell(page,'B2').hover();expect(await cell(page,'B2').locator('polygon').evaluate(n=>getComputedStyle(n).strokeWidth)).toBe('3px');
  await cell(page,'A1').click();
 }
 await expect(cell(page,'A1')).toContainText('?');
 await page.locator('#routeTool').click();await cell(page,'B5').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.route-stroke,.route-direction')).toHaveCount(2);
 await page.locator('#showPlaces').click();await picture(page,info,'game');
 await page.locator('#backToSelection').click();await expect(page.locator('.beta-card')).toContainText('Begonnen');
 const details=page.locator('#feedbackRecords details').first();await details.locator('summary').click();await details.locator('[name=comment]').fill('B1 und A2b gemeinsam geprüft');
 const first=(await download(page)).puzzles[0];expect(first.phases).toHaveLength(1);expect(first.phases[0]).toMatchObject({status:'open',hints:0,noteChecks:0,routeChecks:0});
 await page.getByRole('link',{name:'Fortsetzen',exact:true}).click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 await expect(cell(page,'A1')).toContainText('?');await expect(page.locator('.route-stroke,.route-direction')).toHaveCount(2);
 await page.reload();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);await expect(cell(page,'A1')).toContainText('?');await expect(page.locator('.route-stroke,.route-direction')).toHaveCount(2);
 await page.locator('#backToSelection').click();const last=(await download(page)).puzzles[0];expect(last.phases).toHaveLength(1);expect(last.phases[0].phaseId).toBe(first.phases[0].phaseId);expect(last.feedback.comment).toBe('B1 und A2b gemeinsam geprüft');expect(last.phases[0].activeMs).toBeGreaterThanOrEqual(first.phases[0].activeMs);
});

test('A2b overlays coexist with the B1 result dialog and frozen solved phase export',async({page},info)=>{
 await fixture(page);await page.goto('/');await page.getByRole('link',{name:'Beginnen',exact:true}).click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 await page.locator('#routeTool').click();for(const id of ['B5','C5','D5']){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);
 await page.locator('#verify').click();await expect(page.getByRole('dialog')).toContainText('Richtig gelöst!');await expect(page.locator('#resultTitle')).toBeFocused();
 await page.getByRole('dialog').locator('[name=comment]').fill('Lösung mit Ortsreferenzen');await picture(page,info,'result');await page.getByRole('button',{name:'Feedback speichern',exact:true}).click();
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Bearbeitung beendet');
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);await page.locator('#hint').evaluate(n=>n.click());
 await page.locator('#backToSelection').click();const record=(await download(page)).puzzles[0];expect(record.solvedAt).toBeTruthy();expect(record.feedback.comment).toBe('Lösung mit Ortsreferenzen');expect(record.phases).toHaveLength(1);expect(record.phases[0]).toMatchObject({status:'solved',routeChecks:1,hints:0});
 await page.getByRole('link',{name:'Spielstand ansehen',exact:true}).click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Start']);await expect(page.locator('#betaTime [role="status"]')).toHaveText('Bearbeitung beendet');await expect(page.locator('.route-stroke')).toHaveCount(3);await expect(page.locator('.route-direction')).toHaveCount(3);
});
