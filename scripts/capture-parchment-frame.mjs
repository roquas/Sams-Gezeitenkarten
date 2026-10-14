// Run from repository root: node scripts/capture-parchment-frame.mjs
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+'/'))throw Error('outside root');
  const data=await readFile(path);
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'})[extname(path)]||'application/octet-stream');
  res.end(data);
 }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.FRAME_BROWSER_PATH||undefined});
try{
 const dir='docs/screenshots/parchment-frame';await mkdir(dir,{recursive:true});
 for(const width of [1440,390,320])for(const mode of ['legacy','raster','modular']){
  const page=await browser.newPage({viewport:{width,height:1100},deviceScaleFactor:2});
  await page.goto(`http://127.0.0.1:${server.address().port}/?frame=${mode}`);
  await page.waitForSelector('#map .cell');await page.evaluate(async()=>{
   await document.fonts.ready;
   await Promise.all([...document.querySelectorAll('#map image')].map(async n=>{
    const i=new Image();i.src=n.getAttribute('href');await i.decode();
   }));
  });
  await page.locator('#map').screenshot({path:`${dir}/${mode}-${width}.jpg`,type:'jpeg',quality:90});
  if(mode==='raster')await page.screenshot({path:`${dir}/page-${width}.jpg`,type:'jpeg',quality:85,fullPage:true});
  console.log(width,mode,await page.locator('#map').boundingBox());await page.close();
 }
}finally{await browser.close();server.close();}
