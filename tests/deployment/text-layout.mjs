import {expect} from '@playwright/test';
export async function expectClueOnPaper(page){
 const layout=await page.locator('#clueTrack p').evaluate(p=>{
  const range=document.createRange();range.selectNodeContents(p);
  const rects=[...range.getClientRects()].filter(r=>r.width&&r.height);
  const book=p.closest('.bordbook').getBoundingClientRect(),viewport=document.getElementById('clueViewport').getBoundingClientRect(),nav=document.querySelector('.bordbook .clue-nav').getBoundingClientRect();
  return {right:Math.max(...rects.map(r=>r.right)),left:Math.min(...rects.map(r=>r.left)),bottom:Math.max(...rects.map(r=>r.bottom)),viewportRight:viewport.right,viewportLeft:viewport.left,navTop:nav.top,paperRight:book.x+book.width*(innerWidth<=600?.86:.89)};
 });
 expect(layout.right,'actual text stays inside its viewport').toBeLessThanOrEqual(layout.viewportRight+.5);
 expect(layout.right,'actual text clears the curled outer paper edge').toBeLessThanOrEqual(layout.paperRight+.5);
 expect(layout.left).toBeGreaterThanOrEqual(layout.viewportLeft-.5);
 expect(layout.bottom,'text never overlaps page navigation').toBeLessThanOrEqual(layout.navTop+.5);
}
