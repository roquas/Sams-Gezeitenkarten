import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-deduction-profile.mjs';
import {readProgressCases,buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';
import {readStageCases,buildStageDiagnosis,evidenceBinding,stateKey} from '../../scripts/lib/b2-stage-diagnostics.mjs';
import {buildRouteEvidence,ROUTE_PLAN} from '../../scripts/lib/b2-stage-routes.mjs';
import {stageReportFiles,OUTPUT,main,renderStageReport} from '../../scripts/report-b2-stages.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';

const cases=readStageCases(),byId=new Map(cases.map(c=>[c.id,c]));
const diagnoses=cases.map(buildStageDiagnosis),routes=cases.map(c=>buildRouteEvidence(c));
const diagnosis=id=>diagnoses.find(d=>d.id===id),route=id=>routes.find(d=>d.id===id);
const state=(id,key)=>diagnosis(id).states.find(s=>s.state===key);
const field=(id,key,hour)=>state(id,key).local.fields.find(f=>f.hour===hour);
const sourceRow=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref.path),'utf8').trim().split('\n')[ref.line-1]);

test('all eighteen cases use original identities, correct S03 display numbers and all 617 existing states',()=>{
 assert.equal(cases.length,18);
 assert.equal(cases.reduce((n,c)=>n+c.states.length,0),617);
 const expected=['M001-A3-R751-V01','M003-A5-R436-V02','M008-A3-R51-V02','M010-E4-R568-V01',
  'M011-A5-R787-V01','M014-A5-R160-V01','M016-A2-R116-V01','M017-A4-R74-V02','M018-A5-R30-V04'];
 for(const [i,suffix] of expected.entries())assert.equal(diagnosis(`S03-0${i+1}`).puzzleId,'B2-S03-V2-'+suffix);
 for(const d of diagnoses){
  assert.ok(d.puzzleId.startsWith('B2-'));
  for(const s of d.states){
   const row=sourceRow(s.source),ids=row.clueIds??byId.get(d.id).logic.clues.filter(c=>c.id!==row.omitted).map(c=>c.id);
   assert.equal(stateKey(ids),s.state);
  }
  assert.equal(d.evidenceBinding,route(d.id).evidenceBinding);
 }
});

test('each local exclusion, reuse and alternative witness resolves to the bound stored trace',()=>{
 for(const d of diagnoses)for(const s of d.states){
  const original=sourceRow(s.source),trace=new Map(original.local.trace.map(t=>[t.id,t]));
  for(const f of s.local.fields)for(const w of f.witnesses){
   const t=trace.get(w.step);assert.equal(t.hour,f.hour);assert.equal(t.rule,w.rule);
   assert.ok(w.removed.every(v=>t.removed.includes(v)));
   assert.deepEqual(w.premises,t.premises);
   for(const use of w.reusedBy)assert.ok(trace.get(use.step).premises.includes(w.step));
  }
  assert.equal(Object.hasOwn(s.exact,'witnesses'),false);
 }
 for(const d of diagnoses)for(const w of d.alternativeLocalFixationWitnesses)for(const v of w.witnesses){
  const s=sourceRow(v.source),step=s.local.trace.find(t=>t.id===v.certificate.step);
  assert.equal(step.hour,w.hour);assert.equal(step.fixed,w.cell);
  assert.ok(v.otherCluesNotRequired.every(id=>!v.clueIds.includes(id)));
 }
});

test('C has useful certified exclusions before fixation, while A already completes with a single clue',()=>{
 const s=state('C','H1+H2');
 assert.deepEqual(s.local.fixedHours.filter(h=>h.origin==='clues'),[]);
 const w=field('C','H1+H2',4).witnesses.find(w=>w.step==='D19');
 assert.deepEqual(w.removed,['B2','B3','B4','C1','C5']);
 assert.deepEqual(w.reachableClueIds,['H1','H2']);assert.ok(w.reusedBy.length);
 assert.equal(state('A','H1').local.fixedHours.filter(f=>f.origin==='clues').length,6);
 assert.ok(diagnosis('A').alternativeLocalFixationWitnesses.every(w=>w.minimumClueCount===1));
 assert.equal(field('B','H1',1).marks.check,'B1');
 assert.deepEqual(state('B','H2+H3').local.fixedHours.filter(f=>f.origin==='clues').map(f=>f.hour),[3,4,5,6]);
});

test('known versus proven minima remain distinct; no requirement for early hour fixations',()=>{
 const second=diagnosis('S03-02');assert.equal(second.coverage.complete,false);
 assert.ok(second.alternativeLocalFixationWitnesses.every(w=>w.minimumClueCount===null&&w.minimumKnownClueCount===5));
 assert.ok(second.alternativeLocalFixationWitnesses.every(w=>w.missingSmallerStates.length===5));
 assert.ok(second.states.filter(s=>s.clueIds.length<=3).every(s=>!s.local.fixedHours.some(f=>f.origin==='clues')));
 assert.ok(diagnosis('S03-05').alternativeLocalFixationWitnesses.every(w=>w.minimumClueCount===4));
 const eighth=diagnosis('S03-08');
 assert.ok(eighth.states.filter(s=>s.clueIds.length<=2).every(s=>!s.local.fixedHours.some(f=>f.origin==='clues')));
 assert.equal(eighth.alternativeLocalFixationWitnesses.find(w=>w.hour===2).minimumClueCount,3);
 assert.equal(field('S03-08','H1+H2+H5',2).marks.check,'A2');
 assert.equal(state('S03-08','H2+H5+H6').local.domains[2].length>1,true);
 assert.deepEqual(state('S03-08','H2+H5+H6').exact.domains[2],['A2']);
 assert.deepEqual(state('S03-08','H4').local.fields,[]);
});

