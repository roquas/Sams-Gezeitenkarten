// Bounded orchestration of existing producers, planner, diagnoses and verifier.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {PROGRAM_ROOT as ROOT,programState,runMapBatch} from './map-batch.mjs';
import {runRouteExperiment,selectTargetRoute} from './route-experiment.mjs';
import {readB1Experiment} from './puzzle-experiment.mjs';
import {sha256,canonicalJson} from './content-hash.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {randomStream} from '../../src/generation/random.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {createRouteWorkspace} from './puzzle-route-solver.mjs';
import {generateTrueClues} from './puzzle-clues.mjs';
import {searchPuzzleCandidates,randomIncrementalSearch,SEARCH_STRATEGY} from './puzzle-candidate-search.mjs';
import {candidateOriginContract,pinOriginContract,originContractSha256} from './candidate-origin-contract.mjs';
import {verifyCandidates} from '../verify-puzzle-experiment.mjs';
import {clueSubsets,diagnosePuzzle,projectRoutes} from './b2-deduction.mjs';
import {buildProgressProfile} from './b2-markable-progress.mjs';
import {qualitySignals,earlyRejection,lateRejection} from './s03-quality.mjs';
import {preferences,preferred,selectCohorts} from './s04-c-selection.mjs';
import {productionPlan,writePrivateHandoff,writeInventory,validateProductionConfig} from './s04-c-production-policy.mjs';

export const CONFIG='scripts/config/s04-c-production-v1.json',CONTRACT='docs/verification/S04-C/production-contract.md';
const read=ref=>fs.readFileSync(path.join(ROOT,ref));
export const config=JSON.parse(read(CONFIG));
const json=x=>JSON.stringify(x,null,2)+'\n',jsonl=rows=>rows.map(r=>JSON.stringify(r)+'\n').join('');
const add=(counts,key,n=1)=>{counts[key]=(counts[key]??0)+n;};
const costs=['restarts','solverChecks','cacheHits','matchEvaluations','routeFilterEvaluations'];
const distinct=(rows,key)=>new Set(rows.map(key)).size;

export function historicalInventory(){
 const refs=execFileSync('git',['-C',ROOT,'ls-tree','-r','--name-only',config.baseCommit,'--','docs/verification'],{encoding:'utf8'})
  .trim().split('\n').filter(p=>/\/(?:candidates|raw|finalists|source-candidates|accepted)\.jsonl$/.test(p));
 const maps=new Set(),variants=new Set(),files=[];
 for(const ref of refs){
  const bytes=read(ref);assert.deepEqual(bytes,execFileSync('git',['-C',ROOT,'show',config.baseCommit+':'+ref],{maxBuffer:64*1024*1024}));files.push({path:ref,sha256:sha256(bytes)});
  for(const row of bytes.toString().split('\n').filter(Boolean).map(JSON.parse)){
   const map=row.definition?.logic.map??row.generation?.map;
   if(map)maps.add(mapFingerprint(map));
   if(row.fingerprints)variants.add(row.fingerprints.variant);
  }
 }
 return {maps,variants,files};
}

