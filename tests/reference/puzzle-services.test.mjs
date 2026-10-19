import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateDefinition,validateLogicDefinition,DefinitionError} from '../../scripts/lib/puzzle-contract.mjs';
import {analyzeDefinition,checkIrredundancy} from '../../scripts/lib/puzzle-analysis.mjs';
import {publicPuzzleSchema,projectPublicPuzzle,validatePublicPuzzle} from '../../scripts/lib/public-puzzle.mjs';
import {createArchiveProjector} from '../../scripts/lib/archive-projection.mjs';
import {logicalFingerprints,resolveLegacy,sha256} from '../../scripts/lib/publication-archive.mjs';
import {schemaErrors} from '../../src/puzzles/schema.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import * as archived from './reference-rules.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const bytes=path=>readFileSync(new URL('../../'+path,import.meta.url));
const read=path=>JSON.parse(bytes(path));
const fixture=read('tests/fixtures/puzzle-services/internal-v1.json');
const expectedPublic=read('tests/fixtures/puzzle-services/public-v1.json');
const reference=read('puzzles/reference-3.6.json');
const archive=read('archive/publications-v1.json');
const options={rulesVersion:'gezeitenkarten-1'};
const projectionOptions={...options,identity:expectedPublic.identity};
const clone=value=>structuredClone(value);
const historicalIds=['reference-3.6','test-navigation','quittung-nombreo','ankerbuch-tesoro'];
function withClues(clues){
 const d=clone(fixture);d.logic.clues=clues;
 d.presentation.clues=Object.fromEntries(clues.map(c=>[c.id,c.id]));return d;
}
const six=()=>{
 const d=clone(reference);d.logic.clues.shift();delete d.presentation.clues.I;return d;
};

test('all historical definitions validate and analyze with the unchanged routes and identities',()=>{
 for(const id of historicalIds){
  const d=read(`puzzles/${id}.json`),entry=resolveLegacy(archive,id);
  assert.equal(validateDefinition(d,options).targetRoute,'valid');
  const result=analyzeDefinition(d,options);
  assert.equal(result.status,'unique');assert.equal(result.count,1);assert.equal(result.countExact,true);
  assert.deepEqual(result.uniqueSolution,d.solution);assert.equal(result.target.status,'match');
  for(const [key,value] of Object.entries(logicalFingerprints(d)))assert.equal(value,entry.fingerprints[key]);
  assert.equal(sha256(bytes(`puzzles/${id}.json`)),entry.source.sha256);
 }
});

test('validation without target accepts public, ambiguous and unsatisfiable definitions without solving them',()=>{
 const d=clone(fixture);delete d.solution;
 assert.equal(validateDefinition(d,options).targetRoute,'absent');
 for(const clues of [[{id:'P',type:'position',hour:0,cell:'C3'}],[{id:'P',type:'position',hour:1,cell:'C3'}]]){
  const p=withClues(clues);delete p.solution;
  assert.equal(validateDefinition(p,options).semantic,true);
 }
});

test('validation identifies structure, semantics and target failures separately',()=>{
 for(const [mutate,phase] of [
  [d=>d.logic.clues[0].type='future','structure'],[d=>d.logic.clues[0].hour=0,'structure'],
  [d=>d.logic.clues[0].hour=2,'semantics'],[d=>d.logic.blocked=['C3'],'semantics'],
  [d=>d.solution=['C3','A1'],'target'],[d=>d.solution=['C3','B3'],'target']
 ]){const d=clone(fixture);mutate(d);assert.throws(()=>validateDefinition(d,options),error=>error instanceof DefinitionError&&error.phase===phase);}
});

test('all new interfaces reject unknown rules, schemas and data revisions instead of falling back',()=>{
 for(const mutate of [d=>d.schemaVersion=2,d=>d.dataVersion=2,d=>d.rulesVersion='gezeitenkarten-2']){
  const d=clone(fixture);mutate(d);
  for(const fn of [()=>validateDefinition(d,options),()=>validateLogicDefinition(d,options),()=>analyzeDefinition(d,options),()=>projectPublicPuzzle(d,projectionOptions)])assert.throws(fn,/version:/);
 }
 for(const fn of [()=>validateDefinition(fixture),()=>analyzeDefinition(fixture,{rulesVersion:'gezeitenkarten-2'}),
  ()=>projectPublicPuzzle(fixture,{...projectionOptions,rulesVersion:'gezeitenkarten-2'})])assert.throws(fn,/version:/);
});

