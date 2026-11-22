import {chromium,webkit,devices,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.B1_CI_BASE_URL??'http://127.0.0.1:4195';
const out=process.env.B1_CI_OUTPUT??'.dev/b1-browser-ci-probe';fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const hashes=Object.fromEntries(['src/beta/landing.mjs','src/beta/clock.mjs','src/beta/session.mjs','src/beta/storage.mjs'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
for(const [ref,digest] of Object.entries(hashes)){const original=execFileSync('git',['show','6e1b108:'+ref]);expect(createHash('sha256').update(original).digest('hex')).toBe(digest);}
const result={head:'6e1b108fcb372b8c72d863ec0ebb29ce127c02ec',productHashes:hashes,feedback:null,timers:[]};
const cr=await chromium.launch();
try{
 const page=await cr.newPage({viewport:{width:1440,height:1000}});
 const manifest=read('puzzles/manifest.json');manifest.defaultId='model-demo';manifest.puzzles=manifest.puzzles.filter(p=>p.id==='model-demo');
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));
 let calls=0,release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/puzzles/model-demo.json',async r=>{if(++calls===2)await gate;await r.continue();});
 await page.goto(base+'/?puzzle=model-demo');await expect(page.locator('#map .cell[data-id=A5]')).toBeVisible();
 await page.locator('#backToSelection').click();
 const details=page.locator('#feedbackRecords details').first();await details.locator('summary').click();
 await page.evaluate(()=>window.openedFeedback=document.querySelector('#feedbackRecords details'));
 const before=await details.evaluate(e=>({open:e.open,connected:e.isConnected,version:e.querySelector('p').textContent,commentVisible:e.querySelector('textarea').getBoundingClientRect().height>0}));
 before.commentVisible=await details.locator('[name=comment]').isVisible();
 await page.screenshot({path:out+'/feedback-open-during-load.png',scale:'css'});
 release();await expect(page.locator('#puzzleCards .beta-card a.btn')).toBeVisible();
 const after=await page.evaluate(()=>{const e=document.querySelector('#feedbackRecords details');return {oldConnected:window.openedFeedback.isConnected,open:e.open,version:e.querySelector('p').textContent,commentVisible:e.querySelector('textarea').getBoundingClientRect().height>0,records:Object.keys(localStorage).filter(k=>k.startsWith('gezeitenkarten-beta-v1:record:')).map(k=>JSON.parse(localStorage.getItem(k)))};});
 after.commentVisible=await details.locator('[name=comment]').isVisible();
 let error;try{await details.locator('[name=comment]').fill('Version eins',{timeout:1000});}catch(e){error=e.message;}
 expect(before.open).toBe(true);expect(after.oldConnected).toBe(false);expect(after.open).toBe(false);expect(error).toContain('not visible');
 await page.screenshot({path:out+'/feedback-replaced-after-load.png',scale:'css'});
 result.feedback={fixturePuzzleIds:manifest.puzzles.map(p=>p.id),calls,before,after,oldFillFailed:!!error,error};
 console.log('Feedback:',JSON.stringify({before,after:{...after,records:after.records.map(r=>({puzzleId:r.identity.puzzleId,dataVersion:r.identity.dataVersion,comment:r.feedback.comment}))},oldFillFailed:!!error}));
 await page.close();
}finally{await cr.close();}
const wk=await webkit.launch();
try{
 for(const profile of ['desktop','mobile'])for(const mode of ['original','paused']){
  const page=await wk.newPage(profile==='desktop'?{...devices['Desktop Safari']}:{...devices['iPhone 13'],deviceScaleFactor:1});
  await page.addInitScript(()=>{
   window.betaAudit=[];
   const manager=Object.getPrototypeOf(navigator.locks),request=manager.request;
   manager.request=function(name,options,callback){
    if(name.startsWith('gk-beta-time:'))window.betaAudit.push({event:'request',now:performance.now()});
    return request.call(this,name,options,async lock=>{
     if(lock&&name.startsWith('gk-beta-time:')&&!window.initialGateUsed){
      window.initialGateUsed=true;window.betaAudit.push({event:'native-grant-held',now:performance.now()});
      await new Promise(resolve=>window.deliverInitialBetaGrant=()=>{window.betaAudit.push({event:'grant-delivered',now:performance.now()});resolve();});
     }
     const value=callback(lock);
     if(lock&&name.startsWith('gk-beta-time:'))window.betaAudit.push({event:'product-owner-set',now:performance.now()});
     return value;
    });
   };
   const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(key.startsWith('gezeitenkarten-beta-v1:record:')){const r=JSON.parse(value);window.betaAudit.push({event:'persist',now:performance.now(),activeMs:r.phases.at(-1)?.activeMs});}
    return set.call(this,key,value);
   };
  });
  if(mode==='paused'){
   await page.clock.install({time:new Date('2026-11-20T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-20T12:00:01Z'));
  }else await page.clock.install();
  await page.goto(base+'/?puzzle=model-demo');await expect(page.locator('#map .cell[data-id=A5]')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>typeof window.deliverInitialBetaGrant)).toBe('function');
  // Deliberate test-host delay of native delivery; product source remains byte-identical.
  await new Promise(resolve=>setTimeout(resolve,1500));
  const waiting=await page.evaluate(()=>({now:performance.now(),events:window.betaAudit,records:Object.keys(localStorage).filter(k=>k.startsWith('gezeitenkarten-beta-v1:record:')).map(k=>JSON.parse(localStorage.getItem(k)))}));
  expect(waiting.records[0].phases[0].activeMs).toBe(0);
  await page.evaluate(()=>window.deliverInitialBetaGrant());
  await expect(page.locator('#betaTime [role=status]')).toHaveText('Aktive Zeit läuft · Näherungswert');
  const start=await page.evaluate(()=>performance.now());
  await page.clock.runFor(6000);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('gezeitenkarten-beta-v1:record:')))).phases[0].activeMs);
  await page.locator('#betaTime button').click();
  const final=await page.evaluate(()=>({now:performance.now(),events:window.betaAudit,activeMs:JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('gezeitenkarten-beta-v1:record:')))).phases[0].activeMs}));
  const entry={profile,mode,waiting,start,storedAfter6000:stored,originalMinimum4000Passed:stored>=4000,afterPause:final};
  result.timers.push(entry);console.log('Timer:',JSON.stringify({profile,mode,start,storedAfter6000:stored,afterPause:final.activeMs,events:final.events}));
  if(mode==='original')expect(stored).toBeLessThan(4000);else expect(stored).toBeGreaterThanOrEqual(4000);
  expect(final.activeMs).toBeGreaterThanOrEqual(6000);
  await page.close();
 }
}finally{await wk.close();fs.writeFileSync(out+'/negative-controls.json',JSON.stringify(result,null,2)+'\n');}
