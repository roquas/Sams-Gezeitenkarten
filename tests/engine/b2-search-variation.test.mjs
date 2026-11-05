import test from 'node:test';
import assert from 'node:assert/strict';
import {weakReductionSearch} from '../../scripts/lib/b2-search-variation.mjs';
import {SearchBudgetExceeded} from '../../scripts/lib/puzzle-route-solver.mjs';
import {validateComparison} from '../../scripts/run-b2-search-comparison.mjs';
const budgets={maxRestarts:3};
// Three weak clues are individually necessary together. A fourth is a shortcut.
const masks=[[0,1,2],[0,1,3],[0,2,3],[0]];
function run(){
 const accepted=[],calls=[];
 const solver={check(indices){calls.push([...indices]);return {count:[0,1,2,3].filter(r=>indices.every(i=>masks[i].includes(r))).length};}};
 const result=weakReductionSearch({clues:masks,solver,seed:42,budgets,window:8,onCandidate(indices){accepted.push([...indices].sort());return true;}});
 return {accepted,calls,result};
}
test('bounded alternatives avoid the shortcut, retain necessity, and replay exactly',()=>{
 const a=run();assert.deepEqual(a,run());assert.equal(a.result.restarts,3);
 assert.equal(a.result.reducedSets,3);assert.equal(a.result.failures.RESTART_BUDGET_EXHAUSTED,1);
 for(const indices of a.accepted)assert.deepEqual(indices,[0,1,2]);
});
test('budget exhaustion is reported and cannot accept an unproven candidate',()=>{
 let accepted=false;
 const result=weakReductionSearch({clues:masks,solver:{check(){throw new SearchBudgetExceeded('FILTER_BUDGET_EXHAUSTED');}},seed:42,budgets,
  onCandidate(){accepted=true;}});
 assert.equal(accepted,false);assert.equal(result.failures.FILTER_BUDGET_EXHAUSTED,1);assert.equal(result.exhaustive,false);
});
test('empty/no-progress pools and already unique backgrounds terminate',()=>{
 for(const count of [0,1,4]){
  const result=weakReductionSearch({clues:[],solver:{check:()=>({count})},seed:42,budgets,onCandidate:()=>true});
  assert.equal(result.exhaustive,count<2);
  if(count===4){assert.equal(result.failures.POOL_NOT_UNIQUE,3);assert.equal(result.reducedSets,0);}
 }
});
test('protocol rejects hidden knobs, duplicate arms and unlabelled strategies',()=>{
 const config={protocol:'b2-search-comparison-1',targets:['target'],arms:[{id:'A',strategy:'random-incremental-1',budgetMultiplier:1}]};
 assert.deepEqual(validateComparison(config),config);
 for(const change of [c=>c.arms.push(c.arms[0]),c=>c.arms[0].strategy='unknown',c=>c.arms[0].window=8,
  c=>c.targets.push('target'),c=>c.hidden=1,c=>c.arms[0].budgetMultiplier=11]){
  const c=structuredClone(config);change(c);assert.throws(()=>validateComparison(c));
 }
});
