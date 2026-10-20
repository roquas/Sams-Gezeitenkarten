import {puzzleSchema,schemaErrors} from '../../src/puzzles/schema.mjs';
import {DefinitionError,requireContract,validateDefinition} from './puzzle-contract.mjs';

const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const publicProperties=Object.fromEntries(['schemaVersion','dataVersion','id','logic','presentation','resultTexts'].map(key=>[key,puzzleSchema.properties[key]]));
const identifier=prefix=>({type:'string',pattern:`^${prefix}-[A-Za-z0-9][A-Za-z0-9._-]*$`,maxLength:160});
export const publicPuzzleSchema=object({projectionSchemaVersion:{const:1},rulesVersion:{const:'gezeitenkarten-1'},
 identity:object({mapStructureId:identifier('map'),instanceId:identifier('inst'),variantId:identifier('var'),sourcePublicationId:identifier('pub')},['mapStructureId','instanceId','variantId']),
 puzzle:object(publicProperties,['schemaVersion','dataVersion','id','logic','presentation'])});

// Fixed leaf allowlists, not object spreads or deletion of known secret names.
const clone=value=>structuredClone(value);
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(value??{},key)).map(key=>[key,clone(value[key])]));
const sortedJson=value=>Array.isArray(value)?value.map(sortedJson):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortedJson(value[key])])):value;
const clueFields={direction:['hour','direction'],turn:['hour','degrees'],position:['hour','cell'],
 adjacentToPlace:['hour','place'],distanceToPlace:['hour','place','distance'],
 distanceBetweenHours:['hours','distance'],countAdjacentToPlace:['hours','place','count']};
function publicLogic(logic){
 const result=pick(logic,['start','steps','blocked']);
 if(Object.hasOwn(logic??{},'grid'))result.grid=pick(logic.grid,['columns','rows']);
 if(Object.hasOwn(logic??{},'places'))result.places=logic.places&&typeof logic.places==='object'&&!Array.isArray(logic.places)?
  Object.fromEntries(Object.entries(logic.places).map(([id,p])=>[id,pick(p,['kind','cells'])])):clone(logic.places);
 if(Object.hasOwn(logic??{},'clues'))result.clues=Array.isArray(logic.clues)?logic.clues.map(clue=>
  pick(clue,['id','type',...(Object.hasOwn(clueFields,clue?.type)?clueFields[clue.type]:[])])):clone(logic.clues);
 return result;
}
function publicPresentation(presentation){
 const result=pick(presentation,['title','intro','places','clues','hints','background']);
 if(Object.hasOwn(presentation??{},'overlays'))result.overlays=Array.isArray(presentation.overlays)?
  presentation.overlays.map(o=>pick(o,['asset','cells','w','h','dx','dy','opacity'])):clone(presentation.overlays);
 return result;
}
export function validatePublicPuzzle(value){
 const errors=schemaErrors(value,publicPuzzleSchema);
 if(errors.length)throw new DefinitionError('public-structure',errors);
 validateDefinition(value.puzzle,{rulesVersion:value.rulesVersion});
 return value;
}
export function projectPublicPuzzle(internal,{rulesVersion,identity}={}){
 requireContract({rulesVersion,schemaVersion:internal?.schemaVersion,dataVersion:internal?.dataVersion,declaredRulesVersion:internal?.rulesVersion});
 const puzzle=pick(internal,['schemaVersion','dataVersion','id']);
 puzzle.logic=publicLogic(internal.logic);puzzle.presentation=publicPresentation(internal.presentation);
 if(Object.hasOwn(internal,'resultTexts'))puzzle.resultTexts=internal.resultTexts&&typeof internal.resultTexts==='object'&&!Array.isArray(internal.resultTexts)?
  pick(internal.resultTexts,['correct','incorrect']):clone(internal.resultTexts);
 // Validate any internal target, but never copy it into the public structure.
 validateDefinition({...puzzle,...(Object.hasOwn(internal,'solution')?{solution:internal.solution}:{})},{rulesVersion});
 return sortedJson(validatePublicPuzzle({projectionSchemaVersion:1,rulesVersion,
  identity:pick(identity,['mapStructureId','instanceId','variantId','sourcePublicationId']),puzzle}));
}
