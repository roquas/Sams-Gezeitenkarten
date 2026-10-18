import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateManifest} from '../src/puzzles/loader.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
import {validateAssetFiles} from './validate-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function validatePuzzles(base=root){
 const read=async ref=>JSON.parse(await fs.readFile(path.join(base,'puzzles',ref),'utf8'));
 const manifest=validateManifest(await read('manifest.json'));
 const assetLibrary=validateAssetFiles(await read('../assets/catalog/library.json'),base);
 const results=[];
 for(const entry of manifest.puzzles){
  const document=await read(entry.path);
  if(entry.id!==document.id)throw Error(`Manifest-ID mismatch: ${entry.path}`);
  const puzzle=compilePuzzle(document,{assetLibrary});
  results.push({id:puzzle.id,kind:entry.kind,...puzzle.analysis});
 }
 return results;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=process.argv.includes('--root')?path.resolve(process.argv[process.argv.indexOf('--root')+1]):root;
 try{console.log(JSON.stringify(await validatePuzzles(base),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
