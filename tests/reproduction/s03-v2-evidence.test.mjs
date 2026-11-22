import {historicalCatalogFiles} from '../helpers/historical-catalog.mjs';
// Revalidates recorded evidence and actual exported bytes; never searches clues.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readPlaytestSource,buildPlaytest,contentHash,playtestStock} from '../../scripts/lib/b2-playtest.mjs';
import {main as exportStock} from '../../scripts/export-b2-playtest.mjs';
import {configV2,RUN_V2} from '../../scripts/lib/s03-v2-pilot.mjs';
import {loadV2Sources} from '../../scripts/lib/s03-v2-source.mjs';
import {planDiagnoses} from '../../scripts/lib/s03-v2-plan.mjs';
import {earlyRejection,lateRejection,qualitySignals,selectSeries} from '../../scripts/lib/s03-quality.mjs';
import {buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';
import {projectRoutes,assertLocalSound} from '../../scripts/lib/b2-deduction.mjs';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';
const read=ref=>fs.readFileSync(path.join(ROOT,ref),'utf8');
const rows=ref=>read(ref).trim().split('\n').filter(Boolean).map(JSON.parse);
const runRows=name=>rows(RUN_V2+'/'+name);
const raw=runRows('raw.jsonl'),summary=JSON.parse(read(RUN_V2+'/summary.json'));

test('v2 uses exactly the same eighty sources, unchanged criteria and a precomputed two-round fair plan',()=>{
 const sources=loadV2Sources(configV2),byId=new Map(sources.candidates.map(c=>[c.source.candidateId,c]));
 assert.equal(raw.length,80);assert.equal(summary.generationCalls,0);assert.equal(summary.diagnoses,40);
 assert.equal(summary.locallyCoveredMaps,20);assert.ok(summary.diagnosisStates<=2600);
 for(const r of raw){
  const original=byId.get(r.source.candidateId);assert.ok(original);
  assert.deepEqual(r.source,original.source);
  for(const key of ['definition','fingerprints','effectKey','proof','properties','assetPlacements','seed','routeIndex'])assert.deepEqual(r[key],original[key]);
  assert.equal(contentHash(r),r.source.contentSha256);
  if(!r.diagnosis)assert.equal(r.reason,earlyRejection(r,configV2.quality)??'DIAGNOSIS_BUDGET_EXHAUSTED');
 }
 const plan=JSON.parse(read(RUN_V2+'/plan.json'));
 assert.deepEqual(planDiagnoses(raw,configV2),plan);
 assert.ok(plan.perMap.every(m=>m.scheduled===2));
 const logged=runRows('diagnoses.jsonl');
 assert.deepEqual(logged.map(r=>r.candidateId),plan.scheduled.map(r=>r.candidateId));
 assert.deepEqual(logged.map(r=>r.round),[...Array(20).fill(1),...Array(20).fill(2)]);
 assert.equal(summary.diagnosisStates,logged.reduce((n,r)=>n+r.states,0));
 assert.deepEqual(selectSeries(runRows('finalists.jsonl'),configV2).selected,runRows('candidates.jsonl'));
 assert.equal(verifyCandidates(path.join(ROOT,RUN_V2,'source-candidates.jsonl')).verifiedCandidates,80);
 assert.equal(verifyCandidates(path.join(ROOT,RUN_V2,'finalists.jsonl')).verifiedCandidates,summary.finalists);
});

test('all new v2 diagnosis sources and reachable certificates are sound, including rejected candidates',()=>{
 let count=0,stateCount=0;
 const prior=new Map(rows('docs/verification/S03/run/raw.jsonl').map(r=>[r.candidateId,r]));
 for(const r of raw){
  if(!r.diagnosis)continue;count++;
  const {definition,states:ref}=r.diagnosis;
  assert.equal(sha256(read(definition.path)),definition.sha256);assert.equal(sha256(read(ref.path)),ref.sha256);
  const states=rows(ref.path),logic=r.definition.logic,rules=createRules(logic);
  const legal=[...rules.routes([logic.start],{remaining:250000})];
  for(const [i,s] of states.entries()){
   const clues=logic.clues.filter(c=>s.clueIds.includes(c.id));
   const solutions=legal.filter(route=>clues.every(c=>rules.matches(route,c))),exact=projectRoutes(solutions);
   assert.deepEqual(s.source,{path:ref.path,line:i+1});
   assert.equal(exact.routeCount,s.exact.routeCount);assert.deepEqual(exact.domains,s.exact.domains);
   assert.deepEqual(exact.transitions,s.exact.transitions);assertLocalSound(exact,s.local);
   verifyTrace({...logic,clues},s.local,solutions);
  }
  assert.equal(states.length,ref.count);assert.ok(states.length<=65);stateCount+=states.length;
  const profile=buildProgressProfile({id:r.testName,label:r.testName,puzzleId:r.testName,
   logic,givens:[],states,inputs:[definition,{path:ref.path,sha256:ref.sha256}]});
  assert.deepEqual(qualitySignals(profile),r.signals);
  if(prior.get(r.source.candidateId).signals)assert.deepEqual(r.signals,prior.get(r.source.candidateId).signals,
   'The same logic retains identical quality signals across main synchronization');
  assert.equal(lateRejection(r.signals,configV2.quality),r.reason);
 }
 assert.equal(count,40);assert.equal(stateCount,summary.diagnosisStates);
});

test('actual v2 export matches recorded released-formatter bytes and retains exact game semantics',async()=>{
 exportStock(['--stock','S03-V2']);
 const source=readPlaytestSource('S03-V2'),expected=JSON.parse(read(RUN_V2+'/public-export.json'));
 const directory=playtestStock('S03-V2').output+'/';
 assert.equal(sha256(read('scripts/lib/clue-text.mjs')),expected.formatter.sha256);
 const live=buildPlaytest(source);
 for(const [name,bytes] of live)assert.equal(read(directory+name),bytes,'actual current export: '+name);
 const historical=historicalCatalogFiles(live,JSON.parse(read(RUN_V2+'/manifest.json')).program.commit);
 for(const f of expected.files)assert.equal(sha256(historical.get(f.name)),f.sha256);
 assert.deepEqual([...historical].map(([name,bytes])=>({name,sha256:sha256(bytes)})),expected.files);
 const loader=createPuzzleLoader({manifestUrl:'http://local/'+directory+'manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1),bytes=read(ref);
  return {ok:true,json:async()=>JSON.parse(bytes)};
 }});
 for(const r of source.rows){
  const dto=JSON.parse(read(directory+r.testName+'.json')),puzzle=await loader.load(r.testName);
  assert.deepEqual(dto.puzzle.logic,r.definition.logic);assert.deepEqual(puzzle.solution,r.definition.solution);
  assert.ok(!JSON.stringify(dto).includes('sourceCandidateId'));
  assert.equal(Object.hasOwn(dto.puzzle,'solution'),false);
  const original=createRules(r.definition.logic),exported=createRules(puzzle);
  for(const c of r.definition.logic.clues){
   const text=dto.puzzle.presentation.clueTexts[c.id];
   assert.equal(text,technicalClueText(c,r.definition.logic.map));
   if(c.type!=='countDistanceToPlace')continue;
   const length=c.toHour-c.fromHour+1;
   if(length>1){assert.ok(c.fromHour>=1);assert.ok(text.startsWith(`Von Stunde ${c.fromHour} bis Stunde ${c.toHour} `));}
   else assert.ok(text.startsWith(`In Stunde ${c.fromHour} `));
   if(c.count===0)assert.ok(text.includes(length===1?'nicht ':'nie '));
   if(c.count===length&&length>1)assert.ok(text.includes('in jeder Stunde '));
   if(c.distance===0)assert.ok(text.includes('auf dem Ort '));
   if(c.distance===1)assert.ok(text.includes('neben dem Ort '));
   const object=puzzle.map.objects.find(o=>o.id===c.placeId);
   assert.ok(object.cells.every(cell=>text.includes(cell)));
  }
  for(const route of original.routes())for(const [i,c] of r.definition.logic.clues.entries())
   assert.equal(exported.matches(route,puzzle.clues[i]),original.matches(route,c));
 }
});
