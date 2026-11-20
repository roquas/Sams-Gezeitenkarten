// Private provenance contract, separate from every logical fingerprint.
// A digest authenticates this contract ONLY when the caller obtained the
// expected digest independently of both untrusted candidate and contract files.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256} from './content-hash.mjs';

export const ORIGIN_CONTRACT='candidate-origins-1';
export const NORMALIZATION_POLICY='count-distance-extremes-1';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const compare=(a,b)=>a<b?-1:a>b?1:0;
const key=e=>canonicalJson([e.attemptId,e.variant]);
const parameters=({id,...rest})=>canonicalJson(rest);
const git=(...args)=>execFileSync('git',['-C',ROOT,...args],{encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
// Historical record metadata includes fractional diagnostic signals. This
// source-byte canonicalization is local to provenance, not logical identity.
export const originSourceRecordSha256=row=>sha256(JSON.stringify(row,(_key,value)=>{
 if(typeof value==='number')assert.ok(Number.isFinite(value),'Non-finite source number');
 return value&&typeof value==='object'&&!Array.isArray(value)?
  Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]])):value;
}));
export function canonicalRawClues(clues){
 assert.ok(Array.isArray(clues),'Raw clue array required');
 assert.ok(clues.every(c=>typeof c.id==='string'),'Raw clue IDs required');
 assert.equal(new Set(clues.map(c=>c.id)).size,clues.length,'Duplicate raw clue ID');
 return JSON.parse(canonicalJson([...clues].sort((a,b)=>compare(canonicalJson(a),canonicalJson(b)))));
}
export const rawClueOrigin=clues=>'gk-raw-clues-v1-sha256:'+sha256('raw-clue-origin/v1\0'+canonicalJson(canonicalRawClues(clues)));
export const originContractSha256=contract=>sha256(canonicalJson(contract));
export function candidateOriginContract(policy,entries){
 assert.ok(['none',NORMALIZATION_POLICY].includes(policy),'Unknown origin policy');
 return {format:ORIGIN_CONTRACT,policy,entries:entries.map(e=>({...e,
  rawClues:canonicalRawClues(e.rawClues),rawOriginFingerprint:rawClueOrigin(e.rawClues)})).sort((a,b)=>compare(key(a),key(b)))};
}
export function pinOriginContract(contract){
 return {originContract:structuredClone(contract),expectedOriginContractSha256:originContractSha256(contract)};
}
// Only for trusted, in-memory output of an explicitly unnormalized legacy
// producer. Never call this on an untrusted file to establish its own trust.
export function legacyVerificationContext(records){
 return pinOriginContract(candidateOriginContract('none',records.map(r=>({attemptId:r.attemptId,
  variant:r.fingerprints.variant,status:'historical',rawClues:r.definition.logic.clues,
  source:{kind:'captured-raw-set'}}))));
}
export function readGitRawSource(source){
 assert.equal(source.kind,'git-record');
 assert.match(source.commit,/^[a-f0-9]{40}$/);
 assert.ok(typeof source.candidateId==='string'&&source.candidateId.length,'Raw source candidate ID required');
 assert.match(source.recordSha256,/^[a-f0-9]{64}$/);
 assert.match(source.path,/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.jsonl$/);
 assert.ok(!source.path.split('/').some(p=>p==='..'||p==='.'));
 const rows=git('show',source.commit+':'+source.path).trim().split('\n').filter(Boolean).map(JSON.parse);
 const matches=rows.filter(r=>r.candidateId===source.candidateId);
 assert.equal(matches.length,1,'Raw source record missing or ambiguous');
 assert.equal(originSourceRecordSha256(matches[0]),source.recordSha256,'Raw source record binding changed');
 return matches[0];
}

// Recognize the frozen historical inventory, not a self-declared row version.
// Removing all S04-B fields from a new row cannot create membership here.
export const HISTORICAL_ORIGIN_SNAPSHOT='617d84a6427de849a9c4c5861abc39c2614f2306';
let historical;
function historicalInventory(){
 if(!historical){
  const inventory=new Set();
  const paths=git('ls-tree','-r','--name-only',HISTORICAL_ORIGIN_SNAPSHOT,'--','docs/verification').trim().split('\n')
   .filter(p=>/\/(?:candidates|finalists|source-candidates|raw)\.jsonl$/.test(p)&&!p.includes('/source-batch/'));
  for(const path of paths)for(const line of git('show',HISTORICAL_ORIGIN_SNAPSHOT+':'+path).split('\n').filter(Boolean)){
   const row=JSON.parse(line);
   if(row.definition&&row.fingerprints&&row.proof&&!Object.hasOwn(row,'normalization')&&!Object.hasOwn(row,'preparation'))
    inventory.add(originSourceRecordSha256(row));
  }
  historical=inventory;
 }
 return historical;
}

