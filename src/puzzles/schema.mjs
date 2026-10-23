// One executable contract; exported verbatim as the published JSON Schemas.
export const RULES_VERSION='gezeitenkarten-2';
export const GEOMETRY='even-row-offset-pointy-v1';
const text={type:'string',minLength:1,maxLength:12000};
const id={type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$',maxLength:80};
const cell={type:'string',pattern:'^[A-E][1-5]$'};
const integer=(min,max)=>({type:'integer',minimum:min,maximum:max});
const list=(items,minItems=0,extra={})=>({type:'array',items,minItems,...extra});
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const dict=values=>({type:'object',propertyNames:id,additionalProperties:values});
const hour=integer(0,6),hours=list(hour,2,{maxItems:2});
export const mapSchema=object({geometry:{const:GEOMETRY},grid:object({columns:{const:5},rows:{const:5}}),
 objects:list(object({id,cells:list(cell,1,{uniqueItems:true}),passable:{type:'boolean'}}))});
export const placementSchema=object({id,assetId:id,anchor:cell,objectId:id},['id','assetId','anchor']);
const clue=(type,properties)=>object({id,type:{const:type},...properties});
export const logicSchema=object({map:mapSchema,start:cell,steps:integer(1,6),clues:list({oneOf:[
 clue('direction',{hour:integer(1,6),direction:{enum:['E','SE','SW','W','NW','NE']}}),
 clue('turn',{hour:integer(2,6),degrees:{enum:[-180,-120,-60,0,60,120,180]}}),
 clue('position',{hour,cell}),
 clue('distanceToPlace',{hour,placeId:id,distance:integer(0,8)}),
 clue('distanceBetweenHours',{hours,distance:integer(0,8)}),
 clue('countDistanceToPlace',{fromHour:hour,toHour:hour,placeId:id,distance:integer(0,8),count:integer(0,7)})
 ]})});
export const puzzleSchema={
 $schema:'https://json-schema.org/draft/2020-12/schema',
 $id:'https://example.invalid/gezeitenkarten/puzzle-v2.schema.json',
 title:'Gezeitenkarten puzzle v2 (5×5 chart, 1–6 hours)',
 ...object({schemaVersion:{const:2},rulesVersion:{const:RULES_VERSION},dataVersion:integer(1,2147483647),id,
 logic:logicSchema,
 presentation:object({title:text,intro:list(text,1),objectNames:dict(text),clueTexts:dict(text),hints:list(text),background:id,assetPlacements:list(placementSchema)}),
 solution:list(cell,2,{uniqueItems:true}),
 resultTexts:object({correct:text,incorrect:text},[]),
 metadata:object({kind:{enum:['demo','test','editorial']},source:text,difficulty:text},['kind','source'])
 },['schemaVersion','rulesVersion','dataVersion','id','logic','presentation'])
};

// Small JSON Schema evaluator for exactly the vocabulary used above; no DOM or eval.
export function schemaErrors(value,schema=puzzleSchema,path='$'){
 const errors=[],fail=message=>errors.push(`${path}: ${message}`);
 if(schema.oneOf){if(schema.oneOf.filter(s=>schemaErrors(value,s,path).length===0).length!==1)fail('keine eindeutig passende Variante (Hinweistyp/Parameter prüfen)');return errors;}
 if('const' in schema&&value!==schema.const)fail(`erwartet ${JSON.stringify(schema.const)}`);
 if(schema.enum&&!schema.enum.includes(value))fail('unbekannter Wert');
 const type=Array.isArray(value)?'array':value===null?'null':typeof value;
 if(schema.type&&!(schema.type==='integer'?Number.isSafeInteger(value):type===schema.type)){fail(`erwartet ${schema.type}`);return errors;}
 if(type==='number'){
  if(!Number.isFinite(value))fail('keine endliche Zahl');
  if(schema.minimum!==undefined&&value<schema.minimum)fail('zu klein');
  if(schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)fail('zu klein');
  if(schema.maximum!==undefined&&value>schema.maximum)fail('zu groß');
 }
 if(type==='string'){
  if(schema.minLength!==undefined&&value.length<schema.minLength)fail('Text fehlt');
  if(schema.maxLength!==undefined&&value.length>schema.maxLength)fail('Text zu lang');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('ungültiges Format');
 }
 if(type==='array'){
  if(value.length<(schema.minItems??0)||value.length>(schema.maxItems??Infinity))fail('ungültige Anzahl');
  if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('doppelte Werte');
  value.forEach((v,i)=>errors.push(...schemaErrors(v,schema.items??{},`${path}[${i}]`)));
 }
 if(type==='object'){
  for(const key of schema.required??[])if(!Object.hasOwn(value,key))fail(`Pflichtfeld ${key} fehlt`);
  for(const [key,v] of Object.entries(value)){
   if(schema.propertyNames)errors.push(...schemaErrors(key,schema.propertyNames,`${path}.${key}`));
   if(Object.hasOwn(schema.properties??{},key))errors.push(...schemaErrors(v,schema.properties[key],`${path}.${key}`));
   else if(schema.additionalProperties===false)fail(`unbekanntes Feld ${key}`);
   else if(typeof schema.additionalProperties==='object')errors.push(...schemaErrors(v,schema.additionalProperties,`${path}.${key}`));
  }
 }
 return errors;
}
