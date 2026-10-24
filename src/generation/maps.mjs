import {adjacent,cellsOf} from '../engine/hex.mjs';
import {validateMap} from '../engine/validate.mjs';
import {GEOMETRY} from '../puzzles/schema.mjs';
import {randomStream,validateSeed} from './random.mjs';
import {GenerationError,normalizeConfig,record} from './config.mjs';
import {analyzeMap,evaluateFilters} from './map-analysis.mjs';
import {normalizeCatalogProfile} from './catalog-profile.mjs';
export {GenerationError,normalizeConfig} from './config.mjs';

// Bump when the map sequence, stream domains, sampling, or retry order changes.
export const GENERATOR_VERSION='abstract-maps-1';
export const CATALOG_GENERATOR_VERSION='catalog-informed-maps-1';
const grid={columns:5,rows:5},cells=cellsOf(grid).sort();
const neighbors=new Map(cells.map(c=>[c,cells.filter(n=>adjacent(c,n))]));
const choose=(random,values)=>values[random.integer(values.length)];

function candidate(seed,config,attempt,profile){
 const stream=phase=>randomStream(seed,`${GENERATOR_VERSION}/${attempt}/${phase}`);
 const layout=stream('layout'),access=stream('passability'),placement=stream('placement');
 const preference=profile?randomStream(seed,`${CATALOG_GENERATOR_VERSION}/${attempt}/preference`):null;
 const footprintRandom=profile?randomStream(seed,`${CATALOG_GENERATOR_VERSION}/${attempt}/footprint`):null;
 const catalog=profile?{preferenceDraws:0,preferredPlacements:0,growthPlacements:0,catalogMisses:0,footprintChecks:0}:null;
 const count=config.objectCount.min+layout.integer(config.objectCount.max-config.objectCount.min+1);
 const sizes=[];let remaining=cells.length;
 for(let i=0;i<count;i++){
  const allowed=config.objectSizes.filter(size=>size<=remaining-(count-i-1)*config.objectSizes[0]);
  const size=choose(layout,allowed);sizes.push(size);remaining-=size;
 }
 const passability=sizes.map(()=>access.uint32()/0x100000000<config.passableProbability);
 const occupied=new Set(),objects=[];let placementAttempts=0;
 for(let i=0;i<count;i++){
  let placed=null;
  for(let trial=0;trial<config.maxPlacementAttempts;trial++){
   placementAttempts++;
   if(profile){
    catalog.preferenceDraws++;
    if(preference.integer(100)<profile.preferencePercent){
     const available=profile.placements.filter(p=>{
      catalog.footprintChecks++;
      return p.cells.length===sizes[i]&&p.passable===passability[i]&&p.cells.every(c=>!occupied.has(c));
     });
     if(available.length){placed=[...choose(footprintRandom,available).cells];catalog.preferredPlacements++;break;}
     catalog.catalogMisses++;
    }
   }
   const free=cells.filter(c=>!occupied.has(c)),shape=[choose(placement,free)];
   while(shape.length<sizes[i]){
    const frontier=[...new Set(shape.flatMap(c=>neighbors.get(c)))].filter(c=>!occupied.has(c)&&!shape.includes(c)).sort();
    if(!frontier.length)break;
    shape.push(choose(placement,frontier));
   }
   if(shape.length===sizes[i]){placed=shape.sort();if(catalog)catalog.growthPlacements++;break;}
  }
  if(!placed)return {map:null,placementAttempts,failedObject:i+1,...(catalog?{catalog}:{})};
  for(const c of placed)occupied.add(c);
  objects.push({id:'geo-'+String(i+1).padStart(2,'0'),cells:placed,passable:passability[i]});
 }
 return {map:validateMap({geometry:GEOMETRY,grid:{...grid},objects}),placementAttempts,...(catalog?{catalog}:{})};
}

export function generateMap(options={}){
 record(options,['seed','config','catalogProfile'],'generation');
 const {seed}=options;
 try{validateSeed(seed);}catch(error){throw new GenerationError('INVALID_CONFIG',error.message);}
 const config=normalizeConfig(options.config);
 const profile=options.catalogProfile===undefined?null:normalizeCatalogProfile(options.catalogProfile);
 const diagnostics={generatorVersion:profile?CATALOG_GENERATOR_VERSION:GENERATOR_VERSION,seed,config,attempts:0,placementAttempts:0,
  rejectedAttempts:0,unknownAttempts:0,rejectionCounts:{},attemptLog:[]};
 if(profile)diagnostics.catalogProfile=profile;
 const analysisOptions={...config.analysis,steps:[...new Set([...config.analysis.steps,...config.filters.routeSteps])].sort((a,b)=>a-b)};
 for(let attempt=1;attempt<=config.maxMapAttempts;attempt++){
  const result=candidate(seed,config,attempt,profile);diagnostics.attempts++;diagnostics.placementAttempts+=result.placementAttempts;
  const catalogLog=result.catalog?{catalog:result.catalog}:{};
  if(!result.map){
   diagnostics.rejectedAttempts++;
   diagnostics.rejectionCounts.PLACEMENT_EXHAUSTED=(diagnostics.rejectionCounts.PLACEMENT_EXHAUSTED??0)+1;
   diagnostics.attemptLog.push({attempt,status:'rejected',placementAttempts:result.placementAttempts,failedObject:result.failedObject,reasons:[{code:'PLACEMENT_EXHAUSTED'}],...catalogLog});
   continue;
  }
  const analysis=analyzeMap(result.map,analysisOptions),filter=evaluateFilters(analysis,config.filters);
  diagnostics.attemptLog.push({attempt,...filter,placementAttempts:result.placementAttempts,metrics:analysis.metrics,...catalogLog,
   routes:analysis.routes.map(({steps,status,eligibleStartCountLowerBound,eligibleStartCountExact,routeCountLowerBound,countExact,search})=>
    ({steps,status,eligibleStartCountLowerBound,eligibleStartCountExact,routeCountLowerBound,countExact,search}))});
  if(filter.status==='accepted')return {status:'generated',map:result.map,analysis,diagnostics};
  if(filter.status==='unknown')diagnostics.unknownAttempts++;else diagnostics.rejectedAttempts++;
  for(const reason of filter.reasons)diagnostics.rejectionCounts[reason.code]=(diagnostics.rejectionCounts[reason.code]??0)+1;
 }
 return {status:diagnostics.unknownAttempts?'inconclusive':'exhausted',map:null,analysis:null,diagnostics};
}
