// Private B2 protocol; reads B1 results, never edits them or public puzzles.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {performance} from 'node:perf_hooks';
import {programState} from './map-batch.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {analyzeRouteMap,selectTargetRoute,ROUTE_ORDER,ROUTE_STRATEGY} from './route-experiment.mjs';
import {createRouteWorkspace} from './puzzle-route-solver.mjs';
import {generateTrueClues} from './puzzle-clues.mjs';
import {SEARCH_STRATEGY,validateSearchBudgets,searchPuzzleCandidates} from './puzzle-candidate-search.mjs';
import {validateSeed,randomStream} from '../../src/generation/random.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';

export const PUZZLE_EXPERIMENT_FORMAT_VERSION=1;
const assert=(yes,message)=>{if(!yes)throw Error('puzzle-experiment: '+message);};
const json=value=>JSON.stringify(value,null,2)+'\n';
const id=(kind,value)=>`gk-b2-${kind}-sha256:${sha256(canonicalJson(value))}`;
const b1id=(kind,value)=>`gk-b1-${kind}-sha256:${sha256(canonicalJson(value))}`;
const files=['manifest.json','maps.jsonl','summary.json'];
const fingerprints=directory=>files.map(file=>({file,sha256:sha256(fs.readFileSync(path.join(directory,file)))}));
const read=(directory,file)=>JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
const add=(counts,key,n=1)=>{counts[key]=(counts[key]??0)+n;};
const same=(a,b,message)=>assert(isDeepStrictEqual(a,b),message);

