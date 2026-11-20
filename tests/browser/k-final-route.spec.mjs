import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const {scenes}=JSON.parse(readFileSync(new URL('../fixtures/ui/k-final-scenes.json',import.meta.url)));
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const saved=(page,scene)=>page.evaluate(id=>JSON.parse(localStorage.getItem(`gezeitenkarten-${id}-schema2-data1`)),scene.puzzle);
const url=scene=>scene.puzzle==='model-demo'?'/?play=1':'/?dev=b2&puzzle='+scene.puzzle;
async function open(page,scene,{hour=1,numbers=true,radar=true,dense=false,route=scene.route}={}){
 await page.addInitScript(({scene,hour,numbers,radar,dense,route})=>{
  if(sessionStorage.getItem('k-final-seeded'))return;
  localStorage.setItem(`gezeitenkarten-${scene.puzzle}-schema2-data1`,JSON.stringify({route,layer:hour,tool:'route',marks:dense?scene.stressMarks:scene.referenceMarks,showRouteNumbers:numbers,distanceMode:radar,distanceOrigin:scene.origin}));
  sessionStorage.setItem('k-final-seeded','true');
 },{scene,hour,numbers,radar,dense,route});
 await page.goto(url(scene));await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
async function bandMarkup(page){return page.locator('.route-band').evaluate(g=>g.outerHTML);}
async function radarMarkup(page){return page.locator('.distance-overlay').evaluate(g=>g.outerHTML);}
async function capture(page,info,name){
 await page.mouse.move(0,0);
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.querySelectorAll('#map image')].map(async n=>{const i=new Image();i.src=n.href.baseVal;await i.decode();}));
 });
 const path=info.outputPath(name+'.png');await page.locator('#map').screenshot({path});
 await info.attach(name,{path,contentType:'image/png'});
}
test.beforeAll(()=>execFileSync('node',['scripts/export-b2-playtest.mjs']));

test('hour selection changes only direction pigment and number emphasis; radar and base are stable',async({page})=>{
 const scene=scenes[0];await open(page,scene);
 const band=await bandMarkup(page),radar=await radarMarkup(page);
 await expect(page.locator('.route-stroke')).toHaveCount(6);await expect(page.locator('.route-direction')).toHaveCount(6);
 const geometry=await page.locator('.route-direction').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));
 for(const hour of [1,3,6,2]){
  await page.locator(`[data-hour="${hour}"]`).click();
  expect(await bandMarkup(page)).toBe(band);expect(await radarMarkup(page)).toBe(radar);
  expect(await page.locator('.route-direction').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')))).toEqual(geometry);
  await expect(page.locator('.route-direction[data-route-current="true"]')).toHaveAttribute('data-route-hour',String(hour));
  await expect(page.locator('.route-numbers [data-route-current="true"]')).toHaveAttribute('data-route-hour',String(hour));
  await expect(page.locator('.selected-number-underline')).toHaveCount(1);
  const colors=await page.locator('.route-direction').evaluateAll(ns=>ns.map(n=>{
   const grad=document.getElementById(n.getAttribute('fill').slice(5,-1));
   return [...grad.children].map(s=>[s.getAttribute('stop-color'),+s.getAttribute('stop-opacity')]);
  }));
  colors.forEach((stops,i)=>{expect(stops[1]).toEqual(i+1===hour?['#a15f43',.84]:['#452d21',.64]);});
 }
 await page.locator('#toggleRouteNumbers').click();await expect(page.locator('.route-numbers')).toHaveCount(0);
 expect(await radarMarkup(page)).toBe(radar);expect(await bandMarkup(page)).toBe(band);
 await page.reload();await expect(page.locator('.route-numbers')).toHaveCount(0);
 await expect(page.locator('.route-direction')).toHaveCount(6);expect(await radarMarkup(page)).toBe(radar);
 await page.locator('#toggleRouteNumbers').click();await expect(page.locator('.route-numbers > g')).toHaveCount(6);
 await page.locator('#toggleDistances').click();await expect(page.locator('.distance-overlay')).toHaveCount(0);
 expect(await bandMarkup(page)).toBe(band);await expect(page.locator('.route-direction')).toHaveCount(6);
});

