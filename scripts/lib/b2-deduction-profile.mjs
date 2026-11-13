// Stored evidence only: no solver, propagator, generation or route enumeration.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256} from './content-hash.mjs';

export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const FORMAT='b2-deduction-profile-1';
const sorted=items=>[...items].sort();
const minus=(a,b)=>a.filter(x=>!b.includes(x));
const subset=(a,b)=>a.every(x=>b.includes(x));
const stateKey=ids=>ids.length?sorted(ids).join('+'):'none';
const assert=(ok,message)=>{if(!ok)throw Error('B2 profile: '+message);};
const fixed=state=>state.domains.flatMap((cells,hour)=>cells.length===1?[{hour,cell:cells[0]}]:[]);

function combinations(ids){
 return Array.from({length:2**ids.length},(_,mask)=>ids.filter((_,i)=>mask&(1<<i)));
}

// Five fixed adapters, not a new input platform. JSONL line numbers are one-based.
export function readProfileCases(root=ROOT){
 const json=ref=>JSON.parse(fs.readFileSync(path.join(root,ref),'utf8'));
 const rows=ref=>fs.readFileSync(path.join(root,ref),'utf8').trim().split('\n').map((line,i)=>({
  ...JSON.parse(line),source:{path:ref,line:i+1}}));
 const positive=(name,id,label,file)=>{
  const base=`docs/verification/${name}/private`,definitionPath=base+'/definition.json';
  const definition=json(definitionPath),logic=definition.logic,states=rows(base+'/'+file),inputs=[definitionPath,base+'/'+file];
  if(id==='V1'){
   const ref=base+'/ablations.jsonl';inputs.push(ref);
   states.push(...rows(ref).map(s=>({...s,clueIds:logic.clues.filter(c=>c.id!==s.omitted).map(c=>c.id)})));
  }
  return {id,label,puzzleId:definition.id,logic,givens:[],states,inputs};
 };
 const sourcePath='docs/verification/B2-deduction/sources.json',sources=json(sourcePath);
 const cases=[positive('B2-positive','V1','POSITIVE V1','diagnosis.jsonl'),
  positive('B2-positive-v2','V2','POSITIVE V2','states.jsonl'),
  ...['T02','T07','T07-given-3'].map((name,i)=>{
   const expected=['B2-BC-T02-M017-A4-R00','B2-BC-T07-M013-D4-R00','B2-BC-T07-M013-D4-R00+given-hour-3'];
   const c=sources.cases.find(c=>c.id===expected[i]),ref=`docs/verification/B2-deduction/${name}.jsonl`;
   return {id:name,label:name==='T07-given-3'?'BC-T07 + Stunde 3':`BC-${name}`,
    puzzleId:c.id,logic:c.logic,givens:c.givens,states:rows(ref),inputs:[sourcePath,ref]};
  })];
 return cases.map(c=>({...c,inputs:c.inputs.map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(root,ref)))}))}));
}

function clueMechanism(clue){
 if(clue.type!=='countDistanceToPlace')return clue.type;
 const n=clue.toHour-clue.fromHour+1;
 if(n===1)return clue.count===0?'single-hour-count-exclusion':'single-hour-count-hit';
 if(clue.count===0)return 'multi-hour-zero-count';
 if(clue.count===n)return 'multi-hour-all-count';
 return 'multi-hour-interior-count';
}

