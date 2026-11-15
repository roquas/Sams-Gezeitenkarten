import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateTrueClues,clueKey} from '../../scripts/lib/puzzle-clues.mjs';
import {createRouteWorkspace} from '../../scripts/lib/puzzle-route-solver.mjs';
import {searchPuzzleCandidates,randomIncrementalSearch} from '../../scripts/lib/puzzle-candidate-search.mjs';
import {readPlaytestSource,validatePlaytestBindings,buildPlaytest,contentHash,parsePlaytestArgs} from '../../scripts/lib/b2-playtest.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {earlyRejection,lateRejection,qualitySignals,selectSeries} from '../../scripts/lib/s03-quality.mjs';
import {config,readS03Inputs} from '../../scripts/lib/s03-pilot.mjs';
import {readProfileCases} from '../../scripts/lib/b2-deduction-profile.mjs';
import {buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';

const historical=readPlaytestSource('S02'),reference=historical.rows[0];
const logic={...reference.definition.logic,clues:[]},target=reference.definition.solution;
const forbidden=c=>c.type==='countDistanceToPlace'&&c.fromHour===0&&c.toHour>0;

test('S03 excludes multi-hour S0 in parameter production, retaining single S0 and all other families',()=>{
 const before=structuredClone({logic,target}),options={maxClueParameters:100000};
 const legacy=generateTrueClues(logic,target,options);
 const current=generateTrueClues(logic,target,{...options,policy:config.cluePolicy});
 assert.ok(legacy.completed&&current.completed);
 assert.ok(legacy.clues.some(forbidden));assert.ok(!current.clues.some(forbidden));
 assert.ok(current.clues.some(c=>c.type==='countDistanceToPlace'&&c.fromHour===0&&c.toHour===0));
 assert.ok(current.clues.some(c=>c.type==='countDistanceToPlace'&&c.fromHour>=1&&c.toHour>c.fromHour));
 assert.deepEqual(current.clues.map(clueKey).sort(),legacy.clues.filter(c=>!forbidden(c)).map(clueKey).sort());
 assert.ok(current.parametersExamined<legacy.parametersExamined,'Excluded parameters never consume truth-test budget');
 assert.ok(current.clues.every(c=>createRules(logic).matches(target,c)));
 assert.deepEqual(current,generateTrueClues(logic,target,{...options,policy:config.cluePolicy}));
 assert.deepEqual({logic,target},before);
 const tiny=generateTrueClues(logic,target,{maxClueParameters:6,policy:config.cluePolicy});
 assert.equal(tiny.completed,false);assert.equal(tiny.parametersExamined,6);assert.ok(!tiny.clues.some(forbidden));
 assert.throws(()=>generateTrueClues(logic,target,{...options,policy:'typo'}),/Unknown/);
});

test('optional early evaluation preserves default search, records rejection and never diagnoses a repeated identity',()=>{
 const workspace=createRouteWorkspace(logic,{maxNodes:config.maxNodes});
 const cluePool=generateTrueClues(logic,target,{maxClueParameters:100000,policy:config.cluePolicy});
 const args={logic,targetRoute:target,workspace,cluePool,seed:303,budgets:config.search};
 const original=searchPuzzleCandidates(args);
 assert.deepEqual(original,searchPuzzleCandidates({...args,evaluateCandidate:()=>true}));
 const seen=new Set();let count=0;
 const run=()=>searchPuzzleCandidates({...args,evaluateCandidate(c){
  assert.ok(!seen.has(c.fingerprints.variant));seen.add(c.fingerprints.variant);count++;return 'EXPERIMENTAL_REJECTION';
 },strategy(options){return randomIncrementalSearch({...options,onCandidate(indices,solver){
  const outcome=options.onCandidate(indices,solver);
  assert.notEqual(options.onCandidate(indices,solver),true);
  return outcome;
 }});}});
 const rejected=run();assert.ok(count>0);assert.equal(rejected.candidates.length,0);
 assert.equal(rejected.search.failures.EXPERIMENTAL_REJECTION,count);
 seen.clear();count=0;assert.deepEqual(run(),rejected);
 assert.ok(rejected.search.restarts<=4);
});

test('frozen early and late filter boundaries are experimental and independent',()=>{
 const candidate={definition:{logic:{clues:[1,2,3]}},properties:{individualExactness:[{hours:[1,2,3]}]}};
 assert.equal(earlyRejection(candidate,config.quality),null);
 candidate.properties.individualExactness[0].hours.push(4);
 assert.equal(earlyRejection(candidate,config.quality),'SINGLE_CLUE_DOMINANCE');
 candidate.definition.logic.clues.pop();assert.equal(earlyRejection(candidate,config.quality),'CLUE_COUNT');
 const signals={entryStates:['H1'],openHours:[{hour:1,size:3},{hour:2,size:3}],localCouplings:2};
 assert.equal(lateRejection(signals,config.quality),null);
 assert.equal(lateRejection({...signals,entryStates:[]},config.quality),'NO_MARKABLE_ENTRY');
 assert.equal(lateRejection({...signals,openHours:[{hour:1,size:4}]},config.quality),'LOCAL_REMAINDER');
 assert.equal(lateRejection({...signals,localCouplings:3},config.quality),'COUPLED_REMAINDER');
});

test('existing source-bound V2 certificates yield signals without treating missing subsets as negative evidence',()=>{
 const input=readProfileCases().find(c=>c.id==='V2');
 const profile=buildProgressProfile(input),signals=qualitySignals(profile);
 assert.ok(signals.entryStates.length);assert.ok(signals.reusedFieldSteps>0);
 assert.equal(signals.missingSubsetCount,profile.evidence.coverage.missingStates.length);
 assert.ok(signals.minimumCluesByHour.every(m=>m.count!==null||m.status!=='proven-minimum'));
 assert.deepEqual(signals,qualitySignals(profile));
 assert.equal(Object.hasOwn(signals,'difficulty'),false);
});

test('series selection rewards new observed features, respects map/signature caps and uses stable identity ties',()=>{
 const row=(id,map,signature,features)=>({candidateId:id,fingerprints:{mapStructure:map},signals:{signature,features}});
 const rows=[row('a','map1','same',['count']),row('b','map1','b',['new']),
  row('c','map2','same',['count','direction']),row('d','map3','same',['count']),
  row('e','map4','other',['turn'])];
 const result=selectSeries(rows,{...config,maxSelected:10});
 assert.deepEqual(result.selected.map(c=>c.candidateId),['c','b','e','d']);
 assert.equal(result.distinctSignatures,3);assert.equal(result.notSelected.length,1);
 assert.deepEqual(result,selectSeries([...rows].reverse(),{...config,maxSelected:10}));
 const cap=selectSeries([row('a','1','x',[]),row('b','2','x',[]),row('c','3','x',[])],config);
 assert.equal(cap.selected.length,2);assert.equal(cap.notSelected[0].constraint,'SIGNATURE_CAP');
});

test('source geography and release assignments are verified; inputs and historical identities stay unchanged',()=>{
 const before=sha256(fs.readFileSync('docs/verification/B2-S02/run/candidates.jsonl'));
 const {targets,inputFiles}=readS03Inputs();
 assert.equal(targets.length,20);assert.equal(new Set(targets.map(t=>t.mapIndex)).size,20);
 assert.ok(targets.every(t=>t.logic.clues.length===0&&!Object.hasOwn(t,'solution')));
 assert.ok(inputFiles.every(f=>f.sha256.length===64));
 assert.equal(sha256(fs.readFileSync('docs/verification/B2-S02/run/candidates.jsonl')),before);
 assert.equal(validatePlaytestBindings(historical).size,96);
});

function syntheticStock(){
 const name=historical.registry.entries[0].testName.replace('S02','S03');
 // Use a true S03 candidate so export compilation checks its semantics.
 const workspace=createRouteWorkspace(logic,{maxNodes:100000});
 const pool=generateTrueClues(logic,target,{maxClueParameters:100000,policy:config.cluePolicy});
 const candidate=searchPuzzleCandidates({logic,targetRoute:target,workspace,cluePool:pool,seed:303,budgets:config.search}).candidates[0];
 const row={...reference,...candidate,testName:name,candidateId:reference.attemptId+'/'+candidate.fingerprints.variant};
 const entry={testName:name,candidateId:row.candidateId,recordSha256:sha256(JSON.stringify(row)),fingerprints:row.fingerprints,
  attemptId:row.attemptId,effectKey:row.effectKey,contentSha256:contentHash(row)};
 return {rows:[row],registry:{...historical.registry,stockId:'B2-S03',entries:[entry]},manifest:{...historical.manifest,protocol:config.protocol}};
}

test('S03 uses the existing public export, binds records and keeps private evidence out',()=>{
 const source=syntheticStock();assert.equal(validatePlaytestBindings(source).size,1);
 const files=buildPlaytest(source),dto=JSON.parse(files.get(source.registry.entries[0].testName+'.json'));
 assert.equal(Object.hasOwn(dto.puzzle,'solution'),false);
 assert.equal(Object.hasOwn(dto,'proof'),false);assert.equal(Object.hasOwn(dto,'signals'),false);
 assert.ok(!JSON.stringify(dto).includes('uniqueSolution'));
 assert.equal(parsePlaytestArgs(['--stock','S03']).stock,'S03');
 for(const mutate of [s=>s.rows[0].candidateId+='x',s=>s.rows[0].signals={},s=>s.registry.entries[0].contentSha256='0'.repeat(64)]){
  const broken=structuredClone(source);mutate(broken);assert.throws(()=>validatePlaytestBindings(broken));
 }
});
