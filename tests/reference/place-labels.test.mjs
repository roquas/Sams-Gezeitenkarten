import test from 'node:test';
import assert from 'node:assert/strict';
import {referencePuzzle as puzzle} from '../../puzzles/reference-3.6.mjs';
import {hexCenter,hexVertices,containsPoint,placeLabelLayout} from '../../src/ui/place-labels.mjs';
const byId=Object.fromEntries(Array.from({length:25},(_,i)=>{const q=i%5,r=Math.floor(i/5),id='ABCDE'[q]+(r+1);return [id,{q,r,id}];}));
const blocked=new Set(puzzle.blocked);
test('place plaques stay inside actual blocked hexes and omit navigable places',()=>{
 assert.equal(placeLabelLayout(['C1'],'Leuchtturm',blocked,byId),null);
 assert.equal(placeLabelLayout(['D4'],'Start',blocked,byId),null);
 for(const [ids,text] of [[['E2'],'Klippen'],[['B3','C3'],'Tesoro']]){
  const p=placeLabelLayout(ids,text,blocked,byId);assert.ok(blocked.has(p.cell));
  assert.deepEqual([p.x,p.y],hexCenter(byId[p.cell]));assert.ok(p.width<55);assert.equal(p.height,18);
  for(const dx of [-p.width/2-4,p.width/2+4])for(const dy of [-p.height/2-4,p.height/2+4])assert.ok(containsPoint(p.polygon,[p.x+dx,p.y+dy]));
  for(const cell of Object.values(byId))if(!blocked.has(cell.id)){
   const polygon=hexVertices(...hexCenter(cell));
   for(let x=-p.width/2;x<=p.width/2;x+=2)for(let y=-p.height/2;y<=p.height/2;y+=2)assert.equal(containsPoint(polygon,[p.x+x,p.y+y]),false);
  }
 }
});
test('multipart place picks the connected land component rather than a water centroid',()=>{
 const p=placeLabelLayout(['E2','B3','C3','C1'],'Tesoro',blocked,byId);
 assert.deepEqual(p.cells,['B3','C3']);assert.equal(p.cell,'B3');
 const midpoint=[183,192];assert.equal(containsPoint(hexVertices(...hexCenter(byId.B3)),midpoint),false);
 assert.equal(containsPoint(hexVertices(...hexCenter(byId.C3)),midpoint),false);
 assert.notDeepEqual([p.x,p.y],midpoint);
});
