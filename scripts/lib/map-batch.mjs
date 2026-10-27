// Local Node orchestration. Geography, topology and assignment remain in their
// existing services; batch files are private handoff data, never puzzle DTOs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {isDeepStrictEqual} from 'node:util';
import {generateMap,normalizeConfig,GENERATOR_VERSION,CATALOG_GENERATOR_VERSION} from '../../src/generation/maps.mjs';
import {validateSeed} from '../../src/generation/random.mjs';
import {assignAssets,createCatalogProfile,ASSIGNMENT_VERSION,VERIFICATION_VERSION} from '../../src/assets/assignment.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {loadReleasedAssetCatalog,RELEASED_ASSET_CATALOG_VERSION} from './released-asset-catalog.mjs';

export const BATCH_FORMAT_VERSION=1;
export const SEED_SCHEDULE_VERSION='sequential-uint32-1';
export const PROGRAM_ROOT=fileURLToPath(new URL('../../',import.meta.url));
const assert=(ok,message)=>{if(!ok)throw Error('map-batch: '+message);};
const same=(a,b,message)=>assert(isDeepStrictEqual(a,b),message);
const json=value=>JSON.stringify(value,null,2)+'\n';
const add=(hist,key,n=1)=>{hist[key]=(Object.hasOwn(hist,key)?hist[key]:0)+n;};
const merge=(target,source)=>{for(const [key,n] of Object.entries(source))add(target,key,n);};
function keys(value,allowed,label,required=[]){
 assert(value&&Object.getPrototypeOf(value)===Object.prototype,label+' must be an object');
 assert(Object.keys(value).every(k=>allowed.includes(k))&&required.every(k=>Object.hasOwn(value,k)),label+': missing or unknown fields');
}

export function normalizeBatchOptions(options){
 keys(options,['count','seedStart','assignmentSeedStart','mode','config','preferencePercent'],'options',['count','seedStart']);
 const {count,seedStart}=options,assignmentSeedStart=options.assignmentSeedStart??seedStart,mode=options.mode??'free';
 assert(Number.isSafeInteger(count)&&count>=1,'count must be a positive safe integer');
 validateSeed(seedStart);validateSeed(assignmentSeedStart);
 assert(seedStart+count-1<=0xffffffff&&assignmentSeedStart+count-1<=0xffffffff,'seed schedule overflows uint32');
 assert(['free','catalog-informed'].includes(mode),'unsupported mode');
 const preferencePercent=mode==='catalog-informed'?(options.preferencePercent??75):null;
 assert(mode!=='free'||options.preferencePercent===undefined||options.preferencePercent===null,'preferencePercent requires catalog-informed mode');
 assert(preferencePercent===null||Number.isInteger(preferencePercent)&&preferencePercent>=0&&preferencePercent<=100,'preferencePercent must be 0–100');
 return {count,seedStart,assignmentSeedStart,mode,config:normalizeConfig(options.config),preferencePercent};
}

