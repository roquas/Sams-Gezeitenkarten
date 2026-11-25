import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {importCardBatch,importPuzzleCandidates,importCommunityCards} from '../../scripts/lib/card-import.mjs';
import {openCardLibrary} from '../../scripts/lib/card-library.mjs';
import {originSourceRecordSha256} from '../../scripts/lib/candidate-origin-contract.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {buildCommunityBeta,SOURCE} from '../../scripts/community-beta.mjs';
import {createFlavorRequest,createFlavorDraft} from '../../scripts/lib/flavor-contract.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {main as cli} from '../../scripts/card-library.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));
const directory=t=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'gk-card-import-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;};
const config=read('scripts/config/s04-c-production-v1.json');
const protectedFiles=()=>new Map([SOURCE+'/cases.json',SOURCE+'/migration.json',SOURCE+'/editorial.json',SOURCE+'/selection.json',
 ...[...buildCommunityBeta().keys()].map(name=>'puzzles/community-s04-c-v1/'+name)]
 .map(ref=>[ref,sha256(fs.readFileSync(path.join(ROOT,ref)))]));
const digestDir=dir=>new Map(fs.readdirSync(dir,{recursive:true}).filter(ref=>fs.statSync(path.join(dir,ref)).isFile()).map(ref=>[ref,sha256(fs.readFileSync(path.join(dir,ref)))]));

function alternativeCandidate(row){
 const other=structuredClone(row),logic=other.definition.logic;
 logic.clues=[];
 const starts=logic.map.objects.filter(o=>o.passable).flatMap(o=>o.cells);
 logic.start=starts.find(c=>c!==logic.start)??logic.start;
 const routes=createRules(logic).routes([logic.start],{remaining:100000});
 for(const route of routes)if(JSON.stringify(route)!==JSON.stringify(row.definition.solution)){
  other.definition.solution=route;return other;
 }
 throw Error('Fixture has no alternative route');
}

test('four real versioned cases reuse immutable named cards; route/start, definitions and beta bytes remain intact',()=>{
 const stored='content/card-library/f02a-v1',before=protectedFiles(),cardBytes=digestDir(path.join(ROOT,stored));
 const report=importCommunityCards({directory:path.join(ROOT,stored)});
 assert.deepEqual(report.cards.map(c=>c.source.id.split('/').at(-1)),['C-06','C-02','C-03','C-11']);
 assert.equal(report.distinctCards,4);assert.ok(report.cards.every(c=>c.reused));
 const cases=read(SOURCE+'/cases.json'),library=openCardLibrary({directory:path.join(ROOT,stored)});
 const catalog=read('assets/catalog/library.json');
 for(const record of report.cards){
  const row=cases.cases.find(c=>c.id===record.source.id.split('/').at(-1)),original=structuredClone(row),card=library.load(record.key);
  assert.deepEqual(logicalFingerprints(row.definition),row.fingerprints);
  assert.deepEqual(Object.keys(card.naming.objectNames).sort(),row.definition.logic.map.objects.map(o=>o.id).sort());
  assert.equal(new Set(Object.values(card.naming.objectNames)).size,row.definition.logic.map.objects.length);
  if(row.id==='C-02')assert.equal(card.naming.objectNames['geo-03'],'Tesoro');
  const alternative=alternativeCandidate(row);
  assert.notEqual(logicalFingerprints(alternative.definition).instance,row.fingerprints.instance);
  // Compare identity with a different start and route without writing into the
  // checked-in library. The explicit map input carries neither puzzle field.
  const source=record.source;assert.equal(library.lookup(source).cardKey,record.key);
  const doc={...row.definition,id:row.id,presentation:{title:row.id,intro:['Fixture'],hints:[],
   objectNames:card.naming.objectNames,clueTexts:Object.fromEntries(row.definition.logic.clues.map(c=>[c.id,'Original reference'])),
   background:card.background,assetPlacements:card.assetPlacements}};
  const request=createFlavorRequest(doc,{assetLibrary:catalog}),draft=createFlavorDraft(request);
  const startId=row.definition.logic.map.objects.find(o=>o.cells.includes(row.definition.logic.start)).id;
  assert.ok(Object.hasOwn(card.naming.objectNames,startId));assert.deepEqual(draft.presentation.objectNames,card.naming.objectNames);
  assert.deepEqual(row,original);
 }
 assert.deepEqual(protectedFiles(),before);assert.deepEqual(digestDir(path.join(ROOT,stored)),cardBytes);
 assert.throws(()=>buildCommunityBeta({release:true}),/Flavor not approved/);
 assert.ok(read(SOURCE+'/editorial.json').cases.every(c=>c.status==='pending'&&c.presentation===null&&c.semanticReview===null));
});

