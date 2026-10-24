import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateAssetFiles,validateAssetBytes} from '../validate-assets.mjs';
import {canonicalJson,sha256} from './publication-archive.mjs';
import {productionEnabled} from '../../src/assets/library.mjs';
import {imageContract,placementContract,placedCells} from '../../src/assets/geometry.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';
import {VERIFICATION_VERSION} from '../../src/assets/assignment.mjs';

const checker=fileURLToPath(new URL('../verify-asset-positions.py',import.meta.url));
// Node adapter: all filesystem, hash and decoded-image work stays here. The
// caller pins the catalog/resource root (or obtains it from a pinned snapshot).
export function prepareAssetCatalog({library,backgroundId,resourceRoot}){
 library=structuredClone(library);validateAssetFiles(library,resourceRoot);
 if(!library.backgrounds.some(b=>b.id===backgroundId))throw Error('Unknown background: '+backgroundId);
 const files=new Map([...library.assets.map(a=>a.image.path),...library.backgrounds.map(b=>b.image)]
  .map(ref=>[ref,fs.readFileSync(path.resolve(resourceRoot,ref))]));
 // Pixel checks and reproduction hashes use these same captured bytes.
 validateAssetBytes(library,ref=>files.get(ref));
 const board=cellsOf({columns:5,rows:5}).sort(),allowed=new Set(board);
 const assets=library.assets.filter(a=>a.role==='geographic'&&productionEnabled(library,a.id,backgroundId)).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const contracts=assets.map(a=>({id:a.id,imageBase64:files.get(a.image.path).toString('base64'),contract:imageContract(a.geometry.cells),
  placements:board.filter(anchor=>placedCells(a,anchor).every(c=>allowed.has(c))).map(anchor=>({id:anchor,anchor,contract:placementContract(a,anchor)}))}));
 const background=library.backgrounds.find(b=>b.id===backgroundId);
 const result=spawnSync('python3',[checker],{input:JSON.stringify({assets:contracts,backgroundBase64:files.get(background.image).toString('base64')}),encoding:'utf8',maxBuffer:16*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Asset pixel verification failed: '+result.stderr);
 const checks=JSON.parse(result.stdout);
 const resources=[...new Set([background.image,...assets.map(a=>a.image.path)])].sort().map(ref=>({path:ref,sha256:sha256(files.get(ref))}));
 const verification={version:VERIFICATION_VERSION,backgroundId,librarySnapshot:JSON.stringify(library),
  catalogSha256:sha256(canonicalJson({library,backgroundId,resources,checkerVersion:VERIFICATION_VERSION})),assets:checks};
 return {library,backgroundId,verification};
}
