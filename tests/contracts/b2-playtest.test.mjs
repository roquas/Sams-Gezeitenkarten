import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,buildPlaytest,readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {technicalClueText} from '../../scripts/lib/clue-text.mjs';

const source=readPlaytestSource(),files=buildPlaytest(source);
test('B2 exports all 95 unfiltered candidates through the existing public loader and solution control',async()=>{
 const requests=[];
 const loader=createPuzzleLoader({manifestUrl:'http://local/.dev/b2/manifest.json',fetcher:async url=>{
  const ref=new URL(url).pathname.slice(1);requests.push(ref);
  const bytes=ref.startsWith('.dev/b2/')?files.get(ref.slice('.dev/b2/'.length)):fs.readFileSync(path.join(ROOT,ref),'utf8');
  return {ok:!!bytes,json:async()=>JSON.parse(bytes)};
 }});
 const manifest=await loader.manifest();
 assert.equal(manifest.puzzles.length,96);
 assert.ok(manifest.puzzles.some(e=>e.id==='model-demo'));
 await loader.load('model-demo');
 const types=new Set();
 for(const binding of source.registry.entries){
  const original=source.rows.find(r=>r.fingerprints.variant===binding.fingerprints.variant);
  const puzzle=await loader.load(binding.testName),rules=createRules(puzzle);
  assert.equal(puzzle.title,binding.testName);
  assert.deepEqual(puzzle.solution,original.definition.solution);
  assert.deepEqual({...original.definition.logic,clues:puzzle.clues.map(({text,...c})=>c)},original.definition.logic);
  assert.deepEqual(puzzle.map,original.definition.logic.map);
  assert.equal(puzzle.start,original.definition.logic.start);
  assert.equal(puzzle.steps,original.definition.logic.steps);
  assert.deepEqual(puzzle.assetPlacements,original.assetPlacements);
  assert.ok(rules.legal(puzzle.solution)&&puzzle.clues.every(c=>rules.matches(puzzle.solution,c)));
  const other=[...rules.routes()].find(route=>route.join()!==puzzle.solution.join());
  if(other)assert.ok(puzzle.clues.some(c=>!rules.matches(other,c)));
  for(const c of puzzle.clues){types.add(c.type);assert.ok(c.text.length);assert.ok(!c.text.includes('undefined'));}
  const dto=JSON.parse(files.get(binding.testName+'.json'));
  assert.deepEqual(dto.puzzle.logic,original.definition.logic);
  assert.ok(!Object.hasOwn(dto.puzzle,'solution'));
  assert.ok(!Object.hasOwn(dto,'proof'));
  assert.deepEqual(Object.keys(dto).sort(),['identity','projectionSchemaVersion','puzzle','rulesVersion']);
 }
 assert.equal(types.size,6);
 assert.ok(!requests.some(ref=>ref.startsWith('docs/')));
});
test('export is byte-reproducible and names survive reordering and removal of other entries',()=>{
 assert.deepEqual(buildPlaytest(source),files);
 const reversed=structuredClone(source);reversed.rows.reverse();reversed.registry.entries.reverse();
 assert.deepEqual(buildPlaytest(reversed),files);
 const subset=structuredClone(source);subset.registry.entries.splice(0,1);
 subset.rows=subset.rows.filter(r=>subset.registry.entries.some(e=>e.fingerprints.variant===r.fingerprints.variant));
 const reduced=buildPlaytest(subset);
 for(const entry of subset.registry.entries)assert.equal(reduced.get(entry.testName+'.json'),files.get(entry.testName+'.json'));
});
test('binding rejects changed definitions, solutions, art, identities, source runs and missing candidates',()=>{
 const mutations=[
  s=>{s.rows[0].definition.logic.clues[0].count++;},
  s=>{s.rows[0].definition.solution.reverse();},
  s=>{s.rows[0].assetPlacements[0].anchor='E5';},
  s=>{s.rows[0].fingerprints.variant+='0';},
  s=>{s.rows[0].effectKey+='0';},
  s=>{s.rows[0].experimentId+='0';},
  s=>{s.rows.pop();},
  s=>{s.registry.entries[1].testName=s.registry.entries[0].testName;},
  s=>{s.registry.entries[0].fingerprints.instance+='0';},
  s=>{s.manifest.experimentId+='0';}
 ];
 for(const mutate of mutations){const changed=structuredClone(source);mutate(changed);assert.throws(()=>buildPlaytest(changed),/B2 export:/);}
});
test('technical text states all six clue meanings, with signs, interval endpoints and multi-cell places',()=>{
 const map={objects:[{id:'isle',cells:['B2','C2']}]};
 const text=c=>technicalClueText(c,map);
 assert.equal(text({type:'position',hour:0,cell:'A1'}),'Position in Stunde 0: A1.');
 for(const [direction,label] of Object.entries({E:'Ost',SE:'Südost',SW:'Südwest',W:'West',NW:'Nordwest',NE:'Nordost'})){
  assert.equal(text({type:'direction',hour:1,direction}),`Fahrtrichtung von Stunde 0 zu Stunde 1: ${label}.`);
 }
 for(const degrees of [-180,-120,-60,0,60,120,180]){
  const result=text({type:'turn',hour:2,degrees});
  assert.ok(result.includes('unmittelbar vorherigen Fahrtrichtung'));
  assert.ok(result.includes(degrees===0?'geradeaus (0°)':`${Math.abs(degrees)}° ${degrees>0?'rechts':'links'}`));
 }
 assert.equal(text({type:'distanceToPlace',hour:0,placeId:'isle',distance:0}),'Hexabstand in Stunde 0 zu Ort isle (B2, C2): genau 0.');
 assert.equal(text({type:'distanceBetweenHours',hours:[0,6],distance:4}),'Hexabstand zwischen den Positionen in Stunde 0 und Stunde 6: genau 4.');
 assert.equal(text({type:'countDistanceToPlace',fromHour:0,toHour:6,placeId:'isle',distance:1,count:0}),'In den Stunden 0 bis 6 (beide einschließlich) beträgt der Hexabstand zu Ort isle (B2, C2) niemals genau 1.');
 assert.throws(()=>text({type:'invented'}),/Unsupported/);
});
