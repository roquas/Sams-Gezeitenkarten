import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('watercolor-only chart, perspective rings, quiet start and intact hit areas',async({page})=>{
 const images=await page.locator('#map image').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 expect(images.length).toBeGreaterThan(9);expect(images.every(href=>href.startsWith('assets/seekarte/'))).toBe(true);
 await expect(page.locator('#map [data-start-marker]')).toHaveAttribute('fill','none');
 await expect(page.locator('#map [data-start-marker]')).toHaveAttribute('stroke-width','1.5');
 await expect(page.locator('[data-place-ring]')).toHaveCount(8);
 for(const transform of await page.locator('[data-place-ring]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform'))))expect(transform).toContain('scale(1 0.707');
 await expect(page.locator('#map [data-id]')).toHaveCount(25);
 await expect(page.locator('#map')).toHaveAttribute('viewBox','-24 -24 523 433');
 const p=await page.locator('#map [data-id="A1"] polygon').getAttribute('points');expect(p).toContain('91.18,74.00');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
