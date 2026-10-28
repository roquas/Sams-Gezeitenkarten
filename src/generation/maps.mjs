import {adjacent,cellsOf} from '../engine/hex.mjs';
import {validateMap} from '../engine/validate.mjs';
import {GEOMETRY} from '../puzzles/schema.mjs';
import {randomStream,validateSeed} from './random.mjs';
import {GenerationError,normalizeConfig,record} from './config.mjs';
import {analyzeMap,evaluateFilters,shapeSignature} from './map-analysis.mjs';
import {normalizeCatalogProfile} from './catalog-profile.mjs';
export {GenerationError,normalizeConfig} from './config.mjs';

// Bump when the generation result contract, sampling or retry order changes.
export const GENERATOR_VERSION='catalog-compliant-maps-2';
// Preserve the established random domains; v2 simplifies diagnostics/config only.
const RANDOM_DOMAIN='catalog-compliant-maps-1';
const grid={columns:5,rows:5},cells=cellsOf(grid).sort();
const neighbors=new Map(cells.map(c=>[c,cells.filter(n=>adjacent(c,n))]));
const choose=(random,values)=>values[random.integer(values.length)];

function candidate(seed,config,attempt,profile){
 const stream=phase=>randomStream(seed,`${RANDOM_DOMAIN}/${attempt}/${phase}`);
 const layout=stream('layout'),access=stream('passability'),placement=stream('placement');
 const catalog={preferredPlacements:0,footprintChecks:0};
 const count=config.objectCount.min+layout.integer(config.objectCount.max-config.objectCount.min+1);
 const passability=Array.from({length:count},()=>access.uint32()/0x100000000<config.passableProbability);
 const occupied=new Set(),excluded=new Set(),objects=[],used=new Map();let placementAttempts=0;
 const capacity=new Map(profile.capacities.map(g=>[Number(g.passable)+':'+g.shape,g.count]));
 const shapeKey=p=>Number(p.passable)+':'+shapeSignature(p.cells);
 for(let i=0;i<count;i++){
  placementAttempts++;
  const matching=profile.placements.filter(p=>p.passable===passability[i]);
  const sized=matching.filter(p=>config.objectSizes.includes(p.cells.length)&&
   p.cells.length<=cells.length-occupied.size-(count-i-1)*config.objectSizes[0]);
  const stocked=sized.filter(p=>p.passable||(used.get(shapeKey(p))??0)<capacity.get(shapeKey(p)));
  const available=stocked.filter(p=>p.cells.every(c=>!excluded.has(c)));
  catalog.footprintChecks+=profile.placements.length;
  if(!available.length)return {map:null,placementAttempts,failedObject:i+1,catalog,
   failedReason:!matching.length?'CATALOG_PASSABILITY_UNAVAILABLE':!sized.length?'CATALOG_SIZE_UNAVAILABLE':
    !stocked.length?'CATALOG_CAPACITY_EXHAUSTED':'OBJECT_SPACING_EXHAUSTED'};
  const size=choose(layout,[...new Set(available.map(p=>p.cells.length))].sort((a,b)=>a-b));
  const selected=choose(placement,available.filter(p=>p.cells.length===size));
  const placed=[...selected.cells];catalog.preferredPlacements++;
  const key=shapeKey(selected);used.set(key,(used.get(key)??0)+1);
  for(const c of placed){occupied.add(c);excluded.add(c);for(const n of neighbors.get(c))excluded.add(n);}
  objects.push({id:'geo-'+String(i+1).padStart(2,'0'),cells:placed,passable:passability[i]});
 }
 return {map:validateMap({geometry:GEOMETRY,grid:{...grid},objects},{separateObjects:true}),placementAttempts,catalog};
}

export function generateMap(options={}){
 record(options,['seed','config','catalogProfile'],'generation');
 const {seed}=options;
 try{validateSeed(seed);}catch(error){throw new GenerationError('INVALID_CONFIG',error.message);}
 const config=normalizeConfig(options.config);
 const profile=normalizeCatalogProfile(options.catalogProfile);
 const diagnostics={generatorVersion:GENERATOR_VERSION,seed,config,attempts:0,placementAttempts:0,
  rejectedAttempts:0,unknownAttempts:0,rejectionCounts:{},attemptLog:[],catalogProfile:profile};
 const analysisOptions={...config.analysis,steps:[...new Set([...config.analysis.steps,...config.filters.routeSteps])].sort((a,b)=>a-b)};
 for(let attempt=1;attempt<=config.maxMapAttempts;attempt++){
  const result=candidate(seed,config,attempt,profile);diagnostics.attempts++;diagnostics.placementAttempts+=result.placementAttempts;
  const catalogLog={catalog:result.catalog};
  if(!result.map){
   diagnostics.rejectedAttempts++;
   const code=result.failedReason;
   diagnostics.rejectionCounts[code]=(diagnostics.rejectionCounts[code]??0)+1;
   diagnostics.attemptLog.push({attempt,status:'rejected',placementAttempts:result.placementAttempts,failedObject:result.failedObject,reasons:[{code}],...catalogLog});
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
