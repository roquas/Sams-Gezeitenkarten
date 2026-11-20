import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdentifiedLoader,puzzleContext} from '../../src/beta/context.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {definition,catalog} from '../fixtures/model/factories.mjs';
test('beta transport preserves validated F02 envelope identities without a second loader or additional request',async()=>{
 const identity={mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test',sourcePublicationId:'pub-test'},dto=projectPublicPuzzle(definition(),{identity});const requests=[];
 const manifest={schemaVersion:2,defaultId:'fixture',assetCatalog:'catalog.json',puzzles:[{id:'fixture',title:'Test',path:'fixture.json',kind:'test'}]};
 const loader=createIdentifiedLoader({manifestUrl:'https://example.test/deep/manifest.json',fetcher:async url=>{requests.push(String(url));return {ok:true,json:async()=>String(url).endsWith('manifest.json')?manifest:String(url).endsWith('catalog.json')?catalog():dto};}});
 const puzzle=await loader.load('fixture');assert.deepEqual(puzzle.identity,identity);assert.deepEqual(puzzle.solution,['C3','D3']);assert.equal(requests.length,3);puzzle.identity.variantId='var-changed';assert.equal(dto.identity.variantId,'var-test');
 await assert.rejects(loader.load('missing'),/unknown puzzle/);
});
test('catalog context keeps development stocks explicit and rejects unknown stock names',()=>{
 assert.equal(puzzleContext('').scope,'regular');assert.equal(puzzleContext('?stock=S02').scope,'regular');assert.equal(puzzleContext('?dev=b2&stock=S02').scope,'b2:S02');assert.throws(()=>puzzleContext('?dev=b2&stock=UNKNOWN'),/Unbekannter/);
});
