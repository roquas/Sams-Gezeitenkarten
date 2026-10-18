import {test,expect} from '@playwright/test';

const cell=(page,id)=>page.locator(`#map [data-id="${id}"]`);
const contrast=(a,b)=>{
 const lum=hex=>hex.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
export function registerInkStatusTests(url){
 for(const width of [390,820,1440])test.describe(`UI stabilization ${width}px`,()=>{
  test.use({viewport:{width,height:1000},hasTouch:true});
  test('radar click, keyboard and native touch keep a stable status slot',async({page})=>{
   await page.goto(url);await expect(cell(page,'C1')).toBeVisible();
   const radar=page.locator('#toggleDistances'),status=page.locator('#distanceStatus');
   const layout=()=>page.evaluate(()=>{
    const parent=document.getElementById('chartPanel').getBoundingClientRect();
    return ['.mapbox','#mapActions','#distanceStatus','.bordbook'].map(selector=>{
     const r=document.querySelector(selector).getBoundingClientRect();return [r.x-parent.x,r.y-parent.y,r.width,r.height];
    });
   });
   const before=await layout();
   await expect(status).toHaveAttribute('role','status');await expect(status).toHaveAttribute('aria-atomic','true');
   await expect(status).toBeEmpty();
   expect(before[2][1]).toBeGreaterThanOrEqual(before[1][1]+before[1][3]);
   for(const method of ['click','keyboard','touch']){
    const activate=async locator=>{
     if(method==='keyboard'){await locator.focus();await page.keyboard.press('Space');}
     else if(method==='touch')await locator.tap();
     else await locator.click();
    };
    await activate(radar);await expect(radar).toHaveAttribute('data-distance-state','waiting');
    await expect(page.locator('.distance-overlay')).toHaveCount(0);
    await activate(cell(page,'C1'));await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','C1');
    await page.locator('[data-tool="yes"]').click();await expect(radar).toHaveAttribute('data-distance-state','showing');
    await expect(radar).toHaveAccessibleName('Abstände ausschalten');
    await activate(radar);await expect(radar).toHaveAttribute('data-distance-state','inactive');
    await expect(page.locator('.distance-overlay')).toHaveCount(0);await expect(status).toBeEmpty();
    expect(await layout()).toEqual(before);
   }
   await radar.tap();await cell(page,'B3').tap();await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','B3');
   await radar.tap();await radar.tap();await expect(page.locator('.distance-overlay')).toHaveCount(0);
   await expect(radar).toHaveAttribute('data-distance-state','waiting');
   await cell(page,'A1').focus();await page.keyboard.press('Enter');
   await expect(page.locator('.distance-overlay')).toHaveAttribute('data-distance-origin','A1');
   expect(await layout()).toEqual(before);
   expect(await status.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
   await expect(cell(page,'A1')).not.toContainText('✓');
   await radar.click();await page.locator('#undo').click();await expect(page.locator('.distance-overlay')).toHaveCount(0);
   await page.reload();await expect(radar).toHaveAttribute('data-distance-state','inactive');
  });
  test('current route and hour edge remain readable over chart and paper',async({page},info)=>{
   await page.goto(url);await expect(cell(page,'D4')).toBeVisible();
   await page.locator('#routeTool').click();
   for(const id of ['E3','D2','C2','B2'])await cell(page,id).click();
   await page.locator('[data-hour="2"]').click();
   const paths=page.locator('.route-stroke');await expect(paths).toHaveCount(4);
   const styles=await paths.evaluateAll(nodes=>nodes.map(n=>({current:n.dataset.routeCurrent,stroke:n.getAttribute('stroke'),width:n.getAttribute('stroke-width'),opacity:+n.getAttribute('opacity'),dash:n.getAttribute('stroke-dasharray')})));
   expect(styles[0]).toEqual(styles[2]);expect(styles[2]).toEqual(styles[3]);
   expect(styles[1].current).toBe('true');expect(styles[1].dash).toBeNull();
   expect(styles[0].dash).toBe('8 5');expect(+styles[1].width).toBeGreaterThan(+styles[0].width);
   expect(styles.every(s=>s.opacity>=.9)).toBe(true);
   for(const style of styles)expect(contrast(style.stroke,'#fff0ce')).toBeGreaterThan(4.5);
   await expect(page.locator('.blocked-cell .active-hour-edge')).toHaveCount(0);
   await expect(page.locator('.edge-ink')).toHaveCount(22);
   const edge=page.locator('.edge-ink').first();await expect(edge).toHaveAttribute('data-active-hour','2');
   expect(contrast(await edge.getAttribute('stroke'),'#fff2d4')).toBeGreaterThan(4.5);
   for(const art of [true,false]){
    await page.locator('#showChart').evaluate((el,checked)=>{el.checked=checked;el.dispatchEvent(new Event('change'));},art);
    await expect(page.locator('.route-stroke[data-route-current="true"]')).toHaveCount(1);
    await info.attach(`ink-${width}-${art?'chart':'paper'}`,{body:await page.locator('.mapbox').screenshot(),contentType:'image/png'});
   }
   await page.locator('[data-hour="3"]').click();await expect(page.locator('.edge-ink').first()).toHaveAttribute('data-active-hour','3');
   await expect(page.locator('.route-stroke[data-route-current="true"]')).toHaveAttribute('data-route-hour','3');
  });
 });
}
