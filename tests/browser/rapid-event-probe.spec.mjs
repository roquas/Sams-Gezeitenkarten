import {test,expect} from '../integration/webkit-startup.mjs';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const demo=read('puzzles/model-demo.json');
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const labels=page=>page.locator('#map .reference-label');
const names=page=>labels(page).locator('text');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('gezeitenkarten-model-demo-schema2-data1')));
function fixture(){
 const dto=structuredClone(demo),p=dto.puzzle;
 p.presentation.objectNames={o1:'Roberts Boot',o2:'Zwilling',o4:'Kiste'};
 // The first clue explicitly names two places in its editorial wording.
 p.presentation.clueTexts.I='Von Roberts Boot fuhren wir ostwärts; Zwilling lag fern.';
 p.presentation.cluePlaceRefs={I:['o1','o2']};
 // Existing structured placeId, independent of editorial metadata.
 p.logic.clues.splice(1,0,{id:'Ort',type:'distanceToPlace',hour:0,placeId:'o4',distance:4});
 p.presentation.clueTexts.Ort='Bei der Abfahrt waren wir vier Hexfelder von Kiste entfernt.';
 return dto;
}
async function open(page,dto=fixture()){
 await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await page.goto('/');await expect(page.locator('#map .cell')).toHaveCount(25,{timeout:15000});
 await expect(page.locator('#puzzleLoadError')).toBeHidden();
}
test('observe replacement promises with the frozen action and assertion sequence',async({page},info)=>{
 test.setTimeout(60_000);
 await page.addInitScript(()=>{
  const entries=window.rapidEntries=[],events=window.rapidEvents=[],unhandled=window.rapidUnhandled=[];
  window.addEventListener('unhandledrejection',e=>unhandled.push(String(e.reason)));
  const native=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const a=native.apply(this,args);if(!this.matches('.place-references'))return a;
   const node=this,id=entries.length,created=performance.now();
   const entry={id,created,samples:[]};entries.push(entry);
   const sample=event=>{
    const state={id,event,outcomeBeforeReadingState:entry.outcome??null,wall:performance.now(),timeline:document.timeline.currentTime,currentTime:a.currentTime,startTime:a.startTime,playState:a.playState,pending:a.pending,connected:node.isConnected,groupCount:document.querySelectorAll('#map .place-references').length,labelCount:document.querySelectorAll('#map .reference-label').length,documentVisibility:document.visibilityState};
    entry.samples.push(state);return state;
   };
   entry.samples.push({event:'created',wall:created});
   a.ready.then(()=>sample('ready'),()=>sample('ready-rejected'));
   a.finished.then(()=>{entry.outcome='finished';sample('finished');},e=>{entry.outcome=e.name;sample('rejected');});
   window.rapidSnapshot=event=>{events.push(sample(event));};
   return a;
  };
 });
 try{
  await open(page);await page.locator('#showPlaces').click();await page.waitForTimeout(2200);
  for(let i=0;i<4;i++){await page.locator('#nextClue').click();await page.locator('#showPlaces').click();}
  await expect(page.locator('.place-references')).toHaveCount(1);await expect(names(page)).toHaveText(['Roberts Boot','Zwilling','Kiste']);
  await page.waitForTimeout(3400);await expect(labels(page)).toHaveCount(3);
  try{await expect(labels(page)).toHaveCount(0,{timeout:3500});}
  catch(e){await page.evaluate(()=>window.rapidSnapshot('old-removal-deadline-failed'));console.log('original deadline failed',e.message);}
  // Diagnostic observation only: determine whether the native animation actually
  // finishes after the failed old deadline. Never pause, seek, finish, or cancel.
  await expect(labels(page)).toHaveCount(0,{timeout:10000});
  await page.evaluate(()=>window.rapidSnapshot('natural-cleanup-observed'));
  expect(await page.locator('#map').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);
 }finally{
  await info.attach('rapid-native-probe',{body:JSON.stringify(await page.evaluate(()=>({entries:window.rapidEntries,events:window.rapidEvents,unhandled:window.rapidUnhandled})),null,2),contentType:'application/json'});
 }
});
