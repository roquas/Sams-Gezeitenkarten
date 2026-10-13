import {createRules} from './puzzle.mjs';

// Uses the same route generator, hex geometry and predicates as the game.
// Never reads puzzle.solution. A budget failure is an error, not a uniqueness claim.
export function solvePuzzle(puzzle,{maxNodes=250000,metrics=true}={}){
 if(!Number.isSafeInteger(maxNodes)||maxNodes<1)throw Error('Ungültiges Suchbudget');
 const rules=createRules(puzzle),routes=[...rules.routes([puzzle.start],{remaining:maxNodes})];
 const matches=routes.map(route=>puzzle.clues.map(clue=>rules.matches(route,clue)));
 const solutions=routes.filter((_,i)=>matches[i].every(Boolean));
 const count=solutions.length;
 const result={status:count===0?'unsolvable':count===1?'unique':'ambiguous',count,solutions,legalRouteCount:routes.length};
 if(metrics){
  const remainingCandidates=puzzle.clues.map((clue,k)=>({clueId:clue.id,count:matches.filter(row=>row.slice(0,k+1).every(Boolean)).length}));
  const withoutClue=puzzle.clues.map((clue,k)=>({clueId:clue.id,count:matches.filter(row=>row.every((yes,j)=>j===k||yes)).length}));
  const forcedPositions=[];
  for(let hour=0;hour<=puzzle.steps;hour++)if(count&&solutions.every(route=>route[hour]===solutions[0][hour]))forcedPositions.push({hour,cell:solutions[0][hour]});
  const forcedEarlySteps=[];
  for(let hour=1;hour<=puzzle.steps;hour++){if(!forcedPositions.some(p=>p.hour===hour))break;forcedEarlySteps.push(solutions[0][hour]);}
  result.metrics={remainingCandidates,withoutClue,redundantClueIds:withoutClue.filter(c=>c.count===count).map(c=>c.clueId),forcedPositions,forcedEarlySteps,clueTypes:[...new Set(puzzle.clues.map(c=>c.type))],difficulty:{provisional:true,method:'log2(legal routes / solutions), enumeration only; not a human difficulty proof',score:count?Math.log2(Math.max(1,routes.length/count)):null},explanation:remainingCandidates.map(c=>`${c.clueId}: ${c.count} Routen erfüllen alle bisher geprüften Hinweise.`)};
 }
 return result;
}
