// Private offline B1 protocol. No puzzle publication, clue search or map generation.
import fs from 'node:fs';
import path from 'node:path';
import {readContactBatch} from './map-contact-sheet.mjs';
import {PROGRAM_ROOT,programState} from './map-batch.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {mapFingerprint,logicalFingerprints} from './publication-archive.mjs';
import {analyzeMap} from '../../src/generation/map-analysis.mjs';
import {normalizeAnalysisOptions} from '../../src/generation/config.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';

export const EXPERIMENT_FORMAT_VERSION=1;
export const ROUTE_STRATEGY='all-starts-six-steps-1';
export const ROUTE_ORDER='engine-row-major-1';
export const EXPERIMENT_STEPS=6;
const inputFiles=['manifest.json','summary.json','candidates.jsonl','accepted.jsonl'];
const assert=(ok,message)=>{if(!ok)throw Error('route-experiment: '+message);};
const json=value=>JSON.stringify(value,null,2)+'\n';
const identity=(kind,value)=>`gk-b1-${kind}-sha256:${sha256(canonicalJson(value))}`;
function optionsOnly(value,allowed){
 assert(value&&Object.getPrototypeOf(value)===Object.prototype,'options must be an object');
 assert(Object.keys(value).every(k=>allowed.includes(k)),'unknown option');
}
function routeBudget(maxNodes){
 assert(Number.isSafeInteger(maxNodes)&&maxNodes>0,'explicit positive integer route budget required');
 return normalizeAnalysisOptions({steps:[EXPERIMENT_STEPS],maxNodes}).maxNodes;
}

// Reuse the existing analysis, including component-size proofs and incomplete
// positive counts. Every eligible object cell is a start, even with no route.
export function analyzeRouteMap(map,options){
 optionsOnly(options,['maxNodesPerStart']);
 const maxNodesPerStart=routeBudget(options.maxNodesPerStart);
 const {routes,profile,...geography}=analyzeMap(map,{steps:[EXPERIMENT_STEPS],maxNodes:maxNodesPerStart});
 const result=routes[0],noStart=geography.startCells.length===0,fingerprint=mapFingerprint(map);
 return {steps:EXPERIMENT_STEPS,geography,
  ...result,status:noStart?'no-start':result.status,
  ...(noStart?{reason:'NO_ELIGIBLE_START'}:!result.search.completed?{reason:'SEARCH_BUDGET_EXCEEDED'}:{}),
  starts:result.starts.map(start=>({...start,
   routeSource:{mapFingerprint:fingerprint,start:start.cell,steps:EXPERIMENT_STEPS,order:ROUTE_ORDER}}))};
}

// B2 can request an ordinal in the SAME engine generator, with its own budget.
// Nothing calls this automatically during B1. No route cache or alternate DFS.
export function selectTargetRoute(map,options){
 optionsOnly(options,['start','routeIndex','maxNodes']);
 const {start,routeIndex}=options,maxNodes=routeBudget(options.maxNodes);
 assert(Number.isSafeInteger(routeIndex)&&routeIndex>=0,'routeIndex must be a nonnegative safe integer');
 const logic={map,start,steps:EXPERIMENT_STEPS,clues:[]};validateLogic(logic);
 const source={mapFingerprint:mapFingerprint(map),start,steps:EXPERIMENT_STEPS,order:ROUTE_ORDER,routeIndex};
 const budget={remaining:maxNodes};let routesVisited=0;
 try{
  for(const route of createRules(logic).routes([start],budget)){
   if(routesVisited++===routeIndex){
    const definition={schemaVersion:2,rulesVersion:RULES_VERSION,dataVersion:1,logic,solution:route};
    return {status:'selected',source,route:[...route],instanceFingerprint:logicalFingerprints(definition).instance,
     search:{maxNodes,nodesVisited:maxNodes-budget.remaining,routesVisited,completed:false}};
   }
  }
 }catch(error){if(budget.remaining>=0)throw error;
  return {status:'unknown',reason:'SEARCH_BUDGET_EXCEEDED',source,
   search:{maxNodes,nodesVisited:maxNodes,routesVisited,completed:false}};
 }
 return {status:'not-found',reason:'ROUTE_INDEX_OUT_OF_RANGE',source,
  search:{maxNodes,nodesVisited:maxNodes-budget.remaining,routesVisited,completed:true}};
}

function fingerprints(batch){
 return inputFiles.map(file=>({file,sha256:sha256(fs.readFileSync(path.join(batch,file)))}));
}

