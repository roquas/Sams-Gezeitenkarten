// One raster atlas; only precise, state-dependent geometry stays in SVG.
export const MATERIAL_ASSETS=Object.freeze(['brass-rail','brass-strip','brass-bezel','tool-atlas','ship-wheel','paper-grain','open-bordbook'].map(name=>'assets/ui/'+name+'.webp'));
export const ICON_CELLS=Object.freeze({maybe:[0,0],yes:[1,0],no:[2,0],erase:[0,1],clearAll:[1,1],route:[2,1],undo:[0,2],distance:[1,2],eye:[2,2]});
export function rasterIcon(name){
 const [x,y]=ICON_CELLS[name];
 return `<span class="raster-icon icon-${name}" style="--icon-x:${x*50}%;--icon-y:${y*50}%" aria-hidden="true"></span>`;
}
export function mountUpperMaterials(){
 const upper=document.querySelector('.chart-toolbar');
 upper.insertAdjacentHTML('afterbegin','<span class="brass-rail rail-top" aria-hidden="true"></span><span class="brass-rail rail-bottom" aria-hidden="true"></span><span class="wheel-emblem" aria-hidden="true"></span><span class="hour-label" aria-hidden="true">Stunde:</span>');
 upper.querySelectorAll('[data-tool]').forEach(button=>{button.innerHTML=rasterIcon(button.dataset.tool);});
 document.getElementById('routeBack').innerHTML=rasterIcon('undo')+'<span class="backstep-detail" aria-hidden="true">1</span>';
 const map=document.querySelector('.mapbox');map.classList.add('material-map');
}

export function mountLowerMaterials(){
 const actions=document.getElementById('mapActions');
 actions.insertAdjacentHTML('afterbegin','<span class="brass-rail rail-top" aria-hidden="true"></span><span class="brass-rail rail-bottom" aria-hidden="true"></span>');
 document.getElementById('prevClue').innerHTML=rasterIcon('undo');
 document.getElementById('nextClue').innerHTML=rasterIcon('undo');
}
