import {compilePuzzle,PuzzleError} from './validate.mjs';
import {schemaErrors} from './schema.mjs';
const manifestSchema={type:'object',required:['schemaVersion','defaultId','puzzles'],additionalProperties:false,properties:{schemaVersion:{const:1},defaultId:{type:'string'},puzzles:{type:'array',minItems:1,items:{type:'object',required:['id','title','path','kind'],additionalProperties:false,properties:{id:{type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'},title:{type:'string',minLength:1},path:{type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*[.]json$'},kind:{enum:['reference','test','editorial','historical']},difficulty:{type:'string'}}}}}};
export function validateManifest(value){
 const errors=schemaErrors(value,manifestSchema);
 if(errors.length)throw new PuzzleError(errors);
 const ids=value.puzzles.map(p=>p.id);
 if(new Set(ids).size!==ids.length||!ids.includes(value.defaultId))throw new PuzzleError(['manifest: doppelte IDs oder fehlendes Standardrätsel']);
 return value;
}
export function createPuzzleLoader({manifestUrl=new URL('../../puzzles/manifest.json',import.meta.url),assetLibraryUrl=new URL('../assets/catalog/library.json',manifestUrl),fetcher=globalThis.fetch}={}){
 let manifest,assetLibrary;
 async function json(url){
  try{const response=await fetcher(url);if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json();}
  catch(error){throw new PuzzleError([`Datei ${new URL(url).pathname}: ${error.message}`]);}
 }
 return {
  async manifest(){return manifest??=validateManifest(await json(manifestUrl));},
  async load(id){
   const catalog=manifest??=validateManifest(await json(manifestUrl));
   const entry=catalog.puzzles.find(p=>p.id===id);
   if(!entry)throw new PuzzleError(['manifest: unbekannte Rätsel-ID']);
   const document=await json(new URL(entry.path,manifestUrl));
   if(document.id!==id)throw new PuzzleError(['id: Datei stimmt nicht mit Manifest überein']);
   if(document.presentation?.assetPlacements?.length)assetLibrary??=await json(assetLibraryUrl);
   return compilePuzzle(document,{assetLibrary});
  }
 };
}