test('new library accepts the real cases and a second puzzle origin with another route on the same cards',t=>{
 const dir=directory(t),report=importCommunityCards({directory:dir}),lib=openCardLibrary({directory:dir});
 for(const entry of report.cards){
  const row=read(SOURCE+'/cases.json').cases.find(c=>c.id===entry.source.id.split('/').at(-1));
  const other=alternativeCandidate(row);
  assert.notEqual(logicalFingerprints(other.definition).instance,row.fingerprints.instance);
  const result=lib.reuse({map:other.definition.logic.map,background:config.backgroundId,assetPlacements:other.assetPlacements},config,
   {kind:'puzzle-candidate',id:'another-origin/'+row.id,sha256:originSourceRecordSha256(other)});
  assert.equal(result.reused,true);assert.equal(result.card.key,entry.key);assert.deepEqual(result.card.naming.objectNames,entry.objectNames);
 }
 assert.equal(fs.readdirSync(path.join(dir,'cards')).length,4);assert.equal(fs.readdirSync(path.join(dir,'links')).length,8);
});

test('accepted existing batch imports through its unchanged strict reader; retrospective B2 variants share the card',async t=>{
 const dir=directory(t),batch=path.join(ROOT,'docs/verification/B2-example/source-batch'),before=digestDir(batch);
 const first=await importCardBatch({batch,directory:path.join(dir,'library')});assert.ok(first.distinctCards>0);
 const again=await importCardBatch({batch,directory:path.join(dir,'library')});assert.ok(again.cards.every(c=>c.reused));
 assert.deepEqual(first.cards.map(c=>[c.key,c.objectNames]),again.cards.map(c=>[c.key,c.objectNames]));
 assert.deepEqual(digestDir(batch),before);
 const original=fs.readFileSync(path.join(ROOT,'docs/verification/B2-example/run/candidates.jsonl'),'utf8');
 const candidates=original.trim().split('\n').map(JSON.parse),variants=candidates.filter(r=>r.attemptId===candidates[0].attemptId).slice(0,2);
 assert.equal(variants.length,2);const file=path.join(dir,'candidates.jsonl');fs.writeFileSync(file,variants.map(r=>JSON.stringify(r)+'\n').join(''));
 const provenance=read('docs/verification/B2-example/source-batch/manifest.json').provenance;
 const added=importPuzzleCandidates({file,directory:path.join(dir,'library'),releaseId:provenance.releaseId,backgroundId:provenance.backgroundId});
 assert.equal(added.verification.verifiedCandidates,2);assert.equal(added.distinctCards,1);assert.ok(added.cards.every(c=>c.reused));
 assert.equal(added.cards[0].key,added.cards[1].key);assert.deepEqual(added.cards[0].objectNames,added.cards[1].objectNames);
 assert.equal(fs.readFileSync(path.join(ROOT,'docs/verification/B2-example/run/candidates.jsonl'),'utf8'),original);
 // An altered B2 origin cannot claim historical membership, even with a copied
 // map. The existing verifier rejects it before opening the new target library.
 variants[0].seed++;fs.writeFileSync(file,variants.map(r=>JSON.stringify(r)+'\n').join(''));
 assert.throws(()=>importPuzzleCandidates({file,directory:path.join(dir,'untrusted'),...provenance}),/origin contract required/);
 assert.equal(fs.existsSync(path.join(dir,'untrusted')),false);
});

test('invalid batch provenance fails before a card library is created; CLI requires an explicit destination',async t=>{
 const dir=directory(t),batch=path.join(dir,'batch');fs.cpSync(path.join(ROOT,'docs/verification/B2-example/source-batch'),batch,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(batch,'manifest.json')));manifest.provenance.catalogSha256='0'.repeat(64);
 fs.writeFileSync(path.join(batch,'manifest.json'),JSON.stringify(manifest));
 await assert.rejects(importCardBatch({batch,directory:path.join(dir,'invalid')}),/provenance mismatch/);
 assert.equal(fs.existsSync(path.join(dir,'invalid')),false);
 await assert.rejects(cli(['community']),/Usage/);await assert.rejects(cli(['community','--library',dir,'--unknown','x']),/Usage/);
});
