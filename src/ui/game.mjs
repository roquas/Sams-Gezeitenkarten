import {createMobileViews} from './mobile-views.mjs';
import {createBordbook} from './bordbook.mjs';
import {createToolbar} from './toolbar.mjs';
import {drawMap} from './map.mjs';
import {createChartGestures} from './chart-gestures.mjs';
import {frameMode} from './parchment-frame.mjs';
import {pretty, coordinateMarkup, coordinateTextMarkup} from './coordinates.mjs';
import {verifyPuzzleImages} from './asset-resources.mjs';
import {createPuzzleLoader} from '../puzzles/loader.mjs';
import {initialState, createHistory} from '../state/game-state.mjs';
import {distancePhase,toggleDistance,chooseDistanceOrigin,selectChartTool} from '../state/distance-overlay.mjs';
import {loadState,saveState} from '../persistence/storage.mjs';

import {createRules} from '../engine/puzzle.mjs';
import {adjacent as neighbor} from '../engine/hex.mjs';


(async()=>{
"use strict";

createMobileViews();

const params=new URLSearchParams(window.location.search);
const b2Development=params.get('dev')==='b2';
const selectionKey=b2Development?'gezeitenkarten-selected-b2':'gezeitenkarten-selected-puzzle';
const loader=createPuzzleLoader({manifestUrl:new URL(b2Development?'../../.dev/b2/manifest.json':'../../puzzles/manifest.json',import.meta.url)});
const catalog=await loader.manifest().catch(error=>{
 if(b2Development)throw Error(error.message+' B2-Testbestand zuerst mit npm run export:b2 exportieren; oder URL ohne ?dev=b2 öffnen.');
 throw error;
});
if(!catalog.puzzles.length)throw Error('Zurzeit sind keine Rätsel verfügbar.');
let storage;try{storage=window.localStorage;}catch{}
let selected;try{selected=storage?.getItem(selectionKey);}catch{}
if(b2Development&&params.has('puzzle')){
 selected=params.get('puzzle');
 if(!catalog.puzzles.some(p=>p.id===selected))throw Error('Unbekannter B2-Testname: '+selected+'. Öffne ?dev=b2 für die vollständige Auswahl.');
}
let puzzle;
try{puzzle=await loader.load(catalog.puzzles.some(p=>p.id===selected)?selected:catalog.defaultId);}
catch(error){
 if(!selected||selected===catalog.defaultId)throw error;
 puzzle=await loader.load(catalog.defaultId);
 const notice=document.getElementById('puzzleLoadError');notice.hidden=false;notice.textContent=error.message+' Das Standardrätsel bleibt verfügbar.';
}
// Art decoding must not block the playable paper map or discard saved notes.
function checkImages(current){
 verifyPuzzleImages(current).catch(error=>{
  if(puzzle!==current)return;
  const notice=document.getElementById('puzzleLoadError');notice.hidden=false;notice.textContent=error.message;
 });
}
let rules=createRules(puzzle),blocked=rules.blocked,solution=puzzle.solution,hints=puzzle.hints;
const escapeText=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeMarkup=text=>coordinateTextMarkup(escapeText(text));
// The loader has independently established uniqueness before mounting the game.
const clues=puzzle.clues.map(({id,text})=>[id,text]);
const cells=rules.cells.map(id=>({q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1,id}));
const byId=Object.fromEntries(cells.map(c=>[c.id,c]));

const key=(layer,id)=>layer+":"+id;
const initial=()=>initialState(puzzle);
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
function renderMap(){drawMap({state,puzzle,cells,byId,blocked,pretty,key,onActivate:apply,frameStyle})}
const renderToolbar=createToolbar({...puzzle,steps:6,rules});
function render(){if(state.layer==="all")state.layer=1;
 renderToolbar(state,{...puzzle,rules});
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
 // Land accepts distance origins, but never notes or route edits.
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
const cancelGesture=createChartGestures($("map"),{
 mayStart:id=>!!byId[id]&&(!blocked.has(id)||distancePhase(state)==='waiting'),
 start:id=>{dragging=true;dragValue=null;apply(id,true);},
 move:id=>{if(dragging&&["no","maybe","yes","erase"].includes(state.tool)&&byId[id])apply(id,false);},
 end:()=>{dragging=false;}
});
for(const id of ['chartTab','logbookTab'])$(id).addEventListener('click',cancelGesture);
$("hours").addEventListener("click",e=>{const b=e.target.closest("[data-hour]");if(!b)return;cancelGesture();state.layer=Number(b.dataset.hour);render()});

$("toggleHourMarks").addEventListener("click",()=>{if(!Number.isInteger(state.layer)||state.layer<1||state.layer>puzzle.steps)return;const h=new Set(state.hiddenHours||[]);if(h.has(state.layer))h.delete(state.layer);else h.add(state.layer);state.hiddenHours=[...h];render()});

function selectTool(e){const b=e.target.closest('[data-tool]');if(!b)return;cancelGesture();state=selectChartTool(state,b.dataset.tool);render();}
for(const id of ['tools','mapActions'])$(id).addEventListener('click',selectTool);
$("undo").onclick=()=>{cancelGesture();state=history.undo(state);render()};
$("toggleRouteNumbers").onclick=()=>{state.showRouteNumbers=!state.showRouteNumbers;render()};
$("toggleDistances").onclick=()=>{cancelGesture();state=toggleDistance(state);render()};
$("hideRouteMarks").addEventListener("change",e=>{state.hideRouteMarks=e.target.checked;render()});
$("clearLayer").onclick=()=>{snapshot();for(const k of Object.keys(state.marks))if(k.startsWith(state.layer+":"))delete state.marks[k];render()};
$("routeBack").onclick=()=>{if(state.route.length>1){snapshot();state.route.pop();state.result="";render()}};
$("verify").onclick=()=>{if(state.route.length!==puzzle.steps+1){state.result='<div class="notice error">Die Route braucht genau '+puzzle.steps+' Etappen. Aktuell sind es '+(state.route.length-1)+'.</div>'}else if(rules.legal(state.route)&&puzzle.clues.every(clue=>rules.matches(state.route,clue))){state.result='<div class="notice success"><strong>Richtig!</strong> Die Route ist vollständig rekonstruiert. Du hast '+state.penalty+' Strafpunkte gesammelt.</div>'}else{state.result='<div class="notice error">Diese Route erfüllt nicht alle Hinweise. Die korrekte Strecke wird nicht verraten.</div>'}render()};
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
 const certainHours=Array.from({length:puzzle.steps+1},(_,h)=>Object.entries(state.marks).some(([k,v])=>k.startsWith(h+":")&&v==="yes"));
 const progress=state.route.length-1;
 const base=progress>=5||certainHours[5]?4:progress>=4||certainHours[4]?3:progress>=2||certainHours[3]?2:progress>=1||certainHours[2]?1:0;
 const idx=Math.min(hints.length-1,Math.max(base,state.hintCount-1));
 state.help='<div class="notice"><strong>Denkanstoß '+state.hintCount+':</strong> '+escapeText(hints[idx]??'Lies die Hinweise gemeinsam und prüfe mögliche Nachbarfelder.')+'</div>';
 render();
};
$("reset").onclick=()=>{if(confirm("Alle Notizen, Route und Strafpunkte löschen?")){cancelGesture();state=initial();history.clear();render()}};
const bordbook=createBordbook({clues,getState:()=>state,markup:safeMarkup,toggleClue:id=>{
 snapshot();state.doneClues=state.doneClues.includes(id)?state.doneClues.filter(v=>v!==id):[...state.doneClues,id];save();
}});
$("showChart").addEventListener("change",()=>renderMap());
document.querySelectorAll(".logbook-section p").forEach(p=>p.innerHTML=coordinateTextMarkup(p.innerHTML));
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
const select=$('puzzleSelect');
if(b2Development){
 document.querySelector('label[for="puzzleSelect"]').remove();
 const panel=document.createElement('div');panel.id='b2Selection';
 const label=document.createElement('label');label.htmlFor='puzzleSelect';label.textContent='B2-Entwicklungsauswahl · Testbestand S01';
 const note=document.createElement('p');note.className='muted';note.textContent='Gleiche M…-Start-R…-Kennung: Varianten derselben Zielroute. Testname beim Berichten angeben.';
 const exit=document.createElement('a');exit.href=window.location.pathname;exit.textContent='Reguläres Spiel öffnen';
 panel.append(label,select,$('puzzleStatus'),note,exit);$('puzzleLoadError').before(panel);
}
for(const entry of catalog.puzzles){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.title+(entry.difficulty?' · '+entry.difficulty:'');select.append(option);}
function presentation(){
 document.querySelector('h1').textContent=puzzle.title;document.title='Gezeitenkarten · '+puzzle.title;
 const story=$('puzzleStory');story.replaceChildren();
 for(const paragraph of puzzle.intro){const p=document.createElement('p');p.className='story';p.innerHTML=safeMarkup(paragraph);story.append(p);}
 select.value=puzzle.id;
 document.querySelectorAll('[data-rule-hours]').forEach(el=>el.textContent=puzzle.steps===6&&el.dataset.ruleHours!=='number'?(el.dataset.ruleHours==='capital'?'Sechs':'sechs'):String(puzzle.steps));
}
let request=0;
select.addEventListener('change',async()=>{
 const id=select.value,token=++request;select.disabled=true;$('puzzleStatus').textContent='Rätsel wird geladen …';
 try{
  const next=await loader.load(id);if(token!==request)return;
  save();puzzle=next;$('puzzleLoadError').hidden=true;rules=createRules(puzzle);blocked=rules.blocked;solution=puzzle.solution;hints=puzzle.hints;
  state=loadState(puzzle,storage);history.clear();cancelGesture();dragValue=null;
  checkImages(puzzle);presentation();bordbook.setClues(puzzle.clues.map(({id,text})=>[id,text]));render();
  try{storage?.setItem(selectionKey,puzzle.id);}catch{}
  if(b2Development){const url=new URL(window.location.href);url.searchParams.set('puzzle',puzzle.id);window.history.replaceState(window.history.state,'',url);}
  $('puzzleStatus').textContent='Geladen: '+puzzle.title+'. Spielstände bleiben getrennt gespeichert.';
 }catch(error){select.value=puzzle.id;$('puzzleStatus').textContent=error.message;}
 finally{if(token===request)select.disabled=false;}
});
presentation();render();checkImages(puzzle);
})().catch(error=>{
 const status=document.getElementById('puzzleLoadError');status.hidden=false;status.textContent=error.message;
});
