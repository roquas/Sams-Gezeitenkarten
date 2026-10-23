import {createRules} from '../engine/puzzle.mjs';
import {solvePuzzle} from '../engine/solver.mjs';
import {puzzleSchema,schemaErrors} from './schema.mjs';
import {validateLogicDefinition} from '../engine/validate.mjs';

const sameRoute=(a,b)=>a.length===b.length&&a.every((cell,i)=>cell===b[i]);
function targetDiagnosis(logic,targetRoute,result){
 if(targetRoute===undefined)return {status:'absent',errors:[]};
 const errors=schemaErrors(targetRoute,puzzleSchema.properties.solution,'$.solution');
 const rules=createRules(logic);
 if(!errors.length&&!rules.legal(targetRoute))errors.push('target route is not legal');
 if(errors.length)return {status:'invalid',errors};
 if(!logic.clues.every(clue=>rules.matches(targetRoute,clue)))return {status:'mismatch',errors:['target route violates base clues']};
 if(result.status!=='unique')return {status:'not-unique',errors:[]};
 return {status:sameRoute(targetRoute,result.uniqueSolution)?'match':'mismatch',errors:[]};
}

// Consume the existing engine's generator; no new graph search or clue rules.
// Counts for individual omissions saturate at two, in the same single traversal.
function boundedAnalysis(logic,{maxNodes,irredundancy}){
 const rules=createRules(logic),budget={remaining:maxNodes},counts=logic.clues.map(()=>0);
 let count=0,uniqueSolution=null,legalRoutesVisited=0,completed=true,clueEvaluations=0;
 for(const route of rules.routes([logic.start],budget)){
  legalRoutesVisited++;
  let failed=-1,multipleFailures=false;
  for(let i=0;i<logic.clues.length;i++){
   clueEvaluations++;
   if(!rules.matches(route,logic.clues[i])){
    if(failed!==-1){multipleFailures=true;break;}
    failed=i;
    if(!irredundancy)break;
   }
  }
  if(failed===-1){
   count++;uniqueSolution=count===1?[...route]:null;
   if(irredundancy)for(let i=0;i<counts.length;i++)counts[i]=Math.min(2,counts[i]+1);
   if(count===2){completed=false;break;}
  }else if(irredundancy&&!multipleFailures)counts[failed]=Math.min(2,counts[failed]+1);
 }
 return {status:count===0?'unsolvable':count===1?'unique':'ambiguous',count,countExact:completed,uniqueSolution,
  omissions:irredundancy&&count===1?logic.clues.map((clue,i)=>({clueId:clue.id,count:counts[i],countExact:counts[i]<2,necessary:counts[i]>=2})):[],
  search:{strategy:'engine-stream',completed,nodesVisited:maxNodes-budget.remaining,legalRoutesVisited,clueEvaluations}};
}

export function analyzeDefinition(definition,{rulesVersion,targetRoute=definition?.solution,
 detailed=false,irredundancy=false,maxNodes=250000}={}){
 validateLogicDefinition(definition,{rulesVersion});
 if(!Number.isSafeInteger(maxNodes)||maxNodes<1)throw Error('Ungültiges Suchbudget');
 const {logic}=definition;
 let result;
 if(detailed){
  const exact=solvePuzzle(logic,{maxNodes,metrics:irredundancy});
  result={status:exact.status,count:exact.count,countExact:true,
   uniqueSolution:exact.count===1?exact.solutions[0]:null,solutions:exact.solutions,
   omissions:irredundancy&&exact.count===1?exact.metrics.withoutClue.map(row=>({...row,countExact:true,necessary:row.count>=2})):[],
   search:{strategy:'existing-solver',completed:true,legalRoutesVisited:exact.legalRouteCount}};
 }else result=boundedAnalysis(logic,{maxNodes,irredundancy});
 const target=targetDiagnosis(logic,targetRoute,result),diagnostics=[];
 if(result.status!=='unique')diagnostics.push({code:result.status==='ambiguous'?'not-unique':'unsolvable'});
 if(target.status==='invalid'||target.status==='mismatch')diagnostics.push({code:'target-'+target.status,errors:target.errors});
 if(irredundancy){
  if(target.status==='absent')diagnostics.push({code:'target-required'});
  for(const row of result.omissions)if(!row.necessary)diagnostics.push({code:'redundant-clue',clueId:row.clueId});
 }
 return {...result,target,diagnostics,...(irredundancy?{irredundant:result.status==='unique'&&target.status==='match'&&result.omissions.every(row=>row.necessary)}:{})};
}

export function checkIrredundancy(definition,options={}){
 return analyzeDefinition(definition,{...options,irredundancy:true});
}
