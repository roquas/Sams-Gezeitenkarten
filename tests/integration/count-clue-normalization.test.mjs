import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {normalizeCountClues} from '../../scripts/lib/count-clue-normalization.mjs';
import {createRouteWorkspace,SearchBudgetExceeded} from '../../scripts/lib/puzzle-route-solver.mjs';
import {searchPuzzleCandidates} from '../../scripts/lib/puzzle-candidate-search.mjs';
import {ROOT,readPlaytestSource,buildPlaytest,contentHash} from '../../scripts/lib/b2-playtest.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {checkIrredundancy} from '../../src/puzzles/analysis.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {verifyCandidates} from '../../scripts/verify-puzzle-experiment.mjs';
import {clueKey} from '../../scripts/lib/puzzle-clues.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';
import {cluePresentationForm} from '../../scripts/lib/clue-presentation.mjs';
import {earlyRejection,qualitySignals} from '../../scripts/lib/s03-quality.mjs';
import {diagnosePuzzle,clueSubsets} from '../../scripts/lib/b2-deduction.mjs';
import {buildProgressProfile} from '../../scripts/lib/b2-markable-progress.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {main as normalizationReport,referenceOriginContext} from '../../scripts/report-count-clue-normalization.mjs';
import {candidateOriginContract,pinOriginContract,rawClueOrigin,originContractSha256,verifyCandidateOrigins} from '../../scripts/lib/candidate-origin-contract.mjs';
import {assertBranchPreservesPaths} from '../helpers/branch-preservation.mjs';

// Fixed reference cases, no generator run. Each workspace/independent oracle
// uses at most 100,000 nodes; the one existing diagnosis has its 250,000 cap.
const source=readPlaytestSource('S03-V2');
const reference=source.rows.find(r=>r.testName==='B2-S03-V2-M014-A5-R160-V01');
const definition=reference.definition,logic={...definition.logic,clues:[]};
const raw=definition.logic.clues,target=definition.solution;
const workspace=createRouteWorkspace(logic,{maxNodes:100000});
assert.equal(workspace.completed,true);
const rules=createRules(logic),routes=[...rules.routes([logic.start],{remaining:100000})];
const budgets={maxRestarts:2,maxSolverChecks:2000,maxMatchEvaluations:5000000,maxRouteFilterEvaluations:20000000};
const surviving=clues=>routes.filter(route=>clues.every(c=>rules.matches(route,c)));
function fixedStrategy({clues,onCandidate}){
 const failures={};let reducedSets=0;
 try{
  for(let attempt=0;attempt<2;attempt++){
   reducedSets++;const outcome=onCandidate(clues.map((_,i)=>i));
   if(outcome!==true){const key=typeof outcome==='string'?outcome:'DUPLICATE_VARIANT';failures[key]=(failures[key]??0)+1;}
  }
 }catch(error){if(!(error instanceof SearchBudgetExceeded))throw error;failures[error.reason]=1;}
 return {restarts:reducedSets,reducedSets,failures,exhaustive:false};
}
const run=(options={})=>searchPuzzleCandidates({logic,targetRoute:target,workspace,
 cluePool:{clues:raw,parametersExamined:raw.length,completed:true},seed:404,budgets,strategy:fixedStrategy,...options});
const normalized=run().candidates[0];

test('S03-06: H2 and H3 are separately necessary; their union preserves every legal route and the unique target',()=>{
 assert.equal(workspace.routeCount,routes.length);
 const pair=raw.filter(c=>['H2','H3'].includes(c.id)),union=normalizeCountClues(pair).clues;
 assert.deepEqual(union,[{...raw[1],id:'H1',fromHour:3,toHour:6}]);
 assert.deepEqual(surviving(pair),surviving(union));
 assert.ok(surviving(raw.filter(c=>c.id!=='H2')).length>=2);
 assert.ok(surviving(raw.filter(c=>c.id!=='H3')).length>=2);
 assert.equal(normalized.definition.logic.clues.length,5);
 assert.deepEqual(surviving(normalized.definition.logic.clues),surviving(raw));
 assert.deepEqual(surviving(raw),[target]);
 const proof=checkIrredundancy(normalized.definition,{detailed:true,maxNodes:100000});
 assert.equal(proof.irredundant,true);assert.equal(proof.countExact,true);assert.equal(proof.target.status,'match');
 assert.deepEqual(proof.omissions.map(o=>o.count),normalized.proof.omissions.map(o=>o.count));
 assert.deepEqual(proof.uniqueSolution,target);assert.equal(proof.search.legalRoutesVisited,routes.length);
});

