import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateProductionConfig,productionPlan,writePrivateHandoff} from '../../scripts/lib/s04-c-production-policy.mjs';
import {verifyProduction} from '../../scripts/verify-s04-c-production.mjs';
const c=JSON.parse(fs.readFileSync('scripts/config/s04-c-production-v1.json'));
const pilot=JSON.parse(fs.readFileSync('scripts/config/s04-c-v1.json'));
test('production retains reviewed budgets and preferences, expands diagnosis capacity and explicitly fixes all map options',()=>{
 validateProductionConfig(c);assert.deepEqual(c.search,pilot.search);assert.deepEqual(c.quality,pilot.quality);
 assert.equal(c.maxStatesPerDiagnosis,pilot.maxStatesPerDiagnosis);assert.equal(c.maxNodes,pilot.maxNodes);assert.equal(c.maxClueParameters,pilot.maxClueParameters);
 for(const change of [x=>delete x.batch.config.objectSizes,x=>delete x.workerHeapMiB,x=>x.search.maxSolverChecks++,x=>x.implementationLimits.verifierNodes++,x=>x.selection.controls++,x=>x.arms[0].maxRestarts=8]){
  const copy=structuredClone(c);change(copy);assert.throws(()=>validateProductionConfig(copy));
 }
 assert.notEqual(c.seed,pilot.seed);assert.ok(c.batch.seedStart>pilot.batch.seedStart+pilot.batch.maxAttempts);
});
test('only two fair rounds are scheduled even when fewer maps leave spare diagnosis capacity',()=>{
 const records=[];
 for(let mapIndex=0;mapIndex<3;mapIndex++)for(let ordinal=1;ordinal<=4;ordinal++)records.push({candidateId:mapIndex+'/'+ordinal,mapIndex,source:{ordinal,line:records.length+1,candidateId:mapIndex+'/'+ordinal},definition:{logic:{clues:[{},{},{}]}},properties:{individualExactness:[]}});
 const plan=productionPlan(records,c);assert.deepEqual(plan.scheduled.map(r=>r.candidateId),['0/1','1/1','2/1','0/2','1/2','2/2']);
 assert.equal(plan.undiagnosed.length,6);assert.equal(plan.earlyRejected.length,0);
 assert.ok(plan.perMap.every(r=>r.scheduled<=2));
});
test('neutral handoff contains no group, preference, diagnosis or automatic flavor and audits control reservations privately',()=>{
 const rows=[{candidateId:'a',fingerprints:{variant:'aa',mapStructure:'m1'},definition:{logic:{clues:[]}},assetPlacements:[],preferences:{P1:false,P2:true,P3:true}},{candidateId:'b',fingerprints:{variant:'bb',mapStructure:'m1'},preferences:{P1:true,P2:true,P3:true}}];
 const files=new Map();writePrivateHandoff(rows,{selected:[{candidateId:'a',group:'control'}]},c,(p,b)=>files.set(p,b));
 const overview=files.get('handoff/overview.md');assert.match(overview,/C-01/);assert.doesNotMatch(overview,/control|preferred|P1|P2|P3|solution|diagnosis/);
 const handoff=JSON.parse(files.get('handoff/private-cases.json'));assert.equal(handoff.cases[0].definition.presentation,undefined);
 assert.equal(handoff.cases[0].group,undefined);assert.equal(handoff.cases[0].preferences,undefined);
 assert.deepEqual(JSON.parse(files.get('C/control-reservations.json'))[0].preferredVariantsOnReservedMap,['b']);
});
test('verification never learns an expected origin digest from the inspected files',async()=>{
 await assert.rejects(verifyProduction('/nonexistent',{}),/Independent expected receipt required/);
 await assert.rejects(verifyProduction('/nonexistent',{programCommit:'a',inventorySha256:'b'}),/Independent expected receipt required/);
});
