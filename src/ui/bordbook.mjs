export function nextClue(index,delta,count){return ((index+delta)%count+count)%count;}
export function swipeDirection(dx,dy){return Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.25?(dx<0?1:-1):0;}
export function createBordbook({clues,getState,toggleClue,markup=t=>t}){
 const $=id=>document.getElementById(id);
 let current=0,touch=null,suppressClickUntil=0,animation;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function render(){
  const focusInBook=$('clueTrack').contains(document.activeElement);
  const focusInList=$('allClues').contains(document.activeElement);
  const focusedClue=document.activeElement?.dataset.clue;
  const state=getState();
  const clue=([id,text],format)=>{
   const done=state.doneClues.includes(id);
   return `<div class="clue ${done?'done':''}" data-clue="${id}" role="checkbox" tabindex="0" aria-checked="${done}" title="Hinweis abhaken"><span class="num">${id}</span><p>${format(text)}</p></div>`;
  };
  $('allClues').innerHTML=clues.map(c=>clue(c,markup)).join('');
  $('clueTrack').innerHTML=`<div class="clue-slide center">${clue(clues[current],t=>t)}</div>`;
  $('cluePosition').textContent=`${clues[current][0]} / ${clues.at(-1)[0]}`;
  $('clueDone').textContent=state.doneClues.includes(clues[current][0])?'✓ Abgehakt':'Hinweis antippen zum Abhaken';
  if(focusInBook)$('clueTrack').querySelector('[data-clue]').focus({preventScroll:true});
  if(focusInList)$('allClues').querySelector(`[data-clue="${focusedClue}"]`)?.focus({preventScroll:true});
 }
 function shift(delta){
  current=nextClue(current,delta,clues.length);render();animation?.cancel();
  if(!motion.matches&&$('clueTrack').animate)animation=$('clueTrack').animate([
   {opacity:.65,transform:`translateX(${delta*6}px)`},{opacity:1,transform:'translateX(0)'}
  ],{duration:160,easing:'ease-out'});
 }
 $('prevClue').addEventListener('click',()=>shift(-1));
 $('nextClue').addEventListener('click',()=>shift(1));
 $('clueViewport').addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();shift(e.key==='ArrowRight'?1:-1);}
 });
 $('clueViewport').addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 $('clueViewport').addEventListener('touchcancel',()=>touch=null,{passive:true});
 $('clueViewport').addEventListener('touchend',e=>{
  if(!touch||!e.changedTouches.length)return;
  const direction=swipeDirection(e.changedTouches[0].clientX-touch.x,e.changedTouches[0].clientY-touch.y);
  touch=null;if(direction){suppressClickUntil=performance.now()+500;shift(direction);}
 },{passive:true});
 for(const container of [$('clueTrack'),$('allClues')]){
  container.addEventListener('click',e=>{
   if(container===$('clueTrack')&&performance.now()<suppressClickUntil)return;
   const id=e.target.closest('[data-clue]')?.dataset.clue;
   if(id){toggleClue(id);render();}
  });
  container.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-clue]')){e.preventDefault();e.target.closest('[data-clue]').click();}});
 }
 motion.addEventListener?.('change',()=>{if(motion.matches)animation?.cancel();});
 return {render};
}
