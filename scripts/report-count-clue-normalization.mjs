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
import {candidateOriginContract,originContractSha256,readGitRawSource} from './lib/candidate-origin-contract.mjs';

export const OUTPUT='docs/verification/S04-B/evidence.json';
export const ORIGIN_OUTPUT='docs/verification/S04-B/origin-contract.json';
// Independent of evidence.json and the mutable candidate under test. The Git
// snapshot predates S04-B; its record binds the actual original H2/H3 names.
export const REFERENCE_ORIGIN_CONTRACT_SHA256='334e17e2ade76e7bb8032d4b4ee00f05bd9fd8a4443747e6c983a88fc57b6b6c';
export function referenceOriginContext(){
 const source={kind:'git-record',commit:'974931e95d434a35ce34094f4d5244e289d6fd76',
  path:'docs/verification/S03-v2/run/candidates.jsonl',
  candidateId:'gk-s03-v2-run-sha256:06482bf625006e10ce844b47105fbc54df23c232911cbc828833d96f7eae0f58/M014/gk-variant-v2-sha256:25d0c81d39abf535da14031d6c8493079cc17c8f4c4004ae9794888e9cf81d3c',
  recordSha256:'cd3b8f2f3724c6c14e550d28918d5f6069c272503b77891a2c929a4c2394ff04'};
 const original=readGitRawSource(source);
 const originContract=candidateOriginContract(COUNT_NORMALIZATION,[{attemptId:'S04-B-reference-06',
  variant:'gk-variant-v2-sha256:32bed5b659a1f53e3f65fdd71e4a9c65060f55493146c7f32d9756860d79f8ca',
  status:'normalized',rawClues:original.definition.logic.clues,source}]);
 assert.equal(originContractSha256(originContract),REFERENCE_ORIGIN_CONTRACT_SHA256);
 return {originContract,expectedOriginContractSha256:REFERENCE_ORIGIN_CONTRACT_SHA256};
}
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
  originContract:{path:ORIGIN_OUTPUT,canonicalSha256:REFERENCE_ORIGIN_CONTRACT_SHA256},
  baseline:'974931e95d434a35ce34094f4d5244e289d6fd76',
  budgets:{maxNodesPerEnumeration:MAX_NODES,maxEnumerations:7,search:BUDGETS},
  scope:'Fixed reference and two positive countercontrols; no generator run, new route selection or human quality claim.',cases};
}
export function main(args){
 if(args.length>1||(args.length&&!['--check','--write'].includes(args[0])))throw Error('Usage: node scripts/report-count-clue-normalization.mjs [--check|--write]');
 const bytes=JSON.stringify(normalizationEvidence(),null,2)+'\n',file=path.join(ROOT,OUTPUT);
 const originFile=path.join(ROOT,ORIGIN_OUTPUT),originBytes=JSON.stringify(referenceOriginContext().originContract,null,2)+'\n';
 if(args[0]==='--check'){
  assert.equal(fs.readFileSync(originFile,'utf8'),originBytes);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);return 'S04-B evidence reproduced byte-for-byte';
 }
 if(args[0]==='--write'){fs.writeFileSync(originFile,originBytes);fs.writeFileSync(file,bytes);return OUTPUT;}
 return bytes.trimEnd();
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))){
 try{console.log(main(process.argv.slice(2)));}catch(error){console.error(error.message);process.exitCode=1;}
}
