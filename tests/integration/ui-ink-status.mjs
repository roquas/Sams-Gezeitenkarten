import {test,expect} from '@playwright/test';
import {selectionUse} from './webkit-startup.mjs';

const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
// document.load does not await the asynchronous DTO/catalog loader. Observe
// actual application readiness before checking a restored state or acting.
const ready=page=>cell(page,'C1').waitFor({state:'attached'});
const activate=async(page,method,locator)=>{
 if(method==='keyboard'){await locator.focus();await page.keyboard.press('Space');}
 else if(method==='touch')await locator.tap();else await locator.click();
};
const expectRadar=async(radar,phase)=>{
 await expect(radar).toHaveAttribute('data-distance-state',phase);
 await expect(radar).toHaveAttribute('aria-pressed',String(phase!=='inactive'));
 await expect(radar).toHaveAccessibleName({inactive:'Abstände einblenden',waiting:'Abstände: Jetzt ein Feld auf der Karte wählen. Erneut drücken zum Ausschalten.',showing:'Abstände ausschalten'}[phase]);
};
const layout=page=>page.evaluate(()=>{
 const parent=document.getElementById('chartPanel').getBoundingClientRect();
 return ['.mapbox','#mapActions','#distanceStatus','.bordbook'].map(selector=>{
  const r=document.querySelector(selector).getBoundingClientRect();return [r.x-parent.x,r.y-parent.y,r.width,r.height];
 });
});