test('identity, source IDs and serialization are deterministic without changing raw definitions',()=>{
 const before=structuredClone(reference),reversed=run({cluePool:{clues:[...raw].reverse(),completed:true,parametersExamined:raw.length}});
 assert.equal(JSON.stringify(reversed.candidates[0]),JSON.stringify(normalized));
 assert.deepEqual(JSON.parse(JSON.stringify(normalized)),normalized);
 assert.deepEqual(run().candidates[0],normalized);
 assert.deepEqual(logicalFingerprints(normalized.definition),normalized.fingerprints);
 assert.equal(normalized.fingerprints.instance,reference.fingerprints.instance);
 assert.notEqual(normalized.fingerprints.variant,reference.fingerprints.variant);
 assert.deepEqual(normalized.normalization.rawFingerprints,reference.fingerprints);
 assert.deepEqual(normalized.normalization.rawClues.map(clueKey),[...raw].sort((a,b)=>clueKey(a)<clueKey(b)?-1:1).map(clueKey));
 const output=normalized.normalization.outputs.find(o=>o.sources.length===2);
 assert.deepEqual(output.sources.map(c=>c.id),['H2','H3']);assert.equal(output.rule,'zero-union');
 assert.deepEqual(reference,before);
});

test('all individual properties, effect identity and selection signals use the five normalized clues',()=>{
 const clues=normalized.definition.logic.clues;
 const independentlyExact=clues.map(c=>{
  const matching=surviving([c]);return {clueId:c.id,hours:Array.from({length:6},(_,i)=>i+1)
   .filter(h=>new Set(matching.map(r=>r[h])).size===1)};
 });
 assert.deepEqual(normalized.properties.individualExactness,independentlyExact);
 assert.equal(normalized.properties.individuallyExactClueCount,independentlyExact.filter(c=>c.hours.length).length);
 assert.deepEqual(normalized.properties.cluePresentationForms,[...new Set(clues.map(cluePresentationForm))]);
 const own=workspace.forClues(clues,budgets);
 assert.equal(normalized.effectKey,own.effectKey(clues.map((_,i)=>i)));
 assert.notEqual(normalized.effectKey,reference.effectKey);
 const diagnosis=diagnosePuzzle(normalized.definition.logic);
 assert.equal(diagnosis.validation.allCluesSolverAgreement,true);
 assert.equal(diagnosis.scenarios.length,clueSubsets(5).length);
 assert.equal(diagnosis.scenarios.at(-1).clueIds.length,5);
 const states=diagnosis.scenarios.map((s,i)=>({...s,source:{path:'in-memory-s04-b.states.jsonl',line:i+1}}));
 const profile=buildProgressProfile({id:'S04-B-06',label:'S04-B-06',logic:normalized.definition.logic,givens:[],states,inputs:[]});
 const signals=qualitySignals(profile);
 assert.deepEqual(profile.evidence.coverage.clueIds,clues.map(c=>c.id));
 assert.deepEqual(signals,qualitySignals(buildProgressProfile({id:'S04-B-06',label:'S04-B-06',
  logic:normalized.definition.logic,givens:[],states:structuredClone(states),inputs:[]})));
});

test('a normalized candidate violating minimum clue count or dominance is rejected, without filler or repeat diagnosis',()=>{
 for(const quality of [{minClues:6,maxClues:7,maxSingleFixed:6},{minClues:3,maxClues:7,maxSingleFixed:0}]){
  let evaluated=0;
  const result=run({evaluateCandidate(c){evaluated++;assert.equal(c.definition.logic.clues.length,5);return earlyRejection(c,quality)??true;}});
  assert.equal(evaluated,1);assert.equal(result.candidates.length,0);
  assert.equal(result.search.failures[quality.minClues===6?'CLUE_COUNT':'SINGLE_CLUE_DOMINANCE'],1);
 }
});

