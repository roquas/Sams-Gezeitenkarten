import {cellsOf,adjacent,distance,direction,directions} from './hex.mjs';
export function createRules(puzzle){
 const cells=cellsOf(puzzle.grid),known=new Set(cells),blocked=new Set(puzzle.blocked);
 const placeCells=id=>{const p=puzzle.places[id];if(!p)throw Error('Unknown place '+id);return p.cells;};
 const coast=(cell,place)=>known.has(cell)&&!blocked.has(cell)&&placeCells(place).some(id=>adjacent(cell,id));
 const legal=route=>Array.isArray(route)&&route.length===puzzle.steps+1&&route[0]===puzzle.start&&new Set(route).size===route.length&&route.every((cell,i)=>known.has(cell)&&!blocked.has(cell)&&(i===0||adjacent(route[i-1],cell)));
 const matches=(route,clue)=>{
  const at=hour=>route[hour];
  switch(clue.type){
   case 'position':return at(clue.hour)===clue.cell;
   case 'direction':return direction(at(clue.hour-1),at(clue.hour))===clue.direction;
   case 'turn':{const before=directions.indexOf(direction(at(clue.hour-2),at(clue.hour-1))),after=directions.indexOf(direction(at(clue.hour-1),at(clue.hour)));return before>=0&&after===(before+clue.degrees/60+6)%6;}
   case 'adjacentToPlace':return coast(at(clue.hour),clue.place);
   case 'distanceToPlace':return placeCells(clue.place).some(id=>distance(at(clue.hour),id)===clue.distance);
   case 'distanceBetweenHours':return distance(at(clue.hours[0]),at(clue.hours[1]))===clue.distance;
   case 'countAdjacentToPlace':{let count=0;for(let h=clue.hours[0];h<=clue.hours[1];h++)if(coast(at(h),clue.place))count++;return count===clue.count;}
   default:throw Error('Unsupported clue type '+clue.type);
  }
 };
 function* routes(path=[puzzle.start],budget={remaining:250000}){if(--budget.remaining<0)throw Error('Suchbudget überschritten; Eindeutigkeit nicht bewiesen');if(path.length===puzzle.steps+1){yield path;return;}for(const next of cells)if(!blocked.has(next)&&!path.includes(next)&&adjacent(path.at(-1),next))yield* routes([...path,next],budget);}
 return {cells,blocked,coast,legal,matches,routes,solutions:()=>[...routes()].filter(route=>puzzle.clues.every(clue=>matches(route,clue)))};
}
