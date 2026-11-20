// Candidate preparation only. Historical definitions and engine predicates are
// never rewritten. Hours are inclusive, including S0 where the caller permits it.
import {logicSchema,schemaErrors} from '../../src/puzzles/schema.mjs';
import {clueKey} from './puzzle-clues.mjs';

export const COUNT_NORMALIZATION='count-distance-extremes-1';
const compare=(a,b)=>a<b?-1:a>b?1:0;
const order=(a,b)=>compare(clueKey(a),clueKey(b))||compare(a.id,b.id);
const mode=c=>c.type!=='countDistanceToPlace'?null:c.count===0?'zero':
 c.count===c.toHour-c.fromHour+1?'all':null;
const groupKey=c=>JSON.stringify([c.type,c.placeId,c.distance,mode(c)]);
function validate(clues){
 if(!Array.isArray(clues))throw Error('Normalization requires a clue array');
 const ids=new Set();
 for(const c of clues){
  const errors=schemaErrors(c,logicSchema.properties.clues.items);
  if(errors.length)throw Error('Normalization: '+errors.join('; '));
  if(ids.has(c.id))throw Error('Normalization: duplicate source clue ID');
  ids.add(c.id);
  if(c.type==='countDistanceToPlace'&&(c.fromHour>c.toHour||c.count>c.toHour-c.fromHour+1))
   throw Error('Normalization: invalid inclusive count interval');
 }
}
function union(a,b){
 if(!mode(a)||groupKey(a)!==groupKey(b)||a.fromHour>b.toHour+1||b.fromHour>a.toHour+1)return null;
 const fromHour=Math.min(a.fromHour,b.fromHour),toHour=Math.max(a.toHour,b.toHour);
 return {...a,fromHour,toHour,count:mode(a)==='zero'?0:toHour-fromHour+1};
}

export function normalizeCountClues(clues){
 validate(clues);
 const rawClues=structuredClone(clues).sort(order),groups=new Map(),entries=[];
 for(const clue of rawClues){
  if(!mode(clue)){entries.push({clue,sources:[clue]});continue;}
  const key=groupKey(clue);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(clue);
 }
 for(const group of groups.values()){
  group.sort((a,b)=>a.fromHour-b.fromHour||a.toHour-b.toHour||order(a,b));
  let current=null;
  for(const clue of group){
   const merged=current&&union(current.clue,clue);
   if(merged){current.clue=merged;current.sources.push(clue);}
   else{current={clue:{...clue},sources:[clue]};entries.push(current);}
  }
 }
 entries.sort((a,b)=>order(a.clue,b.clue));
 const normalized=entries.map(({clue},i)=>({...clue,id:'H'+(i+1)}));
 return {clues:normalized,changed:entries.some(e=>e.sources.length>1),
  provenance:{format:COUNT_NORMALIZATION,rawClues,
   outputs:entries.map((entry,i)=>({clueId:normalized[i].id,
    rule:entry.sources.length>1?mode(entry.clue)+'-union':'unchanged',
    sources:entry.sources.sort(order).map(c=>({id:c.id,key:clueKey(c)}))}))}};
}

// Lazy solver tables require a fixed index universe. Close ONLY extreme-count
// intervals under the same safe union, so every possible selected subset can
// refer to its merged clue in the existing, single budgeted solver. No truth
// tests, route enumeration or selection of these auxiliary clues occurs here.
// The schema bounds each group to at most 28 intervals (hours 0..6).
export function countNormalizationPool(clues){
 validate(clues);
 const groups=new Map(),known=new Set(clues.map(clueKey)),extra=[];
 for(const clue of clues)if(mode(clue)){
  const key=groupKey(clue);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(clue);
 }
 for(const group of groups.values())for(let i=0;i<group.length;i++)for(let j=0;j<i;j++){
  const merged=union(group[i],group[j]);
  if(merged&&!known.has(clueKey(merged))){known.add(clueKey(merged));group.push(merged);extra.push(merged);}
 }
 const ids=new Set(clues.map(c=>c.id));let serial=0;
 return [...clues,...extra.sort(order).map(c=>{
  let id;do{id='N'+(++serial);}while(ids.has(id));ids.add(id);return {...c,id};
 })];
}
