import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT,REGISTRY,OUTPUT,readPlaytestSource,buildPlaytest,parsePlaytestArgs,playtestStock} from '../../scripts/lib/b2-playtest.mjs';
import {playtestClueReport,buildClueReport,renderClueReport} from '../../scripts/lib/b2-diagnostics.mjs';
import {main as inspect} from '../../scripts/inspect-b2-playtest.mjs';
import {main as exportStock} from '../../scripts/export-b2-playtest.mjs';
import {canonicalJson,sha256} from '../../scripts/lib/content-hash.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';

const base='d30c6683e8ba74e72ea1e9aae6e3aaa99295f207';
const release='gk-catalog-release-v1-sha256-f9dbeb5e6be3664adcef72c1624615e7a016681cd4024ad0442fd54ec825497e';
const source=readPlaytestSource('S02'),files=buildPlaytest(source);
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));
const summary=read(source.registry.source+'/summary.json');

test('S02 registers the complete fixed 20-map experiment without selection or renumbering',()=>{
 const {registry,manifest,rows}=source,options=manifest.input.b1Manifest.input.batchManifest.options;
 assert.equal(rows.length,96);assert.equal(registry.entries.length,96);
 assert.equal(summary.candidateCount,96);assert.equal(summary.uniqueCandidateCount,96);
 assert.equal(summary.mapCount,20);assert.equal(summary.startCount,48);assert.equal(summary.targetRoutes,48);
 assert.deepEqual(manifest.program,{commit:base,nodeVersion:'v24.19.0'});
 assert.equal(manifest.input.b1Manifest.input.batchManifest.provenance.releaseId,release);
 assert.equal(manifest.input.b1Manifest.input.batchManifest.provenance.backgroundId,'sea-blue-01');
 assert.equal(options.targetCount,20);assert.equal(options.maxAttempts,40);
 assert.equal(options.seedStart,0);assert.equal(options.assignmentSeedStart,0);
 assert.deepEqual(options.config.filters,{routeSteps:[],minLargestComponent:0});
 assert.deepEqual(manifest.routeSelection.routeIndices,[0]);assert.equal(manifest.seed,42);
 assert.deepEqual(manifest.budgets,{maxNodesPerStart:100000,maxClueParameters:100000,maxRestarts:2,maxSolverChecks:2000,
  maxMatchEvaluations:5000000,maxRouteFilterEvaluations:20000000});
 assert.equal(summary.incompleteStarts,0);assert.equal(summary.incompleteTargets,48);
 assert.deepEqual(summary.failures,{NO_PROGRESS:2294,RESTART_BUDGET_EXHAUSTED:48});
 const byVariant=new Map(rows.map(row=>[row.fingerprints.variant,row]));
 for(const binding of registry.entries){
  const row=byVariant.get(binding.fingerprints.variant),parts=binding.testName.match(/^B2-S02-M(\d{3})-([A-E][1-5])-R(\d+)-V(\d+)$/);
  assert.ok(parts);assert.equal(Number(parts[1]),row.source.acceptedIndex);
  assert.equal(parts[2],row.definition.logic.start);assert.equal(Number(parts[3]),row.routeSource.routeIndex);
 }
 const reordered=structuredClone(source);reordered.rows.reverse();reordered.registry.entries.reverse();
 assert.deepEqual(buildPlaytest(reordered),files);
 const reduced=structuredClone(source),removed=reduced.registry.entries.shift();
 reduced.rows=reduced.rows.filter(row=>row.fingerprints.variant!==removed.fingerprints.variant);
 const subset=buildPlaytest(reduced);
 for(const binding of reduced.registry.entries)assert.equal(subset.get(binding.testName+'.json'),files.get(binding.testName+'.json'));
});

