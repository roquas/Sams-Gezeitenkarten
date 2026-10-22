import test from 'node:test';
import assert from 'node:assert/strict';
import {createPuzzleLoader,validateManifest} from '../../src/puzzles/loader.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {definition,catalog} from '../fixtures/model/factories.mjs';
const identity={mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'};
const manifest=()=>({schemaVersion:2,defaultId:'fixture',assetCatalog:'../resources/catalog.json',resourceBase:'../',puzzles:[{id:'fixture',title:'Test',path:'collection/fixture.json',kind:'test'}]});
test('loader resolves explicitly supplied package locations without repository names or puzzle lists',async()=>{
 const c=catalog(),dto=projectPublicPuzzle(definition(),{identity}),requests=[];
 const loader=createPuzzleLoader({manifestUrl:'https://package.example/arbitrary/catalog/index.json',fetcher:async url=>{
  requests.push(String(url));return {ok:true,json:async()=>String(url).endsWith('index.json')?manifest():String(url).endsWith('catalog.json')?c:dto};
 }});
 const p=await loader.load('fixture');assert.deepEqual(p.solution,['C3','D3']);assert.equal(p.resourceBaseUrl.href,'https://package.example/arbitrary/');
 await loader.load('fixture');assert.equal(requests.filter(u=>u.endsWith('resources/catalog.json')).length,1);
 assert.ok(requests.includes('https://package.example/arbitrary/catalog/collection/fixture.json'));
 await assert.rejects(loader.load('missing'),/unknown puzzle/);
});
test('empty catalogs are valid and unavailable catalogs give actionable errors',async()=>{
 validateManifest({schemaVersion:2,defaultId:null,puzzles:[]});
 assert.throws(()=>validateManifest({schemaVersion:2,defaultId:'missing',puzzles:[]}));
 const loader=createPuzzleLoader({manifestUrl:'https://example.test/catalog.json',fetcher:async()=>({ok:false,status:404})});await assert.rejects(loader.manifest(),/HTTP 404/);
 assert.throws(()=>createPuzzleLoader(),/explicit/);
});
test('loader rejects mismatched IDs, internal documents, invalid versions and malformed JSON',async()=>{
 for(const make of [()=>definition(),()=>({...projectPublicPuzzle(definition(),{identity}),projectionSchemaVersion:1}),()=>{const d=projectPublicPuzzle(definition(),{identity});d.puzzle.id='other';return d;}]){
  const loader=createPuzzleLoader({manifestUrl:'https://example.test/index.json',fetcher:async u=>({ok:true,json:async()=>String(u).endsWith('index.json')?manifest():String(u).endsWith('catalog.json')?catalog():make()})});await assert.rejects(loader.load('fixture'));
 }
 const loader=createPuzzleLoader({manifestUrl:'https://example.test/index.json',fetcher:async()=>({ok:true,json:async()=>{throw Error('invalid JSON');}})});await assert.rejects(loader.manifest(),/invalid JSON/);
});
