import {schemaErrors,puzzleSchema} from './schema.mjs';
import {requireContract,validateLogic,validateTarget,DefinitionError} from '../engine/validate.mjs';
import {solvePuzzle} from '../engine/solver.mjs';
import {validatePlacements} from '../assets/library.mjs';
export class PuzzleError extends Error{
 constructor(errors){super('Rätsel konnte nicht geladen werden: '+errors.join('; '));this.name='PuzzleError';this.errors=errors;}
}
export function validateDefinition(document,options={}){
 const versions=requireContract(document,options),errors=schemaErrors(document,puzzleSchema);
 if(errors.length)throw new DefinitionError('structure',errors);
 validateLogic(document.logic);
 const {logic,presentation}=document;
 const ids=logic.map.objects.map(o=>o.id),clueIds=logic.clues.map(c=>c.id);
 if(Object.keys(presentation.objectNames).some(id=>!ids.includes(id)))errors.push('presentation.objectNames: unknown object');
 if(!clueIds.every(id=>Object.hasOwn(presentation.clueTexts,id))||Object.keys(presentation.clueTexts).some(id=>!clueIds.includes(id)))errors.push('presentation.clueTexts: missing or unknown clue reference');
 if(options.assetLibrary){
  try{errors.push(...validatePlacements(presentation.assetPlacements,options.assetLibrary,logic.map,presentation.background,options));}
  catch(error){throw new DefinitionError('semantics',error.errors??[error.message]);}
 }else if(presentation.assetPlacements.length)errors.push('presentation.assetPlacements: asset library required');
 if(errors.length)throw new DefinitionError('semantics',errors);
 if(Object.hasOwn(document,'solution'))validateTarget(logic,document.solution);
 return {...versions,structural:true,semantic:true,targetRoute:document.solution?'valid':'absent'};
}
export function validatePuzzle(document,options={}){validateDefinition(document,options);return document;}
// UI view of the same logic. No alternate rule model or stored answer is needed.
export function compilePuzzle(document,options={}){
 validatePuzzle(document,options);
 const analysis=solvePuzzle(document.logic);
 if(analysis.status!=='unique')throw new PuzzleError([`logic: ${analysis.count} Lösungen (${analysis.status}); only unique puzzles can be played`]);
 const {logic,presentation}=document;
 const background=options.assetLibrary?.backgrounds.find(b=>b.id===presentation.background);
 if(!background)throw new PuzzleError(['presentation.background: explicit asset catalog with matching background required']);
 return {...logic,id:document.id,schemaVersion:document.schemaVersion,rulesVersion:document.rulesVersion,dataVersion:document.dataVersion,
  objectNames:presentation.objectNames,clues:logic.clues.map(c=>({...c,text:presentation.clueTexts[c.id]})),
  title:presentation.title,intro:presentation.intro,hints:presentation.hints,
  background:{asset:background.image},assetPlacements:presentation.assetPlacements,assetLibrary:options.assetLibrary,resourceBaseUrl:options.resourceBaseUrl,
  solution:analysis.solutions[0],resultTexts:document.resultTexts??{},analysis};
}
