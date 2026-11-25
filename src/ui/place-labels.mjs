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
export function labelFootprint(p,margin=0){
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>[p.x+dx*(p.width/2+margin),p.y+dy*(p.height/2+margin)]);
}
// Equal-area hexes: use the centroid of the complete logical footprint.
// Temporary plaques may cover sea/art; only the visible chart bounds constrain them.
export function placeLabelLayout(ids,text,byId,bounds){
 const cells=[...new Set(ids)].filter(id=>byId[id]);
 if(!cells.length)return null;
 const centroid=cells.reduce((sum,id)=>hexCenter(byId[id]).map((v,i)=>sum[i]+v/cells.length),[0,0]);
 const margin=8,fontSize=18,height=28;
 const width=Math.min(bounds.width-2*margin,Math.max(66,text.length*fontSize*.58+24));
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
 return {x:clamp(centroid[0],bounds.x+margin+width/2,bounds.x+bounds.width-margin-width/2),
  y:clamp(centroid[1],bounds.y+margin+height/2,bounds.y+bounds.height-margin-height/2),
  width,height,fontSize,margin,cells,cell:cells[0],centroid};
}
// Edge segments stay about 24 units wide at every name length. Only the number
// of waves grows; neither the folds nor their amplitude are stretched.
export function parchmentPath(width,height){
 const l=-width/2,r=width/2,t=-height/2,b=height/2,n=Math.max(2,Math.ceil((width-12)/24)),step=(width-12)/n;
 let d=`M ${l+5} ${t+1}`;
 for(let i=0;i<n;i++){const x=l+5+i*step;d+=` Q ${x+step/2} ${t+(i%2?-1.2:2)} ${x+step} ${t+(i%3===0?.6:0)}`;}
 d+=` L ${r-1} ${t+4} L ${r-3} ${t+10} L ${r} ${b-5} L ${r-5} ${b-1}`;
 for(let i=0;i<n;i++){const x=r-5-i*step;d+=` Q ${x-step/2} ${b+(i%2?1:-1.7)} ${x-step} ${b+(i%3===1?-.7:0)}`;}
 return d+` L ${l+1} ${b-4} L ${l+3} ${t+11} L ${l} ${t+5} Z`;
}
export function drawParchmentLabel(el,layout,text,{start=false,objectId}={}){
 const {x,y,width,height,fontSize,cell}=layout;
 const g=el('g',{class:start?'place-label start-label':'place-label reference-label',transform:`translate(${x} ${y})`,
  'data-label-cell':cell,'data-label-cells':layout.cells.join(' '),'data-label-width':width,...(objectId?{'data-label-object':objectId}:{}),
  'pointer-events':'none','aria-hidden':'true'});
 const paper=el('g',{class:'label-paper'}),d=parchmentPath(width,height);
 const clipId=`place-paper-${start?'start':'object-'+objectId}`;
 const defs=el('defs'),clip=el('clipPath',{id:clipId});clip.append(el('path',{d}));defs.append(clip);paper.append(defs);
 // Reuse the current A3 direction pigment; regular parchment stays unchanged.
 const edge=start?'#a15f43':'#9e7b45';
 paper.append(el('path',{d,fill:start?'#e5cda6':'#f3e5c5',stroke:edge,'stroke-width':start?'1.1':'.5',opacity:'.96'}));
 paper.append(el('image',{href:'assets/ui/paper-grain.webp',x:-width/2,y:-height/2,width,height,preserveAspectRatio:'none',opacity:'.12','clip-path':`url(#${clipId})`}));
 paper.append(el('path',{d:`M ${-width/2+5} ${-height/2+3} q -3 5 0 9 M ${width/2-4} ${height/2-3} q 2 -4 -1 -8`,fill:'none',stroke:edge,'stroke-width':'.7',opacity:'.38'}));
 g.append(paper);
 g.append(el('text',{class:'label-ink',x:0,y:0,dy:'.35em','text-anchor':'middle','font-family':"Georgia,'Times New Roman',serif",'font-size':fontSize,
  'font-weight':'600',fill:start?'#a15f43':'#392b19',stroke:'#f6e8cd','stroke-width':'.8','stroke-linejoin':'round','paint-order':'stroke'},text));
 return g;
}
