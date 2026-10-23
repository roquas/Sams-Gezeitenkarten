import {test as base,expect} from '@playwright/test';
export {expect};

// Selection asserts puzzle state, DOM and CSS-pixel hit targets. Keep the
// separate rendering/gesture suites at the configured WebKit DPR 2; avoid
// paying for four raster pixels per CSS pixel in these functional assertions.
// Other browsers retain their project's original pixel density.
// Trace retention is inherited from the active Playwright configuration.
export const selectionUse={
 deviceScaleFactor:async({browserName,deviceScaleFactor},use)=>{
  await use(browserName==='webkit'?1:deviceScaleFactor);
 }
};

// Linux WebKit can spend seconds starting its first WebProcess and compositor.
// Prepare only the empty renderer under the worker fixture's startup budget.
// Never preload the game or reuse the scratch context's state. The actual
// interactions retain the unchanged per-test timeout and actionability checks.
export const test=base.extend({
 webkitRenderer:[async({browser,browserName},use)=>{
  if(browserName==='webkit'){
   const scratch=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});
   try{
    const page=await scratch.newPage();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }finally{await scratch.close();}
  }
  await use();
 },{scope:'worker',auto:true}]
});