function programState(){
 const git=(...args)=>execFileSync('git',['-C',PROGRAM_ROOT,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 assert(git('status','--porcelain=v1','--untracked-files=all','--','src','scripts')==='',
  'program files under src/ and scripts/ must be clean and committed');
 return {commit:git('rev-parse','HEAD'),nodeVersion:process.version};
}
function versions(mode,profile){
 return {generator:GENERATOR_VERSION,catalogGenerator:mode==='catalog-informed'?CATALOG_GENERATOR_VERSION:null,
  assignment:ASSIGNMENT_VERSION,catalogProfile:profile?.version??null,pixelChecker:VERIFICATION_VERSION,
  releaseAdapter:RELEASED_ASSET_CATALOG_VERSION,rules:RULES_VERSION};
}
function profileFor(catalog,options){
 return options.mode==='catalog-informed'?createCatalogProfile(catalog,{preferencePercent:options.preferencePercent}):null;
}

// Trusted-context helper, like sampleCatalogMaps. Only runMapBatch/replayMapBatch
// establish approval themselves. Never turn an exception into assignment 'none'.
export function generateBatchRecord(index,options,catalog,catalogProfile=null){
 assert(Number.isSafeInteger(index)&&index>=0&&index<options.count,'index outside batch');
 const generationSeed=options.seedStart+index,assignmentSeed=options.assignmentSeedStart+index;
 const record={index,generationSeed,assignmentSeed,mapFingerprint:null,generation:null,assignment:null};
 let phase='generation';
 try{
  record.generation=generateMap({seed:generationSeed,config:options.config,...(catalogProfile?{catalogProfile}:{})});
  if(record.generation.map){
   record.mapFingerprint=mapFingerprint(record.generation.map);phase='assignment';
   record.assignment=assignAssets({map:record.generation.map,seed:assignmentSeed,catalog});
  }
 }catch(error){record.error={phase,code:error.code??(phase==='assignment'?'ASSIGNMENT_ERROR':'GENERATION_ERROR'),message:error.message};}
 return record;
}

// Aggregate the analysis already returned by generateMap. No graph traversal,
// second analyzeMap call, new route search, quality score or selection here.
export function createBatchSummary(requestedCount){
 const fingerprints=new Set();
 const summary={batchFormatVersion:BATCH_FORMAT_VERSION,status:'incomplete',requestedCount,processedCount:0,
  geography:{statuses:{},distinctMaps:0,duplicateMaps:0,emptyMaps:0,mapAttempts:0,placementAttempts:0,rejectionCounts:{},profileWork:{},
   histograms:Object.fromEntries(['objectCount','passableObjects','blockedObjects','occupiedCells','waterCells','landFraction','waterFraction',
    'passableComponentCount','blockedComponentCount','coastEdges','passableComponentSizes','blockedComponentSizes',
    'objectSizes','shapesByPassability','boundaryCells','boundaryEdges','isolatedCells','deadEnds','articulationCells','startCells'].map(k=>[k,{}])),routes:{}},
  assignment:{statuses:{},nonemptyStatuses:{},objects:0,assigned:0,unassigned:0,rejectionCounts:{},assetTypes:{},assetUsage:{},
   unassignedShapes:{},unassignedSizesByPassability:{},candidateChecks:0,anchorChecks:0},errors:{}};
 return {summary,record(row){
  summary.processedCount++;
  if(row.error)add(summary.errors,row.error.phase);
  const g=row.generation,geo=summary.geography,a=row.assignment;
  if(g){
   add(geo.statuses,g.status);geo.mapAttempts+=g.diagnostics.attempts;geo.placementAttempts+=g.diagnostics.placementAttempts;
   merge(geo.rejectionCounts,g.diagnostics.rejectionCounts);
   for(const attempt of g.diagnostics.attemptLog)merge(geo.profileWork,attempt.catalog??{});
   if(g.map){
    if(fingerprints.has(row.mapFingerprint))geo.duplicateMaps++;else fingerprints.add(row.mapFingerprint);
    geo.distinctMaps=fingerprints.size;if(!g.map.objects.length)geo.emptyMaps++;
    const analysis=g.analysis,m=analysis.metrics,h=geo.histograms;
    for(const key of ['objectCount','passableObjects','blockedObjects','occupiedCells','waterCells','landFraction','waterFraction',
     'passableComponentCount','blockedComponentCount','coastEdges'])add(h[key],m[key]);
    for(const key of ['passableComponentSizes','blockedComponentSizes'])for(const size of m[key])add(h[key],size);
    merge(h.objectSizes,m.objectSizes);
    for(const o of m.objects){add(h.shapesByPassability,o.passable+':'+o.shape);add(h.boundaryCells,o.boundaryCells);add(h.boundaryEdges,o.boundaryEdges);}
    for(const key of ['isolatedCells','deadEnds','articulationCells','startCells'])add(h[key],analysis[key].length);
    for(const r of analysis.routes){
     const totals=geo.routes[r.steps]??={statuses:{},routeCountLowerBound:0,inexactRouteCounts:0,
      eligibleStartCountLowerBound:0,inexactEligibleStartCounts:0,unknownStarts:0,nodesVisited:0};
     add(totals.statuses,r.status);totals.routeCountLowerBound+=r.routeCountLowerBound;totals.inexactRouteCounts+=Number(!r.countExact);
     totals.eligibleStartCountLowerBound+=r.eligibleStartCountLowerBound;totals.inexactEligibleStartCounts+=Number(!r.eligibleStartCountExact);
     totals.unknownStarts+=r.unknownStarts.length;totals.nodesVisited+=r.search.nodesVisited;
    }
   }
  }
  if(a){
   const totals=summary.assignment,d=a.diagnostics;add(totals.statuses,a.status);
   if(g.map.objects.length)add(totals.nonemptyStatuses,a.status);
   totals.objects+=d.objectCount;totals.assigned+=d.assignedCount;totals.unassigned+=d.unassignedCount;
   totals.candidateChecks+=d.candidateChecks;totals.anchorChecks+=d.anchorChecks;
   for(const key of ['rejectionCounts','assetTypes','assetUsage'])merge(totals[key],d[key]);
   for(const o of a.objects)if(o.status==='unassigned'){
    add(totals.unassignedShapes,o.passable+':'+o.shape);add(totals.unassignedSizesByPassability,o.passable+':'+o.size);
   }
  }
 },complete(){assert(summary.processedCount===requestedCount&&!Object.keys(summary.errors).length,'batch is incomplete');summary.status='completed';return summary;}};
}

export function runMapBatch({repositoryRoot=PROGRAM_ROOT,releaseId,backgroundId,out,options}){
 options=normalizeBatchOptions(options);
 const program=programState(),{catalog,provenance}=loadReleasedAssetCatalog({repositoryRoot,releaseId,backgroundId});
 const catalogProfile=profileFor(catalog,options);
 const manifest={batchFormatVersion:BATCH_FORMAT_VERSION,seedScheduleVersion:SEED_SCHEDULE_VERSION,
  options,catalogProfile,versions:versions(options.mode,catalogProfile),program,provenance};
 // Reserve exclusively after all setup validation. Never reuse an earlier run.
 fs.mkdirSync(out);
 fs.writeFileSync(path.join(out,'manifest.json'),json(manifest),{flag:'wx'});
 const file=fs.openSync(path.join(out,'candidates.jsonl'),'wx'),totals=createBatchSummary(options.count);
 try{
  for(let index=0;index<options.count;index++){
   const row=generateBatchRecord(index,options,catalog,catalogProfile);
   fs.writeFileSync(file,JSON.stringify(row)+'\n');totals.record(row);
   if(row.error)throw Error(`map-batch: attempt ${index} failed during ${row.error.phase}: ${row.error.message}`);
  }
 }finally{fs.closeSync(file);}
 const summary=totals.complete();
 // Only the final rename marks successful completion; a partial write or
 // process termination cannot leave an apparently completed summary.json.
 fs.writeFileSync(path.join(out,'summary.pending'),json(summary),{flag:'wx'});
 fs.renameSync(path.join(out,'summary.pending'),path.join(out,'summary.json'));
 return summary;
}

function validateManifest(manifest,program){
 keys(manifest,['batchFormatVersion','seedScheduleVersion','options','catalogProfile','versions','program','provenance'],'manifest',
  ['batchFormatVersion','seedScheduleVersion','options','catalogProfile','versions','program','provenance']);
 assert(manifest.batchFormatVersion===BATCH_FORMAT_VERSION,'unsupported batch format');
 assert(manifest.seedScheduleVersion===SEED_SCHEDULE_VERSION,'unsupported seed schedule version');
 keys(manifest.program,['commit','nodeVersion'],'program',['commit','nodeVersion']);
 assert(manifest.program.commit===program.commit,'program commit mismatch; use the recorded program checkout');
 const options=normalizeBatchOptions(manifest.options);same(options,manifest.options,'noncanonical saved options');
 same(manifest.versions,versions(options.mode,manifest.catalogProfile),'algorithm version mismatch');
 keys(manifest.provenance,['adapterVersion','releaseId','catalogId','sourceCommit','archiveCommit','backgroundId','catalogSha256'],'provenance',
  ['adapterVersion','releaseId','catalogId','sourceCommit','archiveCommit','backgroundId','catalogSha256']);
 return options;
}
async function readCandidate(batch,index){
 const input=fs.createReadStream(path.join(batch,'candidates.jsonl'));
 const lines=createInterface({input,crlfDelay:Infinity});
 try{
  let position=0;
  for await(const line of lines){
   const row=JSON.parse(line);assert(row.index===position,'candidate order/index mismatch');
   if(position++===index)return row;
  }
 }finally{lines.close();input.destroy();}
 throw Error('map-batch: candidate not present in stored results');
}

export async function replayMapBatch({repositoryRoot=PROGRAM_ROOT,batch,index,out}){
 const program=programState(),manifest=JSON.parse(fs.readFileSync(path.join(batch,'manifest.json'),'utf8'));
 const options=validateManifest(manifest,program);
 assert(Number.isSafeInteger(index)&&index>=0&&index<options.count,'index outside batch');
 const stored=await readCandidate(batch,index);
 const {releaseId,backgroundId,...saved}=manifest.provenance;
 const {catalog,provenance}=loadReleasedAssetCatalog({repositoryRoot,releaseId,backgroundId});
 const {archiveCommit:oldArchive,...oldStable}=saved,{archiveCommit:newArchive,...newStable}=provenance;
 same({...oldStable,releaseId,backgroundId},newStable,'release provenance mismatch');
 const catalogProfile=profileFor(catalog,options);
 same(catalogProfile,manifest.catalogProfile,'catalog profile mismatch');
 // Recheck against the derived profile, rather than trusting its saved version.
 same(manifest.versions,versions(options.mode,catalogProfile),'algorithm version mismatch');
 const actual=generateBatchRecord(index,options,catalog,catalogProfile);
 same(actual,stored,'replayed candidate differs from stored result');
 fs.writeFileSync(out,JSON.stringify(actual)+'\n',{flag:'wx'});
 return {status:'matched',index,mapFingerprint:actual.mapFingerprint};
}
