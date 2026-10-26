import {schemaErrors as evaluateSchema} from './json-schema.mjs';
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

// Preserve the public puzzle-default API; generic evaluation has no domain imports.
export function schemaErrors(value,schema=puzzleSchema,path='$'){return evaluateSchema(value,schema,path);}
