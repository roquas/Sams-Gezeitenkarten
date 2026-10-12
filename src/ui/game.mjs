import {initialState, createHistory} from '../state/game-state.mjs';
import {loadState,saveState} from '../persistence/storage.mjs';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {distance as dist, adjacent as neighbor} from '../engine/hex.mjs';
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

const LETTERS="ABCDE", GREEK_SYMBOLS=["α","β","γ","δ","ε"], GREEK=["Alpha","Beta","Gamma","Delta","Epsilon"], ROWCOLORS=[{name:"Cyan",short:"C",hex:"#28b9c5"},{name:"Magenta",short:"M",hex:"#c74c99"},{name:"Violett",short:"V",hex:"#8761ba"},{name:"Blau",short:"B",hex:"#4178b8"},{name:"Orange",short:"O",hex:"#d28a39"}], blocked=rules.blocked, solution=puzzle.solution;
// Neuer unabhängiger Testfall; sieben Hinweise gegen sämtliche legalen Routen geprüft.
const clues=puzzle.clues.map(({id,text})=>[id,text]);
const cells=rules.cells.map(id=>({q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1,id}));
const byId=Object.fromEntries(cells.map(c=>[c.id,c]));
const pretty=id=>GREEK[LETTERS.indexOf(id[0])]+" / "+ROWCOLORS[Number(id.slice(1))-1].name;
const key=(layer,id)=>layer+":"+id;
const initial=()=>initialState(puzzle);
let storage;try{storage=window.localStorage;}catch{}
let state=loadState(puzzle,storage);
const history=createHistory();
let dragging=false,dragValue=null;
const $=id=>document.getElementById(id);
function save(){saveState(puzzle,state,storage)}
function snapshot(){history.push(state)}
function poly(x,y){return Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return `${(x+36*Math.cos(a)).toFixed(2)},${(y+36*Math.sin(a)).toFixed(2)}`}).join(" ")}
function coords(c){return [60+c.q*82+(c.r%2)*41,56+c.r*68]}
function renderMap(){
 const svg=$("map");svg.replaceChildren();
 const NS="http://www.w3.org/2000/svg";
 const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n};
 // Modulare Seekarten-Grafik: 1a Wasser, 1b transparente Motive, 1c mehrfeldrige Inseln.
 // Alle Motive sind rein dekorativ und niemals interaktive Trefferflächen.
 const showArt=document.getElementById("showChart").checked;
 const art=el("g",{"pointer-events":"none","aria-hidden":"true",visibility:showArt?"visible":"hidden"});
 const image=(file,x,y,w,h,opacity=1)=>el("image",{href:"prototypes/3.6/assets/"+file,x,y,width:w,height:h,opacity,preserveAspectRatio:"none","pointer-events":"none"});
 art.append(image(puzzle.background.asset,0,0,475,385));
 // Neuer Fall: B3, C3 und E2 sind unpassierbar.
 // B3 + C3 bilden eine gemeinsame, über zwei Hexfelder reichende Insel.
 // Jede Illustration wird am Mittelpunkt ihrer Spielfeld-Zuordnung verankert.
 // Motivanker sind zentral konfiguriert: spätere Generatoren liefern Zellen + Variante.
 const mapArt=puzzle.overlays;
 const artCenter=ids=>{const pts=ids.map(id=>coords(byId[id]));return [pts.reduce((n,p)=>n+p[0],0)/pts.length,pts.reduce((n,p)=>n+p[1],0)/pts.length]};
 for(const o of mapArt){const [cx,cy]=artCenter(o.cells);art.append(image(o.asset,cx-o.w/2+o.dx,cy-o.h/2+o.dy,o.w,o.h,o.opacity))}
 // Beschriftung gehört zum geografischen Objekt, nicht zu einem einzelnen Hexfeld.
 const islandLabel=(ids,t,angle=0,dx=0,dy=0)=>{
   const [cx,cy]=artCenter(ids);
   const g=el("g",{transform:`translate(${cx+dx} ${cy+dy}) rotate(${angle})`,"pointer-events":"none"});
   g.append(el("text",{x:0,y:0,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"11","font-style":"italic",fill:"#5a4634",stroke:"#f0dfbb","stroke-width":"1.4","paint-order":"stroke",opacity:".8"},t));
   art.append(g);
 };
 islandLabel(["E2"],"Klippen",-9,0,-17);
 for(const place of Object.values(puzzle.places))if(place.kind==="island")islandLabel(place.cells,place.name,-8,7,-23);
 svg.append(art);
 // Geographic coordinate guides and margin headings remain visible even when
 // the decorative chart is disabled. The staggered rows bend column guides.
 const graticule=el("g",{"pointer-events":"none","aria-hidden":"true"});
 // Every guide passes through the actual centers of its five column hexes.
 // The alternating 41-unit row offset is intentional and shared with coords().
 for(let q=0;q<5;q++){
   const centers=Array.from({length:5},(_,r)=>coords({q,r}));
   let path=`M ${centers[0][0]} 29 L ${centers[0][0]} ${centers[0][1]}`;
   for(let r=1;r<centers.length;r++){
     const [px,py]=centers[r-1], [x,y]=centers[r];
     path+=` C ${px} ${py+24}, ${x} ${y-24}, ${x} ${y}`;
   }
   const [bottomX,bottomY]=centers[4];
   path+=` L ${bottomX} 362`;
   graticule.append(el("path",{d:path,fill:"none",stroke:"#f5edce","stroke-width":"8",opacity:".12","stroke-linecap":"round"}));
   graticule.append(el("path",{d:path,fill:"none",stroke:"#446d70","stroke-width":"1.5",opacity:".24","stroke-linecap":"round"}));
   // Pergamentplättchen mit unregelmäßigen Kanten, gedämpfter Tinte.
   for(const [x,y] of [[centers[0][0],14],[bottomX,372]]){
     const d=`M ${x-13} ${y-10} Q ${x-4} ${y-12} ${x+12} ${y-10} L ${x+13} ${y+8} Q ${x+3} ${y+11} ${x-12} ${y+9} Z`;
     graticule.append(el("path",{d,fill:"#e9d7aa",stroke:"#b39b71","stroke-width":".7",opacity:".77"}));
     graticule.append(el("text",{x,y:y+5,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"17","font-style":"italic",fill:"#695037",opacity:".88"},GREEK_SYMBOLS[q]));
   }
 }
 for(let r=0;r<5;r++){
   const y=56+r*68;
   graticule.append(el("path",{d:`M 26 ${y} C 145 ${y-9}, 295 ${y+9}, 462 ${y}`,fill:"none",stroke:"#567e78","stroke-width":"1.1",opacity:".19","stroke-dasharray":"3 7"}));
   const rc=ROWCOLORS[r];
   for(const x of [14,458]){
     // Kein UI-Kreis: asymmetrischer, leicht durchscheinender Tintenklecks.
     const d=`M ${x-8} ${y-4} Q ${x-12} ${y-11} ${x-3} ${y-10} Q ${x+5} ${y-13} ${x+9} ${y-4} Q ${x+13} ${y+3} ${x+5} ${y+9} Q ${x-4} ${y+13} ${x-9} ${y+4} Z`;
     graticule.append(el("path",{d,fill:rc.hex,opacity:".57",stroke:rc.hex,"stroke-width":"1.3"}));
     graticule.append(el("circle",{cx:x-10,cy:y+9,r:1.6,fill:rc.hex,opacity:".4"}));
     graticule.append(el("text",{x,y:y+3.7,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"10","font-weight":"bold",fill:"#2f3633",opacity:".85"},rc.short));
   }
 }
 svg.append(graticule);
 // 1c: Große, transparente Abstandszahlen auf Wasserfeldern; über den Illustrationen,
 // aber unter interaktiven Hexflächen, Routenlinie und Markierungen.
 if(state.distanceMode && state.distanceOrigin){
   const layer=el("g",{"pointer-events":"none","aria-hidden":"true"});
   const shades=["#bc388b","#aa438f","#80539f","#536da2","#348ca4","#259eaa","#268e98"];
   for(const c of cells){
     if(blocked.has(c.id))continue;
     const d=dist(state.distanceOrigin,c.id),[x,y]=coords(c);
     const col=shades[Math.min(d,shades.length-1)];
     layer.append(el("text",{x,y:y+17,"text-anchor":"middle","font-family":"system-ui, sans-serif","font-size":"51","font-weight":"900",fill:col,opacity:Math.max(.31,.66-d*.055),stroke:"#fff6df","stroke-width":"1.8","paint-order":"stroke"},String(d)));
   }
   svg.append(layer);
 }
 for(const c of cells){
  const [x,y]=coords(c),m=state.marks[key(state.layer,c.id)],land=blocked.has(c.id);
  const colors={no:"#c9a6a02c",maybe:"#efd38b29",yes:"#90c4a229"};
  const g=el("g",{class:land?"cell blocked-cell":"cell",tabindex:land?"-1":"0",role:"button","aria-label":pretty(c.id)+(land?" Land":""),"data-id":c.id});
  g.append(el("polygon",{points:poly(x,y),fill:land?"transparent":colors[m]||"#b9e1e538",stroke:land?"none":"#746f57","stroke-width":land?"0.8":"0.35","stroke-opacity":land?".20":".16"}));
  // Illustrationen liegen bereits auf der unteren, markierungsunabhängigen Ebene.
  // Markierungen dürfen Motive niemals aus dem DOM entfernen.
  // Landmarken: wiedererkennbarer goldener Kartografenring statt zusätzlichem Emoji.
  if(!land && ["D4","C1","E4","A3","D5"].includes(c.id)){
    // Unregelmäßiger handgezeichneter Kartografenring, nicht anklickbar.
    const ring=Array.from({length:33},(_,i)=>{const a=i*Math.PI/16;const rr=24+1.15*Math.sin(i*2.4)+.7*Math.cos(i*1.3);return `${i?'L':'M'} ${(x+rr*Math.cos(a)).toFixed(1)} ${(y+rr*Math.sin(a)).toFixed(1)}`}).join(' ');
    g.append(el("path",{d:ring,fill:"none",stroke:"#f1db9d","stroke-width":"3.2",opacity:".43","stroke-linecap":"round","stroke-linejoin":"round"}));
    g.append(el("path",{d:ring,fill:"none",stroke:"#a57739","stroke-width":"1.35",opacity:".79","stroke-linecap":"round","stroke-linejoin":"round"}));
  }
  // The active hour highlights the entire corresponding hex EDGE, even when unmarked.
  // Hex vertices lie at 30°, 90°, ...; edge midpoints at 0°, 60°, ...
  if(Number.isInteger(state.layer) && state.layer>=1 && state.layer<=6){
    const angle=(state.layer-2)*Math.PI/3;
    const ax=x+36*Math.cos(angle-Math.PI/6),ay=y+36*Math.sin(angle-Math.PI/6);
    const bx=x+36*Math.cos(angle+Math.PI/6),by=y+36*Math.sin(angle+Math.PI/6);
    g.append(el("path",{d:`M ${ax} ${ay} L ${bx} ${by}`,fill:"none",stroke:"#f6f0de","stroke-width":"2.3","stroke-linecap":"round"}));
    g.append(el("path",{d:`M ${ax} ${ay} L ${bx} ${by}`,fill:"none",stroke:"#8a795f","stroke-width":"1.25",opacity:".72","stroke-linecap":"round"}));
  }
  // Active layer is encoded by the field's central fill and a small center glyph.
  if(m){
    const glyph={no:"×",maybe:"?",yes:"✓"}[m];
    g.append(el("text",{x,y:y+9,"font-size":"20","font-weight":"800","text-anchor":"middle",fill:m==="no"?"#933c34":m==="yes"?"#216542":"#8a6221",stroke:"#f6f0de","stroke-width":"1.4","paint-order":"stroke"},glyph));
  }
  // Six compact, fixed-position side annotations: hour 1 to 6.
  // Hidden hours keep all their notes but do not clutter the overview.
  for(let h=1;h<=6;h++){
    const mark=state.marks[key(h,c.id)];
    if(!mark || (state.hiddenHours||[]).includes(h) || (state.hideRouteMarks&&state.route.includes(c.id)))continue;
    const angle=(h-2)*Math.PI/3;
    const cx=x+28*Math.cos(angle),cy=y+28*Math.sin(angle);
    const fills={no:"#a34c46",maybe:"#c69b40",yes:"#36816b"};
    g.append(el("circle",{cx,cy,r:9.2,fill:fills[mark],opacity:state.layer===h?.98:.58,stroke:state.layer===h?"#ffffff":"#f8f3e6","stroke-width":state.layer===h?"1.5":".8"}));
    g.append(el("text",{x:cx,y:cy+3.4,"font-size":"11.8","font-weight":"900","text-anchor":"middle",fill:"white",opacity:state.layer===h?1:.72},({no:"×",maybe:"?",yes:"✓"})[mark]));
  }
  // The route is a continuous line only; corner annotations stay unobstructed.
  g.addEventListener("pointerdown",e=>{if(land)return;e.preventDefault();dragging=true;dragValue=null;try{svg.setPointerCapture(e.pointerId)}catch{};apply(c.id,true)});
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();apply(c.id,true)}});
  svg.append(g);
 }
 // Handgezeichnete Route: weicher Schein + warmer Tintenstrich + feine Lichtkante.
 // Vergangene Etappen lesbar, zukünftige Etappen weiterhin sichtbar, aber blasser.
 const selected=Number.isInteger(state.layer)?state.layer:state.route.length-1;
 const routeInk=el("g",{"pointer-events":"none","aria-hidden":"true"});
 for(let i=1;i<state.route.length;i++){
   const [x1,y1]=coords(byId[state.route[i-1]]),[x2,y2]=coords(byId[state.route[i]]);
   const past=i<=selected, dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
   // Leicht gebogener Pinselzug statt geometrisch steriler Gerade.
   const curve=`M ${x1} ${y1} Q ${(x1+x2)/2+nx*2.3} ${(y1+y2)/2+ny*2.3} ${x2} ${y2}`;
   const lines=[
     {stroke:"#f9ebc7",width:past?12:8,opacity:past?.24:.11},
     {stroke:"#ead0a0",width:past?7.5:5.8,opacity:past?.46:.19},
     {stroke:past?"#83582f":"#816d58",width:past?3.5:2.6,opacity:past?.92:.36},
     {stroke:"#fff1cb",width:past?1.1:.8,opacity:past?.58:.22,offset:-1.3}
   ];
   for(const l of lines){routeInk.append(el("path",{d:curve,fill:"none",stroke:l.stroke,"stroke-width":l.width,opacity:l.opacity,"stroke-linecap":"round","stroke-linejoin":"round",transform:l.offset?`translate(${(nx*l.offset).toFixed(2)} ${(ny*l.offset).toFixed(2)})`:""}))}
 }
 svg.append(routeInk);
 // Distinguish the actual departure point from the wreck's identical anchor icon.
 const [sx,sy]=coords(byId[puzzle.start]);
 svg.append(el("circle",{cx:sx,cy:sy,r:23,fill:"none",stroke:"#fff6d8","stroke-width":"5","pointer-events":"none"}));
 svg.append(el("circle",{cx:sx,cy:sy,r:23,fill:"none",stroke:"#b37b36","stroke-width":"3.5","stroke-dasharray":"5 3","pointer-events":"none"}));
 svg.append(el("rect",{x:sx-19,y:sy-39,width:38,height:16,rx:7,fill:"#fff6d8",stroke:"#b37b36","stroke-width":"1.5","pointer-events":"none"}));
 svg.append(el("text",{x:sx,y:sy-27,"font-size":"10","font-weight":"800","text-anchor":"middle",fill:"#79521e","pointer-events":"none"},"START"));
 if(state.showRouteNumbers){
   const numbers=el("g",{"pointer-events":"none","aria-hidden":"true"});
   state.route.forEach((id,i)=>{
     const [x,y]=coords(byId[id]);
     numbers.append(el("circle",{cx:x,cy:y,r:i?12.4:11.8,fill:"#fff4d5",stroke:"#76512b","stroke-width":"2",opacity:".95"}));
     numbers.append(el("text",{x,y:y+5,"text-anchor":"middle","font-family":"Georgia,serif","font-size":i?"16":"14","font-weight":"900",fill:"#50391e"},i?String(i):"S"));
   });
   svg.append(numbers);
 }
}
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
 const hints=["Hinweis I erlaubt direkt die erste Etappe: vom Startfeld aus genau einen Schritt nach Nordosten.", "Für Hinweis II drehe die erste Fahrtrichtung um eine Hexseite gegen den Uhrzeigersinn. So ergibt sich die zweite Etappe.", "Hinweis III betrifft nur Stunde 4: Die Position liegt auf einem befahrbaren Nachbarfeld von Tesoro.", "Hinweis IV sagt, in welche Richtung die letzte Etappe geht. Arbeite von möglichen Endfeldern rückwärts.", "Nutze „Abstände einblenden“ unter der Karte: Wähle den Leuchtturm als Bezugspunkt. Stunde 5 muss auf einem Feld mit Abstand 1 liegen.", "Vergleiche Stunde 1 und Stunde 3 mit der Abstandsanzeige. Die Luftlinie ist nicht die gefahrene Strecke.", "Zähle für Hinweis VII nur die Positionen der Stunden 3, 4, 5 und 6. Zwei davon müssen unmittelbar an Tesoro liegen."];
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
