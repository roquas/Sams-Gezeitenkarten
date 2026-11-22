// Phase-C policy only; the engine, search, normalizer and quality rules are reused.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {normalizeBatchOptions} from './map-batch.mjs';
import {validateSearchBudgets} from './puzzle-candidate-search.mjs';
import {planDiagnoses} from './s03-v2-plan.mjs';
import {sha256} from './content-hash.mjs';
const json=x=>JSON.stringify(x,null,2)+'\n';
export function validateProductionConfig(c){
 assert.equal(c.protocol,'s04-c-production-1');assert.equal(c.nodeVersion,'v22.23.3');
 assert.equal(c.strategy,'random-incremental-1');assert.equal(c.steps,6);
 assert.equal(c.normalization,'count-distance-extremes-1');assert.equal(c.cluePolicy,'s03-no-multihour-zero-1');
 assert.deepEqual(c.batch,normalizeBatchOptions(c.batch),'All batch parameters must be explicit');
 assert.deepEqual(c.arms,[{id:'C',maxRestarts:4}]);
 validateSearchBudgets({...c.search,maxRestarts:4});
 assert.deepEqual(c.search,{maxSolverChecks:2000,maxMatchEvaluations:5000000,maxRouteFilterEvaluations:20000000});
 assert.deepEqual(c.quality,{minRoutes:16,maxBaselineFixed:2,minClues:3,maxClues:7,maxSingleFixed:3,maxOpenHours:2,maxOpenDomain:3,maxCouplings:2});
 assert.deepEqual(c.implementationLimits,{diagnosisNodes:250000,diagnosisOracleNodes:250000,verifierNodes:1000000,verifierEffectNodes:1000000});
 for(const [key,limit] of Object.entries({maxNodes:100000,maxClueParameters:100000,maxDiagnoses:48,maxDiagnosisStates:3120,maxStatesPerDiagnosis:65,maxDiagnosesPerMap:2,timeoutMs:900000,workerHeapMiB:768}))
  assert.equal(c[key],limit,'Fixed resource contract: '+key);
 assert.equal(c.batch.targetCount,24);assert.equal(c.batch.maxAttempts,48);assert.equal(c.batch.config.maxMapAttempts,1);
 assert.equal(c.selection.preferred,12);assert.equal(c.selection.controls,4);assert.equal(c.selection.maxPerSignature,2);
 for(const k of ['targetNamespace','neutralSalt'])assert.ok(typeof c[k]==='string'&&c[k].length);
 assert.equal(c.selection.salt,'s04-c-production-cohorts-1');
}
export function productionPlan(records,c){
 const full=planDiagnoses(records,{...c,maxTargets:c.batch.maxAttempts});
 const allowed=full.scheduled.filter(r=>r.round<=c.maxDiagnosesPerMap);
 const scheduled=new Set(allowed.map(r=>r.candidateId));
 const undiagnosed=[...full.scheduled,...full.undiagnosed].filter(r=>!scheduled.has(r.candidateId));
 return {...full,policy:'round-robin-original-ordinal-two-rounds-1',scheduled:allowed,undiagnosed,
  perMap:full.perMap.map(r=>({...r,scheduled:allowed.filter(a=>a.mapIndex===r.mapIndex).length}))};
}
export function writePrivateHandoff(records,cohorts,c,write){
 const byId=new Map(records.map(r=>[r.candidateId,r]));
 const ordered=cohorts.selected.map(s=>byId.get(s.candidateId)).sort((a,b)=>{
  const x=sha256(c.neutralSalt+'\0'+a.fingerprints.variant),y=sha256(c.neutralSalt+'\0'+b.fingerprints.variant);
  return x<y?-1:x>y?1:0;
 });
 const cases=ordered.map((r,i)=>({id:'C-'+String(i+1).padStart(2,'0'),candidateId:r.candidateId,
  definition:r.definition,assetPlacements:r.assetPlacements,fingerprints:r.fingerprints,editorialStatus:'pending'}));
 write('handoff/private-cases.json',json({format:'s04-c-editorial-handoff-1',cases}));
 write('handoff/overview.md','# Kandidaten zur Redaktion\n\nRedaktion und Einzeltextprüfung nach Issue #21 stehen aus. Keine externe Freigabe.\n\n| Kennung | Stand |\n| --- | --- |\n'+cases.map(r=>'| '+r.id+' | Redaktion ausstehend |\n').join(''));
 // Selection effects remain in the private audit, never the neutral overview.
 const good=records.filter(r=>r.preferences&&Object.values(r.preferences).every(Boolean));
 write('C/control-reservations.json',json(cohorts.selected.filter(s=>s.group==='control').map(s=>{
  const r=byId.get(s.candidateId);
  return {...s,preferredVariantsOnReservedMap:good.filter(g=>g.fingerprints.mapStructure===r.fingerprints.mapStructure).map(g=>g.candidateId)};
 })));
}
export const deterministicFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?
 deterministicFiles(path.join(dir,e.name)).map(p=>e.name+'/'+p):[e.name]).filter(p=>!['observations.json','inventory.json'].includes(p)).sort();
export function writeInventory(out,write){
 write('inventory.json',json(deterministicFiles(out).map(ref=>({path:ref,bytes:fs.statSync(path.join(out,ref)).size,sha256:sha256(fs.readFileSync(path.join(out,ref)))}))));
}