export function buildProfile(input){
 const {id,label,logic,givens,inputs}=input,clueIds=logic.clues.map(c=>c.id);
 assert(clueIds.length<=7&&logic.steps===6,'only the recorded six-hour references are supported');
 const states=input.states.map(s=>({...s,id:stateKey(s.clueIds)})).sort((a,b)=>
  a.clueIds.length-b.clueIds.length||a.id.localeCompare(b.id,'en'));
 const byState=new Map(states.map(s=>[s.id,s]));
 assert(byState.size===states.length,'duplicate clue subset');
 const allSubsets=combinations(clueIds),missing=allSubsets.filter(ids=>!byState.has(stateKey(ids)));
 const baseline=byState.get('none'),full=byState.get(stateKey(clueIds));
 assert(baseline&&full,'baseline and full-clue state required');
 for(const s of states){
  assert(subset(s.clueIds,clueIds)&&new Set(s.clueIds).size===s.clueIds.length,'unknown or repeated clue ID');
  for(const mode of ['exact','local']){
   const v=s[mode];
   assert(v.domains.length===7&&v.transitions.length===6,'invalid state dimensions');
   assert(v.domains.every(d=>d.length)&&v.transitions.every(d=>d.length),'inconsistent evidence');
  }
  for(const property of ['domains','transitions'])for(let i=0;i<s.exact[property].length;i++)
   assert(subset(s.exact[property][i],s.local[property][i]),'unsound stored local projection');
 }
 const origin=hour=>hour===0?'start':givens.some(g=>g.hour===hour)?'given':
  baseline.local.domains[hour].length===1?'baseline-consequence':'clues';
 const traceMap=s=>new Map(s.local.trace.map(t=>[t.id,t]));
 function ancestorIds(s,stepId){
  const trace=traceMap(s),seen=new Set();
  function visit(key){
   if(seen.has(key))return;
   const t=trace.get(key);assert(t,'unknown trace premise');
   seen.add(key);t.premises.forEach(visit);
  }
  visit(stepId);return s.local.trace.filter(t=>seen.has(t.id)).map(t=>t.id);
 }
 function certificate(s,hour){
  const step=s.local.trace.find(t=>t.kind==='field'&&t.hour===hour&&t.fixed);
  assert(step,'field fixation has no stored certificate');
  const ancestors=ancestorIds(s,step.id),trace=traceMap(s);
  const active=ancestors.map(key=>trace.get(key));
  return {step:step.id,rule:step.rule,ancestorSteps:ancestors,rules:sorted(new Set(active.map(t=>t.rule))),
   mechanisms:logic.clues.filter(c=>active.some(t=>t.clueIds.includes(c.id))).map(c=>{
    const omitted=byState.get(stateKey(s.clueIds.filter(id=>id!==c.id)));
    return {clueId:c.id,type:c.type,mechanism:clueMechanism(c),
     steps:active.filter(t=>t.clueIds.includes(c.id)).map(t=>t.id),
     necessaryWithinWitness:omitted?omitted.local.domains[hour].length!==1:null};
   })};
 }
 function witnesses(mode,hour,cell){
  const successful=states.filter(s=>s[mode].domains[hour].length===1&&s[mode].domains[hour][0]===cell);
  // Inclusion-minimal among KNOWN states; missing subsets remain explicit below.
  const candidates=successful.filter(s=>!successful.some(p=>p.clueIds.length<s.clueIds.length&&subset(p.clueIds,s.clueIds)));
  const minimumKnown=successful.length?Math.min(...successful.map(s=>s.clueIds.length)):null;
  const missingSmaller=minimumKnown===null?[]:missing.filter(ids=>ids.length<minimumKnown);
  return {hour,cell,origin:hour===0?'start':givens.some(g=>g.hour===hour)?'given':
    baseline[mode].domains[hour].length===1?'baseline-consequence':'clues',
   status:successful.length?'witnessed':'not-locally-fixed',
   minimumKnownClueCount:minimumKnown,
   minimumClueCount:minimumKnown!==null&&!missingSmaller.length?minimumKnown:null,
   cardinalityStatus:minimumKnown===null?'unknown':missingSmaller.length?'smallest-known':'proven-minimum',
   missingSmallerStates:missingSmaller.map(stateKey),
   witnesses:candidates.map(s=>({state:s.id,clueIds:s.clueIds,
    inclusionStatus:missing.some(ids=>ids.length<s.clueIds.length&&subset(ids,s.clueIds))?'smallest-known':'proven-inclusion-minimal',
    missingProperSubsets:missing.filter(ids=>ids.length<s.clueIds.length&&subset(ids,s.clueIds)).map(stateKey),
    ...(mode==='local'?{certificate:certificate(s,hour)}:{})}))};
 }
 function projection(s,mode){
  const value=s[mode],base=baseline[mode];
  return {state:s.id,fixedHours:fixed(value).filter(p=>p.hour),
   clueDerivedFixedHours:fixed(value).filter(p=>p.hour&&base.domains[p.hour].length!==1&&!givens.some(g=>g.hour===p.hour)),
   domains:value.domains.slice(1).map(sorted),transitions:value.transitions.map(sorted)};
 }
 function gap(s){
  const fields=s.local.domains.map((d,h)=>minus(d,s.exact.domains[h]));
  const transitions=s.local.transitions.map((d,h)=>minus(d,s.exact.transitions[h]));
  return {state:s.id,fieldCount:fields.flat().length,transitionCount:transitions.flat().length,
   fields:fields.slice(1).map(sorted),transitions:transitions.map(sorted),
   exactlyFixedLocallyOpenHours:fixed(s.exact).filter(p=>p.hour&&s.local.domains[p.hour].length!==1).map(p=>p.hour)};
 }
 function entryFields(s,mode){
  return s[mode].domains.flatMap((remaining,hour)=>{
   const before=baseline[mode].domains[hour],removed=minus(before,remaining);
   if(!hour||before.length===1||!removed.length||givens.some(g=>g.hour===hour))return [];
   return [{hour,kind:remaining.length===1?'fixed':remaining.length<=3?'small-alternatives':'exclusions',
    remaining:sorted(remaining),removed:sorted(removed)}];
  });
 }
 const entries=states.filter(s=>s.clueIds.length>0&&s.clueIds.length<=2).map(s=>({
  state:s.id,clueIds:s.clueIds,doesNotRequireClueIds:minus(clueIds,s.clueIds),
  local:entryFields(s,'local'),exact:entryFields(s,'exact')})).filter(e=>e.local.length||e.exact.length);
 function coupling(s,mode,smallOnly=false){
  return s[mode].transitions.flatMap((edges,i)=>{
   const from=s[mode].domains[i],to=s[mode].domains[i+1];
   if(from.length<=1||to.length<=1||edges.length===from.length*to.length||
    (smallOnly&&(from.length>3||to.length>3)))return [];
   return [{fromHour:i,toHour:i+1,fromCells:sorted(from),toCells:sorted(to),transitions:sorted(edges),
    absentCrossPairCount:from.length*to.length-edges.length}];
  });
 }
 const initialHours=[0,...givens.map(g=>g.hour)];
 const milestones=full.local.trace.filter(t=>t.kind==='field'&&t.fixed&&!initialHours.includes(t.hour)&&
  origin(t.hour)==='clues').map(t=>({id:`hour-${t.hour}`,hour:t.hour,cell:t.fixed,state:full.id,
   certificate:certificate(full,t.hour),
   attachedFixedTransitions:full.local.trace.filter(e=>e.kind==='transition'&&e.fixed&&(e.hour===t.hour||e.hour===t.hour+1))
    .map(e=>({hour:e.hour,transition:e.fixed,step:e.id}))})).sort((a,b)=>a.hour-b.hour);
 const dependencies=milestones.flatMap(target=>milestones.filter(source=>source!==target&&
  target.certificate.ancestorSteps.includes(source.certificate.step)).map(source=>({
   from:source.id,to:target.id,state:full.id,fromStep:source.certificate.step,toStep:target.certificate.step,
   relation:'transitive-certificate-ancestor'})));
 const fieldWitnesses={};
 for(const mode of ['local','exact'])fieldWitnesses[mode]=full.exact.domains.slice(1).flatMap((d,i)=>
  d.length===1?[witnesses(mode,i+1,d[0])]:[]);
 return {format:FORMAT,id,label,puzzleId:input.puzzleId??id,inputs,
  evidence:{initialConditions:[{hour:0,cell:logic.start,origin:'start'},...givens.map(g=>({...g,origin:'given'}))],
   coverage:{clueIds,stateCount:states.length,totalSubsetCount:allSubsets.length,complete:missing.length===0,
    missingStates:missing.map(stateKey),missingStatus:missing.length?'unknown':'none'},
   states:states.map(s=>({id:s.id,clueIds:s.clueIds,source:s.source})),
   localCoverage:{baseline:{local:projection(baseline,'local'),exact:projection(baseline,'exact'),gap:gap(baseline)},
    full:{local:projection(full,'local'),exact:projection(full,'exact'),gap:gap(full)}},
   entryOffer:{maxClues:2,smallAlternativesMax:3,states:entries,
    independenceScope:'Each stored subset works without the listed other clues, with the same map/start/givens. Not a claim of independent human ideas.'},
   clueWitnesses:{...fieldWitnesses,
    mechanisms:logic.clues.map(c=>({clueId:c.id,type:c.type,mechanism:clueMechanism(c),
     effectiveFullTraceSteps:full.local.trace.filter(t=>t.clueIds.includes(c.id)).map(t=>t.id)}))},
   representation:{state:full.id,fieldMarks:'Remaining cells can be marked per hour; cross-hour associations are not stored by the UI.',
    localCouplings:coupling(full,'local'),exactCouplings:coupling(full,'exact'),
    smallEntryCouplings:entries.map(e=>({state:e.state,local:coupling(byState.get(e.state),'local',true),
     exact:coupling(byState.get(e.state),'exact',true)})).filter(e=>e.local.length||e.exact.length),
    scope:'Missing cross-pairs can follow from adjacency as well as clues. Local edges need not extend to a legal route; higher-order correlations are not represented.'},
   milestones:{state:full.id,items:milestones,dependencies,
    scope:'Field milestones only; fixed edges are attached evidence, not extra milestones. Certificate ancestors are sufficient, not minimal or a human order.'}},
  possibleInterpretations:[
   'Concrete anchors and small per-hour alternatives may support practical progress; discoverability and marking effort are unmeasured.',
   'Shared entry, witness and completion patterns may indicate repetition across a series; no similarity threshold or selection follows.',
   'Unresolved cross-hour associations may require memory; their presence alone does not establish difficulty.'
  ],
  unknowns:['Human solving order, thought depth, effort, difficulty and enjoyment.',
   'All alternative human arguments and their independence.',
   'Whether a local/exact gap is caused by a missing simple rule or a human obstacle.',
   ...(missing.length?['Consequences of the explicitly missing clue subsets.']:[])]};
}

export const buildProfiles=(root=ROOT)=>readProfileCases(root).map(buildProfile);
