// Private, per-start workspace. No global cache or changes to public solvers.
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {clueKey} from './puzzle-clues.mjs';

export class SearchBudgetExceeded extends Error{
 constructor(reason){super(reason);this.reason=reason;}
}
export function createRouteWorkspace(logic,{maxNodes}){
 validateLogic(logic);
 if(logic.steps!==6||logic.clues.length)throw Error('B2 requires six steps and no input clues');
 if(!Number.isSafeInteger(maxNodes)||maxNodes<1||maxNodes>1000000)throw Error('Invalid maxNodes');
 const rules=createRules(logic),budget={remaining:maxNodes},routes=[];
 try{for(const route of rules.routes([logic.start],budget))routes.push(route);}
 catch(error){if(budget.remaining>=0)throw error;
  return {completed:false,routeCountLowerBound:routes.length,nodesVisited:maxNodes};}
 return {completed:true,routeCount:routes.length,nodesVisited:maxNodes-budget.remaining,
  // Each target gets its own explicit matching/combination budget. Routes are
  // reused across targets, while target-specific clue tables stay short-lived.
  forClues(clues,{maxSolverChecks,maxMatchEvaluations,maxRouteFilterEvaluations}){
   validateLogic({...logic,clues});
   for(const n of [maxSolverChecks,maxMatchEvaluations,maxRouteFilterEvaluations])if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid solver budget');
   const masks=new Map(),cache=new Map();
   const metrics={solverChecks:0,cacheHits:0,matchEvaluations:0,routeFilterEvaluations:0};
   const keys=clues.map(clueKey);
   if(new Set(keys).size!==keys.length)throw Error('Duplicate clue parameters');
   function mask(index){
    if(!Number.isSafeInteger(index)||index<0||index>=clues.length)throw Error('Unknown clue index');
    if(masks.has(index))return masks.get(index);
    if(metrics.matchEvaluations+routes.length>maxMatchEvaluations)throw new SearchBudgetExceeded('MATCH_BUDGET_EXHAUSTED');
    const result=Uint8Array.from(routes,route=>Number(rules.matches(route,clues[index])));
    metrics.matchEvaluations+=routes.length;masks.set(index,result);return result;
   }
   function check(indices){
    const ordered=[...new Set(indices)].sort((a,b)=>a-b),key=ordered.join(',');
    if(cache.has(key)){metrics.cacheHits++;return cache.get(key);}
    if(metrics.solverChecks===maxSolverChecks)throw new SearchBudgetExceeded('SOLVER_BUDGET_EXHAUSTED');
    metrics.solverChecks++;
    const tables=ordered.map(mask);let count=0,uniqueSolution=null;
    for(let r=0;r<routes.length;r++){
     let yes=true;
     for(const table of tables){
      if(metrics.routeFilterEvaluations===maxRouteFilterEvaluations)throw new SearchBudgetExceeded('FILTER_BUDGET_EXHAUSTED');
      metrics.routeFilterEvaluations++;if(!table[r]){yes=false;break;}
     }
     if(yes){count++;uniqueSolution=count===1?[...routes[r]]:null;}
    }
    const result={count,uniqueSolution};
    cache.set(key,result);return result;
   }
   function exactHours(index){
    const result=check([index]);if(!result.count)return [];
    const table=mask(index),positions=Array.from({length:6},()=>new Set());
    for(let r=0;r<routes.length;r++)if(table[r])for(let h=1;h<=6;h++)positions[h-1].add(routes[r][h]);
    return positions.flatMap((cells,h)=>cells.size===1?[h+1]:[]);
   }
   return {check,exactHours,metrics};
  }};
}
