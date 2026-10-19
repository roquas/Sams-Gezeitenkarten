import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multihexPrototypes,multihexFixture} from '../../dev/multihex-prototypes.mjs';
import {reviewPositions} from '../../dev/review-positions.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {imageContract,placedCells} from '../../src/assets/geometry.mjs';
import {compatibility,validatePlacements} from '../../src/assets/library.mjs';
import {placeLabelLayout,labelFootprint,hexVertices,hexCenter,polygonsOverlap,containsPoint} from '../../src/ui/place-labels.mjs';
const library=JSON.parse(fs.readFileSync(new URL('../../assets/catalog/library.json',import.meta.url)));
const byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
const board=new Set(HEXES.map(h=>h.id));
for(const [i,p] of multihexPrototypes.entries())test(p.key+': single whole image, pending approval, every occupied hex blocked and labels safe at every valid anchor',()=>{
 const asset=library.assets.find(a=>a.id===p.id);
 assert.equal(asset.passable,false);assert.equal(asset.stage,'illustration');
 assert.equal(asset.geometry.cells.length,i===0?2:3);
 const contract=imageContract(asset.geometry.cells);
 assert.deepEqual([asset.image.width,asset.image.height],[contract.pixelWidth,contract.pixelHeight]);
 for(const bg of library.backgrounds)assert.equal(compatibility(library,p.id,bg.id),'pending');
 const positions=reviewPositions(asset);
 assert.deepEqual(positions.map(p=>[p.parity,p.location]),[['ungerade','Rand'],['ungerade','Innen'],['gerade','Rand'],['gerade','Innen']]);
 let checked=0;
 for(const h of HEXES){
  const cells=placedCells(asset,h.id);if(!cells.every(id=>board.has(id)))continue;checked++;
  const {blocked,puzzle}=multihexFixture(library,p,h.id);
  assert.deepEqual([...blocked],cells);assert.deepEqual(puzzle.places['review-island'].cells,cells);
  assert.equal(puzzle.assetPlacements.length,1);
  const label=placeLabelLayout(cells,p.name,blocked,byId);assert.ok(label);
  assert.equal(label.cells.length,cells.length);
  const footprint=labelFootprint(label,label.margin);
  assert.ok(footprint.every(v=>containsPoint(label.polygon,v)));
  for(const water of HEXES.filter(c=>!blocked.has(c.id)))assert.equal(polygonsOverlap(footprint,hexVertices(...hexCenter(water))),false);
  const logic={grid:{columns:5,rows:5},blocked:cells,places:puzzle.places};
  assert.ok(validatePlacements(puzzle.assetPlacements,library,logic,'sea-blue-01').some(e=>e.includes('not visually approved')));
  for(const omitted of cells)assert.ok(validatePlacements(puzzle.assetPlacements,library,{...logic,blocked:cells.filter(c=>c!==omitted)},'sea-blue-01',{development:true}).some(e=>e.includes('passable conflicts')));
 }
 assert.equal(checked,[20,16,14][i]);
});