test('new proof work consumes the same bounded solver budget; exhaustion never yields a valid candidate',()=>{
 for(const cap of [{maxMatchEvaluations:routes.length*raw.length},{maxSolverChecks:1},{maxRouteFilterEvaluations:1}]){
  const result=run({budgets:{...budgets,...cap}});
  assert.equal(result.candidates.length,0);assert.equal(result.search.incomplete,true);
  assert.ok(Object.keys(result.search.failures).some(k=>/BUDGET_EXHAUSTED/.test(k)));
  assert.ok(result.search.matchEvaluations<=result.search.clueCandidates*routes.length);
 }
 assert.throws(()=>run({normalization:'unknown'}),/Unknown/);
});

test('even an equivalent transformation cannot pass a redundant candidate from another strategy',()=>{
 const extra={id:'extra',type:'position',hour:6,cell:target[6]};
 const result=run({cluePool:{clues:[...raw,extra],completed:true,parametersExamined:7}});
 assert.equal(result.candidates.length,0);assert.equal(result.search.failures.NORMALIZED_REDUNDANT,2);
});

test('independent persisted-candidate verification detects damaged provenance',t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'s04-b-proof-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));const file=path.join(directory,'candidates.jsonl');
 const row={...normalized,puzzleExperimentFormatVersion:2,attemptId:'S04-B-reference-06'},context=referenceOriginContext();
 fs.writeFileSync(file,JSON.stringify(row)+'\n');assert.equal(verifyCandidates(file,context).verifiedCandidates,1);
 for(const change of [
  r=>delete r.normalization,
  r=>r.normalization=null,
  r=>{r.normalization.rawClues.find(c=>c.id==='H2').id='FORGED-ORIGIN';
   for(const o of r.normalization.outputs)for(const s of o.sources)if(s.id==='H2')s.id='FORGED-ORIGIN';},
  r=>r.normalization.rawOriginFingerprint='gk-raw-clues-v1-sha256:'+'0'.repeat(64),
  r=>r.preparation.status='unchanged',
  r=>r.preparation.policy='none',
  r=>r.normalization.format='none',
  r=>delete r.preparation,
  r=>{delete r.preparation;delete r.normalization;r.puzzleExperimentFormatVersion=1;},
  r=>{r.puzzleExperimentFormatVersion=1;r.normalization.outputs.pop();},
  r=>{delete r.normalization;r.preparation.status='unchanged';
   r.preparation.rawOriginFingerprint=rawClueOrigin(r.definition.logic.clues);},
  r=>{const p=r.normalization;p.rawClues.find(c=>c.id==='H2').id='FORGED-ORIGIN';
   for(const o of p.outputs)for(const s of o.sources)if(s.id==='H2')s.id='FORGED-ORIGIN';
   p.rawOriginFingerprint=rawClueOrigin(p.rawClues);r.preparation.rawOriginFingerprint=p.rawOriginFingerprint;},
  r=>r.normalization.outputs.find(o=>o.sources.length===2).sources.pop(),
  r=>r.normalization.outputs[0].sources[0].key='wrong',
  r=>r.normalization.rawFingerprints.variant=r.fingerprints.variant,
  r=>r.normalization.outputs.find(o=>o.sources.length===2).rule='all-union'
 ]){
  const bad=structuredClone(row);change(bad);fs.writeFileSync(file,JSON.stringify(bad)+'\n');
  assert.throws(()=>verifyCandidates(file,context));
  assert.throws(()=>verifyCandidates(file),'unknown files cannot downgrade to the implicit historical inventory');
 }
 // The raw-ID rebind must still leave the existing logical fingerprints intact.
 const rebound=structuredClone(row);rebound.normalization.rawClues.find(c=>c.id==='H2').id='FORGED-ORIGIN';
 assert.deepEqual(logicalFingerprints({...row.definition,logic:{...logic,clues:rebound.normalization.rawClues}}),row.normalization.rawFingerprints);
 fs.writeFileSync(file,JSON.stringify(row)+'\n');
 assert.equal(verifyCandidates(file,JSON.parse(JSON.stringify(context))).verifiedCandidates,1);
 // Mutating the sidecar as well does not change the independently expected digest.
 for(const change of [c=>c.policy='none',c=>c.entries[0].status='unchanged',
  c=>c.entries[0].rawClues.find(r=>r.id==='H2').id='FORGED-ORIGIN',
  c=>c.entries[0].source.commit='0'.repeat(40),c=>c.entries.pop()]){
  const bad=structuredClone(context);change(bad.originContract);
  assert.throws(()=>verifyCandidates(file,bad),/trust anchor mismatch/);
 }
 // Even a deliberately re-pinned receipt must agree with its historical Git
 // source; a self-consistent hash of forged raw IDs is insufficient.
 const forged=structuredClone(context);forged.originContract.entries[0].rawClues.find(c=>c.id==='H2').id='FORGED-ORIGIN';
 forged.originContract.entries[0].rawOriginFingerprint=rawClueOrigin(forged.originContract.entries[0].rawClues);
 forged.expectedOriginContractSha256=originContractSha256(forged.originContract);
 assert.throws(()=>verifyCandidates(file,forged),/pinned Git source/);
});

