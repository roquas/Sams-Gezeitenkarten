import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {generateBatchRecord,normalizeBatchOptions,createBatchSummary} from './lib/map-batch.mjs';
import {createCatalogProfile} from '../src/assets/assignment.mjs';
import {record} from '../src/generation/config.mjs';
import {axialShapeSignature} from '../src/generation/map-analysis.mjs';
import {geographicCandidates,verifiedAnchors} from '../src/assets/assignment.mjs';
import {loadReleasedAssetCatalog} from './lib/released-asset-catalog.mjs';

export const SAMPLE_CONFIG={objectCount:{min:3,max:8},objectSizes:[1,2,3,4],passableProbability:0.25};

// Small, fixed diagnostic experiment, deliberately no production batch CLI,
// route filters, timing thresholds, publication IDs or selected puzzle starts.
// This pure measurement accepts trusted/test contexts; it proves no approval.
export function sampleCatalogMaps(catalog,options={}){
 record(options,['seedCount','config'],'catalog sample');
 const {seedCount=128,config=SAMPLE_CONFIG}=options;
 if(!Number.isInteger(seedCount)||seedCount<1||seedCount>1024)throw RangeError('seedCount must be 1–1024');
 const profile=createCatalogProfile(catalog);
 const forms=new Map();
 for(const a of geographicCandidates(catalog)){
  const shape=axialShapeSignature(a.geometry.cells),key=a.passable+':'+shape;
  if(!forms.has(key))forms.set(key,{size:a.geometry.cells.length,passable:a.passable,shape,catalogAssets:0,eligibleAssets:0,verifiedAnchors:0});
  const f=forms.get(key),anchors=verifiedAnchors(catalog,a);f.catalogAssets++;f.eligibleAssets+=Number(anchors.length>0);f.verifiedAnchors+=anchors.length;
 }
 const report={catalogSha256:catalog.verification?.catalogSha256??null,backgroundId:catalog.backgroundId,seeds:{first:0,last:seedCount-1},config,
  catalog:{geographicAssets:geographicCandidates(catalog).length,eligibleAssets:catalog.verification?.assets.filter(a=>!a.error&&a.anchors.length).length??0,
   profilePlacements:profile.placements.length,
   preparation:{images:catalog.verification?.assets.length??0,
    allowedAnchors:catalog.verification?.assets.reduce((sum,a)=>sum+a.anchors.length,0)??0,
    rejectedImages:catalog.verification?.assets.filter(a=>a.error).length??0,
    rejectedAnchors:catalog.verification?.assets.reduce((sum,a)=>sum+(a.rejected?.length??0),0)??0},forms:[...forms.values()]}};
 const batchOptions=normalizeBatchOptions({targetCount:seedCount,maxAttempts:seedCount,seedStart:0,config});
 const totals=createBatchSummary(),accepted=createBatchSummary(),rejectionCounts={},examples=[];
 let acceptedCount=0;
 for(let index=0;index<seedCount;index++){
  const row=generateBatchRecord(index,batchOptions,catalog,profile);totals.record(row);
  if(row.error)throw Error('Catalog sample failed: '+row.error.message);
  if(row.decision==='accepted'){
   accepted.record(row);acceptedCount++;
   if(examples.length<3)examples.push(row);
  }else for(const reason of row.rejectionReasons)rejectionCounts[reason]=(rejectionCounts[reason]??0)+1;
 }
 report.attemptedCount=seedCount;report.acceptedCount=acceptedCount;report.rejectedCount=seedCount-acceptedCount;
 report.rejectionCounts=rejectionCounts;report.attempted=totals.summary;report.accepted=accepted.summary;report.examples=examples;

 return report;
}

// Approved diagnostic entry: accept identifiers, never caller-supplied contexts
// or provenance. Always establish approval through the release adapter itself.
export function main(argv=process.argv.slice(2)){
 if(!Array.isArray(argv)||argv.some(value=>typeof value!=='string'))throw Error('Expected command-line arguments, not a catalog context');
 const options=new Map();
 for(let i=0;i<argv.length;i+=2){
  const flag=argv[i],value=argv[i+1];
  if(!['--release','--background','--repository'].includes(flag)||options.has(flag)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+flag);
  options.set(flag,value);
 }
 for(const flag of ['--release','--background'])if(!options.has(flag))throw Error('Missing '+flag);
 const repositoryRoot=path.resolve(options.get('--repository')??fileURLToPath(new URL('../',import.meta.url)));
 const {catalog,provenance}=loadReleasedAssetCatalog({repositoryRoot,releaseId:options.get('--release'),backgroundId:options.get('--background')});
 return {...sampleCatalogMaps(catalog),provenance};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(main(),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
