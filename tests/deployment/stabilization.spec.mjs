import {test,expect} from '@playwright/test';
import {expectClueOnPaper} from './text-layout.mjs';
import {registerInkStatusTests} from '../integration/ui-ink-status.mjs';
import {registerChartScrollTests} from '../integration/chart-scroll.mjs';
import {registerResumeTests} from '../integration/page-resume.mjs';
registerInkStatusTests('./');
registerChartScrollTests('./');
registerResumeTests('./');
const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
async function choose(page,id){
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 const settings=page.locator('summary').filter({hasText:'Einstellungen'});
 if(!await page.locator('#puzzleSelect').isVisible())await settings.click();
 await page.locator('#puzzleSelect').selectOption(id);
 await expect(page.locator('#puzzleStatus')).toContainText('Geladen:');
 if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();
 await expect(page.locator('#map .cell')).toHaveCount(25);
}
async function shot(page,info,name,selector){
 await info.attach(name+'-'+info.project.name,{body:await page.locator(selector).screenshot({type:'jpeg',quality:94,scale:'css'}),contentType:'image/jpeg'});
}
test('independent distance selection, blocked land and unchanged editing work in the ZIP',async({page})=>{
 await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
 const radar=page.locator('#toggleDistances'),overlay=page.locator('.distance-overlay');
 await radar.click();await cell(page,'B3').click();await expect(overlay).toHaveAttribute('data-distance-origin','B3');await radar.click();await expect(radar).toHaveAttribute('data-distance-state','inactive');await expect(overlay).toHaveCount(0);await radar.click();await expect(radar).toHaveAttribute('data-distance-state','waiting');
 await cell(page,'C1').click();await expect(overlay).toHaveAttribute('data-distance-origin','C1');
 for(const tool of ['maybe','yes','no','erase','clearAll']){
  await page.locator(`[data-tool="${tool}"]`).click();
  for(const id of ['A1','A2','D2']){await cell(page,id).click();await expect(overlay).toHaveAttribute('data-distance-origin','C1');await expect(page.locator(`[data-distance-cell="${id}"]`)).toHaveText('2');}
 }
 await radar.click();await expect(radar).toHaveAttribute('data-distance-state','inactive');await expect(overlay).toHaveCount(0);
 await radar.click();await expect(radar).toHaveAttribute('data-distance-state','waiting');await expect(overlay).toHaveCount(0);
 await cell(page,'A1').click();await expect(overlay).toHaveAttribute('data-distance-origin','A1');
 await radar.click();await expect(overlay).toHaveCount(0);
 for(let hour=1;hour<=6;hour++){
  await page.locator(`[data-hour="${hour}"]`).click();
  await expect(page.locator('.blocked-cell .active-hour-edge')).toHaveCount(0);
  await expect(page.locator('.cell:not(.blocked-cell) .active-hour-edge')).toHaveCount(44);
 }
 const land=await page.locator('.blocked-cell polygon').evaluateAll(ns=>ns.map(n=>({opacity:+n.getAttribute('stroke-opacity'),dash:n.getAttribute('stroke-dasharray')})));
 expect(land.every(n=>n.opacity===.62&&n.dash==='4 3')).toBe(true);
 await page.locator('[data-tool="maybe"]').click();await cell(page,'B3').click();await expect(cell(page,'B3')).not.toContainText('?');
});
test('rendered chart, shared Dreifingerinsel and quiet accessible logbook',async({page,request},info)=>{
 const ink=await request.get('assets/ui/logbook-chart.svg');expect(ink.status()).toBe(200);expect(ink.headers()['content-type']).toContain('image/svg+xml');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(info.project.name==='desktop')await page.setViewportSize({width:2560,height:1440});
 await page.goto('./');await expect(page.locator('#map .cell')).toHaveCount(25);
 await page.locator('[data-hour="4"]').click();await shot(page,info,'after-active-hour-land','#map');
 await choose(page,'ankerbuch-tesoro');
 await expect(page.locator('[data-art-cells="B3 C3 D3"]')).toHaveCount(1);
 await expect(page.locator('.island-label').filter({hasText:'Dreifingerinsel'})).toHaveAttribute('data-label-cells',/B3.*C3.*D3/);
 await shot(page,info,'after-dreifingerinsel','#map');
 await page.locator('.bordbook').scrollIntoViewIfNeeded();
 await expect(page.locator('.book-page-heading strong')).toHaveText('Aus Robins Logbuch');
 await expect(page.locator('.book-heading')).toHaveAttribute('aria-hidden','true');
 expect(await page.locator('.book-vignette').evaluate(n=>getComputedStyle(n).backgroundImage)).toContain('logbook-chart.svg');
 const leaves=await page.locator('.bordbook').evaluate(n=>['::before','::after'].map(p=>({w:parseFloat(getComputedStyle(n,p).width),x:parseFloat(getComputedStyle(n,p).left)})));
 expect(leaves[0].w).toBeCloseTo(leaves[1].w,0);expect(leaves[0].x).toBeLessThan(0);
 await shot(page,info,'after-logbook','.bordbook');
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Capture the real animation synchronously so its short duration cannot hide a regression.
 const frames=await page.locator('#nextClue').evaluate(button=>{button.click();const a=document.querySelector('.turning-leaf').getAnimations()[0];a.pause();a.currentTime=80;return {frames:a.effect.getKeyframes(),duration:a.effect.getTiming().duration};});
 expect(frames.duration).toBeLessThanOrEqual(180);
 expect(frames.frames.every(f=>!/(perspective|rotate|scale)/.test(f.transform))).toBe(true);
 await shot(page,info,'after-turn-midpoint','.bordbook');
 await page.locator('.turning-leaf').evaluate(n=>n.getAnimations()[0].finish());
 await expect(page.locator('.turning-leaf')).toHaveCount(0);
 await expect(page.locator('#cluePosition')).toHaveText('H2 / H5');
 await shot(page,info,'after-page-turn','.bordbook');
 await page.locator('#clueTrack [data-clue]').focus();await page.keyboard.press('Space');await expect(page.locator('#clueTrack [data-clue]')).toHaveAttribute('aria-checked','true');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#nextClue').click();
 await expect(page.locator('#cluePosition')).toHaveText('H3 / H5');await expect(page.locator('.turning-leaf')).toHaveCount(0);
 expect(await page.locator('#clueViewport').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
 for(let i=0;i<5;i++){await expectClueOnPaper(page);await page.locator('#nextClue').click();}
 await choose(page,'quittung-nombreo');await expect(page.locator('#clueTrack [data-coordinate="D4"]')).toHaveCount(1);
 expect(errors).toEqual([]);
});
test('before screenshots from the accepted PR deployment',async({page},info)=>{
 test.skip(!process.env.BASELINE_ROOT,'Baseline export is supplied by CI visual review');
 if(info.project.name==='desktop')await page.setViewportSize({width:2560,height:1440});
 await page.goto('http://127.0.0.1:4175/gk/pr38/');await expect(page.locator('#map .cell')).toHaveCount(25);
 await page.locator('[data-hour="4"]').click();await shot(page,info,'before-active-hour-land','#map');
 await choose(page,'ankerbuch-tesoro');await shot(page,info,'before-dreifingerinsel','#map');
 await shot(page,info,'before-logbook','.bordbook');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#nextClue').evaluate(b=>{b.click();const a=document.querySelector('.turning-leaf').getAnimations()[0];a.pause();a.currentTime=150;});
 await shot(page,info,'before-turn-midpoint','.bordbook');
});
