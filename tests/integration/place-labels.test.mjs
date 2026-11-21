import test from 'node:test';
import assert from 'node:assert/strict';
import {hexCenter,containsPoint,placeLabelLayout,labelFootprint,startLabelLayout} from '../../src/ui/place-labels.mjs';
import {CHART_BOUNDS,HEXES} from '../../src/ui/chart-geometry.mjs';
const byId=Object.fromEntries(HEXES.map(c=>[c.id,c]));
test('temporary plaques include passable single hexes and the full multihex centroid',()=>{
 for(const ids of [['C1'],['D4'],['B3','C3'],['E2','B3','C3','C1']]){
  const p=placeLabelLayout(ids,'Roberts Boot',byId,CHART_BOUNDS);
  assert.deepEqual(p.cells,ids);
  const center=ids.reduce((a,id)=>hexCenter(byId[id]).map((v,i)=>a[i]+v/ids.length),[0,0]);
  assert.deepEqual(p.centroid,center);assert.deepEqual([p.x,p.y],center);
  assert.equal(p.fontSize,22);assert.equal(p.height,34);assert.ok(p.width>92);
 }
 assert.equal(placeLabelLayout([],'No place',byId,CHART_BOUNDS),null);
});
test('even long names at all chart edges stay within the visible chart',()=>{
 for(const cell of HEXES)for(const name of ['Kiste','Ein außergewöhnlich langer redaktioneller Ortsname']){
  const p=placeLabelLayout([cell.id],name,byId,CHART_BOUNDS);
  for(const [x,y] of labelFootprint(p,p.margin)){
   assert.ok(x>=CHART_BOUNDS.x&&x<=CHART_BOUNDS.x+CHART_BOUNDS.width);
   assert.ok(y>=CHART_BOUNDS.y&&y<=CHART_BOUNDS.y+CHART_BOUNDS.height);
  }
 }
});
test('start plaque retains dimensions and sits safely in the lower part of its hex',()=>{
 const p=startLabelLayout(byId.D4);
 assert.equal(p.x,hexCenter(byId.D4)[0]);assert.equal(p.height,18);assert.equal(p.fontSize,13);
 assert.ok(p.y>hexCenter(byId.D4)[1]+8);assert.ok(p.y<hexCenter(byId.D4)[1]+18);
 assert.ok(labelFootprint(p,4).every(v=>containsPoint(p.polygon,v)));
});
