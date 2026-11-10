// Fixed hand construction: subset validation is evidence, never candidate search.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT} from './lib/b2-playtest.mjs';
import {readPositiveV2Definition,buildPositiveV2Playtest,POSITIVE_V2_DIRECTORY} from './lib/b2-positive-v2.mjs';
import {localDeduction} from './lib/b2-local-deduction.mjs';
import {projectRoutes,assertLocalSound} from './lib/b2-deduction.mjs';
import {solvePuzzle} from '../src/engine/solver.mjs';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {cellsOf,adjacent,distance,direction} from '../src/engine/hex.mjs';
import {sha256} from './lib/content-hash.mjs';

export const CENTRAL=['H1','H2','H3','H6'];
export function ancestors(trace,id){
 const byId=new Map(trace.map(t=>[t.id,t])),seen=new Set();
 function visit(key){if(seen.has(key))return;seen.add(key);byId.get(key).premises.forEach(visit);}
 visit(id);return seen;
}
export function positiveV2Evidence(definition=readPositiveV2Definition()){
 const {logic}=definition,proof=checkIrredundancy(definition,{detailed:true});
 assert.equal(logic.steps,6);assert.equal(logic.clues.length,6);assert.equal(proof.irredundant,true);
 const states=Array.from({length:64},(_,mask)=>{
  const clues=logic.clues.filter((_,i)=>mask&(1<<i)),partial={...logic,clues};
  // Local input receives only the puzzle constraints, before computing the oracle.
  const local=localDeduction(partial),exact=projectRoutes(solvePuzzle(partial,{metrics:false}).solutions);
  assertLocalSound(exact,local);
  return {clueIds:clues.map(c=>c.id),local,exact};
 });
 const state=ids=>states.find(s=>s.clueIds.length===ids.length&&ids.every(id=>s.clueIds.includes(id)));
 const full=states.at(-1),before=state(['H1','H2','H3']),central=state(CENTRAL);
 assert.deepEqual(state(['H3']).local.domains[5],['D2']); // GUI-markable entry.
 assert.deepEqual(before.local.domains[2],['C1','B2']);
 assert.deepEqual(before.local.domains[3],['C1','C2']);
 assert.deepEqual(before.local.domains[4],['D1']);
 assert.deepEqual(central.local.domains[3],['C2']);
 // Every proper subset, including the four maximal omissions, leaves D open.
 for(const s of states)if(s.clueIds.every(id=>CENTRAL.includes(id))&&s.clueIds.length<CENTRAL.length)
  for(const method of ['local','exact'])assert.ok(s[method].domains[3].length>1);
 for(const id of CENTRAL){
  const omitted=state(logic.clues.filter(c=>c.id!==id).map(c=>c.id));
  for(const method of ['local','exact'])assert.ok(omitted[method].domains[3].length>1);
 }
 const count=logic.clues.find(c=>c.id==='H6');
 assert.equal(count.type,'countDistanceToPlace');assert.equal(count.fromHour,2);assert.equal(count.toHour,4);
 assert.equal(count.count,2);assert.equal(count.distance,1);assert.equal(count.placeId,'count-buoy');
 const place=logic.map.objects.find(o=>o.id===count.placeId);
 assert.deepEqual(place.cells,['C2']);
 const hit=c=>distance(c,place.cells[0])===count.distance;
 const countOnly={...logic,clues:[count]};
 const hitPatterns=[...new Set(solvePuzzle(countOnly,{metrics:false}).solutions.map(r=>
  [2,3,4].filter(h=>hit(r[h])).join(',')))].sort();
 assert.deepEqual(hitPatterns,['2,3','2,4','3,4']);
 assert.ok(state(['H6']).exact.domains[3].length>1);
 // Independent small geometric certificate: no route enumeration or solver seeds.
 const cells=cellsOf(logic.map.grid),first=cells.filter(c=>adjacent(logic.start,c));
 const second=cells.filter(c=>first.some(a=>direction(a,c)==='E'));
 const fourth=cells.filter(c=>direction(c,'D2')==='SE');
 const third=cells.filter(c=>adjacent(c,fourth[0])&&c!=='D2'&&distance(logic.start,c)<=3);
 assert.deepEqual(first,['B1','A2']);assert.deepEqual(second,['C1','B2']);
 assert.deepEqual(fourth,['D1']);assert.deepEqual(third,['C1','C2']);
 assert.ok(second.every(hit));assert.ok(fourth.every(hit));
 const centralAfter=third.filter(c=>!hit(c));assert.deepEqual(centralAfter,['C2']);
 const finalBefore=cells.filter(c=>adjacent('D2',c)&&distance(c,'E5')===3);
 assert.deepEqual(finalBefore,['C2','E2']);
 assert.deepEqual(finalBefore.filter(c=>!centralAfter.includes(c)),['E2']);
 assert.deepEqual(state(['H1','H2','H3','H5']).local.domains[6],['C2','E2']);
 assert.deepEqual(state([...CENTRAL,'H5']).local.domains[6],['E2']);
 const fixed=(h)=>full.local.trace.find(t=>t.kind==='field'&&t.hour===h&&t.fixed);
 const d=fixed(3),e=fixed(6),countStep=full.local.trace.find(t=>t.rule==='count-bounds'&&t.hour===3);
 assert.ok(countStep);assert.ok(ancestors(full.local.trace,d.id).has(countStep.id));
 assert.ok(ancestors(full.local.trace,e.id).has(d.id));
 assert.equal(full.local.fixedHours.length,7);assert.equal(full.local.fixedTransitions.length,6);
 for(const key of ['domains','transitions'])assert.deepEqual(full.local[key],full.exact[key]);
 return {proof,states,contract:{technical:{A:true,B:true,C:true,D:true,E:true,F:true},
  playablePath:'documented, not empirically validated',humanPlaytest:'pending',difficulty:'unrated',
  centralClues:CENTRAL,centralHour:3,followingHour:6,
  traceWitnesses:{count:countStep.id,central:d.id,following:e.id}},
  handCertificate:{first,second,fourth,third,hitPatterns,centralAfter,finalBefore,finalAfter:['E2']}};
}
export function positiveV2ReportFiles(){
 const definition=readPositiveV2Definition(),e=positiveV2Evidence(definition);
 const refs=[POSITIVE_V2_DIRECTORY+'/contract.md',POSITIVE_V2_DIRECTORY+'/private/attempt-0.json',
  POSITIVE_V2_DIRECTORY+'/private/definition.json',POSITIVE_V2_DIRECTORY+'/private/construction.md',
  'scripts/report-b2-positive-v2.mjs','scripts/lib/b2-positive-v2.mjs','scripts/lib/b2-local-deduction.mjs',
  'tests/helpers/b2-deduction-trace.mjs','src/engine/hex.mjs','src/engine/puzzle.mjs','src/engine/solver.mjs',
  'scripts/lib/b2-deduction.mjs','src/engine/validate.mjs','src/puzzles/analysis.mjs','src/puzzles/public.mjs',
  'src/puzzles/schema.mjs','src/puzzles/validate.mjs','src/puzzles/loader.mjs',
  'scripts/lib/puzzle-clues.mjs','src/assets/library.mjs','src/assets/geometry.mjs','assets/catalog/library.json'];
 return new Map([
  ['evidence.json',JSON.stringify({format:'b2-positive-v2-evidence-1',baseCommit:'21f9bf5a9b0c0e6179815fa238e8fd640c54a3be',
   contractCommit:'95024e5',constructionAttempts:1,revisions:0,subsetCount:e.states.length,
   inputs:refs.map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(ROOT,ref)))})),
   publicFiles:[...buildPositiveV2Playtest(definition)].map(([name,bytes])=>({name,sha256:sha256(bytes)})),
   proof:e.proof,contract:e.contract,handCertificate:e.handCertificate},null,2)+'\n'],
  ['states.jsonl',e.states.map(s=>JSON.stringify({...s,local:{...s.local,
   trace:s.local.trace.map(({before,after,...t})=>t)}})).join('\n')+'\n']
 ]);
}
export function main(argv=process.argv.slice(2)){
 if(argv.length!==1||!['--write','--check'].includes(argv[0]))throw Error('Usage: report-b2-positive-v2.mjs --write|--check');
 for(const [name,bytes] of positiveV2ReportFiles()){
  const target=path.join(ROOT,POSITIVE_V2_DIRECTORY,'private',name);
  if(argv[0]==='--write')fs.writeFileSync(target,bytes);
  else assert.equal(fs.readFileSync(target,'utf8'),bytes,'V2 evidence changed: '+name);
 }
 return 'B2 V2 private evidence '+(argv[0]==='--write'?'written.':'reproduced byte-for-byte.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error);process.exitCode=1;}
}