// Recompute B1 analysis with its original budget, including unknown outcomes.
// This checks every row and identity before output is reserved, even no-start
// maps. B1 remains the authority for its original catalog/release provenance.
export function readB1Experiment(directory){
 const hashes=fingerprints(directory),manifest=read(directory,'manifest.json'),summary=read(directory,'summary.json');
 const {experimentId,input,...settings}=manifest;
 assert(settings.experimentFormatVersion===1&&settings.strategy===ROUTE_STRATEGY&&settings.routeOrder===ROUTE_ORDER&&
  settings.rulesVersion===RULES_VERSION&&settings.steps===6,'unsupported B1 format or rules');
 same(experimentId,b1id('run',{...settings,input:{files:input.files,acceptedIndices:input.acceptedIndices}}),'B1 experiment identity mismatch');
 assert(summary.status==='completed'&&summary.experimentId===experimentId,'completed B1 input required');
 assert(input.batchManifest.options.config.filters.routeSteps.length===0&&input.batchManifest.options.config.filters.minLargestComponent===0,
  'unfiltered B1 input required');
 const rows=fs.readFileSync(path.join(directory,'maps.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
 assert(new Set(input.acceptedIndices).size===input.acceptedIndices.length&&rows.length===input.acceptedIndices.length,'invalid B1 selection');
 const totals={mapCount:rows.length,startCount:0,routeCountLowerBound:0,countExact:true,incompleteMaps:0,incompleteStarts:0,
  mapStatuses:{},startStatuses:{},search:{maxNodesPerStart:settings.budgets.maxNodesPerStart,nodesVisited:0,totalNodeBudget:0}};
 for(let i=0;i<rows.length;i++){
  const row=rows[i],fingerprint=mapFingerprint(row.map);
  assert(row.source.acceptedIndex===input.acceptedIndices[i]&&row.experimentId===experimentId&&row.mapFingerprint===fingerprint,'invalid B1 map identity');
  const mapTrialId=b1id('map',{experimentId,acceptedIndex:row.source.acceptedIndex,mapFingerprint:fingerprint});
  same(row.mapTrialId,mapTrialId,'B1 map trial mismatch');
  const analysis=analyzeRouteMap(row.map,settings.budgets);
  const expected={experimentId,mapTrialId,source:row.source,mapFingerprint:fingerprint,map:row.map,assetPlacements:row.assetPlacements,...analysis,
   starts:analysis.starts.map(start=>({trialId:b1id('start',{mapTrialId,start:start.cell}),...start}))};
  same(row,expected,'B1 map analysis mismatch');
  totals.startCount+=row.starts.length;totals.routeCountLowerBound+=row.routeCountLowerBound;totals.countExact&&=row.countExact;
  totals.incompleteMaps+=Number(!row.countExact);add(totals.mapStatuses,row.status);
  totals.search.nodesVisited+=row.search.nodesVisited;totals.search.totalNodeBudget+=row.starts.length*settings.budgets.maxNodesPerStart;
  for(const start of row.starts){add(totals.startStatuses,start.status);totals.incompleteStarts+=Number(!start.countExact);}
 }
 same(summary,{experimentFormatVersion:1,experimentId,status:'completed',...totals},'B1 summary mismatch');
 same(hashes,fingerprints(directory),'B1 input changed while reading');
 return {manifest,summary,rows,files:hashes};
}

export function validatePuzzleExperimentOptions(options){
 assert(options&&Object.getPrototypeOf(options)===Object.prototype,'options required');
 assert(Object.keys(options).every(k=>['b1','out','seed','routeIndices','maxNodesPerStart','maxClueParameters','searchBudgets'].includes(k)),'unknown option');
 assert(typeof options.b1==='string'&&options.b1.length&&typeof options.out==='string'&&options.out.length,'b1 and out required');
 validateSeed(options.seed);
 assert(Array.isArray(options.routeIndices)&&options.routeIndices.length>0&&options.routeIndices.length<=100&&
  options.routeIndices.every(n=>Number.isSafeInteger(n)&&n>=0)&&new Set(options.routeIndices).size===options.routeIndices.length,'explicit distinct routeIndices required (at most 100)');
 for(const [key,limit] of [['maxNodesPerStart',1000000],['maxClueParameters',200000]])
  assert(Number.isSafeInteger(options[key])&&options[key]>=1&&options[key]<=limit,'invalid '+key);
 validateSearchBudgets(options.searchBudgets);
 return options;
}

export function runPuzzleExperiment(options){
 validatePuzzleExperimentOptions(options);
 const begin=performance.now(),{b1,out,seed,routeIndices,maxNodesPerStart,maxClueParameters,searchBudgets}=options;
 const outputPath=path.join(fs.realpathSync(path.dirname(path.resolve(out))),path.basename(path.resolve(out)));
 const relative=path.relative(fs.realpathSync(b1),outputPath);
 assert(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative),'output must be outside B1 input');
 const program=programState(),loaded=readB1Experiment(b1),inputMs=Math.round(performance.now()-begin);
 const settings={puzzleExperimentFormatVersion:PUZZLE_EXPERIMENT_FORMAT_VERSION,strategy:SEARCH_STRATEGY,
  routeSelection:{strategy:'explicit-indices-all-b1-starts-1',order:ROUTE_ORDER,routeIndices},rulesVersion:RULES_VERSION,steps:6,seed,
  budgets:{maxNodesPerStart,maxClueParameters,...searchBudgets},program,
  input:{experimentId:loaded.manifest.experimentId,files:loaded.files}};
 const experimentId=id('run',settings),manifest={...settings,experimentId,input:{...settings.input,b1Manifest:loaded.manifest}};
 fs.mkdirSync(out);
 fs.writeFileSync(path.join(out,'manifest.json'),json(manifest),{flag:'wx'});
 const attempts=fs.openSync(path.join(out,'attempts.jsonl'),'wx'),successes=fs.openSync(path.join(out,'candidates.jsonl'),'wx');
 const summary={puzzleExperimentFormatVersion:1,experimentId,status:'completed',mapCount:loaded.rows.length,startCount:0,
  routeRequests:0,targetRoutes:0,candidateCount:0,incompleteStarts:0,incompleteTargets:0,
  uniqueCandidateCount:0,distinctTargetInstances:0,
  failures:{},clueTypes:{},variantsPerTarget:[],properties:{individuallyExactClues:0,withExactHour1:0,withDirectionHour1:0},
  search:{enumerationNodes:0,selectionNodes:0,clueParametersExamined:0,clueCandidates:0,restarts:0,solverChecks:0,cacheHits:0,
   matchEvaluations:0,routeFilterEvaluations:0}};
 const allVariants=new Set(),allInstances=new Set();
 const timings={inputMs,enumerationMs:0,selectionMs:0,clueGenerationMs:0,searchMs:0};
 const measure=(key,fn)=>{const start=performance.now(),result=fn();timings[key]+=Math.round(performance.now()-start);return result;};
 try{
  for(const map of loaded.rows){
   const record={experimentId,b1MapTrialId:map.mapTrialId,mapFingerprint:map.mapFingerprint,source:map.source,starts:[]};
   if(!map.starts.length){record.status='impossible';record.reason='NO_ELIGIBLE_START';add(summary.failures,record.reason);}
   for(const start of map.starts){
    summary.startCount++;
    if(start.countExact&&start.routeCountLowerBound===0){
     record.starts.push({b1StartTrialId:start.trialId,start:start.cell,status:'impossible',reason:'NO_LEGAL_ROUTE',
      proof:'complete-b1-analysis',targets:[]});add(summary.failures,'NO_LEGAL_ROUTE');continue;
    }
    const logic={map:map.map,start:start.cell,steps:6,clues:[]};
    const workspace=measure('enumerationMs',()=>createRouteWorkspace(logic,{maxNodes:maxNodesPerStart}));
    summary.search.enumerationNodes+=workspace.nodesVisited;
    const attempt={b1StartTrialId:start.trialId,start:start.cell,routeEnumeration:{completed:workspace.completed,
     nodesVisited:workspace.nodesVisited,routeCount:workspace.routeCount??workspace.routeCountLowerBound},targets:[]};
    record.starts.push(attempt);
    if(!workspace.completed){attempt.status='unknown';attempt.reason='ROUTE_ENUMERATION_BUDGET_EXHAUSTED';summary.incompleteStarts++;add(summary.failures,attempt.reason);continue;}
    if(!workspace.routeCount){attempt.status='impossible';attempt.reason='NO_LEGAL_ROUTE';add(summary.failures,attempt.reason);continue;}
    attempt.status='searched';
    for(const routeIndex of routeIndices){
     summary.routeRequests++;
     const selected=measure('selectionMs',()=>selectTargetRoute(map.map,{start:start.cell,routeIndex,maxNodes:maxNodesPerStart}));
     summary.search.selectionNodes+=selected.search.nodesVisited;
     const target={routeIndex,selection:selected};attempt.targets.push(target);
     if(selected.status!=='selected'){
      target.status=selected.status==='unknown'?'unknown':'impossible';target.reason=selected.reason;
      summary.incompleteTargets+=Number(selected.status==='unknown');add(summary.failures,selected.reason);continue;
     }
     summary.targetRoutes++;
     allInstances.add(selected.instanceFingerprint);
     const targetSeed=randomStream(seed,SEARCH_STRATEGY+'/'+start.trialId+'/'+routeIndex).uint32();
     const attemptId=id('target',{experimentId,b1StartTrialId:start.trialId,routeIndex,instance:selected.instanceFingerprint});
     const pool=measure('clueGenerationMs',()=>generateTrueClues(logic,selected.route,{maxClueParameters}));
     const result=measure('searchMs',()=>searchPuzzleCandidates({logic,targetRoute:selected.route,cluePool:pool,workspace,seed:targetSeed,budgets:searchBudgets}));
     Object.assign(target,{attemptId,seed:targetSeed,status:result.status,search:result.search,candidateIds:result.candidates.map(c=>c.fingerprints.variant)});
     summary.incompleteTargets+=Number(result.search.incomplete);
     for(const key of Object.keys(summary.search))if(key in result.search)summary.search[key]+=result.search[key];
     for(const [key,n] of Object.entries(result.search.failures))add(summary.failures,key,n);
     summary.variantsPerTarget.push({attemptId,instanceFingerprint:selected.instanceFingerprint,count:result.candidates.length});
     for(const candidate of result.candidates){
      const output={puzzleExperimentFormatVersion:1,experimentId,attemptId,b1MapTrialId:map.mapTrialId,b1StartTrialId:start.trialId,
       source:map.source,routeSource:selected.source,seed:targetSeed,strategy:SEARCH_STRATEGY,budgets:settings.budgets,
       assetPlacements:map.assetPlacements,...candidate};
      fs.writeFileSync(successes,JSON.stringify(output)+'\n');summary.candidateCount++;
      allVariants.add(candidate.fingerprints.variant);
      for(const clue of candidate.definition.logic.clues)add(summary.clueTypes,clue.type);
      summary.properties.individuallyExactClues+=candidate.properties.individuallyExactClueCount;
      summary.properties.withExactHour1+=Number(candidate.properties.hasIndividuallyExactHour1);
      summary.properties.withDirectionHour1+=Number(candidate.properties.hasDirectionHour1);
     }
    }
   }
   fs.writeFileSync(attempts,JSON.stringify(record)+'\n');
  }
 }finally{fs.closeSync(attempts);fs.closeSync(successes);}
 summary.uniqueCandidateCount=allVariants.size;summary.distinctTargetInstances=allInstances.size;
 summary.searchIncomplete=summary.incompleteStarts>0||summary.incompleteTargets>0;
 same(loaded.files,fingerprints(b1),'B1 input changed during run');
 timings.totalMs=Math.round(performance.now()-begin);
 fs.writeFileSync(path.join(out,'timings.json'),json(timings),{flag:'wx'});
 fs.writeFileSync(path.join(out,'summary.pending'),json(summary),{flag:'wx'});
 fs.renameSync(path.join(out,'summary.pending'),path.join(out,'summary.json'));
 return summary;
}
