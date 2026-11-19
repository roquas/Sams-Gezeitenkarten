// Separate diagnostic enumeration. Its results are never local deduction premises.
import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {stateKey,evidenceBinding} from './b2-stage-diagnostics.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

export const ROUTE_FORMAT='b2-stage-routes-1';
export const ROUTE_BUDGET=250000;
export const DISPLAY_LIMIT=12;
// Fixed questions drawn from documented examples, never selected by a score.
export const ROUTE_PLAN={
 A:['H1'],C:['H1+H2'],D:['H1+H2+H3+H4+H5'],
 V1:['H3'],V2:['H3'],T02:['H1+H4'],T07:['H4+H5'],
 'T07-given-3':['H3+H6+H7'],
 'S03-01':['H2+H3+H6','H1+H2+H3+H4+H5+H6'],
 'S03-02':['H1+H4'], 'S03-03':['H3+H6'], 'S03-04':['H1+H5'],
 'S03-05':['H2+H3'], 'S03-06':['H1+H5+H6'], 'S03-07':['H2','H2+H3'],
 'S03-08':['H1+H2+H5','H2+H5+H6'], 'S03-09':['H2','H1+H2','H2+H3']};
const INTERVALS=[[0,3],[3,6],[1,5]];
const sorted=xs=>[...xs].sort();
const unique=xs=>sorted(new Set(xs));
const compatible=(route,p,edges=true)=>route.every((c,h)=>p.domains[h].includes(c)&&
 (!edges||!h||p.transitions[h-1].includes(`${route[h-1]}>${c}`)));
function commonEnds(routes,from,to){
 if(!routes.length)return {prefix:[],suffix:[]};
 const prefix=[],suffix=[];
 for(let h=from;h<=to&&routes.every(r=>r[h]===routes[0][h]);h++)prefix.push(routes[0][h]);
 for(let h=to;h>=from&&routes.every(r=>r[h]===routes[0][h]);h--)suffix.unshift(routes[0][h]);
 return {prefix,suffix};
}
function alternatives(values){
 const all=unique(values);
 return {count:all.length,complete:all.length<=DISPLAY_LIMIT,shown:all.slice(0,DISPLAY_LIMIT),
  allSha256:sha256(canonicalJson(all))};
}
function summarizeRoutes(routes){
 return {routeCount:routes.length,sections:INTERVALS.map(([fromHour,toHour])=>({fromHour,toHour,
  ...commonEnds(routes,fromHour,toHour),alternatives:alternatives(routes.map(r=>r.slice(fromHour,toHour+1).join('>')))}))};
}
function analyzeState(input,s,legal,rules){
 const clues=input.logic.clues.filter(c=>s.clueIds.includes(c.id));
 const exact=legal.filter(r=>clues.every(c=>rules.matches(r,c)));
 // Verify that route data really belong to the stored state, including every projection.
 const project=routes=>({domains:Array.from({length:7},(_,h)=>unique(routes.map(r=>r[h]))),
  transitions:Array.from({length:6},(_,h)=>unique(routes.map(r=>`${r[h]}>${r[h+1]}`)))});
 assert.equal(exact.length,s.exact.routeCount,'Stored exact route count disagrees');
 for(const [k,values] of Object.entries(project(exact)))assert.deepEqual(values,s.exact[k].map(sorted),'Stored exact projection disagrees');
 const fields=legal.filter(r=>compatible(r,s.local,false)),local=legal.filter(r=>compatible(r,s.local));
 const recombined=legal.filter(r=>compatible(r,s.exact));
 assert(exact.every(r=>compatible(r,s.local)),'Unsound local projection');
 const pairGaps=[];
 for(let fromHour=0;fromHour<=4;fromHour++)for(let toHour=fromHour+2;toHour<=6;toHour++){
  const pairs=rs=>unique(rs.map(r=>`${r[fromHour]}>${r[toHour]}`));
  const supported=pairs(exact),unsupported=pairs(recombined).filter(v=>!supported.includes(v));
  if(unsupported.length)pairGaps.push({fromHour,toHour,exactPairs:alternatives(supported),
   unsupportedRecombinedPairs:alternatives(unsupported)});
 }
 const excluded=recombined.filter(r=>!clues.every(c=>rules.matches(r,c)));
 return {state:stateKey(s.clueIds),clueIds:sorted(s.clueIds),source:s.source,status:'complete',
  localFieldsOnly:summarizeRoutes(fields),localFieldsAndEdges:summarizeRoutes(local),
  exactSupported:summarizeRoutes(exact),recombinedExactFieldsAndEdges:summarizeRoutes(recombined),
  recombinationLoss:{routeCount:excluded.length,examples:excluded.slice(0,DISPLAY_LIMIT).map(route=>({route,
   violatedClueIds:clues.filter(c=>!rules.matches(route,c)).map(c=>c.id)})),examplesComplete:excluded.length<=DISPLAY_LIMIT,
   nonNeighborPairGaps:pairGaps,
   scope:'Pair gaps are only a partial diagnostic; absence does not prove full higher-order correlation.'}};
}

