// One hand-authored editorial reference. No generation or candidate selection.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './b2-playtest.mjs';
import {logicalFingerprints} from './publication-archive.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {validateB2Places} from './puzzle-clues.mjs';
import {validateManifest} from '../../src/puzzles/loader.mjs';
import {checkIrredundancy} from '../../src/puzzles/analysis.mjs';

export const POSITIVE_DIRECTORY='docs/verification/B2-positive';
export const POSITIVE_DEFINITION=POSITIVE_DIRECTORY+'/private/definition.json';
export const POSITIVE_ID='B2-POSITIVE-01';
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));
export const readPositiveDefinition=()=>read(POSITIVE_DEFINITION);

export function buildPositivePlaytest(definition=readPositiveDefinition()){
 if(definition.id!==POSITIVE_ID)throw Error('Unexpected positive reference identity');
 const assetLibrary=read('assets/catalog/library.json');
 validateB2Places(definition.logic.map,definition.presentation.assetPlacements,
  {library:assetLibrary,backgroundId:definition.presentation.background});
 const proof=checkIrredundancy(definition,{detailed:true});
 if(!proof.irredundant)throw Error('Positive reference must remain unique, target-matching and irredundant');
 const fingerprints=logicalFingerprints(definition);
 const identity=Object.fromEntries(Object.entries(fingerprints).map(([key,value],i)=>[
  ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+value.split(':')[1]]));
 const dto=projectPublicPuzzle(definition,{identity,assetLibrary});
 const compiled=compilePuzzle(dto.puzzle,{assetLibrary});
 if(JSON.stringify(compiled.solution)!==JSON.stringify(proof.uniqueSolution))throw Error('Public projection changed solution');
 const catalog=read('puzzles/manifest.json');
 const manifest=validateManifest({schemaVersion:2,defaultId:POSITIVE_ID,
  assetCatalog:'../../assets/catalog/library.json',resourceBase:'../../',
  puzzles:[...catalog.puzzles.map(e=>({...e,path:'../../puzzles/'+e.path})),
   {id:POSITIVE_ID,title:definition.presentation.title,path:POSITIVE_ID+'.json',kind:'test'}]});
 return new Map([[POSITIVE_ID+'.json',JSON.stringify(dto,null,2)+'\n'],['manifest.json',JSON.stringify(manifest,null,2)+'\n']]);
}
