// Bounded offline orchestration. All game and deduction semantics are reused.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ROOT,readPlaytestSource,validatePlaytestBindings,contentHash,buildPlaytest} from './b2-playtest.mjs';
import {programState} from './map-batch.mjs';
import {sha256,canonicalJson} from './content-hash.mjs';
import {loadReleasedAssetCatalog} from './released-asset-catalog.mjs';
import {validateB2Places,generateTrueClues} from './puzzle-clues.mjs';
import {randomStream} from '../../src/generation/random.mjs';
import {createRouteWorkspace} from './puzzle-route-solver.mjs';
import {searchPuzzleCandidates} from './puzzle-candidate-search.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {projectRoutes,diagnosePuzzle} from './b2-deduction.mjs';
import {buildProgressProfile} from './b2-markable-progress.mjs';
import {earlyRejection,qualitySignals,lateRejection,selectSeries} from './s03-quality.mjs';
import {verifyCandidates} from '../verify-puzzle-experiment.mjs';
import {legacyVerificationContext} from './candidate-origin-contract.mjs';

export const CONFIG='scripts/config/s03-v1.json';
export const CONTRACT='docs/verification/S03/contract.md';
export const RUN='docs/verification/S03/run';
const json=x=>JSON.stringify(x,null,2)+'\n';
const jsonl=rows=>rows.map(r=>JSON.stringify(r)+'\n').join('');
const read=ref=>fs.readFileSync(path.join(ROOT,ref));
export const config=JSON.parse(read(CONFIG));
const hashInput=ref=>({path:ref,sha256:sha256(read(ref))});

export function readS03Inputs(){
 const source=readPlaytestSource('S02'),bindings=validatePlaytestBindings(source);
 const batch='docs/verification/B2-S02/source-batch/';
 for(const input of source.manifest.input.sourceFiles)
  assert.equal(sha256(read(batch+input.file)),input.sha256,'S03 source batch changed');
 const maps=read(batch+'accepted.jsonl').toString().trim().split('\n').map(JSON.parse);
 const provenance=source.manifest.input.b1Manifest.input.batchManifest.provenance;
 const released=loadReleasedAssetCatalog({repositoryRoot:ROOT,releaseId:provenance.releaseId,backgroundId:provenance.backgroundId});
 // archiveCommit names the checkout that read the immutable archive, rather
 // than release content. S03 intentionally reads it at its new program commit.
 const {archiveCommit:oldArchive,...expectedRelease}=provenance;
 const {archiveCommit:newArchive,...actualRelease}=released.provenance;
 assert.deepEqual(actualRelease,expectedRelease,'S03 catalog provenance changed');
 const targets=maps.sort((a,b)=>a.index-b.index).slice(0,config.maxTargets).map(map=>{
  const entry=source.registry.entries.filter(e=>e.fingerprints.mapStructure===map.mapFingerprint)
   .sort((a,b)=>a.testName<b.testName?-1:1)[0];
  assert.ok(entry,'Missing registered start for map '+map.index);
  const row=bindings.get(entry.fingerprints.variant);
  assert.deepEqual(row.definition.logic.map,map.generation.map);
  validateB2Places(map.generation.map,row.assetPlacements,released.catalog);
  return {mapIndex:map.index,sourceName:entry.testName,logic:{...row.definition.logic,clues:[]},
   assetPlacements:row.assetPlacements,topology:{deadEnds:map.generation.analysis.deadEnds,
    articulationCells:map.generation.analysis.articulationCells,regions:map.generation.analysis.regions}};
 });
 assert.equal(targets.length,20,'Frozen v1 requires all twenty source maps');
 const refs=[CONFIG,CONTRACT,'assets/catalog/library.json','puzzles/manifest.json','scripts/config/b2-playtest-s02.json',
  ...['manifest.json','candidates.jsonl'].map(f=>source.registry.source+'/'+f),
  ...source.manifest.input.sourceFiles.map(f=>batch+f.file)];
 return {targets,source,inputFiles:refs.map(hashInput)};
}

