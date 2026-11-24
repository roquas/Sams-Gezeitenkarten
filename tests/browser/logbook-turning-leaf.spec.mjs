import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const demo=JSON.parse(readFileSync(new URL('../../puzzles/model-demo.json',import.meta.url)));
const longText='In der ersten Stunde hielten wir Kurs nach Osten. Sam hatte den Kompass sicher verstaut, während Robin die Beobachtung sorgfältig ins Logbuch schrieb. Auch die Kiste mit den Seekarten blieb an Bord; wir fuhren genau eine Etappe weiter.';

for(const long of [false,true])test(`normal-motion turn preserves the ${long?'long, checked':'short'} outgoing text position`,async({page},info)=>{
 const mobile=!!info.project.use.isMobile;
 await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1080});
 await page.emulateMedia({reducedMotion:'no-preference'});
 if(long){
  const dto=structuredClone(demo);
  dto.puzzle.presentation.clueTexts.I=longText;
  await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 }
 await page.goto('/?puzzle=model-demo');
 const current=page.locator('#clueTrack [data-clue]');
 await expect(current).toHaveAttribute('data-clue','I');
 if(long){await current.click();await expect(current).toHaveAttribute('aria-checked','true');}
 await page.locator('.bordbook').scrollIntoViewIfNeeded();
 await page.locator('#nextClue').evaluate(button=>{
  const viewport=document.getElementById('clueViewport');
  const read=el=>{
   const r=el.getBoundingClientRect(),book=el.closest('.bordbook').getBoundingClientRect();
   const container=el.parentElement,bounds=container.getBoundingClientRect(),containerStyle=getComputedStyle(container);
   const availableWidth=bounds.right-r.x-parseFloat(containerStyle.paddingRight)-parseFloat(containerStyle.borderRightWidth);
   const style=getComputedStyle(el),lines=[],range=document.createRange();
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   for(let node;node=walker.nextNode();){
    for(let i=0;i<node.length;i++){
     range.setStart(node,i);range.setEnd(node,i+1);
     const glyph=range.getBoundingClientRect();
     if(!glyph.width||!glyph.height)continue;
     const y=glyph.y-r.y;
     if(!lines.length||Math.abs(lines.at(-1).y-y)>.5)lines.push({text:'',y,height:glyph.height});
     lines.at(-1).text+=node.data[i];
    }
   }
   const font=Object.fromEntries(['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','wordSpacing'].map(key=>[key,style[key]]));
   const wrapping=Object.fromEntries(['whiteSpace','wordBreak','overflowWrap'].map(key=>[key,style[key]]));
   return {text:el.textContent,x:r.x-book.x,y:r.y-book.y,width:r.width,availableWidth,height:r.height,font,wrapping,lines};
  };
  window.logbookTurn={};
  // Capture the actual old DOM immediately before the native click handler replaces it.
  button.addEventListener('click',()=>{
   window.logbookTurn.before=read(document.querySelector('#clueTrack p'));
   window.logbookTurn.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  },{capture:true,once:true});
  const observer=new MutationObserver(records=>{
   const leaf=records.flatMap(r=>[...r.addedNodes]).find(n=>n.nodeType===1&&n.classList.contains('turning-leaf'));
   if(!leaf)return;
   const animation=leaf.getAnimations()[0];
   window.logbookTurn.animation={duration:animation.effect.getTiming().duration,playState:animation.playState,keyframes:animation.effect.getKeyframes().map(({transform,opacity})=>({transform,opacity}))};
   window.logbookTurn.leaf=read(leaf.querySelector('p'));
   window.logbookTurn.next=read(document.querySelector('#clueTrack p'));
   window.logbookTurn.leafNumber=leaf.querySelector('.leaf-number').textContent;
   window.logbookTurn.hidden=leaf.getAttribute('aria-hidden');
   window.logbookTurn.layout={visiblePadding:getComputedStyle(viewport).paddingTop,leafPadding:getComputedStyle(leaf).paddingTop,leafAlignment:getComputedStyle(leaf).alignItems,visibleColumnGap:getComputedStyle(document.querySelector('#clueTrack .clue')).columnGap,leafColumnGap:getComputedStyle(leaf).columnGap};
   // Observe completion without pausing, replacing or accelerating the 160-ms animation.
   window.logbookTurnFinished=animation.finished;
   observer.disconnect();
  });
  observer.observe(viewport,{childList:true});
 });
 await page.locator('#nextClue').click();
 await page.waitForFunction(()=>window.logbookTurn?.leaf);
 const geometry=await page.evaluate(()=>window.logbookTurn);
 await info.attach('logbook-turn-geometry',{body:JSON.stringify(geometry,null,2),contentType:'application/json'});
 expect(geometry.reducedMotion).toBe(false);
 expect(geometry.animation.duration).toBe(160);
 expect(geometry.animation.playState).toBe('running');
 expect(geometry.animation.keyframes).toEqual([{transform:'translateX(0px)',opacity:'1'},{transform:'translateX(-5px)',opacity:'0'}]);
 expect(geometry.leaf.text).toBe(geometry.before.text);
 expect(geometry.leafNumber).toBe('I');
 expect(geometry.hidden).toBe('true');
 expect(Math.abs(geometry.leaf.y-geometry.before.y),'outgoing text must keep its vertical position').toBeLessThan(.5);
 expect(geometry.leaf.font,'outgoing text must keep its font metrics').toEqual(geometry.before.font);
 // A short flex paragraph can shrink to its intrinsic width; its right-hand
 // container boundary, rather than that intrinsic box, determines wrapping.
 expect(Math.abs(geometry.leaf.availableWidth-geometry.before.availableWidth),'outgoing text must keep its available width').toBeLessThan(.5);
 if(long)expect(Math.abs(geometry.leaf.width-geometry.before.width),'long outgoing text must keep its actual width').toBeLessThan(.5);
 expect(Math.abs(geometry.leaf.height-geometry.before.height),'outgoing text must keep its line wrapping').toBeLessThan(.5);
 expect(geometry.leaf.lines.map(line=>line.text),'outgoing text must keep every actual line break').toEqual(geometry.before.lines.map(line=>line.text));
 expect(geometry.before.y).toBe(mobile?142:144);
 expect(geometry.next.y).toBe(geometry.before.y);
 await page.evaluate(()=>window.logbookTurnFinished);
 await expect(page.locator('.turning-leaf')).toHaveCount(0);
 await expect(current).toHaveAttribute('data-clue','II');
 await expect(page.locator('#cluePosition')).toHaveText('II / III');
 const offset=()=>current.locator('p').evaluate(el=>el.getBoundingClientRect().y-el.closest('.bordbook').getBoundingClientRect().y);
 expect(await offset()).toBe(geometry.before.y);
 await current.focus();await page.keyboard.press('Space');
 await expect(current).toHaveAttribute('aria-checked','true');
 expect(await offset()).toBe(geometry.before.y);
 await expect(page.locator('#prevClue')).toBeEnabled();
 await expect(page.locator('#nextClue')).toBeEnabled();
});
