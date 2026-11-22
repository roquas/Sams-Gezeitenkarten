// Explicit private evidence check; never downloads or publishes the test pool.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {verifyProduction} from '../../scripts/verify-s04-c-production.mjs';
const out=process.env.GK_S04_C_PRIVATE;
assert.ok(out,'Set GK_S04_C_PRIVATE to the private Phase-C run directory');
const expected=JSON.parse(fs.readFileSync('docs/verification/S04-C/production-receipt.json'));
test('all private Phase-C candidates, B1 bindings, normal forms, diagnostics and cohorts verify against the independently replayed receipt',{timeout:900000},async()=>{
 const result=await verifyProduction(out,expected);
 assert.equal(result.verifiedCandidates,96);assert.equal(result.verifiedDiagnoses,48);assert.equal(result.verifiedStates,1261);assert.equal(result.compatibleSelected,15);
});
test('a substituted origin receipt is rejected even when all candidate files remain unchanged',{timeout:900000},async()=>{
 await assert.rejects(verifyProduction(out,{...expected,originContractSha256:'0'.repeat(64)}));
});
test('changed gzip bytes cannot pass through the deterministic inventory',{timeout:900000},async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-c-private-negative-'));
 try{
  fs.cpSync(out,path.join(temp,'run'),{recursive:true});
  const dir=path.join(temp,'run'),inventory=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json')));
  const ref=inventory.find(r=>r.path.endsWith('.states.jsonl.gz')).path,p=path.join(dir,ref),bytes=fs.readFileSync(p);bytes[bytes.length-1]^=1;fs.writeFileSync(p,bytes);
  await assert.rejects(verifyProduction(dir,expected));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
