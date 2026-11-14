import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readPlaytestSource,buildPlaytest,playtestStock} from '../../scripts/lib/b2-playtest.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';

for(const stock of ['S01','S02','BC'])test(`${stock}: exported count texts reach the game loader with identical predicates and solution sets`,async()=>{
 const source=readPlaytestSource(stock),before=structuredClone(source),files=buildPlaytest(source);
 const directory=playtestStock(stock).output+'/';
 const loader=createPuzzleLoader({manifestUrl:`http://local/${directory}manifest.json`,fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);
  const bytes=ref.startsWith(directory)?files.get(ref.slice(directory.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 let countClues=0,hourZero=0,multihex=0;
 for(const entry of source.registry.entries){
  const row=source.rows.find(r=>r.fingerprints.variant===entry.fingerprints.variant);
  const dto=JSON.parse(files.get(entry.testName+'.json')),puzzle=await loader.load(entry.testName);
  assert.deepEqual(dto.puzzle.logic,row.definition.logic);
  assert.deepEqual(puzzle.clues.map(({text,...clue})=>clue),row.definition.logic.clues);
  assert.deepEqual(puzzle.solution,row.definition.solution);
  const original=createRules(row.definition.logic),rendered=createRules(puzzle);
  const routes=[...original.routes()];
  // Compare every clue's truth value on every legal route, not just the target.
  for(const route of routes)for(const [i,clue] of row.definition.logic.clues.entries())
   assert.equal(rendered.matches(route,puzzle.clues[i]),original.matches(route,clue),entry.testName+'/'+clue.id);
  assert.deepEqual(routes.filter(route=>puzzle.clues.every(clue=>rendered.matches(route,clue))),[row.definition.solution]);
  for(const clue of puzzle.clues.filter(c=>c.type==='countDistanceToPlace')){
   countClues++;if(clue.fromHour===0)hourZero++;
   if(puzzle.map.objects.find(o=>o.id===clue.placeId).cells.length>1)multihex++;
   assert.equal(clue.text,dto.puzzle.presentation.clueTexts[clue.id]);
   assert.match(clue.text,/war das Schiff/);
   assert.ok(!clue.text.includes('beträgt der Hexabstand'));
  }
 }
 assert.ok(countClues>0&&hourZero>0&&multihex>0,'real stock covers historical hour zero and multihex places');
 assert.deepEqual(source,before,'no migration or source mutation');
});
