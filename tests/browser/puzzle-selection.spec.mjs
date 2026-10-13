import {test,expect} from '@playwright/test';
const ref='reference-3.6',other='test-navigation';
const key=id=>`gezeitenkarten-${id}-schema1-data1`;
const saved=(page,id)=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key(id));
async function chart(page){if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();}
async function settings(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(el=>el.closest('details').open=true);
}
async function choose(page,id){await settings(page);await page.locator('#puzzleSelect').selectOption(id);await expect(page.locator('#puzzleStatus')).toContainText('Geladen:');await expect(page.locator('#puzzleSelect')).toBeEnabled();await chart(page);}
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await expect(page.locator('#map .cell')).toHaveCount(25);});
test('switch, reload, isolated notes/routes/overlays, undo and reset',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#map [data-id="E3"]').click();
 await page.locator('#toggleDistances').click();await page.locator('#map [data-id="C1"]').click();
 await choose(page,other);
 await expect(page.locator('h1')).toHaveText('Technischer Testfall – Navigation');
 await expect(page.locator('#map .blocked-cell')).toHaveCount(3);
 await expect(page.locator('#map [data-id="E1"]')).toHaveClass(/blocked-cell/);
 await expect(page.locator('#map [data-place-ring="A1"]')).toHaveCount(2);
 await expect(page.locator('#map [data-place-ring="C1"]')).toHaveCount(0);
 await expect(page.locator('.distance-overlay')).toHaveCount(0);
 await expect(page.locator('#cluePosition')).toHaveText('T1 / T6');
 await page.locator('#map [data-id="B5"]').click();await page.locator('#undo').click();
 expect((await saved(page,other)).marks).toEqual({});
 await page.locator('#map [data-id="B5"]').click();
 await page.locator('#routeTool').click();await page.locator('#map [data-id="B5"]').click();
 await choose(page,ref);expect((await saved(page,ref)).marks['1:E3']).toBe('maybe');
 await expect(page.locator('.distance-overlay')).toHaveCount(1);
 await page.locator('#undo').click();expect((await saved(page,ref)).marks['1:E3']).toBe('maybe');
 await choose(page,other);expect((await saved(page,other)).route).toEqual(['A5','B5']);
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await expect(page.locator('h1')).toHaveText('Technischer Testfall – Navigation');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await settings(page);page.once('dialog',d=>d.accept());await page.locator('#reset').click();
 expect((await saved(page,other)).route).toEqual(['A5']);expect((await saved(page,other)).marks).toEqual({});
 expect((await saved(page,ref)).marks['1:E3']).toBe('maybe');
 await testInfo.attach('puzzle-settings-'+testInfo.project.name,{body:await page.screenshot({type:'jpeg',quality:90,scale:'css'}),contentType:'image/jpeg'});
 await chart(page);await page.locator('.mapbox').scrollIntoViewIfNeeded();
 await testInfo.attach('puzzle-map-'+testInfo.project.name,{body:await page.screenshot({type:'jpeg',quality:90,scale:'css'}),contentType:'image/jpeg'});
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('both manifest puzzles can be solved and verified after repeated switches',async({page})=>{
 for(const [id,route] of [[other,['B5','C5','D5','E5','E4','D4']],[ref,['E3','D2','C2','B2','B1','A1']],[other,['B5','C5','D5','E5','E4','D4']]]){
  await choose(page,id);
  if((await saved(page,id)).route.length===1){await page.locator('#routeTool').click();for(const cell of route)await page.locator(`#map [data-id="${cell}"]`).click();}
  await expect(page.locator('#verify')).toBeEnabled();await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 }
});
test('failed load keeps the previous puzzle and editable state',async({page})=>{
 await page.locator('#map [data-id="E3"]').click();
 await page.route('**/puzzles/test-navigation.json',r=>r.fulfill({status:404,body:'missing'}));
 await settings(page);await page.locator('#puzzleSelect').selectOption(other);
 await expect(page.locator('#puzzleStatus')).toContainText('HTTP 404');await expect(page.locator('#puzzleSelect')).toHaveValue(ref);
 await chart(page);await page.locator('#map [data-id="D3"]').click();
 expect((await saved(page,ref)).marks).toEqual({'1:E3':'maybe','1:D3':'maybe'});
});
test('native select is keyboard operable and text is rendered without executing HTML',async({page})=>{
 await page.route('**/puzzles/test-navigation.json',async route=>{const response=await route.fetch();const data=await response.json();data.presentation.intro=['<img src=x onerror="window.bad=true">'];data.presentation.clues.T1='<img src=x onerror="window.bad=true">';await route.fulfill({json:data});});
 await settings(page);await page.locator('#puzzleSelect').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page.locator('#puzzleSelect')).toHaveValue(other);await expect(page.locator('#puzzleStatus')).toContainText('Geladen:');
 await expect(page.locator('#puzzleStory img')).toHaveCount(0);await expect(page.locator('#allClues img')).toHaveCount(0);expect(await page.evaluate(()=>window.bad)).toBeUndefined();
});
test('legacy state migrates without overwriting it and revision changes reset only the new key',async({page})=>{
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('gezeitenkarten-reference-3.6-v0.1',JSON.stringify({route:['D4','E3'],marks:{'1:E3':'yes'}}));});
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await expect(page.locator('#map .cell')).toHaveCount(25);expect((await saved(page,ref)).route).toEqual(['D4','E3']);
 await page.route('**/puzzles/reference-3.6.json',async route=>{const response=await route.fetch();const data=await response.json();data.dataVersion=2;await route.fulfill({json:data});});
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await expect(page.locator('#map .cell')).toHaveCount(25);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-reference-3.6-schema1-data2')).route)).toEqual(['D4']);
 expect((await saved(page,ref)).route).toEqual(['D4','E3']);
});
test('data-defined four-hour puzzle adapts hours, notes and verification without code changes',async({page})=>{
 await page.route('**/puzzles/test-navigation.json',async route=>{const response=await route.fetch();const d=await response.json();d.logic.steps=4;d.solution=d.solution.slice(0,5);d.logic.clues=d.logic.clues.slice(0,4);d.presentation.clues=Object.fromEntries(Object.entries(d.presentation.clues).slice(0,4));await route.fulfill({json:d});});
 await choose(page,other);await expect(page.locator('#hours [data-hour]:visible')).toHaveCount(4);
 await expect(page.locator('#gameRules')).toContainText('sechs Hexfelder');
 await expect(page.locator('#gameRules')).toContainText('4 Stunden');
 await expect(page.locator('#gameRules')).toContainText('4 Beobachtungen');
 await page.locator('[data-hour="4"]').click();await page.locator('#map [data-id="E5"]').click();expect((await saved(page,other)).marks['4:E5']).toBe('maybe');
 await page.locator('#routeTool').click();for(const id of ['B5','C5','D5','E5'])await page.locator(`#map [data-id="${id}"]`).click();
 await expect(page.locator('#verify')).toBeEnabled();await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await choose(page,ref);await expect(page.locator('#hours [data-hour]:visible')).toHaveCount(6);
});
test('touch marking and clue state belong to the selected puzzle',async({page,isMobile})=>{
 await choose(page,other);await page.locator('[data-tool="yes"]').click();
 const cell=page.locator('#map [data-id="B5"]');if(isMobile)await cell.tap();else await cell.click();
 await page.locator('#checkMarks').evaluate(el=>el.click());expect((await saved(page,other)).penalty).toBe(5);
 await expect(page.locator('#helpStatus')).toContainText('Keine der 1');
 await page.locator('#clueTrack [data-clue="T1"]').click();
 await choose(page,ref);expect((await saved(page,ref)).doneClues).toEqual([]);expect((await saved(page,ref)).penalty).toBe(0);
 await choose(page,other);await expect(page.locator('#clueTrack [data-clue="T1"]')).toHaveAttribute('aria-checked','true');expect((await saved(page,other)).penalty).toBe(5);
});
test('unavailable last-selected file falls back to reference without erasing either save',async({page})=>{
 await choose(page,other);await page.locator('#map [data-id="B5"]').click();
 await page.route('**/puzzles/test-navigation.json',r=>r.fulfill({status:404,body:'missing'}));
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('h1')).toHaveText('Der verschwundene Kompass');await expect(page.locator('#puzzleLoadError')).toContainText('Referenzrätsel bleibt verfügbar');
 expect((await saved(page,other)).marks['1:B5']).toBe('maybe');
});
