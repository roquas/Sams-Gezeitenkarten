import {test,expect} from '../integration/webkit-startup.mjs';
import fs from 'node:fs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {distance} from '../../src/engine/hex.mjs';

// Match the existing model UI suite's budget for cold software-rendered WebKit.
test.describe.configure({timeout:60000});

const demo=JSON.parse(fs.readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const values=page=>page.locator('.distance-value').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.distanceCell,Number(n.dataset.distance)])));
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
async function open(page,dto=demo){
 await page.route('**/puzzles/model-demo.json',route=>route.fulfill({json:dto}));
 await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
async function selectOrigin(page,id,isMobile){
 const radar=page.locator('#toggleDistances');
 if(await radar.getAttribute('data-distance-state')==='showing')await radar.click();
 await radar.click();
 await expect(radar).toHaveAttribute('data-distance-state','waiting');
 if(isMobile)await cell(page,id).tap();else await cell(page,id).click();
 await expect(radar).toHaveAttribute('data-distance-state','showing');
 await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin',id);
 await expect(page.locator('.distance-value')).toHaveCount(25);
}
const objectDistances=(logic,id)=>{
 const rules=createRules(logic);
 return Object.fromEntries(rules.cells.map(cell=>[cell,rules.distanceToPlace(cell,id)]));
};

test('each blocked multihex cell selects the full footprint with correct near and far distances',async({page,isMobile},info)=>{
 await open(page);
 // Independent geometric reference, in row order, including even/odd offsets.
 const expected=Object.fromEntries(createRules(demo.puzzle.logic).cells.map((id,i)=>[id,[
  2,1,1,1,2,
  1,0,0,1,2,
  2,1,1,1,2,
  2,2,2,2,3,
  3,3,3,3,3
 ][i]]));
 expect(objectDistances(demo.puzzle.logic,'o2')).toEqual(expected);
 for(const origin of ['B2','C2']){
  await selectOrigin(page,origin,isMobile);
  expect(await values(page)).toEqual(expected);
 }
 expect((await saved(page)).marks).toEqual({});
 expect((await saved(page)).route).toEqual(['A5']);
 const screenshot=info.outputPath('multihex-radar.png');
 await page.locator('.mapbox').screenshot({path:screenshot});
 await info.attach('multihex-radar',{path:screenshot,contentType:'image/png'});
});

test('passable multihex objects use the same footprint semantics',async({page,isMobile})=>{
 await open(page);
 const expected=objectDistances(demo.puzzle.logic,'o1');
 expect(expected.A5).toBe(0);expect(expected.B5).toBe(0);expect(expected.C5).toBe(1);
 for(const origin of ['A5','B5']){
  await selectOrigin(page,origin,isMobile);
  expect(await values(page)).toEqual(expected);
 }
});

test('adjacent instances with identical artwork and names remain separate radar sources',async({page,isMobile})=>{
 const dto=structuredClone(demo);
 dto.puzzle.logic.map.objects.push({id:'other-island',cells:['D2','E2'],passable:false});
 dto.puzzle.presentation.objectNames['other-island']='Zwilling';
 dto.puzzle.presentation.assetPlacements.push({...dto.puzzle.presentation.assetPlacements[0],id:'other-art',objectId:'other-island',anchor:'D2'});
 await open(page,dto);
 await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
 for(const [id,origins,other] of [['o2',['B2','C2'],'D2'],['other-island',['D2','E2'],'C2']]){
  const expected=objectDistances(dto.puzzle.logic,id);
  expect(expected[other]).toBe(1);
  for(const origin of origins){
   await selectOrigin(page,origin,isMobile);
   expect(await values(page)).toEqual(expected);
  }
 }
});

test('singlehex land, singlehex passable objects and plain sea keep point distances',async({page,isMobile})=>{
 await open(page);
 for(const origin of ['D1','D3','C1']){
  await selectOrigin(page,origin,isMobile);
  expect(await values(page)).toEqual(Object.fromEntries(createRules(demo.puzzle.logic).cells.map(id=>[id,distance(origin,id)])));
 }
});

test('keyboard selection, reload, editing, undo and switching radar off retain the full footprint',async({page,isMobile})=>{
 await open(page);
 if(isMobile)await cell(page,'A1').tap();else await cell(page,'A1').click();
 const before=await saved(page),radar=page.locator('#toggleDistances');
 await radar.click();await cell(page,'C2').focus();await page.keyboard.press('Space');
 const expected=objectDistances(demo.puzzle.logic,'o2');
 expect(await values(page)).toEqual(expected);
 expect((await saved(page)).marks).toEqual(before.marks);
 expect((await saved(page)).route).toEqual(before.route);
 await page.reload();await expect(cell(page,'C2')).toBeVisible();
 expect(await values(page)).toEqual(expected);
 await page.locator('[data-tool="no"]').click();
 if(isMobile)await cell(page,'E5').tap();else await cell(page,'E5').click();
 expect((await saved(page)).marks['1:E5']).toBe('no');
 expect(await values(page)).toEqual(expected);
 await page.locator('#undo').click();expect((await saved(page)).marks).toEqual(before.marks);
 expect(await values(page)).toEqual(expected);
 // Land still cannot be marked or used as a sailing step after selection.
 if(isMobile)await cell(page,'B2').tap();else await cell(page,'B2').click();
 expect((await saved(page)).marks).toEqual(before.marks);
 await page.locator('#routeTool').click();
 if(isMobile)await cell(page,'C2').tap();else await cell(page,'C2').click();
 expect((await saved(page)).route).toEqual(before.route);
 await radar.click();await expect(page.locator('.distance-overlay')).toHaveCount(0);
 await selectOrigin(page,'C1',isMobile);
 expect((await values(page)).B2).toBe(1);expect((await values(page)).C2).toBe(1);
});
