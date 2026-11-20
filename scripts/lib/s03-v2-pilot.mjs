// Re-evaluates an immutable materialized source; zero generator/search calls.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ROOT,contentHash,buildPlaytest} from './b2-playtest.mjs';
import {programState} from './map-batch.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {loadV2Sources} from './s03-v2-source.mjs';
import {planDiagnoses} from './s03-v2-plan.mjs';
import {clueSubsets,diagnosePuzzle} from './b2-deduction.mjs';
import {buildProgressProfile} from './b2-markable-progress.mjs';
import {qualitySignals,lateRejection,selectSeries} from './s03-quality.mjs';
import {verifyCandidates} from '../verify-puzzle-experiment.mjs';
import {legacyVerificationContext} from './candidate-origin-contract.mjs';

export const RUN_V2='docs/verification/S03-v2/run';
export const CONTRACT_V2='docs/verification/S03-v2/contract.md';
export const CONFIG_V2='scripts/config/s03-v2.json';
const read=ref=>fs.readFileSync(path.join(ROOT,ref));
export const configV2=JSON.parse(read(CONFIG_V2));
const json=x=>JSON.stringify(x,null,2)+'\n';
const jsonl=rows=>rows.map(r=>JSON.stringify(r)+'\n').join('');
const add=(counts,key)=>{counts[key]=(counts[key]??0)+1;};

