// Run the unchanged 820px touch scenario; optionally record native input and
// state transitions. Generated tests stay outside the checkout.
import {writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const variant=process.argv[2]||'events',repeat=Number(process.argv[3]||5);
if(!['baseline','events','dpr1','warm'].includes(variant)||!Number.isInteger(repeat)||repeat<1||repeat>20)throw Error('Usage: diagnose-radar-webkit.mjs baseline|events|dpr1|warm [1..20]');
const output=resolve(process.env.RADAR_DIAGNOSTIC_DIR||join(root,'radar-diagnostics'),variant),temp=mkdtempSync(join(tmpdir(),'gk-radar-'));
mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url);
const testModule=pathToFileURL(join(dirname(require.resolve('@playwright/test')),'index.mjs')).href;
// Compare the same pre-fix test body across variants, even from the fix branch.
// Pin RADAR_SOURCE_REF to the diagnosed main SHA after main has advanced.
const sourceRef=process.env.RADAR_SOURCE_REF||'origin/main';
const original=spawnSync('git',['show',`${sourceRef}:tests/integration/ui-ink-status.mjs`],{cwd:root,encoding:'utf8'});
if(original.status!==0)throw Error(`Cannot read radar scenario at ${sourceRef}: ${original.stderr}`);
console.log(JSON.stringify({variant,repeat,sourceRef,node:process.version,platform:process.platform}));
const fixtureModule=variant==='warm'?pathToFileURL(join(root,'tests/integration/webkit-startup.mjs')).href:testModule;
writeFileSync(join(temp,'fixture.mjs'),`
import {test as base,expect} from ${JSON.stringify(fixtureModule)};
export {expect};
export const test=base.extend({page:async({page},use,info)=>{
 await page.addInitScript(()=>{
  const data=window.__radarTimeline={events:[],maxFrameGapMs:0};
  const snapshot=()=>({phase:document.querySelector('#toggleDistances')?.dataset.distanceState,
   pressed:document.querySelector('#toggleDistances')?.getAttribute('aria-pressed'),
   label:document.querySelector('#toggleDistances')?.getAttribute('aria-label'),
   origin:document.querySelector('.distance-overlay')?.dataset.distanceOrigin??null,
   overlays:document.querySelectorAll('.distance-overlay').length});
  const add=(kind,details={})=>data.events.push({at:performance.now(),kind,...snapshot(),...details});
  for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend','mousedown','mouseup','click']){
   for(const capture of [true,false])document.addEventListener(type,event=>{
    const target=event.target.closest?.('#toggleDistances,[data-id],[data-tool]');
    if(target)add(capture?'capture':'bubble',{type,target:target.id||target.dataset.id||target.dataset.tool,pointerType:event.pointerType,trusted:event.isTrusted});
   },capture);
  }
  let previous='';
  new MutationObserver(()=>{const value=JSON.stringify(snapshot());if(value!==previous){previous=value;add('mutation');}})
   .observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-distance-state','data-distance-origin']});
  let last;
  function frame(now){if(last)data.maxFrameGapMs=Math.max(data.maxFrameGapMs,now-last);last=now;requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
 });
 try{await use(page);}finally{
  try{
   const data=await page.evaluate(()=>({timeline:window.__radarTimeline,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],saved:JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1'))}));
   console.log('RADAR_TIMELINE '+JSON.stringify({repeat:info.repeatEachIndex,status:info.status,...data}));
   await info.attach('radar-timeline',{body:JSON.stringify(data,null,2),contentType:'application/json'});
  }catch(error){console.log('RADAR_COLLECTION_ERROR '+error.message);}
 }
}});
`);
let source=original.stdout;
source=source.replace("from './webkit-startup.mjs'",`from ${JSON.stringify(pathToFileURL(join(root,'tests/integration/webkit-startup.mjs')).href)}`);
source=source.replace("from '@playwright/test'",`from ${JSON.stringify(variant==='baseline'?testModule:'./fixture.mjs')}`);
writeFileSync(join(temp,'radar.spec.mjs'),source+"\nregisterInkStatusTests('/');\n");
writeFileSync(join(temp,'playwright.config.mjs'),`
import {defineConfig} from ${JSON.stringify(testModule)};
import original from ${JSON.stringify(pathToFileURL(join(root,'playwright.webkit.config.mjs')).href)};
export default defineConfig({...original,testDir:${JSON.stringify(temp)},testMatch:'radar.spec.mjs',
 fullyParallel:false,workers:1,retries:0,repeatEach:${repeat},
 grep:/UI stabilization 820px.*radar touch selects/,
 projects:original.projects.filter(p=>p.name==='webkit-desktop').map(p=>({...p,use:{...p.use,${variant==='dpr1'?'deviceScaleFactor:1':''}}})),
 reporter:[['list'],['json',{outputFile:${JSON.stringify(join(output,'results.json'))}}]],
 outputDir:${JSON.stringify(join(output,'tests'))},use:{...original.use,trace:'on'},
 webServer:{...original.webServer,cwd:${JSON.stringify(root)},reuseExistingServer:false}});
`);
const result=spawnSync(process.execPath,[require.resolve('@playwright/test/cli'),'test','--config',join(temp,'playwright.config.mjs')],{cwd:root,env:process.env,stdio:'inherit'});
process.exitCode=result.status??1;
