import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

test('comparison CLI executes through a directory symlink and rejects missing arguments',{timeout:60000},t=>{
 const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'b2-cli-path-')));
 t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const program=path.join(temp,'program');
 const git=(...args)=>execFileSync('git',args,{stdio:['ignore','pipe','pipe']});
 git('clone','--quiet','--shared','--no-checkout',ROOT,program);
 git('-C',program,'checkout','--quiet','--detach','HEAD');
 // Exercise the current working CLI, even before this correction is committed.
 const relative='scripts/run-b2-search-comparison.mjs';
 fs.copyFileSync(path.join(ROOT,relative),path.join(program,relative));
 git('-C',program,'add',relative);
 if(git('-C',program,'diff','--cached','--name-only').length)git('-C',program,'-c','user.name=CLI fixture',
  '-c','user.email=cli@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Current CLI fixture');
 // Model /tmp vs /private/tmp (also /var/folders vs /private/var/folders).
 const alias=path.join(temp,'var','folders');fs.mkdirSync(path.dirname(alias));
 fs.symlinkSync(program,alias,'dir');
 const entry=path.join(alias,relative);
 assert.notEqual(entry,fs.realpathSync(entry),'test must invoke a noncanonical directory path');
 const missing=spawnSync(process.execPath,[entry],{encoding:'utf8',timeout:10000});
 assert.ifError(missing.error);assert.equal(missing.status,1);assert.match(missing.stderr,/Usage:/);
 const config=path.join(temp,'config.json'),out=path.join(temp,'out');
 fs.writeFileSync(config,JSON.stringify({protocol:'b2-search-comparison-1',targets:['B2-S02-M003-A5-R00-V02'],
  arms:[{id:'A',strategy:'random-incremental-1',budgetMultiplier:1}]}));
 const run=spawnSync(process.execPath,[entry,out,config],{cwd:alias,encoding:'utf8',timeout:45000});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);
 assert.ok(run.stdout.trim(),'a successful no-op is not a successful experiment');
 const result=JSON.parse(run.stdout);
 assert.equal(result.candidates,2);
 for(const name of ['manifest.json','candidates.jsonl','summary.json','observations.json','report.md'])
  assert.ok(fs.statSync(path.join(out,name)).size>0,name+' must be produced');
 const summary=JSON.parse(fs.readFileSync(path.join(out,'summary.json')));
 assert.equal(summary.experimentId,result.experimentId);assert.equal(summary.status,'completed');
 assert.equal(summary.verification.verifiedCandidates,2);assert.equal(summary.generatorCalls,1);
});