export function runV2(out){
 const begin=performance.now(),cpuStart=process.cpuUsage(),program=programState();
 const source=loadV2Sources(configV2),preparationMs=performance.now()-begin;
 const inputFiles=[CONFIG_V2,CONTRACT_V2,'scripts/lib/clue-text.mjs','scripts/lib/s03-quality.mjs',
  'assets/catalog/library.json','puzzles/manifest.json'].map(ref=>({path:ref,sha256:sha256(read(ref))}));
 const settings={protocol:configV2.protocol,config:configV2,program,inputFiles,sourceFiles:source.files,
  sourceExperimentId:source.manifest.experimentId,sourceSnapshot:configV2.sourceSnapshot,
  generationCalls:0,candidateBasis:'exact-materialized-v1-80'};
 const experimentId='gk-s03-v2-run-sha256:'+sha256(canonicalJson(settings));
 fs.mkdirSync(out);
 const write=(ref,bytes)=>{
  fs.mkdirSync(path.dirname(path.join(out,ref)),{recursive:true});
  fs.writeFileSync(path.join(out,ref),bytes,{flag:'wx'});
 };
 const manifest={...settings,experimentId,puzzleExperimentFormatVersion:2,input:source.manifest.input};
 write('manifest.json',json(manifest));
 const records=source.candidates.map(c=>({...c,puzzleExperimentFormatVersion:2,experimentId,
  attemptId:experimentId+'/M'+String(c.mapIndex).padStart(3,'0'),
  candidateId:experimentId+'/M'+String(c.mapIndex).padStart(3,'0')+'/'+c.fingerprints.variant,
  testName:c.source.testName.replace('B2-S03-','B2-S03-V2-')}));
 // Plan is persisted before any local diagnosis. It consumes no old outcomes.
 const plan=planDiagnoses(records,configV2);
 write('plan.json',json(plan));write('source-candidates.jsonl',jsonl(records));
 const sourceVerification=verifyCandidates(path.join(out,'source-candidates.jsonl'),legacyVerificationContext(records));
 const byId=new Map(records.map(c=>[c.candidateId,c])),diagnosed=new Set(),costs=[];
 const perMap=plan.perMap.map(p=>({...p,raw:records.filter(c=>c.mapIndex===p.mapIndex).length,
  diagnoses:0,diagnosisStates:0,finalists:0,v1Diagnoses:source.priorDiagnosisCounts[p.mapIndex]}));
 let statesUsed=0;
 write('diagnoses.jsonl','');
 for(const item of plan.scheduled){
  const record=byId.get(item.candidateId),start=performance.now();
  const reservation=clueSubsets(record.definition.logic.clues.length).length;
  assert.ok(reservation<=configV2.maxStatesPerDiagnosis&&statesUsed+reservation<=configV2.maxDiagnosisStates,
   'Fixed diagnosis state budget exceeded');
  assert.ok(diagnosed.size<configV2.maxDiagnoses);
  const result=diagnosePuzzle(record.definition.logic);
  assert.equal(result.scenarios.length,reservation);statesUsed+=reservation;diagnosed.add(record.candidateId);
  const prefix='evidence/'+record.testName,definitionRef=prefix+'.definition.json',statesRef=prefix+'.states.jsonl';
  const definitionBytes=json(record.definition),states=result.scenarios.map((s,i)=>({...s,source:{path:RUN_V2+'/'+statesRef,line:i+1}}));
  const stateBytes=jsonl(states);
  write(definitionRef,definitionBytes);write(statesRef,stateBytes);
  record.diagnosis={definition:{path:RUN_V2+'/'+definitionRef,sha256:sha256(definitionBytes)},
   states:{path:RUN_V2+'/'+statesRef,sha256:sha256(stateBytes),count:states.length},validation:result.validation};
  const profile=buildProgressProfile({id:record.testName,label:record.testName,puzzleId:record.testName,
   logic:record.definition.logic,givens:[],states,
   inputs:[record.diagnosis.definition,{path:record.diagnosis.states.path,sha256:record.diagnosis.states.sha256}]});
  record.signals=qualitySignals(profile);record.reason=lateRejection(record.signals,configV2.quality);
  record.decision=record.reason?'rejected':'finalist';record.reasonCategory=record.reason?'experimental-quality':null;
  const timing={candidateId:record.candidateId,mapIndex:record.mapIndex,round:item.round,
   diagnosisMs:performance.now()-start,states:reservation};costs.push(timing);
  const stats=perMap[record.mapIndex];stats.diagnoses++;stats.diagnosisStates+=reservation;
  if(!record.reason)stats.finalists++;
  fs.appendFileSync(path.join(out,'diagnoses.jsonl'),JSON.stringify({position:item.position,round:item.round,
   candidateId:record.candidateId,sourceCandidateId:record.source.candidateId,mapIndex:record.mapIndex,
   decision:record.decision,reason:record.reason,states:reservation})+'\n');
  process.stderr.write(`S03 v2 round ${item.round} M${record.mapIndex}: ${record.reason??'finalist'} (${diagnosed.size}/${configV2.maxDiagnoses})\n`);
 }
 const early=new Map(plan.earlyRejected.map(r=>[r.candidateId,r.reason]));
 for(const record of records)if(!diagnosed.has(record.candidateId)){
  record.reason=early.get(record.candidateId)??'DIAGNOSIS_BUDGET_EXHAUSTED';
  record.decision=early.has(record.candidateId)?'rejected':'undiagnosed';
  record.reasonCategory=early.has(record.candidateId)?'experimental-quality':'technical-budget';
 }
 write('raw.jsonl',jsonl(records));
 const finalists=records.filter(c=>c.decision==='finalist');write('finalists.jsonl',jsonl(finalists));
 const verification=verifyCandidates(path.join(out,'finalists.jsonl'),legacyVerificationContext(finalists));
 const series=selectSeries(finalists,configV2),selected=series.selected;
 write('candidates.jsonl',jsonl(selected));
 const registry={registryVersion:1,stockId:'B2-S03-V2',source:RUN_V2,experimentId,
  manifestSha256:sha256(json(manifest)),candidatesSha256:sha256(jsonl(selected)),
  entries:selected.map(r=>({testName:r.testName,candidateId:r.candidateId,recordSha256:sha256(JSON.stringify(r)),
   fingerprints:r.fingerprints,effectKey:r.effectKey,contentSha256:contentHash(r),attemptId:r.attemptId}))};
 write('registry.json',json(registry));
 const publicFiles=buildPlaytest({registry,manifest,rows:selected});
 const exportFiles=[...publicFiles].map(([name,bytes])=>({name,sha256:sha256(bytes)}));
 write('public-export.json',json({formatter:inputFiles.find(f=>f.path==='scripts/lib/clue-text.mjs'),files:exportFiles}));
 const rejections={};for(const r of records)if(r.reason)add(rejections,r.reason);
 const v1Selected=new Set(source.summary.selected.map(c=>c.candidateId));
 const summary={experimentId,status:'completed',generationCalls:0,sourceVerification,verification,
  cardsExamined:configV2.maxTargets,rawCandidates:records.length,eligibleCandidates:plan.eligibleCount,
  diagnoses:diagnosed.size,diagnosisStates:statesUsed,locallyCoveredMaps:perMap.filter(m=>m.diagnoses).length,
  perMap,rejections,undiagnosed:plan.undiagnosed.map(p=>p.candidateId),finalists:finalists.length,
  selected:selected.map(r=>({testName:r.testName,candidateId:r.candidateId,sourceCandidateId:r.source.candidateId,
   clueCount:r.definition.logic.clues.length,signals:r.signals})),
  diversity:{decisions:series.decisions,features:series.features,distinctSignatures:series.distinctSignatures,
   distinctMaps:new Set(selected.map(c=>c.mapIndex)).size},notSelected:series.notSelected,
  comparison:{v1:{diagnoses:source.summary.diagnoses,diagnosisStates:source.summary.diagnosisStates,
   locallyCoveredMaps:source.priorDiagnosisCounts.filter(n=>n).length,finalists:source.summary.finalists,
   selected:source.summary.selected.length,undiagnosed:source.summary.rejections.DIAGNOSIS_BUDGET_EXHAUSTED},
   sharedSelectedWithV1:selected.filter(c=>v1Selected.has(c.source.candidateId)).map(c=>c.source.candidateId),
   sourceBasisIdentical:true,criteriaUnchanged:true},
  unmetGoals:[...(selected.length<configV2.maxSelected?[`Only ${selected.length} of up to ten selected`]:[]),
   'Human enjoyment, difficulty and experienced variety remain untested.']};
 for(const file of [...source.files,...inputFiles])assert.equal(sha256(read(file.path)),file.sha256,'Input changed during v2: '+file.path);
 write('summary.json',json(summary));
 write('report.md',renderV2Report(summary));
 write('observations.json',json({totalMs:performance.now()-begin,preparationMs,
  diagnosisMs:costs.reduce((n,c)=>n+c.diagnosisMs,0),peakRssKiB:process.resourceUsage().maxRSS,
  cpuUsage:process.cpuUsage(cpuStart),node:process.version,costs}));
 return summary;
}

