import {randomStream,validateSeed} from '../../src/generation/random.mjs';
import {logicalFingerprints} from './publication-archive.mjs';
import {SearchBudgetExceeded} from './puzzle-route-solver.mjs';
import {clueKey} from './puzzle-clues.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';

export const SEARCH_STRATEGY='random-incremental-1';
export const SEARCH_LIMITS={maxRestarts:10000,maxSolverChecks:100000,maxMatchEvaluations:100000000,maxRouteFilterEvaluations:100000000};
export function validateSearchBudgets(budgets){
 if(!budgets||Object.keys(budgets).length!==Object.keys(SEARCH_LIMITS).length)throw Error('Explicit search budgets required');
 for(const [key,limit] of Object.entries(SEARCH_LIMITS))if(!Number.isSafeInteger(budgets[key])||budgets[key]<1||budgets[key]>limit)throw Error('Invalid '+key);
 return {...budgets};
}
function shuffle(values,random){
 const result=[...values];for(let i=result.length-1;i>0;i--){const j=random.integer(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;
}
const sameRoute=(a,b)=>a&&a.length===b.length&&a.every((cell,i)=>cell===b[i]);

// The strategy receives only clues and a solver interface. Another small
// strategy function can replace it without changing production or diagnostics.
export function randomIncrementalSearch({clues,solver,seed,budgets,onCandidate}){
 const failures={};let restarts=0,reducedSets=0;
 const add=reason=>{failures[reason]=(failures[reason]??0)+1;};
 try{
  const empty=solver.check([]);
  if(!empty.count)return {restarts,reducedSets,failures:{NO_LEGAL_ROUTE:1},exhaustive:true};
  for(;restarts<budgets.maxRestarts;){
   const attempt=restarts++,random=randomStream(seed,SEARCH_STRATEGY+'/'+attempt);
   const order=shuffle(clues.map((_,i)=>i),random);let selected=[],current=empty;
   // Only retain a clue if the solver says it removes a surviving route.
   // No ranking by individual strength or editorial preferences.
   for(const index of order){
    if(current.count===1)break;
    const result=solver.check([...selected,index]);
    if(result.count<current.count){selected.push(index);current=result;}else add('NO_PROGRESS');
   }
   if(current.count!==1){add('POOL_NOT_UNIQUE');continue;}
   // Sequential deletion matters: after every deletion the next omission is
   // checked against the reduced set. Independent random deletion orders can
   // therefore lead to different minimal sets.
   for(const index of shuffle(selected,random)){
    const reduced=selected.filter(i=>i!==index);
    if(solver.check(reduced).count===1)selected=reduced;
   }
   reducedSets++;
   if(!onCandidate(selected,solver))add('DUPLICATE_VARIANT');
   if(empty.count===1)return {restarts,reducedSets,failures,exhaustive:true};
  }
  add('RESTART_BUDGET_EXHAUSTED');
 }catch(error){if(!(error instanceof SearchBudgetExceeded))throw error;add(error.reason);}
 return {restarts,reducedSets,failures,exhaustive:false};
}

export function searchPuzzleCandidates({logic,targetRoute,cluePool,workspace,seed,budgets,
 strategy=randomIncrementalSearch}){
 validateSeed(seed);validateSearchBudgets(budgets);
 if(!workspace.completed)throw Error('Complete route workspace required');
 const solver=workspace.forClues(cluePool.clues,budgets),candidates=[],variants=new Set();
 const search=strategy({clues:cluePool.clues,solver,seed,budgets,onCandidate(indices){
  const ordered=[...indices].sort((a,b)=>{const x=clueKey(cluePool.clues[a]),y=clueKey(cluePool.clues[b]);return x<y?-1:x>y?1:0;});
  const result=solver.check(ordered);
  if(result.count!==1||!sameRoute(result.uniqueSolution,targetRoute))throw Error('Candidate target mismatch');
  const definition={schemaVersion:2,rulesVersion:RULES_VERSION,dataVersion:1,
   logic:{...logic,clues:ordered.map((index,i)=>({...cluePool.clues[index],id:'H'+(i+1)}))},solution:[...targetRoute]};
  const fingerprints=logicalFingerprints(definition);
  if(variants.has(fingerprints.variant))return false;
  const omissions=ordered.map((index,i)=>{
   const omitted=solver.check(ordered.filter(n=>n!==index));
   if(omitted.count<2)throw Error('Candidate is redundant');
   return {clueId:'H'+(i+1),count:omitted.count,countExact:true,necessary:true};
  });
  const individualExactness=ordered.map((index,i)=>({clueId:'H'+(i+1),hours:solver.exactHours(index)}));
  const exactClues=individualExactness.filter(row=>row.hours.length);
  candidates.push({definition,fingerprints,proof:{method:'complete-engine-routes-and-predicates-1',
   legalRouteCount:workspace.routeCount,count:1,countExact:true,uniqueSolution:result.uniqueSolution,
   targetMatch:true,irredundant:true,omissions},properties:{clueTypes:[...new Set(definition.logic.clues.map(c=>c.type))],
   individualExactness,individuallyExactClueCount:exactClues.length,
   hasIndividuallyExactHour1:exactClues.some(row=>row.hours.includes(1)),
   hasDirectionHour1:definition.logic.clues.some(c=>c.type==='direction'&&c.hour===1)}});
  variants.add(fingerprints.variant);return true;
 }});
 if(!cluePool.completed)search.failures.CLUE_PARAMETER_BUDGET_EXHAUSTED=1;
 return {status:candidates.length?'candidates-found':search.exhaustive?'impossible':'not-found-within-budget',
  candidates,search:{...search,...solver.metrics,clueCandidates:cluePool.clues.length,
   clueParametersExamined:cluePool.parametersExamined,clueGenerationCompleted:cluePool.completed,
   incomplete:!search.exhaustive||!cluePool.completed}};
}
