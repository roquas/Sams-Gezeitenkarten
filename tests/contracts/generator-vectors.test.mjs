import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {generateBatchRecord,normalizeBatchOptions} from '../../scripts/lib/map-batch.mjs';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {createCatalogProfile} from '../../src/assets/assignment.mjs';

const vectors=JSON.parse(fs.readFileSync(new URL('../fixtures/generation/catalog-vectors.json',import.meta.url)));
let actual;
before(()=>{
 const {catalog}=loadReleasedAssetCatalog({repositoryRoot:fileURLToPath(new URL('../../',import.meta.url)),
  releaseId:vectors.releaseId,backgroundId:vectors.backgroundId});
 assert.equal(catalog.verification.catalogSha256,vectors.catalogSha256);
 const profile=createCatalogProfile(catalog);
 actual=new Map(vectors.cases.map(vector=>[vector.name,
  observe(generateBatchRecord(vector.index,normalizeBatchOptions(vector.options),catalog,profile))]));
});

// Select observable results, omitting the repeated full catalog profile and
// analysis metrics. Expected values are literal data captured at 81cf564.
function observe(row){
 assert.equal(row.error,undefined,row.error?.message);
 const g=row.generation,d=g.diagnostics,a=row.assignment;
 return {index:row.index,generationSeed:row.generationSeed,assignmentSeed:row.assignmentSeed,
  status:g.status,map:g.map,mapFingerprint:row.mapFingerprint,decision:row.decision,rejectionReasons:row.rejectionReasons,
  error:row.error??null,
  assignment:a?{status:a.status,placements:a.placements,assignmentVersion:a.diagnostics.assignmentVersion,
   assignedCount:a.diagnostics.assignedCount,unassignedCount:a.diagnostics.unassignedCount,assetUsage:a.diagnostics.assetUsage}:null,
  diagnostics:{generatorVersion:d.generatorVersion,config:d.config,attempts:d.attempts,placementAttempts:d.placementAttempts,
   rejectedAttempts:d.rejectedAttempts,unknownAttempts:d.unknownAttempts,rejectionCounts:d.rejectionCounts,
   attemptLog:d.attemptLog.map(log=>({attempt:log.attempt,status:log.status,reasons:log.reasons,
    placementAttempts:log.placementAttempts,failedObject:log.failedObject??null,catalog:log.catalog,routes:log.routes??[]}))}};
}

for(const vector of vectors.cases)test('fixed generator output: '+vector.name,()=>{
 assert.deepEqual(actual.get(vector.name),vector.expected);
});
