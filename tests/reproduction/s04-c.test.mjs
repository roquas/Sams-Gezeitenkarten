import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source=path.join(root,'docs/verification/S04-C/pilot');
const inventory=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?
 inventory(path.join(dir,e.name)).map(p=>e.name+'/'+p):[e.name]).sort();

test('S04-C repeats only the fixed small experiment at its recorded program, matching every deterministic byte', {timeout:160000},()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
 assert.equal(process.version,manifest.program.nodeVersion,'Use exact recorded Node version');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-s04-c-replay-')),program=path.join(temp,'program'),out=path.join(temp,'out');
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'});
 try{
  git('worktree','add','--detach',program,manifest.program.commit);
  execFileSync(process.execPath,[path.join(program,'scripts/run-s04-c-pilot.mjs'),out],{cwd:program,timeout:140000,stdio:'pipe'});
  const files=inventory(source).filter(f=>f!=='observations.json');
  assert.deepEqual(inventory(out).filter(f=>f!=='observations.json'),files);
  for(const file of files)assert.deepEqual(fs.readFileSync(path.join(out,file)),fs.readFileSync(path.join(source,file)),file);
 }finally{
  if(fs.existsSync(program))git('worktree','remove','--force',program);
  fs.rmSync(temp,{recursive:true,force:true});
 }
});
