import {test,expect} from '@playwright/test';
import {interceptNewAssets} from '../integration/asset-library.mjs';

test('development gallery shows fixed single/multihex assets, separate places and explicit pending reviews',async({page},info)=>{
 const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 await page.goto('/dev/asset-library.html');
 await expect(page.locator('#gallery [data-asset-id]')).toHaveCount(5);
 await expect(page.locator('#error')).toBeEmpty();
 await expect(page.locator('#inventory')).toContainText('ohne Regelbedeutung');
 await expect(page.locator('#inventory')).toContainText('twin-islands / E5');
 const attributes=()=>page.locator('#gallery [data-asset-id]').evaluateAll(ns=>ns.map(n=>Object.fromEntries(['x','y','width','height','preserveAspectRatio','transform','data-art-cells'].map(k=>[k,n.getAttribute(k)]))));
 const original=await attributes();
 expect(original[1]['data-art-cells']).toBe('B3 C3');expect(original[1].width).toBe('154');
 expect(original.every(n=>n.preserveAspectRatio==='xMidYMid meet'&&n.transform===null)).toBe(true);
 for(const background of ['legacy-parchment-sea','prototype-sea','sea-blue-01']){
  await page.locator('#background').selectOption(background);
  await expect(page.locator('#status')).toContainText(background);
  expect(await attributes()).toEqual(original);
 }
 const decoded=await page.locator('#gallery image').evaluateAll(async ns=>Promise.all(ns.map(async n=>{const i=new Image();i.src=n.getAttribute('href');await i.decode();return [i.naturalWidth,i.naturalHeight];})));
 expect(decoded.slice(1)).toEqual([[288,320],[616,320],[288,320],[288,320],[288,320]]);
 await page.locator('#hexes').uncheck();await expect(page.locator('#gallery [data-gallery-layer="hexes"]')).toHaveAttribute('visibility','hidden');
 await info.attach('technical-assets-'+info.project.name,{body:await page.locator('#gallery').screenshot(),contentType:'image/png'});
 expect(failures).toEqual([]);
});

test('normal map renders the shared asset layer beneath hexes, labels and notes without changing land input',async({page},info)=>{
 await interceptNewAssets(page);await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
 const placement=page.locator('#map [data-placement-id="double"]');
 await expect(placement).toHaveAttribute('data-art-cells','B3 C3');
 const attrs=await placement.evaluate(n=>({x:+n.getAttribute('x'),y:+n.getAttribute('y'),w:+n.getAttribute('width'),h:+n.getAttribute('height'),ratio:n.getAttribute('preserveAspectRatio'),transform:n.getAttribute('transform')}));
 expect(attrs).toEqual({x:106,y:152,w:154,h:80,ratio:'xMidYMid meet',transform:null});
 expect(await placement.evaluate(n=>Boolean(n.compareDocumentPosition(document.querySelector('#map .place-label'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 expect(await placement.evaluate(n=>Boolean(n.compareDocumentPosition(document.querySelector('#map .cell'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await page.locator('#map [data-id="D1"]').press('Enter');
 await expect(page.locator('#map [data-id="D1"]')).toContainText('?');
 await page.locator('#map [data-id="B3"]').press('Enter');
 await expect(page.locator('#map [data-id="B3"]')).not.toContainText('?');
 await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
 await info.attach('integrated-assets-'+info.project.name,{body:await page.locator('#map').screenshot(),contentType:'image/png'});
});

test('DPR-2 tablet preserves uniform map and image scale',async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:820,height:1180},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();await interceptNewAssets(page);await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
  const scale=await page.locator('#map').evaluate(n=>{const m=n.getScreenCTM();return [m.a,m.b,m.c,m.d];});
  expect(scale[0]).toBeCloseTo(scale[3],8);expect(scale[1]).toBe(0);expect(scale[2]).toBe(0);
  expect(await page.evaluate(()=>devicePixelRatio)).toBe(2);
  await info.attach('tablet-assets-dpr2',{body:await page.locator('#map').screenshot(),contentType:'image/png'});
 }finally{await context.close();}
});
