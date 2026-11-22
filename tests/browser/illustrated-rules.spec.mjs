import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../../puzzles/manifest.json',import.meta.url)));
const article=page=>page.locator('#landingRules article');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
test('shared coordinate preparation is safe, idempotent, complete and preserves markup and attributes',async({page})=>{
 await page.goto('/');await expect(article(page).locator('[data-coordinate="C3"]')).toHaveCount(1);
 const result=await page.evaluate(async()=>{
  const {prepareCoordinates}=await import('/src/ui/coordinates.mjs');
  const root=document.createElement('section');root.innerHTML='<p title="A1">Alpha / Cyan <strong>γ / V</strong> &lt;img src=x onerror=alert(1)&gt;</p><a href="#A1">B2</a><code>C3</code>';
  const link=root.querySelector('a');let calls=0;link.addEventListener('click',e=>{e.preventDefault();calls++;});
  const strong=root.querySelector('strong');prepareCoordinates(root);const first=root.innerHTML;prepareCoordinates(root);link.click();
  return {same:first===root.innerHTML,count:root.querySelectorAll('.coord-inline').length,nested:root.querySelectorAll('.coord-inline .coord-inline').length,images:root.querySelectorAll('img').length,title:root.querySelector('p').title,href:link.getAttribute('href'),strong:strong===root.querySelector('strong'),calls,text:root.textContent,code:root.querySelector('code').textContent};
 });
 expect(result).toMatchObject({same:true,count:3,nested:0,images:0,title:'A1',href:'#A1',strong:true,calls:1,code:'C3'});expect(result.text).toContain('<img src=x onerror=alert(1)>');
 const scope=await page.evaluate(async()=>{
  const {prepareRules}=await import('/src/ui/rules.mjs');const root=document.createElement('section');
  root.innerHTML='<h1>B2-S03-M000-A1</h1><select><option value="B2-S03-A1">B2-S03-A1</option></select><article class="rules-introduction"><p>A1</p></article><p data-coordinate-prose>γ / V</p>';
  prepareRules(root,{steps:6});return {title:root.querySelector('h1').textContent,option:root.querySelector('option').textContent,value:root.querySelector('option').value,badges:root.querySelectorAll('.coord-inline').length,rule:root.querySelector('article .coord-inline').dataset.coordinate,legend:root.querySelector('[data-coordinate-prose] .coord-inline').dataset.coordinate};
 });
 expect(scope).toEqual({title:'B2-S03-M000-A1',option:'B2-S03-A1',value:'B2-S03-A1',badges:2,rule:'A1',legend:'C3'});
});
test('selection and game use identical six-hour rules, real figures and symbol coordinates; switching scopes the hour count',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.beta-card')).toHaveCount(2);await expect(page.locator('.beta-card').first()).toContainText('Die drei Peilungen');
 await expect(article(page)).toContainText('sechs folgende Etappen');
 await expect(page.locator('#landingRules > p')).toHaveCount(0);
 await expect(article(page).locator('.rules-image-note')).toHaveCount(0);
 await expect(article(page)).not.toContainText('Geografische Orte können');
 await expect(article(page)).not.toContainText('„S“ kennzeichnet');
 await expect(article(page)).not.toContainText('hier in der Hilfe weiter unten');
 await expect(article(page)).toContainText('Orte können sich über mehrere Hexfelder erstrecken und befahrbar oder gesperrt sein.');
 await expect(article(page)).toContainText('Notizprüfung (unter Hilfe, „Notizen prüfen“)');
 await expect(article(page)).toContainText('Denkanstoß (unter Hilfe, „Passenden Tipp“)');
 await expect(article(page)).toContainText('5 Strafpunkte pro Prüfung');
 await expect(article(page)).toContainText('10 Strafpunkte pro Abruf');
 await expect(article(page).locator('figure').filter({has:page.locator('img[src$="/hours.png"]')})).toContainText('Stunde 5 als möglich');
 const shared=await article(page).innerHTML();
 for(const image of await article(page).locator('img').all()){
  await image.scrollIntoViewIfNeeded();await expect(image).toHaveAttribute('alt',/.{30}/);
  expect(await image.evaluate(async e=>{await e.decode();return e.naturalWidth>0;})).toBe(true);
 }
 await page.getByRole('link',{name:'Rätsel auswählen',exact:true}).click();expect(new URL(page.url()).hash).toBe('#selectionTitle');await expect(page.locator('#selectionTitle')).toBeInViewport();
 await page.getByRole('link',{name:'Spielregeln lesen',exact:true}).click();expect(new URL(page.url()).hash).toBe('#landingRulesTitle');await expect(page.locator('#landingRulesTitle')).toBeInViewport();
 await page.locator('.beta-card').filter({hasText:'Die drei Peilungen'}).getByRole('link',{name:'Beginnen',exact:true}).click();
 await expect(page.locator('#hours [data-hour]:visible')).toHaveCount(6);
 expect(await page.locator('#gameRules article').innerHTML()).toBe(shared);
 await cell(page,'B2').focus();await page.keyboard.press('Enter');await page.locator('#backToSelection').click();
 await page.locator('.beta-card').filter({hasText:'Die drei Peilungen'}).getByRole('link',{name:'Fortsetzen',exact:true}).click();await expect(cell(page,'B2')).toContainText('?');
 if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('#puzzleSelect').evaluate(e=>e.closest('details').open=true);
 await page.locator('#puzzleSelect').selectOption('model-demo');await expect(page.locator('#gameRules')).toContainText('3 folgende Etappen');
 await page.locator('#puzzleSelect').selectOption('drei-peilungen');await expect(page.locator('#gameRules')).toContainText('sechs folgende Etappen');
 expect(await page.locator('#gameRules article').innerHTML()).toBe(shared);
 await expect(page.locator('#gameRules .coord-inline .coord-inline')).toHaveCount(0);expect(errors).toEqual([]);
});
test('unselected direct game entry uses the six-hour default',async({page})=>{
 await page.goto('/?play=1');await expect(page.locator('h1')).toHaveText('Die drei Peilungen');await expect(page.locator('#hours [data-hour]:visible')).toHaveCount(6);await expect(page.locator('#verify')).toBeDisabled();
});
// Each visual proof gets its own case: the original CI trace spent almost
// 30 s on five landing screenshots before it even navigated to the game.
for(const width of [320,390,1440])test.describe(`illustrated viewport ${width}px`,()=>{
 test.use({viewport:{width,height:width===1440?1000:844}});
 const output=info=>{
  const folder=info.project.name==='chromium'?'docs/verification/B1-rules':info.outputPath('visual');
  fs.mkdirSync(folder,{recursive:true});return folder;
 };
 const landing=async page=>{await page.goto('/');await expect(page.locator('.beta-card')).toHaveCount(manifest.puzzles.length);};
 test(`landing remains readable at ${width}px`,async({page},info)=>{
  await landing(page);const folder=output(info);
  await page.screenshot({type:'jpeg',quality:90,scale:'css',path:`${folder}/after-${width}.jpg`});
  await info.attach(`landing-${width}`,{path:`${folder}/after-${width}.jpg`,contentType:'image/jpeg'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 for(const name of ['hours','marks','tools','route'])test(`landing ${name} figure remains readable at ${width}px`,async({page},info)=>{
  await landing(page);const folder=output(info);
  const figure=article(page).locator('figure').filter({has:page.locator(`img[src$="/${name}.png"]`)});
  await figure.scrollIntoViewIfNeeded();await figure.locator('img').evaluate(e=>e.decode());
  const dims=await figure.evaluate(e=>{const img=e.querySelector('img'),r=e.getBoundingClientRect();return {width:r.width,right:r.right,image:img.getBoundingClientRect().width,natural:img.naturalWidth,scale:img.naturalHeight/img.naturalWidth,display:img.height/img.width};});
  expect(dims.right).toBeLessThanOrEqual(width);expect(dims.image).toBeGreaterThan(width<500?240:300);expect(Math.abs(dims.scale-dims.display)).toBeLessThan(.02);
  await page.screenshot({type:'jpeg',quality:90,scale:'css',path:`${folder}/rules-${name}-${width}.jpg`});
 });
 test(`game tools figure remains readable at ${width}px`,async({page},info)=>{
  const folder=output(info);
  await page.goto('/?puzzle=drei-peilungen');await expect(page.locator('#map .cell')).toHaveCount(25);
  if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
  await page.locator('#gameRules').evaluate(e=>e.open=true);
  const figure=page.locator('#gameRules figure').filter({has:page.locator('img[src$="/tools.png"]')});
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toBeInViewport();
  await figure.locator('img').evaluate(e=>e.decode());
  await page.screenshot({type:'jpeg',quality:90,scale:'css',path:`${folder}/game-rules-tools-${width}.jpg`});
 });
});

test('published six-hour puzzle accepts its unique route and exports its exact identity',async({page})=>{
 const source=JSON.parse(fs.readFileSync(new URL('../../docs/verification/B2-positive-v2/private/definition.json',import.meta.url)));
 const dto=JSON.parse(fs.readFileSync(new URL('../../puzzles/drei-peilungen.json',import.meta.url)));
 await page.goto('/?puzzle=drei-peilungen');await expect(page.locator('#map .cell')).toHaveCount(25);
 await page.locator('#routeTool').click();
 for(const id of source.solution.slice(1)){await cell(page,id).focus();await page.keyboard.press('Enter');}
 await expect(page.locator('.route-stroke')).toHaveCount(6);await page.locator('#verify').click();await expect(page.getByRole('dialog')).toContainText('Richtig gelöst');
 await page.getByRole('button',{name:'Überspringen / Schließen'}).click();await page.locator('#backToSelection').click();
 await expect(page.locator('.beta-card').first()).toContainText('Gelöst');
 const downloading=page.waitForEvent('download');await page.locator('#exportFeedback').click();
 const exported=JSON.parse(fs.readFileSync(await (await downloading).path(),'utf8'));
 expect(exported.puzzles).toHaveLength(1);expect(exported.puzzles[0].identity).toMatchObject({puzzleId:'drei-peilungen',variantId:dto.identity.variantId});
 expect(exported.puzzles[0].phases).toHaveLength(1);expect(exported.puzzles[0].phases[0]).toMatchObject({status:'solved',routeChecks:1});
});
