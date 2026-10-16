// Explicit, read-only diagnostic; never a dependency of the regular offline suite.
import {chromium,webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
const url=process.env.LIVE_URL;
if(!url||!/^https:\/\//.test(url))throw Error('Set LIVE_URL to the explicitly requested HTTPS deployment');
await fs.mkdir('live-diagnostics',{recursive:true});
for(const [name,engine,device] of [['desktop',chromium,devices['Desktop Chrome']],['iphone',webkit,devices['iPhone 13']],['ipad',webkit,devices['iPad (gen 7)']]]){
 const browser=await engine.launch(),context=await browser.newContext({...device,deviceScaleFactor:1}),page=await context.newPage();
 const report={url,profile:name,console:[],exceptions:[],network:[],failed:[]};
 page.on('console',message=>report.console.push({level:message.type(),text:message.text()}));
 page.on('pageerror',error=>report.exceptions.push(error.message));
 page.on('requestfailed',request=>report.failed.push({url:request.url(),error:request.failure()?.errorText}));
 page.on('response',response=>report.network.push({url:response.url(),status:response.status(),headers:response.headers()}));
 try{
  await page.goto(url,{waitUntil:'load',timeout:45000});
  report.cells=await page.locator('#map .cell').count();report.options=await page.locator('#puzzleSelect option').count();
  if(await page.locator('#logbookTab').isVisible()){
   await page.locator('#logbookTab').click({timeout:5000});
   report.mobileView=await page.locator('body').getAttribute('data-mobile-view');
  }
  await page.screenshot({path:`live-diagnostics/${name}.jpg`,type:'jpeg',quality:85});
 }catch(error){report.diagnosticError=error.message;}
 await fs.writeFile(`live-diagnostics/${name}.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({profile:name,cells:report.cells,options:report.options,mobileView:report.mobileView,console:report.console,exceptions:report.exceptions}));
 await browser.close();
}