export function runS03(out){
 const program=programState(),{targets,source,inputFiles}=readS03Inputs();
 const settings={protocol:config.protocol,config,program,inputFiles,
  sourceExperimentId:source.manifest.experimentId};
 const experimentId='gk-s03-run-sha256:'+sha256(canonicalJson(settings));
 // Exclusive reservation; neither replay nor a second call can overwrite data.
 fs.mkdirSync(out);
 const write=(ref,bytes)=>{
  fs.mkdirSync(path.dirname(path.join(out,ref)),{recursive:true});
  fs.writeFileSync(path.join(out,ref),bytes,{flag:'wx'});
 };
 const append=(ref,value)=>fs.appendFileSync(path.join(out,ref),JSON.stringify(value)+'\n');
 const begin=performance.now(),costs=[],finalists=[],raw=[],attempts=[];
 let diagnoses=0,diagnosisStates=0;
 write('manifest.json',json({...settings,experimentId,puzzleExperimentFormatVersion:2,input:source.manifest.input}));
 for(const file of ['raw.jsonl','attempts.jsonl'])write(file,'');
 for(const target of targets){
  const started=performance.now(),{logic,mapIndex}=target;
  const attemptId=experimentId+'/M'+String(mapIndex).padStart(3,'0');
  const attempt={attemptId,mapIndex,sourceName:target.sourceName,seed:config.seed+mapIndex,topology:target.topology};
  const workspace=createRouteWorkspace(logic,{maxNodes:config.maxNodes});
  attempt.enumeration={completed:workspace.completed,nodes:workspace.nodesVisited??null,routeCount:workspace.routeCount??null};
  if(!workspace.completed){attempt.reason='ROUTE_ENUMERATION_BUDGET_EXHAUSTED';}
  else{
   // Independent existing solver also supplies the target index and exact
   // baseline projection; no historical target route is consumed.
   const routes=solvePuzzle(logic,{maxNodes:config.maxNodes,metrics:false}).solutions;
   assert.equal(routes.length,workspace.routeCount);
   const baseline=projectRoutes(routes);
   attempt.baseline={domainSizes:baseline.domains.map(d=>d.length),transitionSizes:baseline.transitions.map(d=>d.length),
    fixedHours:baseline.domains.flatMap((d,h)=>h&&d.length===1?[h]:[])};
   if(routes.length<config.quality.minRoutes)attempt.reason='LOW_ROUTE_VARIATION';
   else if(attempt.baseline.fixedHours.length>config.quality.maxBaselineFixed)attempt.reason='GEOMETRY_PREDETERMINATION';
   else{
    const routeIndex=randomStream(config.seed,'s03-target-v1/'+mapIndex).integer(routes.length),targetRoute=routes[routeIndex];
    attempt.routeIndex=routeIndex;
    const pool=generateTrueClues(logic,targetRoute,{maxClueParameters:config.maxClueParameters,policy:config.cluePolicy});
    attempt.pool={size:pool.clues.length,parametersExamined:pool.parametersExamined,completed:pool.completed,
     byType:pool.byType,byPresentationForm:pool.byPresentationForm};
    if(!pool.completed)attempt.reason='CLUE_PARAMETER_BUDGET_EXHAUSTED';
    else{
     let ordinal=0;
     // Frozen S03-v1 protocol: new normalization belongs to future runs only.
     const result=searchPuzzleCandidates({logic,targetRoute,cluePool:pool,workspace,seed:attempt.seed,budgets:config.search,normalization:'none',
      evaluateCandidate(candidate){
       const name=`B2-S03-M${String(mapIndex).padStart(3,'0')}-${logic.start}-R${String(routeIndex).padStart(2,'0')}-V${String(++ordinal).padStart(2,'0')}`;
       const record={puzzleExperimentFormatVersion:2,experimentId,attemptId,
        candidateId:attemptId+'/'+candidate.fingerprints.variant,testName:name,mapIndex,
        routeIndex,seed:attempt.seed,assetPlacements:target.assetPlacements,...candidate};
       let reason=earlyRejection(candidate,config.quality);
       if(!reason&&diagnoses===config.maxDiagnoses)reason='DIAGNOSIS_BUDGET_EXHAUSTED';
       if(!reason){
        diagnoses++;const start=performance.now();
        // No solution or target route is passed to the local diagnosis.
        const diagnosis=diagnosePuzzle(candidate.definition.logic);
        diagnosisStates+=diagnosis.scenarios.length;
        assert.ok(diagnosis.scenarios.length<=65);
        const prefix='evidence/'+name,definitionRef=prefix+'.definition.json',statesRef=prefix+'.states.jsonl';
        const definitionBytes=json(candidate.definition);
        const states=diagnosis.scenarios.map((s,i)=>({...s,source:{path:RUN+'/'+statesRef,line:i+1}}));
        const statesBytes=jsonl(states);
        write(definitionRef,definitionBytes);write(statesRef,statesBytes);
        record.diagnosis={definition:{path:RUN+'/'+definitionRef,sha256:sha256(definitionBytes)},
         states:{path:RUN+'/'+statesRef,sha256:sha256(statesBytes),count:states.length},validation:diagnosis.validation};
        const profile=buildProgressProfile({id:name,label:name,puzzleId:name,logic:candidate.definition.logic,givens:[],states,
         inputs:[record.diagnosis.definition,{path:record.diagnosis.states.path,sha256:record.diagnosis.states.sha256}]});
        record.signals=qualitySignals(profile);reason=lateRejection(record.signals,config.quality);
        costs.push({candidateId:record.candidateId,diagnosisMs:performance.now()-start,states:states.length});
       }
       record.decision=reason?'rejected':'finalist';record.reason=reason;
       record.reasonCategory=reason?(reason==='DIAGNOSIS_BUDGET_EXHAUSTED'?'technical-budget':'experimental-quality'):null;
       raw.push(record);append('raw.jsonl',record);
       if(!reason)finalists.push(record);
       return reason??true;
      }});
     attempt.search=result.search;attempt.status=result.status;
    }
   }
  }
  attempts.push(attempt);append('attempts.jsonl',attempt);
  process.stderr.write(`S03 M${mapIndex}: ${attempt.reason??attempt.status}; diagnoses ${diagnoses}/${config.maxDiagnoses}\n`);
  costs.push({attemptId,targetMs:performance.now()-started});
 }
 write('finalists.jsonl',jsonl(finalists));
 const verification=verifyCandidates(path.join(out,'finalists.jsonl'),legacyVerificationContext(finalists));
 const series=selectSeries(finalists,config),selected=series.selected;
 write('candidates.jsonl',jsonl(selected));
 const manifestBytes=fs.readFileSync(path.join(out,'manifest.json'));
 const registry={registryVersion:1,stockId:'B2-S03',source:RUN,experimentId,
  manifestSha256:sha256(manifestBytes),candidatesSha256:sha256(jsonl(selected)),
  entries:selected.map(r=>({testName:r.testName,candidateId:r.candidateId,recordSha256:sha256(JSON.stringify(r)),
   fingerprints:r.fingerprints,effectKey:r.effectKey,contentSha256:contentHash(r),attemptId:r.attemptId}))};
 write('registry.json',json(registry));
 // Compile the public allowlist export inside the same watchdog. Private
 // evidence is not copied into the resulting public DTOs.
 const publicFiles=buildPlaytest({registry,manifest:JSON.parse(manifestBytes),rows:selected});
 const rejections={};for(const r of raw)if(r.reason)rejections[r.reason]=(rejections[r.reason]??0)+1;
 const summary={experimentId,status:'completed',targets:attempts.length,
  reducedSets:attempts.reduce((n,a)=>n+(a.search?.reducedSets??0),0),distinctRawCandidates:raw.length,
  rejections,diagnoses,diagnosisStates,finalists:finalists.length,verification,compiledPublicFiles:publicFiles.size,
  selected:selected.map(r=>({testName:r.testName,candidateId:r.candidateId,clueCount:r.definition.logic.clues.length,signals:r.signals})),
  diversity:{decisions:series.decisions,features:series.features,distinctSignatures:series.distinctSignatures,
   distinctMaps:new Set(selected.map(r=>r.fingerprints.mapStructure)).size},notSelected:series.notSelected,
  unmetGoals:[...(selected.length<config.maxSelected?[`Only ${selected.length} of up to ten selected`]:[]),
   'Human enjoyment, difficulty and series variety remain untested.'],
  searchFailures:attempts.reduce((counts,a)=>{for(const [k,v] of Object.entries(a.search?.failures??{}))counts[k]=(counts[k]??0)+v;return counts;},{}),
  searchCosts:attempts.reduce((s,a)=>{for(const k of ['restarts','solverChecks','matchEvaluations','routeFilterEvaluations'])s[k]=(s[k]??0)+(a.search?.[k]??0);return s;},{})};
 // Inputs must remain byte-identical throughout the experiment.
 for(const input of inputFiles)assert.equal(sha256(read(input.path)),input.sha256);
 write('summary.json',json(summary));
 write('observations.json',json({totalMs:performance.now()-begin,node:process.version,
  peakRssKiB:process.resourceUsage().maxRSS,cpuUsage:process.cpuUsage(),costs}));
 write('report.md',renderPilotReport(summary));
 return summary;
}

