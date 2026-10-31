// Embedded as a classic script so the generated proof works with file://.
(()=>{
 const data=JSON.parse(document.getElementById('proof-data').textContent);
 const overview=document.getElementById('overview'),detail=document.getElementById('detail');
 const articles=[...document.querySelectorAll('[data-detail]')];
 let current=0;
 function show(index){
  current=index;overview.hidden=true;detail.hidden=false;
  articles.forEach((a,i)=>a.hidden=i!==index);
  document.getElementById('counter').textContent=(index+1)+' / '+articles.length;
  document.getElementById('previous').disabled=index===0;
  document.getElementById('next').disabled=index===articles.length-1;
  articles[index].querySelector('h2').setAttribute('tabindex','-1');
  articles[index].querySelector('h2').focus();
 }
 document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.open))));
 document.getElementById('back').addEventListener('click',()=>{overview.hidden=false;detail.hidden=true;document.querySelector('[data-open="'+current+'"]').focus();});
 document.getElementById('previous').addEventListener('click',()=>show(current-1));
 document.getElementById('next').addEventListener('click',()=>show(current+1));
 for(const id of ['hexes','footprints']){
  const input=document.getElementById(id);
  input.addEventListener('change',()=>detail.classList.toggle('show-'+id,input.checked));
 }
 document.getElementById('normal').addEventListener('click',()=>{
  for(const id of ['hexes','footprints']){document.getElementById(id).checked=false;detail.classList.remove('show-'+id);}
 });
 document.querySelectorAll('.position-select').forEach(select=>select.addEventListener('change',()=>{
  select.closest('article').querySelectorAll('.position').forEach((p,i)=>p.hidden=i!==Number(select.value));
 }));
 document.getElementById('whole-board').addEventListener('change',event=>{
  detail.querySelectorAll('svg').forEach(svg=>svg.setAttribute('viewBox',event.target.checked?svg.dataset.board:svg.dataset.zoom));
 });
 // A copied folder can lose resources later. Reflect damage on every affected
 // overview/detail entry as well as in a persistent global alert.
 Promise.all(data.resources.map(async r=>{
  const image=new Image();image.src=r.path;
  try{await image.decode();return null;}catch{return r.source;}
 })).then(results=>{
  const failed=results.filter(Boolean);
  if(!failed.length)return;
  const alert=document.getElementById('image-errors');alert.hidden=false;
  alert.textContent='Nicht vollständig prüfbar: Ressourcen fehlen oder sind beschädigt: '+failed.join(', ');
  data.assets.forEach((a,i)=>{
   if(failed.includes(data.background)||failed.includes(a.resource)){
    for(const node of [document.querySelector('[data-open="'+i+'"]'),articles[i]]){
     node.classList.add('failed');node.querySelector('.asset-status').textContent='Nicht vollständig prüfbar: Bildressource fehlt oder ist beschädigt.';
    }
   }
  });
 });
})();
