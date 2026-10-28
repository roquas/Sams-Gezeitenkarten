import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMap} from '../../src/generation/maps.mjs';
import {catalogProfile} from '../fixtures/model/generation-catalog.mjs';

test('profile normalization ignores enumeration and duplicate footprints and rejects invalid metadata',()=>{
 const r=generateMap({seed:2,catalogProfile});
 assert.deepEqual(r,generateMap({seed:2,catalogProfile:{...catalogProfile,placements:[...catalogProfile.placements].reverse().concat(catalogProfile.placements)}}));
 for(const change of [p=>p.version='other',p=>p.catalogSha256='invalid',p=>p.placements[0].rotation=60,
  p=>p.placements[0].cells=['A1','E5'],p=>p.placements[0].cells=['Z9']]){
  const p=structuredClone(catalogProfile);change(p);assert.throws(()=>generateMap({seed:0,catalogProfile:p}),{code:'INVALID_CONFIG'});
 }
});

test('analysis budgets and assignment do not enter geographic random streams or identities',()=>{
 const options={seed:1,catalogProfile},a=generateMap(options);
 assert.deepEqual(a.map,generateMap({...options,config:{analysis:{steps:[1,6],maxNodes:1}}}).map);
 assert.deepEqual(a,generateMap(options));
});
