import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dragTouch} from '../integration/touch-gesture.mjs';

const evidence=new URL('../../docs/verification/logbook-skeuomorphic/',import.meta.url);
const demo=JSON.parse(readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
const book=page=>page.locator('.bordbook');
const clue=page=>page.locator('#clueTrack [data-clue]');
const saved=page=>page.evaluate(()=>localStorage.getItem('gezeitenkarten-model-demo-schema2-data1'));
async function open(page,{places=false,long=false,paired=false}={}){
 const dto=structuredClone(demo),p=dto.puzzle.presentation;
 p.cluePlaceRefs={I:places?['o1','o2']:[]};
 if(places){p.objectNames={...p.objectNames,o1:'Roberts Boot'};p.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';}
 if(long)p.clueTexts.I='In der ersten Stunde hielten wir Kurs nach Osten. Sam hatte den Kompass sicher verstaut, während Robin die Beobachtung sorgfältig ins Logbuch schrieb. Auch die Kiste mit den Seekarten blieb an Bord; wir fuhren genau eine Etappe weiter.';
 if(paired){p.clueTexts.II=p.clueTexts.I;p.cluePlaceRefs.II=[];}
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/?puzzle=model-demo');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await page.emulateMedia({reducedMotion:'reduce'});
}
async function writing(page){
 return clue(page).evaluate(el=>{
  const origin=el.closest('.bordbook').getBoundingClientRect();
  return [...el.querySelectorAll('.clue-margin,.num,p')].map(n=>{
   const r=n.getBoundingClientRect(),s=getComputedStyle(n);
   return {x:r.x-origin.x,y:r.y-origin.y,width:r.width,height:r.height,font:s.font,color:s.color,opacity:s.opacity,decoration:s.textDecorationLine};
  });
 });
}
async function capture(page,info,name){
 await page.mouse.move(0,0);await clue(page).evaluate(el=>el.blur());
 const image=await book(page).screenshot({scale:'css'});
 const output=info.outputPath('logbook-'+name+'.png');writeFileSync(output,image);
 await info.attach(name,{path:output,contentType:'image/png'});
 if(info.project.name==='chromium'){
  mkdirSync(evidence,{recursive:true});
  writeFileSync(new URL(name+'.png',evidence),image);
 }
}

for(const [device,width,height] of [['desktop',1440,1080],['mobile',390,844]]){
 for(const places of [false,true])test(`${device}: fixed ink margin, unchanged writing ${places?'with':'without'} place references`,async({page},info)=>{
  await page.setViewportSize({width,height});await open(page,{places});
  const action=page.locator('#showCluePlace');
  if(places)await expect(action).toBeVisible();else await expect(action).toBeHidden();
  await book(page).scrollIntoViewIfNeeded();
  const before=await writing(page);
  expect(before.at(-1).y).toBe(width<=600?142:144);
  await capture(page,info,`${device}-${places?'with-place':'without-place'}-open`);
  await clue(page).click();await expect(clue(page)).toHaveAttribute('aria-checked','true');
  expect(await writing(page)).toEqual(before);
  expect(await clue(page).evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  expect(before.at(-1).decoration).toBe('none');
  await expect(clue(page).locator('.clue-margin svg')).toBeVisible();
  const [margin,tick]=await Promise.all([clue(page).locator('.clue-margin').boundingBox(),clue(page).locator('.clue-margin svg').boundingBox()]);
  expect(Math.abs(margin.y+margin.height/2-tick.y-tick.height/2)).toBeLessThan(.5);
  await capture(page,info,`${device}-${places?'with-place':'without-place'}-done`);
  await clue(page).focus();await page.keyboard.press('Space');
  await expect(clue(page)).toHaveAttribute('aria-checked','false');
  expect(await writing(page)).toEqual(before);
  await expect(clue(page).locator('.clue-margin svg')).toBeHidden();
  await page.reload();await expect(clue(page)).toHaveAttribute('aria-checked','false');
 });
}

test('place action repeats only the current references, reveals the map, and preserves game state and undo',async({page})=>{
 await open(page,{places:true});
 await clue(page).click();const before=await saved(page);
 await page.locator('#showCluePlace').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#map .place-label text')).toHaveText(['Roberts Boot','Zwilling']);await expect(page.locator('#map .start-label')).toHaveCount(0);
 expect(await saved(page)).toBe(before);await expect(clue(page)).toHaveAttribute('aria-checked','true');
 const map=await page.locator('#map').boundingBox();
 const navigation=await page.locator('.mobile-view-nav').evaluate(el=>el.getClientRects().length?el.getBoundingClientRect().y:innerHeight);
 expect(map.y).toBeGreaterThanOrEqual(0);
 expect(map.y+map.height).toBeLessThanOrEqual(navigation);
 await page.locator('#map .place-references').evaluate(el=>{window.previousReferences=el;});
 await page.locator('#showCluePlace').click();
 expect(await page.locator('#map .place-references').evaluate(el=>el!==window.previousReferences)).toBe(true);
 await page.locator('#undo').click();await expect(clue(page)).toHaveAttribute('aria-checked','false');
 await page.locator('#nextClue').click();await expect(page.locator('#showCluePlace')).toBeHidden();
 await expect(page.locator('#map .place-label')).toHaveCount(0);
 await page.locator('#prevClue').click();await expect(page.locator('#showCluePlace')).toBeVisible();
});

for(const width of [320,390,620,768,900,1440])test(`at ${width}px: top navigation, writing and cartographic action stay on the paper, including long text`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});
 await open(page,{places:true,long:true});
  await book(page).scrollIntoViewIfNeeded();
  const [b,nav,text,action,annotations,viewport,margin]=await Promise.all([
   book(page).boundingBox(),page.locator('.bordbook .clue-nav').boundingBox(),page.locator('#clueTrack p').boundingBox(),
   page.locator('#showCluePlace').boundingBox(),page.locator('.book-annotations').boundingBox(),
   page.locator('#clueViewport').boundingBox(),clue(page).locator('.clue-margin').boundingBox()
  ]);
  await expect(page.locator('.book-page-heading,.book-place-line')).toHaveCount(0);
  expect(await page.locator('#showCluePlace').evaluate(el=>getComputedStyle(el).position)).toBe('absolute');
  expect(action.y).toBeGreaterThanOrEqual(nav.y+nav.height-4);
  expect(action.y+action.height+8).toBeLessThanOrEqual(text.y);
  expect(action.x+action.width).toBeCloseTo(text.x+text.width,0);
  expect(margin.height).toBeCloseTo(text.height+12,0);
  expect(Math.abs(margin.y+margin.height/2-text.y-text.height/2)).toBeLessThan(.5);
  expect(nav.x).toBeGreaterThanOrEqual(viewport.x+14);
  expect(nav.x+nav.width).toBeLessThanOrEqual(text.x+text.width-14+.5);
  expect(nav.y).toBeGreaterThanOrEqual(b.y+32);
  expect(text.y+text.height).toBeLessThanOrEqual(annotations.y);
  expect(annotations.y+annotations.height).toBeLessThanOrEqual(b.y+b.height*.86);
  for(const box of [nav,text,action]){
   expect(box.x).toBeGreaterThan(b.x);expect(box.x+box.width).toBeLessThan(b.x+b.width*.9);
  }
  const targets=await page.locator('#prevClue,#nextClue,#showCluePlace,#clueTrack [data-clue]').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));
  expect(targets.every(r=>r.width>=44&&r.height>=44)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('#clueTrack p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  if(width===390||width===1440){
   const before=await writing(page);
   await clue(page).click();await expect(clue(page)).toHaveAttribute('aria-checked','true');
   expect(await writing(page)).toEqual(before);
   const checkOffset=await clue(page).evaluate(el=>{
    const tick=el.querySelector('.clue-margin svg').getBoundingClientRect(),mark=el.querySelector('.clue-margin').getBoundingClientRect();
    return Math.abs(tick.y+tick.height/2-mark.y-mark.height/2);
   });
   expect(checkOffset).toBeLessThan(.5);
   await capture(page,info,`${width===390?'mobile':'desktop'}-long-with-place-done`);
   await clue(page).focus();await page.keyboard.press('Space');await expect(clue(page)).toHaveAttribute('aria-checked','false');
  }
});

