import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateLibrary} from '../src/assets/library.mjs';
import {imageContract,placementContract} from '../src/assets/geometry.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export function validateAssetFiles(library,base=root){
 validateLibrary(library);
 const hash=ref=>{
  const full=path.resolve(base,ref);
  let component=path.resolve(base);
  for(const part of path.relative(component,full).split(path.sep)){
   component=path.join(component,part);
   if(fs.lstatSync(component).isSymbolicLink())throw Error('Asset symlinks are not supported: '+ref);
  }
  if(!full.startsWith(path.resolve(base)+path.sep)||!fs.statSync(full).isFile())throw Error('Invalid asset file: '+ref);
  return createHash('sha256').update(fs.readFileSync(full)).digest('hex');
 };
 const assets=new Map(library.assets.map(a=>[a.id,hash(a.image.path)]));
 const backgrounds=new Map(library.backgrounds.map(b=>[b.id,hash(b.image)]));
 for(const r of library.reviews)if(r.status==='approved'){
  if(r.assetSha256!==assets.get(r.assetId)||(r.backgroundId!=='*'&&r.backgroundSha256!==backgrounds.get(r.backgroundId)))throw Error('Stale visual approval: '+r.assetId+'/'+r.backgroundId);
 }
 return library;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=process.argv.includes('--root')?path.resolve(process.argv[process.argv.indexOf('--root')+1]):root;
 const library=validateAssetFiles(JSON.parse(fs.readFileSync(path.join(base,'assets/catalog/library.json'),'utf8')),base);
 if(process.argv.includes('--image-contract')){
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'puzzles/manifest.json'),'utf8'));
  const placements=manifest.puzzles.flatMap(e=>JSON.parse(fs.readFileSync(path.join(base,'puzzles',e.path),'utf8')).presentation.assetPlacements??[]);
  console.log(JSON.stringify(library.assets.map(a=>({...a,contract:imageContract(a.geometry.cells),placements:placements.filter(p=>p.assetId===a.id).map(p=>({id:p.id,anchor:p.anchor,contract:placementContract(a,p.anchor)}))}))));
 }
 else console.log(`OK: ${library.assets.length} assets, ${library.backgrounds.length} backgrounds; files and approval hashes valid`);
}
