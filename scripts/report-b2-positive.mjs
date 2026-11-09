// Private reproducible evidence. Never imported by the browser or public export.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT} from './lib/b2-playtest.mjs';
import {POSITIVE_DIRECTORY,POSITIVE_DEFINITION,readPositiveDefinition,buildPositivePlaytest} from './lib/b2-positive.mjs';
import {diagnosePuzzle,projectRoutes,assertLocalSound} from './lib/b2-deduction.mjs';
import {localDeduction} from './lib/b2-local-deduction.mjs';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {solvePuzzle} from '../src/engine/solver.mjs';
import {cellsOf,adjacent,distance,direction} from '../src/engine/hex.mjs';
import {logicalFingerprints} from './lib/publication-archive.mjs';
import {sha256} from './lib/content-hash.mjs';

const json=value=>JSON.stringify(value,null,2)+'\n';
const select=(logic,ids)=>({...logic,clues:logic.clues.filter(c=>ids.includes(c.id))});
const ancestors=(trace,id)=>{
 const byId=new Map(trace.map(t=>[t.id,t])),seen=new Set();
 function visit(key){if(seen.has(key))return;seen.add(key);for(const parent of byId.get(key).premises)visit(parent);}
 visit(id);return seen;
};

export function positiveEvidence(definition=readPositiveDefinition()){
 const {logic}=definition,proof=checkIrredundancy(definition,{detailed:true});
 assert.equal(proof.irredundant,true);
 const diagnosis=diagnosePuzzle(logic),full=diagnosis.scenarios.at(-1);
 const scenario=ids=>diagnosis.scenarios.find(s=>s.clueIds.join()===ids.join());
 const early=scenario(['H1']),late=scenario(['H2']),place=scenario(['H3']);
 const combined=scenario(['H2','H3','H4']);
 // Fixed, preselected contract witnesses, not post-hoc scoring or search.
 assert.deepEqual(early.local.domains[1],['A2','B1']);
 assert.deepEqual(early.local.transitions[1],['A2>B2','B1>C1']);
 assert.ok(late.local.transitions[4].length<diagnosis.baselineLocal.transitions[4].length);
 assert.ok(late.local.transitions[4].length>1);
 assert.deepEqual(place.local.domains[5],['D2']);
 assert.ok(combined.combinationOnly.fixedTransitions.includes(1));
 assert.deepEqual(combined.local.transitions[0],['A1>B1']);
 for(const ids of [['H2','H3'],['H2','H4'],['H3','H4']]){
  assert.ok(scenario(ids).local.transitions[0].length>1);
  assert.ok(scenario(ids).exact.transitions[0].length>1);
 }
 assert.equal(full.gap.fieldCount,0);assert.equal(full.gap.transitionCount,0);
 assert.equal(full.local.fixedHours.length,7);assert.equal(full.local.fixedTransitions.length,6);
 const ablations=logic.clues.map(clue=>{
  const partial={...logic,clues:logic.clues.filter(c=>c.id!==clue.id)};
  const local=localDeduction(partial),exact=projectRoutes(solvePuzzle(partial,{metrics:false}).solutions);
  assertLocalSound(exact,local);
  return {omitted:clue.id,exact,local};
 });
 // E is not a detached consequence: without any necessary part of D, both
 // the transition and its proposed downstream hour remain open, even exactly.
 for(const id of ['H2','H3','H4']){
  const a=ablations.find(a=>a.omitted===id);
  for(const state of [a.exact,a.local]){
   assert.ok(state.transitions[0].length>1);assert.ok(state.domains[2].length>1);
  }
 }
 const fixedField=hour=>full.local.trace.find(t=>t.kind==='field'&&t.hour===hour&&t.fixed);
 const d=fixedField(1),e=fixedField(2),next=fixedField(3),finish=fixedField(6);
 assert.ok(ancestors(full.local.trace,e.id).has(d.id));
 assert.ok(ancestors(full.local.trace,next.id).has(e.id));
 assert.ok(ancestors(full.local.trace,finish.id).has(next.id));
 // Independently replay the small hand-written geometric argument. No complete
 // route is tried and no solver projection seeds these sets.
 const bc=localDeduction(select(logic,['H2','H3']));
 const earlyFields=early.local.domains[1];
 const predecessor=cellsOf(logic.map.grid).filter(c=>direction(c,'D2')==='SE');
 assert.deepEqual(predecessor,['D1']);
 const first=earlyFields.filter(c=>distance(c,predecessor[0])===2);
 assert.deepEqual(first,['B1']);
 const second=early.local.domains[2].filter(c=>direction(first[0],c)==='E');
 assert.deepEqual(second,['C1']);
 const third=bc.domains[3].filter(c=>c!==second[0]);
 assert.deepEqual(bc.domains[3],['C1','C2']);assert.deepEqual(third,['C2']);
 const finalOptions=cellsOf(logic.map.grid).filter(c=>adjacent('D2',c)&&distance(c,'E5')===3);
 assert.deepEqual(finalOptions,['C2','E2']);
 assert.deepEqual(finalOptions.filter(c=>c!==third[0]),['E2']);
 return {format:'b2-positive-evidence-1',proof,diagnosis,ablations,
  contract:{A:true,B:true,C:true,D:true,E:true,F:true,humanPlaytest:'pending',
   centralClues:['H2','H3','H4'],centralArrivalHour:1,followingHour:2,
   traceWitnesses:{centralField:d.id,followingField:e.id,nextField:next.id,finalField:finish.id},
   note:'D fixes a field and its incoming transition. Later steps cite the field certificate, not the terminal transition log entry.'},
  handCertificate:{earlyFields,latePredecessor:predecessor,centralField:first,followingField:second,
   intermediateBefore:bc.domains[3],intermediateAfter:third,finalBefore:finalOptions,finalAfter:['E2']}};
}

