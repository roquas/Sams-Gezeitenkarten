import {registerChartScrollTests} from '../integration/chart-scroll.mjs';
import {test,expect} from '@playwright/test';
import {openGame} from '../helpers/open-game.mjs';

test('chart navigation waits for asynchronous application startup after window load',async({page})=>{
 let requested,release;
 const requestStarted=new Promise(resolve=>requested=resolve),gate=new Promise(resolve=>release=resolve);
 await page.route('**/puzzles/manifest.json',async route=>{requested();await gate;await route.continue();});
 let ready=false;
 const opening=openGame(page,'/?puzzle=model-demo').then(()=>{ready=true;});
 try{
  await requestStarted;await page.waitForLoadState('load');
  expect(await page.evaluate(()=>document.readyState)).toBe('complete');
  expect(ready).toBe(false);
  await expect(page.locator('#map .cell')).toHaveCount(0);
 }finally{release();}
 await opening;
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
});

registerChartScrollTests('/?puzzle=model-demo');
