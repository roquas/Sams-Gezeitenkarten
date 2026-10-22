import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GRAPHIC_CELL,GRAPHIC_MAP_POLYGONS,GRAPHIC_SAFETY,graphicCell,graphicOwner,imageContract,placementContract,assetRectangle,neighbors} from '../../src/assets/geometry.mjs';
import {polygonArea,intersectConvex,triangulate} from '../../src/assets/polygons.mjs';
import {HEXES,pointInPolygon} from '../../src/ui/chart-geometry.mjs';
import {containsPoint} from '../../src/ui/place-labels.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const forms=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[1,1]]];

test('Voronoi bisectors use the stretched infinite lattice; cells tile without positive-area overlaps',()=>{
 close(polygonArea(GRAPHIC_CELL),82*68);
 assert.equal(GRAPHIC_CELL[1][1],-(41**2+68**2)/(2*68));
 for(const [q,r] of neighbors){
  const c=graphicCell([82*q+41*r,68*r]);
  close(polygonArea(intersectConvex(GRAPHIC_CELL,c)),0);
  // All six logical neighbours share an entire edge, not just a vertex.
  assert.equal(c.filter(p=>GRAPHIC_CELL.some(v=>Math.hypot(p[0]-v[0],p[1]-v[1])<1e-8)).length,2);
 }
 const centers=[];for(let r=-4;r<=4;r++)for(let q=-4;q<=4;q++)centers.push([82*q+41*r,68*r]);
 // Off-boundary samples have exactly one owner, also compared to nearest-center
 // distances rather than reusing the bisector implementation as an oracle.
 for(let y=-100.123;y<100;y+=3.37)for(let x=-100.234;x<100;x+=3.91){
  const owners=centers.filter(c=>containsPoint(graphicCell(c),[x,y]));assert.equal(owners.length,1);
  close(Math.hypot(x-owners[0][0],y-owners[0][1]),Math.min(...centers.map(c=>Math.hypot(x-c[0],y-c[1]))));
 }
});
test('shared edges and vertices have one canonical axial owner regardless of enumeration order',()=>{
 assert.deepEqual(graphicOwner([41,0]),[0,0]);
 assert.deepEqual(graphicOwner([-41,0]),[-1,0]);
 assert.deepEqual(graphicOwner([20.5,34]),[0,0]);
 assert.deepEqual(graphicOwner(GRAPHIC_CELL[1]),[0,-1]);
 assert.deepEqual(graphicOwner([41+1e-4,0]),[1,0]);
});
test('four production canvases and centroid placement agree at both row parities',()=>{
 assert.deepEqual(forms.map(c=>{const s=imageContract(c);return [s.pixelWidth,s.pixelHeight];}),[[360,408],[688,408],[528,680],[912,768]]);
 for(const cells of forms)for(const anchor of ['B2','B3']){
  const asset={id:'test',geometry:{cells}},rect=assetRectangle(asset,anchor,byId),contract=imageContract(cells);
  close(rect.x+rect.width/2,rect.cells.reduce((s,id)=>s+byId[id].center[0]/cells.length,0));
  close(rect.y+rect.height/2,rect.cells.reduce((s,id)=>s+byId[id].center[1]/cells.length,0));
  for(let i=0;i<cells.length;i++)for(let j=0;j<6;j++){
   const actual=contract.polygons[i][j],expected=graphicCell(byId[rect.cells[i]].center)[j];
   close(actual[0]+rect.x+rect.width/2,expected[0]);close(actual[1]+rect.y+rect.height/2,expected[1]);
  }
 }
});
test('concave shapes and enclosed omissions remain unions, never a hull or a bounding rectangle',()=>{
 const ring=[[0,0],[1,-1],[2,-1],[2,0],[1,1],[0,1]],contract=imageContract(ring);
 close(contract.polygons.reduce((sum,p)=>sum+polygonArea(p),0),ring.length*82*68);
 const center=ring.reduce((s,[q,r])=>[s[0]+(82*q+41*r)/6,s[1]+68*r/6],[0,0]);
 assert.ok(!contract.polygons.some(p=>containsPoint(p,[82-center[0],-center[1]])));
 const asymmetric=imageContract(forms[3]);
 assert.equal(asymmetric.polygons.length,3);
 // Three unequal center distances preclude reflection or rotational symmetry.
 const centers=assetRectangle({id:'asymmetric',geometry:{cells:forms[3]}},'B2',byId).cells.map(id=>byId[id].center);
 const distances=centers.map((a,i)=>Math.hypot(a[0]-centers[(i+1)%3][0],a[1]-centers[(i+1)%3][1]));
 assert.equal(new Set(distances).size,3);
 const points=asymmetric.polygons.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 assert.ok(Math.abs(Math.min(...xs)+Math.max(...xs))>1);
 assert.ok(Math.abs(Math.min(...ys)+Math.max(...ys))>1);
});
test('board cells retain the full-raster bisectors and the pre-existing geometric safety area',()=>{
 const triangles=triangulate(GRAPHIC_SAFETY);
 close(triangles.reduce((s,p)=>s+polygonArea(p),0),polygonArea(GRAPHIC_SAFETY));
 const boardArea=HEXES.reduce((s,h)=>s+triangles.reduce((a,t)=>a+polygonArea(intersectConvex(graphicCell(h.center),t)),0),0);
 close(GRAPHIC_MAP_POLYGONS.reduce((s,p)=>s+polygonArea(p),0),boardArea);
 for(const polygon of GRAPHIC_MAP_POLYGONS)for(const p of polygon){
  assert.ok(triangles.some(t=>containsPoint(t,p)));
  assert.ok(HEXES.some(h=>containsPoint(graphicCell(h.center),p)));
 }
 // Preserve the legacy 8-unit protection, even where full Voronoi tips extend.
 assert.ok(!pointInPolygon([60,10],GRAPHIC_SAFETY));
 const a={id:'single',geometry:{cells:forms[0]}};
 close(placementContract(a,'C3').polygons.reduce((s,p)=>s+polygonArea(p),0),82*68);
 assert.ok(placementContract(a,'A1').polygons.reduce((s,p)=>s+polygonArea(p),0)<82*68);
 // Complete board partition has no positive area shared by different cell IDs.
 for(let i=0;i<HEXES.length;i++)for(let j=0;j<i;j++){
  close(polygonArea(intersectConvex(graphicCell(HEXES[i].center),graphicCell(HEXES[j].center))),0);
 }
});
test('gallery deterministically covers both one-based row parities and all feasible edge/interior categories',()=>{
 for(const cells of [...forms,[[0,0],[-1,0]],[[0,0],[0,-1]],[[0,0],[-1,0],[0,-1]]]){
  const asset={geometry:{cells}},positions=reviewPositions(asset);
  assert.deepEqual(positions,reviewPositions(asset));
  assert.deepEqual(positions.map(p=>p.parity+'/'+p.location),['ungerade/Rand','ungerade/Innen','gerade/Rand','gerade/Innen']);
  for(const p of positions){assert.ok(p.cells.every(c=>byId[c]));assert.equal(Number(p.anchor.slice(1))%2,p.parity==='gerade'?0:1);}
 }
 const large={geometry:{cells:HEXES.map(h=>[h.q-Math.floor(h.r/2),h.r])}};
 assert.equal(reviewPositions(large).length,1); // impossible categories are omitted
});
test('technical template contracts match the browser contract',()=>{
 for(const [i,name] of ['single','double-east','double-diagonal','triple-asymmetric'].entries()){
  const json=JSON.parse(fs.readFileSync(new URL('../../docs/asset-templates/'+name+'.json',import.meta.url)));
  assert.deepEqual(json,{cells:forms[i],...imageContract(forms[i])});
 }
});
