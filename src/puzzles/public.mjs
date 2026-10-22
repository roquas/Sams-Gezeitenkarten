import {puzzleSchema,schemaErrors,RULES_VERSION} from './schema.mjs';
import {DefinitionError,requireContract} from '../engine/validate.mjs';
import {validateDefinition} from './validate.mjs';
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const publicProperties=Object.fromEntries(['schemaVersion','rulesVersion','dataVersion','id','logic','presentation','resultTexts'].map(key=>[key,puzzleSchema.properties[key]]));
const identifier=prefix=>({type:'string',pattern:`^${prefix}-[A-Za-z0-9][A-Za-z0-9._-]*$`,maxLength:160});
export const publicPuzzleSchema=object({projectionSchemaVersion:{const:2},rulesVersion:{const:RULES_VERSION},
 identity:object({mapStructureId:identifier('map'),instanceId:identifier('inst'),variantId:identifier('var'),sourcePublicationId:identifier('pub')},['mapStructureId','instanceId','variantId']),
 puzzle:object(publicProperties,['schemaVersion','rulesVersion','dataVersion','id','logic','presentation'])});
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(value??{},key)).map(key=>[key,structuredClone(value[key])]));
const sortedJson=value=>Array.isArray(value)?value.map(sortedJson):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortedJson(value[key])])):value;
const clueFields={direction:['hour','direction'],turn:['hour','degrees'],position:['hour','cell'],
 distanceToPlace:['hour','placeId','distance'],distanceBetweenHours:['hours','distance'],
 countDistanceToPlace:['fromHour','toHour','placeId','distance','count']};
function publicLogic(logic){
 const result=pick(logic,['start','steps']);
 result.map=pick(logic?.map,['geometry']);result.map.grid=pick(logic?.map?.grid,['columns','rows']);
 result.map.objects=logic?.map?.objects?.map(o=>pick(o,['id','cells','passable']));
 result.clues=logic?.clues?.map(c=>pick(c,['id','type',...(clueFields[c.type]??[])]));
 return result;
}
export function validatePublicPuzzle(value,options={}){
 const errors=schemaErrors(value,publicPuzzleSchema);
 if(errors.length)throw new DefinitionError('public-structure',errors);
 validateDefinition(value.puzzle,{...options,rulesVersion:value.rulesVersion});return value;
}
export function projectPublicPuzzle(internal,{identity,...options}={}){
 requireContract(internal,options);
 const puzzle=pick(internal,['schemaVersion','rulesVersion','dataVersion','id']);
 puzzle.logic=publicLogic(internal.logic);
 puzzle.presentation=pick(internal.presentation,['title','intro','objectNames','clueTexts','hints','background']);
 puzzle.presentation.assetPlacements=internal.presentation?.assetPlacements?.map(p=>pick(p,['id','assetId','anchor','objectId']));
 if(Object.hasOwn(internal,'resultTexts'))puzzle.resultTexts=pick(internal.resultTexts,['correct','incorrect']);
 validateDefinition({...puzzle,...(Object.hasOwn(internal,'solution')?{solution:internal.solution}:{})},options);
 return sortedJson(validatePublicPuzzle({projectionSchemaVersion:2,rulesVersion:puzzle.rulesVersion,
 identity:pick(identity,['mapStructureId','instanceId','variantId','sourcePublicationId']),puzzle},options));
}
