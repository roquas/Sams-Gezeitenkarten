import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT,readPlaytestSource,validatePlaytestBindings,buildPlaytest,playtestStock} from '../../scripts/lib/b2-playtest.mjs';
import {main as exportStock} from '../../scripts/export-b2-playtest.mjs';
import {main as inspect} from '../../scripts/inspect-b2-playtest.mjs';
import {selectionReport,REPORT} from '../../scripts/report-b2-bc-playtest.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {canonicalJson,sha256} from '../../scripts/lib/content-hash.mjs';

const source=readPlaytestSource('BC'),files=buildPlaytest(source);
const base='f29bb77';
test('fixed BC selection binds exactly eight original records, four B/C pairs and five to seven clues',()=>{
 const {registry,rows}=source;
 assert.equal(registry.entries.length,8);assert.equal(rows.length,8);
 assert.equal(registry.sourceCandidateCount,167);
 const targets=new Map(),histogram={};
 for(const entry of registry.entries){
  const row=rows.find(r=>r.candidateId===entry.candidateId),clues=row.definition.logic.clues;
  const arms=targets.get(entry.sourceTarget)??[];arms.push(entry.arm);targets.set(entry.sourceTarget,arms);
  assert.ok(clues.length>=5&&clues.length<=7);histogram[clues.length]=(histogram[clues.length]??0)+1;
  assert.equal(row.proof.irredundant,true);assert.equal(row.proof.targetMatch,true);
  assert.equal(row.properties.hasIndividuallyExactHour1,false);
  assert.ok(row.properties.individualExactness.every(e=>e.hours.length===0));
  assert.ok(new Set(clues.map(c=>c.type)).size>=2);
  assert.ok(row.diagnosis.singleCounts.every(s=>s.count>1&&s.count<row.proof.legalRouteCount));
  for(const ids of entry.highlightPairs){
   const pair=row.diagnosis.pairCounts.find(p=>p.clueIds.join('/')===ids.join('/'));
   assert.ok(pair.count>1&&ids.every(id=>pair.count<row.diagnosis.singleCounts.find(s=>s.clueId===id).count));
  }
  assert.deepEqual(inspect(['--stock','BC',entry.testName]).candidate,row);
 }
 assert.equal(targets.size,4);
 for(const arms of targets.values())assert.deepEqual(arms.sort(),['B','C']);
 assert.deepEqual(histogram,{5:2,6:4,7:2});
 assert.equal(selectionReport(),fs.readFileSync(path.join(ROOT,REPORT),'utf8'));
 assert.equal(inspect(['--stock','BC','--report']).candidateCount,8);
 const reversed=structuredClone(source);reversed.rows.reverse();reversed.registry.entries.reverse();
 assert.deepEqual(buildPlaytest(reversed),files);assert.equal(selectionReport(reversed),selectionReport());
});

