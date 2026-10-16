import {initialState} from '../state/game-state.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {adjacent} from '../engine/hex.mjs';
export const storageKey=puzzle=>`gezeitenkarten-${puzzle.id}-v0.1`;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function restoreState(puzzle,value){
 const fresh=initialState(puzzle),rules=createRules(puzzle),cells=new Set(rules.cells);
 if(!object(value))return fresh;
 const route=value.route;
 if(!Array.isArray(route)||route.length<1||route.length>puzzle.steps+1||route[0]!==puzzle.start||new Set(route).size!==route.length||!route.every((id,i)=>cells.has(id)&&!rules.blocked.has(id)&&(!i||adjacent(route[i-1],id))))return fresh;
 const next={...fresh,route:[...route]};
 if(Number.isInteger(value.layer)&&value.layer>=1&&value.layer<=puzzle.steps)next.layer=value.layer;
 if(['maybe','yes','no','erase','clearAll','route'].includes(value.tool))next.tool=value.tool;
 for(const name of ['hideRouteMarks','showRouteNumbers','distanceMode'])if(typeof value[name]==='boolean')next[name]=value[name];
 if(next.distanceMode&&cells.has(value.distanceOrigin)&&!rules.blocked.has(value.distanceOrigin))next.distanceOrigin=value.distanceOrigin;
 if(object(value.marks))for(const [key,mark] of Object.entries(value.marks)){
  const [hour,id,...extra]=key.split(':');
  if(!extra.length&&/^[1-9][0-9]*$/.test(hour)&&Number(hour)<=puzzle.steps&&cells.has(id)&&['maybe','yes','no'].includes(mark))next.marks[key]=mark;
 }
 if(Array.isArray(value.hiddenHours))next.hiddenHours=[...new Set(value.hiddenHours.filter(h=>Number.isInteger(h)&&h>=1&&h<=puzzle.steps))];
 if(Array.isArray(value.doneClues))next.doneClues=[...new Set(value.doneClues.filter(id=>puzzle.clues.some(clue=>clue.id===id)))];
 for(const name of ['penalty','hintCount','hintPenalty'])if(Number.isSafeInteger(value[name])&&value[name]>=0)next[name]=value[name];
 next.hintPenalty=Math.min(next.penalty,next.hintCount*10);
 // Result HTML is transient: never insert persisted markup into the DOM.
 return next;
}
export function loadState(puzzle,storage){try{return restoreState(puzzle,JSON.parse(storage.getItem(storageKey(puzzle))||'null'));}catch{return initialState(puzzle);}}
export function saveState(puzzle,state,storage){try{storage.setItem(storageKey(puzzle),JSON.stringify(state));return true;}catch{return false;}}
