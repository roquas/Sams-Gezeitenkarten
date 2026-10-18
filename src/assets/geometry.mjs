import {axial} from '../engine/hex.mjs';
import {hexVertices} from '../ui/place-labels.mjs';

export const PIXELS_PER_UNIT=4;
const neighbors=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const key=c=>c.join(',');
export function geometryErrors(cells){
 if(!Array.isArray(cells)||!cells.length||cells.length>25)return ['geometry.cells: expected 1–25 axial cells'];
 if(cells.some(c=>!Array.isArray(c)||c.length!==2||!c.every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=24)))return ['geometry.cells: invalid axial coordinate'];
 const keys=new Set(cells.map(key));
 if(keys.size!==cells.length)return ['geometry.cells: duplicate cell'];
 if(!keys.has('0,0'))return ['geometry.cells: missing origin'];
 const seen=new Set(['0,0']),queue=[[0,0]];
 for(let i=0;i<queue.length;i++)for(const [dq,dr] of neighbors){
  const c=[queue[i][0]+dq,queue[i][1]+dr],k=key(c);
  if(keys.has(k)&&!seen.has(k)){seen.add(k);queue.push(c);}
 }
 return seen.size===cells.length?[]:['geometry.cells: cells must be edge-connected'];
}
// The archived chart has deliberate water gaps between its interactive hexes.
// Use its actual center lattice (82 / 41 / 68), never a regular-hex bounding box.
export function imageContract(cells){
 const errors=geometryErrors(cells);if(errors.length)throw Error(errors.join('; '));
 const centers=cells.map(([q,r])=>[82*q+41*r,68*r]);
 const center=[0,1].map(i=>centers.reduce((sum,c)=>sum+c[i]/centers.length,0));
 const polygons=centers.map(c=>hexVertices(c[0]-center[0],c[1]-center[1]));
 const points=polygons.flat();
 const [width,height]=[0,1].map(i=>2*Math.ceil(Math.max(...points.map(p=>Math.abs(p[i])))+4));
 return {width,height,pixelWidth:width*PIXELS_PER_UNIT,pixelHeight:height*PIXELS_PER_UNIT,polygons};
}
export function placedCells(asset,anchor){
 const [q,r]=axial(anchor);
 return asset.geometry.cells.map(([dq,dr])=>{
  const row=r+dr,column=q+dq+Math.floor(row/2);
  return String.fromCharCode(65+column)+(row+1);
 });
}
export function assetRectangle(asset,anchor,byId){
 const cells=placedCells(asset,anchor);
 if(cells.some(c=>!byId[c]))throw Error('Asset extends beyond chart: '+asset.id);
 const centers=cells.map(c=>{const p=byId[c];return [60+p.q*82+(p.r%2)*41,56+p.r*68];});
 const [cx,cy]=[0,1].map(i=>centers.reduce((s,p)=>s+p[i]/centers.length,0));
 const {width,height}=imageContract(asset.geometry.cells);
 return {cells,x:cx-width/2,y:cy-height/2,width,height};
}
