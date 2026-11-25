import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const names=page=>page.locator('#map .place-label text');
const start=page=>page.locator('#map .start-label');
const place=(page,id)=>page.locator(`#map [data-label-object="${id}"]`);
function fixture(){
 const dto=read('puzzles/model-demo.json'),p=dto.puzzle;
 p.logic.map.objects.find(o=>o.id==='o1').cells=['A5'];
 p.logic.start='D3';
 p.logic.clues.forEach(c=>c.direction='W');
 p.presentation.objectNames={o1:'Sams Ankerplatz',o2:'Die Zwillingsinsel',o4:'Abendwacht'};
 p.presentation.intro=['Unsere Fahrt beginnt bei Abendwacht.'];
 p.presentation.cluePlaceRefs={I:['o2','o4'],II:['o4'],III:[]};
 p.presentation.clueTexts.I='Von Abendwacht fuhren wir westwärts, fern der Zwillingsinsel.';
 p.presentation.clueTexts.II='Abendwacht blieb zurück, wir hielten Westkurs.';
 // The structured fallback must also resolve and style a named start.
 p.logic.clues.push({id:'Ort',type:'distanceToPlace',hour:0,placeId:'o4',distance:0});
 p.presentation.clueTexts.Ort='Bei der Abfahrt waren wir bei Abendwacht.';
 return dto;
}
async function open(page,dto=fixture()){
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/?puzzle=model-demo');
 await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
async function seek(page,time){
 await page.locator('#map .place-references').evaluate((n,time)=>{
  n.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time;});
 },time);
}
async function shot(page,info,name){
 const path=info.outputPath(`named-start-${name}.png`);
 await page.locator('.mapbox').screenshot({path,animations:'allow',scale:'css'});
 await info.attach(name,{path,contentType:'image/png'});
}
for(const referenced of [true,false])test(`initial named start is shown once with actual name, initial reference=${referenced}, and survives saved reload`,async({page})=>{
 const dto=fixture();if(!referenced)dto.puzzle.presentation.cluePlaceRefs.I=['o2'];
 await open(page,dto);
 await expect(names(page)).toHaveText(['Die Zwillingsinsel','Abendwacht']);
 await expect(start(page)).toHaveCount(1);await expect(start(page)).toHaveAttribute('data-label-object','o4');
 await expect(start(page)).toHaveAttribute('data-label-cells','D3');
 await expect(place(page,'o4')).toHaveCount(1);
 await page.locator('#map .cell[data-id="A1"]').focus();await page.keyboard.press('Enter');
 await page.reload();
 await expect(names(page)).toHaveText(['Die Zwillingsinsel','Abendwacht']);
 await expect(start(page)).toHaveAttribute('data-label-object','o4');
 await expect(page.locator('#map .cell[data-id="A1"]')).toContainText('?');
});
test('manual X deduplicates all named places and ordinary clues style only explicit start references',async({page})=>{
 await open(page);await page.locator('#showPlaces').click();
 await expect(names(page)).toHaveText(['Sams Ankerplatz','Die Zwillingsinsel','Abendwacht']);
 for(const id of ['o1','o2','o4'])await expect(place(page,id)).toHaveCount(1);
 await expect(start(page)).toHaveAttribute('data-label-object','o4');
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Abendwacht']);
 await expect(place(page,'o4')).toHaveClass('place-label start-label');
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText([]);
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Abendwacht']);
 await expect(start(page)).toHaveAttribute('data-label-object','o4');
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Die Zwillingsinsel','Abendwacht']);
 // A non-start reference during a normal clue switch never adds the start.
 const dto=fixture();dto.puzzle.presentation.cluePlaceRefs.II=['o1'];
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));await page.reload();
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Sams Ankerplatz']);
 await expect(start(page)).toHaveCount(0);await expect(place(page,'o1')).toHaveClass('place-label reference-label');
});
for(const kind of ['unnamed-object','free-hex'])test(`${kind} uses the same special Start fallback on initial, reload and manual triggers`,async({page},info)=>{
 const dto=fixture();
 if(kind==='unnamed-object')delete dto.puzzle.presentation.objectNames.o4;
 // Public engine puzzles require a passable start object. Exercise the UI's
 // free-hex fallback directly at its controller boundary without changing that contract.
 await open(page,dto);
 async function freeStart(){
  if(kind!=='free-hex')return;
  await page.evaluate(async dto=>{
   const {placeReferencesFor}=await import('/src/ui/place-references.mjs');
   const {cellsOf}=await import('/src/engine/hex.mjs');
   const p=dto.puzzle,puzzle={map:p.logic.map,objectNames:p.presentation.objectNames,start:'E5'};
   const byId=Object.fromEntries(cellsOf(puzzle.map.grid).map(id=>[id,{id,q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1}]));
   const el=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
   const controller=placeReferencesFor(document.querySelector('#map'));
   controller.mount({puzzle,byId,el});controller.show(['o2','o4'],{start:true});
   document.querySelector('#showPlaces').onclick=()=>controller.show(['o1','o2','o4'],{start:true});
  },dto);
 }
 await freeStart();
 const expected=kind==='unnamed-object'?['Die Zwillingsinsel','Start']:['Die Zwillingsinsel','Abendwacht','Start'];
 await expect(names(page)).toHaveText(expected);
 await expect(start(page).locator('text')).toHaveText('Start');
 await expect(start(page)).not.toHaveAttribute('data-label-object',/./);
 await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);await freeStart();await expect(names(page)).toHaveText(expected);
 await page.locator('#showPlaces').click();
 await expect(names(page)).toHaveText(kind==='unnamed-object'?['Sams Ankerplatz','Die Zwillingsinsel','Start']:['Sams Ankerplatz','Die Zwillingsinsel','Abendwacht','Start']);
 await expect(start(page).locator('.label-paper>path').first()).toHaveAttribute('fill','#e5cda6');
 await expect(start(page).locator('text')).toHaveAttribute('fill','#a15f43');
 await seek(page,650);if(kind==='unnamed-object')await shot(page,info,kind);
 await page.locator('#nextClue').click();
 await expect(names(page)).toHaveText(kind==='unnamed-object'?[]:['Abendwacht']);
 await expect(start(page)).toHaveCount(0);
});
test('same card keeps every name and footprint when puzzle start changes, including reload and return',async({page},info)=>{
 const first=fixture(),other=structuredClone(first),manifest=read('puzzles/manifest.json');
 other.puzzle.id='other-demo';other.puzzle.logic.start='A5';
 other.puzzle.logic.clues.filter(c=>c.type==='direction').forEach(c=>c.direction='E');
 other.puzzle.logic.clues.find(c=>c.id==='Ort').placeId='o1';
 other.puzzle.presentation.clueTexts.I='Von Sams Ankerplatz fuhren wir ostwärts; die Zwillingsinsel und Abendwacht lagen fern.';
 other.puzzle.presentation.clueTexts.II='Abendwacht lag fern, wir hielten Ostkurs.';
 other.puzzle.presentation.clueTexts.Ort='Bei der Abfahrt waren wir bei Sams Ankerplatz.';
 other.puzzle.presentation.title='Andere Abfahrt';
 other.identity.instanceId='inst-other-demo';other.identity.variantId='var-other-demo';
 expect(other.puzzle.logic.map).toEqual(first.puzzle.logic.map);
 expect(other.puzzle.presentation.objectNames).toEqual(first.puzzle.presentation.objectNames);
 expect(other.puzzle.presentation.assetPlacements).toEqual(first.puzzle.presentation.assetPlacements);
 manifest.puzzles.push({id:'other-demo',title:'Andere Abfahrt',path:'other-demo.json',kind:'test'});
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));
 await page.route('**/puzzles/other-demo.json',r=>r.fulfill({json:other}));
 await open(page,first);await page.locator('#showPlaces').click();await seek(page,650);
 const snapshot=()=>page.locator('#map .place-label').evaluateAll(ns=>ns.map(n=>({id:n.dataset.labelObject,name:n.querySelector('text').textContent,
  cells:n.dataset.labelCells,transform:n.getAttribute('transform'),width:n.dataset.labelWidth})));
 const before=await snapshot();await shot(page,info,'first-start');
 async function choose(id){
  if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
  await page.locator('#puzzleSelect').evaluate(n=>n.closest('details').open=true);
  await page.locator('#puzzleSelect').selectOption(id);
  if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();
 }
 // Keep the old tracks to prove the new puzzle cancels/removes their targets.
 await page.locator('.place-references').evaluate(n=>{window.oldPlaceTracks=n.getAnimations({subtree:true});});
 await choose('other-demo');await expect(page.locator('h1')).toHaveText('Andere Abfahrt');
 await expect(names(page)).toHaveText(['Sams Ankerplatz','Die Zwillingsinsel','Abendwacht']);
 await expect(start(page)).toHaveAttribute('data-label-object','o1');
 await expect(place(page,'o4')).toHaveClass('place-label reference-label');
 expect(await page.evaluate(()=>window.oldPlaceTracks.every(a=>!a.effect.target.isConnected&&a.playState==='idle'))).toBe(true);
 await expect(page.locator('.place-references')).toHaveCount(1);
 await expect(page.locator('.start-glow')).toHaveAttribute('data-start-cell','A5');
 await page.locator('#showPlaces').click();await seek(page,650);
 expect(await snapshot()).toEqual(before);await shot(page,info,'other-start');
 await page.reload();await expect(start(page)).toHaveAttribute('data-label-object','o1');
 await expect(place(page,'o4')).toHaveClass('place-label reference-label');
 await choose('model-demo');await expect(start(page)).toHaveAttribute('data-label-object','o4');
 await expect(names(page)).toHaveText(['Die Zwillingsinsel','Abendwacht']);
 await expect(page.locator('.start-glow')).toHaveAttribute('data-start-cell','D3');
});
test('start parchment and ink reuse current route pigment, remain distinct in ink phase, and pass pointer input',async({page,isMobile},info)=>{
 await open(page);await page.locator('#showPlaces').click();
 const tracks=await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).map(a=>({start:a.startTime,duration:a.effect.getTiming().duration})));
 expect(tracks).toHaveLength(6);expect(tracks.every(t=>t.duration===4900&&Number.isFinite(t.start))).toBe(true);
 expect(new Set(tracks.map(t=>t.start)).size).toBe(1);
 await seek(page,650);
 const styles=await page.locator('#map .place-label').evaluateAll(ns=>ns.map(n=>{
  const paper=n.querySelector('.label-paper>path'),ink=n.querySelector('text');
  return {id:n.dataset.labelObject,paper:getComputedStyle(paper).fill,edge:getComputedStyle(paper).stroke,width:parseFloat(getComputedStyle(paper).strokeWidth),
   ink:getComputedStyle(ink).fill,outline:getComputedStyle(ink).stroke,outlineWidth:parseFloat(getComputedStyle(ink).strokeWidth),
   font:ink.getAttribute('font-family'),size:+ink.getAttribute('font-size'),measured:ink.getComputedTextLength(),available:+n.dataset.labelWidth-16,events:getComputedStyle(n).pointerEvents};
 }));
 const special=styles.find(s=>s.id==='o4'),regular=styles.find(s=>s.id==='o2');
 expect(special).toMatchObject({paper:'rgb(229, 205, 166)',edge:'rgb(161, 95, 67)',ink:'rgb(161, 95, 67)',outline:'rgb(246, 232, 205)',outlineWidth:.8,events:'none'});
 expect(regular).toMatchObject({paper:'rgb(243, 229, 197)',edge:'rgb(158, 123, 69)',ink:'rgb(57, 43, 25)',width:.5});
 expect(special.width).toBeGreaterThan(regular.width);
 expect(special.font).toBe(regular.font);
 for(const style of styles){expect(style.size).toBeGreaterThan(0);expect(style.size).toBeLessThanOrEqual(18);expect(style.measured).toBeLessThanOrEqual(style.available+.5);}
 await shot(page,info,'paper');
 await seek(page,3000);
 expect(await start(page).locator('.label-paper').evaluate(n=>+getComputedStyle(n).opacity)).toBe(0);
 expect(await start(page).locator('text').evaluate(n=>+getComputedStyle(n).opacity)).toBeGreaterThan(.9);
 await expect(start(page).locator('text')).toHaveCSS('fill',special.ink);
 await expect(place(page,'o2').locator('text')).toHaveCSS('fill',regular.ink);
 await shot(page,info,'ink');
 // Native pointer at the named start goes through its overlay onto the hex.
 const target=page.locator('#map .cell[data-id="D3"]');
 if(isMobile)await target.tap();else await target.click();
 await expect(target).toContainText('?');
 await page.locator('#routeTool').click();await page.locator('#map .cell[data-id="C3"]').focus();await page.keyboard.press('Enter');
 const pigment=await page.locator('#map .route-direction[data-route-current="true"]').evaluate(n=>{
  const id=n.getAttribute('fill').slice(5,-1);return n.ownerSVGElement.querySelector(`[id="${id}"] stop`).getAttribute('stop-color');
 });
 expect(pigment).toBe('#a15f43');
 await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()));
 await expect(page.locator('.place-references,.place-label')).toHaveCount(0);
 expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
 await expect(page.locator('.start-glow')).toHaveCount(1);
});
test('reduced motion keeps named start deduplication and styling through a preference change',async({page})=>{
 await open(page);await seek(page,650);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(names(page)).toHaveText(['Die Zwillingsinsel','Abendwacht']);
 await expect.poll(()=>page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).map(a=>({duration:a.effect.getTiming().duration,opacity:getComputedStyle(a.effect.target).opacity})))).toEqual(Array(4).fill({duration:3000,opacity:'1'}));
 await expect(start(page).locator('text')).toHaveAttribute('fill','#a15f43');
 await page.locator('.place-references').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()));
 await expect(names(page)).toHaveText([]);
 await page.locator('#nextClue').click();await expect(names(page)).toHaveText(['Abendwacht']);
 await expect(start(page)).toHaveAttribute('data-label-object','o4');
});
