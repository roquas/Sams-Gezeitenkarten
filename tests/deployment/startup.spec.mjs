import {test,expect} from '@playwright/test';

test('former .mjs entry is rejected on the observed MIME configuration',async({page},info)=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 const entry=page.waitForResponse(r=>r.url().endsWith('/src/ui/game.mjs'));
 await page.goto('legacy/');const response=await entry;
 expect(response.status()).toBe(200);expect(response.headers()['content-type']).toBeUndefined();
 expect(response.headers()['x-content-type-options']).toBe('nosniff');
 await expect.poll(()=>errors.join('\n')).toMatch(/MIME|mime|JavaScript module|script.*type/i);
 await expect(page.locator('#map .cell')).toHaveCount(0);
 await expect(page.locator('#puzzleSelect option')).toHaveCount(0);
 await info.attach('former-entry-console',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
});

test('cold start draws 25 hexes and settings work through visible controls',async({page,isMobile},info)=>{
 const errors=[],network=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('requestfailed',request=>errors.push(request.url()+': '+request.failure()?.errorText));
 page.on('response',response=>network.push({url:response.url(),status:response.status(),type:response.headers()['content-type']}));
 await page.goto('./');
 await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('#hours [data-hour]')).toHaveCount(6);
 await expect(page.locator('#map image').first()).toBeVisible();
 if(isMobile){await page.getByRole('button',{name:'Logbuch anzeigen',exact:true}).tap();}
 else if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();
 await page.locator('summary').filter({hasText:'Einstellungen'}).click();
 const select=page.locator('#puzzleSelect');await expect(select).toBeVisible();await expect(select).toBeEnabled();
 await expect(select.locator('option')).toHaveCount(4);
 await select.selectOption('quittung-nombreo');await expect(page.locator('#puzzleStatus')).toContainText('Geladen: Die Quittung');
 await info.attach('startup-settings-'+info.project.name,{body:await page.screenshot({type:'jpeg',quality:85,scale:'css'}),contentType:'image/jpeg'});
 if(await page.locator('#chartTab').isVisible()){if(isMobile)await page.locator('#chartTab').tap();else await page.locator('#chartTab').click();}
 await expect(page.locator('#map')).toBeVisible();await expect(page.locator('#map .cell')).toHaveCount(25);
 await expect(page.locator('h1')).toHaveText('Die Quittung von Nombreo');
 await info.attach('startup-chart-'+info.project.name,{body:await page.screenshot({type:'jpeg',quality:85,scale:'css'}),contentType:'image/jpeg'});
 expect(network.filter(r=>r.url.endsWith('.mjs'))).toEqual([]);
 expect(network.filter(r=>r.url.endsWith('.js')).every(r=>r.status===200&&/javascript/.test(r.type))).toBe(true);
 expect(network.some(r=>r.url.endsWith('/puzzles/manifest.json')&&r.status===200)).toBe(true);
 expect(network.filter(r=>r.status>=400)).toEqual([]);expect(errors).toEqual([]);
 await info.attach('startup-network-'+info.project.name,{body:JSON.stringify(network,null,2),contentType:'application/json'});
});
