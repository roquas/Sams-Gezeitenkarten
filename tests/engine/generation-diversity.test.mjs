import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleMaps} from '../../scripts/sample-maps.mjs';

test('fixed seeds expose shapes, sizes, fragmentation and explicit filter selection without asset inputs',()=>{
 const free=sampleMaps(),filtered=sampleMaps({filtered:true});
 assert.deepEqual(free,sampleMaps());assert.deepEqual(filtered,sampleMaps({filtered:true}));
 assert.equal(free.statuses.generated,128);assert.equal(filtered.statuses.generated,128);
 assert.deepEqual(Object.keys(free.objectSizes),['1','2','3','4']);
 // Only gross degeneration checks, no claim of uniform sampling or puzzle quality.
 assert.ok(free.distinctMaps>1);assert.ok(Object.keys(free.shapes).length>4);
 assert.ok(Object.keys(free.objectCounts).length>1);assert.ok(Object.keys(free.passableComponentCounts).length>1);
 assert.ok(free.routeStatuses['no-route']>0);assert.equal(filtered.routeStatuses['route-found'],128);
 assert.ok(filtered.attempts>free.attempts);
 assert.notDeepEqual(filtered.passableComponentCounts,free.passableComponentCounts);
 assert.notDeepEqual(filtered.occupiedCells,free.occupiedCells);
});