export function renderV2Report(s){
 const lines=['# S03-v2 – reproduzierbarer Pilotbericht','',
  '**Enthält Diagnoseinformationen; nicht als lösungsfreie Spieltestübersicht verwenden.**','',
  `Experiment: \`${s.experimentId}\`. Status: ${s.status}.`, '',
  `${s.cardsExamined} Karten; dieselben ${s.rawCandidates} Rohkandidaten wie v1; ${s.generationCalls} neue Generierungsaufrufe.`,
  `${s.diagnoses} Diagnosen, ${s.diagnosisStates} Teilmengenzustände, ${s.locallyCoveredMaps} lokal untersuchte Karten.`,
  `${s.finalists} Finalisten; ${s.selected.length} ausgewählte Rätsel auf ${s.diversity.distinctMaps} Karten mit ${s.diversity.distinctSignatures} Verlaufssignaturen.`, '',
  '| Karte | Rohkandidaten | Geeignet vor Diagnose | v1-Diagnosen | v2-Diagnosen | Zustände | Finalisten |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const m of s.perMap)lines.push(`| ${m.mapIndex} | ${m.raw} | ${m.eligible} | ${m.v1Diagnoses} | ${m.diagnoses} | ${m.diagnosisStates} | ${m.finalists} |`);
 lines.push('', 'Ablehnungen/unbewertete Kandidaten: `'+JSON.stringify(s.rejections)+'`.', '',
  'Unbewertete Kandidaten sind nicht als schlecht nachgewiesen. Plan und vollständige IDs: plan.json und summary.json. Alle 80 Dispositionen: raw.jsonl. Messzeiten und Ressourcen: observations.json.', '',
  '## Auswahl','', '| Kennung | Hinweise |', '| --- | ---: |');
 for(const r of s.selected)lines.push(`| ${r.testName} | ${r.clueCount} |`);
 lines.push('',`v1: ${s.comparison.v1.locallyCoveredMaps} lokal untersuchte Karten, ${s.comparison.v1.diagnoses} Diagnosen, ${s.comparison.v1.finalists} Finalisten, ${s.comparison.v1.selected} ausgewählt.`,
  `v2: ${s.locallyCoveredMaps} Karten, ${s.diagnoses} Diagnosen, ${s.finalists} Finalisten, ${s.selected.length} ausgewählt.`, '',
  'Die Kandidatenbasis und Qualitätskriterien sind identisch. Der vorab gespeicherte Round-robin-Plan ersetzt die frühere fortlaufende Budgetvergabe. Neue v2-Quellreferenzen und aktuelle Exporttexte ändern keine logische Variante.', '',
  '## Nicht nachgewiesen','',...s.unmetGoals.map(t=>'- '+t),'',
  'Die Auswahl verwendet experimentelle Signale. Minimale bekannte Zeugen, Zertifikatsnachfolger und gekoppelte Endpunkte beweisen keine menschliche Schwierigkeit, notwendige Reihenfolge oder Freude. Fehlende Teilmengen bleiben unbekannt. Keine Lockerung, zusätzliche Kandidatensuche, automatische Veröffentlichung oder Betriebsumstellung.');
 return lines.join('\n')+'\n';
}
