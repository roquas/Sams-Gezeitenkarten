// Read-only validation of the pilot, separate from its generation budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readPlaytestSource,validatePlaytestBindings,buildPlaytest} from '../../scripts/lib/b2-playtest.mjs';
import {config,RUN} from '../../scripts/lib/s03-pilot.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {qualitySignals,earlyRejection,lateRejection,selectSeries} from '../../scripts/lib/s03-quality.mjs';
import {buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {projectRoutes,assertLocalSound} from '../../scripts/lib/b2-deduction.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';
const read=ref=>fs.readFileSync(path.join(ROOT,ref),'utf8');
const rows=ref=>read(ref).trim().split('\n').filter(Boolean).map(JSON.parse);
const runRows=file=>rows(RUN+'/'+file);
const summary=JSON.parse(read(RUN+'/summary.json')),raw=runRows('raw.jsonl'),attempts=runRows('attempts.jsonl');

test('pilot budgets, raw inventory, decisions and replayable selection match the frozen v1 contract',()=>{
 assert.equal(summary.status,'completed');assert.equal(attempts.length,20);
 assert.ok(summary.reducedSets<=80);assert.equal(raw.length,summary.distinctRawCandidates);
 assert.equal(summary.reducedSets,attempts.reduce((n,a)=>n+(a.search?.reducedSets??0),0));
 assert.equal(new Set(raw.map(r=>r.candidateId)).size,raw.length);
 assert.equal(summary.diagnoses,raw.filter(r=>r.diagnosis).length);assert.ok(summary.diagnoses<=24);
 assert.equal(summary.diagnosisStates,raw.reduce((n,r)=>n+(r.diagnosis?.states.count??0),0));
 for(const a of attempts)if(a.search){
  assert.ok(a.search.restarts<=4);assert.ok(a.search.solverChecks<=2000);
  assert.ok(a.search.matchEvaluations<=5000000);assert.ok(a.search.routeFilterEvaluations<=20000000);
  assert.ok(a.pool.completed);assert.ok(a.pool.parametersExamined<=100000);
 }
 const finalists=runRows('finalists.jsonl');assert.equal(finalists.length,summary.finalists);
 assert.deepEqual(selectSeries(finalists,config).selected,runRows('candidates.jsonl'));
 assert.equal(verifyCandidates(path.join(ROOT,RUN,'finalists.jsonl')).verifiedCandidates,finalists.length);
 const source=readPlaytestSource('S03');assert.equal(validatePlaytestBindings(source).size,summary.selected.length);
 const oldVariants=new Set(['S01','S02','BC'].flatMap(stock=>readPlaytestSource(stock).rows.map(r=>r.fingerprints.variant)));
 assert.ok(source.rows.every(r=>!oldVariants.has(r.fingerprints.variant)));
 assert.ok(source.rows.length<=10);assert.ok(buildPlaytest(source).size===source.rows.length+1);
});

test('every stored deduction graph has reachable premises, exact support and source-bound profile signals',()=>{
 let diagnoses=0;
 for(const record of raw){
  assert.ok(record.definition.logic.clues.every(c=>c.type!=='countDistanceToPlace'||c.fromHour===c.toHour||c.fromHour>=1));
  if(!record.diagnosis){assert.ok(record.reason);continue;}
  assert.equal(earlyRejection(record,config.quality),null);diagnoses++;
  const {definition,states:ref}=record.diagnosis;
  assert.equal(sha256(read(definition.path)),definition.sha256);assert.equal(sha256(read(ref.path)),ref.sha256);
  const states=rows(ref.path),logic=record.definition.logic,rules=createRules(logic);
  const legal=[...rules.routes([logic.start],{remaining:250000})];
  for(const [i,s] of states.entries()){
   assert.deepEqual(s.source,{path:ref.path,line:i+1});
   const clues=logic.clues.filter(c=>s.clueIds.includes(c.id));
   const solutions=legal.filter(route=>clues.every(c=>rules.matches(route,c)));
   const exact=projectRoutes(solutions);
   assert.equal(s.exact.routeCount,exact.routeCount);
   assert.deepEqual(s.exact.domains,exact.domains);assert.deepEqual(s.exact.transitions,exact.transitions);
   assertLocalSound(exact,s.local);verifyTrace({...logic,clues},s.local,solutions);
  }
  assert.equal(states.length,ref.count);assert.ok(states.length<=65);
  const profile=buildProgressProfile({id:record.testName,label:record.testName,puzzleId:record.testName,
   logic,givens:[],states,inputs:[definition,{path:ref.path,sha256:ref.sha256}]});
  assert.deepEqual(qualitySignals(profile),record.signals);
  assert.equal(lateRejection(record.signals,config.quality),record.reason);
 }
 assert.equal(diagnoses,summary.diagnoses);
});
