import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMap,CATALOG_GENERATOR_VERSION} from '../../src/generation/maps.mjs';
import {assignAssets,createCatalogProfile} from '../../src/assets/assignment.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {asset,catalog} from '../fixtures/model/factories.mjs';
import {syntheticCatalog} from '../fixtures/model/asset-context.mjs';
import {sampleCatalogMaps} from '../../scripts/sample-catalog-maps.mjs';

test('optional catalog footprints reproduce diverse valid maps while preserving requested sizes/passabilities',()=>{
 const c=syntheticCatalog(catalog([asset(),asset('test.port',[[0,0]],true),asset('test.double',[[0,0],[1,0]])]));
 const profile=createCatalogProfile(c),options={config:{objectCount:5,objectSizes:[1,2],passableProbability:0.5},catalogProfile:profile};
 const maps=new Set();let favored=0,growth=0,misses=0;
 for(let seed=0;seed<64;seed++){
  const r=generateMap({...options,seed}),plain=generateMap({seed,config:options.config});
  assert.equal(r.status,'generated');validateMap(r.map);assert.deepEqual(r,generateMap({...options,seed}));
  assert.equal(r.diagnostics.generatorVersion,CATALOG_GENERATOR_VERSION);assert.deepEqual(Object.keys(r.map).sort(),['geometry','grid','objects']);
  assert.deepEqual(r.map.objects.map(o=>[o.cells.length,o.passable]),plain.map.objects.map(o=>[o.cells.length,o.passable]));
  const counters=r.diagnostics.attemptLog[0].catalog;favored+=counters.preferredPlacements;growth+=counters.growthPlacements;misses+=counters.catalogMisses;
  maps.add(JSON.stringify(r.map));assert.deepEqual(assignAssets({map:r.map,seed,catalog:c}),assignAssets({map:r.map,seed,catalog:c}));
 }
 assert.ok(maps.size>60);assert.ok(favored>0&&growth>0&&misses>0);
});

test('free vectors and assignment ignore catalog changes and independent analysis parameters',()=>{
 const seed=1,free=generateMap({seed}),c=syntheticCatalog(catalog([asset(),asset('test.other')]));
 const before=assignAssets({map:free.map,seed,catalog:c});
 generateMap({seed,catalogProfile:createCatalogProfile(c)});
 assert.deepEqual(free,generateMap({seed}));
 const analyzed=generateMap({seed,config:{analysis:{steps:[1,6],maxNodes:1}}});
 assert.deepEqual(analyzed.map,free.map);assert.deepEqual(assignAssets({map:analyzed.map,seed,catalog:c}),before);
 const different=syntheticCatalog(catalog([]));generateMap({seed,catalogProfile:createCatalogProfile(different)});
 assignAssets({map:free.map,seed,catalog:different});assert.deepEqual(free,generateMap({seed}));
});

test('empty/ineligible profiles fall back to the exact free sequence without hidden route filters',()=>{
 const profile=createCatalogProfile(syntheticCatalog(catalog([])));
 for(let seed=0;seed<12;seed++){
  const config={passableProbability:0},free=generateMap({seed,config}),informed=generateMap({seed,config,catalogProfile:profile});
  assert.deepEqual(informed.map,free.map);assert.equal(informed.status,'generated');assert.deepEqual(informed.analysis.startCells,[]);
 }
 const single=syntheticCatalog(catalog()),r=generateMap({seed:0,config:{objectCount:1,objectSizes:[2],passableProbability:1},catalogProfile:createCatalogProfile(single,{preferencePercent:100})});
 assert.equal(r.map.objects[0].passable,true);assert.equal(r.map.objects[0].cells.length,2);
 assert.equal(assignAssets({map:r.map,seed:0,catalog:single}).status,'none');
});

test('profile normalization rejects invalid geometry/transforms and ignores enumeration/duplicate painting weights',()=>{
 const c=syntheticCatalog(catalog()),profile=createCatalogProfile(c),r=generateMap({seed:2,catalogProfile:profile});
 assert.deepEqual(r,generateMap({seed:2,catalogProfile:{...profile,placements:[...profile.placements].reverse().concat(profile.placements)}}));
 for(const change of [p=>p.version='other',p=>p.preferencePercent=101,p=>p.catalogSha256='invalid',
  p=>p.placements[0].rotation=60,p=>p.placements[0].cells=['A1','E5'],p=>p.placements[0].cells=['Z9']]){
  const p=structuredClone(profile);change(p);assert.throws(()=>generateMap({seed:0,catalogProfile:p}),{code:'INVALID_CONFIG'});
 }
 const zero=createCatalogProfile(c,{preferencePercent:0});assert.deepEqual(generateMap({seed:1,catalogProfile:zero}).map,generateMap({seed:1}).map);
});

test('fixed comparison exposes coverage, oriented diversity, uncovered objects and separate work counts',()=>{
 const c=syntheticCatalog(catalog([asset(),asset('test.port',[[0,0]],true),asset('test.double',[[0,0],[1,0]])]));
 const options={seedCount:32,config:{objectCount:5,objectSizes:[1,2],passableProbability:0.25}};
 const report=sampleCatalogMaps(c,options),{free,catalogInformed:informed}=report.modes;
 assert.deepEqual(report,sampleCatalogMaps(c,options));
 assert.equal(free.statuses.generated,32);assert.equal(informed.statuses.generated,32);
 assert.ok(informed.assigned>free.assigned);assert.ok(informed.distinctMaps>1&&informed.distinctShapes>1);
 assert.ok(informed.profileWork.footprintChecks>0);assert.ok(free.assignmentCandidateChecks>0);
 assert.ok(free.unassignedSizesByPassability['true:2']>0);assert.notDeepEqual(free.shapes,informed.shapes);
 assert.equal(report.singleCellExample.assignment.status,'complete');
});
