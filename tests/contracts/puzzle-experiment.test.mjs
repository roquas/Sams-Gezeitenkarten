import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {contactBatchFixture} from '../fixtures/contact-sheet/batch.mjs';
import {readB1Experiment} from '../../scripts/lib/puzzle-experiment.mjs';
import {checkIrredundancy} from '../../src/puzzles/analysis.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';

let fixture,b1,serial=0;
const fresh=name=>path.join(fixture.directory,name+'-'+serial++);
const read=(directory,file)=>fs.readFileSync(path.join(directory,file),'utf8');
const rows=(directory,file)=>read(directory,file).split('\n').filter(Boolean).map(JSON.parse);
const deterministic=['manifest.json','attempts.jsonl','candidates.jsonl','summary.json'];
function cli(args,entry=path.join(fixture.program,'scripts/run-puzzle-experiment.mjs')){
 const result=spawnSync(process.execPath,[entry,...args],{encoding:'utf8'});assert.ifError(result.error);return result;
}
function args(out){return ['--b1',b1,'--batch',fixture.batch,'--out',out,'--seed','42','--route-indices','0,25','--max-nodes-per-start','100000',
 '--max-clue-parameters','100000','--max-restarts','3','--max-solver-checks','1000','--max-match-evaluations','5000000',
 '--max-route-filter-evaluations','10000000'];}
