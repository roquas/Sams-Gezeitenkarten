import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {landingPuzzle} from '../../scripts/prepare-landing-puzzle.mjs';
import {readPositiveV2Definition} from '../../scripts/lib/b2-positive-v2.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {coordinateMarkup,coordinateTextMarkup,pretty} from '../../src/ui/coordinates.mjs';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('six-hour default is the validated reference with exact logical identities and public-only projection',()=>{
 const source=readPositiveV2Definition(),bytes=read('puzzles/drei-peilungen.json');
 assert.equal(bytes,landingPuzzle());
 const dto=JSON.parse(bytes),manifest=JSON.parse(read('puzzles/manifest.json'));
 assert.equal(manifest.defaultId,'drei-peilungen');assert.deepEqual(manifest.puzzles.map(p=>p.id),['model-demo','drei-peilungen']);
 assert.deepEqual(dto.puzzle.logic,source.logic);assert.equal(dto.puzzle.logic.steps,6);
 const fp=logicalFingerprints(source);
 assert.deepEqual(dto.identity,Object.fromEntries(Object.entries(fp).map(([key,value],i)=>[
  ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+value.split(':')[1]])));
 const assetLibrary=JSON.parse(read('assets/catalog/library.json'));
 const compiled=compilePuzzle(dto.puzzle,{assetLibrary});
 assert.deepEqual(compiled.solution,source.solution);assert.equal(compiled.analysis.count,1);
 assert.equal(Object.hasOwn(dto.puzzle,'solution'),false);assert.equal(Object.hasOwn(dto.puzzle,'metadata'),false);
 assert.equal(dto.puzzle.presentation.hints.length,4);
 assert.equal(read('puzzles/model-demo.json'),execFileSync('git',['show','928dd1a:puzzles/model-demo.json'],{encoding:'utf8'}));
});
test('coordinate notation shares the same labeled badges across every legal cell and supported spelling',()=>{
 for(const col of 'ABCDE')for(let row=1;row<=5;row++){
  const id=col+row,markup=coordinateMarkup(id);
  assert.ok(markup.includes(`aria-label="${pretty(id)}"`));assert.ok(markup.includes('role="img"'));
  assert.equal(coordinateTextMarkup(id),markup);assert.equal(coordinateTextMarkup(pretty(id)),markup);
 }
 assert.equal(coordinateTextMarkup('γ / V'),coordinateMarkup('C3'));
 for(const id of ['A0','F1','A6','<img>'])assert.equal(coordinateMarkup(id),'');
});
