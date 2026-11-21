import test from 'node:test';
import assert from 'node:assert/strict';
import {hexCenter,placeLabelLayout,labelFootprint,parchmentPath} from '../../src/ui/place-labels.mjs';
import {CHART_BOUNDS,HEXES} from '../../src/ui/chart-geometry.mjs';
const byId=Object.fromEntries(HEXES.map(c=>[c.id,c]));
test('temporary plaques include passable single hexes and the full multihex centroid',()=>{
 for(const ids of [['C1'],['D4'],['B3','C3'],['E2','B3','C3','C1']]){
  const p=placeLabelLayout(ids,'Roberts Boot',byId,CHART_BOUNDS);
  assert.deepEqual(p.cells,ids);
  const center=ids.reduce((a,id)=>hexCenter(byId[id]).map((v,i)=>a[i]+v/ids.length),[0,0]);
  assert.deepEqual(p.centroid,center);assert.deepEqual([p.x,p.y],center);
  assert.equal(p.fontSize,18);assert.equal(p.height,28);assert.ok(p.width>66);
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
test('organic edges add waves at longer widths instead of stretching their amplitude',()=>{
 for(const width of [66,140,520]){
  const d=parchmentPath(width,28);
  assert.ok(d.endsWith(' Z'));assert.equal((d.match(/ Q /g)||[]).length,2*Math.ceil((width-12)/24));
  assert.ok(!d.includes('NaN'));
 }
});
