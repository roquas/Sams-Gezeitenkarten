import {installTechnicalTemplate} from './chart-template-browser.mjs';
// Run from repository root: node scripts/capture-parchment-frame.mjs
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+'/'))throw Error('outside root');
  const data=await readFile(path);
  res.setHeader('Content-Type',({'.svg':'image/svg+xml','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'})[extname(path)]||'application/octet-stream');
  res.end(data);
 }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.FRAME_BROWSER_PATH||undefined});
try{
 const results=[];
 await mkdir('docs/screenshots/seekarte-template',{recursive:true});
 for(const width of [320,390,768,1440,2560]){
  const page=await browser.newPage({viewport:{width,height:1200},deviceScaleFactor:2});
  await page.goto(`http://127.0.0.1:${server.address().port}/?frame=raster`);
  await page.waitForSelector('#map .cell');await page.evaluate(()=>document.fonts.ready);
  results.push(await page.evaluate(({width})=>{
   const box=n=>{const b=n.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};};
   const map=document.querySelector('#map');
   const rect=map.getBoundingClientRect();
   return {width,dpr:devicePixelRatio,map:{width:rect.width,height:rect.height},
    headings:[...document.querySelectorAll('[data-margin-side]')].map(n=>({side:n.dataset.marginSide,index:Number(n.dataset.marginIndex),anchor:Number(n.dataset.marginCenter),bbox:box(n),text:box(n.querySelector('text'))})),
    objects:[...document.querySelectorAll('[data-chart-layer="objects"] image')].map(n=>Object.fromEntries(['x','y','width','height'].map(a=>[a,Number(n.getAttribute(a))]))) };
  },{width}));
  await page.locator('#map').screenshot({path:`docs/screenshots/seekarte-template/current-${width}.jpg`,type:'jpeg',quality:85});
  await installTechnicalTemplate(page);
  await page.locator('#map').screenshot({path:`docs/screenshots/seekarte-template/template-${width}.jpg`,type:'jpeg',quality:85});
  await page.close();
 }
 const preview=await browser.newPage();
 await preview.goto(`http://127.0.0.1:${server.address().port}/docs/seekarte-template/template.svg`);
 const png=await preview.evaluate(async()=>{const im=new Image();im.src=location.href;await im.decode();const c=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');c.width=2252;c.height=1892;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/png').split(',')[1];});
 await writeFile('docs/seekarte-template/template.png',Buffer.from(png,'base64'));await preview.close();
 await mkdir('docs/seekarte-template',{recursive:true});
 await writeFile('docs/seekarte-template/measurements.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results[0]));console.log(results.map(r=>({width:r.width,map:r.map})));
}finally{await browser.close();server.close();}
