import {test,expect} from '@playwright/test';
import {interceptNewAssets} from '../integration/asset-library.mjs';

test('development gallery shows fixed single/multihex assets, separate places and explicit pending reviews',async({page},info)=>{
 const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 await page.goto('/dev/asset-library.html');
 await expect(page.locator('#gallery [data-asset-id]')).toHaveCount(5);
 await expect(page.locator('#error')).toBeEmpty();
 for(const id of ['technical.single.v1','technical.double.v1','technical.lighthouse.v1','technical.decoration.v1']){
  await page.locator('#reviewAsset').selectOption(id);
  await expect(page.locator('#positions svg[data-row-parity="gerade"]')).toHaveCount(2);
  await expect(page.locator('#positions svg[data-row-parity="ungerade"]')).toHaveCount(2);
  await expect(page.locator('#positions svg[data-position="Rand"]')).toHaveCount(2);
  await expect(page.locator('#positions svg[data-position="Innen"]')).toHaveCount(2);
  expect(await page.locator('#positions [data-footprint]').count()).toBeGreaterThan(4);
 }
 await expect(page.locator('#inventory')).toContainText('ohne Regelbedeutung');
 await expect(page.locator('#inventory')).toContainText('twin-islands / E5');
 const attributes=()=>page.locator('#gallery [data-asset-id]').evaluateAll(ns=>ns.map(n=>Object.fromEntries(['x','y','width','height','preserveAspectRatio','transform','data-art-cells'].map(k=>[k,n.getAttribute(k)]))));
 const original=await attributes();
 expect(original[1]['data-art-cells']).toBe('B3 C3');expect(original[1].width).toBe('172');
 expect(original.every(n=>n.preserveAspectRatio==='xMidYMid meet'&&n.transform===null)).toBe(true);
 for(const background of ['legacy-parchment-sea','prototype-sea','sea-blue-01']){
  await page.locator('#background').selectOption(background);
  await expect(page.locator('#status')).toContainText(background);
  expect(await attributes()).toEqual(original);
 }
 const decoded=await page.locator('#gallery image').evaluateAll(async ns=>Promise.all(ns.map(async n=>{const i=new Image();i.src=n.getAttribute('href');await i.decode();return [i.naturalWidth,i.naturalHeight];})));
 expect(decoded.slice(1)).toEqual([[360,408],[688,408],[360,408],[360,408],[360,408]]);
 await page.locator('#hexes').uncheck();await expect(page.locator('#gallery [data-gallery-layer="hexes"]')).toHaveAttribute('visibility','hidden');
 await info.attach('technical-assets-'+info.project.name,{body:await page.locator('#gallery').screenshot(),contentType:'image/png'});
 expect(failures).toEqual([]);
});

test('water-rich and water-reduced spires are independently selectable at the same gallery scale',async({page})=>{
 await page.goto('/dev/asset-library.html');
 const states=[];
 for(const id of ['land-coast.island.h1.basalt-spire.v1','land-coast.island.h1.basalt-spire-water.v1']){
  await page.locator('#reviewAsset').selectOption(id);
  const status=id==='land-coast.island.h1.basalt-spire-water.v1'?'approved':'pending';
  await expect(page.locator('#status')).toContainText(id+' / '+status);
  const images=page.locator('#positions [data-asset-id="'+id+'"]');
  await expect(images).toHaveCount(4);
  states.push(await images.evaluateAll(async ns=>Promise.all(ns.map(async n=>{
   const i=new Image();i.src=n.getAttribute('href');await i.decode();
   return {anchor:n.closest('svg').dataset.anchor,source:i.src,decoded:[i.naturalWidth,i.naturalHeight],
    x:n.getAttribute('x'),y:n.getAttribute('y'),width:n.getAttribute('width'),height:n.getAttribute('height'),
    transform:n.getAttribute('transform'),clip:n.getAttribute('clip-path')};
  }))));
  for(const state of states.at(-1)){
   expect(state.decoded).toEqual([360,408]);expect(state.width).toBe('90');expect(state.height).toBe('102');
   expect(state.transform).toBeNull();expect(state.clip).toBeNull();
  }
 }
 expect(states[0].map(({source,...s})=>s)).toEqual(states[1].map(({source,...s})=>s));
 expect(states[0][0].source).not.toBe(states[1][0].source);
 await page.locator('#background').selectOption('prototype-sea');
 await expect(page.locator('#status')).toContainText('land-coast.island.h1.basalt-spire-water.v1 / pending');
 await expect(page.locator('#error')).toBeEmpty();
});

