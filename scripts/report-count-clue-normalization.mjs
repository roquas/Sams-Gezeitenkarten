// Three fixed controls, no clue generation or series selection. Each route
// enumeration/oracle has a predeclared 100,000-node cap.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ROOT,readPlaytestSource} from './lib/b2-playtest.mjs';
import {COUNT_NORMALIZATION,normalizeCountClues} from './lib/count-clue-normalization.mjs';
import {createRouteWorkspace} from './lib/puzzle-route-solver.mjs';
import {searchPuzzleCandidates} from './lib/puzzle-candidate-search.mjs';
import {createRules} from '../src/engine/puzzle.mjs';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {canonicalJson,sha256} from './lib/content-hash.mjs';
import {technicalClueText} from './lib/clue-text.mjs';

export const OUTPUT='docs/verification/S04-B/evidence.json';
export const MAX_NODES=100000;
export const BUDGETS={maxRestarts:1,maxSolverChecks:100,maxMatchEvaluations:1000000,maxRouteFilterEvaluations:1000000};
const names=[['S03-V2','B2-S03-V2-M014-A5-R160-V01'],
 ['S03-V2','B2-S03-V2-M011-A5-R787-V01'],['BC','B2-BC-T06-M005-E3-R00']];
const routesHash=routes=>sha256(canonicalJson(routes));
export function normalizationEvidence(){
 const cases=names.map(([stock,name],index)=>{
  const source=readPlaytestSource(stock),binding=source.registry.entries.find(e=>e.testName===name);
  const row=source.rows.find(r=>r.fingerprints.variant===binding.fingerprints.variant);
  const raw=row.definition.logic.clues,logic={...row.definition.logic,clues:[]};
  const prepared=normalizeCountClues(raw),rules=createRules(logic);
  const budget={remaining:MAX_NODES},routes=[...rules.routes([logic.start],budget)];
  const filter=clues=>routes.filter(route=>clues.every(c=>rules.matches(route,c)));
  assert.deepEqual(filter(raw),filter(prepared.clues));
  const proof=checkIrredundancy({...row.definition,logic:{...logic,clues:prepared.clues}},
   {detailed:true,maxNodes:MAX_NODES});
  assert.equal(proof.irredundant,true);assert.equal(proof.target.status,'match');
  const result={name,source:{path:source.registry.source+'/candidates.jsonl',
   sha256:sha256(fs.readFileSync(path.join(ROOT,source.registry.source,'candidates.jsonl'))),
   candidateId:row.candidateId,recordSha256:sha256(JSON.stringify(row)),fingerprints:row.fingerprints},
   changed:prepared.changed,rawClueCount:raw.length,clueCount:prepared.clues.length,
   legalRouteCount:routes.length,enumerationNodes:MAX_NODES-budget.remaining,
   legalRoutesSha256:routesHash(routes),rawSolutionsSha256:routesHash(filter(raw)),
   normalizedSolutionsSha256:routesHash(filter(prepared.clues)),
   uniqueSolution:proof.uniqueSolution,omissions:proof.omissions};
  if(index===0){
   const pair=raw.filter(c=>['H2','H3'].includes(c.id));
   const merged=normalizeCountClues(pair).clues;
   assert.deepEqual(filter(pair),filter(merged));
   result.transformedGroup={sourceIds:['H2','H3'],rawRouteCount:filter(pair).length,
    mergedRouteCount:filter(merged).length,routesSha256:routesHash(filter(pair))};
   const workspace=createRouteWorkspace(logic,{maxNodes:MAX_NODES});
   const candidates=searchPuzzleCandidates({logic,targetRoute:row.definition.solution,workspace,
    cluePool:{clues:raw,parametersExamined:raw.length,completed:true},seed:404,budgets:BUDGETS,
    strategy({clues,onCandidate}){
     assert.equal(onCandidate(clues.map((_,i)=>i)),true);
     return {restarts:1,reducedSets:1,failures:{},exhaustive:false};
    }});
   assert.equal(candidates.candidates.length,1);
   result.candidate={puzzleExperimentFormatVersion:2,attemptId:'S04-B-reference-06',...candidates.candidates[0]};
   result.search=candidates.search;
   result.texts=Object.fromEntries(prepared.clues.map(c=>[c.id,technicalClueText(c,logic.map)]));
  }else assert.equal(prepared.changed,false);
  return result;
 });
 return {format:'s04-b-normalization-evidence-1',normalization:COUNT_NORMALIZATION,
  baseline:'974931e95d434a35ce34094f4d5244e289d6fd76',
  budgets:{maxNodesPerEnumeration:MAX_NODES,maxEnumerations:7,search:BUDGETS},
  scope:'Fixed reference and two positive countercontrols; no generator run, new route selection or human quality claim.',cases};
}
export function main(args){
 if(args.length>1||(args.length&&!['--check','--write'].includes(args[0])))throw Error('Usage: node scripts/report-count-clue-normalization.mjs [--check|--write]');
 const bytes=JSON.stringify(normalizationEvidence(),null,2)+'\n',file=path.join(ROOT,OUTPUT);
 if(args[0]==='--check'){assert.equal(fs.readFileSync(file,'utf8'),bytes);return 'S04-B evidence reproduced byte-for-byte';}
 if(args[0]==='--write'){fs.writeFileSync(file,bytes);return OUTPUT;}
 return bytes.trimEnd();
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))){
 try{console.log(main(process.argv.slice(2)));}catch(error){console.error(error.message);process.exitCode=1;}
}
