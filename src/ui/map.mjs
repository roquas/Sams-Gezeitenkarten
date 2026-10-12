import {distance as dist} from '../engine/hex.mjs';
import {GREEK_SYMBOLS, ROWCOLORS} from './coordinates.mjs';
import {mapLabels} from '../../content/reference-3.6.mjs';
function poly(x,y){return Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return `${(x+36*Math.cos(a)).toFixed(2)},${(y+36*Math.sin(a)).toFixed(2)}`}).join(" ")}
function coords(c){return [60+c.q*82+(c.r%2)*41,56+c.r*68]}
export function drawMap({state,puzzle,cells,byId,blocked,pretty,key,onPointerDown,onActivate}){
 const $=id=>document.getElementById(id);
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
 for(const label of mapLabels)islandLabel(label.cells,label.text,label.angle,label.dx,label.dy);
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
  g.addEventListener("pointerdown",e=>{if(land)return;e.preventDefault();onPointerDown();try{svg.setPointerCapture(e.pointerId)}catch{};onActivate(c.id,true)});
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onActivate(c.id,true)}});
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
