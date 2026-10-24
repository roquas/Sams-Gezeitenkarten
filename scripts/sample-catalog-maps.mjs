import fs from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {generateMap} from '../src/generation/maps.mjs';
import {assignAssets,createCatalogProfile} from '../src/assets/assignment.mjs';
import {axialShapeSignature} from '../src/generation/map-analysis.mjs';
import {geographicCandidates,verifiedAnchors} from '../src/assets/assignment.mjs';
import {prepareAssetCatalog} from './lib/asset-catalog.mjs';
import {mapFingerprint} from './lib/publication-archive.mjs';

const add=(h,key,n=1)=>{h[key]=(Object.hasOwn(h,key)?h[key]:0)+n;};
export const SAMPLE_CONFIG={objectCount:{min:3,max:8},objectSizes:[1,2,3,4],passableProbability:0.25};

// Small, fixed diagnostic experiment, deliberately no production batch CLI,
// route filters, timing thresholds, publication IDs or selected puzzle starts.
export function sampleCatalogMaps(catalog,{seedCount=128,config=SAMPLE_CONFIG,preferencePercent=75}={}){
 if(!Number.isInteger(seedCount)||seedCount<1||seedCount>1024)throw RangeError('seedCount must be 1–1024');
 const profile=createCatalogProfile(catalog,{preferencePercent});
 const forms=new Map();
 for(const a of geographicCandidates(catalog)){
  const shape=axialShapeSignature(a.geometry.cells),key=a.passable+':'+shape;
  if(!forms.has(key))forms.set(key,{size:a.geometry.cells.length,passable:a.passable,shape,catalogAssets:0,eligibleAssets:0,verifiedAnchors:0});
  const f=forms.get(key),anchors=verifiedAnchors(catalog,a);f.catalogAssets++;f.eligibleAssets+=Number(anchors.length>0);f.verifiedAnchors+=anchors.length;
 }
 const report={catalogSha256:catalog.verification?.catalogSha256??null,backgroundId:catalog.backgroundId,seeds:{first:0,last:seedCount-1},config,
  preferencePercent,catalog:{geographicAssets:geographicCandidates(catalog).length,eligibleAssets:catalog.verification?.assets.filter(a=>!a.error&&a.anchors.length).length??0,
   profilePlacements:profile.placements.length,
   preparation:{images:catalog.verification?.assets.length??0,
    allowedAnchors:catalog.verification?.assets.reduce((sum,a)=>sum+a.anchors.length,0)??0,
    rejectedImages:catalog.verification?.assets.filter(a=>a.error).length??0,
    rejectedAnchors:catalog.verification?.assets.reduce((sum,a)=>sum+(a.rejected?.length??0),0)??0},forms:[...forms.values()]},modes:{}};
 for(const mode of ['free','catalogInformed']){
  const summary={statuses:{},coverage:{},completeFraction:0,objects:0,assigned:0,unassigned:0,objectCounts:{},objectSizes:{},shapes:{},
   shapesByPassability:{},unassignedShapes:{},unassignedSizesByPassability:{},assetTypes:{},assetUsage:{},rejectionCounts:{},
   mapAttempts:0,placementAttempts:0,profileWork:{},assignmentCandidateChecks:0,assignmentAnchorChecks:0,distinctMaps:0,distinctShapes:0,examples:[]};
  const maps=new Set();
  for(let seed=0;seed<seedCount;seed++){
   const r=generateMap({seed,config,...(mode==='catalogInformed'?{catalogProfile:profile}:{})});
   add(summary.statuses,r.status);summary.mapAttempts+=r.diagnostics.attempts;summary.placementAttempts+=r.diagnostics.placementAttempts;
   for(const attempt of r.diagnostics.attemptLog)for(const [key,n] of Object.entries(attempt.catalog??{}))add(summary.profileWork,key,n);
   if(!r.map)continue;
   maps.add(JSON.stringify(r.map));add(summary.objectCounts,r.map.objects.length);
   const assignment=assignAssets({map:r.map,seed,catalog}),d=assignment.diagnostics;
   add(summary.coverage,assignment.status);summary.objects+=d.objectCount;summary.assigned+=d.assignedCount;summary.unassigned+=d.unassignedCount;
   summary.assignmentCandidateChecks+=d.candidateChecks;summary.assignmentAnchorChecks+=d.anchorChecks;
   for(const name of ['assetTypes','assetUsage','rejectionCounts'])for(const [key,n] of Object.entries(d[name]))add(summary[name],key,n);
   for(const o of assignment.objects){
    add(summary.objectSizes,o.size);add(summary.shapes,o.shape);add(summary.shapesByPassability,o.passable+':'+o.shape);
    if(o.status==='unassigned'){add(summary.unassignedShapes,o.passable+':'+o.shape);add(summary.unassignedSizesByPassability,o.passable+':'+o.size);}
   }
   if(seed<3||assignment.status==='complete'&&!summary.examples.some(e=>e.assignment.status==='complete'))summary.examples.push({seed,mapFingerprint:mapFingerprint(r.map),map:r.map,assignment});
  }
  summary.completeFraction=(summary.coverage.complete??0)/(summary.statuses.generated??1);
  summary.distinctMaps=maps.size;summary.distinctShapes=Object.keys(summary.shapes).length;
  report.modes[mode]=summary;
 }
 // Explicit narrow example to demonstrate complete coverage even when the
 // diverse size-1–4 experiment has no complete free map.
 const configExample={objectCount:4,objectSizes:[1],passableProbability:0.5},r=generateMap({seed:0,config:configExample});
 report.singleCellExample={seed:0,config:configExample,mapFingerprint:mapFingerprint(r.map),map:r.map,assignment:assignAssets({map:r.map,seed:0,catalog})};
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const library=JSON.parse(fs.readFileSync(new URL('../assets/catalog/library.json',import.meta.url)));
 const catalog=prepareAssetCatalog({library,backgroundId:'sea-blue-01',resourceRoot:root});
 console.log(JSON.stringify(sampleCatalogMaps(catalog),null,2));
}
