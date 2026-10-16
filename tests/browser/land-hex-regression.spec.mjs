import {test,expect} from '@playwright/test';

// Regression from Issue #40 / PR #38: blocked land remains annotatable,
// but may neither enter a route nor serve as a distance origin.
test('land has dotted readable borders, no active hour edge, and remains annotatable',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#map .blocked-cell')).toHaveCount(3);
 await expect(page.locator('#map .cell:not(.blocked-cell) .active-hour-edge').first()).toBeAttached();
 for(const id of ['B3','C3','E2']){
  const land=page.locator('#map [data-id="'+id+'"]');
  const outline=land.locator('polygon');
  await expect(land).toHaveAttribute('tabindex','0');
  await expect(outline).toHaveAttribute('stroke','#d6c59a');
  await expect(outline).toHaveAttribute('stroke-width','1.05');
  await expect(outline).toHaveAttribute('stroke-opacity','.62');
  await expect(outline).toHaveAttribute('stroke-dasharray','4 3');
  await expect(outline).toHaveAttribute('pointer-events','all');
  await expect(land.locator('.active-hour-edge')).toHaveCount(0);
  await land.click();
  await expect(land).toContainText('?');
  await land.focus();
  await page.keyboard.press('Enter');
  await expect(land).not.toContainText('?');
  await land.focus();
  await page.keyboard.press('Space');
  await expect(land).toContainText('?');
 }
 // Undo still removes the most recent annotation, before any page reload.
 await page.locator('#undo').click();
 await expect(page.locator('#map [data-id="E2"]')).not.toContainText('?');
 // A fresh render preserves the remaining annotations across frame variants.
 await page.goto('/?frame=quiet');
 await expect(page.locator('#map [data-id="B3"]')).toContainText('?');
 await expect(page.locator('#map [data-id="B3"] .active-hour-edge')).toHaveCount(0);
 await page.evaluate(()=>localStorage.clear());
});

test('land notes never make an impassable hex a route step or distance origin',async({page})=>{
 await page.goto('/');
 const land=page.locator('#map [data-id="B3"]');
 await land.click();
 await expect(land).toContainText('?');
 const routeBefore=await page.locator('#routeView').textContent();
 await page.locator('#routeTool').click();
 await land.click();
 expect(await page.locator('#routeView').textContent()).toBe(routeBefore);
 await page.locator('#toggleDistances').click();
 await land.click();
 await expect(page.locator('#map .distance-overlay')).toHaveCount(0);
 await page.evaluate(()=>localStorage.clear());
});
