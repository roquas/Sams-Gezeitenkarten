import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinateMarkup,coordinateTextMarkup,pretty} from '../../src/ui/coordinates.mjs';
import {distanceState,parchmentTiles,MARGIN_COLUMNS,MARGIN_ROWS,parchmentHeading,PARCHMENT_PROFILES} from '../../src/ui/chart-art.mjs';
test('all 25 coordinates share badges and a full accessible name',()=>{
 for(const col of 'ABCDE')for(let row=1;row<=5;row++){
  const id=col+row,markup=coordinateMarkup(id);
  assert.ok(markup.includes(`aria-label="${pretty(id)}"`));assert.ok(markup.includes(`data-coordinate="${id}"`));
  assert.equal(coordinateTextMarkup(pretty(id)),markup);assert.equal(coordinateTextMarkup(id),markup);
 }
 assert.equal(coordinateMarkup('<script>'),'');
 assert.equal(coordinateTextMarkup('Stunde 5, genau 60° und Tesoro.'),'Stunde 5, genau 60° und Tesoro.');
 assert.equal(coordinateTextMarkup('γ / V'),coordinateMarkup('C3'));
});
test('distance presentation distinguishes disabled, awaiting and selected without changing state',()=>{
 for(const [s,want] of [[{distanceMode:false,distanceOrigin:null},'inactive'],[{distanceMode:true,distanceOrigin:null},'waiting'],[{distanceMode:true,distanceOrigin:'C1'},'showing']]){
  const original=structuredClone(s);assert.equal(distanceState(s),want);assert.deepEqual(s,original);
 }
});
test('coordinate badges have parchment clearance from outer and inner slice boundaries',()=>{
 const tiles=parchmentTiles(),left=tiles[0],right=tiles[2],top=tiles[0],bottom=tiles[6];
 for(const [position,tile] of [[MARGIN_ROWS[0],left],[MARGIN_ROWS[1],right]]){
  assert.ok(position-13>tile.x+8);assert.ok(position+13<tile.x+tile.width-8);
 }
 for(const [position,tile] of [[MARGIN_COLUMNS[0],top],[MARGIN_COLUMNS[1],bottom]]){
  assert.ok(position-12>tile.y+8);assert.ok(position+12<tile.y+tile.height-8);
 }
});

test('each margin heading is centered between the visible painted edge and water',()=>{
 for(const side of Object.keys(PARCHMENT_PROFILES))for(let i=0;i<5;i++){
  const p=parchmentHeading(side,i);assert.equal(p.center,(p.outer+p.inner)/2);
  assert.ok(Math.abs(p.center-p.outer)>14);assert.ok(Math.abs(p.center-p.inner)>14);
 }
 assert.notEqual(parchmentHeading('left',0).center,parchmentHeading('left',1).center);
});
