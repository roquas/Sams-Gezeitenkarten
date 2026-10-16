import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chartOverlays} from '../../src/ui/chart-art.mjs';
const read=id=>JSON.parse(readFileSync(new URL(`../../puzzles/${id}.json`,import.meta.url)));
test('Dreifingerinsel shares one approved motif across all three blocked hexes',()=>{
 const p=read('ankerbuch-tesoro'),overlays=chartOverlays(p.presentation.overlays);
 const isle=overlays.filter(o=>o.cells.some(c=>['B3','C3','D3'].includes(c)));
 assert.equal(isle.length,1);assert.deepEqual(isle[0].cells,p.logic.places.isle.cells);
 assert.equal(isle[0].asset,'assets/seekarte/tesoro.png');assert.equal(isle[0].w,246);
 assert.equal(isle[0].h,112);assert.ok(isle[0].cells.every(c=>p.logic.blocked.includes(c)));
});
test('unnamed navigable landmark is explicitly located without changing its rule',()=>{
 const p=read('quittung-nombreo');assert.match(p.presentation.clues.H1,/Tintenriff \(D4\)/);
});

test('all four puzzle logic blocks and expected routes match the accepted PR baseline',()=>{
 const hashes={
  "reference-3.6": "aaab72d9b3456b84e747c7f7524846b016e9a5e132b13f5e653d59ebe651065a",
  "test-navigation": "6b0c0a60684962861fc7bc71365cdd6a98ed56a49482e605951028e598cddd13",
  "quittung-nombreo": "65458f81ee6cca0681bdcf0b3b5cc20d865d4b666d515b45ebac89d95a053ce2",
  "ankerbuch-tesoro": "0e5b444abf41c8dfd698daf39140cf3e844f0829cad2fbeb28ce9e811da2533c"
};
 for(const [id,hash] of Object.entries(hashes)){const p=read(id);assert.equal(createHash('sha256').update(JSON.stringify({logic:p.logic,solution:p.solution})).digest('hex'),hash,id);}
});
