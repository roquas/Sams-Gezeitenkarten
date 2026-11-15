import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {planDiagnoses} from '../../scripts/lib/s03-v2-plan.mjs';
import {loadV2Sources,importSourceRecord,V1} from '../../scripts/lib/s03-v2-source.mjs';
import {configV2} from '../../scripts/lib/s03-v2-pilot.mjs';
import {readS03Inputs} from '../../scripts/lib/s03-pilot.mjs';
import {ROOT,buildPlaytest,validatePlaytestBindings,contentHash,parsePlaytestArgs} from '../../scripts/lib/b2-playtest.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';

const fixture=(map,ordinal,n=3)=>({candidateId:`map${map}/v${ordinal}`,mapIndex:map,
 source:{candidateId:`old${map}/v${ordinal}`,ordinal,line:map*4+ordinal},
 definition:{logic:{clues:Array.from({length:n},()=>({}))}},properties:{individualExactness:[{hours:[]}]}});

test('round-robin covers every eligible map before second choices and handles uneven source groups',()=>{
 const rows=[fixture(0,1,2),fixture(0,2),fixture(0,3),fixture(0,4),fixture(1,1),fixture(1,2),fixture(2,1)];
 const config={...configV2,maxTargets:3,maxDiagnoses:5};
 const plan=planDiagnoses(rows,config);
 assert.deepEqual(plan.scheduled.map(c=>[c.mapIndex,c.sourceOrdinal,c.round]),[[0,2,1],[1,1,1],[2,1,1],[0,3,2],[1,2,2]]);
 assert.equal(plan.earlyRejected[0].reason,'CLUE_COUNT');
 assert.deepEqual(plan.undiagnosed.map(c=>c.candidateId),['map0/v4']);
 assert.deepEqual(plan,planDiagnoses([...rows].reverse(),config));
 assert.deepEqual(planDiagnoses(rows,{...config,maxDiagnoses:0}).scheduled,[]);
 assert.equal(planDiagnoses(rows,{...config,maxDiagnoses:100}).scheduled.length,6);
});

test('planning depends only on source ordinal and existing early criteria, never prior diagnosis success',()=>{
 const rows=Array.from({length:3},(_,m)=>[fixture(m,1),fixture(m,2)]).flat();
 const before=planDiagnoses(rows,{...configV2,maxTargets:3});
 const poisoned=rows.map((r,i)=>({...r,signals:{enjoyment:i,localSolved:i%2===0},reason:'OLD_REJECTION',
  decision:'old-finalist',diagnosis:{success:i%2===0},source:{...r.source,oldOutcome:i}}));
 assert.deepEqual(planDiagnoses(poisoned,{...configV2,maxTargets:3}),before);
 assert.throws(()=>planDiagnoses([...rows,rows[0]],{...configV2,maxTargets:3}),/Duplicate/);
 assert.throws(()=>planDiagnoses([fixture(3,1)],{...configV2,maxTargets:3}),/outside/);
});

const read=ref=>fs.readFileSync(path.join(ROOT,ref));
const source=loadV2Sources(configV2);

test('all eighty v1 candidates are materialized with identical logical identities and a result-independent forty-position plan',()=>{
 assert.equal(source.candidates.length,80);assert.equal(source.files.length,62);
 const records=source.candidates.map(c=>({...c,candidateId:c.source.candidateId}));
 const plan=planDiagnoses(records,configV2);
 assert.equal(plan.eligibleCount,72);assert.equal(plan.scheduled.length,40);
 assert.ok(plan.perMap.every(m=>m.scheduled===2));
 assert.deepEqual(plan.scheduled.slice(0,20).map(p=>p.mapIndex),Array.from({length:20},(_,i)=>i));
 assert.ok(source.candidates.every(c=>!Object.hasOwn(c,'signals')&&!Object.hasOwn(c,'diagnosis')&&!Object.hasOwn(c,'decision')));
 const lines=read(V1+'/raw.jsonl').toString().trim().split('\n');
 for(const c of source.candidates){
  const original=JSON.parse(lines[c.source.line-1]);
  assert.equal(c.source.recordSha256,sha256(lines[c.source.line-1]));
  for(const key of ['definition','fingerprints','effectKey','proof','properties','assetPlacements','seed','routeIndex'])
   assert.deepEqual(c[key],original[key]);
  assert.equal(c.source.contentSha256,contentHash(c));
 }
});

