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
test('observe native place animation without changing its timeline',async({page},info)=>{
 await page.addInitScript(()=>{
  window.placeProbe=[];
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const a=animate.apply(this,args);if(!this.matches('.place-references'))return a;
   const node=this,id=window.placeProbe.filter(s=>s.event==='create').length;
   const sample=event=>{
    const rect=node.getBoundingClientRect();
    const style=getComputedStyle(node);
    window.placeProbe.push({id,event,wall:performance.now(),timeline:document.timeline.currentTime,currentTime:a.currentTime,startTime:a.startTime,playState:a.playState,pending:a.pending,connected:node.isConnected,opacity:style.opacity,display:style.display,visibility:style.visibility,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},viewport:{width:innerWidth,height:innerHeight},documentVisibility:document.visibilityState});
   };
   sample('create');a.ready.then(()=>sample('ready'),()=>sample('ready-rejected'));
   a.finished.then(()=>sample('finished'),()=>sample('cancelled'));
   let count=0;const timer=setInterval(()=>{sample('interval');if(++count>=80)clearInterval(timer);},100);
   return a;
  };
 });
 await open(page);await page.locator('#showPlaces').click();
 await page.waitForTimeout(650);
 console.log('after650',await page.locator('.place-references').evaluate(n=>({opacity:getComputedStyle(n).opacity,animations:n.getAnimations().map(a=>({currentTime:a.currentTime,startTime:a.startTime,pending:a.pending,playState:a.playState}))})));
 await page.waitForTimeout(7000);
 await info.attach('animation-probe',{body:JSON.stringify(await page.evaluate(()=>window.placeProbe),null,2),contentType:'application/json'});
 await expect(labels(page)).toHaveCount(0);
});
