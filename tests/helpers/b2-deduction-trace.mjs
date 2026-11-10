import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {adjacent,distance} from '../../src/engine/hex.mjs';

// Test-only checker for the existing local rules. Never propagate again or use
// complete solutions to fill in a missing justification edge.
export function verifyTrace(logic,local,solutions,{givens=[]}={}){
 const rules=createRules(logic),cells=rules.cells.filter(c=>!rules.blocked.has(c));
 const edges=cells.flatMap(a=>cells.filter(b=>adjacent(a,b)).map(b=>`${a}>${b}`));
 const initial=()=>({domains:Array.from({length:logic.steps+1},()=>[...cells]),
  transitions:Array.from({length:logic.steps},()=>[...edges])});
 const slot=(state,t)=>(t.kind==='field'?state.domains:state.transitions)[t.kind==='field'?t.hour:t.hour-1];
 const apply=(state,t)=>{
  const arrays=t.kind==='field'?state.domains:state.transitions,index=t.kind==='field'?t.hour:t.hour-1;
  arrays[index]=arrays[index].filter(x=>!t.removed.includes(x));
 };
 const chronological=initial(),seen=new Map(),clues=new Map(logic.clues.map(c=>[c.id,c]));
 for(const t of local.trace){
  const label=`${t.id} (${t.rule})`;
  assert.ok(!seen.has(t.id),`${label}: unique step ID`);
  assert.ok(['field','transition'].includes(t.kind),`${label}: known kind`);
  assert.ok(t.premises.every(p=>seen.has(p)),`${label}: premises precede their use`);
  assert.ok(t.clueIds.every(id=>clues.has(id)),`${label}: clues belong to this scenario`);
  const reachable=new Set();
  function visit(id){
   if(reachable.has(id))return;
   reachable.add(id);seen.get(id).premises.forEach(visit);
  }
  t.premises.forEach(visit);
  const state=initial();
  // Only ancestors supply restrictions. Other earlier steps stay unavailable.
  for(const [id,parent] of seen)if(reachable.has(id))apply(state,parent);
  assert.deepEqual(t.before,slot(chronological,t),`${label}: chronological before`);
  assert.deepEqual(slot(state,t),t.before,`${label}: reachable premises reconstruct before`);
  assert.ok(t.removed.length>0,`${label}: nonempty exclusion`);
  assert.ok(t.removed.every(x=>t.before.includes(x)),`${label}: excluded values were possible`);
  assert.deepEqual(t.after,t.before.filter(x=>!t.removed.includes(x)),`${label}: after`);
  assert.equal(t.fixed,t.after.length===1?t.after[0]:null,`${label}: fixed`);

  const {domains,transitions}=state,h=t.hour;
  const requireKind=kind=>assert.equal(t.kind,kind,`${label}: rule output kind`);
  const clueFor=(...types)=>{
   assert.equal(t.clueIds.length,1,`${label}: exactly one direct clue`);
   const clue=clues.get(t.clueIds[0]);
   assert.ok(types.includes(clue.type),`${label}: matching clue type`);
   return clue;
  };
  if(['start','diagnostic-given','no-revisit-singleton','transition-endpoints','successor-support','predecessor-support'].includes(t.rule))
   assert.deepEqual(t.clueIds,[],`${label}: structural rule`);
  let allowed;
  switch(t.rule){
   case 'start':
    requireKind('field');assert.equal(h,0);allowed=[logic.start];break;
   case 'diagnostic-given': {
    requireKind('field');const given=givens.find(g=>g.hour===h&&t.after.every(c=>c===g.cell));
    assert.ok(given,`${label}: explicit diagnostic given`);allowed=[given.cell];break;
   }
   case 'no-revisit-singleton':
    requireKind('field');allowed=domains[h].filter(c=>!domains.some((d,i)=>i!==h&&d.length===1&&d[0]===c));break;
   case 'transition-endpoints':
    requireKind('transition');allowed=transitions[h-1].filter(e=>{
     const [a,b]=e.split('>');return domains[h-1].includes(a)&&domains[h].includes(b);
    });break;
   case 'successor-support':
    requireKind('field');allowed=transitions[h].map(e=>e.split('>')[0]);break;
   case 'predecessor-support':
    requireKind('field');allowed=transitions[h-1].map(e=>e.split('>')[1]);break;
   case 'direct-hour': {
    requireKind('field');const c=clueFor('position','distanceToPlace');assert.equal(h,c.hour);
    allowed=domains[h].filter(x=>c.type==='position'?x===c.cell:rules.distanceToPlace(x,c.placeId)===c.distance);break;
   }
   case 'course': {
    requireKind('transition');const c=clueFor('direction');assert.equal(h,c.hour);
    allowed=transitions[h-1].filter(e=>{
     const route=[];[route[h-1],route[h]]=e.split('>');return rules.matches(route,c);
    });break;
   }
   case 'turn-two-edges': {
    requireKind('transition');const c=clueFor('turn');assert.ok(h===c.hour-1||h===c.hour);
    allowed=[];
    for(const incoming of transitions[c.hour-2])for(const outgoing of transitions[c.hour-1]){
     const [a,b]=incoming.split('>'),[middle,d]=outgoing.split('>');
     if(b!==middle||a===d)continue;
     const route=[];[route[c.hour-2],route[c.hour-1],route[c.hour]]=[a,b,d];
     if(rules.matches(route,c))allowed.push(h===c.hour-1?incoming:outgoing);
    }
    break;
   }
   case 'distance-pair': {
    requireKind('field');const c=clueFor('distanceBetweenHours'),[a,b]=c.hours;
    assert.ok(h===a||h===b);const other=h===a?b:a;
    allowed=domains[h].filter(x=>domains[other].some(y=>(h===other?x===y:x!==y)&&distance(x,y)===c.distance));break;
   }
   case 'count-bounds':
   case 'count-contradiction': {
    requireKind('field');const c=clueFor('countDistanceToPlace');
    assert.ok(h>=c.fromHour&&h<=c.toHour);
    const match=x=>rules.distanceToPlace(x,c.placeId)===c.distance;
    const interval=domains.slice(c.fromHour,c.toHour+1);
    const min=interval.filter(d=>d.length&&d.every(match)).length,max=interval.filter(d=>d.some(match)).length;
    if(t.rule==='count-contradiction'){
     assert.ok(min>c.count||max<c.count,`${label}: contradictory count bounds`);allowed=[];
    }else{
     assert.ok(domains[h].some(match)&&domains[h].some(x=>!match(x)),
      `${label}: count-bounds requires both hits and non-hits`);
     assert.ok(min<=c.count&&c.count<=max,`${label}: feasible count bounds`);
     assert.ok(min===c.count||max===c.count,`${label}: tight count bound`);
     allowed=domains[h].filter(x=>min===c.count?!match(x):match(x));
    }
    break;
   }
   default: assert.fail(`${label}: unchecked local rule`);
  }
  const justified=t.before.filter(x=>allowed.includes(x));
  assert.ok(t.removed.every(x=>!allowed.includes(x)),`${label}: reachable premises justify exclusions`);
  if(t.fixed)assert.deepEqual(justified,[t.fixed],`${label}: reachable premises justify fixation`);
  // Independent global soundness remains an additional check, never a premise.
  for(const route of solutions){
   const value=t.kind==='field'?route[h]:`${route[h-1]}>${route[h]}`;
   assert.ok(!t.removed.includes(value),`${label}: preserve every solution`);
   if(t.fixed)assert.equal(t.fixed,value,`${label}: solution agrees with fixation`);
  }
  apply(chronological,t);seen.set(t.id,t);
 }
 for(const property of ['domains','transitions'])
  assert.deepEqual(chronological[property].map(d=>[...d].sort()),local[property].map(d=>[...d].sort()));
}
