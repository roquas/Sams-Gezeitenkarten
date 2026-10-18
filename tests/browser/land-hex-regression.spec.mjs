import {test,expect} from '@playwright/test';

// Final behavior approved for PR #48: blocked terrain is a distance target,
// never an annotatable or navigable hex. Its subdued contour is unchanged.
test('blocked hexes stay dashed and unmarkable with mouse and keyboard',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map .blocked-cell')).toHaveCount(3);
 await expect(page.locator('#map .cell:not(.blocked-cell) .active-hour-edge').first()).toBeAttached();
 for(const id of ['B3','C3','E2']){
  const land=page.locator('#map [data-id="'+id+'"]');
  const outline=land.locator('polygon');
  await expect(land).toHaveAttribute('tabindex','0'); // radar keyboard selection
  await expect(outline).toHaveAttribute('stroke','#d6c59a');
  await expect(outline).toHaveAttribute('stroke-width','1.05');
  await expect(outline).toHaveAttribute('stroke-opacity','.62');
  await expect(outline).toHaveAttribute('stroke-dasharray','4 3');
  await expect(outline).toHaveAttribute('pointer-events','all');
  await expect(land.locator('.active-hour-edge')).toHaveCount(0);
  await land.click();
  await land.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(land).not.toContainText('?');
  await expect(land).not.toContainText('✓');
  await expect(land).not.toContainText('×');
 }
 await expect(page.locator('#count')).toContainText('0 Markierungen');
 // Normal water remains annotatable.
 await page.locator('#map [data-id="E3"]').click();
 await expect(page.locator('#map [data-id="E3"]')).toContainText('?');
 await page.reload();
 await expect(page.locator('#map [data-id="B3"]')).not.toContainText('?');
 await page.evaluate(()=>localStorage.clear());
});

test('blocked hexes can be chosen as radar distance origins, not route steps',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 const land=page.locator('#map [data-id="B3"]');
 const routeBefore=await page.locator('#routeView').textContent();
 await page.locator('#routeTool').click();
 await land.click();
 expect(await page.locator('#routeView').textContent()).toBe(routeBefore);
 await page.locator('#toggleDistances').click();
 await expect(page.locator('#toggleDistances')).toHaveAttribute('data-distance-state','waiting');
 await land.click();
 await expect(page.locator('#map .distance-overlay')).toHaveAttribute('data-distance-origin','B3');
 await expect(page.locator('#map [data-distance-cell="B3"]')).toHaveText('0');
 await expect(page.locator('#map [data-distance-cell="C3"]')).toHaveText('1');
 expect(await page.locator('#routeView').textContent()).toBe(routeBefore);
 // Distances survive a reload with a blocked origin.
 await page.reload();
 await expect(page.locator('#map .distance-overlay')).toHaveAttribute('data-distance-origin','B3');
 await expect(page.locator('#map [data-id="B3"]')).not.toContainText('?');
 // A single press switches off; reactivation chooses a fresh land target.
 await page.locator('#toggleDistances').click();
 await expect(page.locator('#map .distance-overlay')).toHaveCount(0);
 await page.locator('#toggleDistances').click();
 const next=page.locator('#map [data-id="C3"]');
 await next.focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('#map .distance-overlay')).toHaveAttribute('data-distance-origin','C3');
 await page.evaluate(()=>localStorage.clear());
});

test('coordinate inkblots show watercolor directly, without opaque beige circles',async({page})=>{
 for(const mode of ['final','quiet']){
  await page.goto('/?frame='+mode);
  const badges=page.locator('#map [data-margin-side="left"],#map [data-margin-side="right"]');
  await expect(badges).toHaveCount(10);
  await expect(badges.locator('circle[r="14"]')).toHaveCount(0);
  await expect(badges.locator('path')).toHaveCount(10);
  await expect(badges.locator('text')).toHaveCount(10);
 }
});
