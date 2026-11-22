// Reproducible crops of real HTML controls and the actual SVG renderer.
// Start scripts/dev-server.py --port 4175 first. No image synthesis or redraw.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=process.env.RULES_BASE_URL??'http://127.0.0.1:4175';
const out=new URL('../assets/rules/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1200},deviceScaleFactor:2,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state={route:['A1','B1','C1'],layer:2,tool:'maybe',showRouteNumbers:true,marks:{
 '2:A2':'maybe','2:B2':'yes','2:C2':'no','1:A2':'no','4:A2':'yes','5:B2':'maybe','3:C2':'yes'
}};
await page.addInitScript(state=>localStorage.setItem('gezeitenkarten-drei-peilungen-schema2-data1',JSON.stringify(state)),state);
await page.goto(base+'/?puzzle=drei-peilungen');
await page.locator('#map .cell').first().waitFor();
await page.waitForFunction(()=>document.querySelectorAll('#map .route-stroke').length===2);
await page.evaluate(async()=>{
 await document.fonts.ready;
 await Promise.all([...document.querySelectorAll('#map image')].map(el=>new Promise((resolve,reject)=>{
  const im=new Image();im.onload=resolve;im.onerror=reject;im.src=el.getAttribute('href');
 })));
});
// A2b's real labels expire naturally; keep them out of the teaching crops.
await page.waitForFunction(()=>!document.querySelector('#map .place-label'),{},{timeout:10000});
async function cropMap(ids,pad=12){
 await page.locator('#map').scrollIntoViewIfNeeded();
 const clip=await page.locator('#map').evaluate((svg,{ids,pad})=>{
  const rects=ids.map(id=>svg.querySelector(`.cell[data-id="${id}"] polygon`).getBoundingClientRect());
  const x=Math.min(...rects.map(r=>r.x))-pad,y=Math.min(...rects.map(r=>r.y))-pad;
  return {x,y,width:Math.max(...rects.map(r=>r.right))-x+pad,height:Math.max(...rects.map(r=>r.bottom))-y+pad};
 },{ids,pad});
 return page.screenshot({clip,animations:'disabled'});
}
const hours=await page.locator('#hours').screenshot();
const hourHex=await cropMap(['B2']);
const marks=await cropMap(['A2','B2','C2']);

const route=await cropMap(['A1','B1','C1'],22);
const routeList=await page.locator('#routeView').screenshot();
await page.setViewportSize({width:390,height:1000});
const top=await page.locator('#tools').screenshot();
const lower=await page.locator('#mapActions').screenshot();
await page.setViewportSize({width:1440,height:1200});
await page.locator('[data-tool=clearAll]').click();
for(const id of ['A2','B2','C2']){await page.locator(`#map .cell[data-id="${id}"]`).focus();await page.keyboard.press('Enter');}
await page.locator('#routeBack').click();await page.locator('#routeBack').click();
const titleMap=await page.locator('#map').screenshot({type:'jpeg',quality:85,scale:'css'});
fs.writeFileSync(new URL('title-map.jpg',out),titleMap);
// Arrange source screenshots on quiet paper without changing any source pixels.
const sheet=await browser.newPage({viewport:{width:1000,height:1000},deviceScaleFactor:2});
const dimensions={};
async function compose(name,width,shots){
 await sheet.setViewportSize({width,height:1000});
 await sheet.setContent(`<html><body style="margin:0"><div id="sheet" style="box-sizing:border-box;width:${width}px;padding:16px;background:#efe1c5;display:flex;flex-direction:column;align-items:center;gap:18px">${shots.map(b=>`<img style="display:block;max-width:100%;height:auto" src="data:image/png;base64,${b.toString('base64')}">`).join('')}</div></body></html>`);
 await sheet.locator('img').evaluateAll(els=>Promise.all(els.map(async e=>{await e.decode();e.style.width=e.naturalWidth/2+'px';})));
 dimensions[name]=await sheet.locator('#sheet').evaluate(e=>({width:e.offsetWidth*2,height:e.offsetHeight*2}));
 await sheet.locator('#sheet').screenshot({path:new URL(name+'.png',out).pathname});
}
await compose('hours',480,[hours,hourHex]);
await compose('marks',440,[marks]);
await compose('tools',390,[top,lower]);
await compose('route',480,[route,routeList]);
if(errors.length)throw Error(errors.join('\n'));
const hashes=Object.fromEntries(['title-map','hours','marks','tools','route'].map(name=>[name,createHash('sha256').update(fs.readFileSync(new URL(name+(name==='title-map'?'.jpg':'.png'),out))).digest('hex')]));
fs.writeFileSync(new URL('../docs/verification/B1-rules/figure-provenance.json',import.meta.url),JSON.stringify({url:'?puzzle=drei-peilungen',browser:browser.version(),viewport:{width:1440,height:1200},deviceScaleFactor:2,state,titleState:{route:['A1'],marks:{},layer:2},toolViewport:{width:390,height:1000},dimensions,sha256:hashes},null,2)+'\n');
console.log(JSON.stringify(dimensions));
await browser.close();
