import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const demo=read('puzzles/model-demo.json');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const labels=page=>page.locator('#map .reference-label');
const names=page=>labels(page).locator('text');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
function fixture(){
 const dto=structuredClone(demo),p=dto.puzzle;
 p.presentation.objectNames={o1:'Roberts Boot',o2:'Zwilling',o4:'Kiste'};
 // The first clue explicitly names two places in its editorial wording.
 p.presentation.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';
 p.presentation.cluePlaceRefs={I:['o1','o2']};
 // Existing structured placeId, independent of editorial metadata.
 p.logic.clues.splice(1,0,{id:'Ort',type:'distanceToPlace',hour:0,placeId:'o4',distance:4});
 p.presentation.clueTexts.Ort='Bei der Abfahrt waren wir vier Hexfelder von Kiste entfernt.';
 return dto;
}
async function open(page,dto=fixture()){
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
test('initial clue shows exactly its explicit places on first start and saved-game reload',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.reload();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 expect((await saved(page)).marks).toEqual({'1:A1':'maybe'});
 await expect(cell(page,'A1')).toContainText('?');
});
test('navigation replaces references, checkboxes do not retrigger, and a clue without references clears immediately',async({page})=>{
 await open(page);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling']);
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Kiste']);
 // Check off the current clue via keyboard. The visible group stays the same.
 await page.locator('.place-references').evaluate(n=>window.referenceGroup=n);
 await page.locator('#clueTrack [data-clue]').focus();await page.keyboard.press('Space');
 expect(await page.locator('.place-references').evaluate(n=>n===window.referenceGroup)).toBe(true);
 await expect(page.locator('#clueTrack [data-clue]')).toHaveAttribute('aria-checked','true');
 await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#cluePosition')).toHaveText('II / III');await expect(labels(page)).toHaveCount(0);
 await page.keyboard.press('ArrowLeft');await expect(names(page)).toHaveText(['Kiste']);
});
test('manual action shows each named instance once, including passable hexes, excludes unnamed and flavor art',async({page,isMobile},info)=>{
 const dto=fixture(),library=read('assets/catalog/library.json');
 // Isolated transport fixture; this is no production approval of flavor art.
 const flavor=structuredClone(library.assets.find(a=>a.role==='decoration'&&a.stage==='illustration'&&a.geometry.cells.length===1));
 flavor.id='test.flavor';flavor.production='enabled';library.assets.push(flavor);
 library.reviews.push({assetId:flavor.id,backgroundId:'sea-blue-01',status:'approved',reviewer:'Intercepted test only',date:'2026-11-20',assetSha256:'a'.repeat(64),backgroundSha256:'b'.repeat(64),notes:'Test fixture'});
 dto.puzzle.presentation.assetPlacements.push({id:'flavor',assetId:flavor.id,anchor:'E4'});
 await page.route('**/assets/catalog/library.json',r=>r.fulfill({json:library}));
 await open(page,dto);
 await page.locator('#showPlaces').focus();await page.keyboard.press('Enter');
 await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 await expect(page.locator('[data-label-object="o1"]')).toHaveAttribute('data-label-cells','A5 B5');
 await expect(page.locator('[data-label-object="o2"]')).toHaveAttribute('data-label-cells','B2 C2');
 await expect(page.locator('[data-label-object="o4"]')).toHaveAttribute('data-label-cells','D3');
 await expect(page.locator('[data-placement-id="flavor"]')).toHaveCount(1);
 await expect(page.locator('[data-label-object="o3"]')).toHaveCount(0);
 const positions=await labels(page).evaluateAll(ns=>ns.map(n=>({id:n.dataset.labelObject,x:n.transform.baseVal.getItem(0).matrix.e,y:n.transform.baseVal.getItem(0).matrix.f})));
 expect(positions).toEqual([{id:'o1',x:101,y:328},{id:'o2',x:224,y:124},{id:'o4',x:306,y:192}]);
 await page.waitForTimeout(500);
 const path=info.outputPath('place-references-'+(isMobile?'mobile':'desktop')+'.png');
 await page.locator('.mapbox').screenshot({path,scale:'css'});
 await page.locator('#mapActions').screenshot({path:info.outputPath('place-actions-'+(isMobile?'mobile':'desktop')+'.png'),scale:'css'});await info.attach('multiple places including multihex',{path,contentType:'image/png'});
});
test('normal fade completes, removes all place names, and restores the ordinary chart',async({page})=>{
 await open(page);await page.locator('#showPlaces').click();
 await page.waitForTimeout(650);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 expect(await page.locator('.place-references').evaluate(n=>+getComputedStyle(n).opacity)).toBe(1);
 await page.waitForTimeout(3300);
 const fading=await page.locator('.place-references').evaluate(n=>+getComputedStyle(n).opacity);expect(fading).toBeGreaterThan(0);expect(fading).toBeLessThan(1);
 await expect(labels(page)).toHaveCount(0,{timeout:3500});await expect(page.locator('.place-references')).toHaveCount(0);
 await expect(page.locator('.start-label')).toHaveText('Start');await expect(page.locator('[data-start-marker]')).toHaveCount(1);
});
test('rapid manual and clue triggers replace one animation and restart its complete lifetime',async({page,browserName})=>{
 // CI traces show native WebKit clicks consuming 1.5–3 s each; the full
 // lifecycle plus eight triggers needs more than the default 30 s in total.
 // Keep the 3.5 s disappearance deadline and every behavioral assertion.
 if(browserName==='webkit')test.setTimeout(60_000);
 await open(page);await page.locator('#showPlaces').click();await page.waitForTimeout(2200);
 for(let i=0;i<4;i++){await page.locator('#nextClue').click();await page.locator('#showPlaces').click();}
 await expect(page.locator('.place-references')).toHaveCount(1);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 await page.waitForTimeout(3400);await expect(labels(page)).toHaveCount(3);
 // Old completions must not remove this newer group; no animation backlog remains.
 await expect(labels(page)).toHaveCount(0,{timeout:3500});
 expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
});
test('reduced motion is immediate but still expires and does not retrigger on ordinary renders',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);
 expect(await page.locator('.place-references').evaluate(n=>+getComputedStyle(n).opacity)).toBe(1);
 await page.waitForTimeout(1800);await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await expect(labels(page)).toHaveCount(0,{timeout:2200});
 await page.locator('#showPlaces').click();await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
 await expect(labels(page)).toHaveCount(0,{timeout:4000});
});
test('overlay passes pointer and keyboard operations through, preserves route, radar, marks, undo and persistence',async({page,isMobile,browserName})=>{
 // Allow the complete sequence of native actions on software-rendered WebKit.
 // Individual assertions retain their existing timeouts.
 if(browserName==='webkit')test.setTimeout(60_000);
 await open(page);const before=await saved(page);
 if(isMobile)await page.locator('#showPlaces').tap();else await page.locator('#showPlaces').click();
 expect(await saved(page)).toEqual(before);await expect(page.locator('#showPlaces')).not.toHaveAttribute('aria-pressed',/./);
 // Kiste's plaque covers D3; the tap still reaches its actual hex.
 if(isMobile)await cell(page,'D3').tap();else await cell(page,'D3').click();
 expect((await saved(page)).marks).toEqual({'1:D3':'maybe'});
 await page.locator('#undo').click();expect((await saved(page)).marks).toEqual({});
 await page.locator('#routeTool').click();await cell(page,'B5').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.route-stroke')).toHaveCount(1);await expect(page.locator('.route-direction')).toHaveCount(1);
 await page.locator('#toggleRouteNumbers').click();await expect(page.locator('.route-numbers')).toHaveCount(1);
 await page.locator('#toggleDistances').click();await cell(page,'B2').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.distance-value')).toHaveCount(25);await expect(page.locator('[data-distance-cell="C2"]')).toHaveText('0');
 await page.locator('#showPlaces').click();
 await expect(page.locator('.route-stroke')).toHaveCount(1);await expect(page.locator('.route-direction')).toHaveCount(1);
 const geometry=await page.locator('.place-references').evaluate(n=>({events:getComputedStyle(n).pointerEvents,last:n===n.parentNode.lastElementChild,focusable:n.querySelectorAll('[tabindex],a,button').length}));
 expect(geometry).toEqual({events:'none',last:true,focusable:0});
 await page.locator('#routeBack').click();
 await expect.poll(()=>saved(page)).toMatchObject({route:['A5'],distanceOrigin:'B2',marks:{}});
 await expect(page.locator('.route-stroke')).toHaveCount(0);
 await page.locator('#undo').click();
 await expect.poll(()=>saved(page)).toMatchObject({route:['A5','B5'],distanceOrigin:'B2',marks:{}});
 await expect(page.locator('.route-stroke')).toHaveCount(1);
 const state=await saved(page);expect(state.route).toEqual(['A5','B5']);expect(state.distanceOrigin).toBe('B2');expect(state.marks).toEqual({});
 expect(Object.keys(state).some(k=>/place|overlay|reference/i.test(k))).toBe(false);
});
test('land receives the same mouse hover contour but remains blocked except for radar origins',async({page,isMobile})=>{
 test.skip(isMobile,'Mouse hover is deliberately absent on touch devices.');
 await open(page);await cell(page,'A1').hover();
 const water=await cell(page,'A1').locator('polygon').evaluate(n=>({stroke:getComputedStyle(n).stroke,width:getComputedStyle(n).strokeWidth}));
 await cell(page,'B2').hover();expect(await cell(page,'B2').locator('polygon').evaluate(n=>({stroke:getComputedStyle(n).stroke,width:getComputedStyle(n).strokeWidth}))).toEqual(water);
 expect(water.width).toBe('3px');
 await cell(page,'B2').click();await cell(page,'B2').focus();await page.keyboard.press('Space');expect((await saved(page)).marks).toEqual({});
 await page.locator('#routeTool').click();await cell(page,'B2').click();expect((await saved(page)).route).toEqual(['A5']);
 await page.locator('#toggleDistances').click();await cell(page,'B2').click();await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','B2');
});
test('puzzle selection cancels old labels and starts the new initial clue, including saved state',async({page})=>{
 const first=fixture(),other=structuredClone(first),manifest=read('puzzles/manifest.json');
 other.puzzle.id='other-demo';other.puzzle.presentation.title='Andere Karte';
 other.identity.instanceId='inst-other-demo';other.identity.variantId='var-other-demo';
 other.puzzle.presentation.cluePlaceRefs.I=['o4'];
 manifest.puzzles.push({id:'other-demo',title:'Andere Karte',path:'other-demo.json',kind:'test'});
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));
 await page.route('**/puzzles/other-demo.json',r=>r.fulfill({json:other}));
 await open(page,first);await page.locator('#showPlaces').click();
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(n=>n.closest('details').open=true);
 await page.locator('#puzzleSelect').selectOption('other-demo');
 await expect(page.locator('h1')).toHaveText('Andere Karte');await expect(names(page)).toHaveText(['Kiste']);
 await page.reload();await expect(names(page)).toHaveText(['Kiste']);
});
test('touch swipe replaces the displayed hint references without marking or checking a clue',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch navigation is checked on the mobile project.');
 await open(page);
 await page.locator('#clueViewport').dispatchEvent('touchstart',{touches:[{identifier:0,clientX:180,clientY:100}]});
 await page.locator('#clueViewport').dispatchEvent('touchend',{changedTouches:[{identifier:0,clientX:80,clientY:102}]});
 await expect(page.locator('#cluePosition')).toHaveText('Ort / III');await expect(names(page)).toHaveText(['Kiste']);
 expect((await saved(page)).doneClues).toEqual([]);expect((await saved(page)).marks).toEqual({});
});
