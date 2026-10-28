import {adjacent,cellsOf} from '../engine/hex.mjs';
import {validateMap} from '../engine/validate.mjs';
import {GEOMETRY} from '../puzzles/schema.mjs';
import {randomStream,validateSeed} from './random.mjs';
import {GenerationError,normalizeConfig,record} from './config.mjs';
import {analyzeMap,evaluateFilters,shapeSignature} from './map-analysis.mjs';
import {normalizeCatalogProfile} from './catalog-profile.mjs';
export {GenerationError,normalizeConfig} from './config.mjs';

// Bump when the map sequence, stream domains, sampling, or retry order changes.
export const GENERATOR_VERSION='abstract-maps-1';
export const CATALOG_GENERATOR_VERSION='catalog-informed-maps-1';
export const CONSTRAINED_GENERATOR_VERSION='catalog-compliant-maps-1';
const grid={columns:5,rows:5},cells=cellsOf(grid).sort();
const neighbors=new Map(cells.map(c=>[c,cells.filter(n=>adjacent(c,n))]));
const choose=(random,values)=>values[random.integer(values.length)];

function candidate(seed,config,attempt,profile){
 const constrained=profile?.version==='catalog-capacities-1';
 const stream=phase=>randomStream(seed,`${constrained?CONSTRAINED_GENERATOR_VERSION:GENERATOR_VERSION}/${attempt}/${phase}`);
 const layout=stream('layout'),access=stream('passability'),placement=stream('placement');
 const preference=profile?randomStream(seed,`${CATALOG_GENERATOR_VERSION}/${attempt}/preference`):null;
 const footprintRandom=profile?randomStream(seed,`${CATALOG_GENERATOR_VERSION}/${attempt}/footprint`):null;
 const catalog=profile?{preferenceDraws:0,preferredPlacements:0,growthPlacements:0,catalogMisses:0,footprintChecks:0}:null;
 const count=config.objectCount.min+layout.integer(config.objectCount.max-config.objectCount.min+1);
 const sizes=[];let remaining=cells.length;
 for(let i=0;!constrained&&i<count;i++){
  const allowed=config.objectSizes.filter(size=>size<=remaining-(count-i-1)*config.objectSizes[0]);
  const size=choose(layout,allowed);sizes.push(size);remaining-=size;
 }
 const passability=Array.from({length:count},()=>access.uint32()/0x100000000<config.passableProbability);
 const occupied=new Set(),excluded=new Set(),objects=[],used=new Map();let placementAttempts=0;
 const capacity=constrained?new Map(profile.capacities.map(g=>[Number(g.passable)+':'+g.shape,g.count])):null;
 const shapeKey=p=>Number(p.passable)+':'+shapeSignature(p.cells);
 for(let i=0;i<count;i++){
  let placed=null;
  for(let trial=0;trial<config.maxPlacementAttempts;trial++){
   placementAttempts++;
   if(constrained){
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
    placed=[...selected.cells];sizes.push(size);catalog.preferredPlacements++;
    const key=shapeKey(selected);used.set(key,(used.get(key)??0)+1);break;
   }
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
  for(const c of placed){occupied.add(c);if(constrained){excluded.add(c);for(const n of neighbors.get(c))excluded.add(n);}}
  objects.push({id:'geo-'+String(i+1).padStart(2,'0'),cells:placed,passable:passability[i]});
 }
 return {map:validateMap({geometry:GEOMETRY,grid:{...grid},objects},{separateObjects:constrained}),placementAttempts,...(catalog?{catalog}:{})};
}

export function generateMap(options={}){
 record(options,['seed','config','catalogProfile','mode'],'generation');
 const {seed}=options;
 try{validateSeed(seed);}catch(error){throw new GenerationError('INVALID_CONFIG',error.message);}
 const config=normalizeConfig(options.config);
 const profile=options.catalogProfile===undefined?null:normalizeCatalogProfile(options.catalogProfile);
 const constrained=options.mode==='catalog-compliant';
 if(options.mode!==undefined&&!constrained)throw new GenerationError('INVALID_CONFIG','Unsupported generation mode');
 if(constrained!==(profile?.version==='catalog-capacities-1'))throw new GenerationError('INVALID_CONFIG','catalog-compliant mode requires a capacity profile and vice versa');
 const diagnostics={generatorVersion:constrained?CONSTRAINED_GENERATOR_VERSION:profile?CATALOG_GENERATOR_VERSION:GENERATOR_VERSION,seed,config,attempts:0,placementAttempts:0,
  rejectedAttempts:0,unknownAttempts:0,rejectionCounts:{},attemptLog:[]};
 if(profile)diagnostics.catalogProfile=profile;
 const analysisOptions={...config.analysis,steps:[...new Set([...config.analysis.steps,...config.filters.routeSteps])].sort((a,b)=>a-b)};
 for(let attempt=1;attempt<=config.maxMapAttempts;attempt++){
  const result=candidate(seed,config,attempt,profile);diagnostics.attempts++;diagnostics.placementAttempts+=result.placementAttempts;
  const catalogLog=result.catalog?{catalog:result.catalog}:{};
  if(!result.map){
   diagnostics.rejectedAttempts++;
   const code=result.failedReason??'PLACEMENT_EXHAUSTED';
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
