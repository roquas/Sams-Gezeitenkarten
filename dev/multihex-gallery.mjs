import {validateLibrary} from '../src/assets/library.mjs';
import {reviewPositions} from './review-positions.mjs';
import {multihexPrototypes,multihexCandidates,renderMultihex,multihexCaption,drawGraphicFootprint} from './multihex-prototypes.mjs';
try{
 const response=await fetch('assets/catalog/library.json');if(!response.ok)throw Error('Catalog HTTP '+response.status);
 const library=validateLibrary(await response.json());
 const select=document.getElementById('multihexAsset');
 for(const p of multihexPrototypes){const o=document.createElement('option');o.value=p.key;o.textContent=p.name+(p.key.startsWith('tesoro-v')?' · '+p.key.split('-')[1]:'')+(p.historical?' · historisch':'');select.append(o);}
 const requested=new URLSearchParams(location.search).get('asset');
 select.value=multihexPrototypes.some(p=>p.key===requested)?requested:'tesoro';
 function render(){
  const options={marked:document.getElementById('marks').checked,hexes:document.getElementById('hexes').checked};
  function card(container,prototype,anchor,position,detail){
   const figure=document.createElement('figure'),caption=document.createElement('figcaption');
   caption.textContent=multihexCaption(library,prototype,anchor)+(position?' · '+position.parity+' · '+position.location:'');figure.append(caption);
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
   if(position){svg.dataset.parity=position.parity;svg.dataset.position=position.location;}
   figure.append(svg);container.append(figure);renderMultihex(svg,library,prototype,anchor,{...options,detail});return svg;
  }
  const comparison=document.getElementById('multihexComparison');comparison.replaceChildren();
  for(const p of multihexCandidates)card(comparison,p,'B3',null,true);
  const tesoro=multihexPrototypes.find(p=>p.key==='tesoro');
  const detail=document.getElementById('tesoroDetail');detail.replaceChildren();
  const enlarged=card(detail,tesoro,'B3',null,true);
  const image=enlarged.querySelector('[data-placement-id]');
  enlarged.setAttribute('viewBox',[+image.getAttribute('x')-20,+image.getAttribute('y')-20,+image.getAttribute('width')+40,+image.getAttribute('height')+40].join(' '));
  enlarged.querySelector('.island-label').setAttribute('visibility',document.getElementById('detailLabels').checked?'visible':'hidden');
  const history=document.getElementById('tesoroHistory');history.replaceChildren();
  for(const key of ['tesoro-v1','tesoro-v2']){
   const p=multihexPrototypes.find(p=>p.key===key),svg=card(history,p,'B3',null,true);
   svg.parentElement.querySelector('figcaption').textContent='Tesoro · '+key.split('-')[1]+' historisch · keine künstlerische Freigabe';
  }
  const approved=document.getElementById('multihexApproved');approved.replaceChildren();
  for(const p of multihexPrototypes.filter(p=>p.round===1))card(approved,p,'B3',null,true);
  const geometry=document.getElementById('clawGeometry');geometry.replaceChildren();
  const current=multihexPrototypes.find(p=>p.key==='claw');
  for(const p of [{...current,id:'land-coast.island.h4.crab-claw.v1',name:'Krabbenzange · v1 historisch'}, {...current,name:'Krabbenzange · v2 historisch'}]){
   // Use the unchanged actual place name; version belongs to the caption only.
   const svg=card(geometry,{...p,name:current.name},'B3',null,true);
   svg.parentElement.querySelector('figcaption').textContent=p.name+' · pending · vier gesperrte Zellen';
   drawGraphicFootprint(svg,library.assets.find(a=>a.id===p.id),'B3',document.getElementById('footprint').checked);
  }
  const positions=document.getElementById('multihexPositions');positions.replaceChildren();
  const p=multihexPrototypes.find(p=>p.key===select.value),asset=library.assets.find(a=>a.id===p.id);
  for(const position of reviewPositions(asset))card(positions,p,position.anchor,position,false);
 }
 for(const id of ['multihexAsset','marks','hexes','footprint','detailLabels'])document.getElementById(id).addEventListener('change',render);
 render();
}catch(error){document.getElementById('error').textContent=error.message;}
