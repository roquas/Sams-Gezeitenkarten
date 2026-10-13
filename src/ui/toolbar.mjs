import {distanceState} from './chart-art.mjs';
import {coordinateMarkup} from './coordinates.mjs';
import {mountUpperMaterials,mountLowerMaterials,rasterIcon} from './material-icons.mjs';
const svg=body=>`<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">${body}</svg>`;
const icons={
 undo:rasterIcon('undo'),
 distance:rasterIcon('distance'),
 marks:`<span class="mark-emblem">${rasterIcon('eye')}${svg('<path class="hour-hex" d="M16 2L28 9V23L16 30L4 23V9Z"/><line class="hour-edge" x1="28" y1="9" x2="16" y2="2"/><path class="eye-slash" d="M5 27L27 5"/>')}</span>`,
 numbers:`<span class="numbers-emblem">${rasterIcon('eye')}<span class="route-numerals" aria-hidden="true">①···②</span></span>`,
 verify:rasterIcon('yes')+'<span class="verify-label" aria-hidden="true">Prüfen</span>'
};

export function hourEdge(hour){
 const a=(hour-2)*Math.PI/3;
 return {x1:16+14*Math.cos(a-Math.PI/6),y1:16+14*Math.sin(a-Math.PI/6),x2:16+14*Math.cos(a+Math.PI/6),y2:16+14*Math.sin(a+Math.PI/6)};
}
export function createToolbar(puzzle){
 const $=id=>document.getElementById(id);
 $('hours').innerHTML=Array.from({length:puzzle.steps},(_,index)=>{
  const h=index+1,edge=hourEdge(h);
  return `<button type="button" class="hour" data-hour="${h}" aria-label="Stunde ${h}" title="Stunde ${h}"><span class="hour-number">${h}</span><svg class="hour-mini" viewBox="0 0 32 32" aria-hidden="true"><polygon class="hexface" points="28.1,9 28.1,23 16,30 3.9,23 3.9,9 16,2"/><line class="hexedge" ${Object.entries(edge).map(([k,v])=>`${k}="${v}"`).join(' ')}/><text class="hexhour" x="16" y="20" text-anchor="middle">${h}</text></svg></button>`;
 }).join('');
 mountUpperMaterials();
 const button=(id,label,icon)=>`<button class="rail-button" id="${id}" type="button" aria-label="${label}" title="${label}">${icons[icon]}</button>`;
 $('mapActions').innerHTML=button('undo','Letzte Aktion rückgängig machen','undo')+button('toggleDistances','Abstände einblenden','distance')+'<span class="rail-separator" aria-hidden="true"></span>'+button('toggleHourMarks','Markierungen der aktuellen Stunde anzeigen','marks')+button('toggleRouteNumbers','Routennummern anzeigen','numbers')+'<span class="rail-separator" aria-hidden="true"></span>'+button('verify','Route überprüfen','verify');
 const route=document.querySelector('[data-tool="route"]'),back=$('routeBack');
 route.id='routeTool';route.classList.add('rail-button');back.classList.add('rail-button');
 const routeGroup=document.createElement('div');routeGroup.className='route-actions';
 $('verify').before(routeGroup);routeGroup.append(route,back,$('verify'));
 mountLowerMaterials();
 return state=>{
  $('hours').querySelectorAll('[data-hour]').forEach(b=>{
   const h=Number(b.dataset.hour);b.classList.toggle('active',state.layer===h);
   b.classList.toggle('hidden-hour',state.hiddenHours.includes(h));b.setAttribute('aria-pressed',String(state.layer===h));
  });
  document.querySelectorAll('[data-tool]').forEach(b=>{
   const selected=b.dataset.tool===state.tool&&!state.distanceMode;
   b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
  });
  const toggle=(id,on,label)=>{const b=$(id);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',label);b.title=label;};
  toggle('toggleHourMarks',!state.hiddenHours.includes(state.layer),`Markierungen der Stunde ${state.layer} ein- oder ausblenden`);
  toggle('toggleRouteNumbers',state.showRouteNumbers,'Routennummern ein- oder ausblenden');
  const phase=distanceState(state);
  toggle('toggleDistances',phase==='showing',phase==='waiting'?'Abstände: Jetzt ein Feld auf der Karte wählen. Erneut drücken zum Abbrechen.':phase==='showing'?'Abstände ausblenden':'Abstände einblenden');
  $('toggleDistances').dataset.distanceState=phase;
  $('toggleDistances').setAttribute('aria-pressed',String(state.distanceMode));
  const status=$('distanceStatus');status.hidden=phase==='inactive';status.dataset.distanceState=phase;
  status.innerHTML=phase==='waiting'?'Jetzt ein Feld auf der Karte wählen.':phase==='showing'?'Abstände ab '+coordinateMarkup(state.distanceOrigin)+' werden angezeigt.':'';
  document.getElementById('map').classList.toggle('awaiting-distance',phase==='waiting');
  const edge=$('toggleHourMarks').querySelector('.hour-edge');
  Object.entries(hourEdge(state.layer)).forEach(([k,v])=>edge.setAttribute(k,v));
  $('verify').disabled=!puzzle.rules.legal(state.route);
  $('verify').title=$('verify').disabled?'Route überprüfen: zuerst sechs gültige Etappen ab Start wählen':'Route überprüfen';
 };
}
