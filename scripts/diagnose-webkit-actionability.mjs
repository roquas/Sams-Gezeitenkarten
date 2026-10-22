// Run the unchanged selection assertions in fresh Linux/WebKit workers.
// Generated fixtures/configuration live outside the checkout and never ship.
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir,availableParallelism,loadavg,platform,arch,cpus} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const variant=process.argv[2]||'baseline';
const variants=['baseline','frames','reduced-motion','dpr1','single-load','warm-browser','warm-dpr1'];
if(!variants.includes(variant))throw Error('Unknown variant: '+variant);
const output=resolve(root,'actionability-results',variant);
mkdirSync(output,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),'gk-actionability-'));
const require=createRequire(import.meta.url);
const testModule=pathToFileURL(join(dirname(require.resolve('@playwright/test')),'index.mjs')).href;
const settings={variant,monitor:variant!=='baseline',dpr:variant.includes('dpr1')?1:2,
 motion:variant==='reduced-motion'?'reduce':'no-preference'};
writeFileSync(join(output,'environment.json'),JSON.stringify({settings,platform:platform(),arch:arch(),node:process.version,
 cpu:cpus()[0]?.model,parallelism:availableParallelism(),load:loadavg()},null,2));

writeFileSync(join(temp,'fixture.mjs'),`
import {test as base,expect} from ${JSON.stringify(testModule)};
import {writeFileSync} from 'node:fs';
export {expect};
// Diagnostic variants control density in the generated project configuration.
export const selectionUse={trace:'retain-on-failure'};
export const test=base.extend({
 bootstrap:[async({browser},use,workerInfo)=>{
  const start=Date.now(),meta={worker:workerInfo.workerIndex,variant:${JSON.stringify(variant)}};
  if(meta.variant.startsWith('warm-')){
   const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});
   try{
    const page=await context.newPage();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }finally{await context.close();}
  }
  meta.elapsedMs=Date.now()-start;
  writeFileSync(${JSON.stringify(output)}+'/worker-'+workerInfo.workerIndex+'.json',JSON.stringify(meta));
  await use();
 },{scope:'worker',auto:true}],
 page:async({context},use,testInfo)=>{
 const started=Date.now(),page=await context.newPage();
 const meta={title:testInfo.title,repeat:testInfo.repeatEachIndex,worker:testInfo.workerIndex,
  pageCreationMs:Date.now()-started,fixtureStartedAt:started,settings:${JSON.stringify(settings)}};
 if(meta.settings.monitor)await page.addInitScript(()=>{
  const data=window.__actionability={frames:[],rectChanges:[],mutations:0,animations:[]};
  const stored=JSON.parse(sessionStorage.getItem('__gkActionability')||'[]');
  addEventListener('pagehide',()=>sessionStorage.setItem('__gkActionability',JSON.stringify([...stored,data])));
  const previous=new Map();let last;
  new MutationObserver(records=>data.mutations+=records.length).observe(document,{subtree:true,childList:true,attributes:true});
  function frame(now){
   if(last!==undefined)data.frames.push({at:now,gap:now-last});last=now;
   for(const selector of ['#map [data-id="E3"]','#undo']){
    const el=document.querySelector(selector);if(!el)continue;
    const r=el.getBoundingClientRect(),box=[r.x,r.y,r.width,r.height];
    const old=previous.get(selector);
    if(old&&box.some((v,i)=>v!==old[i]))data.rectChanges.push({at:now,selector,old,box});
    previous.set(selector,box);
   }
   const active=document.getAnimations().filter(a=>a.playState==='running');
   if(active.length)data.animations.push({at:now,targets:active.map(a=>a.effect?.target?.id||a.effect?.target?.className?.baseVal||a.effect?.target?.className||null)});
   if(data.frames.length<2000)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
 try{await use(page);}finally{
  try{meta.documents=await page.evaluate(()=>({url:location.href,timing:performance.getEntriesByType('navigation')[0]?.toJSON(),metrics:window.__actionability,history:JSON.parse(sessionStorage.getItem('__gkActionability')||'[]')}));}catch(e){meta.collectionError=e.message;}
  meta.elapsedMs=Date.now()-started;
  writeFileSync(testInfo.outputPath('actionability.json'),JSON.stringify(meta,null,2));
 }
}});
`);
let source=readFileSync(join(root,'tests/integration/model-game.mjs'),'utf8')
 .replace("from './webkit-startup.mjs'", "from './fixture.mjs'")
 .replace("new URL('../../'+p,import.meta.url)", "new URL(p,"+JSON.stringify(pathToFileURL(root+'/').href)+")");
source+="\nregisterModelTests('/');\n";
writeFileSync(join(temp,'model.spec.mjs'),source);
writeFileSync(join(temp,'playwright.config.mjs'),`
import {defineConfig,devices} from ${JSON.stringify(testModule)};
export default defineConfig({
 testDir:${JSON.stringify(temp)},testMatch:'model.spec.mjs',fullyParallel:false,workers:1,
 retries:0,failOnFlakyTests:true,repeatEach:3,
 grep:/a second controlled entry|route interaction and verification/,
 reporter:[['list'],['json',{outputFile:${JSON.stringify(join(output,'results.json'))}}]],
 outputDir:${JSON.stringify(join(output,'tests'))},
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:${JSON.stringify(variant)},use:{...devices['Desktop Safari'],
  deviceScaleFactor:${settings.dpr},reducedMotion:${JSON.stringify(settings.motion)} }}],
 webServer:{command:'python3 scripts/dev-server.py --port 4173',cwd:${JSON.stringify(root)},
  url:'http://127.0.0.1:4173/',reuseExistingServer:false,timeout:20000}
});
`);
const cli=require.resolve('@playwright/test/cli');
const result=spawnSync(process.execPath,[cli,'test','--config',join(temp,'playwright.config.mjs')],
 {cwd:root,env:process.env,stdio:'inherit'});
process.exitCode=result.status??1;
