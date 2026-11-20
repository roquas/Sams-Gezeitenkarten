import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {routeSegments,routePoint,ribbon,directionContour} from '../../src/ui/route-ink.mjs';
import {hexCenter,hexVertices,containsPoint} from '../../src/ui/place-labels.mjs';

// Independent frozen output of the user-supplied study: catches accidental
// changes to B+ width/grain, K taper/direction and the arrival-side label point.
const reference=JSON.parse(readFileSync(new URL('../fixtures/ui/k-final-reference.json',import.meta.url)));
const byId=Object.fromEntries(Array.from({length:25},(_,i)=>{
 const q=i%5,r=Math.floor(i/5),id=String.fromCharCode(65+q)+(r+1);return [id,{id,q,r}];
}));
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const scene of reference.scenes)test(`K-final geometry reproduces the original ${scene.id} scene`,()=>{
 const segments=routeSegments(scene.route,byId);
 assert.equal(segments.length,scene.route.length-1);
 segments.forEach((g,i)=>{
  const expected=scene.segments[i];
  assert.equal(hash(ribbon(g)),expected.bandSha256);
  assert.equal(hash(directionContour(g)),expected.directionSha256);
  assert.deepEqual(routePoint(g,.72),expected.number);
  assert.equal(g.source,expected.source);assert.equal(g.id,expected.target);
  assert.deepEqual(routePoint(g,0),hexCenter(byId[g.source]));
  assert.deepEqual(routePoint(g,1),hexCenter(byId[g.id]));
  assert.ok(containsPoint(hexVertices(...g.b),routePoint(g,.72)));
 });
});
test('the K contour faces the actual destination in all six directions',()=>{
 for(const target of ['D3','C4','B4','B3','B2','C2']){
  const g=routeSegments(['C3',target],byId)[0];
  const contour=directionContour(g);
  const curves=[...contour.matchAll(/Q ([^QLZM]+)/g)];
  const frontCap=curves[47][1].trim().split(/\s+/).map(Number).slice(0,2);
  // Contour starts at the broad rear edge. The front cap's quadratic control
  // lies just beyond t=.9, strictly closer to the target than the source.
  const start=routePoint(g,.1),front=routePoint(g,.9);
  const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  assert.ok(distance(front,g.b)<distance(start,g.b));
  assert.ok(distance(front,g.b)<9);
  assert.ok(distance(frontCap,g.b)<distance(frontCap,g.a));
  assert.ok(distance(frontCap,g.b)<8);
  assert.equal(directionContour(g),directionContour(routeSegments(['C3',target],byId)[0]));
 }
 assert.deepEqual(routeSegments(['C3'],byId),[]);
});
