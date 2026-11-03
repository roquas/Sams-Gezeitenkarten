// Deliberately separate from the Node-22 unit suite: exact manifest bytes bind
// Node v24.19.0 as well as the original clean program commit. CI runs this job.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

test('the pinned program reproduces every S02 batch/B1/B2 byte and replays stored maps',{timeout:180000},t=>{
 const frozen=path.join(ROOT,'docs/verification/B2-S02');
 const read=(stage,name)=>JSON.parse(fs.readFileSync(path.join(frozen,stage,name),'utf8'));
 const batch=read('source-batch','manifest.json'),b1=read('b1','manifest.json'),b2=read('run','manifest.json');
 assert.equal(process.version,b2.program.nodeVersion,'Use the recorded Node version; npm run test:b2:s02:reproduction');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-s02-reproduction-'));
 t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const program=path.join(temp,'program');
 const git=(...args)=>execFileSync('git',args,{cwd:ROOT,stdio:['ignore','pipe','pipe']});
 git('clone','--quiet','--shared','--no-checkout',ROOT,program);
 git('-C',program,'checkout','--quiet','--detach',b2.program.commit);
 const directories=Object.fromEntries(['source-batch','b1','run'].map(stage=>[stage,path.join(temp,stage)]));
 const cli=(script,args)=>JSON.parse(execFileSync(process.execPath,[path.join(program,'scripts',script),...args],
  {cwd:program,encoding:'utf8',maxBuffer:32*1024*1024}));
 const options=batch.options,config=path.join(temp,'config.json');fs.writeFileSync(config,JSON.stringify(options.config));
 assert.equal(cli('generate-map-batch.mjs',['run','--release',batch.provenance.releaseId,'--background',batch.provenance.backgroundId,
  '--target-count',String(options.targetCount),'--max-attempts',String(options.maxAttempts),'--seed-start',String(options.seedStart),
  '--assignment-seed-start',String(options.assignmentSeedStart),'--config',config,'--out',directories['source-batch']]).acceptedCount,20);
 assert.equal(cli('run-route-experiment.mjs',['--batch',directories['source-batch'],'--accepted-indices','all',
  '--max-nodes-per-start',String(b1.budgets.maxNodesPerStart),'--out',directories.b1]).startCount,48);
 const budgets=b2.budgets;
 assert.equal(cli('run-puzzle-experiment.mjs',['--b1',directories.b1,'--batch',directories['source-batch'],'--out',directories.run,
  '--seed',String(b2.seed),'--route-indices',b2.routeSelection.routeIndices.join(','),
  '--max-nodes-per-start',String(budgets.maxNodesPerStart),'--max-clue-parameters',String(budgets.maxClueParameters),
  '--max-restarts',String(budgets.maxRestarts),'--max-solver-checks',String(budgets.maxSolverChecks),
  '--max-match-evaluations',String(budgets.maxMatchEvaluations),'--max-route-filter-evaluations',String(budgets.maxRouteFilterEvaluations)]).candidateCount,96);
 const deterministic={
  'source-batch':['manifest.json','summary.json','candidates.jsonl','accepted.jsonl'],
  b1:['manifest.json','maps.jsonl','summary.json'],run:['manifest.json','attempts.jsonl','candidates.jsonl','summary.json']};
 for(const [stage,names] of Object.entries(deterministic))for(const name of names)
  assert.deepEqual(fs.readFileSync(path.join(directories[stage],name)),fs.readFileSync(path.join(frozen,stage,name)),stage+'/'+name);
 const candidates=fs.readFileSync(path.join(frozen,'source-batch/candidates.jsonl'),'utf8').trim().split('\n');
 for(const index of [0,19]){
  const out=path.join(temp,'replay-'+index+'.jsonl');
  assert.equal(cli('generate-map-batch.mjs',['replay','--batch',directories['source-batch'],'--index',String(index),'--out',out]).status,'matched');
  assert.equal(fs.readFileSync(out,'utf8'),candidates[index]+'\n');
 }
 assert.ok(JSON.parse(fs.readFileSync(path.join(directories.run,'timings.json'))).totalMs>=0);
});
