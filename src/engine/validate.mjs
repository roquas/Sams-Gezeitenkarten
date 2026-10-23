// Pure validation: no presentation, assets, transport, DOM or solver execution.
import {mapSchema,logicSchema,schemaErrors,RULES_VERSION} from '../puzzles/schema.mjs';
import {adjacent,cellsOf} from './hex.mjs';
import {createRules} from './puzzle.mjs';
export class DefinitionError extends Error{
 constructor(phase,errors){super(`${phase}: ${errors.join('; ')}`);this.name='DefinitionError';this.phase=phase;this.errors=errors;}
}
export function requireContract(definition,{rulesVersion=definition?.rulesVersion}={}){
 if(rulesVersion!==RULES_VERSION||definition?.rulesVersion!==RULES_VERSION)throw new DefinitionError('version',['unsupported or conflicting rulesVersion']);
 if(definition?.schemaVersion!==2)throw new DefinitionError('version',['unsupported schemaVersion']);
 if(!Number.isSafeInteger(definition?.dataVersion)||definition.dataVersion<1||definition.dataVersion>2147483647)throw new DefinitionError('version',['invalid dataVersion']);
 return {rulesVersion,schemaVersion:2,dataVersion:definition.dataVersion};
}
export function validateMap(map){
 const errors=schemaErrors(map,mapSchema,'map');
 if(errors.length)throw new DefinitionError('structure',errors);
 const ids=new Set(),occupied=new Set();
 for(const o of map.objects){
  if(ids.has(o.id))errors.push('map.objects: duplicate object ID '+o.id);ids.add(o.id);
  for(const c of o.cells){if(occupied.has(c))errors.push('map.objects: overlapping cell '+c);occupied.add(c);}
  const seen=new Set([o.cells[0]]),queue=[o.cells[0]];
  for(let i=0;i<queue.length;i++)for(const c of o.cells)if(!seen.has(c)&&adjacent(queue[i],c)){seen.add(c);queue.push(c);}
  if(seen.size!==o.cells.length)errors.push('map.objects.'+o.id+': cells must be edge-connected');
 }
 if(errors.length)throw new DefinitionError('semantics',errors);
 return map;
}
export function validateLogic(logic){
 const errors=schemaErrors(logic,logicSchema,'logic');
 if(errors.length)throw new DefinitionError('structure',errors);
 validateMap(logic.map);
 const blocked=new Set(logic.map.objects.filter(o=>!o.passable).flatMap(o=>o.cells));
 if(!logic.map.objects.some(o=>o.passable&&o.cells.includes(logic.start)))errors.push('logic.start: must lie on a passable object');
 if(logic.steps>=cellsOf(logic.map.grid).length-blocked.size)errors.push('logic.steps: too few passable cells');
 const ids=logic.clues.map(c=>c.id);
 if(new Set(ids).size!==ids.length)errors.push('logic.clues: duplicate clue ID');
 for(const c of logic.clues){
  const hours=c.hours??(c.type==='countDistanceToPlace'?[c.fromHour,c.toHour]:[c.hour]);
  if(hours.some(h=>h>logic.steps))errors.push(c.id+': hour exceeds route length');
  if(hours.length===2&&hours[0]>hours[1])errors.push(c.id+': reversed hour interval');
  if(c.placeId&&!logic.map.objects.some(o=>o.id===c.placeId))errors.push(c.id+': unknown object ID');
  if(c.type==='countDistanceToPlace'&&c.count>c.toHour-c.fromHour+1)errors.push(c.id+': count exceeds inclusive interval');
 }
 if(errors.length)throw new DefinitionError('semantics',errors);
 return logic;
}
export function validateLogicDefinition(definition,options={}){
 const versions=requireContract(definition,options);validateLogic(definition.logic);return versions;
}
export function validateTarget(logic,route){
 const rules=createRules(logic);
 if(!rules.legal(route))throw new DefinitionError('target',['solution: not a legal complete route']);
 if(!logic.clues.every(c=>rules.matches(route,c)))throw new DefinitionError('target',['solution: target violates clues']);
}