export function renderPilotReport(s){
 const lines=['# S03 v1 – technischer Pilotbericht (enthält Diagnoseinformationen)','',
  `Experiment: \`${s.experimentId}\`. Status: ${s.status}.`, '',
  `${s.targets} Zielversuche; ${s.reducedSets} reduzierte Sätze; ${s.distinctRawCandidates} unterschiedliche gültige Rohkandidaten.`,
  `${s.diagnoses} Diagnosen mit ${s.diagnosisStates} Teilmengenzuständen; ${s.finalists} Finalisten unabhängig geprüft; ${s.selected.length} ausgewählt.`, '',
  '## Ablehnungen und Kosten','',
  'Kandidatenfilter: `'+JSON.stringify(s.rejections)+'`.','',
  'Suchabbrüche/Wiederholungen: `'+JSON.stringify(s.searchFailures)+'`.','',
  'Suchkosten: `'+JSON.stringify(s.searchCosts)+'`.','',
  'Jeder Zielversuch einschließlich Vorfilter und Topologie steht in attempts.jsonl. Alle unterschiedlichen Rohkandidaten und Entscheidungen stehen in raw.jsonl. Wiederholte reduzierte Sätze werden in Suchzählern erfasst. Laufzeit, Speicher und einzelne Diagnosekosten: observations.json.', '',
  '## Auswahl und Vielfalt','',
  '| Kennung | Hinweise |', '| --- | ---: |'];
 for(const r of s.selected)lines.push(`| ${r.testName} | ${r.clueCount} |`);
 lines.push('',`${s.diversity.distinctMaps} Karten, ${s.diversity.distinctSignatures} unterschiedliche Verlaufssignaturen.`, '',
  'Die einzelnen Signale, Merkmalszuwächse und nicht ausgewählten Finalisten stehen in summary.json. Lokale Beweise sind in gehashten evidence/*.states.jsonl gespeichert; exakte Mengen sind keine lokalen Begründungen. Unbekannte Teilmengen bleiben ausdrücklich unbekannt.', '',
  '## Nicht nachgewiesen','',...s.unmetGoals.map(t=>'- '+t), '',
  'Die Baseline-/Dominanzfilter vermeiden bestimmte extreme Vorfestlegungen; sie beweisen keinen höheren Spielspaß. Höhere Routenkorrelationen, menschliche Entdeckbarkeit und tatsächliche Abwechslung bleiben offen. Keine nachträgliche Lockerung und keine zusätzliche Generierung.');
 return lines.join('\n')+'\n';
}
