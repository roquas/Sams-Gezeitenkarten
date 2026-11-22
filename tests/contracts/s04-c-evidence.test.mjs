import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';
import {qualitySignals,earlyRejection} from '../../scripts/lib/s03-quality.mjs';
import {preferences,selectCohorts} from '../../scripts/lib/s04-c-selection.mjs';
import {readB1Experiment} from '../../scripts/lib/puzzle-experiment.mjs';
import {planDiagnoses} from '../../scripts/lib/s03-v2-plan.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {normalizeCountClues} from '../../scripts/lib/count-clue-normalization.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';

const base='docs/verification/S04-C/pilot';
const read=ref=>fs.readFileSync(base+'/'+ref);
const json=ref=>JSON.parse(read(ref));
const rows=ref=>read(ref).toString().split('\n').filter(Boolean).map(JSON.parse);
const manifest=json('manifest.json'),summary=json('summary.json'),config=manifest.config;
const library=JSON.parse(fs.readFileSync('assets/catalog/library.json'));

// Digests are obtained from reviewed generation evidence, never recomputed from
// a candidate and its possibly substituted receipt file.
const expectedOrigins={A:'326a58d321741d04a58ea476668d69d2d76b2cb61708886c27f8362fa2aefd67',B:'f0d76e42adf863c6c447fa2cd5666c32d83787d8b2b874383ccf235d61e6709f'};

test('S04-C is a completed small new experiment with fixed source, no public export and no final production',()=>{
 assert.equal(summary.status,'completed');assert.equal(summary.phase,'B');
 assert.equal(summary.finalProductionStarted,false);assert.equal(summary.publicFiles,0);
 assert.equal(fs.existsSync(base+'/ABORTED.json'),false);
 assert.equal(config.normalization,'count-distance-extremes-1');
 for(const f of manifest.inputFiles)assert.equal(sha256(fs.readFileSync(f.path)),f.sha256);
 assert.ok(summary.commonPreparation.batchAttempts<=12);
 assert.ok(summary.commonPreparation.b1IncompleteStarts===0);
 const old=new Set(manifest.historicalFiles.flatMap(f=>fs.readFileSync(f.path,'utf8').split('\n').filter(Boolean)
  .map(JSON.parse).filter(r=>r.fingerprints).map(r=>r.fingerprints.variant)));
 for(const arm of config.arms)for(const r of rows(arm.id+'/generated.jsonl')){
  assert.ok(!old.has(r.fingerprints.variant));
  assert.equal(normalizeCountClues(r.definition.logic.clues).changed,false,'Final clues must already be in normal form');
 }
 const a=rows('A/generated.jsonl'),b=rows('B/generated.jsonl');
 for(const r of a){const sibling=b.find(s=>s.fingerprints.variant===r.fingerprints.variant);assert.ok(sibling);
  assert.deepEqual(r.definition,sibling.definition);assert.deepEqual(r.routeSource,sibling.routeSource);assert.equal(r.seed,sibling.seed);}
});

for(const arm of config.arms)test('S04-C '+arm.id+' receipts, normalized proofs, diagnosis plan, all states and private cohorts replay',()=>{
 const generated=rows(arm.id+'/generated.jsonl'),records=rows(arm.id+'/raw.jsonl'),s=json(arm.id+'/summary.json');
 assert.equal(verifyCandidates(base+'/'+arm.id+'/generated.jsonl',{
  originContract:json(arm.id+'/candidate-origins.json'),expectedOriginContractSha256:expectedOrigins[arm.id]
 }).verifiedCandidates,generated.length);
 assert.deepEqual(json(arm.id+'/plan.json'),planDiagnoses(generated,{...config,maxTargets:config.batch.maxAttempts}));
 let statesUsed=0;
 for(const r of records){
  if(!r.diagnosis){assert.ok(r.reason==='DIAGNOSIS_BUDGET_EXHAUSTED'||earlyRejection(r,config.quality));continue;}
  assert.equal(earlyRejection(r,config.quality),null);
  const d=r.diagnosis,compressed=read(d.states.path),bytes=gunzipSync(compressed);
  assert.equal(sha256(compressed),d.states.sha256);assert.equal(sha256(bytes),d.states.uncompressedSha256);
  assert.equal(sha256(read(d.inputs[0].path)),d.inputs[0].sha256);
  assert.equal(sha256(JSON.stringify(r.definition,null,2)+'\n'),d.inputs[0].definitionSha256);
  const states=bytes.toString().split('\n').filter(Boolean).map(JSON.parse);statesUsed+=states.length;
  const profile=buildProgressProfile({id:r.candidateId,label:r.candidateId,puzzleId:r.candidateId,
   logic:r.definition.logic,givens:[],states,inputs:d.inputs});
  assert.equal(sha256(JSON.stringify(profile)),d.profileSha256);
  assert.deepEqual(qualitySignals(profile),r.signals);
  assert.deepEqual(preferences(r.signals,config.quality),r.preferences);
 }
 assert.equal(statesUsed,s.diagnosisStates);assert.ok(statesUsed<=config.maxDiagnosisStates);
 assert.deepEqual(selectCohorts(records.filter(r=>r.preferences),config.selection),s.cohorts);
 for(const f of manifest.historicalFiles)assert.deepEqual(fs.readFileSync(f.path),
  execFileSync('git',['show',config.baseCommit+':'+f.path],{maxBuffer:64*1024*1024}));
});

test('new candidates fit the existing v2 presentation/public allowlist without shipping private analysis',()=>{
 let count=0;
 for(const arm of config.arms){
  const records=rows(arm.id+'/raw.jsonl'),s=json(arm.id+'/summary.json');
  for(const item of s.cohorts.selected){
   const r=records.find(r=>r.candidateId===item.candidateId),logic=r.definition.logic,id='S04-C-'+String(++count).padStart(2,'0');
   const internal={...r.definition,id,presentation:{title:id,intro:['Interne Formatprüfung.'],
    objectNames:Object.fromEntries(logic.map.objects.map(o=>[o.id,'Ort '+o.id])),
    clueTexts:Object.fromEntries(logic.clues.map(c=>[c.id,technicalClueText(c,logic.map)])),
    hints:[],background:config.backgroundId,assetPlacements:r.assetPlacements}};
   const identity=Object.fromEntries(['mapStructure','instance','variant'].map((key,i)=>[
    ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+r.fingerprints[key].split(':')[1]]));
   const dto=projectPublicPuzzle(internal,{identity,assetLibrary:library});
   assert.deepEqual(compilePuzzle(dto.puzzle,{assetLibrary:library}).solution,r.definition.solution);
   for(const key of ['solution','proof','diagnosis','preferences','group','signals','normalization','preparation'])
    assert.equal(Object.hasOwn(dto.puzzle,key),false);
   assert.equal(dto.puzzle.logic.clues.length,r.definition.logic.clues.length);
  }
 }
 assert.ok(count>0);
});


test('new private candidates bind the authenticated B1 maps, starts and released assignments',async()=>{
 const loaded=await readB1Experiment(base+'/b1',{batch:base+'/source-batch'});
 for(const arm of config.arms)for(const r of rows(arm.id+'/generated.jsonl')){
  const map=loaded.rows.find(m=>m.mapTrialId===r.b1MapTrialId);assert.ok(map);
  assert.deepEqual(r.definition.logic.map,map.map);assert.deepEqual(r.assetPlacements,map.assetPlacements);
  assert.ok(map.starts.some(s=>s.trialId===r.b1StartTrialId&&s.cell===r.definition.logic.start));
  assert.equal(r.routeSource.mapFingerprint,map.mapFingerprint);
 }
});
