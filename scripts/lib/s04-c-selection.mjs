// Experimental predicates over existing certificates; no score or difficulty.
import {sha256} from './content-hash.mjs';
import {lateRejection} from './s03-quality.mjs';

export function preferences(signals,quality){
 return {
  P1:signals.entryStates.length>0,
  P2:!['LOCAL_REMAINDER','COUPLED_REMAINDER'].includes(lateRejection({...signals,entryStates:['control']},quality)),
  P3:signals.mixedCombinationHours.length>0||signals.reusedFieldSteps>0
 };
}
export const preferred=flags=>Object.values(flags).every(Boolean);

export function selectCohorts(records,config){
 const order=records.filter(r=>r.preferences).map(r=>({record:r,
  key:sha256(config.salt+'\0'+r.fingerprints.variant)}))
  .sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0).map(r=>r.record);
 const maps=new Set(),signatures=new Map(),selected=[],decisions=[];
 function take(rows,limit,group){
  let count=0;
  for(const r of rows){
   if(count===limit)break;
   if(maps.has(r.fingerprints.mapStructure)||(signatures.get(r.signals.signature)??0)>=config.maxPerSignature)continue;
   selected.push({candidateId:r.candidateId,group});count++;maps.add(r.fingerprints.mapStructure);
   signatures.set(r.signals.signature,(signatures.get(r.signals.signature)??0)+1);
   decisions.push({candidateId:r.candidateId,group,failedPreferences:Object.entries(r.preferences).filter(([,v])=>!v).map(([k])=>k)});
  }
 }
 const controlFrame=order.filter(r=>!preferred(r.preferences));
 take(controlFrame,config.controls,'control');
 take(order.filter(r=>preferred(r.preferences)),config.preferred,'preferred');
 const ids=new Set(selected.map(r=>r.candidateId));
 return {controlFrame:controlFrame.map(r=>r.candidateId),selected,decisions,
  notSelected:order.filter(r=>!ids.has(r.candidateId)).map(r=>({candidateId:r.candidateId,reason:'VALID_NOT_SELECTED'}))};
}
