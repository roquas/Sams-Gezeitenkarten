import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';

const demo=JSON.parse(readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
const evidence=new URL('../../docs/verification/logbook-skeuomorphic/',import.meta.url);
const longText='In der ersten Stunde hielten wir Kurs nach Osten. Sam hatte den Kompass sicher verstaut, während Robin die Beobachtung sorgfältig ins Logbuch schrieb. Auch die Kiste mit den Seekarten blieb an Bord; wir fuhren genau eine Etappe weiter.';
const item=(page,id)=>page.locator(`#allClues [data-clue="${id}"]`);
const current=page=>page.locator('#clueTrack [data-clue]');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
async function open(page){
 const dto=structuredClone(demo),p=dto.puzzle.presentation;
 p.objectNames={...p.objectNames,o1:'Roberts Boot'};
 p.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';
 p.clueTexts.II=longText;p.cluePlaceRefs={I:['o1','o2'],II:[],III:[]};
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/?puzzle=model-demo');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await page.emulateMedia({reducedMotion:'reduce'});
}
async function overview(page){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const details=page.locator('#allClues').locator('..');
 if(!await details.evaluate(el=>el.open))await details.locator('summary').click();
}
async function chart(page){
 if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();
}
async function writing(locator){
 return locator.evaluate(el=>{
  const origin=el.getBoundingClientRect(),s=getComputedStyle(el);
  return {opacity:s.opacity,color:s.color,background:s.backgroundColor,order:s.order,
   nodes:[...el.querySelectorAll('.clue-margin,.num,p')].map(n=>{
    const r=n.getBoundingClientRect(),style=getComputedStyle(n);
    return {x:r.x-origin.x,y:r.y-origin.y,w:r.width,h:r.height,font:style.font,color:style.color,opacity:style.opacity,decoration:style.textDecorationLine};
   })};
 });
}
async function checkTick(locator){
 const [margin,tick]=await Promise.all([locator.locator('.clue-margin').boundingBox(),locator.locator('.clue-margin svg').boundingBox()]);
 expect(Math.abs(margin.y+margin.height/2-tick.y-tick.height/2)).toBeLessThan(.5);
 expect(await locator.locator('.clue-margin svg').evaluate(el=>el.closest('[aria-hidden]').getAttribute('aria-hidden'))).toBe('true');
}
async function snapshot(page,info,name){
 await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
 const body=await page.locator('#allClues').locator('..').screenshot({scale:'css'});
 const output=info.outputPath('logbook-'+name+'.png');writeFileSync(output,body);
 await info.attach(name,{path:output,contentType:'image/png'});
 if(info.project.name==='chromium'){mkdirSync(evidence,{recursive:true});writeFileSync(new URL(name+'.png',evidence),body);}
}

for(const [device,width,height] of [['desktop',1440,1080],['mobile',390,844]])test(`${device}: overview ink stays readable and stationary, with a long clue`,async({page},info)=>{
 await page.setViewportSize({width,height});await open(page);await overview(page);
 await expect(page.locator('#allClues').locator('..').locator('summary')).toHaveText('Aus Robins Logbuch');
 await expect(page.locator('#logbook .book-place-action,#logbook .clue-nav')).toHaveCount(0);
 await expect(page.locator('#allClues [role="checkbox"]')).toHaveCount(3);
 await expect(item(page,'II')).toHaveAccessibleName('II '+longText);
 await expect(item(page,'II')).toHaveAttribute('tabindex','0');
 const before=await writing(item(page,'II'));
 expect(before.opacity).toBe('1');expect(before.nodes.at(-1).decoration).toBe('none');
 expect(before.nodes.at(-1).h).toBeGreaterThan(60);
 await snapshot(page,info,`${device}-overview-open`);
 await item(page,'I').click();await item(page,'II').click();
 await expect(item(page,'II')).toHaveAttribute('aria-checked','true');
 await expect(item(page,'II')).toHaveAccessibleName('II '+longText);
 expect(await writing(item(page,'II'))).toEqual(before);await checkTick(item(page,'II'));
 await snapshot(page,info,`${device}-overview-done`);
 await item(page,'II').focus();await page.keyboard.press('Space');
 await expect(item(page,'II')).toHaveAttribute('aria-checked','false');expect(await writing(item(page,'II'))).toEqual(before);
 expect(await item(page,'II').evaluate(el=>el===document.activeElement)).toBe(true);
});

test('book and overview immediately share checks, keyboard state, undo, and saved data',async({page})=>{
 await open(page);
 const before=await saved(page);await current(page).click();
 await expect(item(page,'I')).toHaveAttribute('aria-checked','true');
 expect((await saved(page)).doneClues).toEqual(['I']);
 const {doneClues:ignoredBefore,...restBefore}=before,{doneClues:ignoredAfter,...restAfter}=await saved(page);
 expect(restAfter).toEqual(restBefore);
 await overview(page);await item(page,'I').focus();await page.keyboard.press('Space');
 await expect(current(page)).toHaveAttribute('aria-checked','false');
 await item(page,'II').focus();await page.keyboard.press('Enter');
 await chart(page);await page.locator('#nextClue').click();
 await expect(current(page)).toHaveAttribute('data-clue','II');await expect(current(page)).toHaveAttribute('aria-checked','true');
 await page.locator('#undo').click();
 await expect(current(page)).toHaveAttribute('aria-checked','false');await expect(item(page,'II')).toHaveAttribute('aria-checked','false');
 await current(page).focus();await page.keyboard.press('Space');
 await expect(item(page,'II')).toHaveAttribute('aria-checked','true');
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
 await overview(page);await expect(item(page,'II')).toHaveAttribute('aria-checked','true');
 await chart(page);await page.locator('#nextClue').click();await expect(current(page)).toHaveAttribute('aria-checked','true');
});

test('checking either view does not restart the current place references',async({page})=>{
 await open(page);
 await page.locator('#showCluePlace').click();
 await expect(page.locator('#map .place-label text')).toHaveText(['Roberts Boot','Zwilling','Start']);
 await page.locator('#map .place-references').evaluate(el=>{
  window.currentReferenceGroup=el;
  // Hold an existing display while exercising both views; do not retrigger it.
  el.getAnimations({subtree:true}).forEach(a=>a.pause());
 });
 await current(page).click();await overview(page);await item(page,'I').click();
 expect(await page.locator('#map .place-references').evaluate(el=>el===window.currentReferenceGroup)).toBe(true);
 await chart(page);await page.locator('#showCluePlace').click();
 expect(await page.locator('#map .place-references').evaluate(el=>el!==window.currentReferenceGroup)).toBe(true);
 await expect(current(page)).toHaveAttribute('aria-checked','false');
});

test.describe('overview touch input',()=>{
test.use({hasTouch:true});
test('touch checks in the overview immediately update the book without adding controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await open(page);await overview(page);await item(page,'II').tap();
 await expect(item(page,'II')).toHaveAttribute('aria-checked','true');
 await chart(page);await page.locator('#nextClue').tap();await expect(current(page)).toHaveAttribute('aria-checked','true');
 await current(page).tap();await overview(page);await expect(item(page,'II')).toHaveAttribute('aria-checked','false');
 await expect(page.locator('#allClues button,#allClues nav')).toHaveCount(0);
});
});
