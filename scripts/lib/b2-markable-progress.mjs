// Read-only projection of stored exclusions and certificates. No deduction rules.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,readProfileCases,buildProfile} from './b2-deduction-profile.mjs';
import {sha256} from './content-hash.mjs';

export const FORMAT='b2-deduction-profile-2';
export const SOURCES='docs/verification/B2-deduction-progress/private/sources.json';
const sorted=items=>[...items].sort();
const minus=(a,b)=>a.filter(v=>!b.includes(v));
const key=ids=>ids.length?sorted(ids).join('+'):'none';

export function readProgressCases(root=ROOT){
 const manifestBytes=fs.readFileSync(path.join(root,SOURCES)),manifest=JSON.parse(manifestBytes);
 assert.equal(manifest.format,'b2-progress-evidence-1');
 const cases=manifest.cases.map(c=>{
  const inputs=[...c.inputs,{path:c.states.path,sha256:c.states.sha256}];
  for(const input of inputs)assert.equal(sha256(fs.readFileSync(path.join(root,input.path))),input.sha256,'Progress source changed: '+input.path);
  const states=fs.readFileSync(path.join(root,c.states.path),'utf8').trim().split('\n').map((line,i)=>({
   ...JSON.parse(line),source:{path:c.states.path,line:i+1}}));
  assert.equal(states.length,c.states.count);
  return {...c,inputs:[{path:SOURCES,sha256:sha256(manifestBytes)},...inputs],states};
 });
 return [...cases,...readProfileCases(root)];
}

function stateProgress(input,s,baseline){
 const blocked=new Set(input.logic.map.objects.filter(o=>!o.passable).flatMap(o=>o.cells));
 // Replaying recorded field deletions only; no geometry, routes or propagation.
 const cells=Array.from({length:input.logic.map.grid.rows},(_,row)=>
  Array.from({length:input.logic.map.grid.columns},(_,col)=>String.fromCharCode(65+col)+(row+1))).flat().filter(c=>!blocked.has(c));
 const domains=Array.from({length:input.logic.steps+1},()=>[...cells]),trace=s.local.trace,seen=new Map(),ancestors=new Map();
 for(const t of trace){
  assert(!seen.has(t.id),'Duplicate trace ID');
  assert(t.premises.every(id=>seen.has(id)),'Premise must precede its use');
  const ids=new Set(t.premises.flatMap(id=>[id,...ancestors.get(id)]));ancestors.set(t.id,ids);seen.set(t.id,t);
 }
 const excludedHours=new Set([0,...input.givens.map(g=>g.hour)]),witnesses=new Map();
 for(const t of trace){
  if(t.kind!=='field')continue;
  const before=domains[t.hour];
  assert(t.removed.every(c=>before.includes(c)),'Recorded exclusion was not possible');
  const after=minus(before,t.removed);domains[t.hour]=after;
  assert.equal(t.fixed,after.length===1?after[0]:null,'Recorded fixation disagrees with deletions');
  if(excludedHours.has(t.hour)||baseline.local.domains[t.hour].length===1)continue;
  const removed=t.removed.filter(c=>baseline.local.domains[t.hour].includes(c));
  if(!removed.length&&!t.fixed)continue;
  const reachable=[...ancestors.get(t.id),t.id];
  const following=trace.filter(n=>ancestors.get(n.id).has(t.id));
  const w={step:t.id,rule:t.rule,clueIds:t.clueIds,premises:t.premises,removed:sorted(removed),fixed:t.fixed,
   reachableClueIds:sorted(new Set(reachable.flatMap(id=>seen.get(id).clueIds))),
   reusedBy:trace.filter(n=>n.premises.includes(t.id)).map(n=>({step:n.id,rule:n.rule,kind:n.kind,hour:n.hour})),
   fixedFollowUps:following.filter(n=>n.kind==='field'&&n.fixed&&!excludedHours.has(n.hour)&&baseline.local.domains[n.hour].length>1)
    .map(n=>({step:n.id,hour:n.hour,cell:n.fixed,relation:'certificate-descendant'}))};
  if(!witnesses.has(t.hour))witnesses.set(t.hour,[]);witnesses.get(t.hour).push(w);
 }
 assert.deepEqual(domains.map(sorted),s.local.domains.map(sorted),'Replay must reproduce recorded local fields');
 const fields=mode=>s[mode].domains.flatMap((remaining,hour)=>{
  if(excludedHours.has(hour)||baseline[mode].domains[hour].length===1)return [];
  const removed=minus(baseline[mode].domains[hour],remaining);
  if(!removed.length)return [];
  const fixed=remaining.length===1?remaining[0]:null;
  if(mode==='exact')return [{hour,excluded:sorted(removed),remaining:sorted(remaining),fixed}];
  const proof=witnesses.get(hour)??[];
  assert.deepEqual(sorted(new Set(proof.flatMap(w=>w.removed))),sorted(removed),'Every extra exclusion needs a recorded witness');
  return [{hour,markability:'per-hour-field',marks:{cross:sorted(removed),question:fixed?[]:sorted(remaining),check:fixed},witnesses:proof}];
 });
 return {state:key(s.clueIds),source:s.source,clueIds:s.clueIds,
  local:{additionalFixedHours:s.local.domains.flatMap((d,h)=>h&&!excludedHours.has(h)&&d.length===1&&baseline.local.domains[h].length>1?[h]:[]),fields:fields('local')},
  exact:{basis:'exact-projection-not-a-local-explanation',fields:fields('exact')}};
}

export function buildProgressProfile(input){
 const base=buildProfile(input),byKey=new Map(input.states.map(s=>[key(s.clueIds),s])),baseline=byKey.get('none');
 const states=base.evidence.states.map(ref=>stateProgress(input,byKey.get(ref.id),baseline));
 const singles=states.filter(s=>s.clueIds.length===1);
 return {...base,format:FORMAT,baseFormat:base.format,intermediateProgress:{
  format:'b2-markable-progress-1',baselineState:'none',
  symbols:{cross:'×: excluded relative to the same local baseline',question:'?: locally not excluded, not guaranteed route support',check:'✓: singleton'},
  singleClueCompleteWitnesses:singles.filter(s=>byKey.get(s.state).local.domains.slice(1).every(d=>d.length===1)).map(s=>s.state),
  singleClueCoverageComplete:singles.length===input.logic.clues.length,
  states,relationalEvidence:{path:'evidence.representation',markability:'endpoints-only',associationMarksAvailable:false},
  scope:'Known states only. Marks refer to each state fixed point; witness removals refer to individual recorded steps. Exact fields have no local certificates. Start, givens and baseline consequences are context.',
  order:'Sorted by clue count and state ID for reading, never a human or optimal solving order.',
  reuseScope:'Premise references and certificate descendants prove known reuse; they need not be necessary or exhaustive human dependencies.'}};
}
export const buildProgressProfiles=(root=ROOT)=>readProgressCases(root).map(buildProgressProfile);
