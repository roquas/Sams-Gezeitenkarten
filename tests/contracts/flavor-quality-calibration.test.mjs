import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {preparePilotStore} from '../../scripts/lib/flavor-quality-pilot.mjs';
import {buildReaderInputs} from '../../scripts/lib/flavor-quality-package.mjs';
import {createCalibrationPackage,recordCalibrationResponse} from '../../scripts/lib/flavor-quality-calibration.mjs';
import {compareClue} from '../../scripts/lib/flavor-quality-compare.mjs';
import {syntheticCorpus} from '../fixtures/flavor-quality/synthetic-corpus.mjs';
import {technicalReader} from '../fixtures/flavor-quality/technical-responses.mjs';
import {json} from '../../scripts/lib/flavor-production.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'f02b-calibration-'));
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
let fixture;
function f(){if(!fixture){const p=preparePilotStore(path.join(root,'production')),inputs=buildReaderInputs(p);fixture={...p,inputs,cases:syntheticCorpus(inputs.entries)};}return fixture;}
test('permanent artificial corpus covers boundaries, objects, visits, context, ambiguity, creativity and all six atom types separately from real revisions',()=>{
 const {inputs,cases}=f();assert.ok(cases.length>=22);
 for(const c of cases){const chart=inputs.entries[c.entryIndex].input.chart;
  const result=compareClue({...chart,original:c.originals[0],atoms:c.interpretations[0],unresolved:c.expectation.comparison==='incomparable'?['artificial-unresolved']:[]});
  assert.equal(result.result,c.expectation.comparison,c.fixtureId+': '+c.expectation.reason);assert.equal(c.kind,'synthetic-hand-authored');
 }
 assert.equal(new Set(cases.filter(c=>c.fixtureId.startsWith('positive-')).flatMap(c=>c.originals.map(a=>a.type))).size,6);
 const extra=cases.find(c=>c.fixtureId==='additional-other-original');assert.equal(extra.interpretations[0].length,2);
 assert.equal(extra.expectation.stage3,'ERROR');
});
test('empirical calibration export is unpaired, opaque and contains no expected answer/label in any transported file',()=>{
 const data=f(),c=data.cases.find(c=>c.fixtureId==='positive-creative'),pkg=createCalibrationPackage({...data,fixture:c});
 for(const [name,b] of pkg.files){const text=Buffer.from(b).toString();for(const secret of [c.fixtureId,c.expectation.reason,'synthetic-hand-authored','expectedResult','originalSourceBinding'])assert.ok(!text.includes(secret),name+': '+secret);}
 assert.equal(pkg.job.items.length,1);assert.equal(pkg.sidecar.items[0].fixtureId,c.fixtureId);
 const response=technicalReader(pkg.job,[c.originals]),responseBytes=Buffer.from(json(response));
 const observation=recordCalibrationResponse({directory:path.join(root,'technical-observations'),pkg,responseBytes,operator:{model:'TECHNICAL TEST DOUBLE, NOT REAL GENAI',producedAt:null}});
 assert.ok(observation.created);assert.ok(fs.readFileSync(path.join(observation.directory,'response.json')).equals(responseBytes));
 const before=f().production.findRecord(data.references[0]);assert.equal(before.draft.revision,1);
});
