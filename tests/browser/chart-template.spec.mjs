import {test,expect} from '@playwright/test';
import {installTechnicalTemplate} from '../../scripts/chart-template-browser.mjs';
test.use({deviceScaleFactor:2});
for(const width of [320,390,768,1440,2560])test(`phase 1 geometry and technical paper mask at ${width}px, DPR 2`,async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.setViewportSize({width,height:1200});await page.goto('/?frame=raster');await page.waitForSelector('#map .cell');await page.evaluate(()=>document.fonts.ready);
 const before=await page.locator('.cell').evaluateAll(ns=>ns.map(n=>n.outerHTML));
 await installTechnicalTemplate(page);
 expect(await page.locator('.cell').evaluateAll(ns=>ns.map(n=>n.outerHTML))).toEqual(before);
 await expect(page.locator('#map .cell')).toHaveCount(25);
 const result=await page.evaluate(async()=>{
  const {headingZones,CHART_ASSET_SPEC:s}=await import('/src/ui/chart-asset-contract.mjs');
  const zones=headingZones(),nodes=[...document.querySelectorAll('[data-margin-side]')];
  const img=new Image();img.src='/docs/seekarte-template/frame-mask.svg';await img.decode();
  const c=document.createElement('canvas');c.width=s.pixelWidth;c.height=s.pixelHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
  const labels=nodes.map(n=>{
   const z=zones.find(z=>z.side===n.dataset.marginSide&&z.index===Number(n.dataset.marginIndex)),b=n.getBBox();
   // SVG DOMRect uses float32; allow only numerical rounding (0.0001 SVG units).
   const e=1e-4,within=b.x>=z.bounds[0]-e&&b.y>=z.bounds[1]-e&&b.x+b.width<=z.bounds[2]+e&&b.y+b.height<=z.bounds[3]+e;
   const [l,t,r,bt]=z.bounds;const x=Math.ceil((l-s.x)*4),y=Math.ceil((t-s.y)*4),w=Math.floor((r-s.x)*4)-x,h=Math.floor((bt-s.y)*4)-y;
   const pixels=ctx.getImageData(x,y,w,h).data;let opaque=true;for(let i=3;i<pixels.length;i+=4)if(pixels[i]!==255)opaque=false;
   return {side:z.side,index:z.index,bounds:[b.x,b.y,b.width,b.height],within,opaque,anchor:Number(n.dataset.marginCenter)===(z.side==='top'||z.side==='bottom'?z.y:z.x)};
  });
  const texts=nodes.map(n=>{const b=n.querySelector('text').getBBox(),z=zones.find(z=>z.side===n.dataset.marginSide&&z.index===Number(n.dataset.marginIndex));return b.x>=z.hard[0]&&b.y>=z.hard[1]&&b.x+b.width<=z.hard[2]&&b.y+b.height<=z.hard[3];});
  const {HEXES,CHART_CENTER}=await import('/src/ui/chart-geometry.mjs');
  const hit=HEXES.map(h=>{const n=document.querySelector(`[data-id="${h.id}"] polygon`);return {id:h.id,points:n.getAttribute('points'),expected:h.polygon.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')};});
  const vb=document.querySelector('#map').viewBox.baseVal;
  const centered=vb.x+vb.width/2===CHART_CENTER[0]&&vb.y+vb.height/2===CHART_CENTER[1];
  const m=document.querySelector('#map').getScreenCTM();
  return {labels,texts,hit,centered,dpr:devicePixelRatio,scale:[m.a,m.d],overflow:document.documentElement.scrollWidth>innerWidth,
   layers:[...document.querySelectorAll('[data-chart-layer]')].map(n=>({name:n.dataset.chartLayer,pointer:getComputedStyle(n).pointerEvents})),
   images:[...document.querySelectorAll('[data-chart-layer="sea"] image,[data-chart-layer="frame"] image')].map(n=>n.getAttribute('preserveAspectRatio'))};
 });
 expect(result.centered).toBe(true);expect(result.texts.every(Boolean)).toBe(true);expect(result.hit.every(h=>h.points===h.expected)).toBe(true);expect(result.dpr).toBe(2);expect(result.labels).toHaveLength(20);expect(result.labels.filter(x=>!x.within||!x.opaque||!x.anchor)).toEqual([]);
 expect(result.scale[0]).toBeCloseTo(result.scale[1],6);expect(result.overflow).toBe(false);
 expect(result.layers.map(x=>x.name)).toEqual(['sea','objects','frame']);expect(result.layers.every(x=>x.pointer==='none')).toBe(true);
 expect(result.images).toEqual(['xMidYMid meet','xMidYMid meet']);
 await testInfo.attach(`technical-template-${width}-dpr2`,{body:await page.locator('#map').screenshot(),contentType:'image/png'});
 // The fixture leaves every existing pointer/keyboard handler intact.
 const target=page.locator('#map [data-id="E3"]');await target.click();await expect(target).toContainText('?');
 await target.focus();await page.keyboard.press('Enter');await expect(target).not.toContainText('?');
 // All 25 polygons remain visible. All 22 navigable fields support real pointer
 // and keyboard actions; the three land cells keep their existing inert behavior.
 const ids=await page.locator('.cell:not(.blocked-cell)').evaluateAll(ns=>ns.map(n=>n.dataset.id));
 for(const id of ids){const cell=page.locator(`[data-id="${id}"]`);await cell.click();await expect(cell).toContainText('?');await cell.focus();await page.keyboard.press('Enter');await expect(cell).not.toContainText('?');}
 await expect(page.locator('.blocked-cell')).toHaveCount(3);
 expect(errors).toEqual([]);
});
