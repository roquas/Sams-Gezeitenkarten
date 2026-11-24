import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCommunityBeta,main,SOURCE,OUTPUT} from '../../scripts/community-beta.mjs';
import {createIdentifiedLoader} from '../../src/beta/context.mjs';
import {sha256,canonicalJson} from '../../scripts/lib/content-hash.mjs';

const read=ref=>JSON.parse(fs.readFileSync(ref,'utf8'));
test('all 15 original cases load through the application, keep identities and have the original unique solution',async()=>{
 const files=buildCommunityBeta(),source=read(SOURCE+'/cases.json');
 const manifestUrl=new URL('../../'+OUTPUT+'/manifest.json',import.meta.url);
 const loader=createIdentifiedLoader({manifestUrl,fetcher:async url=>({ok:true,json:async()=>read(new URL(url))})});
 const manifest=await loader.manifest();
 assert.equal(manifest.puzzles.length,15);assert.equal(new Set(source.cases.map(r=>r.fingerprints.mapStructure)).size,15);
 for(const row of source.cases){
  const puzzle=await loader.load(row.id),dto=JSON.parse(files.get(row.id+'.json'));
  assert.deepEqual(dto.puzzle.logic,row.definition.logic);
  assert.deepEqual(dto.puzzle.presentation.assetPlacements,row.assetPlacements);
  assert.deepEqual(puzzle.solution,row.definition.solution);assert.equal(puzzle.analysis.status,'unique');
  assert.equal(puzzle.identity.variantId,'var-'+row.fingerprints.variant.split(':')[1]);
  assert.ok(!Object.hasOwn(dto.puzzle,'solution'));assert.ok(!Object.hasOwn(dto,'candidateId'));
 }
 const inventory=JSON.parse(files.get('inventory.json'));
 for(const entry of inventory.files){assert.equal(entry.sha256,sha256(files.get(entry.path)));assert.equal(entry.bytes,Buffer.byteLength(files.get(entry.path)));}
 assert.equal(inventory.releaseReady,false);assert.match(main(),/15 existing/);
 assert.throws(()=>buildCommunityBeta({release:true}),/Flavor not approved/);
});
test('human source contains twelve matched first plays, not repeat phases or invented scores',()=>{
 const observations=read(SOURCE+'/first-plays.json');
 const cases=read(SOURCE+'/cases.json').cases;
 assert.equal(observations.distinctTesters,1);assert.equal(observations.observations.length,12);
 assert.equal(new Set(observations.observations.map(r=>r.id)).size,12);
 for(const row of observations.observations){
  assert.equal(row.feedback.fairness,'yes');assert.equal(row.firstPhase.status,'solved');
  assert.equal(row.sourceIdentity.variantId,'var-'+cases.find(c=>c.id===row.id).fingerprints.variant.split(':')[1]);
  assert.equal(row.feedback.fun,undefined);assert.equal(row.feedback.solvingStyle,undefined);
 }
 for(const id of ['C-05','C-14'])assert.equal(observations.observations.find(r=>r.id===id).sourceFeedback,'phases[0].feedbackAtEnd');
});
test('reviewed presentations need a new dataVersion and text-bound complete semantic review',()=>{
 const files=buildCommunityBeta(),editorial=read(SOURCE+'/editorial.json');
 // In-memory review fixture only; no actual text approval is saved to the pool.
 for(const edit of editorial.cases){
  const p=JSON.parse(files.get(edit.id+'.json')).puzzle.presentation;
  edit.presentation=Object.fromEntries(['title','intro','objectNames','clueTexts'].map(k=>[k,p[k]]));
  edit.status='approved';edit.dataVersion=2;
  edit.semanticReview={reviewer:'test-fixture',presentationSha256:sha256(canonicalJson(edit.presentation)),
   clueIds:Object.keys(p.clueTexts),introAndNamesChecked:true};
 }
 const approved=buildCommunityBeta({release:true,editorial});
 assert.equal(JSON.parse(approved.get('inventory.json')).releaseReady,true);
 const dto=JSON.parse(approved.get('C-06.json'));
 assert.equal(dto.puzzle.dataVersion,2);
 assert.deepEqual(dto.identity,JSON.parse(files.get('C-06.json')).identity);
 for(const change of [e=>e.presentation.title+=' changed',e=>e.dataVersion=1,
  e=>e.semanticReview.clueIds.pop(),e=>e.semanticReview.introAndNamesChecked=false]){
  const copy=structuredClone(editorial);change(copy.cases[0]);
  assert.throws(()=>buildCommunityBeta({release:true,editorial:copy}));
 }
});
