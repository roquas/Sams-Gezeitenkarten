import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {referencePuzzle} from '../../puzzles/reference-3.6.mjs';
import {chartOverlays,parchmentTiles} from '../../src/ui/chart-art.mjs';
test('approved watercolor assets remain byte-identical to 1f4d1a5',()=>{
 const hashes={'leuchtturm.png':'f02522e107915228f0af80f22bfee249f8cd511b','meer-pergament.webp':'90ae6af746fb4ef835e67e18606662b398e9331e','segelschiff.png':'d45d3b230adb99b3b9ceaab70b9ee435ddac8ce9','tesoro.png':'9398499c1b463658d97e40d24fcb94083b107275'};
 for(const [file,sha] of Object.entries(hashes)){
  const b=readFileSync(new URL('../../assets/seekarte/'+file,import.meta.url));
  assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),sha);
 }
});
test('temporary reuse preserves motif positions and avoids archived artwork',()=>{
 const overlays=chartOverlays(referencePuzzle.overlays);
 assert.equal(overlays.length,7);
 for(const o of overlays){assert.match(o.asset,/^assets\/seekarte\/(tesoro|segelschiff|leuchtturm)\.png$/);assert.ok(referencePuzzle.overlays.some(old=>old.cells.join()===o.cells.join()));}
 assert.equal(overlays.filter(o=>o.asset.endsWith('segelschiff.png')).length,2);
 assert.throws(()=>chartOverlays([{asset:'missing.png'}]),/Unmapped/);
});
test('parchment slices join without gaps and leave space for margin headings',()=>{
 const tiles=parchmentTiles();assert.equal(tiles.length,9);
 assert.equal(tiles[0].x,-44);assert.equal(tiles[8].x+tiles[8].width,519);
 assert.equal(tiles[0].y,-44);assert.equal(tiles[8].y+tiles[8].height,429);
 for(let row=0;row<3;row++)for(let col=0;col<2;col++)assert.equal(tiles[row*3+col].x+tiles[row*3+col].width,tiles[row*3+col+1].x);
});