test('logic analysis ignores absent or malformed editorial data and private metadata',()=>{
 const definition={schemaVersion:1,dataVersion:1,logic:clone(fixture.logic),solution:fixture.solution};
 assert.deepEqual(checkIrredundancy(definition,options),checkIrredundancy({...definition,presentation:42,metadata:{seed:12},analysis:'stale'},options));
 assert.equal(validateLogicDefinition(definition,options).rulesVersion,'gezeitenkarten-1');
});

test('bounded and detailed analysis distinguish six known one-step solutions, one solution and zero solutions',()=>{
 const known=[['C3','B2'],['C3','B3'],['C3','B4'],['C3','C2'],['C3','C4'],['C3','D3']];
 const ambiguous=withClues([{id:'P',type:'position',hour:0,cell:'C3'}]);delete ambiguous.solution;
 const bounded=analyzeDefinition(ambiguous,options),exact=analyzeDefinition(ambiguous,{...options,detailed:true});
 assert.equal(bounded.status,'ambiguous');assert.equal(bounded.count,2);assert.equal(bounded.countExact,false);
 assert.equal(bounded.search.completed,false);assert.equal(bounded.search.legalRoutesVisited,2);
 assert.deepEqual(exact.solutions.map(r=>r.join(',')).sort(),known.map(r=>r.join(',')).sort());
 assert.equal(exact.count,6);assert.equal(exact.countExact,true);
 const impossible=withClues([{id:'P',type:'position',hour:1,cell:'C3'}]);delete impossible.solution;
 const zero=analyzeDefinition(impossible,options);assert.equal(zero.status,'unsolvable');assert.equal(zero.count,0);assert.equal(zero.countExact,true);
 assert.equal(analyzeDefinition(fixture,options).count,1);
});

test('wrong or missing internal targets produce explicit analysis diagnoses, never a false quality pass',()=>{
 const wrong=clone(fixture);wrong.solution=['C3','B3'];
 assert.throws(()=>validateDefinition(wrong,options),/Sollroute/);
 const mismatch=checkIrredundancy(wrong,options);
 assert.equal(mismatch.target.status,'mismatch');assert.equal(mismatch.irredundant,false);
 assert.ok(mismatch.diagnostics.some(d=>d.code==='target-mismatch'));
 delete wrong.solution;const missing=checkIrredundancy(wrong,options);
 assert.equal(missing.irredundant,false);assert.ok(missing.diagnostics.some(d=>d.code==='target-required'));
 wrong.solution=['C3','A1'];const invalid=checkIrredundancy(wrong,options);
 assert.equal(invalid.target.status,'invalid');assert.equal(invalid.irredundant,false);
});

test('historical redundant clue I is diagnosed but historical validity remains unchanged',()=>{
 const result=checkIrredundancy(reference,options);
 assert.equal(result.irredundant,false);assert.equal(result.target.status,'match');
 assert.deepEqual(result.diagnostics,[{code:'redundant-clue',clueId:'I'}]);
 assert.equal(result.omissions[0].count,1);assert.equal(result.omissions[0].necessary,false);
 assert.equal(validateDefinition(reference,options).semantic,true);
 assert.equal(compilePuzzle(reference).analysis.status,'unique');
});

test('irredundancy and exact removal counts agree with the independent archived predicates',()=>{
 const d=six(),all=archived.routes();
 const exact=checkIrredundancy(d,{...options,detailed:true}),bounded=checkIrredundancy(d,options);
 assert.equal(exact.irredundant,true);assert.equal(bounded.irredundant,true);
 assert.deepEqual(exact.uniqueSolution,archived.solution);
 const alternatives=d.logic.clues.map((clue,i)=>all.filter(r=>archived.predicates.every((predicate,j)=>j===0||j===i+1||predicate(r))));
 assert.deepEqual(alternatives.map(a=>a.length),[6,4,4,2,2,2]);
 assert.deepEqual(exact.omissions.map(row=>row.count),alternatives.map(a=>a.length));
 assert.deepEqual(bounded.omissions.map(row=>row.count),[2,2,2,2,2,2]);
 assert.ok(bounded.omissions.every(row=>row.necessary&&!row.countExact));
 assert.notDeepEqual(alternatives[0],alternatives[1]);
 for(let i=0;i<d.logic.clues.length;i++){
  const partial={...d,logic:{...d.logic,clues:d.logic.clues.filter((_,j)=>j!==i)}};
  assert.deepEqual(analyzeDefinition(partial,{...options,detailed:true}).solutions,alternatives[i]);
 }
});

