import {test,expect,selectionUse} from '../integration/webkit-startup.mjs';

test.use({...selectionUse,reducedMotion:'reduce'});
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
const withoutHelp=({help,...state})=>state;
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
// Initial module loading/compilation can exceed the default assertion timeout.
const ready=page=>expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
async function chart(page){if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();}
async function help(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const details=page.locator('details').filter({has:page.locator('#checkMarks')});
 if(!await details.evaluate(n=>n.open))await details.locator('summary').click();
}
async function mark(page,hour,id,tool){
 await chart(page);
 await page.locator(`[data-hour="${hour}"]`).click();
 await page.locator(`[data-tool="${tool}"]`).first().click();
 await cell(page,id).focus();await page.keyboard.press('Enter');
}
async function undo(page){await chart(page);await page.locator('#undo').click();}
async function noCheck(page){
 await help(page);await page.locator('#checkMarks').click();
 await expect(page.locator('#helpStatus')).toHaveText('Es gibt noch keine eindeutigen Markierungen zum Prüfen.');
 await expect(page.locator('#helpStatus .success')).toHaveCount(0);
}
test.beforeEach(async({page})=>{
 await page.goto('/');await ready(page);
});

test('empty repeated note checks are free and persist no game changes',async({page})=>{
 const before=await saved(page);
 for(let i=0;i<3;i++){
  await noCheck(page);await expect(page.locator('#score')).toHaveText('0 Strafpunkte');
  expect(withoutHelp(await saved(page))).toEqual(withoutHelp(before));
 }
 await undo(page);expect((await saved(page)).penalty).toBe(0);
 await page.reload();await ready(page);
 expect(await saved(page)).toEqual(before);
});

test('maybe-only checks do not delay undo and preserve paid hints and display state',async({page})=>{
 await mark(page,1,'A1','maybe');await mark(page,2,'B1','maybe');
 await page.locator('#toggleDistances').click();await cell(page,'B2').focus();await page.keyboard.press('Enter');
 await help(page);await page.locator('#hint').click();
 const before=await saved(page);expect(before.penalty).toBe(10);
 for(let i=0;i<3;i++)await noCheck(page);
 await expect(page.locator('#score')).toHaveText('10 Strafpunkte');
 expect(withoutHelp(await saved(page))).toEqual(withoutHelp(before));
 await undo(page);
 const after=await saved(page);
 expect(after.marks).toEqual({'1:A1':'maybe'});
 for(const key of ['penalty','hintPenalty','hintCount','layer','tool','distanceMode','distanceOrigin'])expect(after[key]).toEqual(before[key]);
 await undo(page);expect((await saved(page)).marks).toEqual({});
 await page.reload();await ready(page);
 expect((await saved(page)).penalty).toBe(10);expect((await saved(page)).marks).toEqual({});
});

test('no-check attempts leave the preceding route edit as the next undo action',async({page})=>{
 await page.locator('#routeTool').click();await cell(page,'B5').focus();await page.keyboard.press('Enter');
 expect((await saved(page)).route).toEqual(['A5','B5']);
 for(let i=0;i<3;i++)await noCheck(page);
 await undo(page);expect((await saved(page)).route).toEqual(['A5']);
 expect((await saved(page)).penalty).toBe(0);
});

const cases=[
 {name:'single correct yes',marks:[[1,'B5','yes']],checked:1,wrong:0},
 {name:'single incorrect yes',marks:[[1,'A1','yes']],checked:1,wrong:1},
 {name:'single correct no',marks:[[1,'A1','no']],checked:1,wrong:0},
 {name:'single incorrect no',marks:[[1,'B5','no']],checked:1,wrong:1},
 {name:'mixed yes/no across hours with ignored maybes',marks:[[1,'B5','yes'],[2,'A1','yes'],[3,'D5','no'],[1,'A1','no'],[2,'B1','maybe']],checked:4,wrong:2}
];
for(const {name,marks,checked,wrong} of cases)test(`actual note check retains fee, counts, persistence and undo: ${name}`,async({page})=>{
 for(const [hour,id,tool] of marks)await mark(page,hour,id,tool);
 const before=await saved(page);
 const message=wrong?`${wrong} Deiner ${checked} eindeutigen Markierungen widersprechen der tatsächlichen Route.`:`Keine der ${checked} eindeutigen Markierungen widerspricht der Route.`;
 for(let i=1;i<=2;i++){
  await help(page);await page.locator('#checkMarks').click();
  await expect(page.locator('#helpStatus')).toContainText(message);
  await expect(page.locator('#helpStatus .'+(wrong?'error':'success'))).toHaveCount(1);
  await expect(page.locator('#score')).toHaveText(`${i*5} Strafpunkte`);
  expect((await saved(page)).penalty).toBe(i*5);
  expect((await saved(page)).marks).toEqual(before.marks);
 }
 await page.locator('#hint').click();
 await undo(page);expect((await saved(page)).penalty).toBe(15);
 expect((await saved(page)).marks).toEqual(before.marks);
 await undo(page);expect((await saved(page)).penalty).toBe(10);
 expect((await saved(page)).marks).toEqual(before.marks);
 // Each paid check occupied exactly one undo entry; hints remain paid.
 await undo(page);
 const remaining={...before.marks};const [hour,id]=marks.at(-1);delete remaining[`${hour}:${id}`];
 expect((await saved(page)).marks).toEqual(remaining);
 await help(page);await page.locator('#checkMarks').click();
 const persisted=await saved(page);
 expect(persisted.penalty).toBe(marks.length===1?10:15);
 await expect(page.locator('#score')).toHaveText(`${persisted.penalty} Strafpunkte`);
 await page.reload();await ready(page);
 const reloaded=await saved(page);
 for(const key of ['marks','route','doneClues','penalty','hintPenalty','hintCount'])expect(reloaded[key]).toEqual(persisted[key]);
});
