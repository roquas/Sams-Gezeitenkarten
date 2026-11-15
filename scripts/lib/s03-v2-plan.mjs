// No diagnosis or generation here: the complete schedule precedes all results.
import assert from 'node:assert/strict';
import {earlyRejection} from './s03-quality.mjs';

export function planDiagnoses(candidates,config){
 assert.ok(Number.isSafeInteger(config.maxDiagnoses)&&config.maxDiagnoses>=0);
 assert.ok(Number.isSafeInteger(config.maxTargets)&&config.maxTargets>=1);
 assert.equal(new Set(candidates.map(c=>c.candidateId)).size,candidates.length,'Duplicate candidate identity');
 const groups=Array.from({length:config.maxTargets},()=>[]),earlyRejected=[];
 for(const c of candidates){
  assert.ok(Number.isSafeInteger(c.mapIndex)&&c.mapIndex>=0&&c.mapIndex<config.maxTargets,'Map outside source range');
  assert.ok(Number.isSafeInteger(c.source.ordinal)&&c.source.ordinal>=1,'Missing source ordinal');
  const reason=earlyRejection(c,config.quality);
  if(reason)earlyRejected.push({candidateId:c.candidateId,reason});else groups[c.mapIndex].push(c);
 }
 for(const group of groups)group.sort((a,b)=>a.source.ordinal-b.source.ordinal||a.source.line-b.source.line||
  (a.candidateId<b.candidateId?-1:a.candidateId>b.candidateId?1:0));
 const order=[];
 for(let round=0;round<Math.max(0,...groups.map(g=>g.length));round++)for(let mapIndex=0;mapIndex<groups.length;mapIndex++){
  const c=groups[mapIndex][round];if(!c)continue;
  order.push({position:order.length+1,round:round+1,mapIndex,candidateId:c.candidateId,
   sourceCandidateId:c.source.candidateId,sourceOrdinal:c.source.ordinal});
 }
 return {policy:'round-robin-original-ordinal-1',earlyRejected,eligibleCount:order.length,
  scheduled:order.slice(0,config.maxDiagnoses),undiagnosed:order.slice(config.maxDiagnoses),
  perMap:groups.map((g,mapIndex)=>({mapIndex,eligible:g.length,
   scheduled:order.slice(0,config.maxDiagnoses).filter(c=>c.mapIndex===mapIndex).length}))};
}
