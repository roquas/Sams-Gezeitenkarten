import {axial} from '../src/engine/hex.mjs';
import {neighbors,placedCells} from '../src/assets/geometry.mjs';
import {HEXES} from '../src/ui/chart-geometry.mjs';

// Row numbers in the UI are one-based. Cover each available parity/location
// combination rather than choosing three indices of a row-major list.
export function reviewPositions(asset){
 const board=new Set(HEXES.map(h=>h.id));
 const lattice=new Set(HEXES.map(h=>axial(h.id).join(',')));
 const candidates=HEXES.flatMap(h=>{
  const cells=placedCells(asset,h.id);
  if(!cells.every(id=>board.has(id)))return [];
  const edge=cells.some(id=>{const [q,r]=axial(id);return neighbors.some(([dq,dr])=>!lattice.has([q+dq,r+dr].join(',')));});
  return [{anchor:h.id,cells,parity:(h.r+1)%2?'ungerade':'gerade',location:edge?'Rand':'Innen'}];
 });
 return ['ungerade','gerade'].flatMap(parity=>['Rand','Innen'].flatMap(location=>{
  const p=candidates.find(p=>p.parity===parity&&p.location===location);return p?[p]:[];
 }));
}
