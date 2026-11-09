// Exact offline consequences and an independent local propagator. No generation.
import fs from 'node:fs';
import path from 'node:path';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {localDeduction} from './b2-local-deduction.mjs';
import {ROOT,readPlaytestSource,validatePlaytestBindings} from './b2-playtest.mjs';
import {sha256} from './content-hash.mjs';

const sum=values=>values.reduce((a,b)=>a+b,0);
const difference=(left,right)=>left.filter(x=>!right.includes(x));
const subtract=(left,right)=>left.map((items,h)=>difference(items,right[h]));
const fixed=domains=>domains.flatMap((d,hour)=>d.length===1?[{hour,value:d[0]}]:[]);
const key=indices=>indices.join(',');

export function clueSubsets(length){
 if(!Number.isInteger(length)||length<0||length>7)throw Error('Prototype supports at most seven clues');
 const result=[[]];
 function append(prefix,next,size){
  if(prefix.length===size){result.push(prefix);return;}
  for(let i=next;i<length;i++)append([...prefix,i],i+1,size);
 }
 for(let size=1;size<=Math.min(3,length);size++)append([],0,size);
 if(length>3)result.push(Array.from({length},(_,i)=>i));
 return result;
}

export function projectRoutes(routes,steps=6){
 const domains=Array.from({length:steps+1},()=>new Set()),transitions=Array.from({length:steps},()=>new Set());
 for(const route of routes){
  route.forEach((cell,h)=>domains[h].add(cell));
  for(let h=1;h<=steps;h++)transitions[h-1].add(`${route[h-1]}>${route[h]}`);
 }
 const sorted=sets=>sets.map(s=>[...s].sort());
 return {routeCount:routes.length,domains:sorted(domains),transitions:sorted(transitions)};
}

export function assertLocalSound(exact,local){
 for(const property of ['domains','transitions'])for(let i=0;i<exact[property].length;i++)
  if(difference(exact[property][i],local[property][i]).length)throw Error(`Unsound local ${property} at index ${i}`);
}

export function diagnosePuzzle(logic,{givens=[]}={}){
 validateLogic(logic);
 if(logic.steps!==6)throw Error('Prototype requires six hours');
 const subsets=clueSubsets(logic.clues.length),rules=createRules(logic);
 const legalRoutes=[...rules.routes([logic.start],{remaining:250000})];
 const legal=projectRoutes(legalRoutes),masks=legalRoutes.map(route=>logic.clues.map(c=>rules.matches(route,c)));
 const results=[],byKey=new Map();
 for(const indices of subsets){
  const clues=indices.map(i=>logic.clues[i]);
  const routes=legalRoutes.filter((r,i)=>indices.every(j=>masks[i][j])&&givens.every(g=>r[g.hour]===g.cell));
  const exact=projectRoutes(routes);
  exact.excludedFields=subtract(legal.domains,exact.domains);
  exact.excludedTransitions=subtract(legal.transitions,exact.transitions);
  exact.fixedHours=fixed(exact.domains);
  exact.fixedTransitions=fixed(exact.transitions).map(p=>({...p,hour:p.hour+1}));
  const local=localDeduction({...logic,clues},{givens});
  // Sorting only affects presentation; derivation order is stable map/clue order.
  local.domains=local.domains.map(d=>[...d].sort());
  local.transitions=local.transitions.map(d=>[...d].sort());
  assertLocalSound(exact,local);
  const unexplainedFields=subtract(local.domains,exact.domains),unexplainedTransitions=subtract(local.transitions,exact.transitions);
  const gap={unexplainedFields,unexplainedTransitions,
   fieldCount:sum(unexplainedFields.map(d=>d.length)),transitionCount:sum(unexplainedTransitions.map(d=>d.length)),
   fixedHoursNotExplained:exact.fixedHours.filter(p=>local.domains[p.hour].length!==1).map(p=>p.hour),
   fixedTransitionsNotExplained:exact.fixedTransitions.filter(p=>local.transitions[p.hour-1].length!==1).map(p=>p.hour)};
  const result={clueIds:clues.map(c=>c.id),scope:indices.length>3?'all-clues-control':'up-to-three',exact,local,gap};
  if(indices.length>=2&&indices.length<=3){
   const parents=indices.map((_,i)=>byKey.get(key(indices.filter((_,j)=>i!==j))).exact);
   // A consequence is combination-only when NO proper subset entails it.
   const novel=property=>exact[property].map((allowed,h)=>
    difference(parents[0][property][h].filter(x=>parents.every(p=>p[property][h].includes(x))),allowed));
   result.combinationOnly={excludedFields:novel('domains'),excludedTransitions:novel('transitions'),
    fixedHours:exact.fixedHours.filter(p=>parents.every(parent=>parent.domains[p.hour].length!==1)).map(p=>p.hour),
    fixedTransitions:exact.fixedTransitions.filter(p=>parents.every(parent=>parent.transitions[p.hour-1].length!==1)).map(p=>p.hour)};
  }
  results.push(result);byKey.set(key(indices),result);
 }
 const oracle=solvePuzzle({...logic,clues:[...logic.clues,...givens.map((g,i)=>({id:`DIAGNOSTIC-${i}`,type:'position',...g}))]},{metrics:false});
 const all=results.at(-1).exact;
 if(oracle.count!==all.routeCount||JSON.stringify(projectRoutes(oracle.solutions))!==JSON.stringify({routeCount:all.routeCount,domains:all.domains,transitions:all.transitions}))
  throw Error('Full-clue consequences disagree with existing solver');
 return {givens,legal,baselineLocal:localDeduction({...logic,clues:[]}),scenarios:results,
  validation:{allCluesSolverAgreement:true,localSoundAgainstEverySubset:true}};
}

