const svg=body=>`<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">${body}</svg>`;
const eye='<path d="M6 16Q16 6 26 16Q16 26 6 16Z"/><circle cx="16" cy="16" r="2.5"/><path class="eye-slash" d="M7 26L25 6"/>';
const icons={
 undo:svg('<path d="M9 9H3V3M3 9C8 1 23 4 26 13S21 28 14 27"/>'),
 distance:svg('<path d="M2 22C7 7 24 5 30 22M5 24C10 12 21 12 27 24M10 25C13 18 20 18 23 25"/>'),
 marks:svg('<path class="hour-hex" d="M16 2L28 9V23L16 30L4 23V9Z"/>'+eye+'<line class="hour-edge" x1="28" y1="9" x2="16" y2="2"/>'),
 numbers:svg('<path d="M3 10Q10 3 17 10Q10 17 3 10Z"/><circle cx="10" cy="10" r="2"/><text x="3" y="29">①②③</text>'),
 verify:svg('<path d="M3 24L10 16L15 20L21 9M19 24L23 28L30 18"/>')
};
export function hourEdge(hour){
 const a=(hour-2)*Math.PI/3;
 return {x1:16+14*Math.cos(a-Math.PI/6),y1:16+14*Math.sin(a-Math.PI/6),x2:16+14*Math.cos(a+Math.PI/6),y2:16+14*Math.sin(a+Math.PI/6)};
}
export function createToolbar(puzzle){
 const $=id=>document.getElementById(id);
 $('hours').innerHTML=Array.from({length:puzzle.steps},(_,index)=>{
  const h=index+1,edge=hourEdge(h);
  return `<button type="button" class="hour" data-hour="${h}" aria-label="Stunde ${h}" title="Stunde ${h}"><svg viewBox="0 0 32 32" aria-hidden="true"><polygon class="hexface" points="28.1,9 28.1,23 16,30 3.9,23 3.9,9 16,2"/><line class="hexedge" ${Object.entries(edge).map(([k,v])=>`${k}="${v}"`).join(' ')}/><text class="hexhour" x="16" y="20" text-anchor="middle">${h}</text></svg></button>`;
 }).join('');
 const button=(id,label,icon)=>`<button class="rail-button" id="${id}" type="button" aria-label="${label}" title="${label}">${icons[icon]}</button>`;
 $('mapActions').innerHTML=button('undo','Letzte Aktion rückgängig machen','undo')+button('toggleDistances','Abstände einblenden','distance')+'<span class="rail-separator" aria-hidden="true"></span>'+button('toggleHourMarks','Markierungen der aktuellen Stunde anzeigen','marks')+button('toggleRouteNumbers','Routennummern anzeigen','numbers')+'<span class="rail-separator" aria-hidden="true"></span>'+button('verify','Route überprüfen','verify');
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
  toggle('toggleDistances',state.distanceMode,state.distanceMode?(state.distanceOrigin?'Abstände ausblenden':'Abstände: Bezugspunkt auf der Karte wählen'):'Abstände einblenden');
  const edge=$('toggleHourMarks').querySelector('.hour-edge');
  Object.entries(hourEdge(state.layer)).forEach(([k,v])=>edge.setAttribute(k,v));
  $('verify').disabled=!puzzle.rules.legal(state.route);
  $('verify').title=$('verify').disabled?'Route überprüfen: zuerst sechs gültige Etappen ab Start wählen':'Route überprüfen';
 };
}