test('two individually redundant constraints cannot be removed together',()=>{
 const d=withClues([{id:'A',type:'direction',hour:1,direction:'E'},{id:'B',type:'direction',hour:1,direction:'E'}]);
 const result=checkIrredundancy(d,options);
 assert.equal(result.irredundant,false);
 assert.deepEqual(result.omissions.map(row=>[row.clueId,row.count,row.necessary]),[['A',1,false],['B',1,false]]);
 // Independent oracle: no constraints permits all six neighbours.
 assert.equal(archived.cells.filter(c=>archived.neighbors('C3',c)).length,6);
});

test('removing more constraints cannot restore uniqueness after an individually necessary clue is removed',()=>{
 const d=six(),all=archived.routes();
 for(let i=1;i<archived.predicates.length;i++)for(let j=i+1;j<archived.predicates.length;j++){
  const single=all.filter(r=>archived.predicates.every((p,k)=>k===0||k===i||p(r)));
  const pair=all.filter(r=>archived.predicates.every((p,k)=>k===0||k===i||k===j||p(r)));
  assert.ok(single.length>=2&&pair.length>=single.length);
 }
 assert.equal(checkIrredundancy(d,options).irredundant,true);
});

test('additional help and old analysis data do not alter the basis quality or mutate its clues',()=>{
 const d=six(),before=JSON.stringify(d),baseline=checkIrredundancy(d,options);
 d.presentation.hints.push('Hour one is E3.');d.extraHelp=[{hour:1,cell:'E3'}];d.analysis={count:99};
 assert.deepEqual(checkIrredundancy(d,options),baseline);
 const original=six();checkIrredundancy(original,options);assert.equal(JSON.stringify(original),before);
});

test('the existing engine budget bounds the stream and full analyses; exhaustion never claims success',()=>{
 for(const maxNodes of [0,-1,1.5,NaN])assert.throws(()=>checkIrredundancy(fixture,{...options,maxNodes}),/Suchbudget/);
 for(const detailed of [false,true])assert.throws(()=>checkIrredundancy(reference,{...options,detailed,maxNodes:1}),/Suchbudget/);
 const d=withClues([{id:'P',type:'position',hour:0,cell:'C3'}]);delete d.solution;
 assert.equal(analyzeDefinition(d,{...options,maxNodes:3}).status,'ambiguous');
 assert.throws(()=>analyzeDefinition(d,{...options,maxNodes:3,detailed:true}),/Suchbudget/);
});

test('public projection matches a complete independently specified fixture and excludes target/provenance',()=>{
 const result=projectPublicPuzzle(fixture,projectionOptions);
 assert.deepEqual(result,expectedPublic);assert.equal(validatePublicPuzzle(result),result);
 assert.deepEqual(schemaErrors(result,publicPuzzleSchema),[]);
 assert.equal('solution' in result.puzzle,false);assert.equal('metadata' in result.puzzle,false);
 assert.deepEqual(compilePuzzle(result.puzzle).solution,fixture.solution); // Projection is not spoiler protection.
});

test('projection preserves every historic UI field including assets, optional results and prepared help',()=>{
 for(const id of historicalIds){
  const d=read(`puzzles/${id}.json`);d.resultTexts={correct:'Done',incorrect:'Retry'};
  const result=projectPublicPuzzle(d,projectionOptions).puzzle;
  for(const key of ['id','schemaVersion','dataVersion','logic','presentation','resultTexts'])assert.deepEqual(result[key],d[key]);
 }
});

test('future unknown private fields at root and nested levels cannot leak through the positive projection',()=>{
 const d=clone(reference),secret='DO-NOT-PUBLISH-F03';
 for(const key of ['analysis','generator','seed','archive','futurePrivate'])d[key]={secret};
 d.logic.futurePrivate={secret};d.logic.clues[0].privateAudit={secret};
 d.logic.places.reef.privateFootprint={secret};d.presentation.overlays[0].privateCheck={secret};
 d.resultTexts={correct:'Public',privateResult:secret};
 const result=projectPublicPuzzle(d,{...projectionOptions,identity:{...projectionOptions.identity,fingerprint:secret}});
 assert.equal(JSON.stringify(result).includes(secret),false);
 assert.equal('solution' in result.puzzle,false);
});

