// Experimental projections of existing evidence; never a difficulty scale.
import {canonicalJson} from './content-hash.mjs';

export function earlyRejection(candidate,quality){
 const n=candidate.definition.logic.clues.length;
 if(n<quality.minClues||n>quality.maxClues)return 'CLUE_COUNT';
 if(candidate.properties.individualExactness.some(c=>c.hours.length>quality.maxSingleFixed))return 'SINGLE_CLUE_DOMINANCE';
 return null;
}

export function qualitySignals(profile){
 const e=profile.evidence,p=profile.intermediateProgress;
 const full=p.states.find(s=>s.clueIds.length===e.coverage.clueIds.length);
 const entries=p.states.filter(s=>s.clueIds.length>=1&&s.clueIds.length<=2&&s.local.fields.length);
 const fullDomains=e.localCoverage.full.local.domains;
 const open=fullDomains.flatMap((d,i)=>d.length>1?[{hour:i+1,size:d.length}]:[]);
 const witnesses=e.clueWitnesses.local;
 const minima=witnesses.map(w=>({hour:w.hour,count:w.minimumClueCount,known:w.minimumKnownClueCount,status:w.cardinalityStatus}));
 const singles=p.states.filter(s=>s.clueIds.length===1);
 const directHours=[...new Set(singles.flatMap(s=>s.local.additionalFixedHours))].sort((a,b)=>a-b);
 const marks=full.local.fields.flatMap(f=>f.witnesses);
 const reused=marks.filter(w=>w.removed.length&&w.reusedBy.length);
 const chain=Math.max(0,...marks.map(w=>new Set(w.fixedFollowUps.map(f=>f.hour)).size));
 const milestones=e.milestones;
 const roots=milestones.items.filter(m=>!milestones.dependencies.some(d=>d.to===m.id));
 const mixedCombinationHours=witnesses.filter(w=>w.minimumClueCount>=2&&w.witnesses.some(v=>
  new Set(v.certificate.mechanisms.map(m=>m.type)).size>=2)).map(w=>w.hour);
 const exclusionEntries=entries.filter(s=>!s.local.additionalFixedHours.length&&s.local.fields.some(f=>f.marks.cross.length));
 // Mechanism participation is recorded trace evidence; it need not be necessary.
 const countReuse=marks.some(w=>w.reachableClueIds.length>=2&&w.rule==='count-bounds'&&w.reusedBy.length);
 const signature=canonicalJson({minima,directHours,completionRules:milestones.items.map(m=>({hour:m.hour,rule:m.certificate.rule})),open});
 const features=[...new Set([
  ...e.clueWitnesses.mechanisms.map(m=>'mechanism:'+m.mechanism),
  ...entries.flatMap(s=>s.local.fields.map(f=>'entry-hour:'+f.hour)),
  ...(exclusionEntries.length?['exclusion-before-subset-fixation']:[]),
  ...(mixedCombinationHours.length?['mixed-combination']:[]),
  ...(reused.length?['certificate-reuse']:[]),
  ...(countReuse?['count-certificate-reuse']:[]),
  'certificate-root-count:'+roots.length,'chain-follow-ups:'+chain,
  'open-hours:'+open.length,
  ...minima.map(w=>'minimum:'+w.hour+':'+(w.count??'unknown'))
 ])].sort();
 return {signature,features,entryStates:entries.map(s=>s.state),exclusionEntryStates:exclusionEntries.map(s=>s.state),
  minimumCluesByHour:minima,directHours,mixedCombinationHours,reusedFieldSteps:reused.length,
  maxFixedCertificateFollowUps:chain,certificateRoots:roots.map(m=>m.hour),countReuse,
  openHours:open,localCouplings:e.representation.localCouplings.length,
  exactCouplings:e.representation.exactCouplings.length,missingSubsetCount:e.coverage.missingStates.length,
  scope:'Known local certificates and exact projections, not human solving order, necessary thought depth or enjoyment.'};
}

export function lateRejection(signals,quality){
 if(!signals.entryStates.length)return 'NO_MARKABLE_ENTRY';
 if(signals.openHours.length>quality.maxOpenHours||signals.openHours.some(h=>h.size>quality.maxOpenDomain))return 'LOCAL_REMAINDER';
 if(signals.localCouplings>quality.maxCouplings)return 'COUPLED_REMAINDER';
 return null;
}

export function selectSeries(finalists,config){
 const remaining=[...finalists].sort((a,b)=>a.candidateId<b.candidateId?-1:a.candidateId>b.candidateId?1:0);
 const selected=[],covered=new Set(),maps=new Set(),signatures=new Map(),decisions=[];
 while(selected.length<config.maxSelected){
  const eligible=remaining.filter(c=>!maps.has(c.fingerprints.mapStructure)&&
   (signatures.get(c.signals.signature)??0)<config.maxPerSignature);
  if(!eligible.length)break;
  const novelty=c=>c.signals.features.filter(f=>!covered.has(f));
  const best=eligible.reduce((a,b)=>novelty(b).length>novelty(a).length?b:a);
  decisions.push({candidateId:best.candidateId,newFeatures:novelty(best)});
  selected.push(best);maps.add(best.fingerprints.mapStructure);
  signatures.set(best.signals.signature,(signatures.get(best.signals.signature)??0)+1);
  best.signals.features.forEach(f=>covered.add(f));remaining.splice(remaining.indexOf(best),1);
 }
 return {selected,decisions,features:[...covered].sort(),distinctSignatures:signatures.size,
  notSelected:remaining.map(c=>({candidateId:c.candidateId,reason:'SERIES_NOT_SELECTED',
   constraint:maps.has(c.fingerprints.mapStructure)?'MAP_ALREADY_SELECTED':
    (signatures.get(c.signals.signature)??0)>=config.maxPerSignature?'SIGNATURE_CAP':'SELECTION_CAP'}))};
}
