export const HEX_RADIUS=36;
// The same geometry supplies interactive polygons and label containment.
export function hexCenter(c){return [60+c.q*82+(c.r%2)*41,56+c.r*68];}
export function hexVertices(x,y){return Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return [x+HEX_RADIUS*Math.cos(a),y+HEX_RADIUS*Math.sin(a)];});}
export function containsPoint(vertices,[x,y]){
 return vertices.every((a,i)=>{const b=vertices[(i+1)%vertices.length];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-7;});
}
export function convexHull(points){
 const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
export function polygonsOverlap(a,b){
 for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],axis=[p[1]-q[1],q[0]-p[0]];
  const project=ps=>ps.map(v=>v[0]*axis[0]+v[1]*axis[1]);
  const aa=project(a),bb=project(b);
  if(Math.max(...aa)<Math.min(...bb)-1e-7||Math.max(...bb)<Math.min(...aa)-1e-7)return false;
 }return true;
}
function labelSize(text){
 const fontSize=13,height=18,margin=4;
 const width=Math.min(2*(HEX_RADIUS*Math.sqrt(3)/2-margin),Math.max(38,text.length*fontSize*.48+8));
 return {fontSize,height,width,margin};
}
export function labelFootprint(p,margin=0){
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>[p.x+dx*(p.width/2+margin),p.y+dy*(p.height/2+margin)]);
}
// Equal-area hexes: use the centroid of the complete logical footprint.
// Temporary plaques may cover sea/art; only the visible chart bounds constrain them.
export function placeLabelLayout(ids,text,byId,bounds){
 const cells=[...new Set(ids)].filter(id=>byId[id]);
 if(!cells.length)return null;
 const centroid=cells.reduce((sum,id)=>hexCenter(byId[id]).map((v,i)=>sum[i]+v/cells.length),[0,0]);
 const margin=8,fontSize=22,height=34;
 const width=Math.min(bounds.width-2*margin,Math.max(92,text.length*fontSize*.58+24));
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
 return {x:clamp(centroid[0],bounds.x+margin+width/2,bounds.x+bounds.width-margin-width/2),
  y:clamp(centroid[1],bounds.y+margin+height/2,bounds.y+bounds.height-margin-height/2),
  width,height,fontSize,margin,cells,cell:cells[0],centroid};
}
export function drawParchmentLabel(el,layout,text,{start=false,objectId}={}){
 const {x,y,width,height,fontSize,cell}=layout;
 const g=el('g',{class:start?'place-label start-label':'place-label reference-label',transform:`translate(${x} ${y})`,
  'data-label-cell':cell,'data-label-cells':layout.cells.join(' '),...(objectId?{'data-label-object':objectId}:{}),
  'pointer-events':'none','aria-hidden':'true'});
 g.append(el('rect',{x:-width/2,y:-height/2,width,height,rx:2,fill:'#f3e5c5',stroke:'#9e7b45','stroke-width':'.5',opacity:start?'.62':'.96'}));
 g.append(el('image',{href:'assets/ui/paper-grain.webp',x:-width/2+.5,y:-height/2+.5,width:width-1,height:height-1,preserveAspectRatio:'none',opacity:'.12'}));
 g.append(el('text',{x:0,y:0,dy:'.35em','text-anchor':'middle','font-family':"Georgia,'Times New Roman',serif",'font-size':fontSize,
  'font-weight':'600',fill:start?'#8c3e2c':'#392b19',stroke:'#f6e8cd','stroke-width':'.35','paint-order':'stroke'},text));
 return g;
}
export function startLabelLayout(cell){
 const [x,baseY]=hexCenter(cell),size=labelSize('Start'),polygon=hexVertices(x,baseY);
 // Aim at the lower lateral vertices, then retain the whole plaque on its hex.
 for(let drop=HEX_RADIUS/2;drop>=0;drop-=.25){
  const p={x,y:baseY+drop,...size};
  if(labelFootprint(p,size.margin).every(v=>containsPoint(polygon,v)))return {...p,cells:[cell.id],cell:cell.id,polygon,drop};
 }return null;
}
