// One raster atlas; only precise, state-dependent geometry stays in SVG.
export const MATERIAL_ASSETS=Object.freeze(['brass-rail','brass-strip','brass-bezel','tool-atlas','ship-wheel','paper-grain','open-bordbook','tool-refinements'].map(name=>'assets/ui/'+name+'.webp'));
export const ICON_CELLS=Object.freeze({maybe:[0,0],yes:[1,0],no:[2,0],erase:[0,1],clearAll:[1,1],route:[2,1],undo:[0,2],distance:[1,2],eye:[2,2]});
export const REFINED_CELLS=Object.freeze({maybe:[0,0],feather:[1,0],distance:[0,1],routeBack:[1,1],previous:[0,2],next:[1,2]});
export function rasterIcon(name){
 if(REFINED_CELLS[name]){const [x,y]=REFINED_CELLS[name];return `<span class="raster-icon refined-icon icon-${name}" style="--icon-x:${x*100}%;--icon-y:${y*50}%" aria-hidden="true"></span>`;}
 const [x,y]=ICON_CELLS[name];
 return `<span class="raster-icon icon-${name}" style="--icon-x:${x*50}%;--icon-y:${y*50}%" aria-hidden="true"></span>`;
}
export function mountUpperMaterials(){
 const upper=document.querySelector('.chart-toolbar');
 upper.insertAdjacentHTML('afterbegin','<span class="brass-rail rail-top" aria-hidden="true"></span><span class="brass-rail rail-bottom" aria-hidden="true"></span><span class="wheel-emblem" aria-hidden="true"></span><span class="hour-label" aria-hidden="true">Stunde:</span>');
 upper.querySelectorAll('[data-tool]').forEach(button=>{button.innerHTML=rasterIcon(button.dataset.tool);});
 const group=document.createElement('div');group.className='marking-tools';group.setAttribute('role','group');group.setAttribute('aria-label','Markierungswerkzeuge');
 const tools=document.getElementById('tools');tools.prepend(group);
 group.innerHTML='<span class="marking-feather" aria-hidden="true">'+rasterIcon('feather')+'</span>';
 tools.querySelectorAll('[data-tool]').forEach(b=>{if(b.dataset.tool!=='route')group.append(b);});
 document.getElementById('routeBack').innerHTML=rasterIcon('routeBack');
 const map=document.querySelector('.mapbox');map.classList.add('material-map');
}

export function mountLowerMaterials(){
 const actions=document.getElementById('mapActions');
 actions.insertAdjacentHTML('afterbegin','<span class="brass-rail rail-top" aria-hidden="true"></span><span class="brass-rail rail-bottom" aria-hidden="true"></span>');
 document.getElementById('prevClue').innerHTML=rasterIcon('previous');
 document.getElementById('nextClue').innerHTML=rasterIcon('next');
}
