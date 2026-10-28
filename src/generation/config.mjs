export class GenerationError extends Error{
 constructor(code,message){super(message);this.name='GenerationError';this.code=code;}
}
const invalid=message=>{throw new GenerationError('INVALID_CONFIG',message);};
export function record(value,keys,path){
 if(!value||typeof value!=='object'||Array.isArray(value))invalid(path+' must be an object');
 for(const key of Object.keys(value))if(!keys.includes(key))invalid(path+': unknown option '+key);
}
export function integer(value,min,max,path){
 if(!Number.isSafeInteger(value)||value<min||value>max)invalid(`${path} must be an integer from ${min} to ${max}`);
 return value;
}
export function stepList(value,path){
 if(!Array.isArray(value))invalid(path+' must be an array');
 for(const step of value)integer(step,1,6,path);
 if(new Set(value).size!==value.length)invalid(path+' must not contain duplicates');
 return [...value].sort((a,b)=>a-b);
}
export function normalizeAnalysisOptions(options={}){
 record(options,['steps','maxNodes'],'analysis');
 return {steps:stepList(options.steps??[],'analysis.steps'),maxNodes:integer(options.maxNodes??10000,1,1000000,'analysis.maxNodes')};
}
export function normalizeFilters(filters={}){
 record(filters,['routeSteps','minLargestComponent'],'filters');
 return {routeSteps:stepList(filters.routeSteps??[],'filters.routeSteps'),
  minLargestComponent:integer(filters.minLargestComponent??0,0,25,'filters.minLargestComponent')};
}
export function normalizeConfig(config={}){
 record(config,['objectCount','objectSizes','passableProbability','maxMapAttempts','analysis','filters'],'config');
 const range=typeof config.objectCount==='number'?{min:config.objectCount,max:config.objectCount}:config.objectCount??{min:2,max:7};
 record(range,['min','max'],'objectCount');
 const objectCount={min:integer(range.min,0,25,'objectCount.min'),max:integer(range.max,0,25,'objectCount.max')};
 if(objectCount.min>objectCount.max)invalid('objectCount.min must not exceed max');
 const sizes=config.objectSizes??[1,2,3,4];
 if(!Array.isArray(sizes)||!sizes.length)invalid('objectSizes must be a nonempty array');
 for(const size of sizes)integer(size,1,25,'objectSizes');
 if(new Set(sizes).size!==sizes.length)invalid('objectSizes must not contain duplicates');
 const objectSizes=[...sizes].sort((a,b)=>a-b);
 if(objectCount.max*objectSizes[0]>25)invalid('area budget: maximum object count × minimum size exceeds 25 cells');
 if(objectCount.max>0&&objectSizes.at(-1)+(objectCount.min-1)*objectSizes[0]>25)invalid('area budget: largest size cannot fit with the minimum object count');
 const passableProbability=config.passableProbability??0.5;
 if(typeof passableProbability!=='number'||!Number.isFinite(passableProbability)||passableProbability<0||passableProbability>1)invalid('passableProbability must be from 0 to 1');
 return {objectCount,objectSizes,passableProbability,
  maxMapAttempts:integer(config.maxMapAttempts??20,1,1000,'maxMapAttempts'),
  analysis:normalizeAnalysisOptions(config.analysis),filters:normalizeFilters(config.filters)};
}
