import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT,buildProfile} from '../../scripts/lib/b2-deduction-profile.mjs';
import {readProgressCases,buildProgressProfile,buildProgressProfiles,FORMAT} from '../../scripts/lib/b2-markable-progress.mjs';
import {OUTPUT,progressReportFiles,renderProgressReport} from '../../scripts/report-b2-progress.mjs';
import {OUTPUT as EVIDENCE,progressEvidenceFiles} from '../../scripts/report-b2-progress-evidence.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {diagnosePuzzle} from '../../scripts/lib/b2-deduction.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';

const inputs=readProgressCases(),profiles=inputs.map(buildProgressProfile);
const profile=id=>profiles.find(p=>p.id===id);
const state=(id,key)=>profile(id).intermediateProgress.states.find(s=>s.state===key);
const field=(id,key,hour)=>state(id,key).local.fields.find(f=>f.hour===hour);
const oldHashes={
 'T02.json':'1d39ba74652c916d48cad0abc35643311c0045b4038ba57415eb772c9c4eea56',
 'T07-given-3.json':'6057c803e1c9a23a160baab73bfb267cd3ec0e7b7858b2a1ef5af152c12a0c48',
 'T07.json':'11419c6ae4d3e0d35bd34099b4e70e39ee011b093fbbf05ad3489834f80f2993',
 'V1.json':'bb6e272060467119423dd59da1da7e05b93d24acb96d357f7a11a92b4f781021',
 'V2.json':'a7d7805c235d7c1ea20c7ffd911f7de8c771e2d4b0587d9da7b94dbfb917d9b6',
 'report.md':'315383027431606eb10edf099ce73346dac0ba67c73783723604b3882e10939a'
};

test('C exposes five count exclusions with reachable witnesses before any field fixation',()=>{
 const s=state('C','H1+H2'),f=field('C','H1+H2',4),w=f.witnesses.find(w=>w.step==='D19');
 assert.deepEqual(s.local.additionalFixedHours,[]);
 assert.equal(f.marks.check,null);assert.equal(f.marks.question.length,10);
 assert.deepEqual(w.removed,['B2','B3','B4','C1','C5']);
 assert.equal(w.rule,'count-bounds');assert.deepEqual(w.clueIds,['H2']);
 assert.deepEqual(w.reachableClueIds,['H1','H2']);assert.deepEqual(w.premises,['D11','D18','D15']);
 assert.ok(w.reusedBy.length);
 // Validate the certificate with the existing checker, independently of the new view.
 const source=inputs.find(i=>i.id==='C'),logic={...source.logic,clues:source.logic.clues.slice(0,2)};
 const native=diagnosePuzzle(logic).scenarios.at(-1),solutions=solvePuzzle(logic,{metrics:false}).solutions;
 verifyTrace(logic,native.local,solutions);
 const broken=structuredClone(native.local);broken.trace.find(t=>t.id==='D19').premises=['D11','D15'];
 assert.throws(()=>verifyTrace(logic,broken,solutions),/tight count bound/);
 assert.match(renderProgressReport(profiles),/C: markierbarer Ausschluss ohne feste Stunde/);
 const full=state('C','H1+H2+H3+H4+H5');
 const reused=full.local.fields.find(f=>f.hour===4).witnesses.find(w=>w.step==='D19');
 assert.ok(reused.fixedFollowUps.some(n=>n.hour===4));
 assert.ok(reused.fixedFollowUps.every(n=>n.relation==='certificate-descendant'));
});

test('A shows one clue carrying the complete local solution without a quality claim',()=>{
 const p=profile('A'),s=state('A','H1');
 assert.deepEqual(p.intermediateProgress.singleClueCompleteWitnesses,['H1']);
 assert.equal(p.intermediateProgress.singleClueCoverageComplete,true);
 assert.deepEqual(s.local.additionalFixedHours,[1,2,3,4,5,6]);
 assert.ok(s.local.fields.every(f=>f.hour>0&&f.marks.check&&f.marks.question.length===0));
 assert.deepEqual(state('A','none').local.fields,[]);
 const report=renderProgressReport(profiles);
 assert.match(report,/H1 allein trägt bereits alle sechs Stunden/);
 assert.doesNotMatch(report,/langweilig|trivial|Qualitätspunktzahl/);
});

test('D preserves exclusions, possible hour 6 and non-representable associations',()=>{
 assert.deepEqual(field('D','H1',1).marks.cross,['C2','D3']);
 assert.deepEqual(field('D','H2',1).marks.question,['B2','D3']);
 assert.equal(field('D','H2',1).marks.check,null);
 assert.equal(field('D','H1+H2',1).marks.check,'B2');
 const pair=field('D','H1+H2',1);
 assert.ok(pair.witnesses.find(w=>w.step==='D16').reusedBy.some(n=>n.step==='D17'));
 const early=field('D','H1+H2+H5',6);
 assert.equal(early.marks.check,null);assert.deepEqual(early.marks.question,['B3','B4','C2','C4','D3']);
 const full='H1+H2+H3+H4+H5';
 assert.equal(field('D',full,6).marks.check,'B3');
 assert.deepEqual(field('D',full,3).marks.question,['A1','A2']);
 assert.equal(field('D',full,2).marks.check,null);
 const exact=state('D',full).exact.fields.find(f=>f.hour===2);
 assert.equal(exact.fixed,'B1');assert.equal(Object.hasOwn(exact,'witnesses'),false);
 const coupling=profile('D').evidence.representation.localCouplings.find(c=>c.fromHour===3);
 assert.deepEqual(coupling.transitions,['A1>A2','A2>A1']);
 assert.equal(profile('D').intermediateProgress.relationalEvidence.associationMarksAvailable,false);
});

