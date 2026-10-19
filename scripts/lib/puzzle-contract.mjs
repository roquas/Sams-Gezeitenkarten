// Offline service contract. No Node, DOM, transport or solver execution here.
import {puzzleSchema,schemaErrors} from '../../src/puzzles/schema.mjs';
import {validatePuzzle} from '../../src/puzzles/validate.mjs';

export class DefinitionError extends Error{
 constructor(phase,errors){super(`${phase}: ${errors.join('; ')}`);this.name='DefinitionError';this.phase=phase;this.errors=errors;}
}
export function requireContract({rulesVersion,schemaVersion,dataVersion}){
 if(rulesVersion!=='gezeitenkarten-1')throw new DefinitionError('version',['unsupported rulesVersion']);
 if(schemaVersion!==1)throw new DefinitionError('version',['unsupported schemaVersion']);
 // Content revisions are explicit too: only the current revision is registered.
 if(dataVersion!==1)throw new DefinitionError('version',['unregistered dataVersion']);
 return {rulesVersion,schemaVersion,dataVersion};
}
export function validateDefinition(document,{rulesVersion}={}){
 const versions=requireContract({rulesVersion,schemaVersion:document?.schemaVersion,dataVersion:document?.dataVersion});
 const errors=schemaErrors(document,puzzleSchema);
 if(errors.length)throw new DefinitionError('structure',errors);
 try{validatePuzzle(document);}
 catch(error){throw new DefinitionError(error.errors?.every(e=>e.startsWith('solution:'))?'target':'semantics',error.errors??[error.message]);}
 return {...versions,structural:true,semantic:true,targetRoute:document.solution?'valid':'absent'};
}

export function validateLogicDefinition(definition,{rulesVersion}={}){
 const versions=requireContract({rulesVersion,schemaVersion:definition?.schemaVersion,dataVersion:definition?.dataVersion});
 const errors=schemaErrors(definition?.logic,puzzleSchema.properties.logic,'$.logic');
 if(errors.length)throw new DefinitionError('structure',errors);
 const {logic}=definition;
 // Adapt logic to the existing validator; editorial data are never inspected.
 // These placeholders are transient validation inputs, not a second puzzle store.
 validateDefinition({schemaVersion:versions.schemaVersion,dataVersion:versions.dataVersion,id:'logic-validation',logic,presentation:{title:'Validation',intro:['Validation'],
  places:Object.fromEntries(Object.keys(logic.places).map(id=>[id,id])),
  clues:Object.fromEntries(logic.clues.map(c=>[c.id,c.id])),hints:[],background:'meer-pergament',overlays:[]}},
 {rulesVersion});
 return versions;
}
