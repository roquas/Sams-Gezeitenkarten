// Offline, deliberately incomplete propagation. No solver, routes or answer input.
import {createRules} from '../../src/engine/puzzle.mjs';
import {adjacent,distance} from '../../src/engine/hex.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';

const TYPES=['position','distanceToPlace','direction','turn','distanceBetweenHours','countDistanceToPlace'];
const unique=items=>[...new Set(items)];
const edge=(a,b)=>`${a}>${b}`;

export function localDeduction(logic,{givens=[]}={}){
 // Unsupported clue types are reported, never silently treated as constraints.
 validateLogic({...logic,clues:logic.clues.filter(c=>TYPES.includes(c.type))});
 const rules=createRules(logic),cells=rules.cells.filter(c=>!rules.blocked.has(c));
 const domains=Array.from({length:logic.steps+1},()=>[...cells]);
 const edges=Array.from({length:logic.steps},()=>cells.flatMap(a=>cells.filter(b=>adjacent(a,b)).map(b=>edge(a,b))));
 const domainReason=domains.map(()=>null),edgeReason=edges.map(()=>null),trace=[];
 let round=0;
 const deps=(hours,boundaries=[])=>unique([...hours.map(h=>domainReason[h]),...boundaries.map(h=>edgeReason[h-1])].filter(Boolean));
 function restrict(kind,hour,allowed,rule,clueIds,premises,explanation){
  const collection=kind==='field'?domains:edges,index=kind==='field'?hour:hour-1;
  const before=collection[index],keep=new Set(allowed),after=before.filter(x=>keep.has(x));
  if(after.length===before.length)return;
  const id='D'+(trace.length+1);
  trace.push({id,round,rule,clueIds,premises,kind,hour,before:[...before],after,
   removed:before.filter(x=>!keep.has(x)),fixed:after.length===1?after[0]:null,explanation});
  collection[index]=after;
  (kind==='field'?domainReason:edgeReason)[index]=id;
 }
 const field=(h,allowed,rule,ids,parents,why)=>restrict('field',h,allowed,rule,ids,parents,why);
 const transition=(h,allowed,rule,ids,parents,why)=>restrict('transition',h,allowed,rule,ids,parents,why);
 field(0,[logic.start],'start',[],[],'Vorgegebene Startposition.');
 for(const given of givens){
  if(!Number.isInteger(given.hour)||given.hour<0||given.hour>logic.steps||!cells.includes(given.cell))throw Error('Invalid diagnostic given');
  field(given.hour,[given.cell],'diagnostic-given',[],deps([given.hour]),'Zusätzliche experimentelle Vorgabe, kein Hinweis des Originals.');
 }
 const unsupported=logic.clues.filter(c=>!TYPES.includes(c.type)).map(c=>({clueId:c.id,type:c.type,reason:'Keine implementierte lokale Regel.'}));
 do{
  const previous=trace.length;round++;
  // A fixed cell cannot be visited at any other hour. No global all-different search.
  for(let h=0;h<domains.length;h++)if(domains[h].length===1){
   const cell=domains[h][0];
   for(let other=0;other<domains.length;other++)if(other!==h)
    field(other,domains[other].filter(c=>c!==cell),'no-revisit-singleton',[],deps([h,other]),`Stunde ${h} belegt ${cell}; Wiederbesuche sind verboten.`);
  }
  // Arc consistency of adjacent hours, using explicit remaining transitions.
  for(let h=1;h<domains.length;h++){
   transition(h,edges[h-1].filter(e=>{const [a,b]=e.split('>');return domains[h-1].includes(a)&&domains[h].includes(b);}),
    'transition-endpoints',[],deps([h-1,h],[h]),'Übergänge benötigen zwei noch mögliche Endpunkte.');
   const pairs=edges[h-1].map(e=>e.split('>'));
   field(h-1,pairs.map(p=>p[0]),'successor-support',[],deps([h-1,h],[h]),`Ohne möglichen Nachfolger in Stunde ${h} entfällt das Feld.`);
   field(h,pairs.map(p=>p[1]),'predecessor-support',[],deps([h-1,h],[h]),`Ohne möglichen Vorgänger in Stunde ${h-1} entfällt das Feld.`);
  }
  for(const clue of logic.clues){
   const ids=[clue.id],h=clue.hour;
   if(clue.type==='position'||clue.type==='distanceToPlace'){
    field(h,domains[h].filter(c=>clue.type==='position'?c===clue.cell:rules.distanceToPlace(c,clue.placeId)===clue.distance),
     'direct-hour',ids,deps([h]),'Direkte Orts- oder Mindestdistanzbedingung dieser Stunde.');
   }else if(clue.type==='direction'){
    const route=[];
    transition(h,edges[h-1].filter(e=>{[route[h-1],route[h]]=e.split('>');return rules.matches(route,clue);}),
     'course',ids,deps([h-1,h],[h]),'Nur benachbarte Feldpaare mit dem vorgegebenen Kurs.');
   }else if(clue.type==='turn'){
    // Only two joined edges, never a complete route (including hour 0).
    const left=[],right=[],route=[];
    for(const incoming of edges[h-2])for(const outgoing of edges[h-1]){
     const [a,b]=incoming.split('>'),[c,d]=outgoing.split('>');
     if(b!==c||a===d)continue;
     [route[h-2],route[h-1],route[h]]=[a,b,d];
     if(rules.matches(route,clue)){left.push(incoming);right.push(outgoing);}
    }
    const parents=deps([h-2,h-1,h],[h-1,h]);
    transition(h-1,left,'turn-two-edges',ids,parents,'Zwei verbundene Kanten müssen die vorgegebene Drehung bilden.');
    transition(h,right,'turn-two-edges',ids,parents,'Zwei verbundene Kanten müssen die vorgegebene Drehung bilden.');
   }else if(clue.type==='distanceBetweenHours'){
    const [a,b]=clue.hours,parents=deps([a,b]);
    // Binary geometric support; intermediate hours and paths are NOT enumerated.
    const pairs=domains[a].flatMap(x=>domains[b].filter(y=>(a===b?x===y:x!==y)&&distance(x,y)===clue.distance).map(y=>[x,y]));
    field(a,pairs.map(p=>p[0]),'distance-pair',ids,parents,'Für das Feld muss ein geometrisch passendes Feld der anderen Stunde verbleiben.');
    field(b,pairs.map(p=>p[1]),'distance-pair',ids,parents,'Für das Feld muss ein geometrisch passendes Feld der anderen Stunde verbleiben.');
   }else if(clue.type==='countDistanceToPlace'){
    const hours=Array.from({length:clue.toHour-clue.fromHour+1},(_,i)=>clue.fromHour+i);
    const match=c=>rules.distanceToPlace(c,clue.placeId)===clue.distance;
    const bounds=hours.map(hour=>({hour,yes:domains[hour].filter(match),no:domains[hour].filter(c=>!match(c))}));
    const min=bounds.filter(b=>b.yes.length&&!b.no.length).length,max=bounds.filter(b=>b.yes.length).length;
    const parents=deps(hours);
    if(min>clue.count||max<clue.count){
     field(hours[0],[],'count-contradiction',ids,parents,`Zählziel ${clue.count} liegt außerhalb [${min}, ${max}].`);
    }else for(const b of bounds)if(b.yes.length&&b.no.length){
     if(min===clue.count)field(b.hour,b.no,'count-bounds',ids,parents,`${min} sichere Treffer erfüllen bereits das Zählziel ${clue.count}; kein weiterer Treffer erlaubt.`);
     else if(max===clue.count)field(b.hour,b.yes,'count-bounds',ids,parents,`Nur ${max} Stunden können treffen, genau ${clue.count} sind gefordert; jede muss treffen.`);
    }
   }
  }
  if(trace.length===previous)break;
 }while(!domains.some(d=>!d.length));
 const inconsistent=domains.some(d=>!d.length);
 return {status:inconsistent?'inconsistent':'fixed-point',domains,transitions:edges,trace,unsupported,
  // A singleton is fixed; an empty domain is contradictory, never "fixed".
  fixedHours:inconsistent?[]:domains.flatMap((d,hour)=>d.length===1?[{hour,cell:d[0]}]:[]),
  fixedTransitions:inconsistent?[]:edges.flatMap((d,i)=>d.length===1?[{hour:i+1,transition:d[0]}]:[])};
}