test('version 2 is additive, preserves all base fields and leaves version 1 byte-identical',()=>{
 for(const input of inputs){
  const p=profile(input.id),{format,baseFormat,intermediateProgress,...rest}=p;
  assert.equal(format,FORMAT);assert.equal(baseFormat,'b2-deduction-profile-1');
  assert.deepEqual({format:baseFormat,...rest},buildProfile(input));
 }
 for(const [name,hash] of Object.entries(oldHashes))
  assert.equal(sha256(fs.readFileSync(path.join(ROOT,'docs/verification/B2-deduction-profile',name))),hash,name);
 for(const id of ['V1','V2']){
  const p=profile(id);
  assert.deepEqual(p.evidence.clueWitnesses.local.map(w=>w.minimumClueCount),[3,4,4,2,1,5]);
  assert.equal(field(id,'H3',5).marks.check,'D2');
 }
 assert.notDeepEqual(profile('V1').evidence.clueWitnesses.local[2].witnesses,profile('V2').evidence.clueWitnesses.local[2].witnesses);
 assert.deepEqual(profile('B').intermediateProgress.singleClueCompleteWitnesses,[]);
 assert.match(renderProgressReport(profiles),/menschliche Qualitätsbewertung wird nicht ergänzt/);
 assert.deepEqual(profile('C').evidence.clueWitnesses.local.map(w=>w.minimumClueCount),[2,2,2,4,5,5]);
});

test('every additional mark and reuse edge resolves to its actual state and trace',()=>{
 for(const input of inputs){
  const byId=new Map(input.states.map(s=>[s.clueIds.length?[...s.clueIds].sort().join('+'):'none',s]));
  const baseline=byId.get('none');
  for(const s of profile(input.id).intermediateProgress.states){
   const original=byId.get(s.state),trace=new Map(original.local.trace.map(t=>[t.id,t]));
   assert.deepEqual(s.source,original.source);
   for(const f of s.local.fields){
    assert.ok(f.hour>0&&!input.givens.some(g=>g.hour===f.hour));
    assert.deepEqual(f.marks.cross,baseline.local.domains[f.hour].filter(c=>!original.local.domains[f.hour].includes(c)).sort());
    for(const w of f.witnesses){
     const t=trace.get(w.step);assert.equal(t.rule,w.rule);assert.equal(t.hour,f.hour);
     assert.deepEqual(t.premises,w.premises);assert.ok(w.removed.every(c=>t.removed.includes(c)));
     for(const next of w.reusedBy)assert.ok(trace.get(next.step).premises.includes(w.step));
     for(const next of w.fixedFollowUps){assert.equal(trace.get(next.step).fixed,next.cell);assert.ok(next.hour>0);}
    }
   }
  }
 }
 assert.ok(profile('T07-given-3').intermediateProgress.states.every(s=>s.local.fields.every(f=>f.hour>3)));
});

test('unknown states stay unknown; input order does not become a human ordering',()=>{
 const original=inputs.find(i=>i.id==='C'),missing=structuredClone(original);
 missing.states=missing.states.filter(s=>s.clueIds.join('+')!=='H1+H2');
 const altered=buildProgressProfile(missing);
 assert.ok(altered.evidence.coverage.missingStates.includes('H1+H2'));
 assert.ok(!altered.intermediateProgress.states.some(s=>s.state==='H1+H2'));
 const report=renderProgressReport(profiles.map(p=>p.id==='C'?altered:p));
 assert.match(report,/C, H1\+H2: nicht untersucht; kein Ausschluss behauptet/);
 const shuffled={...original,states:[...original.states].reverse()};
 assert.deepEqual(buildProgressProfile(shuffled).intermediateProgress,profile('C').intermediateProgress);
 assert.match(profile('C').intermediateProgress.order,/never a human or optimal/);
 const bad=structuredClone(original);
 const pair=bad.states.find(s=>s.clueIds.join() === 'H1,H2');
 pair.local.trace.find(t=>t.id==='D19').premises.push('missing');
 assert.throws(()=>buildProgressProfile(bad),/Premise must precede/);
});

test('new sources and profiles reproduce within the fixed four-case scope; normal CLI stays read-only',()=>{
 const sources=progressEvidenceFiles();assert.equal(sources.size,5);
 const manifest=JSON.parse(sources.get('sources.json'));
 assert.deepEqual(manifest.cases.map(c=>[c.id,c.states.count]),[['A',2],['B',8],['C',32],['D',32]]);
 for(const [name,bytes] of sources)assert.equal(fs.readFileSync(path.join(ROOT,EVIDENCE,name),'utf8'),bytes,name);
 const before=new Map(inputs.flatMap(c=>c.inputs.map(i=>[i.path,sha256(fs.readFileSync(path.join(ROOT,i.path)))])));
 const files=progressReportFiles();assert.equal(files.size,10);
 for(const [name,bytes] of files)assert.equal(fs.readFileSync(path.join(ROOT,OUTPUT,name),'utf8'),bytes,name);
 assert.deepEqual(buildProgressProfiles(),profiles);
 assert.equal(execFileSync(process.execPath,['scripts/report-b2-progress.mjs'],{cwd:ROOT,encoding:'utf8'}),renderProgressReport(profiles)+'\n');
 for(const [ref,hash] of before)assert.equal(sha256(fs.readFileSync(path.join(ROOT,ref))),hash,ref);
 const imports=fs.readFileSync(path.join(ROOT,'scripts/lib/b2-markable-progress.mjs'),'utf8');
 assert.doesNotMatch(imports,/from ['"].*(?:engine|b2-local-deduction|generator|b2-playtest)/);
 assert.throws(()=>execFileSync(process.execPath,['scripts/report-b2-progress.mjs','--write','extra'],{cwd:ROOT,stdio:'pipe'}));
});
