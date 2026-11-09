import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';
import {readPositiveDefinition,buildPositivePlaytest,POSITIVE_ID,POSITIVE_DIRECTORY} from '../../scripts/lib/b2-positive.mjs';
import {positiveEvidence,positiveReportFiles} from '../../scripts/report-b2-positive.mjs';
import {main as exportStock} from '../../scripts/export-b2-playtest.mjs';
import {validateB2Places} from '../../scripts/lib/puzzle-clues.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {checkIrredundancy} from '../../src/puzzles/analysis.mjs';

const definition=readPositiveDefinition();
test('hand-authored reference meets the precommitted A–F contract without changing deduction rules',()=>{
 const evidence=positiveEvidence();
 assert.equal(definition.logic.steps,6);assert.equal(definition.logic.clues.length,5);
 assert.equal(evidence.proof.count,1);assert.equal(evidence.proof.target.status,'match');
 assert.ok(evidence.proof.omissions.every(o=>o.necessary&&o.countExact&&o.count>=2));
 assert.deepEqual(['A','B','C','D','E','F'].map(k=>evidence.contract[k]),Array(6).fill(true));
 assert.equal(evidence.contract.humanPlaytest,'pending');
 assert.equal(evidence.diagnosis.scenarios.length,27);
 assert.equal(evidence.diagnosis.validation.localSoundAgainstEverySubset,true);
 assert.equal(evidence.diagnosis.validation.allCluesSolverAgreement,true);
 const original=JSON.parse(fs.readFileSync(path.join(ROOT,POSITIVE_DIRECTORY,'private/attempt-0.json')));
 const initial=checkIrredundancy(original,{detailed:true});
 assert.equal(initial.count,1);assert.equal(initial.irredundant,false);
 const stored=JSON.parse(fs.readFileSync(path.join(ROOT,POSITIVE_DIRECTORY,'private/evidence.json')));
 assert.equal(stored.constructionAttempts,2);assert.equal(stored.revisions,1);
 for(const ref of ['scripts/lib/b2-local-deduction.mjs','scripts/lib/b2-deduction.mjs','src/engine/puzzle.mjs','src/engine/hex.mjs','src/engine/solver.mjs']){
  assert.deepEqual(fs.readFileSync(path.join(ROOT,ref)),execFileSync('git',['show',stored.baseCommit+':'+ref],{cwd:ROOT}));
 }
});

test('recorded evidence reproduces byte-for-byte and a broken central condition fails the fixed contract',()=>{
 for(const [name,bytes] of positiveReportFiles())assert.equal(fs.readFileSync(path.join(ROOT,POSITIVE_DIRECTORY,'private',name),'utf8'),bytes,name);
 const changed=structuredClone(definition);changed.logic.clues.find(c=>c.id==='H4').distance++;
 assert.throws(()=>positiveEvidence(changed));
 // The public builder must also reject changes that break target or uniqueness.
 assert.throws(()=>buildPositivePlaytest(changed));
});

test('every used motif remains approved and placeable on all 25 passable hexes',()=>{
 const library=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/catalog/library.json')));
 for(const assetId of new Set(definition.presentation.assetPlacements.map(p=>p.assetId)))for(const cell of cellsOf(definition.logic.map.grid)){
  const map={...definition.logic.map,objects:[{id:'object',cells:[cell],passable:true}]};
  validateB2Places(map,[{id:'placement',assetId,anchor:cell,objectId:'object'}],
   {library,backgroundId:definition.presentation.background});
 }
});

test('public reference uses the existing loader, excludes private data, and exports reproducibly with static-host permissions',async()=>{
 const files=buildPositivePlaytest(),requests=[];
 const loader=createPuzzleLoader({manifestUrl:'http://local/.dev/b2-positive/manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);requests.push(ref);
  const bytes=ref.startsWith('.dev/b2-positive/')?files.get(ref.slice('.dev/b2-positive/'.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 const puzzle=await loader.load(POSITIVE_ID);
 assert.deepEqual(puzzle.solution,definition.solution);assert.deepEqual(puzzle.map,definition.logic.map);
 assert.deepEqual(puzzle.assetPlacements,definition.presentation.assetPlacements);
 assert.ok(!requests.some(r=>/^(docs|scripts|tests)\//.test(r)));
 const dto=JSON.parse(files.get(POSITIVE_ID+'.json'));
 assert.deepEqual(dto.puzzle.presentation.hints,[]);
 for(const key of ['solution','metadata','proof','diagnosis','trace','contract','handCertificate','fingerprints']){
  assert.equal(Object.hasOwn(dto,key),false);assert.equal(Object.hasOwn(dto.puzzle,key),false);
 }
 const previousUmask=process.umask(0o077);
 try{exportStock(['--stock','POSITIVE']);exportStock(['--stock','POSITIVE']);}finally{process.umask(previousUmask);}
 for(const [name,bytes] of files){
  const output=path.join(ROOT,'.dev/b2-positive',name);
  assert.equal(fs.readFileSync(output,'utf8'),bytes);assert.equal(fs.statSync(output).mode&0o777,0o644);
 }
 assert.equal(fs.statSync(path.join(ROOT,'.dev/b2-positive')).mode&0o777,0o755);
 assert.equal(fs.statSync(path.join(ROOT,'.dev')).mode&0o777,0o755);
});