test('trusted live raw capture survives a self-consistent rewrite of candidate origin IDs during evaluation',()=>{
 const result=run({evaluateCandidate(c){
  c.normalization.rawClues.find(r=>r.id==='H2').id='FORGED-ORIGIN';
  for(const o of c.normalization.outputs)for(const s of o.sources)if(s.id==='H2')s.id='FORGED-ORIGIN';
  c.normalization.rawOriginFingerprint=rawClueOrigin(c.normalization.rawClues);
  c.preparation.rawOriginFingerprint=c.normalization.rawOriginFingerprint;return true;
 }});
 const row={...result.candidates[0],attemptId:'live',puzzleExperimentFormatVersion:2};
 const context=pinOriginContract(candidateOriginContract('count-distance-extremes-1',
  result.originReceipts.map(r=>({...r,attemptId:'live'}))));
 assert.throws(()=>verifyCandidateOrigins([row],context),/preparation/);
 assert.ok(result.originReceipts[0].rawClues.some(c=>c.id==='H2'));
});

test('new unchanged candidates and old historical rows have separate valid contracts',t=>{
 const old=source.rows.find(r=>r.testName==='B2-S03-V2-M011-A5-R787-V01'),base={...old.definition.logic,clues:[]};
 const own=createRouteWorkspace(base,{maxNodes:100000});
 const result=run({logic:base,targetRoute:old.definition.solution,workspace:own,
  cluePool:{clues:old.definition.logic.clues,completed:true,parametersExamined:4}});
 const row={...result.candidates[0],attemptId:'unchanged-control',puzzleExperimentFormatVersion:2};
 assert.equal(row.preparation.status,'unchanged');assert.ok(!Object.hasOwn(row,'normalization'));
 const contract=candidateOriginContract('count-distance-extremes-1',result.originReceipts.map(r=>({...r,attemptId:row.attemptId})));
 verifyCandidateOrigins([row],pinOriginContract(contract));
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'s04-b-unchanged-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const file=path.join(directory,'candidate.jsonl');fs.writeFileSync(file,JSON.stringify(row)+'\n');
 assert.equal(verifyCandidates(file,pinOriginContract(contract)).verifiedCandidates,1);
 const bad=structuredClone(row);bad.normalization=null;
 assert.throws(()=>verifyCandidateOrigins([bad],pinOriginContract(contract)));
 const originalOrigin=rawClueOrigin(old.definition.logic.clues);
 assert.equal(originalOrigin,rawClueOrigin([...old.definition.logic.clues].reverse()));
 assert.equal(row.preparation.rawOriginFingerprint,originalOrigin);
 assert.deepEqual(row.fingerprints,old.fingerprints);
 // The complete frozen record (including its old IDs and metadata) is recognized
 // without any newly required provenance field, even from a temporary file.
 verifyCandidateOrigins([old]);
 const downgraded=structuredClone(row);delete downgraded.preparation;
 assert.throws(()=>verifyCandidateOrigins([downgraded]));
 const inconsistent=structuredClone(contract);inconsistent.entries[0].status='normalized';
 assert.throws(()=>verifyCandidateOrigins([row],pinOriginContract(inconsistent)));
});

