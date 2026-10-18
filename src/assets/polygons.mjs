// Convex clipping and a deterministic triangulation of a simple CCW polygon.
// Fragments have disjoint interiors: sums of clipped areas represent a union.
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export const polygonArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
export function intersectConvex(subject,clip){
 let out=subject;
 for(let i=0;i<clip.length&&out.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],input=out;out=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=cross(a,b,p),dq=cross(a,b,q);
   if(dp>=0)out.push(p);
   if((dp<0)!==(dq<0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
  }
 }
 return out;
}
export function triangulate(polygon){
 const p=polygon.slice(),triangles=[];
 while(p.length>3){
  const i=p.findIndex((b,i)=>{
   const a=p[(i+p.length-1)%p.length],c=p[(i+1)%p.length];
   return cross(a,b,c)>1e-9&&!p.some(v=>v!==a&&v!==b&&v!==c&&cross(a,b,v)>=-1e-9&&cross(b,c,v)>=-1e-9&&cross(c,a,v)>=-1e-9);
  });
  if(i<0)throw Error('Cannot triangulate graphic map boundary');
  triangles.push([p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]]);p.splice(i,1);
 }
 triangles.push(p);return triangles;
}