export const REFERENCE_PATH='tests/fixtures/deduction/quittung-nombreo.v1.json';
export const REFERENCE_COMMIT='16cabf8ffb31bd93640de81537e794ad0c9f5d25';
export const REFERENCE_BLOB='7be571116e5b28856d326975c08ca936f30e864b';
export function historicalReference(){
 const bytes=fs.readFileSync(path.join(ROOT,REFERENCE_PATH)),document=JSON.parse(bytes);
 let errors;
 try{validateLogic(document.logic);}catch(error){errors=error.errors??[error.message];}
 if(!errors)throw Error('Historical reference compatibility changed; review the diagnostic boundary');
 return {id:document.id,title:document.presentation.title,status:'unsupported-original-schema',
  source:{path:REFERENCE_PATH,sha256:sha256(bytes),gitCommit:REFERENCE_COMMIT,gitPath:'puzzles/quittung-nombreo.json',gitBlob:REFERENCE_BLOB},
  schemaVersion:document.schemaVersion,errors,
  reason:'Originaldefinition verwendet logic.grid/blocked/places, countAdjacentToPlace und frühere Distanzsemantik. Keine Migration und keine Ersatzdefinition.',
  exact:null,local:null};
}

export function buildDeductionReport(){
 const source=readPlaytestSource('BC'),byVariant=validatePlaytestBindings(source);
 const names=['B2-BC-T02-M017-A4-R00','B2-BC-T07-M013-D4-R00'];
 const cases=names.map(id=>{
  const binding=source.registry.entries.find(e=>e.testName===id),row=byVariant.get(binding.fingerprints.variant);
  // Pass only logic. The stored answer and candidate metrics are not inputs.
  return {id,source:{registry:'scripts/config/b2-playtest-bc.json',candidates:source.registry.source+'/candidates.jsonl',
   candidatesSha256:source.registry.candidatesSha256,candidateId:binding.candidateId,contentSha256:binding.contentSha256},
  logic:row.definition.logic,analysis:diagnosePuzzle(row.definition.logic)};
 });
 const t07=cases[1],oracle=solvePuzzle(t07.logic,{metrics:false});
 if(oracle.count!==1)throw Error('T07 control needs a uniquely derived hour 3');
 const given={hour:3,cell:oracle.solutions[0][3]};
 cases.push({id:t07.id+'+given-hour-3',source:t07.source,logic:t07.logic,
  givenSource:'Stunde 3 aus der eindeutigen Solver-Lösung; keine gespeicherte Zielroute gelesen.',
  analysis:diagnosePuzzle(t07.logic,{givens:[given]})});
 return {format:'b2-deduction-1',maxCombinedClues:3,fullClueControl:true,
  baseline:'main b785f7880e97bf95d835c75e8c2a511726c95a06 (PR #102)',cases,reference:historicalReference()};
}