test('normalized zero/all text is natural using the unchanged technical formatter',()=>{
 const zero=normalized.definition.logic.clues.find(c=>c.placeId==='geo-01'&&c.fromHour===3&&c.toHour===6);
 assert.equal(technicalClueText(zero,logic.map),'Von Stunde 3 bis Stunde 6 war das Schiff nie genau 2 Hexfelder von dem Ort geo-01 (A5) entfernt.');
 const all=normalizeCountClues([{...zero,id:'a',fromHour:2,toHour:3,count:2},
  {...zero,id:'b',fromHour:4,toHour:5,count:2}]).clues[0];
 assert.equal(technicalClueText(all,logic.map),'Von Stunde 2 bis Stunde 5 war das Schiff in jeder Stunde genau 2 Hexfelder von dem Ort geo-01 (A5) entfernt.');
});

test('public exporter and game loader consume one five-clue definition and omit private provenance',async()=>{
 const original=readPlaytestSource('S02'),entry=original.registry.entries[0];
 const row={...original.rows[0],...normalized,assetPlacements:reference.assetPlacements};
 const binding={...entry,fingerprints:row.fingerprints,effectKey:row.effectKey,contentSha256:contentHash(row)};
 const stock={...original,rows:[row],registry:{...original.registry,entries:[binding]}};
 const files=buildPlaytest(stock),dto=JSON.parse(files.get(entry.testName+'.json'));
 assert.equal(dto.puzzle.logic.clues.length,5);assert.equal(Object.keys(dto.puzzle.presentation.clueTexts).length,5);
 assert.ok(!JSON.stringify(dto).includes('rawClues'));assert.ok(!JSON.stringify(dto).includes('normalization'));
 const prefix='.dev/b2-s02/';
 const loader=createPuzzleLoader({manifestUrl:'http://local/'+prefix+'manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1),bytes=ref.startsWith(prefix)?files.get(ref.slice(prefix.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 const puzzle=await loader.load(entry.testName);
 assert.deepEqual(puzzle.clues.map(({text,...c})=>c),normalized.definition.logic.clues);
 assert.deepEqual(puzzle.solution,target);
});

for(const [stock,name] of [['S03-V2','B2-S03-V2-M011-A5-R787-V01'],['BC','B2-BC-T06-M005-E3-R00']])
test('positive combination countercontrol remains intact: '+name,()=>{
 const s=readPlaytestSource(stock),entry=s.registry.entries.find(e=>e.testName===name);
 const row=s.rows.find(r=>r.fingerprints.variant===entry.fingerprints.variant),before=structuredClone(row);
 const prepared=normalizeCountClues(row.definition.logic.clues);
 assert.equal(prepared.changed,false);
 assert.deepEqual(prepared.clues.map(clueKey),row.definition.logic.clues.map(clueKey));
 const ownRules=createRules(row.definition.logic),legal=[...ownRules.routes([row.definition.logic.start],{remaining:100000})];
 const pair=row.definition.logic.clues.filter(c=>stock==='BC'?['H1','H2'].includes(c.id):['H2','H3'].includes(c.id));
 assert.ok(pair.every(c=>c.count>0&&c.count<c.toHour-c.fromHour+1));
 const pairLogic={...row.definition.logic,clues:pair};
 const pairOracle=solvePuzzle(pairLogic,{metrics:false,maxNodes:100000});
 assert.equal(legal.filter(r=>pair.every(c=>ownRules.matches(r,c))).length,pairOracle.count);
 assert.equal(pairOracle.count,stock==='BC'?264:8);
 assert.deepEqual(legal.filter(r=>prepared.clues.every(c=>ownRules.matches(r,c))),[row.definition.solution]);
 assert.deepEqual(logicalFingerprints({...row.definition,logic:{...row.definition.logic,clues:prepared.clues}}),row.fingerprints);
 assert.deepEqual(row,before);
});

test('historical mode and historical exports keep S03-06 as six separately identified clues',()=>{
 const old=run({normalization:'none'}).candidates[0];
 assert.deepEqual(old.definition,definition);assert.equal(old.normalization,undefined);
 assert.deepEqual(old.fingerprints,reference.fingerprints);
 assert.deepEqual(old.proof,reference.proof);assert.deepEqual(old.properties,reference.properties);
 const bytes=buildPlaytest(source).get(reference.testName+'.json'),dto=JSON.parse(bytes);
 assert.equal(dto.puzzle.logic.clues.length,6);assert.deepEqual(dto.puzzle.logic,definition.logic);
 assert.equal(Object.keys(dto.puzzle.presentation.clueTexts).length,6);
 assert.deepEqual(readPlaytestSource('S03-V2'),source);
});

test('historical artifacts and this PR preserve the fixed baseline; merged program files match their checkout',()=>{
 const base='974931e95d434a35ce34094f4d5244e289d6fd76';
 const paths=['docs/observations','docs/verification/S03','docs/verification/S03-v2','docs/verification/S04-A',
  'docs/verification/B2-deduction','docs/verification/B2-deduction-profile','docs/verification/B2-deduction-profile-v2',
  'docs/verification/B2-deduction-progress','src/engine','src/puzzles','scripts/lib/puzzle-route-solver.mjs',
  'scripts/lib/b2-local-deduction.mjs','scripts/lib/b2-deduction.mjs','scripts/lib/b2-deduction-profile.mjs',
  'scripts/lib/b2-markable-progress.mjs','scripts/lib/b2-stage-diagnostics.mjs','scripts/lib/b2-stage-routes.mjs',
  'scripts/lib/clue-text.mjs','scripts/lib/clue-presentation.mjs','scripts/lib/s03-quality.mjs'];
 const tree=execFileSync('git',['ls-tree','-r',base,'--',...paths],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
 assert.ok(tree.length>100);
 // Both the PR head and Actions' synthetic checkout can include main merges.
 // Audit PR-only commits; independently reconstruct every trusted main merge
 // to reject protected resolution edits. Do not exempt merge commits wholesale.
 const event=process.env.GITHUB_EVENT_NAME==='pull_request'?
  JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):null;
 const head=event?.pull_request.head.sha??'HEAD';
 const main=event?.pull_request.base.sha??'origin/main';
 assertBranchPreservesPaths({repository:ROOT,base,head,main,paths});
 const blobs=revision=>new Map(execFileSync('git',['ls-tree','-r',revision,'--',...paths],{cwd:ROOT,encoding:'utf8'})
  .trim().split('\n').map(line=>{const [,hash,ref]=/^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);return [ref,hash];}));
 const checkedOut=blobs('HEAD'),historical=new Map(tree.flatMap(line=>{
  const [,hash,ref]=/^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);return ref.startsWith('docs/')?[[ref,hash]]:[];
 }));
 assert.deepEqual(new Map([...checkedOut].filter(([ref])=>ref.startsWith('docs/'))),historical,
  'Historical file inventory or bytes changed from the fixed baseline');
 for(const line of tree){
  const [,hash,ref]=/^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);
  if(!ref.startsWith('docs/'))continue;
  const bytes=fs.readFileSync(path.join(ROOT,ref));
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),hash,ref);
 }
 for(const [ref,hash] of checkedOut)if(!ref.startsWith('docs/')){
  const bytes=fs.readFileSync(path.join(ROOT,ref));
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),hash,ref);
 }
 assert.equal(sha256(fs.readFileSync(path.join(ROOT,'docs/verification/S03-v2/run/candidates.jsonl'))),source.registry.candidatesSha256);
});

test('the three fixed-case evidence files reproduce without generation',()=>{
 assert.equal(normalizationReport(['--check']),'S04-B evidence reproduced byte-for-byte');
 assert.throws(()=>normalizationReport(['--unknown']),/Usage/);
});
