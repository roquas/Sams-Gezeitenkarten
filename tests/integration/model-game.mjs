import {test,expect} from './webkit-startup.mjs';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
async function settings(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const details=page.locator('details').filter({has:page.locator('#puzzleSelect')});
 if(!await details.evaluate(n=>n.open))await details.locator('summary').click();
}
async function chart(page){if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();}
export function registerModelTests(url){
 // Cold Linux WebKit also decodes the modern multi-cell illustrations.
 test.describe.configure({timeout:60000});
 test('public puzzle loads with single and multi-cell objects, start and correct label policy',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await expect(page.locator('#map .cell')).toHaveCount(25);await expect(page.locator('#puzzleLoadError')).toBeHidden();
  await expect(page.locator('#map [data-object-id="o1"]')).toHaveCount(2);
  await expect(page.locator('#map [data-object-id="o2"]')).toHaveCount(2);
  await expect(page.locator('#map .blocked-cell')).toHaveCount(3);
  await expect(page.locator('#map [data-placement-id]')).toHaveCount(3);
  await expect(page.locator('#map .island-label')).toHaveCount(2);await expect(page.locator('#map .start-label')).toHaveCount(1);
  await expect(page.locator('#map .island-label')).toContainText(['Zwilling','D1']);
  await expect(page.locator('#map [data-start-marker]')).toHaveCount(1);expect(errors).toEqual([]);
  const dto=await (await page.request.get(new URL('puzzles/model-demo.json',page.url()).href)).json();
  expect(dto.puzzle.solution).toBeUndefined();expect(dto.puzzle.metadata).toBeUndefined();expect(dto.puzzle.generator).toBeUndefined();
 });
 test('route interaction and verification use the new logic; blocked cells cannot be edited',async({page})=>{
  await page.goto(url);await expect(cell(page,'A5')).toBeVisible();
  await page.locator('#routeTool').click();await cell(page,'B2').click();expect((await saved(page)).route).toEqual(['A5']);
  for(const id of ['B5','C5','D5']){await cell(page,id).focus();await page.keyboard.press('Enter');}
  await expect(page.locator('#verify')).toBeEnabled();await page.locator('#verify').click();await expect(page.locator('#verifyStatus')).toContainText('Richtig');
  await page.locator('#routeBack').click();await expect(page.locator('#verify')).toBeDisabled();
  await page.reload();await expect(cell(page,'A5')).toBeVisible();expect((await saved(page)).route).toEqual(['A5','B5','C5']);
 });
 test('notes, independent radar, undo and reset survive the schema change',async({page})=>{
  await page.goto(url);await expect(cell(page,'A5')).toBeVisible();
  await cell(page,'A1').click();await page.locator('#toggleDistances').click();await cell(page,'B2').click();
  await expect(page.locator('#map [data-distance-cell="B2"]')).toHaveText('0');await page.locator('#undo').click();
  expect((await saved(page)).marks).toEqual({});await expect(page.locator('.distance-overlay')).toHaveCount(1);
  await page.locator('#toggleDistances').click();await expect(page.locator('.distance-overlay')).toHaveCount(0);
  await cell(page,'B2').focus();await page.keyboard.press('Space');expect((await saved(page)).marks).toEqual({});
  await cell(page,'A1').click();await page.reload();await expect(cell(page,'A1')).toContainText('?');
  page.once('dialog',d=>d.accept());await page.locator('#reset').evaluate(n=>n.click());expect((await saved(page)).marks).toEqual({});
 });
 test('empty and unavailable optional catalogs give readable startup errors',async({page})=>{
  await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:{schemaVersion:2,defaultId:null,puzzles:[]}}));await page.goto(url);
  await expect(page.locator('#puzzleLoadError')).toContainText('keine Rätsel');await expect(page.locator('#map .cell')).toHaveCount(0);
  await page.unroute('**/puzzles/manifest.json');await page.route('**/puzzles/manifest.json',r=>r.fulfill({status:503,body:'Unavailable'}));await page.reload();await expect(page.locator('#puzzleLoadError')).toContainText('HTTP 503');
 });
 for(const body of [null,'broken image bytes'])test(`missing or damaged object images are diagnosed (${body===null?'404':'invalid bytes'})`,async({page})=>{
  // Discover image name from the fixture package rather than relying on a catalog inventory.
  const library=read('assets/catalog/library.json'),dto=read('puzzles/model-demo.json');
  const asset=library.assets.find(a=>a.id===dto.puzzle.presentation.assetPlacements[0].assetId);
  await page.route('**/'+asset.image.path,r=>r.fulfill({status:body===null?404:200,contentType:'image/png',body:body??''}));
  await page.goto(url);await expect(page.locator('#puzzleLoadError')).toContainText('Kartengrafik fehlt oder ist beschädigt');
 });
 test('a second controlled entry switches and reloads with separate state',async({page})=>{
  const dto=read('puzzles/model-demo.json'),other=structuredClone(dto);other.puzzle.id='second-demo';other.puzzle.presentation.title='Zweite Probefahrt';other.puzzle.logic.start='B5';other.identity.instanceId='inst-second-demo';other.identity.variantId='var-second-demo';
  const manifest=read('puzzles/manifest.json');manifest.puzzles.push({id:'second-demo',title:'Zweite Probefahrt',path:'second-demo.json',kind:'test'});
  await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));await page.route('**/puzzles/second-demo.json',r=>r.fulfill({json:other}));
  await page.goto(url);await expect(cell(page,'A5')).toBeVisible();await cell(page,'A1').click();
  await settings(page);await page.locator('#puzzleSelect').selectOption('second-demo');await chart(page);await expect(page.locator('h1')).toHaveText('Zweite Probefahrt');await expect(page.locator('.start-label')).toHaveAttribute('data-label-cell','B5');await expect(cell(page,'A1')).not.toContainText('?');
  await cell(page,'B1').click();await page.reload();await expect(cell(page,'B1')).toContainText('?');
  await settings(page);await page.locator('#puzzleSelect').selectOption('model-demo');await chart(page);await expect(page.locator('.start-label')).toHaveAttribute('data-label-cell','A5');await expect(cell(page,'A1')).toContainText('?');await expect(cell(page,'B1')).not.toContainText('?');
 });
 test('multi-cell passable illustration uses the same renderer and no permanent name plaque',async({page})=>{
  const dto=read('puzzles/model-demo.json'),library=read('assets/catalog/library.json');
  const a=structuredClone(library.assets.find(a=>a.geometry.cells.length===2));a.id='test.multi-passable';a.passable=true;a.semanticClass='buoy';a.stage='illustration';a.production='enabled';
  // Isolated transport fixture: no claim of an actual artistic production approval.
  library.assets.push(a);library.reviews.push({assetId:a.id,backgroundId:'sea-blue-01',status:'approved',reviewer:'Intercepted test only',date:'2026-10-22',assetSha256:'a'.repeat(64),backgroundSha256:'b'.repeat(64),notes:'Test fixture'});
  dto.puzzle.presentation.assetPlacements.push({id:'multi-port',assetId:a.id,anchor:'A5',objectId:'o1'});dto.puzzle.presentation.objectNames.o1='Testhafen';
  await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));await page.route('**/assets/catalog/library.json',r=>r.fulfill({json:library}));
  await page.goto(url);await expect(page.locator('#map [data-placement-id="multi-port"]')).toHaveAttribute('data-art-cells','A5 B5');
  await expect(page.locator('#map .island-label')).not.toContainText(['Testhafen']);await expect(page.locator('#map [data-legacy-asset]')).toHaveCount(0);
 });
 test('both frame variants preserve marks and responsive geometry',async({page},info)=>{
  await page.goto(url);await expect(cell(page,'A1')).toBeVisible();await cell(page,'A1').click();
  for(const mode of ['quiet','final']){await settings(page);await page.locator('#frameStyle').selectOption(mode);await chart(page);await expect(page.locator('#map')).toHaveAttribute('data-frame-mode',mode);await expect(cell(page,'A1')).toContainText('?');}
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await info.attach('model-demo',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
