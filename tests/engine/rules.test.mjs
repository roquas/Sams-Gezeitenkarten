import test from 'node:test';
import assert from 'node:assert/strict';
import {axial,cellsOf,adjacent,distance,direction,directions} from '../../src/engine/hex.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {validateLogic,validateMap} from '../../src/engine/validate.mjs';
import {logic,map} from '../fixtures/model/factories.mjs';

test('hex vectors and all board pairs agree with an independent offset-neighbour BFS',()=>{
 assert.deepEqual(axial('B2'),[1,1]);assert.deepEqual(axial('B3'),[0,2]);
 const board=cellsOf(map().grid);
 const neighbours=id=>{const x=id.charCodeAt(0)-65,y=Number(id.slice(1))-1;
  const offsets=y%2?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]];
  return offsets.map(([dx,dy])=>String.fromCharCode(65+x+dx)+(y+dy+1)).filter(c=>board.includes(c));};
 for(const a of board){const distances=new Map([[a,0]]),queue=[a];
  for(let i=0;i<queue.length;i++)for(const b of neighbours(queue[i]))if(!distances.has(b)){distances.set(b,distances.get(queue[i])+1);queue.push(b);}
  for(const b of board){assert.equal(distance(a,b),distances.get(b),a+' '+b);assert.equal(adjacent(a,b),neighbours(a).includes(b));assert.equal(distance(a,b),distance(b,a));}
 }
 assert.equal(direction('C3','C3'),null);assert.equal(direction('A1','E5'),null);
});
test('routes derive blocked cells from objects and permit every cell of a multi-cell passable object',()=>{
 const l=logic(),r=createRules(l);validateLogic(l);
 assert.deepEqual([...r.blocked].sort(),['B2','C2']);assert.ok(r.legal(['C3','D3']));
 for(const bad of [null,[],['C3'],['D3','C3'],['C3','C3'],['C3','C2'],['C3','A1'],['C3','Z9']])assert.equal(r.legal(bad),false);
 for(const path of r.routes())assert.ok(r.legal(path));
 l.map.objects.find(o=>o.id==='port').passable=false;
 assert.equal(createRules(l).legal(['C3','D3']),false);assert.throws(()=>validateLogic(l),/start/);
});
test('minimum distance replaces existence semantics for passable and blocked footprints',()=>{
 const l=logic(),r=createRules(l),route=['C3','D3'];
 assert.equal(r.distanceToPlace('A1','shore'),2);
 assert.equal(distance('A1','C2'),3); // The former existential predicate accepted this too.
 assert.equal(r.matches(['A1','B1'],{type:'distanceToPlace',hour:0,placeId:'shore',distance:3}),false);
 assert.equal(r.matches(['A1','B1'],{type:'distanceToPlace',hour:0,placeId:'shore',distance:2}),true);
 for(const hour of [0,1])assert.ok(r.matches(route,{type:'distanceToPlace',hour,placeId:'port',distance:0}));
 l.map.objects.find(o=>o.id==='shore').passable=true;
 assert.equal(createRules(l).distanceToPlace('A1','shore'),2);
 assert.throws(()=>r.distanceToPlace('A1','unknown'),/Unknown object/);
});
test('countDistanceToPlace counts inclusive hours once, supports zero distance and zero counts',()=>{
 const l=logic();l.steps=3;l.start='A3';l.map.objects=[{id:'port',cells:['A3','B3','C3'],passable:true}];
 const r=createRules(l),route=['A3','B3','C3','D3'];
 const c={type:'countDistanceToPlace',fromHour:0,toHour:3,placeId:'port',distance:0,count:3};
 assert.ok(r.matches(route,c));assert.equal(r.matches(route,{...c,count:4}),false);
 assert.ok(r.matches(route,{...c,fromHour:2,toHour:2,count:1}));
 assert.ok(r.matches(route,{...c,distance:1,count:1}));
 assert.ok(r.matches(route,{...c,distance:2,count:0}));
 assert.ok(r.matches(route,{...c,fromHour:3,toHour:3,distance:1,count:1}));
});
test('position, direction, turn signs and wraparound, and hour distances retain their meaning',()=>{
 const r=createRules(logic());
 const pairs={E:['C3','D3'],SE:['C3','C4'],SW:['C3','B4'],W:['C3','B3'],NW:['C3','B2'],NE:['C3','C2']};
 for(const [d,route] of Object.entries(pairs)){assert.equal(direction(...route),d);assert.ok(r.matches(route,{type:'direction',hour:1,direction:d}));}
 assert.ok(r.matches(['C3','D3'],{type:'position',hour:0,cell:'C3'}));
 assert.ok(r.matches(['C3','D3'],{type:'distanceBetweenHours',hours:[1,1],distance:0}));
 for(const degrees of [-180,-120,-60,0,60,120,180]){
  const before='E',after=directions[(degrees/60+6)%6];
  const vectors={E:[1,0],SE:[0,1],SW:[-1,1],W:[-1,0],NW:[0,-1],NE:[1,-1]};
  const [dq,dr]=vectors[after],[q,y]=axial('C3'),row=y+dr,target=String.fromCharCode(65+q+dq+Math.floor(row/2))+(row+1);
  assert.ok(r.matches(['B3','C3',target],{type:'turn',hour:2,degrees}),before+' '+after);
 }
 assert.ok(r.matches(['B4','C3','D3'],{type:'turn',hour:2,degrees:60}));
 assert.throws(()=>r.matches(['C3','D3'],{type:'adjacentToPlace'}),/Unsupported/);
 assert.throws(()=>r.matches(['C3','D3'],{type:'countAdjacentToPlace'}),/Unsupported/);
});
test('solver independently finds unique, ambiguous and impossible cases and fails on exhausted budgets',()=>{
 const l=logic(),unique=solvePuzzle(l);assert.equal(unique.status,'unique');assert.deepEqual(unique.solutions,[['C3','D3']]);
 l.clues=[];assert.equal(solvePuzzle(l).status,'ambiguous');
 l.clues=[{id:'bad',type:'position',hour:1,cell:'C3'}];assert.equal(solvePuzzle(l).status,'unsolvable');
 for(const maxNodes of [0,-1,1.5,NaN])assert.throws(()=>solvePuzzle(l,{maxNodes}),/budget/i);
 assert.throws(()=>solvePuzzle(l,{maxNodes:1}),/Suchbudget/);
});
test('solver applies both new distance operators directly, including multi-cell distance zero',()=>{
 const l=logic();
 for(const clue of [
  {id:'D',type:'distanceToPlace',hour:1,placeId:'port',distance:0},
  {id:'C',type:'countDistanceToPlace',fromHour:0,toHour:1,placeId:'port',distance:0,count:2}
 ]){l.clues=[clue];validateLogic(l);const solved=solvePuzzle(l);assert.equal(solved.status,'unique');assert.deepEqual(solved.solutions,[['C3','D3']]);}
});
