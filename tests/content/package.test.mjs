import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateAssetFiles} from '../../scripts/validate-assets.mjs';
import {validatePuzzles} from '../../scripts/validate-puzzles.mjs';
import {validateLibrary,productionEnabled} from '../../src/assets/library.mjs';
import {librarySchema} from '../../src/assets/library.mjs';
test('installed asset package validates references, provenance, geometry and exact approval hashes',()=>{
 const catalog=validateAssetFiles(JSON.parse(fs.readFileSync('assets/catalog/library.json')));validateLibrary(catalog);
 for(const a of catalog.assets)if(a.production==='enabled'){
  assert.equal(a.stage,'illustration');assert.ok(catalog.backgrounds.some(b=>productionEnabled(catalog,a.id,b.id)),a.id);
 }
 assert.deepEqual(JSON.parse(fs.readFileSync('puzzles/schema/asset-library-v2.schema.json')),librarySchema);
});
test('all optional catalog entries validate and solve without freezing the package size or puzzle names',async()=>{
 for(const result of await validatePuzzles())assert.equal(result.status,'unique',result.id);
});
test('guaranteed UI resources are available independently of optional puzzle assets',()=>{
 for(const path of ['assets/seekarte/sea-blue-01.webp','assets/seekarte/frame-parchment-01.webp','assets/seekarte/frame-parchment-02.webp','assets/ui/paper-grain.webp'])assert.ok(fs.statSync(path).isFile());
});