export async function runProduction(out){
 validateProductionConfig(config);assert.equal(process.version,config.nodeVersion);assert.equal(SEARCH_STRATEGY,config.strategy);
 const begin=performance.now(),cpuStart=process.cpuUsage(),program=programState(),history=historicalInventory();
 const inputFiles=[CONFIG,CONTRACT,'docs/observations/human-playtests.v1.json','docs/verification/S04-A/README.md','docs/verification/S04-B/README.md','docs/verification/S04-B/provenance-contract.md','docs/verification/S04-C/contract.md','docs/verification/S04-C/README.md','scripts/config/s04-c-v1.json','docs/verification/S04-C/issue-21-source.json'].map(ref=>({path:ref,sha256:sha256(read(ref))}));
 const settings={protocol:config.protocol,config,program,inputFiles,historicalFiles:history.files};
 const experimentId='gk-s04-c-production-sha256:'+sha256(canonicalJson({...settings,config:JSON.stringify(config)}));
 fs.mkdirSync(out);
 const write=(ref,bytes)=>{fs.mkdirSync(path.dirname(path.join(out,ref)),{recursive:true});fs.writeFileSync(path.join(out,ref),bytes,{flag:'wx'});};
 write('manifest.json',json({...settings,experimentId}));
 const batch=path.join(out,'source-batch'),b1=path.join(out,'b1');
 const batchSummary=runMapBatch({releaseId:config.releaseId,backgroundId:config.backgroundId,out:batch,options:config.batch});
 const b1Summary=await runRouteExperiment({batch,acceptedIndices:'all',maxNodesPerStart:config.maxNodes,out:b1});
 // Authenticate original bytes, all assignments, starts and identities through
 // the existing B2 reader. This also replays B1, with no custom input shortcut.
 const loaded=await readB1Experiment(b1,{batch});
 const prepared=[],preparation=[],seenMaps=new Set();
 for(const row of loaded.rows){
  const mapIndex=row.source.candidateIndex,attempt={mapIndex,b1MapTrialId:row.mapTrialId};
  preparation.push(attempt);
  if(history.maps.has(row.mapFingerprint)||seenMaps.has(row.mapFingerprint)){attempt.reason='OLD_OR_DUPLICATE_MAP';continue;}
  seenMaps.add(row.mapFingerprint);
  const start=row.starts.find(s=>s.countExact&&s.routeCountLowerBound>0);
  if(!start){attempt.reason=row.starts.some(s=>!s.countExact)?'INCOMPLETE_START_ENUMERATION':row.starts.length?'NO_LEGAL_ROUTE':'NO_ELIGIBLE_START';continue;}
  const logic={map:row.map,start:start.cell,steps:config.steps,clues:[]};
  attempt.start=start.cell;
  const workspace=createRouteWorkspace(logic,{maxNodes:config.maxNodes});
  attempt.enumeration={completed:workspace.completed,nodesVisited:workspace.nodesVisited,routeCount:workspace.routeCount??null};
  if(!workspace.completed){attempt.reason='ROUTE_ENUMERATION_BUDGET_EXHAUSTED';continue;}
  const routes=solvePuzzle(logic,{maxNodes:config.maxNodes,metrics:false}).solutions;
  assert.equal(routes.length,workspace.routeCount);
  attempt.baselineOracle={completed:true,maxNodes:config.maxNodes,routeCount:routes.length};
  const baseline=projectRoutes(routes);
  attempt.baseline={fixedHours:baseline.domains.flatMap((d,h)=>h&&d.length===1?[h]:[]),domainSizes:baseline.domains.map(d=>d.length)};
  if(routes.length<config.quality.minRoutes){attempt.reason='LOW_ROUTE_VARIATION';continue;}
  if(attempt.baseline.fixedHours.length>config.quality.maxBaselineFixed){attempt.reason='GEOMETRY_PREDETERMINATION';continue;}
  const routeIndex=randomStream(config.seed,config.targetNamespace+mapIndex).integer(routes.length);
  const target=selectTargetRoute(row.map,{start:start.cell,routeIndex,maxNodes:config.maxNodes});
  assert.equal(target.status,'selected');assert.deepEqual(target.route,routes[routeIndex]);
  attempt.target=target;attempt.seed=config.seed+mapIndex;
  const pool=generateTrueClues(logic,target.route,{maxClueParameters:config.maxClueParameters,policy:config.cluePolicy});
  attempt.pool={completed:pool.completed,parametersExamined:pool.parametersExamined,size:pool.clues.length,byType:pool.byType};
  if(!pool.completed){attempt.reason='CLUE_PARAMETER_BUDGET_EXHAUSTED';continue;}
  prepared.push({mapIndex,logic,workspace,pool,target,seed:attempt.seed,assetPlacements:row.assetPlacements,
   b1MapTrialId:row.mapTrialId,b1StartTrialId:start.trialId});
 }
 write('preparation.json',json({batch:batchSummary,b1:b1Summary,attempts:preparation}));
 const commonMs=performance.now()-begin,arms=[],observations=[];
 for(const arm of config.arms){
  const armStart=performance.now(),records=[],origins=[],attempts=[];
  for(const t of prepared){
   const attemptId=experimentId+'/'+arm.id+'/M'+String(t.mapIndex).padStart(3,'0');
   const result=searchPuzzleCandidates({logic:t.logic,targetRoute:t.target.route,workspace:t.workspace,
    cluePool:t.pool,seed:t.seed,budgets:{...config.search,maxRestarts:arm.maxRestarts},normalization:config.normalization,strategy:randomIncrementalSearch});
   origins.push(...result.originReceipts.map(r=>({...r,attemptId})));
   attempts.push({mapIndex:t.mapIndex,attemptId,seed:t.seed,routeSource:t.target.source,search:result.search,status:result.status});
   result.candidates.forEach((c,i)=>{
    assert.ok(!history.variants.has(c.fingerprints.variant),'Historical variant returned');
    const candidateId=attemptId+'/'+c.fingerprints.variant;
    records.push({puzzleExperimentFormatVersion:2,experimentId,attemptId,candidateId,
     mapIndex:t.mapIndex,source:{ordinal:i+1,line:records.length+1,candidateId},
     b1MapTrialId:t.b1MapTrialId,b1StartTrialId:t.b1StartTrialId,routeSource:t.target.source,
     seed:t.seed,assetPlacements:t.assetPlacements,...c});
   });
  }
  const prefix=arm.id+'/',contract=candidateOriginContract(config.normalization,origins);
  write(prefix+'generated.jsonl',jsonl(records));write(prefix+'candidate-origins.json',json(contract));
  // Trusted receipt captured before serialized candidates, not self-attestation
  // by reopening candidate/origin files to derive their expected digest.
  const verification=verifyCandidates(path.join(out,prefix+'generated.jsonl'),pinOriginContract(contract));
  const plan=productionPlan(records,config);
  write(prefix+'plan.json',json(plan));write(prefix+'attempts.jsonl',jsonl(attempts));
  const byId=new Map(records.map(r=>[r.candidateId,r]));let statesUsed=0;
  for(const item of plan.scheduled){
   const r=byId.get(item.candidateId),started=performance.now(),count=clueSubsets(r.definition.logic.clues.length).length;
   assert.ok(count<=config.maxStatesPerDiagnosis&&statesUsed+count<=config.maxDiagnosisStates);
   const diagnosis=diagnosePuzzle(r.definition.logic);
   assert.equal(diagnosis.scenarios.length,count);statesUsed+=count;
   const ref=prefix+'evidence/M'+r.mapIndex+'-V'+r.source.ordinal;
   const states=diagnosis.scenarios.map((s,i)=>({...s,source:{path:ref+'.states.jsonl.gz',line:i+1}}));
   const bytes=jsonl(states),compressed=gzipSync(bytes),definitionBytes=json(r.definition);
   write(ref+'.states.jsonl.gz',compressed);
   const inputs=[{path:prefix+'generated.jsonl',candidateId:r.candidateId,
    sha256:sha256(fs.readFileSync(path.join(out,prefix+'generated.jsonl'))),definitionSha256:sha256(definitionBytes)},
    {path:ref+'.states.jsonl.gz',sha256:sha256(compressed),uncompressedSha256:sha256(bytes)}];
   const profile=buildProgressProfile({id:r.candidateId,label:r.candidateId,puzzleId:r.candidateId,
    logic:r.definition.logic,givens:[],states,inputs});
   r.diagnosis={inputs,states:inputs[1],count,profileSha256:sha256(JSON.stringify(profile)),validation:diagnosis.validation};
   r.signals=qualitySignals(profile);r.preferences=preferences(r.signals,config.quality);
   r.lateReason=lateRejection(r.signals,config.quality);
   r.disposition=preferred(r.preferences)?'preferred-eligible':'comparison-eligible';
   observations.push({arm:arm.id,candidateId:r.candidateId,diagnosisMs:performance.now()-started,states:count});
  }
  const rejections={},preferenceCounts={P1:0,P2:0,P3:0};let undiagnosed=0;
  for(const r of records){
   const early=earlyRejection(r,config.quality);
   if(early){r.disposition='early-quality-rejected';r.reason=early;add(rejections,early);}
   else if(!r.diagnosis){r.disposition='undiagnosed';r.reason=plan.undiagnosed.find(p=>p.candidateId===r.candidateId)?.round>config.maxDiagnosesPerMap?'DIAGNOSIS_PER_MAP_LIMIT':'DIAGNOSIS_BUDGET_EXHAUSTED';undiagnosed++;}
   if(r.lateReason)add(rejections,r.lateReason);
   if(r.preferences)for(const [k,v] of Object.entries(r.preferences))preferenceCounts[k]+=Number(v);
  }
  const eligible=records.filter(r=>r.preferences),good=eligible.filter(r=>preferred(r.preferences));
  const cohorts=selectCohorts(eligible,config.selection),searchCosts={},searchFailures={};
  for(const a of attempts){for(const k of costs)add(searchCosts,k,a.search[k]);for(const [k,v] of Object.entries(a.search.failures))add(searchFailures,k,v);}
  const goodMaps=distinct(good,r=>r.fingerprints.mapStructure);
  const summary={id:arm.id,raw:records.length,verification,
   originContractSha256:originContractSha256(contract),
   normalized:records.filter(r=>r.preparation.status==='normalized').length,
   searchCosts,searchFailures,incompleteSearches:attempts.filter(a=>a.search.incomplete).length,
   incompleteValidityChecks:0,earlyRejected:plan.earlyRejected.length,rejections,
   diagnoses:plan.scheduled.length,diagnosisStates:statesUsed,undiagnosed,preferenceCounts,
   preferredCandidates:good.length,preferredMaps:goodMaps,
   diversity:{diagnosedMaps:distinct(eligible,r=>r.fingerprints.mapStructure),
    preferredSignatures:distinct(good,r=>r.signals.signature),
    preferredTypeCombinations:distinct(good,r=>[...r.properties.clueTypes].sort().join(',')),
    preferredFormCombinations:distinct(good,r=>[...r.properties.cluePresentationForms].sort().join(','))},
   yieldPerActualBudget:{mapsPer1000SolverChecks:searchCosts.solverChecks?goodMaps*1000/searchCosts.solverChecks:null,
    mapsPerMillionMatches:searchCosts.matchEvaluations?goodMaps*1000000/searchCosts.matchEvaluations:null,
    mapsPerMillionFilters:searchCosts.routeFilterEvaluations?goodMaps*1000000/searchCosts.routeFilterEvaluations:null},
   cohorts};
  write(prefix+'raw.jsonl',jsonl(records));write(prefix+'summary.json',json(summary));
  arms.push(summary);observations.push({arm:arm.id,totalMs:performance.now()-armStart});
  process.stderr.write(`S04-C ${arm.id}: ${records.length} new variants, ${summary.diagnoses} diagnoses, ${goodMaps} preferred maps\n`);
 }
 for(const f of [...inputFiles,...history.files])assert.equal(sha256(read(f.path)),f.sha256,'Input changed during production');
 const summary={experimentId,status:'completed',phase:'C',preparedTargets:prepared.length,
  commonPreparation:{batchAttempts:batchSummary.attemptedCount,acceptedMaps:batchSummary.acceptedCount,b1Starts:b1Summary.startCount,
   b1IncompleteStarts:b1Summary.incompleteStarts,b1Nodes:b1Summary.search.nodesVisited,
   b1ValidationReplays:1,b1ReplayNodes:b1Summary.search.nodesVisited,
   workspaceNodes:preparation.reduce((n,a)=>n+(a.enumeration?.nodesVisited??0),0),
   baselineOracleCalls:preparation.filter(a=>a.baselineOracle).length,baselineOracleMaxNodes:config.maxNodes,
   targetSelectionNodes:preparation.reduce((n,a)=>n+(a.target?.search.nodesVisited??0),0),
   clueParameters:preparation.reduce((n,a)=>n+(a.pool?.parametersExamined??0),0)},
  arms,publicFiles:0,externalPlaytestStarted:false};
 const records=fs.readFileSync(path.join(out,'C/raw.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
 writePrivateHandoff(records,arms[0].cohorts,config,write);
 write('observations.json',json({node:process.version,totalMs:performance.now()-begin,commonMs,
  cpuUsage:process.cpuUsage(cpuStart),peakRssKiB:process.resourceUsage().maxRSS,costs:observations}));
 write('summary.json',json(summary));writeInventory(out,write);return summary;
}
