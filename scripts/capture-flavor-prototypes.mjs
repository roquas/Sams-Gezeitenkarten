/** Reproducible screenshots of exact catalog bytes through the real renderer. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from '@playwright/test';
import {flavorPrototypes} from '../dev/flavor-prototypes.mjs';

const directory='docs/reviews/water-finale';
const library=JSON.parse(fs.readFileSync('assets/catalog/library.json'));
const byId=new Map(library.assets.map(a=>[a.id,a]));
const url=process.argv[2]||'http://127.0.0.1:4184/dev/asset-library.html#minigrafiken';
fs.mkdirSync(directory,{recursive:true});
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=flavorPrototypes.map(p=>({key:p.key,assetSha256:hash(byId.get(p.id).image.path)}));
const reports=[];
for(const [name,engine,viewport,dpr] of [
 ['chromium',chromium,{width:1440,height:1100},1],
 ['webkit',webkit,{width:1440,height:1100},1],
 ['mobile',chromium,{width:390,height:844},2],
 ['iphone',webkit,{width:390,height:844},2]
]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport,deviceScaleFactor:dpr}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(url);await page.locator('#flavorComparison [data-placement-id]').first().waitFor();
  if(await page.locator('#error').textContent())throw Error(await page.locator('#error').textContent());
  await page.locator('svg image').evaluateAll(nodes=>Promise.all(nodes.map(async n=>{const im=new Image();im.src=n.getAttribute('href');await im.decode();})));
  await page.evaluate(()=>document.fonts.ready);
  const geometry=await page.locator('#flavorComparison svg,#flavorMap').evaluateAll(nodes=>nodes.map(svg=>({
   flavor:svg.dataset.flavor,viewBox:svg.getAttribute('viewBox'),cssWidth:svg.getBoundingClientRect().width,
   scale:svg.getBoundingClientRect().width/svg.viewBox.baseVal.width,
   blocked:svg.querySelectorAll('.blocked-cell').length,labels:svg.querySelectorAll('.island-label,[data-place-ring]').length,
   images:[...svg.querySelectorAll('[data-placement-id]')].map(im=>({id:im.dataset.assetId,rect:['x','y','width','height'].map(k=>+im.getAttribute(k)),transform:im.getAttribute('transform'),clip:im.getAttribute('clip-path')}))
  })));
  await page.locator('#hexes').uncheck();
  if(name==='chromium'){
   await page.locator('#flavorComparison').screenshot({path:directory+'/round-normal-clean.png'});
   await page.locator('#smallPlacesComparison').screenshot({path:directory+'/approved-places-normal.png'});
   for(const index of ['0','1','2']){await page.locator('#flavorMapPage').selectOption(index);await page.locator('#flavorMap').screenshot({path:directory+'/map-'+index+'-normal.png'});}
   await page.locator('#flavorMapPage').selectOption('0');
   await page.locator('#flavorMap').screenshot({path:directory+'/map-normal-clean.png'});
   for(const p of flavorPrototypes){
    await page.locator('#flavorAsset').selectOption(p.key);
    await page.locator('#flavorDetail').screenshot({path:directory+'/'+p.key+'-enlarged.png'});
   }
   await page.locator('#hexes').check();
   await page.locator('#flavorComparison').screenshot({path:directory+'/round-normal-hexes.png'});
   await page.locator('#prototypeMarks').check();
   await page.locator('#flavorComparison').screenshot({path:directory+'/round-normal-overlays.png'});
   await page.locator('#smallPlacesComparison').screenshot({path:directory+'/approved-places-overlays.png'});
   await page.locator('#flavorMap').screenshot({path:directory+'/map-normal-overlays.png'});
  }
  if(name==='mobile'||name==='iphone')await page.locator('#flavorMap').screenshot({path:directory+'/map-'+name+'.png'});
  reports.push({name,viewport,dpr,backgroundSha256:hash('assets/seekarte/sea-blue-01.webp'),files,errors,geometry});
  if(errors.length)throw Error(errors.join('; '));
 }finally{await browser.close();}
}
fs.writeFileSync(directory+'/browser-audit.json',JSON.stringify(reports,null,2)+'\n');
console.log('Final water round: current exact catalog images, 1:1 and enlarged, six approved places, sparse 2/3-motif maps, Chromium/WebKit desktop and mobile captured.');