export async function runRouteExperiment(options){
 optionsOnly(options,['batch','acceptedIndices','maxNodesPerStart','out','repositoryRoot']);
 const {batch,acceptedIndices,out,repositoryRoot=PROGRAM_ROOT}=options;
 assert(typeof batch==='string'&&batch.length&&typeof out==='string'&&out.length,'batch and out are required');
 const outputPath=path.join(fs.realpathSync(path.dirname(path.resolve(out))),path.basename(path.resolve(out)));
 const relative=path.relative(fs.realpathSync(batch),outputPath);
 assert(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative),'output must be outside the input batch');
 const maxNodesPerStart=routeBudget(options.maxNodesPerStart),program=programState();
 // Pin exact input bytes, not directory names. The reader validates BOTH
 // streams, the release, assignments and summary, including unselected rows.
 const files=fingerprints(batch);
 const loaded=await readContactBatch({batch,acceptedIndices,repositoryRoot});
 assert(JSON.stringify(files)===JSON.stringify(fingerprints(batch)),'input changed while being validated');
 const filters=loaded.manifest.options.config.filters;
 assert(filters.routeSteps.length===0&&filters.minLargestComponent===0,'source batch uses suitability filters; an unfiltered batch is required');
 const experiment={experimentFormatVersion:EXPERIMENT_FORMAT_VERSION,strategy:ROUTE_STRATEGY,routeOrder:ROUTE_ORDER,
  rulesVersion:RULES_VERSION,steps:EXPERIMENT_STEPS,budgets:{maxNodesPerStart},program,
  input:{files,acceptedIndices:loaded.acceptedIndices}};
 const experimentId=identity('run',experiment);
 const manifest={...experiment,experimentId,input:{...experiment.input,batchManifest:loaded.manifest,batchSummary:loaded.summary}};
 fs.mkdirSync(out); // Exclusive reservation; never overwrite an existing run.
 fs.writeFileSync(path.join(out,'manifest.json'),json(manifest),{flag:'wx'});
 const output=fs.openSync(path.join(out,'maps.jsonl'),'wx');
 const summary={experimentFormatVersion:EXPERIMENT_FORMAT_VERSION,experimentId,status:'completed',
  mapCount:0,startCount:0,mapStatuses:{},startStatuses:{},routeCountLowerBound:0,countExact:true,
  incompleteMaps:0,incompleteStarts:0,search:{maxNodesPerStart,nodesVisited:0,totalNodeBudget:0}};
 const add=(counts,status)=>{counts[status]=(counts[status]??0)+1;};
 try{
  for(let i=0;i<loaded.rows.length;i++){
   const row=loaded.rows[i],acceptedIndex=loaded.acceptedIndices[i];
   const source={acceptedIndex,candidateIndex:row.index,generationSeed:row.generationSeed,assignmentSeed:row.assignmentSeed};
   const mapTrialId=identity('map',{experimentId,acceptedIndex,mapFingerprint:row.mapFingerprint});
   let analysis;
   try{analysis=analyzeRouteMap(row.generation.map,{maxNodesPerStart});}
   catch(error){
    fs.writeFileSync(output,JSON.stringify({experimentId,mapTrialId,source,mapFingerprint:row.mapFingerprint,
     status:'error',error:{phase:'route-analysis',name:error.name,message:error.message}})+'\n');
    throw error; // A defect is never a zero route count or a completed run.
   }
   const record={experimentId,mapTrialId,source,mapFingerprint:row.mapFingerprint,map:row.generation.map,
    assetPlacements:row.assignment.placements,...analysis,
    starts:analysis.starts.map(start=>({trialId:identity('start',{mapTrialId,start:start.cell}),...start}))};
   fs.writeFileSync(output,JSON.stringify(record)+'\n');
   summary.mapCount++;summary.startCount+=record.starts.length;
   add(summary.mapStatuses,record.status);
   summary.routeCountLowerBound+=record.routeCountLowerBound;summary.countExact&&=record.countExact;
   summary.incompleteMaps+=Number(!record.countExact);
   summary.search.nodesVisited+=record.search.nodesVisited;
   summary.search.totalNodeBudget+=record.starts.length*maxNodesPerStart;
   for(const start of record.starts){add(summary.startStatuses,start.status);summary.incompleteStarts+=Number(!start.countExact);}
  }
 }finally{fs.closeSync(output);}
 // Presence of summary.json means every selected map was processed. It does
 // not mean every search completed: countExact/incompleteStarts say that.
 fs.writeFileSync(path.join(out,'summary.pending'),json(summary),{flag:'wx'});
 fs.renameSync(path.join(out,'summary.pending'),path.join(out,'summary.json'));
 return summary;
}
