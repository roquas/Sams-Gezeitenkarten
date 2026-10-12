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
function render(){if(state.layer==="all")state.layer=1;
 $("hours").innerHTML=Array.from({length:puzzle.steps},(_,index)=>{const i=index+1;
   const vertices=Array.from({length:6},(_,v)=>{const a=v*Math.PI/3+Math.PI/6;return `${(24+20*Math.cos(a)).toFixed(1)},${(23+20*Math.sin(a)).toFixed(1)}`}).join(" ");
   const a=(i-2)*Math.PI/3;
   const edge=i===0?"":`<line class="hexedge" x1="${(24+20*Math.cos(a-Math.PI/6)).toFixed(1)}" y1="${(23+20*Math.sin(a-Math.PI/6)).toFixed(1)}" x2="${(24+20*Math.cos(a+Math.PI/6)).toFixed(1)}" y2="${(23+20*Math.sin(a+Math.PI/6)).toFixed(1)}"/>`;
   const glyph=i===0?'<text class="start-icon" x="24" y="29" text-anchor="middle">⚓</text>':`<text class="hexhour" x="24" y="27" text-anchor="middle">${i}h</text>`;
   return `<button type="button" class="hour ${state.layer===i?"active":""} ${(state.hiddenHours||[]).includes(i)?"hidden-hour":""}" data-hour="${i}" title="${i===0?"Startposition":"Stunde "+i+": markierte Hexseite"}" aria-label="${i===0?"Startposition":"Stunde "+i}" aria-pressed="${state.layer===i}"><svg viewBox="0 0 48 46" aria-hidden="true"><polygon class="hexface" points="${vertices}"/>${edge}${glyph}</svg><small>${i===0?"Start":"Stunde "+i}</small></button>`;
 }).join("");
 const showToggle=$("toggleHourMarks");
 showToggle.disabled=!(Number.isInteger(state.layer)&&state.layer>=1&&state.layer<=6);
 showToggle.setAttribute("aria-pressed",String(!(state.hiddenHours||[]).includes(state.layer)));

 $("layerTitle").textContent=state.layer==="all"?"Gesamte Fahrt · alle Stunden":state.layer===0?"Stunde 0 · Abfahrt":"Stunde "+state.layer+" · Position";
 
 document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool===state.tool));
 $("routeBack").disabled=state.route.length<=1;
 $("hideRouteMarks").checked=!!state.hideRouteMarks;
 $("score").textContent=state.penalty+" Strafpunkte";
 $("toggleRouteNumbers").classList.toggle("active",!!state.showRouteNumbers);
 $("toggleRouteNumbers").setAttribute("aria-pressed",String(!!state.showRouteNumbers));
 $("toggleDistances").classList.toggle("active",!!state.distanceMode);
 $("toggleDistances").setAttribute("aria-pressed",String(!!state.distanceMode));
 $("toggleDistances").textContent=state.distanceMode?(state.distanceOrigin?"Abstände ausblenden":"Bitte Feld wählen …"):"Abstände einblenden";
 $("toggleHourMarks").classList.toggle("active",!(state.hiddenHours||[]).includes(state.layer));
 $("count").textContent=Object.keys(state.marks).filter(k=>k.startsWith(state.layer+":")&&state.marks[k]).length+" Markierungen auf dieser Karte";
 $("routeView").innerHTML=state.route.map((id,i)=>`${i?"<span>→</span>":""}<span class="step ${state.layer===i?"current":""}">${pretty(id)}</span>`).join("");
 $("helpStatus").innerHTML=state.help||"";
 $("verifyStatus").innerHTML=state.result||"";
 renderMap();renderClues();save();
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
let currentClue=0;
const colorTokens={Cyan:0,Magenta:1,Violett:2,Blau:3,Orange:4};
function clueMarkup(t){
 return t.replace(/(Alpha|Beta|Gamma|Delta|Epsilon)\/(Cyan|Magenta|Violett|Blau|Orange)/g,(_,col,row)=>{
   const q=GREEK.indexOf(col),c=ROWCOLORS[colorTokens[row]];
   return `<span class="coord-inline" aria-label="${col} / ${row}" title="${col} / ${row}"><span class="greek-badge" aria-hidden="true">${GREEK_SYMBOLS[q]}</span><span class="color-badge" style="--swatch:${c.hex}" aria-hidden="true">${c.short}</span></span>`;
 });
}
function renderClues(){
 $("allClues").innerHTML=clues.map(([n,t])=>{
  const done=state.doneClues?.includes(n);
  return `<div class="clue ${done?'done':''}" data-clue="${n}" role="checkbox" tabindex="0" aria-checked="${!!done}" title="Hinweis abhaken"><span class="num">${n}</span><p>${clueMarkup(t)}</p></div>`;
 }).join("");
 const items=clues;
 const idx=n=>(n+items.length)%items.length;
 const indexes=[idx(currentClue-1),currentClue,idx(currentClue+1)];
 $("clueTrack").innerHTML=indexes.map((i,pos)=>{
  const [n,t]=items[i],done=state.doneClues?.includes(n);
  return `<div class="clue-slide ${pos===1?'center':''}" aria-hidden="${pos!==1}"><div class="clue ${done?'done':''}" data-clue="${n}" role="checkbox" tabindex="${pos===1?0:-1}" aria-checked="${!!done}" title="Hinweis abhaken"><span class="num">${n}</span><p>${t}</p></div></div>`;
 }).join("");
 $("cluePosition").textContent=`${items[currentClue][0]} / VII`;
}
function shiftClue(dir){currentClue=(currentClue+dir+clues.length)%clues.length;renderClues()}
$("prevClue").addEventListener("click",()=>shiftClue(-1));
$("nextClue").addEventListener("click",()=>shiftClue(1));
$("clueViewport").addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();shiftClue(e.key==="ArrowRight"?1:-1)}});
let clueTouch=null;
$("clueViewport").addEventListener("touchstart",e=>{if(e.touches.length===1)clueTouch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
$("clueViewport").addEventListener("touchend",e=>{if(!clueTouch||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-clueTouch.x,dy=e.changedTouches[0].clientY-clueTouch.y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.25)shiftClue(dx<0?1:-1);clueTouch=null},{passive:true});
$("clueTrack").addEventListener("click",e=>{const slide=e.target.closest(".clue-slide");if(!slide)return;if(!slide.classList.contains("center")){shiftClue(slide===slide.parentElement.firstElementChild?-1:1);return}const n=e.target.closest("[data-clue]")?.dataset.clue;if(!n)return;snapshot();state.doneClues=state.doneClues||[];state.doneClues=state.doneClues.includes(n)?state.doneClues.filter(v=>v!==n):[...state.doneClues,n];renderClues();save()});
$("allClues").addEventListener("click",e=>{const n=e.target.closest("[data-clue]")?.dataset.clue;if(!n)return;snapshot();state.doneClues=state.doneClues||[];state.doneClues=state.doneClues.includes(n)?state.doneClues.filter(v=>v!==n):[...state.doneClues,n];renderClues();save()});
$("allClues").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.target.closest("[data-clue]")?.click()}});
$("showChart").addEventListener("change",()=>renderMap());
$("clueTrack").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.target.closest("[data-clue]")?.click()}});
renderClues();
render();
})();