test('normal map renders the shared asset layer beneath hexes, labels and notes without changing land input',async({page},info)=>{
 await interceptNewAssets(page);await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map [data-placement-id]')).toHaveCount(4);
 const placement=page.locator('#map [data-placement-id="double"]');
 await expect(placement).toHaveAttribute('data-art-cells','B3 C3');
 const attrs=await placement.evaluate(n=>({x:+n.getAttribute('x'),y:+n.getAttribute('y'),w:+n.getAttribute('width'),h:+n.getAttribute('height'),ratio:n.getAttribute('preserveAspectRatio'),transform:n.getAttribute('transform')}));
 expect(attrs).toEqual({x:97,y:141,w:172,h:102,ratio:'xMidYMid meet',transform:null});
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

test('adjacent alpha masks render identically in either draw order on both row parities',async({page})=>{
 await page.goto('/dev/asset-library.html');
 await expect(page.locator('#gallery [data-asset-id]')).toHaveCount(5);
 await page.evaluate(async()=>{
  const {drawAssetPlacements}=await import('/src/ui/asset-layer.mjs');
  const {HEXES}=await import('/src/ui/chart-geometry.mjs');
  const el=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const forms={single:[[0,0]],'triple-asymmetric':[[0,0],[1,0],[1,1]]};
  const sources={};
  for(const name of Object.keys(forms)){
   const mask=new Image();mask.src='/docs/asset-templates/'+name+'.png';await mask.decode();
   sources[name]=['#e6414180','#155dc580','#17a05e80'].map(color=>{
    const c=document.createElement('canvas');c.width=mask.naturalWidth;c.height=mask.naturalHeight;
    const ctx=c.getContext('2d');ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);return c.toDataURL();
   });
  }
  const svg=el('svg',{id:'order-proof',viewBox:'70 55 260 210',width:520,height:420});
  svg.style.cssText='width:520px;max-width:100%;height:auto;background:white';document.body.replaceChildren(svg);
  window.drawOrderProof=async({anchors,shapes},reverse)=>{
   const library={assets:anchors.map((_,i)=>({id:'mask-'+i,geometry:{cells:forms[shapes?.[i]??'single']},image:{path:'docs/asset-templates/single.png'}}))};
   svg.replaceChildren();
   const placements=anchors.map((anchor,i)=>({id:'mask-'+i,assetId:'mask-'+i,anchor}));
   drawAssetPlacements(el,svg,reverse?placements.toReversed():placements,library,Object.fromEntries(HEXES.map(h=>[h.id,h])));
   for(const image of svg.querySelectorAll('image')){
    const i=Number(image.getAttribute('data-asset-id').at(-1));image.setAttribute('href',sources[shapes?.[i]??'single'][i]);
   }
   await Promise.all([...svg.querySelectorAll('image')].map(async image=>{const i=new Image();i.src=image.getAttribute('href');await i.decode();}));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  };
 });
 for(const configuration of [
  ...[['B2','C2'],['B3','C3'],['B2','C3'],['B3','B4'],['B2','C2','C3']].map(anchors=>({anchors})),
  {anchors:['B2','D2'],shapes:['triple-asymmetric','single']}
 ]){
  await page.evaluate(c=>window.drawOrderProof(c,false),configuration);
  const forward=await page.locator('#order-proof').screenshot();
  await page.evaluate(c=>window.drawOrderProof(c,true),configuration);
  expect(await page.locator('#order-proof').screenshot()).toEqual(forward);
 }
});

test('passable prototypes share real sea, map scale and production notes with independent toggles',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dev/asset-library.html#passable-prototypes');
 const cards=page.locator('#prototypeComparison svg');await expect(cards).toHaveCount(3);
 for(const svg of await cards.all()){
  await expect(svg.locator('[data-chart-layer="sea"] image')).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
  await expect(svg.locator('.cell')).toHaveCount(25);
  await expect(svg.locator('.blocked-cell')).toHaveCount(0);
  const b3=svg.locator('[data-id="B3"]');
  await expect(b3.locator('circle')).toHaveCount(6);
  await expect(b3).toContainText('×');await expect(b3).toContainText('✓');
  await expect(svg.locator('.route-stroke')).toHaveCount(2);
  const image=svg.locator('[data-placement-id="prototype"]');
  await expect(image).toHaveAttribute('width','90');await expect(image).toHaveAttribute('height','102');
  expect(await image.evaluate(n=>Boolean(n.compareDocumentPosition(n.closest('svg').querySelector('.cell'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }
 for(const id of ['navigation.lighthouse.h1.offcenter-beacon.v1','land-coast.atoll.h1.broken-passages.v1','navigation.wreck.h1.offcenter-sloop.v1']){
  await page.locator('#reviewAsset').selectOption(id);await expect(page.locator('#status')).toContainText(id+' / pending');
  await expect(page.locator('#positions [data-asset-id="'+id+'"]')).toHaveCount(4);
 }
 await page.locator('#prototypeMarks').uncheck();
 await expect(page.locator('#prototypeComparison .cell circle')).toHaveCount(0);
 await expect(page.locator('#prototypeComparison .route-stroke')).toHaveCount(0);
 await page.locator('#hexes').uncheck();
 for(const svg of await cards.all())await expect(svg.locator('[data-id="B3"] polygon')).toHaveAttribute('visibility','hidden');
 await page.locator('#background').selectOption('prototype-sea');
 for(const svg of await cards.all())await expect(svg.locator('[data-chart-layer="sea"] image')).toHaveAttribute('href','assets/seekarte/sea-blue-01.webp');
 await expect(page.locator('#error')).toBeEmpty();expect(errors).toEqual([]);
 await info.attach('passable-prototypes-'+info.project.name,{body:await page.locator('#prototypeComparison').screenshot(),contentType:'image/png'});
});
