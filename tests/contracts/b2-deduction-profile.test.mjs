import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {ROOT,FORMAT,readProfileCases,buildProfile,buildProfiles} from '../../scripts/lib/b2-deduction-profile.mjs';
import {OUTPUT,profileReportFiles,renderProfileReport} from '../../scripts/report-b2-profile.mjs';

const inputs=readProfileCases(),profiles=inputs.map(buildProfile);
const profile=id=>profiles.find(p=>p.id===id);
const field=(p,mode,hour)=>p.evidence.clueWitnesses[mode].find(w=>w.hour===hour);

test('positive profiles retain shared anchors, local vector, distinct witnesses and effective count mechanism',()=>{
 for(const id of ['V1','V2']){
  const p=profile(id),e=p.evidence;
  assert.equal(p.format,FORMAT);assert.equal(e.coverage.complete,true);
  assert.deepEqual(e.clueWitnesses.local.map(w=>w.minimumClueCount),[3,4,4,2,1,5]);
  assert.deepEqual(field(p,'local',4).witnesses.map(w=>w.state),['H2+H3']);
  assert.deepEqual(field(p,'local',5).witnesses.map(w=>w.state),['H3']);
  assert.equal(field(p,'local',4).cardinalityStatus,'proven-minimum');
  assert.ok(e.entryOffer.states.find(s=>s.state==='H1').doesNotRequireClueIds.includes('H3'));
  assert.ok(e.entryOffer.states.find(s=>s.state==='H3').doesNotRequireClueIds.includes('H1'));
  const early=e.entryOffer.states.find(s=>s.state==='H1');
  assert.deepEqual(early.local.find(f=>f.hour===2).remaining,['B2','C1']);
  const small=e.representation.smallEntryCouplings.find(s=>s.state==='H1');
  assert.deepEqual(small.local.find(c=>c.fromHour===1).transitions,['A2>B2','B1>C1']);
  assert.equal(e.milestones.items.find(m=>m.hour===6).certificate.rule,'no-revisit-singleton');
  assert.ok(e.milestones.dependencies.some(d=>d.from==='hour-3'&&d.to==='hour-6'));
 }
 assert.deepEqual(field(profile('V1'),'local',3).witnesses.map(w=>w.state),['H1+H2+H3+H4']);
 const v2=field(profile('V2'),'local',3).witnesses;
 assert.deepEqual(v2.map(w=>w.state),['H1+H2+H3+H6']);
 const count=v2[0].certificate.mechanisms.find(c=>c.clueId==='H6');
 assert.equal(count.mechanism,'multi-hour-interior-count');
 assert.equal(count.necessaryWithinWitness,true);assert.ok(count.steps.length);
 // A global consequence must not be presented as a local explanation.
 assert.equal(field(profile('V1'),'exact',6).minimumClueCount,4);
 assert.equal(field(profile('V1'),'local',6).minimumClueCount,5);
});

test('BC gaps, partial coverage and per-finding minimum proofs remain distinct',()=>{
 for(const [id,widths,gap,missing] of [
  ['T02',[3,3,9,15,13,18],[55,150],21],
  ['T07',[1,1,3,4,5,8],[16,25],63],
  ['T07-given-3',[1,1,1,2,2,4],[5,6],63]]){
  const e=profile(id).evidence,full=e.localCoverage.full;
  assert.deepEqual(full.local.domains.map(d=>d.length),widths);
  assert.deepEqual([full.gap.fieldCount,full.gap.transitionCount],gap);
  assert.equal(e.coverage.complete,false);assert.equal(e.coverage.missingStatus,'unknown');
  assert.equal(e.coverage.missingStates.length,missing);
  assert.ok(e.coverage.missingStates.includes('H1+H2+H3+H4'));
  assert.equal(full.exact.fixedHours.length,6);
 }
 for(const w of profile('T02').evidence.clueWitnesses.exact){
  assert.equal(w.minimumKnownClueCount,6);assert.equal(w.minimumClueCount,null);
  assert.equal(w.cardinalityStatus,'smallest-known');
  assert.equal(w.witnesses[0].inclusionStatus,'smallest-known');
  assert.equal(w.missingSmallerStates.length,21);
 }
 // Larger missing combinations do not invalidate a minimum already proved by singles/pairs.
 assert.equal(field(profile('T07'),'local',1).minimumClueCount,2);
 assert.equal(field(profile('T07'),'exact',3).minimumClueCount,null);
 assert.equal(field(profile('T07-given-3'),'exact',6).minimumClueCount,3);
 assert.equal(field(profile('T07-given-3'),'local',6).minimumClueCount,null);
 const m=profile('T07').evidence.clueWitnesses.mechanisms;
 assert.equal(m.find(c=>c.clueId==='H1').mechanism,'single-hour-count-exclusion');
 assert.equal(m.find(c=>c.clueId==='H5').mechanism,'single-hour-count-hit');
});

