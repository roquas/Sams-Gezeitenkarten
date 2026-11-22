import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {config,historicalInventory} from '../../scripts/lib/s04-c-pilot.mjs';
import {preferences,preferred,selectCohorts} from '../../scripts/lib/s04-c-selection.mjs';
import {planDiagnoses} from '../../scripts/lib/s03-v2-plan.mjs';
import {earlyRejection} from '../../scripts/lib/s03-quality.mjs';
import {validateSearchBudgets} from '../../scripts/lib/puzzle-candidate-search.mjs';

const signals={entryStates:['H1'],openHours:[{hour:5,size:3}],localCouplings:1,
 mixedCombinationHours:[],reusedFieldSteps:1,signature:'a'};

test('preferences accept a bounded unresolved route and distinguish missing interaction from mathematical redundancy',()=>{
 assert.deepEqual(preferences(signals,config.quality),{P1:true,P2:true,P3:true});
 assert.ok(preferred(preferences(signals,config.quality)));
 const geometric=preferences({...signals,reusedFieldSteps:0},config.quality);
 assert.deepEqual(geometric,{P1:true,P2:true,P3:false});
 assert.equal(preferences({...signals,entryStates:[]},config.quality).P1,false);
 assert.equal(preferences({...signals,entryStates:[]},config.quality).P2,true);
 assert.equal(preferences({...signals,openHours:[{hour:5,size:4}]},config.quality).P2,false);
 assert.equal(preferences({...signals,localCouplings:3},config.quality).P2,false);
 assert.equal(preferences({...signals,reusedFieldSteps:0,mixedCombinationHours:[4]},config.quality).P3,true);
});

const record=(id,map,flags)=>({candidateId:id,fingerprints:{variant:id,mapStructure:map},
 preferences:flags,signals:{...signals,signature:map}});
const yes={P1:true,P2:true,P3:true},no={...yes,P3:false};

test('controls come from the independently defined nonpreferred frame, before preferred map reservation',()=>{
 const control=record('counterexample','map1',no),sibling=record('preferred-same-map','map1',yes),
  other=record('preferred-other-map','map2',yes),unknown={candidateId:'unknown'};
 const rows=[control,sibling,other,unknown],before=structuredClone(rows);
 const result=selectCohorts(rows,{...config.selection,preferred:3,controls:1});
 assert.deepEqual(result.controlFrame,['counterexample']);
 assert.deepEqual(result.selected,[{candidateId:'counterexample',group:'control'},{candidateId:'preferred-other-map',group:'preferred'}]);
 assert.deepEqual(result.decisions[0].failedPreferences,['P3']);
 assert.ok(result.notSelected.some(r=>r.candidateId===sibling.candidateId));
 assert.deepEqual(result,selectCohorts([...rows].reverse(),{...config.selection,preferred:3,controls:1}));
 assert.deepEqual(rows,before);
});

test('cohort sizes do not pad missing controls and signature cap spans both groups',()=>{
 const rows=[record('a','1',no),record('b','2',yes),record('c','3',yes)];
 rows.forEach(r=>r.signals.signature='same');
 assert.equal(selectCohorts(rows,config.selection).selected.length,2);
 assert.equal(selectCohorts(rows.slice(1),config.selection).selected.filter(r=>r.group==='control').length,0);
});

test('both arms preserve all S03 early exclusions and the identical round-robin diagnosis capacity',()=>{
 const row=(i,n=3,hours=[])=>({candidateId:'c'+i,mapIndex:i%2,source:{ordinal:Math.floor(i/2)+1,line:i+1,candidateId:'c'+i},
 definition:{logic:{clues:Array(n).fill({})}},properties:{individualExactness:[{hours}]}});
 const rows=[row(0),row(1),row(2),row(3),row(4,2),row(5,4,[1,2,3,4])];
 assert.equal(earlyRejection(rows[4],config.quality),'CLUE_COUNT');
 assert.equal(earlyRejection(rows[5],config.quality),'SINGLE_CLUE_DOMINANCE');
 const plan=planDiagnoses(rows,{...config,maxTargets:12,maxDiagnoses:3});
 assert.deepEqual(plan.scheduled.map(r=>r.candidateId),['c0','c1','c2']);
 assert.deepEqual(plan.undiagnosed.map(r=>r.candidateId),['c3']);
 rows.forEach(r=>r.signals={madeUpAfterPlanning:true});
 assert.deepEqual(plan,planDiagnoses(rows,{...config,maxTargets:12,maxDiagnoses:3}));
});

test('fixed small protocol binds normalization, S0 policy, two arms and original budget ceilings',()=>{
 assert.equal(config.normalization,'count-distance-extremes-1');
 assert.equal(config.cluePolicy,'s03-no-multihour-zero-1');
 assert.deepEqual(config.arms,[{id:'A',maxRestarts:4},{id:'B',maxRestarts:8}]);
 for(const arm of config.arms)validateSearchBudgets({...config.search,maxRestarts:arm.maxRestarts});
 const s03=JSON.parse(fs.readFileSync('scripts/config/s03-v1.json'));
 assert.deepEqual(config.quality,s03.quality);
 assert.deepEqual(config.search,Object.fromEntries(Object.entries(s03.search).filter(([k])=>k!=='maxRestarts')));
 assert.equal(config.batch.targetCount,6);assert.equal(config.batch.maxAttempts,12);
 assert.equal(config.batch.config.maxMapAttempts,1);assert.equal(config.maxDiagnoses,12);
});

test('historical inventory excludes old maps and variants without editing or trusting changed bytes',()=>{
 const inventory=historicalInventory();
 assert.ok(inventory.maps.size>=20&&inventory.variants.size>=96);
 for(const f of inventory.files){
  assert.deepEqual(fs.readFileSync(f.path),execFileSync('git',['show',config.baseCommit+':'+f.path],{maxBuffer:64*1024*1024}));
 }
});
