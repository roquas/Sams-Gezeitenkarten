// Exact v1 source import, with no candidate search or new clue production.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ROOT,contentHash} from './b2-playtest.mjs';
import {sha256} from './content-hash.mjs';
import {logicalFingerprints} from './publication-archive.mjs';
import {readS03Inputs} from './s03-pilot.mjs';

export const V1='docs/verification/S03/run';
const read=ref=>fs.readFileSync(path.join(ROOT,ref));
const json=ref=>JSON.parse(read(ref));
const git=(...args)=>execFileSync('git',['-C',ROOT,...args],{maxBuffer:32*1024*1024});

export function sourceFiles(config){
 const refs=git('ls-tree','-r','--name-only',config.sourceSnapshot,'--','docs/verification/S03/').toString().trim().split('\n');
 assert.ok(refs.includes(V1+'/raw.jsonl'));
 return refs.map(ref=>{
  const original=git('show',config.sourceSnapshot+':'+ref),current=read(ref);
  assert.equal(sha256(current),sha256(original),'Frozen v1 source changed: '+ref);
  return {path:ref,sha256:sha256(current)};
 });
}

export function importSourceRecord(row,{line,manifest,attempt,target}){
 assert.equal(row.experimentId,manifest.experimentId);
 assert.equal(row.candidateId,row.attemptId+'/'+row.fingerprints.variant);
 assert.equal(row.attemptId,attempt.attemptId);
 assert.equal(row.seed,attempt.seed);assert.equal(row.routeIndex,attempt.routeIndex);
 assert.deepEqual(row.fingerprints,logicalFingerprints(row.definition));
 assert.deepEqual(row.proof.omissions.map(o=>o.clueId),row.definition.logic.clues.map(c=>c.id),
  'Source proof clue IDs changed');
 assert.deepEqual(row.definition.logic,{...target.logic,clues:row.definition.logic.clues});
 assert.deepEqual(row.assetPlacements,target.assetPlacements);
 assert.ok(row.definition.logic.clues.every(c=>c.type!=='countDistanceToPlace'||c.fromHour===c.toHour||c.fromHour>=1));
 const match=/^B2-S03-M(\d{3})-([A-E][1-5])-R(\d+)-V(\d{2})$/.exec(row.testName);
 assert.ok(match);assert.equal(Number(match[1]),row.mapIndex);
 assert.equal(match[2],row.definition.logic.start);assert.equal(Number(match[3]),row.routeIndex);
 const source={path:V1+'/raw.jsonl',line,recordSha256:sha256(JSON.stringify(row)),
  contentSha256:contentHash(row),experimentId:row.experimentId,attemptId:row.attemptId,
  candidateId:row.candidateId,testName:row.testName,ordinal:Number(match[4])};
 // Deliberate allowlist: old diagnosis, signals and disposition cannot affect v2.
 return {source,...Object.fromEntries(['mapIndex','routeIndex','seed','assetPlacements','definition',
  'fingerprints','effectKey','proof','properties'].map(k=>[k,row[k]]))};
}

export function loadV2Sources(config){
 const files=sourceFiles(config),manifest=json(V1+'/manifest.json'),summary=json(V1+'/summary.json');
 const v1config=JSON.parse(git('show',config.sourceSnapshot+':scripts/config/s03-v1.json'));
 for(const key of ['quality','maxSelected','maxPerSignature'])assert.deepEqual(config[key],v1config[key],'v1 criterion changed: '+key);
 assert.equal(sha256(read('scripts/lib/s03-quality.mjs')),sha256(git('show',config.sourceSnapshot+':scripts/lib/s03-quality.mjs')),
  'v1 quality/selection implementation changed');
 const {targets}=readS03Inputs();
 const attempts=read(V1+'/attempts.jsonl').toString().trim().split('\n').map(JSON.parse);
 const rows=read(V1+'/raw.jsonl').toString().trim().split('\n').map(JSON.parse);
 assert.equal(rows.length,config.maxRawCandidates);assert.equal(attempts.length,config.maxTargets);
 const candidates=rows.map((row,i)=>{
  const attempt=attempts.find(a=>a.mapIndex===row.mapIndex),target=targets.find(t=>t.mapIndex===row.mapIndex);
  assert.ok(attempt&&target);assert.equal(attempt.enumeration.completed,true);
  assert.ok(attempt.enumeration.routeCount>=config.quality.minRoutes);
  assert.ok(attempt.baseline.fixedHours.length<=config.quality.maxBaselineFixed);
  return importSourceRecord(row,{line:i+1,manifest,attempt,target});
 });
 assert.equal(new Set(candidates.map(c=>c.source.candidateId)).size,rows.length);
 for(let i=0;i<config.maxTargets;i++)assert.deepEqual(candidates.filter(c=>c.mapIndex===i).map(c=>c.source.ordinal).sort(),[1,2,3,4]);
 return {files,manifest,summary,attempts,candidates,priorDiagnosisCounts:
  Array.from({length:config.maxTargets},(_,i)=>rows.filter(r=>r.mapIndex===i&&r.diagnosis).length)};
}
