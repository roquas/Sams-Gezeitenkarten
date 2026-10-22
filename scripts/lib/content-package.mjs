// Filesystem adapter for the same explicit catalog used by the browser loader.
import fs from 'node:fs';
import path from 'node:path';
import {validateManifest} from '../../src/puzzles/loader.mjs';
export function readContentPackage(base){
 base=path.resolve(base);
 const manifestPath=path.join(base,'puzzles/manifest.json');
 const manifest=validateManifest(JSON.parse(fs.readFileSync(manifestPath,'utf8')));
 const resolve=ref=>{
  const full=path.resolve(path.dirname(manifestPath),ref);
  if(full!==base&&!full.startsWith(base+path.sep))throw Error('Package source escapes root: '+ref);
  let component=base;
  for(const part of path.relative(base,full).split(path.sep).filter(Boolean)){
   component=path.join(component,part);
   if(fs.lstatSync(component).isSymbolicLink())throw Error('Package source symlinks are not supported: '+ref);
  }
  return full;
 };
 const resourceRoot=resolve(manifest.resourceBase??'./');
 const assetLibrary=manifest.assetCatalog?JSON.parse(fs.readFileSync(resolve(manifest.assetCatalog),'utf8')):undefined;
 return {manifest,resourceRoot,assetLibrary,readPuzzle:entry=>JSON.parse(fs.readFileSync(resolve(entry.path),'utf8'))};
}
