import test from 'node:test';
import assert from 'node:assert/strict';
import {GEOMETRY,RULES_VERSION} from '../../src/puzzles/schema.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {checkIrredundancy,analyzeDefinition} from '../../src/puzzles/analysis.mjs';
import {selectTargetRoute} from '../../scripts/lib/route-experiment.mjs';
import {generateTrueClues,clueKey} from '../../scripts/lib/puzzle-clues.mjs';
import {createRouteWorkspace,SearchBudgetExceeded} from '../../scripts/lib/puzzle-route-solver.mjs';
import {searchPuzzleCandidates,randomIncrementalSearch} from '../../scripts/lib/puzzle-candidate-search.mjs';

const map={geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'port',cells:['C3'],passable:true},{id:'rock',cells:['A1'],passable:false}]};
const logic={map,start:'C3',steps:6,clues:[]};
const target=selectTargetRoute(map,{start:'C3',routeIndex:25,maxNodes:100000}).route;
const pool=generateTrueClues(logic,target,{maxClueParameters:100000});
const budgets={maxRestarts:6,maxSolverChecks:2000,maxMatchEvaluations:5000000,maxRouteFilterEvaluations:20000000};
const workspace=createRouteWorkspace(logic,{maxNodes:100000});
const run=overrides=>searchPuzzleCandidates({logic,targetRoute:target,cluePool:pool,workspace,seed:42,budgets,...overrides});

test('all six clue families have valid parameters and are true by existing predicates; production does not mutate inputs',()=>{
 const before=structuredClone(logic),rules=createRules(logic);
 assert.equal(pool.completed,true);
 assert.deepEqual(Object.keys(pool.byType).sort(),['position','direction','turn','distanceToPlace','distanceBetweenHours','countDistanceToPlace'].sort());
 assert.ok(pool.clues.every(c=>rules.matches(target,c)));
 validateLogic({...logic,clues:pool.clues});
 assert.equal(new Set(pool.clues.map(clueKey)).size,pool.clues.length);
 assert.deepEqual(logic,before);
 assert.deepEqual(pool,generateTrueClues(logic,target,{maxClueParameters:100000}));
 for(const clue of pool.clues){
  if(clue.hours)assert.ok(clue.hours[0]<=clue.hours[1]);
  if(clue.type==='countDistanceToPlace')assert.ok(clue.count<=clue.toHour-clue.fromHour+1);
 }
});

test('successful variants for one target are independently unique, matching and irredundant',()=>{
 const result=run();assert.equal(result.status,'candidates-found');assert.ok(result.candidates.length>=3);
 assert.equal(new Set(result.candidates.map(c=>c.fingerprints.instance)).size,1);
 assert.equal(new Set(result.candidates.map(c=>c.fingerprints.variant)).size,result.candidates.length);
 for(const candidate of result.candidates){
  const independent=checkIrredundancy(candidate.definition,{detailed:true});
  assert.equal(independent.status,'unique');assert.equal(independent.target.status,'match');assert.equal(independent.irredundant,true);
  assert.deepEqual(independent.uniqueSolution,target);
  assert.deepEqual(candidate.proof.omissions.map(o=>o.count),independent.omissions.map(o=>o.count));
 }
 assert.ok(result.search.cacheHits>0);assert.ok(result.search.matchEvaluations<result.search.solverChecks*workspace.routeCount*pool.clues.length);
});

test('seeded runs include stable proofs, properties, variants, counters and budget termination',()=>{
 assert.deepEqual(run(),run());
 assert.notDeepEqual(run({seed:43}).candidates.map(c=>c.fingerprints.variant),run().candidates.map(c=>c.fingerprints.variant));
 const result=run();assert.equal(result.search.restarts,budgets.maxRestarts);assert.equal(result.search.incomplete,true);
 assert.equal(result.search.failures.RESTART_BUDGET_EXHAUSTED,1);
});

