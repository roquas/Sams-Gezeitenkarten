import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source=path.join(root,'docs/verification/S03/run');
const inventory=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?
 inventory(path.join(directory,e.name)).map(p=>e.name+'/'+p):[e.name]).sort();

test('S03 v1 replays only the frozen experiment at its clean program commit; all deterministic files match', {timeout:650000},()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
 assert.equal(process.version,manifest.program.nodeVersion,'Use the exact recorded Node version');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-s03-replay-')),program=path.join(temp,'program'),out=path.join(temp,'out');
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'});
 try{
  git('worktree','add','--detach',program,manifest.program.commit);
  execFileSync(process.execPath,[path.join(program,'scripts/run-s03-pilot.mjs'),out],{cwd:program,timeout:620000,stdio:'pipe'});
  const expected=inventory(source).filter(f=>f!=='observations.json');
  assert.deepEqual(inventory(out).filter(f=>f!=='observations.json'),expected);
  for(const file of expected)assert.deepEqual(fs.readFileSync(path.join(out,file)),fs.readFileSync(path.join(source,file)),file);
 }finally{
  if(fs.existsSync(program))git('worktree','remove','--force',program);
  fs.rmSync(temp,{recursive:true,force:true});
 }
});