test('public DTO validation rejects solution, analysis, fingerprints, private metadata and extra identities',()=>{
 for(const mutate of [p=>p.puzzle.solution=fixture.solution,p=>p.analysis={},p=>p.puzzle.metadata={},
  p=>p.identity.fingerprints={},p=>p.puzzle.logic.seed=42,p=>p.puzzle.presentation.overlays=[{seed:1}],
  p=>p.projectionSchemaVersion=2,p=>p.rulesVersion='gezeitenkarten-2',p=>p.puzzle.dataVersion=2]){
  const p=clone(expectedPublic);mutate(p);assert.throws(()=>validatePublicPuzzle(p));
 }
});

test('projection is deterministic, detached and rejects malformed known content or internal targets',()=>{
 const before=JSON.stringify(reference),first=projectPublicPuzzle(reference,projectionOptions),second=projectPublicPuzzle(reference,projectionOptions);
 assert.equal(JSON.stringify(first),JSON.stringify(second));
 const reversed=value=>Array.isArray(value)?value.map(reversed):value&&typeof value==='object'?
  Object.fromEntries(Object.entries(value).reverse().map(([key,v])=>[key,reversed(v)])):value;
 assert.equal(JSON.stringify(second),JSON.stringify(projectPublicPuzzle(reversed(reference),projectionOptions)));
 first.puzzle.logic.blocked.push('A1');first.puzzle.presentation.hints.push('Changed');
 assert.equal(JSON.stringify(reference),before);
 for(const mutate of [d=>d.solution=['C3','A1'],d=>d.logic.clues[0].type='unknown',d=>d.logic.clues[0].hour=7,
  d=>delete d.presentation.overlays,d=>d.presentation.overlays=null,d=>delete d.logic.places,d=>d.logic.places=null,d=>d.resultTexts=null]){
  const d=clone(fixture);mutate(d);assert.throws(()=>projectPublicPuzzle(d,projectionOptions));
 }
});

test('public DTO imports have no Node dependencies and are outside the unchanged runtime graph',()=>{
 const seen=new Set();
 function visit(url){
  if(seen.has(url.href))return;seen.add(url.href);
  const text=readFileSync(url,'utf8');
  for(const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
   assert.ok(match[1].startsWith('.'),match[1]);visit(new URL(match[1],url));
  }
 }
 visit(new URL('../../scripts/lib/public-puzzle.mjs',import.meta.url));
 assert.ok(!seen.has(new URL('../../scripts/lib/archive-projection.mjs',import.meta.url).href));
});

test('archive-backed previews link stable IDs to verified original bytes without changing F02 records',()=>{
 const before=JSON.stringify(archive),cache=new Map();
 const readBytes=(path,commit)=>{
  const key=commit+':'+path;
  if(!cache.has(key))cache.set(key,execFileSync('git',['show',key],{cwd:root,maxBuffer:32*1024*1024}));
  return cache.get(key);
 };
 const mutable=clone(archive),projector=createArchiveProjector(mutable,{readBytes});
 mutable.publications[0].variantId='var-changed-outside';
 for(const id of historicalIds){
  const entry=resolveLegacy(archive,id),d=read(`puzzles/${id}.json`),before=logicalFingerprints(d);
  const projected=projector.project(entry.publicationId);
  assert.deepEqual(projected.identity,{mapStructureId:entry.mapStructureId,instanceId:entry.instanceId,variantId:entry.variantId,sourcePublicationId:entry.publicationId});
  assert.equal(projected.puzzle.id,id);assert.equal('solution' in projected.puzzle,false);
  assert.deepEqual(logicalFingerprints(d),before);
  assert.throws(()=>logicalFingerprints(projected.puzzle),/target route required/);
 }
 assert.equal(JSON.stringify(archive),before);
 assert.throws(()=>projector.project('pub-missing'),/Unknown source/);
 const entry=archive.publications[0],snapshot=archive.snapshots[0];
 cache.set(snapshot.commit+':'+entry.source.path,Buffer.from('{}'));
 assert.throws(()=>projector.project(entry.publicationId),/bytes changed/);
});
