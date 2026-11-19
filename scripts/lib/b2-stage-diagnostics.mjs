// Read-only view of existing evidence. No engine, propagation or quality model.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {ROOT} from './b2-deduction-profile.mjs';
import {readProgressCases,buildProgressProfile} from './b2-markable-progress.mjs';
import {readPlaytestSource,validatePlaytestBindings} from './b2-playtest.mjs';
import {sha256,canonicalJson} from './content-hash.mjs';

export const FORMAT='b2-stage-diagnosis-1';
export const stateKey=ids=>ids.length?[...ids].sort().join('+'):'none';
const sorted=xs=>[...xs].sort();
const minus=(a,b)=>a.filter(x=>!b.includes(x));

export function readStageCases(){
 const historical=readProgressCases().map(c=>({...c,puzzleId:c.puzzleId??c.label}));
 const source=readPlaytestSource('S03-V2'),rows=validatePlaytestBindings(source);
 const registry='docs/verification/S03-v2/run/registry.json';
 const s03=[...source.registry.entries].sort((a,b)=>a.testName.localeCompare(b.testName,'en')).map((e,i)=>{
  const base=`docs/verification/S03-v2/run/evidence/${e.testName}`;
  const definition=base+'.definition.json',statesPath=base+'.states.jsonl';
  const original=rows.get(e.fingerprints.variant);
  for(const ref of [original.diagnosis.definition,original.diagnosis.states])
   assert.equal(sha256(fs.readFileSync(path.join(ROOT,ref.path))),ref.sha256,'Changed S03 evidence: '+ref.path);
  assert.equal(original.diagnosis.definition.path,definition);
  assert.equal(original.diagnosis.states.path,statesPath);
  // The offline source contains an answer. Only logic crosses this boundary.
  const {logic}=JSON.parse(fs.readFileSync(path.join(ROOT,definition),'utf8'));
  assert(isDeepStrictEqual(logic,rows.get(e.fingerprints.variant).definition.logic),'Rebound S03 logic');
  const states=fs.readFileSync(path.join(ROOT,statesPath),'utf8').trim().split('\n').map((line,n)=>({
   ...JSON.parse(line),source:{path:statesPath,line:n+1}}));
  assert.equal(states.length,original.diagnosis.states.count);
  return {id:`S03-${String(i+1).padStart(2,'0')}`,label:e.testName,puzzleId:e.testName,logic,givens:[],states,
   inputs:[registry,definition,statesPath,source.registry.source+'/candidates.jsonl'].map(p=>({
    path:p,sha256:sha256(fs.readFileSync(path.join(ROOT,p)))}))};
 });
 return [...historical,...s03];
}

export function evidenceBinding(input){
 // Also bind the effective logic/givens: file hashes alone cannot bind a caller's adapter.
 return sha256(canonicalJson({puzzleId:input.puzzleId,logic:input.logic,givens:input.givens,inputs:input.inputs}));
}

function openSections(domains){
 const sections=[];
 for(let h=1;h<domains.length;h++){
  if(domains[h].length===1)continue;
  const previous=sections.at(-1);
  if(previous&&previous.toHour===h-1)previous.toHour=h;
  else sections.push({fromHour:h,toHour:h});
 }
 return sections.map(s=>({...s,
  leftAnchor:s.fromHour>0&&domains[s.fromHour-1].length===1?{hour:s.fromHour-1,cell:domains[s.fromHour-1][0]}:null,
  rightAnchor:s.toHour+1<domains.length&&domains[s.toHour+1].length===1?{hour:s.toHour+1,cell:domains[s.toHour+1][0]}:null}));
}

function couplings(state,mode){
 return state[mode].transitions.flatMap((edges,h)=>{
  const from=state[mode].domains[h],to=state[mode].domains[h+1];
  if(from.length<=1||to.length<=1||edges.length===from.length*to.length)return [];
  return [{fromHour:h,toHour:h+1,fromCells:sorted(from),toCells:sorted(to),transitions:sorted(edges),
   scope:mode==='local'?'local-support-not-full-route-support':'exact-neighbor-projection-not-full-correlation'}];
 });
}

export function buildStageDiagnosis(input){
 for(const ref of input.inputs)assert.equal(sha256(fs.readFileSync(path.join(ROOT,ref.path))),ref.sha256,'Changed source: '+ref.path);
 const p=buildProgressProfile(input),e=p.evidence,baseline=input.states.find(s=>!s.clueIds.length);
 const byKey=new Map(input.states.map(s=>[stateKey(s.clueIds),s]));
 const states=p.intermediateProgress.states.map(progress=>{
  const s=byKey.get(progress.state),ref={state:progress.state,source:s.source};
  const modeView=mode=>({
   fixedHours:s[mode].domains.flatMap((d,hour)=>d.length===1?[{hour,cell:d[0],
    origin:hour===0?'start':input.givens.some(g=>g.hour===hour)?'given':baseline[mode].domains[hour].length===1?'baseline-consequence':'clues'}]:[]),
   domains:s[mode].domains.map(sorted),openSections:openSections(s[mode].domains),couplings:couplings(s,mode)});
  return {...ref,clueIds:sorted(s.clueIds),doesNotRequireClueIds:minus(e.coverage.clueIds,s.clueIds),
   local:{...modeView('local'),fields:progress.local.fields},
   exact:{...modeView('exact'),routeCount:s.exact.routeCount,fields:progress.exact.fields,
    basis:'exact-projection-not-a-local-proof'},
   projectionGap:{fields:s.local.domains.map((d,h)=>minus(d,s.exact.domains[h])),
    transitions:s.local.transitions.map((d,h)=>minus(d,s.exact.transitions[h]))}};
 });
 // Alternative sufficient witnesses are sets, not a proposed time axis.
 const alternatives=e.clueWitnesses.local.map(w=>({hour:w.hour,cell:w.cell,status:w.status,
  minimumClueCount:w.minimumClueCount,minimumKnownClueCount:w.minimumKnownClueCount,
  cardinalityStatus:w.cardinalityStatus,missingSmallerStates:w.missingSmallerStates,
  witnesses:w.witnesses.map(v=>({...v,source:byKey.get(v.state).source,
   otherCluesNotRequired:minus(e.coverage.clueIds,v.clueIds)}))}));
 return {format:FORMAT,id:input.id,puzzleId:input.puzzleId,label:input.label,
  evidenceBinding:evidenceBinding(input),inputs:input.inputs,coverage:e.coverage,
  initialConditions:e.initialConditions,fullState:e.localCoverage.full.local.state,
  entryStates:states.filter(s=>s.clueIds.length>=1&&s.clueIds.length<=2&&s.local.fields.length).map(s=>s.state),
  alternativeLocalFixationWitnesses:alternatives,exactFixationWitnesses:e.clueWitnesses.exact,
  states,
  limits:{order:'Clue count and state ID are reading order, never a human or optimal solving order.',
   independence:'A subset is sufficient without its otherCluesNotRequired. This does not establish independent human ideas.',
   reuse:'Trace premise references certify sufficient reuse, not necessary or exhaustive human dependencies.',
   unknownStates:'Missing subsets are unexamined, never empty or impossible.',
   multiHour:'Not inferred from field/neighbor projections; see separately budgeted route evidence, if available.',
   human:'Discoverability, enjoyment, difficulty, effort and human solving order are not inferred.'}};
}
