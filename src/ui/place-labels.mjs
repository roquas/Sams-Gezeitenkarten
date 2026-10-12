import {adjacent} from '../engine/hex.mjs';
export const HEX_RADIUS=36;
// The same geometry supplies interactive polygons and label containment.
export function hexCenter(c){return [60+c.q*82+(c.r%2)*41,56+c.r*68];}
export function hexVertices(x,y){return Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return [x+HEX_RADIUS*Math.cos(a),y+HEX_RADIUS*Math.sin(a)];});}
export function containsPoint(vertices,[x,y]){
 return vertices.every((a,i)=>{const b=vertices[(i+1)%vertices.length];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-7;});
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
 const centroid=centers.reduce((a,c)=>[a[0]+c.point[0]/centers.length,a[1]+c.point[1]/centers.length],[0,0]);
 // Never bridge gaps between the drawn hexes: use the closest safe cell center.
 const anchor=centers.sort((a,b)=>Math.hypot(a.point[0]-centroid[0],a.point[1]-centroid[1])-Math.hypot(b.point[0]-centroid[0],b.point[1]-centroid[1])||a.id.localeCompare(b.id))[0];
 const fontSize=13,height=18,margin=4;
 const width=Math.min(2*(HEX_RADIUS*Math.sqrt(3)/2-margin),Math.max(38,text.length*fontSize*.48+8));
 const [x,y]=anchor.point,polygon=hexVertices(x,y);
 const corners=[[-width/2-margin,-height/2-margin],[width/2+margin,-height/2-margin],[width/2+margin,height/2+margin],[-width/2-margin,height/2+margin]].map(([dx,dy])=>[x+dx,y+dy]);
 if(!corners.every(p=>containsPoint(polygon,p)))return null;
 return {x,y,width,height,fontSize,cell:anchor.id,cells:land,polygon};
}