test('75 exact routes versus 107 recombinations demonstrate loss beyond neighbor projections',()=>{
 const input=byId.get('S03-02'),s=route(input.id).states[0];
 assert.deepEqual(s.source,{path:input.states[0].source.path,line:9});
 assert.equal(s.exactSupported.routeCount,75);
 assert.equal(s.recombinedExactFieldsAndEdges.routeCount,107);
 assert.equal(s.recombinationLoss.routeCount,32);
 // Independent use of the existing solver, not the new adapter's filters.
 const partial={...input.logic,clues:input.logic.clues.filter(c=>s.clueIds.includes(c.id))};
 const oracle=solvePuzzle(partial,{metrics:false,maxNodes:250000});assert.equal(oracle.count,75);
 const rules=createRules(partial),projection=state(input.id,s.state).exact;
 for(const example of s.recombinationLoss.examples){
  assert.ok(rules.legal(example.route));assert.ok(example.violatedClueIds.length);
  assert.deepEqual(example.violatedClueIds,partial.clues.filter(c=>!rules.matches(example.route,c)).map(c=>c.id));
  example.route.forEach((c,h)=>{assert.ok(projection.domains[h].includes(c));
   if(h)assert.ok(sourceRow(s.source).exact.transitions[h-1].includes(example.route[h-1]+'>'+c));});
  assert.ok(!oracle.solutions.some(r=>r.join()===example.route.join()));
 }
 assert.ok(s.recombinationLoss.nonNeighborPairGaps.length);
});

test('05 protects against penalizing large sets and 08 retains exclusion and relational progress',()=>{
 const fifth=route('S03-05');
 assert.equal(fifth.singleIntersection.localFieldsOnly.routeCount,509);
 assert.equal(fifth.singleIntersection.localFieldsAndEdges.routeCount,301);
 assert.equal(fifth.states[0].exactSupported.routeCount,8);
 assert.deepEqual(field('S03-05','H2+H3',1),undefined);
 assert.deepEqual(state('S03-05','H2+H3').local.domains,state('S03-05','none').local.domains);
 const eighth=route('S03-08');
 assert.equal(eighth.singleIntersection.localFieldsOnly.routeCount,18);
 assert.equal(eighth.singleIntersection.localFieldsAndEdges.routeCount,6);
 assert.deepEqual(eighth.states.map(s=>s.recombinationLoss.routeCount),[5,18]);
});

test('01 has a locally open finish and 09 offers late fixed anchors and small connections',()=>{
 const first=diagnosis('S03-01'),full=state(first.id,first.fullState);
 assert.deepEqual(full.local.openSections,[{fromHour:5,toHour:6,leftAnchor:{hour:4,cell:'C4'},rightAnchor:null}]);
 const rest=route(first.id).states.find(s=>s.state===first.fullState);
 assert.equal(rest.localFieldsAndEdges.routeCount,3);assert.equal(rest.exactSupported.routeCount,1);
 const ninth=state('S03-09','H2');
 assert.deepEqual(ninth.local.fixedHours.filter(f=>f.origin==='clues').map(f=>f.hour),[4,5,6]);
 const late=route('S03-09').states[0];assert.equal(late.exactSupported.routeCount,6);
 const suffix=late.exactSupported.sections.find(s=>s.fromHour===3);
 assert.deepEqual(suffix.suffix,ninth.exact.domains.slice(4).flat());
 assert.equal(late.exactSupported.sections[0].alternatives.count,6);
 assert.equal(late.exactSupported.sections[0].alternatives.complete,true);
});

test('budget failure, unrequested and missing states never become complete or zero counts',()=>{
 const input=byId.get('S03-02'),incomplete=buildRouteEvidence(input,['H1+H4'],{maxNodes:1});
 assert.equal(incomplete.status,'incomplete-budget');assert.equal(incomplete.states[0].counts,null);
 assert.equal(incomplete.legalRouteCount,undefined);assert.equal(incomplete.singleIntersection,undefined);
 const missing=buildRouteEvidence(input,['H1+H2+H3+H4']);
 assert.equal(missing.status,'no-known-requested-states');assert.equal(missing.states[0].status,'unknown-state');
 assert.equal(missing.states[0].source,null);assert.equal(missing.states[0].exactSupported,undefined);
 assert.equal(route('B').status,'not-requested');
 assert.throws(()=>buildRouteEvidence(input,['H1'],{maxNodes:250001}),/budget/);
 assert.throws(()=>buildRouteEvidence(input,['H1','H1']),/distinct/);
 assert.throws(()=>buildRouteEvidence(input,['H1','H2','H3','H4']),/three/);
 const altered=structuredClone(byId.get('C'));altered.states=altered.states.filter(s=>stateKey(s.clueIds)!=='H1');
 assert.equal(buildRouteEvidence(altered,['H1+H2']).singleIntersection.status,'unknown-missing-single-states');
});