function run(change=value=>value,entry){
 const out=fresh('b2'),result=cli(change(args(out)),entry);assert.equal(result.status,0,result.stderr);return {out,summary:JSON.parse(result.stdout)};
}
before(()=>{
 fixture=contactBatchFixture({targetCount:3,maxAttempts:40,assignmentSeedStart:100000,config:{objectCount:{min:0,max:7},maxMapAttempts:1}});
 b1=fresh('b1');
 const result=spawnSync(process.execPath,[path.join(fixture.program,'scripts/run-route-experiment.mjs'),
  '--batch',fixture.batch,'--accepted-indices','1,2','--max-nodes-per-start','100000','--out',b1],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
after(()=>fixture?.cleanup());

test('B2 reads a completed B1 corpus, saves full independently verifiable variants, and reproduces all deterministic files',()=>{
 const originals=Object.fromEntries(['manifest.json','maps.jsonl','summary.json'].map(file=>[file,read(b1,file)]));
 const a=run(),b=run();for(const file of deterministic)assert.equal(read(a.out,file),read(b.out,file));
 assert.equal(a.summary.mapCount,2);assert.equal(a.summary.startCount,3);assert.equal(a.summary.targetRoutes,6);
 assert.ok(a.summary.candidateCount>=6);assert.ok(a.summary.variantsPerTarget.every(row=>row.count>1));
 assert.equal(a.summary.failures.NO_ELIGIBLE_START,1);assert.equal(a.summary.searchIncomplete,true);
 const candidates=rows(a.out,'candidates.jsonl');assert.equal(candidates.length,a.summary.candidateCount);
 assert.equal(verifyCandidates(path.join(a.out,'candidates.jsonl')).verifiedCandidates,candidates.length);
 for(const candidate of candidates){
  const proof=checkIrredundancy(candidate.definition);assert.equal(proof.irredundant,true);assert.equal(proof.target.status,'match');
  assert.equal(candidate.definition.logic.steps,6);assert.equal(candidate.definition.solution.length,7);
  assert.equal(candidate.fingerprints.instance,candidates.find(c=>c.attemptId===candidate.attemptId).fingerprints.instance);
  assert.ok(candidate.assetPlacements.length>0);assert.match(candidate.b1StartTrialId,/^gk-b1-start-sha256:/);
 }
 const changed=structuredClone(candidates[0]);changed.proof.count=2;const corrupt=fresh('false-proof.jsonl');
 fs.writeFileSync(corrupt,JSON.stringify(changed)+'\n');assert.throws(()=>verifyCandidates(corrupt));
 const attempts=rows(a.out,'attempts.jsonl');assert.equal(attempts[1].status,'impossible');assert.equal(attempts[1].reason,'NO_ELIGIBLE_START');
 assert.ok(JSON.parse(read(a.out,'timings.json')).totalMs>=0);
 for(const [file,bytes] of Object.entries(originals))assert.equal(read(b1,file),bytes);
 const retry=cli(args(a.out));assert.equal(retry.status,1);assert.match(retry.stderr,/EEXIST/);
});

test('B2 enumeration exhaustion produces unknown starts and no successful candidates',()=>{
 const result=run(values=>values.map((v,i)=>values[i-1]==='--max-nodes-per-start'?'1':v));
 assert.equal(result.summary.candidateCount,0);assert.equal(result.summary.targetRoutes,0);
 assert.equal(result.summary.incompleteStarts,3);assert.equal(result.summary.failures.ROUTE_ENUMERATION_BUDGET_EXHAUSTED,3);
 assert.equal(read(result.out,'candidates.jsonl'),'');assert.equal(result.summary.search.enumerationNodes,3);
});

test('missing route ordinals are proven unavailable, with no claim that the map cannot generate puzzles',()=>{
 const result=run(values=>values.map((v,i)=>values[i-1]==='--route-indices'?'999999':v));
 assert.equal(result.summary.candidateCount,0);assert.equal(result.summary.incompleteTargets,0);
 assert.equal(result.summary.failures.ROUTE_INDEX_OUT_OF_RANGE,3);
 assert.equal(result.summary.searchIncomplete,false);
 for(const map of rows(result.out,'attempts.jsonl'))for(const start of map.starts)for(const target of start.targets){
  assert.equal(target.status,'impossible');assert.equal(target.reason,'ROUTE_INDEX_OUT_OF_RANGE');
 }
});

test('corrupt rows, inconsistent summaries and unfinished B1 inputs fail before creating output',async()=>{
 for(const corrupt of [
  directory=>{const records=rows(directory,'maps.jsonl');records.at(-1).mapTrialId='changed';fs.writeFileSync(path.join(directory,'maps.jsonl'),records.map(JSON.stringify).join('\n')+'\n');},
  directory=>{const summary=JSON.parse(read(directory,'summary.json'));summary.startCount++;fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify(summary));},
  directory=>fs.unlinkSync(path.join(directory,'summary.json'))
 ]){
  const input=fresh('corrupt');fs.cpSync(b1,input,{recursive:true});corrupt(input);const out=fresh('refused');
  const result=cli(args(out).map((v,i,all)=>all[i-1]==='--b1'?input:v));assert.equal(result.status,1);assert.ok(!fs.existsSync(out));
  await assert.rejects(()=>readB1Experiment(input,{batch:fixture.batch}));
 }
});

test('explicit CLI budgets, uint32 seed, distinct route indices, six steps and separate output are enforced',()=>{
 const out=fresh('invalid');
 for(const values of [[],[...args(out),'--steps','5'],[...args(out),'--seed','1'],
  args(out).map((v,i,all)=>all[i-1]==='--route-indices'?'0,0':v),
  args(out).map((v,i,all)=>all[i-1]==='--seed'?'4294967296':v),
  args(out).map((v,i,all)=>all[i-1]==='--max-restarts'?'0':v),
  args(out).filter((v,i,all)=>v!=='--max-match-evaluations'&&all[i-1]!=='--max-match-evaluations'),
  args(out).filter((v,i,all)=>v!=='--batch'&&all[i-1]!=='--batch')]){
  assert.equal(cli(values).status,1);assert.ok(!fs.existsSync(out));
 }
 const nested=path.join(b1,'nested');assert.equal(cli(args(nested)).status,1);assert.ok(!fs.existsSync(nested));
 const sourceNested=path.join(fixture.batch,'nested');assert.equal(cli(args(sourceNested)).status,1);assert.ok(!fs.existsSync(sourceNested));
 const link=fresh('cli.mjs');fs.symlinkSync(path.join(fixture.program,'scripts/run-puzzle-experiment.mjs'),link);
 assert.equal(cli([],link).status,1);
 const throughLink=run(values=>values.map((v,i,all)=>all[i-1]==='--max-nodes-per-start'?'1':v),link);
 assert.equal(throughLink.summary.incompleteStarts,3);
});
