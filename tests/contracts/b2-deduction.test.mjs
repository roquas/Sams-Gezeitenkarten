import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyTrace} from '../helpers/b2-deduction-trace.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {buildDeductionReport,projectRoutes,historicalReference,REFERENCE_PATH} from '../../scripts/lib/b2-deduction.mjs';
import {reportFiles,OUTPUT,main} from '../../scripts/report-b2-deduction.mjs';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';

const report=buildDeductionReport();
test('every reference subset has sufficient reachable premises and agrees with the solver, including the hypothetical given',()=>{
 for(const c of report.cases)for(const s of c.analysis.scenarios){
  const logic={...c.logic,clues:[...c.logic.clues.filter(clue=>s.clueIds.includes(clue.id)),
   ...c.analysis.givens.map((g,i)=>({id:`G${i}`,type:'position',...g}))]};
  const oracle=solvePuzzle(logic,{metrics:false}),projection=projectRoutes(oracle.solutions);
  assert.deepEqual(projection,{routeCount:s.exact.routeCount,domains:s.exact.domains,transitions:s.exact.transitions});
  for(const property of ['domains','transitions'])for(let h=0;h<projection[property].length;h++)
   assert.ok(projection[property][h].every(value=>s.local[property][h].includes(value)));
  verifyTrace({...c.logic,clues:c.logic.clues.filter(clue=>s.clueIds.includes(clue.id))},
   s.local,oracle.solutions,{givens:c.analysis.givens});
  assert.equal(s.local.unsupported.length,0);
 }
});

test('combination-only claims are absent from every proper subset, not merely route reductions',()=>{
 for(const c of report.cases)for(const s of c.analysis.scenarios.filter(s=>s.combinationOnly)){
  const parents=c.analysis.scenarios.filter(p=>p.clueIds.length<s.clueIds.length&&p.clueIds.every(id=>s.clueIds.includes(id)));
  for(const [allowed,excluded] of [['domains','excludedFields'],['transitions','excludedTransitions']])
   for(let h=0;h<s.exact[allowed].length;h++){
    const expected=c.analysis.legal[allowed][h].filter(value=>!s.exact[allowed][h].includes(value)&&parents.every(p=>p.exact[allowed][h].includes(value)));
    assert.deepEqual(s.combinationOnly[excluded][h],expected);
   }
 }
});

test('T07 control preserves original and independently predicts an unresolved late remainder',()=>{
 const [t02,t07,control]=report.cases,full=c=>c.analysis.scenarios.at(-1);
 assert.equal(t02.analysis.legal.routeCount,1684);assert.equal(t07.analysis.legal.routeCount,2145);
 assert.deepEqual(full(t02).local.domains.slice(1).map(d=>d.length),[3,3,9,15,13,18]);
 assert.deepEqual(full(t07).local.domains.slice(1).map(d=>d.length),[1,1,3,4,5,8]);
 assert.deepEqual(full(control).local.domains.slice(1).map(d=>d.length),[1,1,1,2,2,4]);
 assert.deepEqual(t07.logic,control.logic);assert.deepEqual(t07.analysis.givens,[]);
 assert.deepEqual(control.analysis.givens,[{hour:3,cell:solvePuzzle(t07.logic,{metrics:false}).solutions[0][3]}]);
 assert.deepEqual(full(t07).exact.domains,full(control).exact.domains);
 assert.deepEqual(full(t07).gap.fixedHoursNotExplained,[3,4,5,6]);
 assert.deepEqual(full(control).gap.fixedHoursNotExplained,[4,5,6]);
});

test('actual unmodified historical reference is pinned and explicitly incompatible, never substituted',()=>{
 const bytes=fs.readFileSync(path.join(ROOT,REFERENCE_PATH)),ref=historicalReference();
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'3817cdaeb066644468af0f1d45935f0c00864e7b7270d6e444142ae58c864d50');
 assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),ref.source.gitBlob);
 assert.equal(ref.schemaVersion,1);assert.equal(ref.id,'quittung-nombreo');assert.equal(ref.status,'unsupported-original-schema');
 assert.equal(ref.exact,null);assert.equal(ref.local,null);assert.ok(ref.errors.length>0);
});

test('all offline artifacts reproduce byte for byte without changing source inventories',()=>{
 const refs=['scripts/config/b2-playtest-s01.json','scripts/config/b2-playtest-s02.json','scripts/config/b2-playtest-bc.json',
  'docs/verification/B2-search-comparison/candidates.jsonl','docs/verification/B2-S02/run/candidates.jsonl'];
 const hashes=()=>refs.map(ref=>createHash('sha256').update(fs.readFileSync(path.join(ROOT,ref))).digest('hex'));
 const before=hashes(),files=reportFiles(report),second=reportFiles();
 assert.deepEqual(files,second);
 for(const [name,content] of files)assert.equal(fs.readFileSync(path.join(ROOT,OUTPUT,name),'utf8'),content,name);
 assert.deepEqual(hashes(),before);assert.throws(()=>main(['--invented']),/Aufruf/);
});