test('sources and exact projections are checked; changed logic or givens have distinct bindings',()=>{
 const original=byId.get('C'),bad=structuredClone(original);bad.inputs[0].sha256='wrong';
 assert.throws(()=>buildStageDiagnosis(bad),/Changed source/);
 const broken=structuredClone(original);broken.states.find(s=>stateKey(s.clueIds)==='H1+H2').local.trace.find(t=>t.id==='D19').premises.push('nonexistent');
 assert.throws(()=>buildStageDiagnosis(broken),/Premise must precede/);
 const wrongExact=structuredClone(byId.get('S03-02'));
 wrongExact.states.find(s=>stateKey(s.clueIds)==='H1+H4').exact.routeCount++;
 assert.throws(()=>buildRouteEvidence(wrongExact),/exact route count disagrees/);
 assert.notEqual(evidenceBinding({...original,givens:[{hour:3,cell:'C1'}]}),evidenceBinding(original));
 assert.notEqual(evidenceBinding({...original,puzzleId:'other'}),evidenceBinding(original));
 assert.notEqual(evidenceBinding({...original,logic:{...original.logic,start:'A1'}}),evidenceBinding(original));
 const omitted=structuredClone(original);omitted.states=omitted.states.filter(s=>stateKey(s.clueIds)!=='H1+H2');
 const d=buildStageDiagnosis(omitted);assert.ok(d.coverage.missingStates.includes('H1+H2'));
 assert.ok(!d.states.some(s=>s.state==='H1+H2'));
});

test('deterministic diagnostics do not depend on answers or mutate existing profile formats',()=>{
 for(const input of cases){
  const altered={...input,states:[...input.states].reverse(),solution:['wrong-answer']};
  assert.deepEqual(buildStageDiagnosis(altered),diagnosis(input.id));
  assert.deepEqual(buildRouteEvidence(altered),route(input.id));
 }
 for(const input of readProgressCases()){
  const bytes=fs.readFileSync(path.join(ROOT,'docs/verification/B2-deduction-profile-v2',input.id+'.json'),'utf8');
  assert.equal(JSON.stringify(buildProgressProfile(input))+'\n',bytes);
 }
 const given=diagnosis('T07-given-3');
 assert.ok(given.states.every(s=>s.local.fields.every(f=>f.hour>3)));
 assert.ok(given.states.every(s=>s.local.fixedHours.filter(f=>f.hour<=3).every(f=>f.origin!=='clues')));
 for(const id of ['V1','V2'])assert.deepEqual(diagnosis(id).alternativeLocalFixationWitnesses.map(w=>w.minimumClueCount),[3,4,4,2,1,5]);
});

test('bounded plan, truncation, singleton intersection and route fragments retain their stated units',()=>{
 assert.equal(Object.keys(ROUTE_PLAN).length,17);
 for(const r of routes.filter(r=>r.status==='complete')){
  assert.ok(r.nodesVisited<=250000);assert.equal(r.states.length<=3,true);
  for(const s of r.states.filter(s=>s.status==='complete'))for(const view of ['localFieldsOnly','localFieldsAndEdges','exactSupported','recombinedExactFieldsAndEdges']){
   for(const section of s[view].sections){
    const a=section.alternatives;assert.ok(a.shown.length<=12);
    assert.equal(a.complete,a.count<=12);
    assert.ok(a.shown.every(v=>v.split('>').length===section.toHour-section.fromHour+1));
    if(a.complete)assert.equal(a.allSha256,sha256(JSON.stringify(a.shown)));
   }
  }
 }
});

test('37 reports reproduce byte-for-byte; CLI validates arguments and retains explicit boundaries',()=>{
 const files=stageReportFiles();assert.equal(files.size,37);
 for(const [name,bytes] of files)assert.equal(fs.readFileSync(path.join(ROOT,OUTPUT,name),'utf8'),bytes,name);
 assert.match(main(['--check']),/37 files reproduced/);
 assert.throws(()=>main(['--unknown']),/Usage/);assert.throws(()=>main(['--write','extra']),/Usage/);
 assert.equal(execFileSync(process.execPath,['scripts/report-b2-stages.mjs'],{cwd:ROOT,encoding:'utf8'}),files.get('report.md')+'\n');
 const report=renderStageReport(diagnoses,routes);
 assert.match(report,/75 exakt unterstützte gegenüber 107/);
 assert.match(report,/keine zusätzliche Routenberechnung angefordert/);
 const module=fs.readFileSync(path.join(ROOT,'scripts/lib/b2-stage-diagnostics.mjs'),'utf8');
 assert.doesNotMatch(module,/from ['"].*(?:engine|b2-local-deduction|s03-quality|b2-stage-routes)/);
 for(const d of diagnoses)assert.equal(Object.hasOwn(d,'score'),false);
});
