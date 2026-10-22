import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readContentPackage} from './lib/content-package.mjs';
import {validatePublicPuzzle} from '../src/puzzles/public.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
import {validateAssetFiles} from './validate-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function validatePuzzles(base=root){
 const {manifest,resourceRoot,assetLibrary,readPuzzle}=readContentPackage(base);
 if(assetLibrary)validateAssetFiles(assetLibrary,resourceRoot);
 const results=[];
 for(const entry of manifest.puzzles){
  const dto=readPuzzle(entry);validatePublicPuzzle(dto,{assetLibrary});
  if(entry.id!==dto.puzzle.id)throw Error(`Manifest-ID mismatch: ${entry.path}`);
  const puzzle=compilePuzzle(dto.puzzle,{assetLibrary});
  results.push({id:puzzle.id,kind:entry.kind,...puzzle.analysis});
 }
 return results;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=process.argv.includes('--root')?path.resolve(process.argv[process.argv.indexOf('--root')+1]):root;
 try{console.log(JSON.stringify(await validatePuzzles(base),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
