import {axial} from '../engine/hex.mjs';
import {HEXES} from '../ui/chart-geometry.mjs';

export const PIXELS_PER_UNIT=4;
export const neighbors=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
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
// Voronoi cell of the *infinite* actual center lattice, not the visible hex.
// Bisectors: |x| <= 41 and +/-41*x +/-68*y <= (41²+68²)/2.
// This stretched lattice is not regular. Each cell has area 82*68.
const tip=(41**2+68**2)/(2*68),shoulder=tip-41**2/68;
export const GRAPHIC_CELL=[[-41,-shoulder],[0,-tip],[41,-shoulder],[41,shoulder],[0,tip],[-41,shoulder]];
export const graphicCell=([x,y])=>GRAPHIC_CELL.map(([dx,dy])=>[x+dx,y+dy]);
// Zero-area common boundaries belong to the lexicographically first axial pair.
// Pixel containment uses complete squares, so this tie can never authorize a
// square straddling two different assets' footprints.
export function graphicOwner([x,y]){
 const r0=Math.floor(y/68),q0=Math.floor((x-41*y/68)/82),candidates=[];
 for(let r=r0-2;r<=r0+2;r++)for(let q=q0-2;q<=q0+2;q++)candidates.push({q,r,d:(x-82*q-41*r)**2+(y-68*r)**2});
 const min=Math.min(...candidates.map(c=>c.d));
 const owner=candidates.filter(c=>Math.abs(c.d-min)<1e-8).sort((a,b)=>a.q-b.q||a.r-b.r)[0];
 return [owner.q,owner.r];
}
// Every board position owns the same complete infinite-lattice graphic cell.
// Gameplay protection and frame transparency are separate display contracts.
export function boardGraphicCell(center){
 return [graphicCell(center)];
}
export const GRAPHIC_MAP_POLYGONS=HEXES.flatMap(h=>boardGraphicCell(h.center));
export function imageContract(cells){
 const errors=geometryErrors(cells);if(errors.length)throw Error(errors.join('; '));
 const centers=cells.map(([q,r])=>[82*q+41*r,68*r]);
 const center=[0,1].map(i=>centers.reduce((sum,c)=>sum+c[i]/centers.length,0));
 const polygons=centers.map(c=>graphicCell([c[0]-center[0],c[1]-center[1]]));
 const points=polygons.flat();
 const [width,height]=[0,1].map(i=>2*Math.ceil(Math.max(...points.map(p=>Math.abs(p[i])))+4));
 return {width,height,pixelWidth:width*PIXELS_PER_UNIT,pixelHeight:height*PIXELS_PER_UNIT,polygons};
}
// Translation changes neither the canvas nor its local permitted footprint.
// The only position constraint is that every occupied cell is on the board.
export function placementContract(asset,anchor){
 const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
 assetRectangle(asset,anchor,byId);
 return imageContract(asset.geometry.cells);
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
