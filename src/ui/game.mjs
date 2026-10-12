import {createBordbook} from './bordbook.mjs';
import {createToolbar} from './toolbar.mjs';
import {drawMap} from './map.mjs';
import {GREEK, GREEK_SYMBOLS, ROWCOLORS, pretty} from './coordinates.mjs';
import {hints} from '../../content/reference-3.6.mjs';
import {initialState, createHistory} from '../state/game-state.mjs';
import {loadState,saveState} from '../persistence/storage.mjs';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {adjacent as neighbor} from '../engine/hex.mjs';
const rules=createRules(puzzle);

(()=>{
"use strict";

const responsiveAside=document.querySelector(".clue-panel");
const mobileLayout=window.matchMedia("(max-width: 880px)");
const logbookTab=document.getElementById("logbookTab");
const logbookBackdrop=document.getElementById("logbookBackdrop");
function setLogbook(open){
 const show=!!open && mobileLayout.matches;
 responsiveAside.classList.toggle("open",show);
 logbookBackdrop.classList.toggle("visible",show);
 document.body.classList.toggle("logbook-open",show);
 logbookTab.setAttribute("aria-expanded",String(show));
 logbookTab.setAttribute("aria-label",show?"Hilfe schließen":"Hilfe öffnen");
 if(show) responsiveAside.querySelector(".pad").scrollTop=0;
}
logbookTab.addEventListener("click",()=>setLogbook(!responsiveAside.classList.contains("open")));
logbookBackdrop.addEventListener("click",()=>setLogbook(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape")setLogbook(false)});
if(mobileLayout.addEventListener)mobileLayout.addEventListener("change",()=>setLogbook(false));
else mobileLayout.addListener(()=>setLogbook(false));
// Horizontale Wischgeste nur auf der Schublade und ihrem Griff, nicht auf der Hexkarte.
let touchStart=null;
responsiveAside.addEventListener("touchstart",e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}}, {passive:true});
responsiveAside.addEventListener("touchend",e=>{
 if(!touchStart||!e.changedTouches.length)return;
 const dx=e.changedTouches[0].clientX-touchStart.x;
 const dy=e.changedTouches[0].clientY-touchStart.y;
 if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)setLogbook(dx<0);
 touchStart=null;
},{passive:true});

const blocked=rules.blocked,solution=puzzle.solution;
// Neuer unabhängiger Testfall; sieben Hinweise gegen sämtliche legalen Routen geprüft.
const clues=puzzle.clues.map(({id,text})=>[id,text]);
const cells=rules.cells.map(id=>({q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1,id}));
const byId=Object.fromEntries(cells.map(c=>[c.id,c]));

const key=(layer,id)=>layer+":"+id;
const initial=()=>initialState(puzzle);
let storage;try{storage=window.localStorage;}catch{}
let state=loadState(puzzle,storage);
const history=createHistory();
let dragging=false,dragValue=null;
const $=id=>document.getElementById(id);
function save(){saveState(puzzle,state,storage)}
function snapshot(){history.push(state)}
function renderMap(){drawMap({state,puzzle,cells,byId,blocked,pretty,key,onPointerDown:()=>{dragging=true;dragValue=null;},onActivate:apply})}
const renderToolbar=createToolbar({...puzzle,rules});
function render(){if(state.layer==="all")state.layer=1;
 renderToolbar(state);
 $("layerTitle").textContent=state.layer==="all"?"Gesamte Fahrt · alle Stunden":state.layer===0?"Stunde 0 · Abfahrt":"Stunde "+state.layer+" · Position";
 
 $("routeBack").disabled=state.route.length<=1;
 $("hideRouteMarks").checked=!!state.hideRouteMarks;
 $("score").textContent=state.penalty+" Strafpunkte";
 $("count").textContent=Object.keys(state.marks).filter(k=>k.startsWith(state.layer+":")&&state.marks[k]).length+" Markierungen auf dieser Karte";
 $("routeView").innerHTML=state.route.map((id,i)=>`${i?"<span>→</span>":""}<span class="step ${state.layer===i?"current":""}">${pretty(id)}</span>`).join("");
 $("helpStatus").innerHTML=state.help||"";
 $("verifyStatus").innerHTML=state.result||"";
 renderMap();bordbook.render();save();
}
function apply(id,first){
 if(blocked.has(id))return;
 if(state.tool==="clearAll"){const targets=Object.keys(state.marks).filter(k=>k.endsWith(":"+id));if(targets.length){snapshot();targets.forEach(k=>delete state.marks[k]);}state.help=`<div class="notice">Markierungen auf ${pretty(id)} in allen Stunden gelöscht (${targets.length}).</div>`;render();return}
 if(state.distanceMode && !state.distanceOrigin){state.distanceOrigin=id;render();return}
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

$("tools").addEventListener("click",e=>{const b=e.target.closest("[data-tool]");if(!b)return;state.tool=b.dataset.tool;state.distanceMode=false;state.distanceOrigin=null;render()});
$("undo").onclick=()=>{state=history.undo(state);render()};
$("toggleRouteNumbers").onclick=()=>{state.showRouteNumbers=!state.showRouteNumbers;render()};
$("toggleDistances").onclick=()=>{state.distanceMode=!state.distanceMode;state.distanceOrigin=null;render()};
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
const colorTokens={Cyan:0,Magenta:1,Violett:2,Blau:3,Orange:4};
function clueMarkup(t){
 return t.replace(/(Alpha|Beta|Gamma|Delta|Epsilon)\/(Cyan|Magenta|Violett|Blau|Orange)/g,(_,col,row)=>{
   const q=GREEK.indexOf(col),c=ROWCOLORS[colorTokens[row]];
   return `<span class="coord-inline" aria-label="${col} / ${row}" title="${col} / ${row}"><span class="greek-badge" aria-hidden="true">${GREEK_SYMBOLS[q]}</span><span class="color-badge" style="--swatch:${c.hex}" aria-hidden="true">${c.short}</span></span>`;
 });
}
const bordbook=createBordbook({clues,getState:()=>state,markup:clueMarkup,toggleClue:id=>{
 snapshot();state.doneClues=state.doneClues.includes(id)?state.doneClues.filter(v=>v!==id):[...state.doneClues,id];save();
}});
$("showChart").addEventListener("change",()=>renderMap());
render();
})();
