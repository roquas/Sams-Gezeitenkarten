import test from 'node:test';
import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {direction,directions,distance} from '../../src/engine/hex.mjs';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';
import {localDeduction} from '../../scripts/lib/b2-local-deduction.mjs';
import {clueSubsets,diagnosePuzzle,projectRoutes,assertLocalSound} from '../../scripts/lib/b2-deduction.mjs';

const base={map:{geometry:'even-row-offset-pointy-v1',grid:{columns:5,rows:5},objects:[
 {id:'port',cells:['A3'],passable:true},{id:'island',cells:['C2','D2'],passable:false}]},start:'A3',steps:6,clues:[]};

test('all pairs and triples are enumerated once, plus a separately labelled full control',()=>{
 assert.equal(clueSubsets(6).length,43);assert.equal(clueSubsets(7).length,65);
 assert.deepEqual(clueSubsets(0),[[]]);
 assert.deepEqual(clueSubsets(2),[[],[0],[1],[0,1]]);
 assert.equal(new Set(clueSubsets(7).map(JSON.stringify)).size,65);
 assert.throws(()=>clueSubsets(8),/at most seven/);
});

test('all current local forms preserve every solution, with replayable provenance',()=>{
 const rules=createRules(base),routes=[...rules.routes()];
 for(const index of [0,17,64,129,routes.length-1]){
  const route=routes[index];
  const before=directions.indexOf(direction(route[2],route[3])),after=directions.indexOf(direction(route[3],route[4]));
  const degrees=((after-before+6)%6)*60;
  const clues=[{id:'P',type:'position',hour:5,cell:route[5]},
   {id:'D',type:'distanceToPlace',hour:2,placeId:'island',distance:rules.distanceToPlace(route[2],'island')},
   {id:'C',type:'direction',hour:1,direction:direction(route[0],route[1])},
   {id:'T',type:'turn',hour:4,degrees:degrees>180?degrees-360:degrees},
   {id:'B',type:'distanceBetweenHours',hours:[1,6],distance:distance(route[1],route[6])},
   {id:'N',type:'countDistanceToPlace',fromHour:0,toHour:6,placeId:'island',distance:1,
    count:route.filter(c=>rules.distanceToPlace(c,'island')===1).length}];
  const logic={...base,clues};
  for(const indices of clueSubsets(clues.length)){
   const partial={...logic,clues:indices.map(i=>clues[i])},local=localDeduction(partial);
   const solutions=routes.filter(r=>partial.clues.every(c=>rules.matches(r,c)));
   assert.ok(solutions.length>0);assert.equal(local.status,'fixed-point');
   assertLocalSound(projectRoutes(solutions),local);verifyTrace(partial,local,solutions);
  }
 }
});

test('a necessary premise cannot be supplied by an unlinked earlier step or the full solution space',()=>{
 const local=localDeduction(base),solutions=solvePuzzle(base,{metrics:false}).solutions;
 verifyTrace(base,local,solutions);
 const broken=structuredClone(local),step=broken.trace.find(t=>t.rule==='no-revisit-singleton');
 const [necessary]=step.premises;
 assert.equal(step.premises.length,1);
 assert.ok(broken.trace.find(t=>t.id===necessary).fixed===base.start);
 // Keep every step and all before/after/excluded/fixed values; cut only the edge.
 step.premises=[];
 assert.ok(step.removed.every(c=>solutions.every(r=>r[step.hour]!==c)));
 assert.throws(()=>verifyTrace(base,broken,solutions),
  {code:'ERR_ASSERTION',message:new RegExp(`${step.id} .*reachable premises justify exclusions`)});
 // Restoring exactly that edge repairs the graph.
 step.premises=[necessary];verifyTrace(base,broken,solutions);
});

test('a necessary transitive restriction must reconstruct the recorded before state',()=>{
 const logic={...base,clues:[{id:'P',type:'position',hour:5,cell:'B3'}]};
 const local=localDeduction(logic),solutions=solvePuzzle(logic,{metrics:false}).solutions;
 assert.ok(solutions.length>0);verifyTrace(logic,local,solutions);
 const broken=structuredClone(local),step=broken.trace.find(t=>t.rule==='direct-hour');
 assert.equal(step.premises.length,1);
 const [necessary]=step.premises;step.premises=[];
 assert.throws(()=>verifyTrace(logic,broken,solutions),
  {code:'ERR_ASSERTION',message:new RegExp(`${step.id} .*reachable premises reconstruct before`)});
 step.premises=[necessary];verifyTrace(logic,broken,solutions);
});

test('zero/all residual count bounds include hour 0 and use fixed information',()=>{
 const count=(fromHour,toHour,count)=>({id:'N',type:'countDistanceToPlace',fromHour,toHour,placeId:'port',distance:0,count});
 const satisfiable={...base,clues:[count(0,2,1)]};
 const local=localDeduction(satisfiable);
 assert.ok(!local.domains[1].includes(base.start));
 verifyTrace(satisfiable,local,solvePuzzle(satisfiable,{metrics:false}).solutions);
 const contradictory={...base,clues:[count(0,0,0)]},impossible=localDeduction(contradictory);
 verifyTrace(contradictory,impossible,[]);
 assert.equal(impossible.status,'inconsistent');
 assert.deepEqual(impossible.fixedHours,[]);assert.deepEqual(impossible.fixedTransitions,[]);
 assert.ok(impossible.trace.some(t=>t.rule==='count-contradiction'));
 assert.ok(impossible.trace.filter(t=>!t.after.length).every(t=>t.fixed===null));
});

test('unknown is not excluded or fixed; contradiction is not a singleton',()=>{
 const local=localDeduction(base),rules=createRules(base);
 assert.deepEqual(local.fixedHours,[{hour:0,cell:base.start}]);
 assert.ok(local.domains[1].length>1);assert.ok(!local.domains[1].includes('C2'));
 assert.equal(rules.blocked.has('C2'),true);
 const exact=projectRoutes([]);
 assert.ok(exact.domains.every(d=>d.length===0));
 const sameHour={...base,clues:[{id:'S',type:'distanceBetweenHours',hours:[2,2],distance:0}]};
 assert.deepEqual(localDeduction(sameHour).domains,local.domains);
 assert.equal(localDeduction({...sameHour,clues:[{...sameHour.clues[0],distance:1}]}).status,'inconsistent');
});

test('unsupported local types are explicitly reported; exact analysis rejects them',()=>{
 const logic={...base,clues:[{id:'X',type:'future-clue'}]},local=localDeduction(logic);
 assert.deepEqual(local.unsupported,[{clueId:'X',type:'future-clue',reason:'Keine implementierte lokale Regel.'}]);
 assert.deepEqual(local.domains,localDeduction(base).domains);
 assert.throws(()=>diagnosePuzzle(logic));
});

test('diagnosis never reads a stored answer, mutates logic or seeds local domains from exact projections',()=>{
 const logic=structuredClone(base),before=JSON.stringify(logic);
 Object.defineProperty(logic,'solution',{get(){throw Error('Known answer read');}});
 const first=diagnosePuzzle(logic),second=diagnosePuzzle(logic);
 assert.equal(JSON.stringify(logic),before);assert.deepEqual(first,second);
 assert.deepEqual(first.scenarios[0].local.domains,localDeduction(base).domains.map(d=>[...d].sort()));
 assert.throws(()=>assertLocalSound({domains:[['A1']],transitions:[]},{domains:[[]],transitions:[]}),/Unsound/);
});