export function positiveReportFiles(){
 const definition=readPositiveDefinition(),evidence=positiveEvidence(definition),publicFiles=buildPositivePlaytest(definition);
 const inputs=[POSITIVE_DEFINITION,POSITIVE_DIRECTORY+'/contract.md',POSITIVE_DIRECTORY+'/private/attempt-0.json',
  POSITIVE_DIRECTORY+'/private/construction.md','scripts/report-b2-positive.mjs','scripts/lib/b2-positive.mjs',
  'scripts/lib/b2-deduction.mjs','scripts/lib/b2-local-deduction.mjs','src/engine/puzzle.mjs','src/engine/hex.mjs',
  'src/engine/solver.mjs','src/engine/validate.mjs','src/puzzles/schema.mjs','src/puzzles/analysis.mjs',
  'src/puzzles/public.mjs','src/puzzles/validate.mjs','src/puzzles/loader.mjs',
  'src/assets/library.mjs','src/assets/geometry.mjs','scripts/lib/puzzle-clues.mjs','assets/catalog/library.json'];
 const compact=state=>({...state,local:{...state.local,trace:state.local.trace.map(({before,after,...t})=>t)}});
 return new Map([
  ['evidence.json',json({format:evidence.format,constructionNodeVersion:'v24.19.0',baseCommit:'a8f8cbf97005b3ad888d8443fb40e3118781f717',
   contractCommit:'ada62ad',constructionAttempts:2,revisions:1,
   inputs:inputs.map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(ROOT,ref)))})),
   publicFiles:[...publicFiles].map(([name,bytes])=>({name,sha256:sha256(bytes)})),
   fingerprints:logicalFingerprints(definition),proof:evidence.proof,contract:evidence.contract,
   handCertificate:evidence.handCertificate,legal:evidence.diagnosis.legal,
   fullGap:evidence.diagnosis.scenarios.at(-1).gap})],
  ['diagnosis.jsonl',evidence.diagnosis.scenarios.map(compact).map(JSON.stringify).join('\n')+'\n'],
  ['ablations.jsonl',evidence.ablations.map(compact).map(JSON.stringify).join('\n')+'\n']
 ]);
}

export function main(argv=process.argv.slice(2)){
 if(argv.length!==1||!['--write','--check'].includes(argv[0]))throw Error('Usage: report-b2-positive.mjs --write|--check (private artifacts)');
 const output=path.join(ROOT,POSITIVE_DIRECTORY,'private');
 for(const [name,bytes] of positiveReportFiles()){
  const target=path.join(output,name);
  if(argv[0]==='--write')fs.writeFileSync(target,bytes);
  else assert.equal(fs.readFileSync(target,'utf8'),bytes,'Private reference evidence changed: '+name);
 }
 return 'Positive reference: private evidence '+(argv[0]==='--write'?'written.':'reproduced byte-for-byte.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