test('source importer rejects changed fingerprints, definitions, seed and identity while discarding old diagnostic payload',()=>{
 const row=JSON.parse(read(V1+'/raw.jsonl').toString().split('\n')[0]);
 const context={line:1,manifest:source.manifest,attempt:source.attempts[0],target:readS03Inputs().targets[0]};
 const imported=importSourceRecord(row,context);
 const alteredOutcomes={...row,signals:{bad:true},diagnosis:{untrusted:true},decision:'ignore-me',reason:'ignore-me'};
 const alternate=importSourceRecord(alteredOutcomes,context);
 assert.deepEqual({...alternate,source:{...alternate.source,recordSha256:imported.source.recordSha256}},imported);
 for(const mutate of [r=>r.seed++,r=>r.candidateId+='x',r=>r.fingerprints.variant+='x',
  r=>r.definition.logic.clues[0].id='tampered',r=>r.routeIndex++]){
  const broken=structuredClone(row);mutate(broken);assert.throws(()=>importSourceRecord(broken,context));
 }
 assert.throws(()=>loadV2Sources({...configV2,quality:{...configV2.quality,maxOpenHours:3}}),/criterion changed/);
});

function syntheticV2(){
 const c=source.candidates.find(c=>c.definition.logic.clues.length>=3);
 const experimentId='gk-s03-v2-test',attemptId=experimentId+'/M000';
 const row={...c,puzzleExperimentFormatVersion:2,experimentId,attemptId,
  candidateId:attemptId+'/'+c.fingerprints.variant,testName:c.source.testName.replace('B2-S03-','B2-S03-V2-')};
 const entry={testName:row.testName,candidateId:row.candidateId,recordSha256:sha256(JSON.stringify(row)),
  fingerprints:row.fingerprints,effectKey:row.effectKey,contentSha256:contentHash(row),attemptId};
 return {manifest:{...source.manifest,protocol:configV2.protocol,experimentId,sourceExperimentId:source.manifest.experimentId},
  registry:{registryVersion:1,stockId:'B2-S03-V2',experimentId,entries:[entry]},rows:[row]};
}

test('v2 public export uses the released formatter without changing logical clues or exposing private sources',()=>{
 const stock=syntheticV2(),files=buildPlaytest(stock);
 const dto=JSON.parse(files.get(stock.registry.entries[0].testName+'.json'));
 assert.deepEqual(dto.puzzle.logic,stock.rows[0].definition.logic);
 for(const clue of dto.puzzle.logic.clues)assert.equal(dto.puzzle.presentation.clueTexts[clue.id],technicalClueText(clue,dto.puzzle.logic.map));
 assert.equal(Object.hasOwn(dto.puzzle,'solution'),false);
 for(const key of ['source','signals','diagnosis','proof'])assert.equal(Object.hasOwn(dto,key),false);
 assert.equal(parsePlaytestArgs(['--stock','S03-V2']).stock,'S03-V2');
 for(const mutate of [s=>s.rows[0].source.candidateId+='x',s=>s.rows[0].source.contentSha256='bad',s=>s.rows[0].source.testName+='x']){
  const broken=structuredClone(stock);mutate(broken);
  // Even a rebound record hash cannot disguise an inconsistent source identity.
  broken.registry.entries[0].recordSha256=sha256(JSON.stringify(broken.rows[0]));
  assert.throws(()=>validatePlaytestBindings(broken),/source/);
 }
});

test('released formatter, radar, solver and deduction rules are byte-identical to synchronized main',()=>{
 for(const ref of ['scripts/lib/clue-text.mjs','src/state/distance-overlay.mjs','src/engine/solver.mjs',
  'src/engine/puzzle.mjs','scripts/lib/b2-local-deduction.mjs','scripts/lib/b2-deduction.mjs'])
  assert.deepEqual(read(ref),execFileSync('git',['show','70e563d:'+ref],{cwd:ROOT}));
});
