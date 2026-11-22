// Offline verifier. The expected receipt is a separately authenticated input.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyCandidates} from './verify-puzzle-experiment.mjs';
import {selectTargetRoute} from './lib/route-experiment.mjs';
import {readB1Experiment} from './lib/puzzle-experiment.mjs';
import {sha256,canonicalJson} from './lib/content-hash.mjs';
import {buildProgressProfile} from './lib/b2-markable-progress.mjs';
import {diagnosePuzzle} from './lib/b2-deduction.mjs';
import {qualitySignals,earlyRejection,lateRejection} from './lib/s03-quality.mjs';
import {preferences,preferred,selectCohorts} from './lib/s04-c-selection.mjs';
import {productionPlan,deterministicFiles,validateProductionConfig,writePrivateHandoff} from './lib/s04-c-production-policy.mjs';
import {normalizeCountClues} from './lib/count-clue-normalization.mjs';
import {mapFingerprint} from './lib/publication-archive.mjs';
import {projectPublicPuzzle} from '../src/puzzles/public.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
import {technicalClueText} from './lib/clue-text.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',['-C',ROOT,...args],{maxBuffer:64*1024*1024});
export async function verifyProduction(out,expected){
 assert.ok(expected?.programCommit&&expected?.originContractSha256&&expected?.inventorySha256,'Independent expected receipt required');
 const read=p=>fs.readFileSync(path.join(out,p)),json=p=>JSON.parse(read(p)),rows=p=>read(p).toString().split('\n').filter(Boolean).map(JSON.parse);
 const manifest=json('manifest.json'),summary=json('summary.json'),c=manifest.config;
 assert.equal(manifest.program.commit,expected.programCommit);assert.equal(manifest.program.nodeVersion,c.nodeVersion);
 validateProductionConfig(c);
 assert.deepEqual(c,JSON.parse(git('show',expected.programCommit+':scripts/config/s04-c-production-v1.json')));
 const {experimentId,...settings}=manifest;
 assert.equal(experimentId,'gk-s04-c-production-sha256:'+sha256(canonicalJson({...settings,config:JSON.stringify(c)})));
 assert.equal(summary.experimentId,experimentId);assert.equal(summary.status,'completed');assert.equal(summary.phase,'C');
 assert.equal(summary.publicFiles,0);assert.equal(summary.externalPlaytestStarted,false);assert.equal(fs.existsSync(path.join(out,'ABORTED.json')),false);
 assert.equal(sha256(read('inventory.json')),expected.inventorySha256);
 const inventory=json('inventory.json');assert.deepEqual(inventory.map(f=>f.path),deterministicFiles(out));
 for(const f of inventory){const bytes=read(f.path);assert.equal(bytes.length,f.bytes);assert.equal(sha256(bytes),f.sha256);}
 for(const f of manifest.inputFiles)assert.equal(sha256(git('show',expected.programCommit+':'+f.path)),f.sha256);
 const historicalMaps=new Set(),historicalVariants=new Set();
 for(const f of manifest.historicalFiles){
  const bytes=git('show',c.baseCommit+':'+f.path);assert.equal(sha256(bytes),f.sha256);
  for(const r of bytes.toString().split('\n').filter(Boolean).map(JSON.parse)){
   const map=r.definition?.logic.map??r.generation?.map;if(map)historicalMaps.add(mapFingerprint(map));
   if(r.fingerprints)historicalVariants.add(r.fingerprints.variant);
  }
 }
 const loaded=await readB1Experiment(path.join(out,'b1'),{batch:path.join(out,'source-batch')});
 const preparation=json('preparation.json'),attempts=rows('C/attempts.jsonl');
 const generated=rows('C/generated.jsonl'),records=rows('C/raw.jsonl'),s=json('C/summary.json');
 assert.deepEqual(summary.arms,[s]);assert.equal(s.originContractSha256,expected.originContractSha256);
 assert.equal(verifyCandidates(path.join(out,'C/generated.jsonl'),{originContract:json('C/candidate-origins.json'),expectedOriginContractSha256:expected.originContractSha256}).verifiedCandidates,generated.length);
 assert.equal(records.length,generated.length);assert.equal(s.raw,records.length);
 assert.deepEqual(json('C/plan.json'),productionPlan(generated,c));const plan=json('C/plan.json');
 const scheduled=new Set(plan.scheduled.map(r=>r.candidateId));let statesUsed=0;
 for(const [i,r] of records.entries()){
  for(const [k,v] of Object.entries(generated[i]))assert.deepEqual(r[k],v,'Generated record altered: '+k);
  assert.ok(!historicalMaps.has(r.fingerprints.mapStructure));assert.ok(!historicalVariants.has(r.fingerprints.variant));
  assert.equal(normalizeCountClues(r.definition.logic.clues).changed,false);
  const map=loaded.rows.find(m=>m.mapTrialId===r.b1MapTrialId);assert.ok(map);
  assert.deepEqual(r.definition.logic.map,map.map);assert.deepEqual(r.assetPlacements,map.assetPlacements);
  assert.ok(map.starts.some(t=>t.trialId===r.b1StartTrialId&&t.cell===r.definition.logic.start));
  assert.equal(r.routeSource.mapFingerprint,map.mapFingerprint);assert.equal(r.mapIndex,map.source.candidateIndex);
  const prep=preparation.attempts.find(a=>a.mapIndex===r.mapIndex);assert.ok(prep?.target);
  assert.deepEqual(r.routeSource,prep.target.source);assert.equal(r.seed,c.seed+r.mapIndex);
  assert.equal(r.definition.logic.start,map.starts.find(t=>t.countExact&&t.routeCountLowerBound>0).cell);
  assert.deepEqual(selectTargetRoute(map.map,{start:r.definition.logic.start,routeIndex:r.routeSource.routeIndex,maxNodes:c.maxNodes}).route,r.definition.solution);
  const early=earlyRejection(r,c.quality);
  if(!scheduled.has(r.candidateId)){
   assert.equal(r.diagnosis,undefined);assert.equal(r.preferences,undefined);
   assert.equal(r.disposition,early?'early-quality-rejected':'undiagnosed');
   assert.equal(r.reason,early??(plan.undiagnosed.find(p=>p.candidateId===r.candidateId)?.round>c.maxDiagnosesPerMap?'DIAGNOSIS_PER_MAP_LIMIT':'DIAGNOSIS_BUDGET_EXHAUSTED'));continue;
  }
  assert.equal(early,null);const d=r.diagnosis,compressed=read(d.states.path),bytes=gunzipSync(compressed);
  assert.equal(sha256(compressed),d.states.sha256);assert.equal(sha256(bytes),d.states.uncompressedSha256);
  assert.equal(sha256(read(d.inputs[0].path)),d.inputs[0].sha256);
  assert.equal(sha256(JSON.stringify(r.definition,null,2)+'\n'),d.inputs[0].definitionSha256);
  const states=bytes.toString().split('\n').filter(Boolean).map(JSON.parse);statesUsed+=states.length;
  assert.equal(states.length,d.count);assert.ok(states.length<=c.maxStatesPerDiagnosis);
  const fresh=diagnosePuzzle(r.definition.logic);
  assert.deepEqual(states.map(({source,...s})=>s),fresh.scenarios);assert.deepEqual(d.validation,fresh.validation);
  const profile=buildProgressProfile({id:r.candidateId,label:r.candidateId,puzzleId:r.candidateId,logic:r.definition.logic,givens:[],states,inputs:d.inputs});
  assert.equal(sha256(JSON.stringify(profile)),d.profileSha256);assert.deepEqual(qualitySignals(profile),r.signals);
  assert.deepEqual(preferences(r.signals,c.quality),r.preferences);assert.equal(lateRejection(r.signals,c.quality),r.lateReason);
  assert.equal(r.disposition,preferred(r.preferences)?'preferred-eligible':'comparison-eligible');
 }
 assert.equal(statesUsed,s.diagnosisStates);assert.equal(s.diagnoses,scheduled.size);assert.ok(statesUsed<=c.maxDiagnosisStates);
 assert.equal(s.undiagnosed,records.filter(r=>r.disposition==='undiagnosed').length);
 assert.deepEqual(selectCohorts(records,c.selection),s.cohorts);
 assert.equal(s.preferredCandidates,records.filter(r=>r.preferences&&preferred(r.preferences)).length);
 assert.equal(s.earlyRejected,records.filter(r=>earlyRejection(r,c.quality)).length);
 for(const key of ['restarts','solverChecks','cacheHits','matchEvaluations','routeFilterEvaluations'])assert.equal(s.searchCosts[key],attempts.reduce((n,a)=>n+a.search[key],0));
 assert.ok(preparation.batch.attemptedCount<=c.batch.maxAttempts);assert.ok(preparation.batch.acceptedCount<=c.batch.targetCount);
 assert.equal(summary.commonPreparation.batchAttempts,preparation.batch.attemptedCount);assert.equal(summary.preparedTargets,attempts.length);
 const byId=new Map(records.map(r=>[r.candidateId,r]));const maps=new Set();
 const library=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/catalog/library.json')));
 for(const item of s.cohorts.selected){
  const r=byId.get(item.candidateId);assert.ok(!maps.has(r.fingerprints.mapStructure));maps.add(r.fingerprints.mapStructure);
  const logic=r.definition.logic,id='private-compatibility-check';
  const internal={...r.definition,id,presentation:{title:id,intro:['Interne Formatprüfung.'],objectNames:Object.fromEntries(logic.map.objects.map(o=>[o.id,'Ort '+o.id])),clueTexts:Object.fromEntries(logic.clues.map(cl=>[cl.id,technicalClueText(cl,logic.map)])),hints:[],background:c.backgroundId,assetPlacements:r.assetPlacements}};
  const identity=Object.fromEntries(['mapStructure','instance','variant'].map((k,i)=>[['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+r.fingerprints[k].split(':')[1]]));
  const dto=projectPublicPuzzle(internal,{identity,assetLibrary:library});assert.deepEqual(compilePuzzle(dto.puzzle,{assetLibrary:library}).solution,r.definition.solution);
  for(const k of ['solution','proof','diagnosis','preferences','group','signals','normalization','preparation'])assert.equal(Object.hasOwn(dto.puzzle,k),false);
 }
 writePrivateHandoff(records,s.cohorts,c,(ref,bytes)=>assert.equal(read(ref).toString(),bytes));
 return {verifiedCandidates:records.length,verifiedDiagnoses:scheduled.size,verifiedStates:statesUsed,compatibleSelected:maps.size,inventoryFiles:inventory.length,originContractSha256:expected.originContractSha256};
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))){
 const [out,receipt,...extra]=process.argv.slice(2);
 if(!out||!receipt||extra.length)throw Error('Usage: node scripts/verify-s04-c-production.mjs PRIVATE_DIRECTORY INDEPENDENT_RECEIPT_JSON');
 console.log(JSON.stringify(await verifyProduction(path.resolve(out),JSON.parse(fs.readFileSync(receipt)))));
}
