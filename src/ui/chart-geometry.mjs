// Shared presentation geometry. Engine coordinates and every hex stay unchanged.
import {hexCenter,hexVertices} from './place-labels.mjs';
export const HEXES=Array.from({length:25},(_,i)=>{const q=i%5,r=Math.floor(i/5);return {id:'ABCDE'[q]+(r+1),q,r,center:hexCenter({q,r}),polygon:hexVertices(...hexCenter({q,r}))};});
const points=HEXES.flatMap(h=>h.polygon);
export const HEX_BOUNDS=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
export const CHART_CENTER=[(HEX_BOUNDS[0]+HEX_BOUNDS[2])/2,(HEX_BOUNDS[1]+HEX_BOUNDS[3])/2];
export const CHART_BOUNDS={x:CHART_CENTER[0]-563/2,y:CHART_CENTER[1]-473/2,width:563,height:473};
export const CHART_VIEWBOX=Object.values(CHART_BOUNDS).join(' ');
export function headingBand(side,index){
 const center={top:-12,bottom:396,left:-2,right:491}[side];
 if(center===undefined||index<0||index>4)throw Error('Invalid heading');
 return {center,outer:center-20,inner:center+20};
}
// Boundary of connected row envelopes: bridges the inter-hex water gaps, retains
// alternating left/right recesses. Unlike a convex hull, staggered corners survive.
const a=36*Math.sqrt(3)/2;
export const ROW_ENVELOPE=[
 [60,20],[388,20],
 ...Array.from({length:5},(_,r)=>{const x=388+(r%2)*41,y=56+r*68;return [[x+a,y-18],[x+a,y+18]];}).flat(),
 [388,364],[60,364],
 ...Array.from({length:5},(_,i)=>{const r=4-i,x=60+(r%2)*41,y=56+r*68;return [[x-a,y+18],[x-a,y-18]];}).flat()
];
// Outward miter offset of this simple CCW polygon, exact line intersections.
export function offsetPolygon(poly,d){
 const lines=poly.map((p,i)=>{const q=poly[(i+1)%poly.length],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy);return {p:[p[0]+dy*d/len,p[1]-dx*d/len],v:[dx,dy]};});
 return lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],cross=(u,v)=>u[0]*v[1]-u[1]*v[0],t=cross([b.p[0]-a.p[0],b.p[1]-a.p[1]],b.v)/cross(a.v,b.v);return [a.p[0]+t*a.v[0],a.p[1]+t*a.v[1]];});
}
export function pointInPolygon([x,y],p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export const rectPolygon=([l,t,r,b])=>[[l,t],[r,t],[r,b],[l,b]];
export const polygonPath=p=>'M '+p.map(v=>v.join(' ')).join(' L ')+' Z';
