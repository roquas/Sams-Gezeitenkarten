// B2 hint production only: parameter domains come from the existing contract,
// and truth is decided exclusively by the engine predicate.
import {logicSchema} from '../../src/puzzles/schema.mjs';
import {validateLogic,validateTarget} from '../../src/engine/validate.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {canonicalJson} from './content-hash.mjs';

export const clueKey=({id,...parameters})=>canonicalJson(parameters);
const range=schema=>Array.from({length:schema.maximum-schema.minimum+1},(_,i)=>i+schema.minimum);

function* parameters(type,p,map){
 const places=map.objects.map(o=>o.id).sort();
 const hours=range(p.hour??p.fromHour??p.hours.items);
 if(type==='position')for(const hour of hours)for(const cell of createRules({map}).cells)yield {hour,cell};
 if(type==='direction')for(const hour of hours)for(const direction of p.direction.enum)yield {hour,direction};
 if(type==='turn')for(const hour of hours)for(const degrees of p.degrees.enum)yield {hour,degrees};
 if(type==='distanceToPlace')for(const hour of hours)for(const placeId of places)for(const distance of range(p.distance))yield {hour,placeId,distance};
 if(type==='distanceBetweenHours')for(const a of hours)for(const b of hours.filter(b=>b>=a))for(const distance of range(p.distance))yield {hours:[a,b],distance};
 if(type==='countDistanceToPlace')for(const fromHour of hours)for(const toHour of hours.filter(h=>h>=fromHour))
  for(const placeId of places)for(const distance of range(p.distance))for(const count of range(p.count).filter(n=>n<=toHour-fromHour+1))
   yield {fromHour,toHour,placeId,distance,count};
}

export function generateTrueClues(logic,targetRoute,{maxClueParameters}){
 validateLogic(logic);validateTarget(logic,targetRoute);
 if(logic.steps!==6||logic.clues.length)throw Error('B2 requires six steps and no input clues');
 if(!Number.isSafeInteger(maxClueParameters)||maxClueParameters<1||maxClueParameters>200000)throw Error('Invalid maxClueParameters');
 const rules=createRules(logic),clues=[],seen=new Set(),byType={};let parametersExamined=0;
 // Round-robin parameter streams prevent a small budget from consuming an
 // entire large family before any other family can be considered.
 let active=logicSchema.properties.clues.items.oneOf.map(schema=>({type:schema.properties.type.const,
  iterator:parameters(schema.properties.type.const,schema.properties,logic.map)}));
 while(active.length){
  const next=[];
  for(const stream of active){
   const item=stream.iterator.next();if(item.done)continue;
   if(parametersExamined===maxClueParameters){validateLogic({...logic,clues});return {clues,parametersExamined,byType,completed:false};}
   parametersExamined++;
   const clue={id:'H'+(clues.length+1),type:stream.type,...item.value},key=clueKey(clue);
   if(!seen.has(key)&&rules.matches(targetRoute,clue)){seen.add(key);clues.push(clue);byType[clue.type]=(byType[clue.type]??0)+1;}
   next.push(stream);
  }
  active=next;
 }
 validateLogic({...logic,clues});
 return {clues,parametersExamined,byType,completed:true};
}
