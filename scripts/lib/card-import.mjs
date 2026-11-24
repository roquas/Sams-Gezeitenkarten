// Sidecar adapters only. Existing batches, B1/B2 results and beta DTOs are read-only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readContactBatch} from './map-contact-sheet.mjs';
import {verifyCandidates} from '../verify-puzzle-experiment.mjs';
import {originSourceRecordSha256} from './candidate-origin-contract.mjs';
import {openCardLibrary} from './card-library.mjs';
import {sha256} from './content-hash.mjs';
import {buildCommunityBeta,SOURCE} from '../community-beta.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const digestFiles=(directory,names)=>names.map(name=>({name,sha256:sha256(fs.readFileSync(path.join(directory,name)))}));
const report=results=>({schemaVersion:1,cards:results.map(({card,link,reused})=>({source:link.source,key:card.key,
 integritySha256:card.integritySha256,objectNames:card.naming.objectNames,reused})),
 distinctCards:new Set(results.map(r=>r.card.key)).size});
export async function importCardBatch({batch,directory,repositoryRoot=ROOT,supply,acceptedIndices='all'}){
 const sourceFiles=digestFiles(batch,['manifest.json','summary.json','candidates.jsonl','accepted.jsonl']);
 // Includes the existing manifest/seed/release/assignment checks, not a new
 // looser batch reader. No B1/B2 files are modified or regenerated.
 const loaded=await readContactBatch({batch,repositoryRoot,acceptedIndices});
 assert.deepEqual(sourceFiles,digestFiles(batch,sourceFiles.map(f=>f.name)),'Card batch changed while validating');
 const library=openCardLibrary({directory,repositoryRoot,supply}),runId=sourceFiles[0].sha256;
 const results=loaded.rows.map(row=>library.reuse({map:row.generation.map,background:loaded.manifest.provenance.backgroundId,
  assetPlacements:row.assignment.placements},loaded.manifest.provenance,
  {kind:'batch-map',id:'batch:'+runId+'/'+row.index,sha256:originSourceRecordSha256(row)}));
 return {...report(results),sourceFiles};
}
export function importPuzzleCandidates({file,directory,repositoryRoot=ROOT,releaseId,backgroundId,supply,originContext}){
 const bytes=fs.readFileSync(file);
 // Retain the independent verifier and its independently expected origin hash.
 // A self-declared candidate or handoff cannot downgrade this contract.
 const verification=verifyCandidates(file,originContext);
 assert.deepEqual(fs.readFileSync(file),bytes,'Puzzle candidates changed while validating');
 const rows=bytes.toString('utf8').split('\n').filter(Boolean).map(JSON.parse);
 const library=openCardLibrary({directory,repositoryRoot,supply});
 return {...report(rows.map(row=>library.reuse({map:row.definition.logic.map,background:backgroundId,assetPlacements:row.assetPlacements},
  {releaseId,backgroundId},{kind:'puzzle-candidate',id:row.candidateId??(row.attemptId+'/'+row.fingerprints.variant),sha256:originSourceRecordSha256(row)}))),
  sourceSha256:sha256(bytes),verification};
}
export function importCommunityCards({directory,ids=['C-06','C-02','C-03','C-11'],supply}={}){
 // This is the versioned editorial handoff, NOT a replacement B2 origin
 // certificate. Its existing migration binding and logical identities are
 // validated by the unchanged beta builder. No flavor/release gate is passed.
 buildCommunityBeta();
 const source=read(path.join(ROOT,SOURCE,'cases.json')),editorial=read(path.join(ROOT,SOURCE,'editorial.json'));
 const config=read(path.join(ROOT,'scripts/config/s04-c-production-v1.json'));
 assert.equal(config.backgroundId,editorial.background,'Community background provenance conflict');
 assert.ok(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length,'Explicit distinct case IDs required');
 const rows=ids.map(id=>{const row=source.cases.find(c=>c.id===id);assert.ok(row,'Unknown community case: '+id);return row;});
 const library=openCardLibrary({directory,supply});
 return {...report(rows.map(row=>library.reuse({map:row.definition.logic.map,background:editorial.background,assetPlacements:row.assetPlacements},
  config,{kind:'puzzle-candidate',id:'community:s04-c-v1/'+row.id,sha256:originSourceRecordSha256(row)}))),
 sourceFiles:digestFiles(path.join(ROOT,SOURCE),['cases.json','migration.json','editorial.json']),
 scope:'card-names-only; existing editorial and flavor approvals remain pending'};
}
