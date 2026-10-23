// Small fixed experimental sample; no production batch or publication pipeline.
import {pathToFileURL} from 'node:url';
import {generateMap,GENERATOR_VERSION} from '../src/generation/maps.mjs';

const add=(hist,key)=>{hist[key]=(hist[key]??0)+1;};
export function sampleMaps({filtered=false}={}){
 const config={objectCount:{min:3,max:8},objectSizes:[1,2,3,4],passableProbability:0.25,
  analysis:{steps:[3],maxNodes:3000},...(filtered?{filters:{routeSteps:[3],minLargestComponent:12}}:{})};
 const result={generatorVersion:GENERATOR_VERSION,seeds:{first:0,last:127},config,statuses:{},objectCounts:{},objectSizes:{},shapes:{},
  passableComponentCounts:{},blockedComponentCounts:{},occupiedCells:{},routeStatuses:{},
  attempts:0,placementAttempts:0,rejectionCounts:{},distinctMaps:0,examples:[]};
 const maps=new Set();
 for(let seed=0;seed<=127;seed++){
  const r=generateMap({seed,config});add(result.statuses,r.status);
  result.attempts+=r.diagnostics.attempts;result.placementAttempts+=r.diagnostics.placementAttempts;
  for(const [code,count] of Object.entries(r.diagnostics.rejectionCounts))result.rejectionCounts[code]=(result.rejectionCounts[code]??0)+count;
  if(!r.map)continue;
  maps.add(JSON.stringify(r.map));const m=r.analysis.metrics;
  add(result.objectCounts,m.objectCount);add(result.passableComponentCounts,m.passableComponentCount);add(result.blockedComponentCounts,m.blockedComponentCount);
  add(result.occupiedCells,m.occupiedCells);add(result.routeStatuses,r.analysis.routes[0].status);
  for(const o of m.objects){add(result.objectSizes,o.size);add(result.shapes,o.shape);}
  if(result.examples.length<3)result.examples.push({seed,map:r.map,passableComponentSizes:m.passableComponentSizes,steps:3,eligibleStarts:r.analysis.routes[0].eligibleStarts});
 }
 result.distinctMaps=maps.size;return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify({free:sampleMaps(),filtered:sampleMaps({filtered:true})},null,2));
