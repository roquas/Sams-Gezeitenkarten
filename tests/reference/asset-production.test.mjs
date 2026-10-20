import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {productionEnabled,validateLibrary,validatePlacements} from '../../src/assets/library.mjs';
import {placedCells} from '../../src/assets/geometry.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
const catalog=()=>read('assets/catalog/library.json');

test('production allows exactly eighteen approved places, at every legal anchor, with optional logical references',()=>{
 const library=catalog();
 assert.equal(library.assets.filter(a=>productionEnabled(library,a.id,'sea-blue-01')).length,18);
 for(const a of library.assets)for(const h of HEXES){
  const cells=placedCells(a,h.id);
  if(cells.some(c=>!HEXES.some(h=>h.id===c)))continue;
  const logic={grid:{columns:5,rows:5},blocked:a.role==='geographic'&&!a.passable?cells:[],places:{reference:{cells}}};
  for(const named of a.role==='geographic'?[false,true]:[false]){
   const placement=[{id:'test',assetId:a.id,anchor:h.id,...(named?{placeId:'reference'}:{})}];
   assert.deepEqual(validatePlacements(placement,library,logic,'sea-blue-01',{development:true}),[]);
   assert.equal(validatePlacements(placement,library,logic,'sea-blue-01').length===0,productionEnabled(library,a.id,'sea-blue-01'),a.id+' at '+h.id);
   for(const b of library.backgrounds.filter(b=>b.id!=='sea-blue-01'))assert.ok(validatePlacements(placement,library,logic,b.id).length);
  }
 }
});

test('separate release decision blocks even artistically approved deferred or historical files and fails closed',()=>{
 const library=catalog(),foam=library.assets.find(a=>a.id==='sea-life.accent.h1.foam.v1');
 const p=[{id:'foam',assetId:foam.id,anchor:'A1'}],logic={grid:{columns:5,rows:5},blocked:[],places:{}};
 assert.equal(library.reviews.find(r=>r.assetId===foam.id&&r.backgroundId==='sea-blue-01').status,'approved');
 for(const state of ['draft','deferred','historical']){
  foam.production=state;
  assert.equal(productionEnabled(library,foam.id,'sea-blue-01'),false);
  assert.ok(validatePlacements(p,library,logic,'sea-blue-01').some(e=>e.includes('not enabled for production')));
 }
 delete foam.production;assert.throws(()=>validateLibrary(library),/production/);
});

test('universal approval cannot transfer art to an unchecked background',()=>{
 const library=catalog(),a=library.assets.find(a=>a.production==='enabled');
 library.backgrounds.push({id:'new-sea',family:'blue-sea',image:library.backgrounds[0].image});
 library.reviews.push({...library.reviews.find(r=>r.assetId===a.id&&r.status==='approved'),backgroundId:'*'});
 assert.equal(productionEnabled(library,a.id,'new-sea'),false);
 assert.throws(()=>validateLibrary(library),/concrete hash-bound background/);
});

test('deferred foam cannot enter a compiled or loaded production puzzle despite its preserved artistic approval',async()=>{
 const document=read('puzzles/reference-3.6.json'),library=catalog();
 document.presentation.assetBackground='sea-blue-01';
 document.presentation.assetPlacements=[{id:'foam',assetId:'sea-life.accent.h1.foam.v1',anchor:'A1'}];
 assert.throws(()=>compilePuzzle(document,{assetLibrary:library}),/not enabled for production/);
 const loader=createPuzzleLoader({manifestUrl:new URL('https://example.test/puzzles/manifest.json'),fetcher:async url=>({ok:true,json:async()=>String(url).endsWith('manifest.json')?read('puzzles/manifest.json'):String(url).endsWith('library.json')?library:document})});
 await assert.rejects(loader.load(document.id),/not enabled for production/);
});
