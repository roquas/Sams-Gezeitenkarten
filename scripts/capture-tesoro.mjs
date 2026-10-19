/** Review the existing gallery; magnification changes only the SVG viewport. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from '@playwright/test';
const url=process.argv[2]||'http://127.0.0.1:4183/dev/multihex-prototypes.html?asset=tesoro';
const directory='docs/reviews/tesoro';fs.mkdirSync(directory,{recursive:true});
const assetSha256=createHash('sha256').update(fs.readFileSync('assets/library/tesoro-h4-v1.png')).digest('hex');
const reports=[];
for(const [name,engine,viewport,dpr] of [
 ['chromium',chromium,{width:1440,height:1100},1],
 ['webkit',webkit,{width:1440,height:1100},1],
 ['mobile',chromium,{width:390,height:844},2]
]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport,deviceScaleFactor:dpr}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(url);
  await page.locator('#tesoroDetail [data-placement-id]').waitFor();
  if(await page.locator('#error').textContent())throw Error(await page.locator('#error').textContent());
  await page.locator('svg image').evaluateAll(nodes=>Promise.all(nodes.map(async n=>{const im=new Image();im.src=n.getAttribute('href');await im.decode();})));
  await page.evaluate(()=>document.fonts.ready);
  const normal=page.locator('#multihexPositions svg[data-position="Innen"]').first();
  const detail=page.locator('#tesoroDetail svg');
  if(name==='chromium'){
   await normal.screenshot({path:directory+'/tesoro-map.png'});
   await page.locator('#multihexComparison figure').filter({has:page.locator('svg[data-asset="land-coast.settlement.h4.tesoro.v1"]')}).screenshot({path:directory+'/tesoro-normal.png'});
   await detail.screenshot({path:directory+'/tesoro-enlarged.png'});
   await page.locator('#multihexPositions').screenshot({path:directory+'/tesoro-positions.png'});
   await page.locator('#multihexComparison').screenshot({path:directory+'/comparison.png'});
   await page.locator('#hexes').uncheck();
   await detail.screenshot({path:directory+'/tesoro-enlarged-clean.png'});
   await page.locator('#hexes').check();
   await page.locator('#marks').check();
   await normal.screenshot({path:directory+'/tesoro-map-overlays.png'});
   await page.locator('#marks').uncheck();
  }
  if(name==='mobile'){
   await normal.screenshot({path:directory+'/tesoro-mobile.png'});
   await detail.screenshot({path:directory+'/tesoro-detail-mobile.png'});
  }
  const geometry=await page.locator('#multihexComparison svg[data-asset="land-coast.settlement.h4.tesoro.v1"],#tesoroDetail svg,#multihexPositions svg').evaluateAll(nodes=>nodes.map(svg=>{
   const im=svg.querySelector('[data-placement-id]'),label=svg.querySelector('.island-label text');
   return {asset:svg.dataset.asset,anchor:svg.dataset.anchor,viewBox:svg.getAttribute('viewBox'),cssWidth:svg.getBoundingClientRect().width,
    rectangle:['x','y','width','height'].map(k=>+im.getAttribute(k)),transform:im.getAttribute('transform'),clip:im.getAttribute('clip-path'),
    blockedCells:[...svg.querySelectorAll('.blocked-cell')].map(n=>n.dataset.id),label:label.textContent,labelWidth:label.getComputedTextLength()};
  }));
  reports.push({name,viewport,dpr,assetSha256,errors,geometry});
  if(errors.length)throw Error(errors.join('; '));
 }finally{await browser.close();}
}
fs.writeFileSync(directory+'/browser-audit.json',JSON.stringify(reports,null,2)+'\n');
console.log('Tesoro: normal chart, enlarged view, four positions, overlays, Chromium/WebKit and mobile captured.');