test('clue production and each solver work budget stop cleanly without unproven candidates',()=>{
 const tiny=generateTrueClues(logic,target,{maxClueParameters:6});assert.equal(tiny.parametersExamined,6);assert.equal(tiny.completed,false);
 for(const [key,reason] of [['maxSolverChecks','SOLVER_BUDGET_EXHAUSTED'],['maxMatchEvaluations','MATCH_BUDGET_EXHAUSTED'],['maxRouteFilterEvaluations','FILTER_BUDGET_EXHAUSTED']]){
  const result=run({budgets:{...budgets,[key]:1}});
  assert.equal(result.status,'not-found-within-budget');assert.deepEqual(result.candidates,[]);
  assert.equal(result.search.failures[reason],1);assert.equal(result.search.incomplete,true);
 }
 const partial=createRouteWorkspace(logic,{maxNodes:1});assert.equal(partial.completed,false);assert.equal(partial.nodesVisited,1);
 assert.throws(()=>run({workspace:partial}),/Complete/);
});

test('an insufficient clue pool records an unsuccessful budget-limited search, never impossibility',()=>{
 const result=run({cluePool:{clues:[],parametersExamined:1,completed:false}});
 assert.equal(result.status,'not-found-within-budget');assert.equal(result.search.failures.POOL_NOT_UNIQUE,budgets.maxRestarts);
 assert.equal(result.search.solverChecks,1);assert.equal(result.candidates.length,0);
});

test('individually exact hours agree with solving each clue alone and exclude combined deductions',()=>{
 const candidates=run().candidates;let combined=0;
 for(const candidate of candidates){
  for(let i=0;i<candidate.definition.logic.clues.length;i++){
   const clue=candidate.definition.logic.clues[i];
   const independent=analyzeDefinition({...candidate.definition,logic:{...logic,clues:[clue]}},{detailed:true});
   const forced=Array.from({length:6},(_,h)=>h+1).filter(hour=>independent.solutions.every(r=>r[hour]===target[hour]));
   assert.deepEqual(candidate.properties.individualExactness[i].hours,forced);
  }
  if(!candidate.properties.individualExactness.some(row=>row.hours.includes(6)))combined++;
 }
 assert.ok(combined>0,'at least one final position is forced only by combined clues');
});

test('cached subset solver agrees with public solver; permutation and duplicate indices share a single check',()=>{
 const clues=pool.clues.filter(c=>c.type==='direction').slice(0,3),solver=workspace.forClues(clues,budgets);
 for(const indices of [[],[0],[1,2],[0,1,2]]){
  const exact=analyzeDefinition({schemaVersion:2,rulesVersion:RULES_VERSION,dataVersion:1,logic:{...logic,clues:indices.map(i=>clues[i])}},{detailed:true});
  const result=solver.check(indices);assert.equal(result.count,exact.count);
  assert.deepEqual(result.uniqueSolution,exact.uniqueSolution);
 }
 const before=solver.metrics.solverChecks;solver.check([2,0,1,0]);assert.equal(solver.metrics.solverChecks,before);
 assert.throws(()=>workspace.forClues([clues[0],{...clues[0],id:'duplicate'}],budgets),/Duplicate/);
 const limited=workspace.forClues(clues,{...budgets,maxSolverChecks:1});limited.check([]);assert.throws(()=>limited.check([0]),SearchBudgetExceeded);
});

test('sequential removal retains distinct minimal alternatives for different randomized orders',()=>{
 // Synthetic solver interface, with two independent minimal solutions AB / CD.
 // This tests the replaceable search policy without reimplementing game rules.
 const found=new Set();
 const solver={check(indices){const set=new Set(indices);return {count:set.has(0)&&set.has(1)||set.has(2)&&set.has(3)?1:5-set.size};}};
 randomIncrementalSearch({clues:[0,1,2,3],solver,seed:9,budgets:{...budgets,maxRestarts:40},onCandidate(indices){found.add([...indices].sort().join(''));return true;}});
 assert.ok(found.has('01'));assert.ok(found.has('23'));
});

test('invalid budgets and routes do not silently alter engine contracts or route lengths',()=>{
 for(const changes of [{seed:-1},{budgets:{...budgets,maxRestarts:0}},{budgets:{...budgets,other:1}}])assert.throws(()=>run(changes));
 assert.throws(()=>generateTrueClues({...logic,steps:5},target,{maxClueParameters:100}));
 assert.throws(()=>generateTrueClues(logic,[...target].reverse(),{maxClueParameters:100}));
 assert.throws(()=>createRouteWorkspace(logic,{maxNodes:0}));
 const short={...logic,steps:1,clues:[{id:'p',type:'position',hour:1,cell:'D3'}]};validateLogic(short);
 assert.equal(analyzeDefinition({schemaVersion:2,rulesVersion:RULES_VERSION,dataVersion:1,logic:short}).status,'unique');
});
