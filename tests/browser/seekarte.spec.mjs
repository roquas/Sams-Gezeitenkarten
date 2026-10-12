import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('watercolor-only chart, perspective rings, quiet start and intact hit areas',async({page})=>{
 const images=await page.locator('#map image').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 expect(images.length).toBeGreaterThan(9);expect(images.every(href=>href.startsWith('assets/seekarte/'))).toBe(true);
 await expect(page.locator('#map [data-start-marker]')).toHaveAttribute('fill','none');
 await expect(page.locator('#map [data-start-marker]')).toHaveAttribute('stroke-width','1.5');
 await expect(page.locator('[data-place-ring]')).toHaveCount(8);
 for(const transform of await page.locator('[data-place-ring]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform'))))expect(transform).toContain('scale(1 0.707');
 await expect(page.locator('#map [data-id]')).toHaveCount(25);
 await expect(page.locator('#map')).toHaveAttribute('viewBox','-24 -24 523 433');
 const p=await page.locator('#map [data-id="A1"] polygon').getAttribute('points');expect(p).toContain('91.18,74.00');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('brass rail order, hour icon, accessible toggles and verification readiness',async({page})=>{
 expect(await page.locator('#mapActions button').evaluateAll(ns=>ns.map(n=>n.id))).toEqual(['undo','toggleDistances','toggleHourMarks','toggleRouteNumbers','verify']);
 await expect(page.locator('#verify')).toBeDisabled();
 const edge=page.locator('#toggleHourMarks .hour-edge');const original=await edge.evaluate(el=>['x1','y1','x2','y2'].map(k=>el.getAttribute(k)));
 await page.locator('[data-hour="4"]').focus();await page.keyboard.press('Enter');
 await expect(page.locator('[data-hour="4"]')).toBeFocused();
 expect(await edge.evaluate(el=>['x1','y1','x2','y2'].map(k=>el.getAttribute(k)))).not.toEqual(original);
 await expect(page.locator('#toggleHourMarks')).toHaveAttribute('aria-label',/Stunde 4/);
 await page.locator('#toggleHourMarks').focus();await page.keyboard.press('Space');
 await expect(page.locator('#toggleHourMarks')).toHaveAttribute('aria-pressed','false');
 await page.locator('#toggleRouteNumbers').click();await expect(page.locator('#toggleRouteNumbers')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-tool="route"]').click();
 for(const id of ['E3','D2','C2','B2','B1'])await page.locator('#map [data-id="'+id+'"]').click();
 await expect(page.locator('#verify')).toBeDisabled();
 await page.locator('#map [data-id="A1"]').click();await expect(page.locator('#verify')).toBeEnabled();
 await page.locator('#verify').focus();await page.keyboard.press('Enter');await expect(page.locator('#verifyStatus')).toContainText('Richtig!');
 await page.locator('#undo').click();await expect(page.locator('#verify')).toBeDisabled();
});
test('both rails have 44px touch targets and a visible keyboard-accessible legend',async({page})=>{
 for(const size of [{width:320,height:780},{width:390,height:844},{width:768,height:1024},{width:1280,height:900}]){
  await page.setViewportSize(size);
  const boxes=await page.locator('.chart-toolbar button, #mapActions button').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  expect(boxes.every(b=>b.w>=43.9&&b.h>=44)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(size)).toBe(true);
 }
 await page.locator('.toolbar-guide a').focus();await page.keyboard.press('Enter');
 await page.locator('#toolLegend summary').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#toolLegend')).toHaveAttribute('open','');
 await expect(page.locator('#toolLegend')).toContainText('Konturlinien');
});
test('bordbook arrows, keyboard, checked clues, undo and reload preserve semantics',async({page})=>{
 await expect(page.locator('#clueTrack [data-clue]')).toHaveCount(1);
 await expect(page.locator('#cluePosition')).toHaveText('I / VII');
 await page.locator('#prevClue').click();await expect(page.locator('#cluePosition')).toHaveText('VII / VII');
 await page.locator('#nextClue').click();await expect(page.locator('#cluePosition')).toHaveText('I / VII');
 await page.locator('#clueViewport').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#cluePosition')).toHaveText('II / VII');
 const clue=page.locator('#clueTrack [data-clue="II"]');await clue.focus();await page.keyboard.press('Space');
 await expect(clue).toHaveAttribute('aria-checked','true');await expect(clue).toBeFocused();
 await expect(page.locator('#allClues [data-clue="II"]')).toHaveAttribute('aria-checked','true');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#clueTrack [data-clue="III"]')).toBeFocused();
 await page.locator('#undo').click();await expect(page.locator('#allClues [data-clue="II"]')).toHaveAttribute('aria-checked','false');
 await page.locator('#clueTrack [data-clue="III"]').click();await page.reload();
 await expect(page.locator('#allClues [data-clue="III"]')).toHaveAttribute('aria-checked','true');
 const texts=[];
 for(let i=0;i<7;i++){texts.push(await page.locator('#clueTrack .clue p').textContent());await page.locator('#nextClue').click();}
 const expected=await page.evaluate(async()=>{const {referencePuzzle}=await import('/puzzles/reference-3.6.mjs');return referencePuzzle.clues.map(c=>c.text);});
 expect(texts).toEqual(expected);
});
test('mobile swipe turns pages while vertical gestures keep the current clue',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch input project');
 await page.locator('#clueViewport').scrollIntoViewIfNeeded();
 const b=await page.locator('#clueViewport').boundingBox();const x=b.x+b.width*.8,y=b.y+b.height*.5;
 const session=await page.context().newCDPSession(page);
 async function gesture(dx,dy){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await gesture(-110,0);await expect(page.locator('#cluePosition')).toHaveText('II / VII');
 await expect(page.locator('#clueTrack [data-clue="II"]')).toHaveAttribute('aria-checked','false');
 await gesture(-10,40);await expect(page.locator('#cluePosition')).toHaveText('II / VII');
 await session.detach();
});
test('book uses desktop spread, mobile single page and honors reduced motion',async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:900});
 expect(await page.locator('.book-spread').evaluate(el=>getComputedStyle(el).display)).toBe('grid');
 await expect(page.locator('.book-vignette')).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#nextClue').click();
 expect(await page.locator('#clueTrack').evaluate(el=>el.getAnimations().length)).toBe(0);
 await page.evaluate(()=>scrollTo(0,0));
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 await testInfo.attach('seekarte-desktop',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.locator('.book-spread').evaluate(el=>getComputedStyle(el).display)).toBe('block');
 await expect(page.locator('.book-vignette')).toBeHidden();
 expect(await page.locator('#clueTrack .clue p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
 await testInfo.attach('seekarte-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('mobile help button does not cover hours, tools, map or book navigation',async({page,isMobile})=>{
 test.skip(!isMobile,'Mobile help button');
 const help=await page.locator('#logbookTab').boundingBox();
 const targets=await page.locator('.chart-toolbar button, #mapActions button, #map, #prevClue, #nextClue').evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};}));
 for(const b of targets)expect(help.x+help.width<=b.left||help.x>=b.right||help.y+help.height<=b.top||help.y>=b.bottom).toBe(true);
 await page.locator('#logbookTab').click();await expect(page.locator('#logbookTab')).toHaveAttribute('aria-expanded','true');
 await page.locator('#logbookTab').click();await expect(page.locator('#logbookTab')).toHaveAttribute('aria-expanded','false');
});