export function buildRouteEvidence(input,requested=ROUTE_PLAN[input.id]??[],{maxNodes=ROUTE_BUDGET}={}){
 assert(Number.isSafeInteger(maxNodes)&&maxNodes>0&&maxNodes<=ROUTE_BUDGET,'Invalid fixed route budget');
 assert(requested.length<=3&&new Set(requested).size===requested.length,'At most three distinct named states per case');
 const byKey=new Map(input.states.map(s=>[stateKey(s.clueIds),s]));
 const base={format:ROUTE_FORMAT,id:input.id,puzzleId:input.puzzleId,evidenceBinding:evidenceBinding(input),
  inputs:input.inputs,budget:{maxNodes,displayLimit:DISPLAY_LIMIT,intervals:INTERVALS},
  scope:'Diagnostic full-route evidence only; never local premises. Counts do not measure human workload.'};
 if(!requested.length)return {...base,status:'not-requested',states:[]};
 const known=requested.filter(k=>byKey.has(k)),missing=requested.filter(k=>!byKey.has(k));
 const unknown=missing.map(state=>({state,status:'unknown-state',source:null}));
 if(!known.length)return {...base,status:'no-known-requested-states',states:unknown};
 const rules=createRules(input.logic),budget={remaining:maxNodes};let legal;
 try{legal=[...rules.routes([input.logic.start],budget)];}
 catch(error){
  if(!error.message.startsWith('Suchbudget überschritten'))throw error;
  return {...base,status:'incomplete-budget',states:[...known.map(state=>({state,source:byKey.get(state).source,
   status:'incomplete-budget',counts:null})),...unknown]};
 }
 legal=legal.filter(r=>input.givens.every(g=>r[g.hour]===g.cell));
 const singles=input.logic.clues.map(c=>byKey.get(c.id));
 const singleIntersection=singles.every(Boolean)?{status:'complete',
  sourceStates:singles.map(s=>({state:stateKey(s.clueIds),source:s.source})),
  localFieldsOnly:summarizeRoutes(legal.filter(r=>singles.every(s=>compatible(r,s.local,false)))),
  localFieldsAndEdges:summarizeRoutes(legal.filter(r=>singles.every(s=>compatible(r,s.local)))),
  scope:'Intersection of recorded single-clue fixed points, without propagation or rechecking clue predicates. Not a human stage.'
 }:{status:'unknown-missing-single-states',missingStates:input.logic.clues.filter((c,i)=>!singles[i]).map(c=>c.id)};
 return {...base,status:'complete',legalRouteCount:legal.length,
  nodesVisited:maxNodes-budget.remaining,singleIntersection,
  states:[...known.map(k=>analyzeState(input,byKey.get(k),legal,rules)),...unknown]};
}
