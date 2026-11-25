import fs from 'node:fs';
// Calibration packages are isolated from the production/qualification store.
// Fixture IDs, expectations and mutation labels stay in the LOCAL sidecar only.
import assert from 'node:assert/strict';
import {hash,textUnits,validateEnvelope,validateReaderItem,object,text,nullable,structure} from './flavor-quality-contract.mjs';
import {createReaderJob,buildReaderInputs} from './flavor-quality-package.mjs';
import {json} from './flavor-production.mjs';
import {sha256} from './content-hash.mjs';
import {parseQualityResponse} from './flavor-quality-json.mjs';
import {directory,withStoreLock,publishTree,seal,unseal,readTree} from './immutable-file-store.mjs';
import path from 'node:path';
export function createCalibrationPackage({production,references,fixture}){
 // One unpaired case per empirical export. Never include a labelled correct
 // counterpart or any expected answer in the reader payload/template/images.
 const inputs=buildReaderInputs({production,references:[references[fixture.entryIndex]]}),entry=inputs.entries[0];
 entry.input.presentation=structuredClone(fixture.presentation);
 entry.input.seriesContext=structuredClone(fixture.context??{version:1,episodes:[]});
 entry.input.units=textUnits(entry.input.presentation,entry.input.seriesContext);
 entry.originals=structuredClone(fixture.originals);
 entry.binding={calibrationVersion:1,fixtureId:fixture.fixtureId,kind:fixture.kind,expected:structuredClone(fixture.expectation),
  originalSourceBinding:entry.binding.sourceBinding,publicInputHash:hash(entry.input),originals:entry.originals};
 return createReaderJob(inputs);
}
export function recordCalibrationResponse({directory:root,pkg,responseBytes,operator={model:null,producedAt:null}}){
 structure(operator,object({model:nullable(text),producedAt:nullable(text)}));
 const response=parseQualityResponse(responseBytes);validateEnvelope(pkg.job,response);
 response.items.forEach(result=>validateReaderItem(pkg.job.items.find(i=>i.itemId===result.itemId),result));
 assert.equal(response.items.length,pkg.job.items.length,'flavor quality: calibration observation must be complete');
 const receipt={version:1,jobId:pkg.job.jobId,methodHash:pkg.job.methodHash,responseSha256:sha256(responseBytes),operator,
  observedAt:new Date().toISOString(),limits:'Declared manual calibration observation; not production reliability or semantic approval.'};
 directory(root);const target=path.join(root,'observation-'+hash([receipt.jobId,receipt.responseSha256,operator]));
 return withStoreLock(root,()=>{
  if(fs.existsSync(target)){
   const old=unseal(readTree(target)),prior=JSON.parse(old.get('receipt.json'));
   assert.equal(sha256(old.get('response.json')),receipt.responseSha256);
   assert.equal(hash(JSON.parse(old.get('job.json'))),hash(pkg.job));assert.equal(hash(JSON.parse(old.get('local-binding.json'))),hash(pkg.sidecar));
   assert.equal(hash(prior.operator),hash(operator));return {created:false,directory:target};
  }
  return {created:publishTree(target,seal(new Map([['job.json',json(pkg.job)],['local-binding.json',json(pkg.sidecar)],['response.json',responseBytes],['receipt.json',json(receipt)]]))),directory:target};
 });
}
