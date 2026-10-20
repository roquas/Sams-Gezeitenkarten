import {compatibility} from '../src/assets/library.mjs';
import {renderAssetPreview} from './asset-usage.mjs';

const prototypes=[
 {id:'navigation.lighthouse.h1.offcenter-beacon.v1',name:'Leuchtturm'},
 {id:'land-coast.atoll.h1.broken-passages.v1',name:'Aufgebrochenes Atoll'},
 {id:'navigation.wreck.h1.offcenter-sloop.v1',name:'Segelschiffswrack'}
];

// Development fixture only: real gameplay UI without asset approval or edits
// to a published puzzle. All three use B3 and the same map scale.
export function renderPrototypeComparison(library){
 const container=document.getElementById('prototypeComparison');container.replaceChildren();
 const marked=document.getElementById('prototypeMarks').checked;
 const hexes=document.getElementById('hexes').checked;
 for(const prototype of prototypes){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  caption.textContent=prototype.name+' · B3 · befahrbar · '+compatibility(library,prototype.id,'sea-blue-01');figure.append(caption);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.dataset.prototype=prototype.id;
  svg.setAttribute('role','img');svg.setAttribute('aria-label',caption.textContent);
  figure.append(svg);container.append(figure);
  renderAssetPreview(svg,library,prototype.id,'named-passable',prototype.name,{marked,hexes});
 }
}
