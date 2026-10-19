import {validateLibrary} from '../src/assets/library.mjs';
import {reviewPositions} from './review-positions.mjs';
import {multihexPrototypes,renderMultihex,multihexCaption} from './multihex-prototypes.mjs';
try{
 const response=await fetch('assets/catalog/library.json');if(!response.ok)throw Error('Catalog HTTP '+response.status);
 const library=validateLibrary(await response.json());
 const select=document.getElementById('multihexAsset');
 for(const p of multihexPrototypes){const o=document.createElement('option');o.value=p.key;o.textContent=p.name;select.append(o);}
 const requested=new URLSearchParams(location.search).get('asset');
 if(multihexPrototypes.some(p=>p.key===requested))select.value=requested;
 function render(){
  const options={marked:document.getElementById('marks').checked,hexes:document.getElementById('hexes').checked};
  function card(container,prototype,anchor,position,detail){
   const figure=document.createElement('figure'),caption=document.createElement('figcaption');
   caption.textContent=multihexCaption(library,prototype,anchor)+(position?' · '+position.parity+' · '+position.location:'');figure.append(caption);
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
   if(position){svg.dataset.parity=position.parity;svg.dataset.position=position.location;}
   figure.append(svg);container.append(figure);renderMultihex(svg,library,prototype,anchor,{...options,detail});
  }
  const comparison=document.getElementById('multihexComparison');comparison.replaceChildren();
  for(const p of multihexPrototypes)card(comparison,p,'B3',null,true);
  const positions=document.getElementById('multihexPositions');positions.replaceChildren();
  const p=multihexPrototypes.find(p=>p.key===select.value),asset=library.assets.find(a=>a.id===p.id);
  for(const position of reviewPositions(asset))card(positions,p,position.anchor,position,false);
 }
 for(const id of ['multihexAsset','marks','hexes'])document.getElementById(id).addEventListener('change',render);
 render();
}catch(error){document.getElementById('error').textContent=error.message;}