export function verifyCandidateOrigins(records,{originContract,expectedOriginContractSha256}={}){
 if(originContract===undefined&&expectedOriginContractSha256===undefined){
  const inventory=historicalInventory();
  for(const row of records)assert.ok(inventory.has(originSourceRecordSha256(row)),
   'Unknown candidate inventory: independently pinned origin contract required');
  return;
 }
 assert.ok(originContract&&typeof originContract==='object','Origin contract required');
 assert.match(expectedOriginContractSha256??'',/^[a-f0-9]{64}$/,'Independently expected origin contract SHA-256 required');
 assert.equal(originContractSha256(originContract),expectedOriginContractSha256,'Origin contract trust anchor mismatch');
 assert.equal(originContract.format,ORIGIN_CONTRACT);
 assert.ok(['none',NORMALIZATION_POLICY].includes(originContract.policy),'Unknown origin policy');
 const entries=originContract.entries;
 assert.ok(Array.isArray(entries));assert.equal(entries.length,records.length,'Origin inventory size mismatch');
 const byKey=new Map(entries.map(e=>[key(e),e]));assert.equal(byKey.size,entries.length,'Duplicate origin entry');
 const seen=new Set();
 for(const record of records){
  const identity=key({attemptId:record.attemptId,variant:record.fingerprints.variant});
  const entry=byKey.get(identity);assert.ok(entry&&!seen.has(identity),'Candidate not in trusted origin inventory');seen.add(identity);
  assert.equal(entry.rawOriginFingerprint,rawClueOrigin(entry.rawClues),'Raw origin binding changed');
  assert.ok(entry.source&&['git-record','captured-raw-set'].includes(entry.source.kind),'Raw source required');
  if(entry.source.kind==='git-record'){
   const original=readGitRawSource(entry.source);
   assert.equal(original.fingerprints.instance,record.fingerprints.instance,'Raw Git instance mismatch');
   assert.equal(rawClueOrigin(original.definition.logic.clues),entry.rawOriginFingerprint,'Raw IDs/parameters differ from pinned Git source');
  }
  if(originContract.policy==='none'){
   assert.equal(entry.status,'historical');
   assert.ok(!Object.hasOwn(record,'preparation')&&!Object.hasOwn(record,'normalization'),'Legacy contract cannot carry S04-B provenance');
   assert.equal(rawClueOrigin(record.definition.logic.clues),entry.rawOriginFingerprint);
   continue;
  }
  assert.ok(['unchanged','normalized'].includes(entry.status),'Invalid provenance status');
  assert.equal(record.puzzleExperimentFormatVersion,2,'New origin contract requires candidate format 2');
  assert.deepEqual(record.preparation,{policy:originContract.policy,status:entry.status,
   rawOriginFingerprint:entry.rawOriginFingerprint},'Missing or inconsistent candidate preparation');
  const normalized=entry.status==='normalized';
  if(normalized){
   assert.ok(record.normalization&&typeof record.normalization==='object','Transformation evidence required');
   assert.equal(record.normalization.format,originContract.policy,'Normalization policy mismatch');
   assert.equal(record.normalization.rawOriginFingerprint,entry.rawOriginFingerprint);
   assert.deepEqual(canonicalRawClues(record.normalization.rawClues),entry.rawClues,'Raw IDs/parameters differ from trusted origin');
   assert.ok(entry.rawClues.length>record.definition.logic.clues.length,'Normalized status without reduction');
  }else{
   assert.ok(!Object.hasOwn(record,'normalization'),'Unchanged candidate cannot carry transformation evidence');
   assert.deepEqual(entry.rawClues.map(parameters).sort(),record.definition.logic.clues.map(parameters).sort(),
    'Unchanged status contradicts raw set');
  }
 }
}
