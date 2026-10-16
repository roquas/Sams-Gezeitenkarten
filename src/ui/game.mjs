import {createMobileViews} from './mobile-views.mjs';
import {createBordbook} from './bordbook.mjs';
import {createToolbar} from './toolbar.mjs';
import {drawMap} from './map.mjs';
import {frameMode} from './parchment-frame.mjs';
import {pretty, coordinateMarkup, coordinateTextMarkup} from './coordinates.mjs';
import {hints} from '../../content/reference-3.6.mjs';
import {initialState, createHistory} from '../state/game-state.mjs';
import {distancePhase,toggleDistance,chooseDistanceOrigin,selectChartTool} from '../state/distance-overlay.mjs';
import {loadState,saveState} from '../persistence/storage.mjs';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {adjacent as neighbor} from '../engine/hex.mjs';
const rules=createRules(puzzle);

(()=>{
"use strict";

createMobileViews();

const blocked=rules.blocked,solution=puzzle.solution;
// Neuer unabhängiger Testfall; sieben Hinweise gegen sämtliche legalen Routen geprüft.
const clues=puzzle.clues.map(({id,text})=>[id,text]);
const cells=rules.cells.map(id=>({q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1,id}));
const byId=Object.fromEntries(cells.map(c=>[c.id,c]));

const key=(layer,id)=>layer+":"+id;
const initial=()=>initialState(puzzle);
let storage;try{storage=window.localStorage;}catch{}
// Visual preference is independent of puzzle state and its reset/history.
const frameSettingKey='gezeitenkarten-frame-style';
const frameParam=new URLSearchParams(window.location.search).get('frame');
let frameStyle=frameMode(window.location.search);
if(!frameParam){
 let storedFrame;try{storedFrame=storage?.getItem(frameSettingKey)}catch{}
 if(storedFrame==='final'||storedFrame==='quiet')frameStyle=storedFrame;
}
let state=loadState(puzzle,storage);
const history=createHistory();
let dragging=false,dragValue=null;
const $=id=>document.getElementById(id);
function save(){saveState(puzzle,state,storage)}
function snapshot(){history.push(state)}
function renderMap(){drawMap({state,puzzle,cells,byId,blocked,pretty,key,onPointerDown:()=>{dragging=true;dragValue=null;},onActivate:apply,frameStyle})}
const renderToolbar=createToolbar({...puzzle,rules});
function render(){if(state.layer==="all")state.layer=1;
 renderToolbar(state);
 $("layerTitle").textContent=state.layer==="all"?"Gesamte Fahrt · alle Stunden":state.layer===0?"Stunde 0 · Abfahrt":"Stunde "+state.layer+" · Position";
 
 $("routeBack").disabled=state.route.length<=1;
 $("hideRouteMarks").checked=!!state.hideRouteMarks;
 $("score").textContent=state.penalty+" Strafpunkte";
 $("count").textContent=Object.keys(state.marks).filter(k=>k.startsWith(state.layer+":")&&state.marks[k]).length+" Markierungen auf dieser Karte";
 $("routeView").innerHTML=state.route.map((id,i)=>`${i?"<span>→</span>":""}<span class="step ${state.layer===i?"current":""}">${coordinateMarkup(id)}</span>`).join("");
 $("helpStatus").innerHTML=coordinateTextMarkup(state.help||"");
 $("verifyStatus").innerHTML=coordinateTextMarkup(state.result||"");
 renderMap();bordbook.render();save();
}
function apply(id,first){
 // Islands remain unmarkable and impassable, yet can be chosen as a
 // geometrical distance origin while the radar waits for a target.
 if(blocked.has(id)&&distancePhase(state)!=='waiting')return;
 if(distancePhase(state)==='waiting'){state=chooseDistanceOrigin(state,id);dragging=false;render();return}
 if(state.tool==="clearAll"){const targets=Object.keys(state.marks).filter(k=>k.endsWith(":"+id));if(targets.length){snapshot();targets.forEach(k=>delete state.marks[k]);}state.help=`<div class="notice">Markierungen auf ${pretty(id)} in allen Stunden gelöscht (${targets.length}).</div>`;render();return}
 if(state.tool==="route"){
  if(state.route.length>=puzzle.steps+1||state.route.includes(id)||!neighbor(state.route.at(-1),id))return;
  snapshot();state.route.push(id);state.result="";render();return;
 }
 const k=key(state.layer,id),val=state.tool==="erase"?undefined:state.tool;
 if(first){dragValue=state.marks[k]===val?undefined:val;snapshot()}
 if(state.marks[k]===dragValue)return;
 if(dragValue===undefined)delete state.marks[k];else state.marks[k]=dragValue;
 render();
}
$("map").addEventListener("pointermove",e=>{
 if(!dragging||!["no","maybe","yes","erase"].includes(state.tool))return;
 const elem=document.elementFromPoint(e.clientX,e.clientY);
 const g=elem?.closest?.("[data-id]");
 if(g&&byId[g.dataset.id])apply(g.dataset.id,false);
});
window.addEventListener("pointerup",()=>dragging=false);
$("hours").addEventListener("click",e=>{const b=e.target.closest("[data-hour]");if(!b)return;state.layer=Number(b.dataset.hour);render()});

$("toggleHourMarks").addEventListener("click",()=>{if(!Number.isInteger(state.layer)||state.layer<1||state.layer>6)return;const h=new Set(state.hiddenHours||[]);if(h.has(state.layer))h.delete(state.layer);else h.add(state.layer);state.hiddenHours=[...h];render()});

function selectTool(e){const b=e.target.closest('[data-tool]');if(!b)return;state=selectChartTool(state,b.dataset.tool);render();}
for(const id of ['tools','mapActions'])$(id).addEventListener('click',selectTool);
$("undo").onclick=()=>{state=history.undo(state);render()};
$("toggleRouteNumbers").onclick=()=>{state.showRouteNumbers=!state.showRouteNumbers;render()};
$("toggleDistances").onclick=()=>{state=toggleDistance(state);render()};
$("hideRouteMarks").addEventListener("change",e=>{state.hideRouteMarks=e.target.checked;render()});
$("clearLayer").onclick=()=>{snapshot();for(const k of Object.keys(state.marks))if(k.startsWith(state.layer+":"))delete state.marks[k];render()};
$("routeBack").onclick=()=>{if(state.route.length>1){snapshot();state.route.pop();state.result="";render()}};
$("verify").onclick=()=>{if(state.route.length!==puzzle.steps+1){state.result='<div class="notice error">Die Route braucht genau sechs Etappen. Aktuell sind es '+(state.route.length-1)+'.</div>'}else if(rules.legal(state.route)&&puzzle.clues.every(clue=>rules.matches(state.route,clue))){state.result='<div class="notice success"><strong>Richtig!</strong> Die Route ist vollständig rekonstruiert. Sam hat den Kurs trotz verschwundenem Kompass rekonstruiert. Du hast '+state.penalty+' Strafpunkte gesammelt.</div>'}else{state.result='<div class="notice error">Diese Route erfüllt nicht alle Hinweise. Die korrekte Strecke wird nicht verraten.</div>'}render()};
$("checkMarks").onclick=()=>{
 snapshot();state.penalty+=5;
 let wrong=0,checked=0;
 for(const [k,v] of Object.entries(state.marks)){
  const [layer,id]=k.split(":");if(v!=="no"&&v!=="yes")continue;checked++;
  const actual=layer==="all"?solution.includes(id):solution[Number(layer)]===id;
  if((v==="yes"&&!actual)||(v==="no"&&actual))wrong++;
 }
 state.help='<div class="notice '+(wrong?"error":"success")+'"><strong>Notizprüfung:</strong> '+(wrong?`${wrong} Deiner ${checked} eindeutigen Markierungen widersprechen der tatsächlichen Route.`:`Keine der ${checked} eindeutigen Markierungen widerspricht der Route.`)+' „Möglich“-Markierungen werden nicht bewertet. Die Prüfung verrät nicht, welche Felder betroffen sind.</div>';render();
};
$("hint").onclick=()=>{
 state.penalty+=10;state.hintPenalty+=10;state.hintCount++;
 
 // choose hint according to visible certainty and route progress, then move forward on repeated requests
 const certainHours=Array.from({length:7},(_,h)=>Object.entries(state.marks).some(([k,v])=>k.startsWith(h+":")&&v==="yes"));
 const progress=state.route.length-1;
 const base=progress>=5||certainHours[5]?4:progress>=4||certainHours[4]?3:progress>=2||certainHours[3]?2:progress>=1||certainHours[2]?1:0;
 const idx=Math.min(hints.length-1,Math.max(base,state.hintCount-1));
 state.help='<div class="notice"><strong>Denkanstoß '+state.hintCount+':</strong> '+hints[idx]+'</div>';
 render();
};
$("reset").onclick=()=>{if(confirm("Alle Notizen, Route und Strafpunkte löschen?")){state=initial();history.clear();render()}};
const bordbook=createBordbook({clues,getState:()=>state,markup:coordinateTextMarkup,toggleClue:id=>{
 snapshot();state.doneClues=state.doneClues.includes(id)?state.doneClues.filter(v=>v!==id):[...state.doneClues,id];save();
}});
$("showChart").addEventListener("change",()=>renderMap());
const frameSelect=$("frameStyle");
frameSelect.value=frameStyle==='quiet'?'quiet':'final';
function changeFrame(){
 const selected=frameSelect.value==='quiet'?'quiet':'final';
 if(selected===frameStyle&&$("showChart").checked)return; // input/change may fire twice
 frameStyle=selected;
 const wasHidden=!$("showChart").checked;
 $("showChart").checked=true;
 try{storage?.setItem(frameSettingKey,frameStyle)}catch{}
 try{
  const url=new URL(window.location.href);
  url.searchParams.set('frame',frameStyle);
  window.history.replaceState(window.history.state,'',url);
 }catch{}
 // Swap visibility of *preloaded* SVG images in place instead of replacing
 // the whole SVG. This avoids Safari displaying the previously decoded WebP,
 // and does not disturb the hex hit targets or selected keyboard focus.
 const svg=$("map");
 const variants=svg.querySelectorAll('[data-frame-variant]');
 if(wasHidden||variants.length!==2){renderMap();return}
 variants.forEach(image=>image.setAttribute('visibility',image.dataset.frameVariant===frameStyle?'visible':'hidden'));
 svg.dataset.frameMode=frameStyle;
 svg.querySelector('[data-chart-layer="frame"]').dataset.frameMode=frameStyle;
}
frameSelect.addEventListener("input",changeFrame);
frameSelect.addEventListener("change",changeFrame);
document.querySelectorAll(".logbook-section p").forEach(p=>p.innerHTML=coordinateTextMarkup(p.innerHTML));
render();
})();
