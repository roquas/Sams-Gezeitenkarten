import {test,expect} from '@playwright/test';
import {coordinateTextMarkup} from '../../src/ui/coordinates.mjs';
const displayed=text=>coordinateTextMarkup(text).replace(/<[^>]*>/g,'');
const ids=['reference-3.6','test-navigation','quittung-nombreo','ankerbuch-tesoro'];
const key=id=>`gezeitenkarten-${id}-schema1-data1`;
const saved=(page,id)=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key(id));
async function chart(page){if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();}
async function settings(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(el=>el.closest('details').open=true);
}
async function choose(page,id){
 await settings(page);await page.locator('#puzzleSelect').selectOption(id);
 await expect(page.locator('#puzzleSelect')).toBeEnabled();await expect(page.locator('#puzzleSelect')).toHaveValue(id);await chart(page);
}
for(const id of ids)test(`packaged ${id}: data, graphics, clues, hint, route and isolated reset`,async({page,request},info)=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 page.on('requestfailed',request=>errors.push(request.url()));
 const data=await (await request.get(`/puzzles/${id}.json`)).json();
 await page.goto('/');await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#puzzleSelect option')).toHaveCount(4);
 expect(await page.locator('#puzzleSelect option').evaluateAll(options=>options.map(o=>o.value))).toEqual(ids);
 await choose(page,id);
 await expect(page.locator('h1')).toHaveText(data.presentation.title);
 await expect.poll(()=>page.locator('#map .place-label').evaluateAll(labels=>labels.every(label=>{
  const text=label.querySelector('text'),rect=label.querySelector('rect');
  return text.getComputedTextLength()<=Number(rect.getAttribute('width'))-5.5;
 }))).toBe(true);
 for(const paragraph of data.presentation.intro)await expect(page.locator('#puzzleStory')).toContainText(paragraph);
 await expect(page.locator('#map .blocked-cell')).toHaveCount(data.logic.blocked.length);
 for(const blocked of data.logic.blocked)await expect(page.locator(`#map [data-id="${blocked}"]`)).toHaveClass(/blocked-cell/);
 for(const [placeId,place] of Object.entries(data.logic.places)){
  if(place.kind==='island')await expect(page.locator('#map')).toContainText(data.presentation.places[placeId]);
  else for(const cell of place.cells)await expect(page.locator(`#map [data-place-ring="${cell}"]`)).toHaveCount(2);
 }
 for(const text of Object.values(data.presentation.clues))await expect(page.locator('#allClues')).toContainText(displayed(text));
 for(const clue of data.logic.clues){
  await expect(page.locator('#clueTrack')).toContainText(displayed(data.presentation.clues[clue.id]));
  await page.locator('#nextClue').click();
 }
 const loaded=await page.evaluate(async id=>{
  const {createPuzzleLoader}=await import('/src/puzzles/loader.mjs');
  const p=await createPuzzleLoader().load(id);
  const {chartOverlays}=await import('/src/ui/chart-art.mjs');
  const expected=chartOverlays(p.overlays).map(o=>o.asset);
  const actual=[...document.querySelectorAll('#map image')].map(i=>i.getAttribute('href'));
  const urls=[...new Set(actual)];
  await Promise.all(urls.map(url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error(url));image.src=url;})));
  return {places:Object.fromEntries(Object.entries(p.places).map(([id,place])=>[id,place.name])),resultTexts:p.resultTexts,art:expected.every(asset=>actual.includes(asset))};
 },id);
 expect(loaded.places).toEqual(data.presentation.places);expect(loaded.art).toBe(true);expect(loaded.resultTexts).toEqual(data.resultTexts??{});
 // Accessible help section lives in the overview on small screens.
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#hint').evaluate(el=>el.closest('details').open=true);await page.locator('#hint').click();
 await expect(page.locator('#helpStatus')).toContainText(data.presentation.hints[0]);
 await chart(page);
 const first=data.solution[1];
 await page.locator('#toggleDistances').click();await page.locator(`#map [data-id="${first}"]`).click();
 await page.locator('[data-tool="maybe"]').click();await page.locator(`#map [data-id="${first}"]`).click();
 await expect(page.locator('.distance-overlay')).toHaveCount(1);
 await page.locator('#routeTool').click();
 for(const cell of data.solution.slice(1))await page.locator(`#map [data-id="${cell}"]`).click();
 await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 expect((await saved(page,id)).route).toEqual(data.solution);
 await page.locator('.mapbox').scrollIntoViewIfNeeded();
 await info.attach(`deployment-${id}-${info.project.name}`,{body:await page.screenshot({type:'jpeg',quality:88,scale:'css'}),contentType:'image/jpeg'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const untouched=id==='test-navigation'?'reference-3.6':'test-navigation';
 await choose(page,untouched);
 await page.locator('#map [data-id="E3"]').click();
 const previous=await saved(page,untouched);
 await choose(page,id);expect((await saved(page,id)).route).toEqual(data.solution);
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('h1')).toHaveText(data.presentation.title);
 await settings(page);page.once('dialog',dialog=>dialog.accept());await page.locator('#reset').click();
 expect((await saved(page,id)).route).toEqual([data.logic.start]);expect((await saved(page,id)).marks).toEqual({});
 expect(await saved(page,untouched)).toEqual(previous);
 expect(errors).toEqual([]);
});