test('SVG paint order protects radar and game information, with transparent decorative hit targets',async({page})=>{
 await open(page,scenes[0],{hour:3,dense:true});
 const order=await page.locator('#map').evaluate(svg=>{
  const root=n=>{while(n.parentNode!==svg)n=n.parentNode;return [...svg.children].indexOf(n);};
  return ['.route-ink','.distance-overlay','.hex-surfaces','.route-numbers','.cell-information','[data-start-marker]'].map(s=>root(svg.querySelector(s)));
 });
 expect(order).toEqual([...order].sort((a,b)=>a-b));expect(new Set(order).size).toBe(order.length);
 for(const selector of ['.route-ink','.route-direction','.route-numbers','.hex-surfaces']){
  expect(await page.locator(selector).first().evaluate(n=>getComputedStyle(n).pointerEvents)).toBe('none');
 }
 await expect(page.locator('.cell-information .cell')).toHaveCount(25);
 await expect(page.locator('.route-numbers circle, .route-numbers text')).toHaveCount(0);
 const hits=[];
 for(const item of await page.locator('.route-numbers > g').all()){
  await item.scrollIntoViewIfNeeded();
  hits.push(await item.evaluate(n=>{
   const svg=n.ownerSVGElement,p=svg.createSVGPoint();p.x=0;p.y=0;
   const screen=p.matrixTransform(n.getScreenCTM()),hit=document.elementFromPoint(screen.x,screen.y);
   return hit?.closest('[data-id]')?.dataset.id;
  }));
 }
 expect(hits).toEqual(scenes[0].route.slice(1));
});

test('route editing, blocked cells, keyboard focus, undo and restoration remain intact',async({page,isMobile})=>{
 const scene=scenes[0];await open(page,scene,{route:scene.route.slice(0,3)});
 const activate=async id=>{if(isMobile)await cell(page,id).tap();else await cell(page,id).click();};
 const before=await saved(page,scene);
 // Revisit, non-neighbour, and blocked land are still rejected.
 await activate(scene.route[0]);await activate('E5');
 const blocked=await page.locator('.blocked-cell').first().getAttribute('data-id');
 await cell(page,blocked).focus();await page.keyboard.press('Enter');
 expect((await saved(page,scene)).route).toEqual(before.route);
 await cell(page,scene.route[3]).focus();await page.keyboard.press('Space');
 await expect(cell(page,scene.route[3])).toBeFocused();
 await expect(page.locator('.route-direction')).toHaveCount(3);
 await page.locator('#undo').click();await expect(page.locator('.route-direction')).toHaveCount(2);
 await activate(scene.route[3]);await expect(page.locator('.route-direction')).toHaveCount(3);
 await page.locator('#routeBack').click();await expect(page.locator('.route-direction')).toHaveCount(2);
 await page.locator('#undo').click();await expect(page.locator('.route-direction')).toHaveCount(3);
 await page.reload();await expect(page.locator('.route-direction')).toHaveCount(3);
 expect((await saved(page,scene)).route).toEqual(scene.route.slice(0,4));
 // Notes can still be made directly over the arrival annotation.
 await page.locator('[data-tool="yes"]').click();await activate(scene.route[2]);
 expect((await saved(page,scene)).marks['1:'+scene.route[2]]).toBe('yes');
});

const cases=[
 {name:'straight-first',scene:1,hour:1,numbers:true,radar:false},
 {name:'turns-middle-radar',scene:2,hour:2,numbers:true,radar:true},
 {name:'six-first',scene:0,hour:1,numbers:true,radar:true},
 {name:'six-middle-dense',scene:0,hour:3,numbers:true,radar:true,dense:true},
 {name:'six-last-no-numbers',scene:0,hour:6,numbers:false,radar:true},
 {name:'six-last-no-radar',scene:0,hour:6,numbers:true,radar:false},
 {name:'six-middle-paper',scene:0,hour:3,numbers:true,radar:false,paper:true},
 {name:'six-middle-zoom',scene:0,hour:3,numbers:true,radar:true,zoom:true}
];
for(const c of cases)test(`visual K-final ${c.name}`,async({page},info)=>{
 await open(page,scenes[c.scene],c);
 if(c.paper)await page.locator('#showChart').evaluate(n=>{n.checked=false;n.dispatchEvent(new Event('change'));});
 if(c.zoom)await page.locator('#map').evaluate(svg=>svg.setAttribute('viewBox','111 81 144 112'));
 await expect(page.locator('.route-direction')).toHaveCount(scenes[c.scene].steps);
 await capture(page,info,c.name);
});
