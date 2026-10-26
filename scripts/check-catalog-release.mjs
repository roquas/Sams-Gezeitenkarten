// Executed ONLY from a materialized Git snapshot, not imported by the loader.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sha256} from './lib/publication-archive.mjs';
import {assert,same,describeSnapshot,resourcePath,implementationIdentity,VERSIONS,validateTechnical} from './lib/catalog-release-format.mjs';
import {imageContract,placementContract} from '../src/assets/geometry.mjs';
import {VERIFICATION_VERSION} from '../src/assets/assignment.mjs';
import {GEOMETRY} from '../src/puzzles/schema.mjs';
import {chartContract} from '../src/ui/chart-asset-contract.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const request=JSON.parse(fs.readFileSync(0,'utf8'));
const read=ref=>fs.readFileSync(path.join(root,ref));
const snapshot=describeSnapshot(read);
same(snapshot.catalogId,request.catalogId,'materialized snapshot mismatch');
same(VERIFICATION_VERSION,VERSIONS.pixelChecker,'unsupported pinned pixel checker');
same(GEOMETRY,VERSIONS.geometry,'unsupported pinned geometry');
for(const entry of snapshot.contracts)same(entry.contract,chartContract(),'pinned frame JSON disagrees with pinned executable contract');
const implementation={sourceCommit:request.sourceCommit,files:request.implementation.files.map(({path})=>({path,sha256:sha256(read(path))}))};
implementation.sha256=implementationIdentity(implementation.files);
same(implementation,request.implementation,'materialized checker mismatch');
function run(command,args,input){
 const result=spawnSync(command,args,{cwd:root,input:input===undefined?undefined:JSON.stringify(input),encoding:'utf8',maxBuffer:64*1024*1024,
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 if(result.error)throw result.error;
 assert(result.status===0,'technical image check failed: '+result.stderr+'\n'+result.stdout);
 return JSON.parse(result.stdout);
}
const {library,policy}=snapshot;
const imageResults=run('python3',[path.join(root,'scripts/check-catalog-release-images.py')],{
 assets:library.assets.map(a=>({path:path.join(root,resourcePath(policy.resourceBase,a.image.path)),contract:imageContract(a.geometry.cells)})),
 backgrounds:library.backgrounds.map(b=>path.join(root,resourcePath(policy.resourceBase,b.image)))});
// Under the corrected contract, local pixels are sufficient exactly when every
// geometric translation has that SAME local contract. Keep the complete anchor
// lists; do not run identical pixel masks once per anchor or alter old adapters.
for(const placement of snapshot.placements){
 const asset=library.assets.find(a=>a.id===placement.assetId);
 for(const anchor of placement.anchors)same(placementContract(asset,anchor),imageContract(asset.geometry.cells),'position-dependent graphic contract');
}
const digest=ref=>sha256(read(ref));
const validation={validationSchemaVersion:1,catalogId:snapshot.catalogId,versions:VERSIONS,implementation,
 tools:{node:process.versions.node,...imageResults.tools},catalog:{schema:'passed',references:'passed',reviewHashes:'passed'},
 assets:library.assets.map((a,i)=>{const p=resourcePath(policy.resourceBase,a.image.path);return {
  assetId:a.id,path:p,sha256:digest(p),...imageResults.assets[i],
  checks:{staticFormat:'passed',dimensions:'passed',alpha:'passed',nonempty:'passed',orientation:'passed',localPixels:'passed'}};}),
 backgrounds:library.backgrounds.map((b,i)=>{const p=resourcePath(policy.resourceBase,b.image);return {
  backgroundId:b.id,path:p,sha256:digest(p),...imageResults.backgrounds[i],checks:{staticFormat:'passed',decode:'passed'}};}),
 frames:snapshot.contracts.map(({backgroundId,path:contractPath,contract})=>({backgroundId,contractPath,
  resources:Object.fromEntries(Object.entries(contract.format.files).map(([kind,ref])=>{const p=resourcePath(policy.resourceBase,ref);return [kind,{path:p,sha256:digest(p)}];})),
  report:run('python3',[path.join(root,'scripts/check-chart-assets.py'),'--root',path.join(root,policy.resourceBase),'--contract',path.join(root,contractPath)])})),
 placements:snapshot.placements};
validateTechnical(validation,snapshot,implementation);
process.stdout.write(JSON.stringify(validation));