test('eight public puzzles load unchanged and independent verifier confirms all proofs and stored diagnostics',async()=>{
 const requested=[];
 const loader=createPuzzleLoader({manifestUrl:'http://local/.dev/b2-bc/manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);requested.push(ref);
  const bytes=ref.startsWith('.dev/b2-bc/')?files.get(ref.slice('.dev/b2-bc/'.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 assert.equal((await loader.manifest()).puzzles.length,9);
 assert.equal((await loader.manifest()).defaultId,source.registry.entries[0].testName);
 for(const entry of source.registry.entries){
  const row=source.rows.find(r=>r.candidateId===entry.candidateId);
  const puzzle=await loader.load(entry.testName);
  assert.deepEqual(puzzle.solution,row.definition.solution);
  assert.deepEqual(puzzle.map,row.definition.logic.map);assert.deepEqual(puzzle.assetPlacements,row.assetPlacements);
  const dto=JSON.parse(files.get(entry.testName+'.json'));
  assert.deepEqual(dto.puzzle.logic,row.definition.logic);
  assert.deepEqual(Object.keys(dto).sort(),['identity','projectionSchemaVersion','puzzle','rulesVersion']);
  for(const name of ['solution','proof','diagnosis','candidateId','sourceTarget','attemptId','strategy']){
   assert.equal(Object.hasOwn(dto,name),false);assert.equal(Object.hasOwn(dto.puzzle,name),false);
  }
  // Independently enumerate the legal space, not the B2 cached workspace.
  const rules=createRules(row.definition.logic),routes=[...rules.routes()];
  assert.equal(routes.length,row.proof.legalRouteCount);
  const matching=ids=>routes.filter(route=>ids.every(id=>rules.matches(route,puzzle.clues.find(c=>c.id===id))));
  for(const single of row.diagnosis.singleCounts){
   const survivors=matching([single.clueId]);assert.equal(survivors.length,single.count);
   assert.equal(1-survivors.length/routes.length,single.eliminatedFraction);
   const exact=Array.from({length:6},(_,i)=>i+1).filter(h=>new Set(survivors.map(route=>route[h])).size===1);
   assert.deepEqual(exact,row.properties.individualExactness.find(e=>e.clueId===single.clueId).hours);
  }
  for(const pair of row.diagnosis.pairCounts)assert.equal(matching(pair.clueIds).length,pair.count);
 }
 assert.ok(!requested.some(ref=>ref.startsWith('docs/')||ref.startsWith('scripts/')));
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'b2-bc-proof-'));
 try{
  const file=path.join(temporary,'selected.jsonl');fs.writeFileSync(file,source.rows.map(row=>JSON.stringify(row)).join('\n')+'\n');
  assert.deepEqual(verifyCandidates(file),{verifiedCandidates:8,method:'existing-checkIrredundancy-detailed'});
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});

test('changed comparison provenance, selection identities and diagnostics fail closed',()=>{
 const mutations=[
  s=>{s.rows[0].diagnosis.singleCounts[0].count++;},
  s=>{s.rows[0].proof.omissions[0].count++;},
  s=>{s.rows[0].sourceAttemptId+='0';},
  s=>{s.rows[0].definition.logic.clues[0].count++;},
  s=>{s.rows[0].definition.solution.reverse();},
  s=>{s.rows[0].assetPlacements[0].anchor='E5';},
  s=>{s.registry.entries[0].arm='A';},
  s=>{s.registry.entries[0].candidateId+='0';},
  s=>{s.registry.entries[0].sourceTarget+='0';},
  s=>{s.registry.entries[0].testName='B2-BC-T01-M003-A5-R00';},
  s=>{s.registry.entries[1].testName=s.registry.entries[0].testName;},
  s=>{s.registry.entries[1].fingerprints.variant=s.registry.entries[0].fingerprints.variant;},
  s=>{s.rows.pop();},s=>{s.manifest.experimentId+='0';}
 ];
 for(const mutate of mutations){const changed=structuredClone(source);mutate(changed);assert.throws(()=>validatePlaytestBindings(changed),/B2 export:/);}
});

test('export is byte-identical, repairs 700 directories, and protected source inventories stay byte-identical to PR101 main',()=>{
 const output=path.join(ROOT,playtestStock('BC').output);
 const previousUmask=process.umask(0o077);
 try{
  exportStock(['--stock','BC']);fs.chmodSync(output,0o700);
  fs.chmodSync(path.join(output,'manifest.json'),0o600);
  exportStock(['--stock','BC']);
 }finally{process.umask(previousUmask);}
 assert.equal(fs.statSync(output).mode&0o777,0o755);
 assert.equal(fs.statSync(path.dirname(output)).mode&0o777,0o755);
 for(const [name,bytes] of files){
  assert.equal(fs.readFileSync(path.join(output,name),'utf8'),bytes);
  assert.equal(fs.statSync(path.join(output,name)).mode&0o777,0o644);
 }
 // Digests measured by executing the unchanged adapter from PR101 main.
 for(const [stock,expected] of Object.entries({S01:'eca7d23853d8d24294d7263aae297e8f72d867cb9fef824aa2efd50ecb96a927',
  S02:'63a3a1735db51ff543607f12584a88cc4ea9e79bea13f10f4a8faef2e4a2c347'})){
  const exported=[...buildPlaytest(readPlaytestSource(stock))].sort(([a],[b])=>a.localeCompare(b))
   .map(([name,bytes])=>({name,sha256:sha256(bytes)}));
  assert.equal(sha256(canonicalJson(exported)),expected,stock+' public export changed');
 }
 const refs=execFileSync('git',['ls-tree','-r','--name-only',base,'--','docs/verification/B2-search-comparison',
  'docs/verification/B2-S02','docs/verification/B2-example','scripts/config/b2-playtest-s01.json',
  'scripts/config/b2-playtest-s02.json','puzzles','assets'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
 for(const ref of refs){
  const original=execFileSync('git',['show',base+':'+ref],{cwd:ROOT,maxBuffer:32*1024*1024});
  assert.equal(sha256(fs.readFileSync(path.join(ROOT,ref))),sha256(original),ref);
 }
});
