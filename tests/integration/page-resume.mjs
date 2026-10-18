import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

async function attachJSON(info,name,value){
 const path=info.outputPath(name+'.json');await writeFile(path,JSON.stringify(value,null,2));
 await info.attach(name,{path,contentType:'application/json'});
}

const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-reference-3.6-schema1-data1')));
const position=page=>page.evaluate(()=>innerWidth<=880?document.getElementById('gameSurface').scrollTop:scrollY);
async function record(page){
 return page.evaluate(()=>({
  document:window.resumeProbe,
  navigation:performance.getEntriesByType('navigation').map(n=>n.toJSON()),
  paint:performance.getEntriesByType('paint').map(n=>n.toJSON()),
  resources:performance.getEntriesByType('resource').map(n=>({name:n.name,type:n.initiatorType,duration:n.duration,bytes:n.transferSize})),
  playableAt:performance.now()
 }));
}
export function registerResumeTests(url){
 test('history return and a real reload preserve state and identify the actual lifecycle',async({page},info)=>{
  await page.addInitScript(()=>{
   window.resumeProbe={token:String(Math.random()),events:[]};
   for(const type of ['pageshow','pagehide','visibilitychange'])addEventListener(type,e=>window.resumeProbe.events.push({type,trusted:e.isTrusted,time:performance.now(),persisted:e.persisted??null,visibility:document.visibilityState}));
  });
  await page.goto(url);await expect(page.locator('#map .cell')).toHaveCount(25);
  await page.locator('[data-hour="3"]').click();await page.locator('[data-tool="yes"]').click();await page.locator('#map [data-id="A1"]').click();
  await page.locator('#toggleDistances').click();await page.locator('#map [data-id="C1"]').click();
  const before=await saved(page),token=await page.evaluate(()=>window.resumeProbe.token);
  await page.evaluate(()=>{
   window.resumeMap=document.getElementById('map');window.resumeArt=document.querySelector('[data-chart-layer="sea"]');
   if(innerWidth<=880)document.getElementById('gameSurface').scrollTop=120;else scrollTo(0,120);
  });
  const scrollBefore=await position(page);
  // This is an event-handler contract, not a claim of physical app switching
  // or a real BFCache restoration. No resume event may rebuild a healthy map.
  await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  expect(await page.evaluate(()=>window.resumeMap===document.getElementById('map')&&window.resumeArt===document.querySelector('[data-chart-layer="sea"]'))).toBe(true);
  expect(await saved(page)).toEqual(before);expect(await position(page)).toBe(scrollBefore);
  const eventContract=await record(page);
  await page.goto('data:text/html,<title>History probe</title><p>Another document</p>');
  await page.goBack({waitUntil:'domcontentloaded'});await expect(page.locator('#map .cell')).toHaveCount(25);
  expect(await saved(page)).toEqual(before);
  const historyReturn=await record(page),persisted=historyReturn.document.events.filter(e=>e.type==='pageshow'&&e.trusted).at(-1)?.persisted;
  if(persisted){
   expect(historyReturn.document.token).toBe(token);expect(await position(page)).toBe(scrollBefore);
   expect(await page.evaluate(()=>window.resumeMap===document.getElementById('map'))).toBe(true);
  }else{
   expect(historyReturn.document.token).not.toBe(token);
   expect(historyReturn.navigation[0].type).toBe('back_forward');
  }
  await expect(page.locator('[data-hour="3"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-tool="yes"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');
  await page.reload();await expect(page.locator('#map .cell')).toHaveCount(25);
  const reloaded=await record(page);expect(reloaded.document.token).not.toBe(historyReturn.document.token);
  expect(reloaded.navigation[0].type).toBe('reload');expect(await saved(page)).toEqual(before);
  await attachJSON(info,'resume-lifecycle',{eventContract,historyReturn,reloaded,scrollBefore,scrollAfter:await position(page)});
 });
 test('delayed chart decoding leaves a usable paper map and never resets notes',async({page},info)=>{
  let release;const gate=new Promise(resolve=>release=resolve);let held=0;
  await page.route('**/assets/seekarte/*.webp',async route=>{held++;await gate;await route.continue();});
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});await expect(page.locator('#map .cell')).toHaveCount(25);
   await expect.poll(()=>held).toBeGreaterThan(0);
   await expect(page.locator('#map>rect').first()).toHaveAttribute('fill','#e9d5b0');
   const cell=page.locator('#map [data-id="A1"]');await cell.focus();await page.keyboard.press('Enter');
   await expect(cell).toContainText('?');expect((await saved(page)).marks).toEqual({'1:A1':'maybe'});
  }finally{release();}
  const images=await page.evaluate(async()=>Promise.all([...document.querySelectorAll('#map [data-chart-layer] image')].map(async image=>{
   const decoded=new Image();decoded.src=image.href.baseVal;await decoded.decode();return {src:decoded.src,width:decoded.naturalWidth,height:decoded.naturalHeight};
  })));
  expect(images.length).toBeGreaterThanOrEqual(3);expect(images.every(image=>image.width>0&&image.height>0)).toBe(true);
  expect((await saved(page)).marks).toEqual({'1:A1':'maybe'});await expect(page.locator('#map .cell')).toHaveCount(25);
  await attachJSON(info,'cold-chart-timeline',await record(page));
 });
}
