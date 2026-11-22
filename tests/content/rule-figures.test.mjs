import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const provenance=JSON.parse(readFileSync(new URL('../../docs/verification/B1-rules/figure-provenance.json',import.meta.url)));
test('teaching crops match their recorded source and have no redundant same-hour candidates after certainty',()=>{
 for(const name of ['hours','marks']){
  const png=readFileSync(new URL(`../../assets/rules/${name}.png`,import.meta.url));
  assert.equal(createHash('sha256').update(png).digest('hex'),provenance.sha256[name]);
  const state=provenance.figureStates?.[name]?.state??provenance.state;
  const cells=name==='hours'?['B2']:['A2','B2','C2'];
  const notes=cells.map(id=>state.marks[`${state.layer}:${id}`]);
  assert.equal(notes.filter(m=>m==='yes').length,1);
  assert.ok(!notes.includes('maybe'));
 }
 const hours=provenance.figureStates?.hours?.state??provenance.state;
 assert.equal(hours.layer,2);assert.equal(hours.marks['2:B2'],'yes');
 assert.equal(hours.marks['5:B2'],'maybe');
});
