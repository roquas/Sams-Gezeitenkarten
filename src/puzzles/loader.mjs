import {compilePuzzle,PuzzleError} from './validate.mjs';
import {validatePublicPuzzle} from './public.mjs';
import {schemaErrors} from './schema.mjs';
// Relative sources are explicit content-package data, resolved against the catalog.
const source={type:'string',pattern:'^(?:[.][.]/)*[A-Za-z0-9_./-]+[.]json$'};
export const manifestSchema={type:'object',required:['schemaVersion','defaultId','puzzles'],additionalProperties:false,properties:{schemaVersion:{const:2},defaultId:{oneOf:[{type:'string'},{const:null}]},assetCatalog:source,resourceBase:{type:'string',pattern:'^(?:[.][.]/|[.]/|[A-Za-z0-9_-]+/)*$'},puzzles:{type:'array',items:{type:'object',required:['id','title','path','kind'],additionalProperties:false,properties:{id:{type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'},title:{type:'string',minLength:1},path:source,kind:{enum:['demo','test','editorial']},difficulty:{type:'string'}}}}}};
export function validateManifest(value){
 const errors=schemaErrors(value,manifestSchema);
 if(errors.length)throw new PuzzleError(errors);
 const ids=value.puzzles.map(p=>p.id);
 if(new Set(ids).size!==ids.length||(ids.length?!ids.includes(value.defaultId):value.defaultId!==null))throw new PuzzleError(['manifest: duplicate IDs or missing default']);
 return value;
}
export function createPuzzleLoader({manifestUrl,fetcher=globalThis.fetch,resourceValidator}={}){
 if(!manifestUrl)throw new PuzzleError(['manifestUrl: explicit puzzle source required']);
 manifestUrl=new URL(manifestUrl);
 let manifest,assetLibrary;
 async function json(url){
  try{const response=await fetcher(url);if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json();}
  catch(error){throw new PuzzleError([`Datei ${new URL(url).pathname}: ${error.message}`]);}
 }
 async function catalog(){return manifest??=validateManifest(await json(manifestUrl));}
 return {manifest:catalog,async load(id){
  const c=await catalog(),entry=c.puzzles.find(p=>p.id===id);
  if(!entry)throw new PuzzleError(['manifest: unknown puzzle ID']);
  const dto=await json(new URL(entry.path,manifestUrl));
  if(c.assetCatalog)assetLibrary??=await json(new URL(c.assetCatalog,manifestUrl));
  const options={assetLibrary,resourceBaseUrl:new URL(c.resourceBase??'./',manifestUrl)};
  validatePublicPuzzle(dto,options);
  if(dto.puzzle.id!==id)throw new PuzzleError(['id: file does not match manifest']);
  const puzzle=compilePuzzle(dto.puzzle,options);
  if(resourceValidator)await resourceValidator(puzzle);
  return puzzle;
 }};
}
