import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateLibrary} from '../src/assets/library.mjs';
import {readContentPackage} from './lib/content-package.mjs';
import {resolvePackagePath} from './lib/package-path.mjs';
import {imageContract,placementContract} from '../src/assets/geometry.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
// Shared byte/hash checks for filesystem exports and pinned archive snapshots.
export function validateAssetBytes(library,readBytes){
 validateLibrary(library);
 const hash=ref=>createHash('sha256').update(readBytes(ref)).digest('hex');
 const assets=new Map(library.assets.map(a=>[a.id,hash(a.image.path)]));
 const backgrounds=new Map(library.backgrounds.map(b=>[b.id,hash(b.image)]));
 for(const r of library.reviews)if(r.status==='approved'){
  if(r.assetSha256!==assets.get(r.assetId)||(r.backgroundId!=='*'&&r.backgroundSha256!==backgrounds.get(r.backgroundId)))throw Error('Stale visual approval: '+r.assetId+'/'+r.backgroundId);
 }
 return library;
}
export function validateAssetFiles(library,base=root){
 return validateAssetBytes(library,ref=>{
  const full=path.join(path.resolve(base),resolvePackagePath('.',ref));
  let component=path.resolve(base);
  for(const part of path.relative(component,full).split(path.sep)){
   component=path.join(component,part);
   if(fs.lstatSync(component).isSymbolicLink())throw Error('Asset symlinks are not supported: '+ref);
  }
  if(!full.startsWith(path.resolve(base)+path.sep)||!fs.statSync(full).isFile())throw Error('Invalid asset file: '+ref);
  return fs.readFileSync(full);
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=process.argv.includes('--root')?path.resolve(process.argv[process.argv.indexOf('--root')+1]):root;
 const content=readContentPackage(base);
 const library=content.assetLibrary?validateAssetFiles(content.assetLibrary,content.resourceRoot):{schemaVersion:2,semanticVersion:1,assets:[],backgrounds:[],reviews:[]};
 if(process.argv.includes('--image-contract')){
  const placements=content.manifest.puzzles.flatMap(e=>content.readPuzzle(e).puzzle.presentation.assetPlacements);
  console.log(JSON.stringify({resourceRoot:content.resourceRoot,backgrounds:library.backgrounds,assets:library.assets.map(a=>({...a,contract:imageContract(a.geometry.cells),placements:placements.filter(p=>p.assetId===a.id).map(p=>({id:p.id,anchor:p.anchor,contract:placementContract(a,p.anchor)}))}))}));
 }
 else console.log(`OK: ${library.assets.length} assets, ${library.backgrounds.length} backgrounds; files and approval hashes valid`);
}
