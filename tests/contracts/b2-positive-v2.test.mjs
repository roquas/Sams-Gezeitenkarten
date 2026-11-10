import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';
import {positiveV2Evidence,positiveV2ReportFiles} from '../../scripts/report-b2-positive-v2.mjs';
import {readPositiveV2Definition,buildPositiveV2Playtest,POSITIVE_V2_DIRECTORY,POSITIVE_V2_ID} from '../../scripts/lib/b2-positive-v2.mjs';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';
import {validateB2Places} from '../../scripts/lib/puzzle-clues.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {main as exportStock} from '../../scripts/export-b2-playtest.mjs';

const definition=readPositiveV2Definition();
test('V2 validates all 64 reachable-premise graphs and a necessary count edge cannot be cut',()=>{
 const e=positiveV2Evidence();
 assert.equal(e.states.length,64);assert.equal(e.proof.irredundant,true);
 for(const s of e.states){
  const logic={...definition.logic,clues:definition.logic.clues.filter(c=>s.clueIds.includes(c.id))};
  verifyTrace(logic,s.local,solvePuzzle(logic,{metrics:false}).solutions);
 }
 const broken=structuredClone(e.states.at(-1).local);
 broken.trace.find(t=>t.id===e.contract.traceWitnesses.count).premises=[];
 assert.throws(()=>verifyTrace(definition.logic,broken,e.proof.solutions),/reachable premises/);
 assert.equal(e.contract.humanPlaytest,'pending');assert.equal(e.contract.difficulty,'unrated');
});
test('V2 evidence reproduces, changed count fails, and the first design remains the delivered design',()=>{
 for(const [name,bytes] of positiveV2ReportFiles())assert.equal(fs.readFileSync(path.join(ROOT,POSITIVE_V2_DIRECTORY,'private',name),'utf8'),bytes);
 const base=path.join(ROOT,POSITIVE_V2_DIRECTORY,'private');
 assert.deepEqual(fs.readFileSync(path.join(base,'attempt-0.json')),fs.readFileSync(path.join(base,'definition.json')));
 const changed=structuredClone(definition);changed.logic.clues.find(c=>c.id==='H6').count=1;
 assert.throws(()=>positiveV2Evidence(changed));assert.throws(()=>buildPositiveV2Playtest(changed));
 for(const ref of ['scripts/lib/b2-local-deduction.mjs','scripts/lib/b2-deduction.mjs','src/engine/puzzle.mjs',
  'src/engine/hex.mjs','src/engine/solver.mjs','tests/helpers/b2-deduction-trace.mjs'])
  assert.deepEqual(fs.readFileSync(path.join(ROOT,ref)),execFileSync('git',['show','21f9bf5:'+ref],{cwd:ROOT}));
});
test('V2 motifs remain placeable on every hex and public loader receives only the public projection',async()=>{
 const library=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/catalog/library.json')));
 for(const assetId of new Set(definition.presentation.assetPlacements.map(p=>p.assetId)))for(const cell of cellsOf(definition.logic.map.grid))
  validateB2Places({...definition.logic.map,objects:[{id:'object',cells:[cell],passable:true}]},
   [{id:'placement',assetId,anchor:cell,objectId:'object'}],{library,backgroundId:definition.presentation.background});
 const files=buildPositiveV2Playtest();
 const loader=createPuzzleLoader({manifestUrl:'http://local/.dev/b2-positive-v2/manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);
  assert.ok(!/^(docs|scripts|tests)\//.test(ref));
  const bytes=ref.startsWith('.dev/b2-positive-v2/')?files.get(ref.slice('.dev/b2-positive-v2/'.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 const puzzle=await loader.load(POSITIVE_V2_ID);assert.deepEqual(puzzle.solution,definition.solution);
 const dto=JSON.parse(files.get(POSITIVE_V2_ID+'.json'));
 assert.deepEqual(Object.keys(dto.puzzle).sort(),['schemaVersion','rulesVersion','dataVersion','id','logic','presentation'].sort());
 assert.deepEqual(dto.puzzle.presentation.hints,[]);
 exportStock(['--stock','POSITIVE-V2']);
 for(const [name,bytes] of files){
  const ref=path.join(ROOT,'.dev/b2-positive-v2',name);
  assert.equal(fs.readFileSync(ref,'utf8'),bytes);assert.equal(fs.statSync(ref).mode&0o777,0o644);
 }
});