for(const width of [320,390,620,768,900,1440])test(`at ${width}px: same text starts at exactly the same height with and without a margin note`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await open(page,{places:true,paired:true});
 const offset=()=>page.locator('#clueTrack p').evaluate(el=>el.getBoundingClientRect().y-el.closest('.bordbook').getBoundingClientRect().y);
  await book(page).scrollIntoViewIfNeeded();
  await expect(page.locator('#showCluePlace')).toBeVisible();
  const y=await offset();expect(y).toBe(width<=600?142:144);
  await clue(page).click();await expect(clue(page)).toHaveAttribute('aria-checked','true');expect(await offset()).toBe(y);
  await clue(page).focus();await page.keyboard.press('Space');expect(await offset()).toBe(y);
  await page.locator('#nextClue').click();await expect(page.locator('#showCluePlace')).toBeHidden();expect(await offset()).toBe(y);
  await clue(page).click();await expect(clue(page)).toHaveAttribute('aria-checked','true');expect(await offset()).toBe(y);
  await clue(page).focus();await page.keyboard.press('Space');
  await page.locator('#prevClue').click();await expect(page.locator('#showCluePlace')).toBeVisible();expect(await offset()).toBe(y);
});

test('keyboard navigation and place action remain separate from checking',async({page})=>{
 await open(page,{places:true});const initial=await saved(page);
 await page.locator('#prevClue').focus();
 expect(await page.locator('#prevClue').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 await page.keyboard.press('Enter');
 await expect(page.locator('#cluePosition')).toHaveText('III / III');
 await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#cluePosition')).toHaveText('I / III');
 await page.locator('#showCluePlace').focus();
 expect(await page.locator('#showCluePlace').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 await page.keyboard.press('Space');await expect(page.locator('#map .place-label text')).toHaveText(['Roberts Boot','Zwilling']);await expect(page.locator('#map .start-label')).toHaveCount(0);
 expect(await saved(page)).toBe(initial);await expect(clue(page)).toHaveAttribute('aria-checked','false');
 await clue(page).focus();await page.keyboard.press('Enter');await expect(clue(page)).toHaveAttribute('aria-checked','true');
 await page.locator('#showCluePlace').focus();const checked=await saved(page);await page.keyboard.press('Enter');
 expect(await saved(page)).toBe(checked);await expect(clue(page)).toHaveAttribute('aria-checked','true');
});

test.describe('book touch input',()=>{
test.use({hasTouch:true});
test('native touch taps and a swipe navigate, check, and show places independently',async({page,browserName})=>{
 await page.setViewportSize({width:390,height:844});await open(page,{places:true});
 await clue(page).tap();await expect(clue(page)).toHaveAttribute('aria-checked','true');
 const checked=await saved(page);await page.locator('#showCluePlace').tap();
 await expect(page.locator('#map .place-label text')).toHaveText(['Roberts Boot','Zwilling']);await expect(page.locator('#map .start-label')).toHaveCount(0);expect(await saved(page)).toBe(checked);
 await page.locator('#nextClue').tap();await expect(page.locator('#cluePosition')).toHaveText('II / III');
 await page.locator('#prevClue').tap();await expect(page.locator('#cluePosition')).toHaveText('I / III');
 await book(page).scrollIntoViewIfNeeded();const r=await page.locator('#clueViewport').boundingBox();
 await dragTouch(page,{browserName,from:{x:r.x+r.width*.8,y:r.y+r.height/2},to:{x:r.x+r.width*.2,y:r.y+r.height/2}});
 await expect(page.locator('#cluePosition')).toHaveText('II / III');await expect(page.locator('#showCluePlace')).toBeHidden();
 expect(await saved(page)).toBe(checked);await expect(clue(page)).toHaveAttribute('aria-checked','false');
});
});

test('completion remains readable and stationary in the complete clue list',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);
 await page.locator('#logbookTab').click();
 const item=page.locator('#allClues [data-clue="II"]');await item.scrollIntoViewIfNeeded();
 const read=()=>item.evaluate(el=>{
  const s=getComputedStyle(el),p=el.querySelector('p'),r=p.getBoundingClientRect();
  return {x:r.x,y:r.y,w:r.width,h:r.height,font:getComputedStyle(p).font,color:s.color,opacity:s.opacity,background:s.backgroundColor,decoration:getComputedStyle(p).textDecorationLine};
 });
 const before=await read();await item.focus();await page.keyboard.press('Enter');
 await expect(item).toHaveAttribute('aria-checked','true');expect(await read()).toEqual(before);
 expect(before.opacity).toBe('1');expect(before.decoration).toBe('none');
 await page.reload();await page.locator('#logbookTab').click();
 await expect(item).toHaveAttribute('aria-checked','true');
});
