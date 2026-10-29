import test from 'node:test';
import assert from 'node:assert/strict';
import {renderContactSvg} from '../../scripts/lib/map-contact-sheet.mjs';
import {HEXES,CHART_VIEWBOX} from '../../src/ui/chart-geometry.mjs';
import {CHART_ASSET_SPEC} from '../../src/ui/chart-asset-contract.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';

const object=(id,passable,...cells)=>({id,passable,cells});
const cases=[
 ['empty',[],[25,0,0]],
 ['passable single',[object('boat',true,'C3')],[24,1,0]],
 ['blocked single',[object('rock',false,'C3')],[24,0,1]],
 ['blocked multihex with an omitted interior cell',[object('island',false,'B2','C2','D2','D3','D4','C4','B4','B3')],[17,0,8]],
 ['edges, corners and both row parities',[object('island',false,'A1','A2','B2'),object('harbor',true,'E1'),object('wreck',false,'A5'),object('boat',true,'E5'),object('reef',false,'E2','E3')],[17,2,6]],
 ['mixed kinds and passable multihex',[object('harbor',true,'B2','C2'),object('island',false,'D4','E4','E5'),object('boat',true,'A5'),object('rock',false,'A1')],[18,3,4]],
];

for(const [name,objects,counts] of cases)test('geographic grid: '+name,()=>{
 const map=validateMap({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
 const before=structuredClone(map);
 // Deliberately no asset names, artwork or placements: only map data may
 // determine categories, including every stored cell of a multihex object.
 const row={index:0,decision:'accepted',assignment:{status:'complete',placements:[]},generation:{map}};
 const svg=renderContactSvg(row,{assets:[]},CHART_ASSET_SPEC,ref=>ref);
 const grid=svg.match(/<g data-chart-layer="geography"[^>]*>(.*?)<\/g>/s);
 assert.ok(grid);
 assert.match(grid[0],/display="none"/);assert.match(grid[0],/pointer-events="none"/);assert.match(grid[0],/fill="none"/);
 assert.match(svg,new RegExp('viewBox="'+CHART_VIEWBOX+'"'));
 assert.ok(svg.indexOf('data-chart-layer="frame"')<grid.index);
 assert.ok(!grid[0].includes('transform='));
 const polygons=[...grid[1].matchAll(/<polygon ([^>]+)>/g)].map(match=>Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]])));
 assert.equal(polygons.length,25);assert.equal(new Set(polygons.map(p=>p['data-cell'])).size,25);
 assert.deepEqual(['water','passable','blocked'].map(c=>polygons.filter(p=>p['data-category']===c).length),counts);
 assert.equal(counts.reduce((sum,n)=>sum+n),25);
 for(const hex of HEXES){
  const polygon=polygons.find(p=>p['data-cell']===hex.id),owner=objects.find(o=>o.cells.includes(hex.id));
  const category=owner?(owner.passable?'passable':'blocked'):'water';
  assert.equal(polygon['data-category'],category,hex.id);
  assert.equal(polygon.points,hex.polygon.map(p=>p.join(',')).join(' '),hex.id+' uses shared inner hex coordinates');
  assert.equal(polygon.stroke,{water:'#216b9b',passable:'#c56a16',blocked:'#851f2a'}[category]);
  assert.equal(polygon['stroke-dasharray'],category==='blocked'?'5 3':'none');
 }
 assert.deepEqual(map,before);
});
