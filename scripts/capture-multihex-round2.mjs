/** Capture the existing gallery with the real map renderer; no separate viewer. */
import fs from 'node:fs';
import {chromium,webkit} from '@playwright/test';
import {multihexPrototypes} from '../dev/multihex-prototypes.mjs';
const url=process.argv[2]||'http://127.0.0.1:4179/dev/multihex-prototypes.html';
const directory='docs/reviews/multihex-round2';
fs.mkdirSync(directory,{recursive:true});
const reports=[];
for(const [name,engine,viewport,dpr] of [['chromium',chromium,{width:1440,height:1100},1],['webkit',webkit,{width:1440,height:1100},1],['mobile',chromium,{width:390,height:844},2]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport,deviceScaleFactor:dpr}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(url);await page.locator('#multihexComparison [data-placement-id]').first().waitFor();
  if(await page.locator('#error').textContent())throw Error(await page.locator('#error').textContent());
  const decode=()=>page.locator('svg image').evaluateAll(ns=>Promise.all(ns.map(async n=>{const i=new Image();i.src=n.getAttribute('href');await i.decode();})));
  await decode();await page.evaluate(()=>document.fonts.ready);
  if(name==='chromium'){
   for(const [marks,hexes,suffix] of [[false,true,'hexes'],[true,true,'overlays'],[false,false,'clean']]){
    await page.locator('#marks').setChecked(marks);await page.locator('#hexes').setChecked(hexes);await decode();
    await page.locator('#multihexComparison').screenshot({path:directory+'/comparison-'+suffix+'.png'});
   }
   await page.locator('#hexes').check();await page.locator('#marks').uncheck();
   await page.locator('#multihexApproved').screenshot({path:directory+'/approved-references.png'});
   for(const p of multihexPrototypes.filter(p=>!p.approved)){
    await page.locator('#multihexAsset').selectOption(p.key);await decode();
    await page.locator('#multihexPositions').screenshot({path:directory+'/positions-'+p.key+'.png'});
    await page.locator('#multihexComparison svg[data-asset="'+p.id+'"]').screenshot({path:directory+'/detail-'+p.key+'.png'});
   }
  }
  reports.push({name,viewport,dpr,errors,geometry:await page.locator('#multihexComparison svg').evaluateAll(ns=>ns.map(svg=>{
   const n=svg.querySelector('[data-placement-id]'),text=svg.querySelector('.island-label text');
   return {id:svg.dataset.asset,anchor:svg.dataset.anchor,viewBox:svg.getAttribute('viewBox'),rectangle:['x','y','width','height'].map(k=>+n.getAttribute(k)),transform:n.getAttribute('transform'),clip:n.getAttribute('clip-path'),label:text.textContent,labelWidth:text.getComputedTextLength(),blockedCells:[...svg.querySelectorAll('.blocked-cell')].map(n=>n.dataset.id),cssWidth:svg.getBoundingClientRect().width};
  }))});
  if(name==='mobile')await page.locator('#multihexComparison').screenshot({path:directory+'/comparison-mobile.png'});
  if(errors.length)throw Error(errors.join('; '));
 }finally{await browser.close();}
}
fs.writeFileSync(directory+'/browser-audit.json',JSON.stringify(reports,null,2)+'\n');
console.log('Captured six motifs, two approved references, positions, overlays, clean and mobile views; three device/engine audits.');
