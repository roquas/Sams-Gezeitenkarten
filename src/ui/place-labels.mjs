import {adjacent} from '../engine/hex.mjs';
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
export function placeLabelLayout(ids,text,blocked,byId){
 const remaining=new Set(ids.filter(id=>blocked.has(id)&&byId[id]));
 if(!remaining.size)return null;
 const components=[];
 while(remaining.size){
  const first=remaining.values().next().value,component=[first];remaining.delete(first);
  for(let i=0;i<component.length;i++)for(const id of remaining)if(adjacent(component[i],id)){remaining.delete(id);component.push(id);}
  components.push(component);
 }
 const land=components.sort((a,b)=>b.length-a.length)[0];
 const centers=land.map(id=>({id,point:hexCenter(byId[id])}));
 // Equal-area hexes: their area centroid is the mean of all constituent centers.
 const centroid=centers.reduce((a,c)=>[a[0]+c.point[0]/centers.length,a[1]+c.point[1]/centers.length],[0,0]);
 const polygon=convexHull(centers.flatMap(c=>hexVertices(...c.point)));
 const water=Object.values(byId).filter(c=>!blocked.has(c.id)).map(c=>hexVertices(...hexCenter(c)));
 const size=labelSize(text);
 const candidates=[centroid,...centers.sort((a,b)=>Math.hypot(a.point[0]-centroid[0],a.point[1]-centroid[1])-Math.hypot(b.point[0]-centroid[0],b.point[1]-centroid[1])).map(c=>c.point)];
 for(const [x,y] of candidates){
  const p={x,y,...size},footprint=labelFootprint(p,size.margin);
  if(footprint.every(v=>containsPoint(polygon,v))&&!water.some(w=>polygonsOverlap(footprint,w)))return {...p,cell:land[0],cells:land,polygon,centroid};
 }return null;
}
export function startLabelLayout(cell,overlay){
 const [x,y]=hexCenter(cell),size=labelSize('Start');
 // Leave a small geometric gap above the unchanged ship's image bounding box.
 return {x:x+(overlay?.dx||0),y:y+(overlay?.dy||0)-(overlay?.h||76)/2-size.height/2-3,...size,cells:[cell.id],cell:cell.id,polygon:null};
}
