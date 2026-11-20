import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';
import {candidateOriginContract,canonicalRawClues,rawClueOrigin,originContractSha256,
 pinOriginContract,verifyCandidateOrigins,readGitRawSource} from '../../scripts/lib/candidate-origin-contract.mjs';
import {referenceOriginContext,REFERENCE_ORIGIN_CONTRACT_SHA256,ORIGIN_OUTPUT} from '../../scripts/report-count-clue-normalization.mjs';

const context=referenceOriginContext();
const row=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/verification/S04-B/evidence.json'))).cases[0].candidate;
test('the ID-inclusive origin is canonical, stable through JSON, and independent of input ordering',()=>{
 const raw=context.originContract.entries[0].rawClues,before=structuredClone(raw);
 assert.equal(rawClueOrigin(raw),rawClueOrigin([...raw].reverse()));
 assert.deepEqual(canonicalRawClues(raw),canonicalRawClues(JSON.parse(JSON.stringify(raw))));
 const renamed=structuredClone(raw);renamed.find(c=>c.id==='H2').id='FORGED-ORIGIN';
 assert.notEqual(rawClueOrigin(raw),rawClueOrigin(renamed));assert.deepEqual(raw,before);
 assert.throws(()=>rawClueOrigin([raw[0],raw[0]]),/Duplicate raw/);
 const a={...context.originContract.entries[0],attemptId:'a'},b={...a,attemptId:'b'};
 assert.deepEqual(candidateOriginContract(context.originContract.policy,[a,b]),
  candidateOriginContract(context.originContract.policy,[b,a]));
});
test('the fixed Git source and independently expected receipt digest reproduce the stored contract',()=>{
 const stored=JSON.parse(fs.readFileSync(path.join(ROOT,ORIGIN_OUTPUT)));
 assert.deepEqual(stored,context.originContract);
 assert.equal(originContractSha256(stored),REFERENCE_ORIGIN_CONTRACT_SHA256);
 const entry=stored.entries[0],original=readGitRawSource(entry.source);
 assert.equal(rawClueOrigin(original.definition.logic.clues),entry.rawOriginFingerprint);
 verifyCandidateOrigins([row],context);
 const reversed=structuredClone(row);reversed.normalization.rawClues.reverse();
 verifyCandidateOrigins([reversed],context);
});
test('external inventory prevents stripping records, keys, markers and all provenance together',()=>{
 assert.throws(()=>verifyCandidateOrigins([],context),/inventory size/);
 for(const mutation of [r=>r.attemptId='other-attempt',r=>r.fingerprints.variant+='-other',
  r=>{delete r.normalization;delete r.preparation;r.puzzleExperimentFormatVersion=1;}]){
  const bad=structuredClone(row);mutation(bad);
  assert.throws(()=>verifyCandidateOrigins([bad],context));
  assert.throws(()=>verifyCandidateOrigins([bad]));
 }
 assert.throws(()=>verifyCandidateOrigins([row],{originContract:context.originContract}),/expected origin contract/);
 assert.throws(()=>verifyCandidateOrigins([row],{originContract:null}),/Origin contract required/);
});
test('fully coordinated candidate and sidecar changes cannot replace the independent trust anchor',()=>{
 for(const historical of [false,true]){
  const bad=structuredClone(row),forged=structuredClone(context);
  delete bad.normalization;
  if(historical)delete bad.preparation;
  else bad.preparation.status='unchanged';
  forged.originContract=candidateOriginContract(historical?'none':'count-distance-extremes-1',[
   {attemptId:bad.attemptId,variant:bad.fingerprints.variant,status:historical?'historical':'unchanged',
    rawClues:bad.definition.logic.clues,source:{kind:'captured-raw-set'}}]);
  if(!historical)bad.preparation.rawOriginFingerprint=forged.originContract.entries[0].rawOriginFingerprint;
  assert.throws(()=>verifyCandidateOrigins([bad],forged),/trust anchor mismatch/);
 }
});
test('trusted contract status and policy must agree with the actual preparation',()=>{
 for(const change of [c=>c.entries[0].status='historical',c=>c.policy='none',c=>c.policy='unknown',
  c=>c.entries[0].rawOriginFingerprint='wrong']){
  const forged=structuredClone(context.originContract);change(forged);
  assert.throws(()=>verifyCandidateOrigins([row],pinOriginContract(forged)));
 }
});
test('all previously reviewed evidence is unchanged except the new provenance fields',()=>{
 const previous=JSON.parse(execFileSync('git',['-C',ROOT,'show',
  '617d84a6427de849a9c4c5861abc39c2614f2306:docs/verification/S04-B/evidence.json'],{encoding:'utf8'}));
 const current=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/verification/S04-B/evidence.json')));
 delete current.originContract;delete current.cases[0].candidate.preparation;
 delete current.cases[0].candidate.normalization.rawOriginFingerprint;
 assert.deepEqual(current,previous);
});
