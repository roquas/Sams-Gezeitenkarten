import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

test('pinned search experiment replays baseline, candidates, proofs and metrics byte for byte',{timeout:180000},t=>{
 const stored=path.join(ROOT,'docs/verification/B2-search-comparison');
 const manifest=JSON.parse(fs.readFileSync(path.join(stored,'manifest.json')));
 assert.equal(process.version,manifest.program.nodeVersion);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'b2-search-replay-'));
 t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const program=path.join(temp,'program'),out=path.join(temp,'out'),config=path.join(temp,'config.json');
 execFileSync('git',['clone','--quiet','--shared','--no-checkout',ROOT,program]);
 execFileSync('git',['-C',program,'checkout','--quiet','--detach',manifest.program.commit]);
 fs.writeFileSync(config,JSON.stringify(manifest.config));
 const result=JSON.parse(execFileSync(process.execPath,[path.join(program,'scripts/run-b2-search-comparison.mjs'),out,config],
  {cwd:program,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:170000}));
 assert.equal(result.candidates,167);
 for(const name of ['manifest.json','candidates.jsonl','summary.json','report.md'])
  assert.deepEqual(fs.readFileSync(path.join(out,name)),fs.readFileSync(path.join(stored,name)),name);
});
