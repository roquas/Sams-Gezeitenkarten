// Private experiment. Writes a new directory; never exports a playtest stock.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {readPlaytestSource,validatePlaytestBindings,ROOT} from './lib/b2-playtest.mjs';
import {programState} from './lib/map-batch.mjs';
import {canonicalJson,sha256} from './lib/content-hash.mjs';
import {createRouteWorkspace} from './lib/puzzle-route-solver.mjs';
import {generateTrueClues} from './lib/puzzle-clues.mjs';
import {SEARCH_STRATEGY,SEARCH_LIMITS,validateSearchBudgets,randomIncrementalSearch,searchPuzzleCandidates} from './lib/puzzle-candidate-search.mjs';
import {DIVERSIFIED_STRATEGY,weakReductionSearch} from './lib/b2-search-variation.mjs';
import {clueComposition} from './lib/b2-diagnostics.mjs';
import {solvePuzzle} from '../src/engine/solver.mjs';
import {verifyCandidates} from './verify-puzzle-experiment.mjs';
const json=x=>JSON.stringify(x,null,2)+'\n';
const hashFile=ref=>sha256(fs.readFileSync(path.join(ROOT,ref)));
const add=(counts,key)=>{counts[key]=(counts[key]??0)+1;};
export function validateComparison(config){
 assert.deepEqual(Object.keys(config).sort(),['arms','protocol','targets']);
 assert.equal(config.protocol,'b2-search-comparison-1');
 assert.ok(config.targets.length>=1&&config.targets.length<=8&&new Set(config.targets).size===config.targets.length);
 assert.ok(config.targets.every(x=>typeof x==='string'));
 assert.ok(config.arms.length>=1&&config.arms.length<=6&&new Set(config.arms.map(a=>a.id)).size===config.arms.length);
 for(const arm of config.arms){
  assert.ok(Object.keys(arm).every(k=>['id','strategy','budgetMultiplier','window'].includes(k)));
  assert.match(arm.id,/^[A-Z]$/);assert.ok([SEARCH_STRATEGY,DIVERSIFIED_STRATEGY].includes(arm.strategy));
  assert.ok(Number.isSafeInteger(arm.budgetMultiplier)&&arm.budgetMultiplier>=1&&arm.budgetMultiplier<=10);
  if(arm.strategy===DIVERSIFIED_STRATEGY)assert.ok(Number.isSafeInteger(arm.window)&&arm.window>=1&&arm.window<=32);
  else assert.equal(arm.window,undefined);
 }
 return config;
}
export function runComparison({out,config}){
 validateComparison(config);
 const program=programState(),source=readPlaytestSource('S02'),bindings=validatePlaytestBindings(source);
 const files=[...['manifest.json','candidates.jsonl','attempts.jsonl','summary.json'].map(n=>source.registry.source+'/'+n),
  'scripts/config/b2-playtest-s02.json'];
 const inputFiles=files.map(file=>({file,sha256:hashFile(file)}));
 const settings={protocol:config.protocol,config,program,inputFiles,sourceExperimentId:source.manifest.experimentId,
  seedPolicy:'original-S02-target-seed-paired-across-arms-1',identityPolicy:'run-hash/arm/target/variant-hash-1'};
 const experimentId='gk-b2-search-run-sha256:'+sha256(canonicalJson(settings));
 // Validate every selection before reserving the output directory.
 const targets=config.targets.map(name=>{
  const entry=source.registry.entries.find(e=>e.testName===name);assert.ok(entry,'Unknown target '+name);
  return {name,row:bindings.get(entry.fingerprints.variant)};
 });
 assert.equal(new Set(targets.map(t=>t.row.fingerprints.instance)).size,targets.length,'Duplicate target instance');
 // Exclusive directory reservation also prevents overwriting S02 or inputs.
 fs.mkdirSync(out);
 const write=(name,value)=>fs.writeFileSync(path.join(out,name),value,{flag:'wx'});
 write('manifest.json',json({...settings,experimentId,sourceManifest:source.manifest}));
 const records=[],attempts=[],observations=[];
 const begin=performance.now(),usage=process.resourceUsage();
 for(const {name,row} of targets){
  const targetBegin=performance.now(),logic={...row.definition.logic,clues:[]};
  const workspace=createRouteWorkspace(logic,{maxNodes:source.manifest.budgets.maxNodesPerStart});
  assert.equal(workspace.completed,true);
  const pool=generateTrueClues(logic,row.definition.solution,{maxClueParameters:source.manifest.budgets.maxClueParameters});
  assert.equal(pool.completed,true,'Complete true-clue pool required');
  const preparationMs=performance.now()-targetBegin;
  for(const arm of config.arms){
   const budgets=validateSearchBudgets(Object.fromEntries(Object.keys(SEARCH_LIMITS).map(k=>
    [k,Math.min(SEARCH_LIMITS[k],source.manifest.budgets[k]*arm.budgetMultiplier)])));
   const strategy=arm.strategy===SEARCH_STRATEGY?randomIncrementalSearch:options=>weakReductionSearch({...options,window:arm.window});
   const armBegin=performance.now(),before=process.resourceUsage();
   const result=searchPuzzleCandidates({logic,targetRoute:row.definition.solution,cluePool:pool,workspace,seed:row.seed,budgets,strategy});
   const searchMs=performance.now()-armBegin,after=process.resourceUsage();
   const attemptId=experimentId+'/'+arm.id+'/'+name;
   // A must reproduce the exact original baseline candidates and counters.
   if(arm.strategy===SEARCH_STRATEGY&&arm.budgetMultiplier===1){
    const original=source.rows.filter(c=>c.attemptId===row.attemptId);
    assert.deepEqual(result.candidates,original.map(({definition,fingerprints,effectKey,proof,properties})=>({definition,fingerprints,effectKey,proof,properties})));
    assert.deepEqual(result.search,fs.readFileSync(path.join(ROOT,source.registry.source,'attempts.jsonl'),'utf8').trim().split('\n')
     .flatMap(line=>JSON.parse(line).starts).flatMap(s=>s.targets).find(t=>t.attemptId===row.attemptId).search);
   }
   const histogram={},types=[],exactHours={};
   for(const candidate of result.candidates){
    const candidateId=attemptId+'/'+candidate.fingerprints.variant;
    const independent=solvePuzzle(candidate.definition.logic,{maxNodes:1000000});
    assert.equal(independent.count,1);assert.deepEqual(independent.solutions[0],row.definition.solution);
    assert.ok(independent.metrics.withoutClue.every(c=>c.count>=2));
    const clues=candidate.definition.logic.clues;
    // Canonical clue order is diagnostic, not claimed to be human deduction.
    const singleCounts=clues.map(clue=>solvePuzzle({...logic,clues:[clue]},{maxNodes:1000000,metrics:false}).count);
    const pairCounts=[];
    for(let i=0;i<clues.length;i++)for(let j=i+1;j<clues.length;j++)pairCounts.push({clueIds:[clues[i].id,clues[j].id],
     count:solvePuzzle({...logic,clues:[clues[i],clues[j]]},{maxNodes:1000000,metrics:false}).count});
    records.push({puzzleExperimentFormatVersion:2,experimentId,attemptId,candidateId,sourceTarget:name,
     sourceAttemptId:row.attemptId,seed:row.seed,strategy:arm.strategy,budgets,assetPlacements:row.assetPlacements,...candidate,
     diagnosis:{canonicalPrefixCounts:independent.metrics.remainingCandidates,singleCounts:clues.map((c,i)=>({clueId:c.id,count:singleCounts[i],
      eliminatedFraction:1-singleCounts[i]/workspace.routeCount})),pairCounts}});
    add(histogram,clues.length);types.push(...clues);
    for(const item of candidate.properties.individualExactness)for(const hour of item.hours)add(exactHours,hour);
   }
   const n=result.candidates.length;
   attempts.push({attemptId,sourceTarget:name,arm:arm.id,strategy:arm.strategy,window:arm.window??null,seed:row.seed,budgets,
    legalRouteCount:workspace.routeCount,enumerationNodes:workspace.nodesVisited,
    cluePool:{size:pool.clues.length,parametersExamined:pool.parametersExamined,completed:pool.completed,byType:pool.byType,byPresentationForm:pool.byPresentationForm},
    status:result.status,search:result.search,acceptedCandidates:n,reducedSetsGenerated:result.search.reducedSets,
    histogram,composition:clueComposition(types),exactHours,
    individuallyExactClues:result.candidates.reduce((s,c)=>s+c.properties.individuallyExactClueCount,0),
    withExactHour1:result.candidates.filter(c=>c.properties.hasIndividuallyExactHour1).length,
    fiveSixSeven:Object.fromEntries([5,6,7].map(k=>[k,{count:histogram[k]??0,share:n?(histogram[k]??0)/n:0}]))});
   observations.push({attemptId,searchMs,preparationMsSharedAcrossArms:preparationMs,cpuSearchMicros:after.userCPUTime+after.systemCPUTime-before.userCPUTime-before.systemCPUTime});
   process.stderr.write(name+' '+arm.id+': '+n+' candidates\n');
  }
 }
 write('candidates.jsonl',records.map(r=>JSON.stringify(r)+'\n').join(''));
 const verification=verifyCandidates(path.join(out,'candidates.jsonl'));
 const arms=config.arms.map(arm=>{
  const rows=attempts.filter(a=>a.arm===arm.id),histogram={},search={},failures={};
  for(const row of rows){for(const [k,v] of Object.entries(row.histogram))histogram[k]=(histogram[k]??0)+v;
   for(const [k,v] of Object.entries(row.search))if(typeof v==='number')search[k]=(search[k]??0)+v;
   for(const [k,v] of Object.entries(row.search.failures))failures[k]=(failures[k]??0)+v;}
  const candidates=records.filter(r=>r.strategy===arm.strategy&&r.attemptId.split('/')[1]===arm.id);
  const n=rows.reduce((s,r)=>s+r.acceptedCandidates,0);
  return {...arm,candidates:n,histogram,search,failures,composition:clueComposition(candidates.flatMap(r=>r.definition.logic.clues)),
   individuallyExactClues:rows.reduce((s,r)=>s+r.individuallyExactClues,0),withExactHour1:rows.reduce((s,r)=>s+r.withExactHour1,0),
   exactHours:rows.reduce((all,r)=>{for(const [h,n] of Object.entries(r.exactHours))all[h]=(all[h]??0)+n;return all;},{}),
   fiveSixSeven:Object.fromEntries([5,6,7].map(k=>[k,{count:histogram[k]??0,share:n?(histogram[k]??0)/n:0}]))};
 });
 const overlaps=[];
 for(let i=0;i<arms.length;i++)for(let j=i+1;j<arms.length;j++){
  const a=new Set(records.filter(r=>r.attemptId.split('/')[1]===arms[i].id).map(r=>r.effectKey));
  const b=new Set(records.filter(r=>r.attemptId.split('/')[1]===arms[j].id).map(r=>r.effectKey));
  overlaps.push({arms:[arms[i].id,arms[j].id],sharedEffects:[...a].filter(k=>b.has(k)).length});
 }
 for(const {file,sha256:expected} of inputFiles)assert.equal(hashFile(file),expected,'S02 changed');
 const summary={experimentId,status:'completed',generatorCalls:attempts.length,attempts,arms,overlaps,verification};
 write('summary.json',json(summary));
 const final=process.resourceUsage();
 write('observations.json',json({totalMs:performance.now()-begin,cpuMicros:final.userCPUTime+final.systemCPUTime-usage.userCPUTime-usage.systemCPUTime,
  peakRssKiB:final.maxRSS,node:process.version,platform:process.platform,arch:process.arch,observations}));
 write('report.md',renderComparison(summary));
 return summary;
}
export function renderComparison(summary){
 const lines=['# B2 Suchvergleich – Messdaten','',`Experiment: \`${summary.experimentId}\``, '',
  '| Arm | Kandidaten | 5 Hinweise | 6 Hinweise | 7 Hinweise | Neustarts | Solverprüfungen |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const a of summary.arms)lines.push(`| ${a.id} | ${a.candidates} | ${a.histogram[5]??0} | ${a.histogram[6]??0} | ${a.histogram[7]??0} | ${a.search.restarts} | ${a.search.solverChecks} |`);
 lines.push('',`${summary.verification.verifiedCandidates} Kandidaten unabhängig geprüft; alle Auslassungen heben Eindeutigkeit auf.`, '',
  'Vollständige Budgets, Abbrüche, Typen, Darstellungsformen, Einzelstunden und Zielzahlen: summary.json. Laufzeit/Ressourcen: observations.json.', '',
  'Alle Einzel- und Paarschnittmengen sowie Präfixe in kanonischer Hinweisreihenfolge: candidates.jsonl. Dies sind Diagnosemerkmale, keine Qualitäts- oder Schwierigkeitsskala.', '',
  '| Ziel | Arm | Legale Routen | Kandidaten | Hinweisverteilung |', '| --- | --- | ---: | ---: | --- |');
 for(const a of summary.attempts)lines.push(`| ${a.sourceTarget} | ${a.arm} | ${a.legalRouteCount} | ${a.acceptedCandidates} | ${JSON.stringify(a.histogram)} |`);
 return lines.join('\n')+'\n';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  assert.ok(process.argv.length===3||process.argv.length===4,'Usage: node scripts/run-b2-search-comparison.mjs OUT [CONFIG]');
  const config=JSON.parse(fs.readFileSync(process.argv[3]??path.join(ROOT,'scripts/config/b2-search-comparison.json'),'utf8'));
  const result=runComparison({out:process.argv[2],config});console.log(json({experimentId:result.experimentId,candidates:result.verification.verifiedCandidates}));
 }catch(error){console.error(error.stack);process.exitCode=1;}
}