const contrast=(a,b)=>{
 const lum=hex=>hex.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
export function registerInkStatusTests(url){
 for(const width of [390,820,1440])test.describe(`UI stabilization ${width}px`,()=>{
  test.use({viewport:{width,height:1000},hasTouch:true});
  test.describe(()=>{
  // These native input/state/layout checks use CSS pixels, as do the puzzle
  // selection tests. Linux WebKit's DPR-2 frame waits can exhaust their shared
  // budget before an assertion runs. Keep the rendering cases below at the
  // project's original density; Chromium also retains its original density.
  test.use(selectionUse);
  for(const method of ['click','keyboard','touch']){
   test(`radar ${method} selects and switches off without moving the status slot`,async({page})=>{
    await page.goto(url);await ready(page);await expect(cell(page,'C1')).toBeVisible();
    const radar=page.locator('#toggleDistances'),status=page.locator('#distanceStatus'),before=await layout(page);
    await expectRadar(radar,'inactive');
    await expect(status).toHaveAttribute('role','status');await expect(status).toHaveAttribute('aria-atomic','true');await expect(status).toBeEmpty();
    expect(before[2][1]).toBeGreaterThanOrEqual(before[1][1]+before[1][3]);
    await activate(page,method,radar);await expectRadar(radar,'waiting');
    await expect(page.locator('.distance-overlay')).toHaveCount(0);expect(await layout(page)).toEqual(before);
    await activate(page,method,cell(page,'C1'));await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');
    expect(await layout(page)).toEqual(before);expect(await status.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
    await page.locator('[data-tool="yes"]').click();await expectRadar(radar,'showing');
    await activate(page,method,radar);await expectRadar(radar,'inactive');
    await expect(page.locator('.distance-overlay')).toHaveCount(0);await expect(status).toBeEmpty();expect(await layout(page)).toEqual(before);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')).marks)).toEqual({});
   });
   test(`radar ${method} starts a fresh source without marking it`,async({page},info)=>{
    // This is exactly the completed-selection precondition of the preceding
    // scenario. Keep the full input matrix while bounding each DPR-2 case.
    await page.addInitScript(()=>{
     if(!sessionStorage.getItem('radar-fixture-seeded')){
      localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:'yes',distanceMode:true,distanceOrigin:'C1'}));
      sessionStorage.setItem('radar-fixture-seeded','true');
     }
    });
    await page.goto(url);await ready(page);const radar=page.locator('#toggleDistances'),status=page.locator('#distanceStatus');
    await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');const before=await layout(page);
    await activate(page,method,radar);await expectRadar(radar,'inactive');await expect(page.locator('.distance-overlay')).toHaveCount(0);await expect(status).toBeEmpty();expect(await layout(page)).toEqual(before);
    await activate(page,method,radar);await expectRadar(radar,'waiting');await expect(page.locator('.distance-overlay')).toHaveCount(0);
    await activate(page,method,cell(page,'A1'));await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','A1');await expect(cell(page,'A1')).not.toContainText('✓');expect(await layout(page)).toEqual(before);
   });
   test(`radar ${method} stays off through undo and reload`,async({page})=>{
    // Continue from the fresh A1 selection in a separate browser context;
    // reload must consume the real saved off state, never reseed this fixture.
    await page.addInitScript(()=>{
     if(!sessionStorage.getItem('radar-fixture-seeded')){
      localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:'yes',distanceMode:true,distanceOrigin:'A1'}));
      sessionStorage.setItem('radar-fixture-seeded','true');
     }
    });
    await page.goto(url);await ready(page);const radar=page.locator('#toggleDistances'),status=page.locator('#distanceStatus');
    await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','A1');const before=await layout(page);
    await activate(page,method,radar);await expectRadar(radar,'inactive');
    await expect(page.locator('.distance-overlay')).toHaveCount(0);await expect(status).toBeEmpty();expect(await layout(page)).toEqual(before);
    await page.locator('#undo').click();await expect(page.locator('.distance-overlay')).toHaveCount(0);
    await page.reload();await ready(page);await expectRadar(radar,'inactive');
   });
  }
  if(width===820)for(const tool of ['maybe','yes','no','erase','clearAll','route'])test(`radar stays dismissible after selecting ${tool}`,async({page})=>{
   await page.addInitScript(tool=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:tool==='maybe'?'route':'maybe',distanceMode:true,distanceOrigin:'C1'})),tool);
   await page.goto(url);await ready(page);
   const radar=page.locator('#toggleDistances'),status=page.locator('#distanceStatus'),before=await layout(page);
   await page.locator(`[data-tool="${tool}"]`).click();
   await expect(page.locator(`[data-tool="${tool}"]`)).toHaveAttribute('aria-pressed','true');
   await expectRadar(radar,'showing');await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');expect(await layout(page)).toEqual(before);
   await radar.tap();await expectRadar(radar,'inactive');await expect(page.locator('.distance-overlay')).toHaveCount(0);await expect(status).toBeEmpty();expect(await layout(page)).toEqual(before);
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')).marks)).toEqual({});
  });
  });
  test('route contrast, equal other hours and active edges follow the selected hour',async({page})=>{
   // Route entry is already covered by the route/undo suites. This case
   // exercises the real hour transition with that same legal route restored.
   await page.addInitScript(()=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5','B5','C5','D5'],layer:1,tool:'route'})));
   await page.goto(url);await ready(page);await expect(cell(page,'D4')).toBeVisible();
   await page.locator('[data-hour="2"]').click();
   const paths=page.locator('.route-stroke');await expect(paths).toHaveCount(3);
   const styles=await paths.evaluateAll(nodes=>nodes.map(n=>({current:n.dataset.routeCurrent,stroke:n.getAttribute('stroke'),width:n.getAttribute('stroke-width'),opacity:+n.getAttribute('opacity'),dash:n.getAttribute('stroke-dasharray')})));
   expect(styles[0]).toEqual(styles[2]);
   expect(styles[1].current).toBe('true');expect(styles[1].dash).toBeNull();
   expect(styles[0].dash).toBe('8 5');expect(+styles[1].width).toBeGreaterThan(+styles[0].width);
   expect(styles.every(s=>s.opacity>=.9)).toBe(true);
   for(const style of styles)expect(contrast(style.stroke,'#fff0ce')).toBeGreaterThan(4.5);
   await expect(page.locator('.blocked-cell .active-hour-edge')).toHaveCount(0);
   await expect(page.locator('.edge-ink')).toHaveCount(22);
   const edge=page.locator('.edge-ink').first();await expect(edge).toHaveAttribute('data-active-hour','2');
   expect(contrast(await edge.getAttribute('stroke'),'#fff2d4')).toBeGreaterThan(4.5);
   // Retain the original transition while the decorative chart is disabled.
   await page.locator('#showChart').evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change'));});
   await page.locator('[data-hour="3"]').click();await expect(page.locator('.edge-ink').first()).toHaveAttribute('data-active-hour','3');
   await expect(page.locator('.route-stroke[data-route-current="true"]')).toHaveAttribute('data-route-hour','3');
  });
  test('radar status screenshot below the toolbar',async({page},info)=>{
   await page.addInitScript(()=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5'],layer:1,tool:'yes',distanceMode:true,distanceOrigin:'A1'})));
   await page.goto(url);await ready(page);await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','A1');
   const status=page.locator('#distanceStatus');await expect(status).not.toBeEmpty();await status.scrollIntoViewIfNeeded();
   await page.evaluate(()=>document.fonts.ready);const path=info.outputPath(`status-${width}.png`);
   await page.screenshot({path});await info.attach(`status-${width}`,{path,contentType:'image/png'});
  });
  for(const art of [true,false])test(`route and edge screenshot on ${art?'chart':'paper'}`,async({page},info)=>{
   // Pixel inspection is a separate rendering scenario. Interaction and
   // transitions above still execute all real route/hour controls. Seeding a
   // legal persisted route avoids repeating those edits in each image case.
   await page.addInitScript(()=>localStorage.setItem('gezeitenkarten-model-demo-schema2-data1',JSON.stringify({route:['A5','B5','C5','D5'],layer:2,tool:'route'})));
   await page.goto(url);await ready(page);await expect(page.locator('.route-stroke')).toHaveCount(3);
   await expect(page.locator('.edge-ink').first()).toHaveAttribute('data-active-hour','2');
   await page.locator('#showChart').evaluate((el,checked)=>{el.checked=checked;el.dispatchEvent(new Event('change'));},art);
   await expect(page.locator('.route-stroke[data-route-current="true"]')).toHaveCount(1);
   const map=page.locator('.mapbox');await map.scrollIntoViewIfNeeded();
   const sizes=await page.locator('#map').evaluate(async svg=>{
    await document.fonts.ready;
    const sizes=await Promise.all([...svg.querySelectorAll('[data-chart-layer] image')].map(async image=>{
     const decoded=new Image();decoded.src=image.href.baseVal;await decoded.decode();return [decoded.naturalWidth,decoded.naturalHeight];
    }));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return sizes;
   });
   expect(sizes.length).toBeGreaterThanOrEqual(3);expect(sizes.every(([w,h])=>w>0&&h>0)).toBe(true);
   const name=`ink-${width}-${art?'chart':'paper'}`,path=info.outputPath(name+'.png');
   await map.screenshot({path});await info.attach(name,{path,contentType:'image/png'});
  });

 });
}
