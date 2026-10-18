import fs from 'node:fs/promises';
import {validateManifest} from '../src/puzzles/loader.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
import {validateAssetFiles} from './validate-assets.mjs';
const base=new URL('../puzzles/',import.meta.url);
const read=async path=>JSON.parse(await fs.readFile(new URL(path,base),'utf8'));
const manifest=validateManifest(await read('manifest.json'));
const assetLibrary=validateAssetFiles(await read('../assets/catalog/library.json'));
for(const entry of manifest.puzzles){
 const document=await read(entry.path);
 if(entry.id!==document.id)throw Error(`Manifest-ID mismatch: ${entry.path}`);
 const puzzle=compilePuzzle(document,{assetLibrary});
 console.log(JSON.stringify({id:puzzle.id,kind:entry.kind,...puzzle.analysis},null,2));
}
