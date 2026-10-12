// Presentation references only; puzzle geometry and rules remain independent.
export const CHART_BACKGROUND='assets/seekarte/meer-pergament.webp';
const motifs={
 'insel-zweier-01.png':{asset:'tesoro.png',w:148,h:112,dx:0,dy:0},
 'insel-einzeln-01.png':{asset:'tesoro.png',w:76,h:58,dx:0,dy:0},
 'insel-einzeln-02.png':{asset:'tesoro.png',w:64,h:49,dx:0,dy:0},
 'riff-01.png':{asset:'tesoro.png',w:54,h:41,dx:0,dy:0},
 'segelboot-01.png':{asset:'segelschiff.png',w:66,h:76,dx:0,dy:-6},
 'segelboot-02.png':{asset:'segelschiff.png',w:61,h:70,dx:0,dy:-5},
 'leuchtturm-01.png':{asset:'leuchtturm.png',w:75,h:81,dx:0,dy:-5}
};
export function chartOverlays(overlays){
 // The crab accent shares its location's island illustration for now.
 return overlays.filter(o=>o.asset!=='krabbe-01.png').map(o=>{
  const motif=motifs[o.asset];
  if(!motif)throw Error('Unmapped chart motif: '+o.asset);
  return {...o,...motif,asset:'assets/seekarte/'+motif.asset};
 });
}
// Nine slices reuse the original watercolor border, widening only the parchment.
// All hex centers, polygons and pointer coordinates stay unchanged.
export function parchmentTiles(){
 const sourceX=[0,30,445,475],sourceY=[0,30,355,385];
 const targetX=[-44,36,439,519],targetY=[-44,30,355,429];
 return Array.from({length:9},(_,i)=>{
  const q=i%3,r=Math.floor(i/3);
  return {x:targetX[q],y:targetY[r],width:targetX[q+1]-targetX[q],height:targetY[r+1]-targetY[r],
   viewBox:[sourceX[q],sourceY[r],sourceX[q+1]-sourceX[q],sourceY[r+1]-sourceY[r]].join(' ')};
 });
}

export const CHART_VIEWBOX='-44 -44 563 473';
export const MARGIN_COLUMNS=[-19,404];
export const MARGIN_ROWS=[-8,484];
export const distanceState=state=>!state.distanceMode?'inactive':state.distanceOrigin?'showing':'waiting';