test('removing stored subsets downgrades cardinality and inclusion claims without changing known witnesses',()=>{
 const c=structuredClone(inputs[0]);
 c.states=c.states.filter(s=>s.clueIds.join('+')!=='H2+H3');
 const p=buildProfile(c),w=field(p,'local',1);
 assert.equal(w.minimumKnownClueCount,3);assert.equal(w.minimumClueCount,null);
 assert.equal(w.cardinalityStatus,'smallest-known');
 assert.deepEqual(w.missingSmallerStates,['H2+H3']);
 assert.equal(w.witnesses[0].state,'H2+H3+H4');
 assert.equal(w.witnesses[0].inclusionStatus,'smallest-known');
 assert.deepEqual(w.witnesses[0].missingProperSubsets,['H2+H3']);
 // A missing smaller set outside this witness blocks a cardinality proof, not inclusion minimality.
 const other=structuredClone(inputs[0]);other.states=other.states.filter(s=>s.clueIds.join('+')!=='H5');
 const q=field(buildProfile(other),'local',1);
 assert.equal(q.minimumClueCount,null);assert.equal(q.witnesses[0].inclusionStatus,'proven-inclusion-minimal');
});

test('givens and their baseline consequences are context, and field/edge facts are not duplicate milestones',()=>{
 const p=profile('T07-given-3'),e=p.evidence;
 assert.deepEqual(e.initialConditions,[{hour:0,cell:'D4',origin:'start'},{hour:3,cell:'C1',origin:'given'}]);
 assert.deepEqual(e.localCoverage.full.local.clueDerivedFixedHours,[]);
 assert.deepEqual(e.milestones.items,[]);
 assert.equal(field(p,'local',1).origin,'baseline-consequence');
 assert.equal(field(p,'local',3).origin,'given');
 assert.ok(e.entryOffer.states.every(s=>[...s.local,...s.exact].every(f=>f.hour>3)));
 const coupled=e.representation.localCouplings.find(c=>c.fromHour===4);
 assert.deepEqual(coupled.fromCells,['B1','B2']);assert.deepEqual(coupled.toCells,['A2','C3']);
 assert.deepEqual(coupled.transitions,['B1>A2','B2>C3']);assert.equal(coupled.absentCrossPairCount,2);
 for(const p of profiles){
  const items=p.evidence.milestones.items;
  assert.equal(new Set(items.map(m=>m.hour)).size,items.length);
  assert.ok(items.every(m=>m.hour>0&&!p.evidence.initialConditions.some(c=>c.hour===m.hour)));
 }
 assert.equal(profile('V1').evidence.milestones.items.length,6);
});

test('state, source hash, trace and mechanism references resolve to stored evidence',()=>{
 for(const p of profiles){
  const c=inputs.find(c=>c.id===p.id),states=new Map(c.states.map(s=>[s.clueIds.length?[...s.clueIds].sort().join('+'):'none',s]));
  for(const input of p.inputs)assert.equal(sha256(fs.readFileSync(path.join(ROOT,input.path))),input.sha256);
  for(const s of p.evidence.states){
   const row=JSON.parse(fs.readFileSync(path.join(ROOT,s.source.path),'utf8').split('\n')[s.source.line-1]);
   const ids=row.clueIds??c.logic.clues.filter(clue=>clue.id!==row.omitted).map(clue=>clue.id);
   assert.deepEqual([...ids].sort(),[...s.clueIds].sort());
  }
  const check=(state,certificate)=>{
   const trace=new Map(states.get(state).local.trace.map(t=>[t.id,t]));
   assert.equal(trace.get(certificate.step).fixed!==null,true);
   for(const id of certificate.ancestorSteps)assert.ok(trace.has(id));
   for(const m of certificate.mechanisms)for(const id of m.steps)assert.ok(trace.get(id).clueIds.includes(m.clueId));
  };
  for(const f of p.evidence.clueWitnesses.local)for(const w of f.witnesses)check(w.state,w.certificate);
  for(const m of p.evidence.milestones.items)check(m.state,m.certificate);
 }
});

test('report is deterministic, read-only and reproduces six versioned artifacts without engine imports',()=>{
 const before=new Map(inputs.flatMap(c=>c.inputs.map(f=>[f.path,fs.readFileSync(path.join(ROOT,f.path))])));
 const files=profileReportFiles();assert.equal(files.size,6);
 for(const [name,bytes] of files)assert.equal(fs.readFileSync(path.join(ROOT,OUTPUT,name),'utf8'),bytes,name);
 assert.deepEqual(buildProfiles(),profiles);
 for(const [name,bytes] of before)assert.deepEqual(fs.readFileSync(path.join(ROOT,name)),bytes,name);
 const imports=fs.readFileSync(path.join(ROOT,'scripts/lib/b2-deduction-profile.mjs'),'utf8');
 assert.doesNotMatch(imports,/from ['"].*(?:engine|b2-deduction\.mjs|b2-local-deduction|generator|b2-playtest)/);
 const stdout=execFileSync(process.execPath,['scripts/report-b2-profile.mjs'],{cwd:ROOT,encoding:'utf8'});
 assert.equal(stdout,renderProfileReport(profiles)+'\n');
 assert.throws(()=>execFileSync(process.execPath,['scripts/report-b2-profile.mjs','--write','extra'],{cwd:ROOT,stdio:'pipe'}));
 assert.match(stdout,/Mögliche spielerische Interpretationen/);assert.match(stdout,/Unbekannt und Grenzen/);
});
