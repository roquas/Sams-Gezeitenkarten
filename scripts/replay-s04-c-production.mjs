// Same fixed seeds at the pinned program, never an additional production search.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {deterministicFiles} from './lib/s04-c-production-policy.mjs';
import {sha256} from './lib/content-hash.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const [sourceArg,receiptArg,reportArg,...extra]=process.argv.slice(2);
if(!sourceArg||!receiptArg||!reportArg||extra.length)throw Error('Usage: node scripts/replay-s04-c-production.mjs PRIVATE_DIRECTORY INDEPENDENT_RECEIPT_JSON NEW_REPORT_JSON');
const source=path.resolve(sourceArg),expected=JSON.parse(fs.readFileSync(receiptArg)),manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
assert.equal(manifest.program.commit,expected.programCommit);assert.equal(process.version,manifest.program.nodeVersion);
assert.equal(fs.existsSync(reportArg),false,'Replay report must be new');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-s04-c-production-replay-')),program=path.join(temp,'program'),out=path.join(temp,'out');
const start=performance.now();
try{
 execFileSync('git',['clone','--shared','--no-checkout',ROOT,program],{stdio:'pipe'});
 execFileSync('git',['-C',program,'checkout','--detach',expected.programCommit],{stdio:'pipe'});
 const log=execFileSync(process.execPath,[path.join(program,'scripts/run-s04-c-production.mjs'),out],{cwd:program,timeout:manifest.config.timeoutMs+10000,maxBuffer:16*1024*1024,encoding:'utf8'});
 const regenerated=JSON.parse(log.trim());assert.equal(regenerated.arms[0].originContractSha256,expected.originContractSha256);
 assert.equal(regenerated.inventorySha256,expected.inventorySha256);
 const files=[...deterministicFiles(source),'inventory.json'].sort();assert.deepEqual([...deterministicFiles(out),'inventory.json'].sort(),files);
 const comparisons=files.map(file=>{
  const a=fs.readFileSync(path.join(source,file)),b=fs.readFileSync(path.join(out,file));assert.deepEqual(a,b,file);
  return {path:file,bytes:a.length,sha256:sha256(a)};
 });
 fs.writeFileSync(reportArg,JSON.stringify({status:'byte-identical',programCommit:expected.programCommit,node:process.version,
  comparedFiles:files.length,comparedBytes:comparisons.reduce((n,f)=>n+f.bytes,0),includesCompressedDiagnosisBytes:true,
  excluded:['observations.json'],files:comparisons,replayObservations:JSON.parse(fs.readFileSync(path.join(out,'observations.json'))),
  measuredReplayMs:performance.now()-start},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:'byte-identical',files:files.length,bytes:comparisons.reduce((n,f)=>n+f.bytes,0),originContractSha256:expected.originContractSha256}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
