// View navigation is transient and never changes or persists the game state.
export function createMobileViews(){
 const media=window.matchMedia('(max-width: 880px)'),map=document.querySelector('.map-panel'),book=document.getElementById('logbook');
 const chartButton=document.getElementById('chartTab'),bookButton=document.getElementById('logbookTab');
 const overview=document.getElementById('allClues').closest('.logbook-section');
 let current='chart';const scroll={chart:0,logbook:0},focus={};
 const marker=document.createComment('desktop logbook overview position');overview.before(marker);
 const details=overview.querySelector('details'),desktopOpen=details.open;
 details.querySelector('summary').addEventListener('click',e=>{if(media.matches)e.preventDefault();});
 function sync(){
  const mobile=media.matches,show=mobile&&current==='logbook';
  document.body.dataset.mobileView=show?'logbook':'chart';
  map.inert=show;book.inert=mobile&&!show;
  chartButton.setAttribute('aria-pressed',String(!show));bookButton.setAttribute('aria-pressed',String(show));
  bookButton.setAttribute('aria-expanded',String(show));
  bookButton.setAttribute('aria-label','Logbuch anzeigen');
  if(mobile){details.open=true;book.querySelector('.pad').prepend(overview);}else{marker.after(overview);details.open=desktopOpen;}
 }
 function select(next){
  if(!media.matches||next===current)return;
  scroll[current]=window.scrollY;focus[current]=document.activeElement;current=next;sync();
  window.scrollTo({top:scroll[current],behavior:'instant'});
  // Keep focus on the persistent view button; returning via Escape restores it.
 }
 chartButton.addEventListener('click',()=>select('chart'));bookButton.addEventListener('click',()=>select('logbook'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current==='logbook'){select('chart');const previous=focus.chart;if(previous&&!previous.closest('.mobile-view-nav'))previous.focus({preventScroll:true});else chartButton.focus({preventScroll:true});}});
 media.addEventListener('change',()=>{current='chart';sync();});sync();
}
