import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {puzzleSchema} from '../../src/puzzles/schema.mjs';
import {compilePuzzle,validatePuzzle} from '../../src/puzzles/validate.mjs';
import {createPuzzleLoader,validateManifest} from '../../src/puzzles/loader.mjs';
import {solvePuzzle} from '../../src/engine/solver.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {storageKey,loadState,saveState} from '../../src/persistence/storage.mjs';
import {initialState} from '../../src/state/game-state.mjs';
import {MOTIFS,BACKGROUNDS} from '../../src/puzzles/assets.mjs';
import {referencePuzzle} from '../../puzzles/reference-3.6.mjs';
const read=path=>JSON.parse(fs.readFileSync(new URL('../../'+path,import.meta.url)));
const source=()=>read('puzzles/reference-3.6.json');
const modified=fn=>{const d=source();fn(d);return d;};

test('published JSON Schema equals the executable schema',()=>assert.deepEqual(read('puzzles/schema/puzzle-v1.schema.json'),puzzleSchema));
test('reference transfer retains route, every clue, text, geometry and original overlays',()=>{
 const d=source(),p=compilePuzzle(d);
 for(const key of ['grid','blocked','start','steps','clues','solution','overlays'])assert.deepEqual(p[key],referencePuzzle[key]);
 assert.equal(p.analysis.legalRouteCount,519);assert.equal(p.analysis.count,1);
 assert.deepEqual(p.analysis.metrics.redundantClueIds,['I']);
});
test('every manifest puzzle is present and uniquely solvable; assets actually exist',()=>{
 const m=validateManifest(read('puzzles/manifest.json'));
 for(const path of [...Object.values(BACKGROUNDS),...Object.values(MOTIFS).filter(Boolean).map(m=>'assets/seekarte/'+m.asset)])assert.ok(fs.existsSync(new URL('../../'+path,import.meta.url)),path);
 for(const entry of m.puzzles){const d=read('puzzles/'+entry.path),p=compilePuzzle(d);assert.equal(d.id,entry.id);assert.equal(p.analysis.status,'unique');if(d.solution)assert.deepEqual(p.analysis.solutions,[d.solution]);}
});
test('both optional result texts may independently be absent; logic remains identical',()=>{
 for(const resultTexts of [undefined,{}, {correct:'Gut!'}, {incorrect:'Noch nicht.'},{correct:'Gut!',incorrect:'Noch nicht.'}]){
  const d=source();if(resultTexts)d.resultTexts=resultTexts;assert.equal(compilePuzzle(d).analysis.count,1);
 }
});
test('schema rejects unknown version, fields, clues and malformed clue parameters with paths',()=>{
 for(const mutate of [d=>d.schemaVersion=2,d=>d.logic.steps=7,d=>d.logic.clues[0].type='unknown',d=>d.logic.clues[0].hour=0,d=>d.logic.clues[1].degrees=30,d=>d.logic.start='Z9',d=>d.logic.blocked.push('B3'),d=>d.resultTexts={correct:42},d=>d.logic.extra=true,d=>delete d.presentation])assert.throws(()=>validatePuzzle(modified(mutate)),/Rätsel.*\$/);
});
test('semantic validation catches duplicate IDs, references, land/start, place kinds, hours and assets',()=>{
 for(const mutate of [d=>d.logic.start='B3',d=>d.logic.places.tesoro.kind='reef',d=>d.logic.clues[1].id='I',d=>d.logic.clues[2].place='missing',d=>delete d.presentation.clues.I,d=>d.presentation.places.ghost='Ghost',d=>d.presentation.overlays[0].asset='missing.png',d=>d.logic.steps=3,d=>d.logic.clues[6].hours=[6,3],d=>d.logic.clues[6].count=7,d=>d.solution.reverse()])assert.throws(()=>validatePuzzle(modified(mutate)),/Rätsel/);
});
test('solver ignores stored solution and distinguishes unique, ambiguous and unsolvable',()=>{
 const d=source();d.logic.solution=['garbage'];assert.deepEqual(solvePuzzle(d.logic).solutions,[d.solution]);
 const ambiguous={...d.logic,clues:[]};assert.equal(solvePuzzle(ambiguous).count,519);assert.equal(solvePuzzle(ambiguous).status,'ambiguous');
 const impossible={...d.logic,clues:[{id:'x',type:'position',hour:1,cell:d.logic.start}]};assert.equal(solvePuzzle(impossible).status,'unsolvable');
 assert.throws(()=>solvePuzzle(d.logic,{maxNodes:1}),/Suchbudget/);
});
test('publication rejects ambiguous/unsolvable definitions and incorrect stored solution',()=>{
 const ambiguous=source();ambiguous.logic.clues=ambiguous.logic.clues.slice(0,1);ambiguous.presentation.clues={I:ambiguous.presentation.clues.I};delete ambiguous.solution;
 assert.throws(()=>compilePuzzle(ambiguous),/ambiguous/);
 ambiguous.logic.clues=[{id:'I',type:'position',hour:1,cell:'D4'}];assert.throws(()=>compilePuzzle(ambiguous),/unsolvable/);
 const wrong=source();wrong.solution=createRules(wrong.logic).routes().next().value;assert.throws(()=>compilePuzzle(wrong),/Sollroute/);
});
test('each typed predicate accepts and rejects controlled cases with shared semantics',()=>{
 const d=source(),rules=createRules(d.logic),route=d.solution;
 const pairs=[
 [{type:'position',hour:1,cell:'E3'},{type:'position',hour:1,cell:'A1'}],
 [{type:'direction',hour:1,direction:'NE'},{type:'direction',hour:1,direction:'W'}],
 [{type:'turn',hour:2,degrees:-60},{type:'turn',hour:2,degrees:60}],
 [{type:'adjacentToPlace',hour:4,place:'tesoro'},{type:'adjacentToPlace',hour:6,place:'tesoro'}],
 [{type:'distanceToPlace',hour:5,place:'lighthouse',distance:1},{type:'distanceToPlace',hour:5,place:'lighthouse',distance:2}],
 [{type:'distanceBetweenHours',hours:[1,3],distance:2},{type:'distanceBetweenHours',hours:[1,3],distance:3}],
 [{type:'countAdjacentToPlace',hours:[3,6],place:'tesoro',count:2},{type:'countAdjacentToPlace',hours:[3,6],place:'tesoro',count:3}]
 ];for(const [yes,no] of pairs){assert.equal(rules.matches(route,yes),true);assert.equal(rules.matches(route,no),false);}
 assert.equal(rules.coast('B3','tesoro'),false);assert.equal(rules.legal(['D4','C3']),false);
 const multi={...d.logic,places:{both:{kind:'island',cells:['B3','C3']}}};assert.equal(createRules(multi).matches(route,{type:'distanceToPlace',hour:4,place:'both',distance:1}),true);
});
test('metrics are reproducible enumeration evidence, not claimed human difficulty',()=>{
 const a=solvePuzzle(source().logic);assert.equal(a.metrics.remainingCandidates.at(-1).count,1);assert.equal(a.metrics.withoutClue.length,7);assert.equal(a.metrics.forcedEarlySteps.length,6);assert.equal(a.metrics.difficulty.provisional,true);assert.equal(a.metrics.clueTypes.length,6);
});
test('loader resolves static files and handles HTTP, JSON, manifest and ID failures',async()=>{
 const manifest=read('puzzles/manifest.json');
 const fetcher=async url=>({ok:true,json:async()=>read('puzzles/'+new URL(url).pathname.split('/').at(-1))});
 const loader=createPuzzleLoader({manifestUrl:new URL('https://example.test/puzzles/manifest.json'),fetcher});
 assert.equal((await loader.manifest()).defaultId,'reference-3.6');assert.equal((await loader.load('test-navigation')).start,'A5');await assert.rejects(loader.load('missing'),/unbekannte/);
 for(const fetcher of [async()=>({ok:false,status:404}),async()=>({ok:true,json:async()=>{throw Error('invalid JSON');}})])await assert.rejects(createPuzzleLoader({fetcher}).manifest(),/Datei/);
 for(const bad of [{...manifest,defaultId:'missing'},{...manifest,puzzles:[...manifest.puzzles,manifest.puzzles[0]]},{...manifest,puzzles:[{...manifest.puzzles[0],path:'../bad.json'}]}])assert.throws(()=>validateManifest(bad));
 const wrong=createPuzzleLoader({fetcher:async url=>({ok:true,json:async()=>String(url).endsWith('manifest.json')?manifest:{...source(),id:'wrong'}})});await assert.rejects(wrong.load('reference-3.6'),/Manifest/);
});
test('versioned persistence migrates the reference once, preserves other puzzles and ignores stale revisions',()=>{
 const p=compilePuzzle(source()),other=compilePuzzle(read('puzzles/test-navigation.json')),values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const old={...initialState(p),marks:{'1:E3':'yes'},route:['D4','E3']};storage.setItem('gezeitenkarten-reference-3.6-v0.1',JSON.stringify(old));
 assert.deepEqual(loadState(p,storage).marks,old.marks);saveState(p,loadState(p,storage),storage);
 assert.deepEqual(loadState(other,storage).route,['A5']);saveState(other,{...initialState(other),marks:{'2:C5':'maybe'}},storage);
 saveState(p,initialState(p),storage);assert.deepEqual(loadState(p,storage).marks,{});assert.deepEqual(loadState(other,storage).marks,{'2:C5':'maybe'});
 assert.deepEqual(loadState({...p,dataVersion:2},storage).marks,{});assert.notEqual(storageKey(p),storageKey(other));assert.ok(values.has('gezeitenkarten-reference-3.6-v0.1'));
});
