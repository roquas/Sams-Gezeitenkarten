import {cellsOf,adjacent,distance,direction,directions} from './hex.mjs';
export function createRules(puzzle){
 const cells=cellsOf(puzzle.map.grid),known=new Set(cells),blocked=new Set(puzzle.map.objects.filter(o=>!o.passable).flatMap(o=>o.cells));
 const placeCells=id=>{const object=puzzle.map.objects.find(o=>o.id===id);if(!object)throw Error('Unknown object '+id);return object.cells;};
 const distanceToPlace=(cell,id)=>Math.min(...placeCells(id).map(target=>distance(cell,target)));
 const legal=route=>Array.isArray(route)&&route.length===puzzle.steps+1&&route[0]===puzzle.start&&new Set(route).size===route.length&&route.every((cell,i)=>known.has(cell)&&!blocked.has(cell)&&(i===0||adjacent(route[i-1],cell)));
 const matches=(route,clue)=>{
  const at=hour=>route[hour];
  switch(clue.type){
   case 'position':return at(clue.hour)===clue.cell;
   case 'direction':return direction(at(clue.hour-1),at(clue.hour))===clue.direction;
   case 'turn':{const before=directions.indexOf(direction(at(clue.hour-2),at(clue.hour-1))),after=directions.indexOf(direction(at(clue.hour-1),at(clue.hour)));return before>=0&&after===(before+clue.degrees/60+6)%6;}
   case 'distanceToPlace':return distanceToPlace(at(clue.hour),clue.placeId)===clue.distance;
   case 'distanceBetweenHours':return distance(at(clue.hours[0]),at(clue.hours[1]))===clue.distance;
   case 'countDistanceToPlace':{let count=0;for(let h=clue.fromHour;h<=clue.toHour;h++)if(distanceToPlace(at(h),clue.placeId)===clue.distance)count++;return count===clue.count;}
   default:throw Error('Unsupported clue type '+clue.type);
  }
 };
 function* routes(path=[puzzle.start],budget={remaining:250000}){if(--budget.remaining<0)throw Error('Suchbudget überschritten; Eindeutigkeit nicht bewiesen');if(path.length===puzzle.steps+1){yield path;return;}for(const next of cells)if(!blocked.has(next)&&!path.includes(next)&&adjacent(path.at(-1),next))yield* routes([...path,next],budget);}
 return {cells,blocked,distanceToPlace,legal,matches,routes,solutions:()=>[...routes()].filter(route=>puzzle.clues.every(clue=>matches(route,clue)))};
}