test('all 96 unfiltered S02 candidates load through the real public loader without private payloads',async()=>{
 const requests=[];
 const loader=createPuzzleLoader({manifestUrl:'http://local/.dev/b2-s02/manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);requests.push(ref);
  const bytes=ref.startsWith('.dev/b2-s02/')?files.get(ref.slice('.dev/b2-s02/'.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 assert.equal((await loader.manifest()).puzzles.length,97);
 const byVariant=new Map(source.rows.map(row=>[row.fingerprints.variant,row]));
 for(const binding of source.registry.entries){
  const row=byVariant.get(binding.fingerprints.variant),puzzle=await loader.load(binding.testName);
  assert.deepEqual(puzzle.solution,row.definition.solution);
  assert.deepEqual(puzzle.map,row.definition.logic.map);assert.deepEqual(puzzle.assetPlacements,row.assetPlacements);
  const dto=JSON.parse(files.get(binding.testName+'.json'));
  assert.deepEqual(dto.puzzle.logic,row.definition.logic);
  assert.deepEqual(Object.keys(dto).sort(),['identity','projectionSchemaVersion','puzzle','rulesVersion']);
  assert.equal(dto.puzzle.solution,undefined);
  for(const clue of row.definition.logic.clues)
   assert.equal(dto.puzzle.presentation.clueTexts[clue.id],technicalClueText(clue,row.definition.logic.map));
 }
 assert.ok(!requests.some(ref=>ref.startsWith('docs/')||ref.startsWith('scripts/')));
});

test('S02 candidate proofs, omission counts, fingerprints and effects pass the independent solver',()=>{
 assert.equal(verifyCandidates(path.join(ROOT,source.registry.source,'candidates.jsonl')).verifiedCandidates,96);
});

test('S02 binding rejects changed candidates, rebound names, duplicate identities and wrong stocks',()=>{
 for(const mutate of [
  s=>{s.rows[0].definition.solution.reverse();},s=>{s.rows[0].assetPlacements[0].anchor='E5';},
  s=>{s.rows[0].effectKey+='0';},s=>{s.rows[0].attemptId+='0';},s=>{s.rows.pop();},
  s=>{s.rows.push(s.rows[0]);},s=>{s.registry.entries[0].testName=s.registry.entries[1].testName;},
  s=>{s.registry.entries[0].testName=s.registry.entries[0].testName.replace('S02','S01');},
  s=>{s.registry.stockId='B2-S03';},s=>{s.manifest.experimentId+='0';}
 ]){const changed=structuredClone(source);mutate(changed);assert.throws(()=>buildPlaytest(changed),/B2 export:/);}
});

test('S02 report has exact independent marginals, cross table and a trace for every stored clue',()=>{
 const report=playtestClueReport('S02'),stored=read('docs/verification/B2-S02/clue-report.json');
 assert.deepEqual(report,stored);
 assert.equal(renderClueReport(report),fs.readFileSync(path.join(ROOT,'docs/verification/B2-S02/clue-report.md'),'utf8'));
 assert.equal(report.candidateCount,96);assert.equal(report.totalClues,340);
 assert.deepEqual(report.byType,{countDistanceToPlace:283,direction:8,distanceBetweenHours:15,distanceToPlace:26,position:1,turn:7});
 assert.deepEqual(report.byPresentationForm,{CountDistanceNever:56,HasDistanceAt:27,NotDistanceAt:14,countDistanceToPlace:186,
  direction:8,distanceBetweenHours:15,distanceToPlace:26,position:1,turn:7});
 assert.deepEqual(report.crossTable.counts.countDistanceToPlace,{CountDistanceNever:56,HasDistanceAt:27,NotDistanceAt:14,
  countDistanceToPlace:186,direction:0,distanceBetweenHours:0,distanceToPlace:0,position:0,turn:0});
 assert.deepEqual(report.crossTable.rowTotals,report.byType);
 assert.deepEqual(report.crossTable.columnTotals,report.byPresentationForm);
 assert.equal(report.crossTable.total,340);assert.equal(report.occurrences.length,340);
 assert.deepEqual(report.byType,JSON.parse(JSON.stringify(summary.clueTypes)));
 assert.deepEqual(report.byPresentationForm,JSON.parse(JSON.stringify(summary.cluePresentationForms)));
 const bindings=new Map(source.registry.entries.map(entry=>[entry.testName,entry]));
 const candidates=new Map(source.rows.map(row=>[row.fingerprints.variant,row]));
 for(const occurrence of report.occurrences){
  const row=candidates.get(bindings.get(occurrence.testName).fingerprints.variant);
  const clue=row.definition.logic.clues.find(c=>c.id===occurrence.clueId);
  assert.ok(clue);assert.equal(occurrence.logicalType,clue.type);
 }
 assert.equal(new Set(report.occurrences.map(o=>o.testName+'/'+o.clueId)).size,340);
 const reordered=structuredClone(source),before=structuredClone(source);
 reordered.rows.reverse();reordered.registry.entries.reverse();
 const context={...report.source,implementation:report.analysis.implementation};
 assert.deepEqual(buildClueReport(reordered,context),report);
 assert.deepEqual(source,before);
 assert.deepEqual(inspect(['--stock','S02','--report']),report);
 assert.equal(inspect(['--stock','S02','--report-markdown']),renderClueReport(report));
});

test('S01 defaults, stored bytes and public export are unchanged from the pinned main',()=>{
 assert.equal(REGISTRY,'scripts/config/b2-playtest-s01.json');assert.equal(OUTPUT,'.dev/b2');
 assert.deepEqual(readPlaytestSource(),readPlaytestSource('S01'));
 const s01=readPlaytestSource(),actual=buildPlaytest(),expected=read('tests/fixtures/generation/b2-s01-export.json');
 assert.equal(actual.size,expected.fileCount);
 assert.equal(sha256(canonicalJson([...actual].sort(([a],[b])=>a<b?-1:a>b?1:0)
  .map(([name,bytes])=>({name,sha256:sha256(bytes)})))),expected.sha256);
 assert.deepEqual(inspect(['--statistics']),{stockId:'B2-S01',candidates:{
  byType:{countDistanceToPlace:306,distanceToPlace:20,turn:16,direction:11,distanceBetweenHours:13,position:17},
  byPresentationForm:{countDistanceToPlace:210,distanceToPlace:20,CountDistanceNever:57,NotDistanceAt:16,HasDistanceAt:23,
   turn:16,direction:11,distanceBetweenHours:13,position:17}}});
 assert.equal(inspect([s01.registry.entries[0].testName]).binding.testName,s01.registry.entries[0].testName);
 const protectedPaths=['archive','docs/verification/B2-example','scripts/config/b2-playtest-s01.json',
  'tests/fixtures/generation/b2-p2-historical-pool.json'];
 const names=execFileSync('git',['ls-tree','-r','--name-only',base,'--',...protectedPaths],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
 for(const ref of names){const original=execFileSync('git',['show',base+':'+ref],{cwd:ROOT,maxBuffer:32*1024*1024});
  assert.equal(sha256(fs.readFileSync(path.join(ROOT,ref))),sha256(original),ref);}
});

test('explicit stock selection rejects unknown or duplicate flags before touching exported files',()=>{
 assert.deepEqual(parsePlaytestArgs([]),{stock:'S01',args:[]});
 assert.deepEqual(parsePlaytestArgs(['--statistics','--stock','S02']),{stock:'S02',args:['--statistics']});
 assert.equal(playtestStock('S02').output,'.dev/b2-s02');
 for(const args of [['--stock'],['--stock','S03'],['--stock','S02','--stock','S01'],['--other']])
  assert.throws(()=>exportStock(args));
 assert.throws(()=>inspect(['--stock','S02','--statistics','extra']));
});
