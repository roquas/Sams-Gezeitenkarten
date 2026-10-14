// Standalone proposal-catalog validation; no runtime dependency.
import {readFileSync} from 'node:fs';
const file=new URL('../assets/catalog/asset-proposals.json',import.meta.url);
const catalog=JSON.parse(readFileSync(file,'utf8'));
const fail=(message)=>{throw new Error(message)};
const neighbors=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const key=([q,r])=>q+','+r;
if(catalog.stage!=='proposals-only')fail('Unexpected catalog stage');
if(!Array.isArray(catalog.assets)||catalog.assets.length!==18)fail('Expected 18 proposals');
const ids=new Set();
for(const asset of catalog.assets){
 if(!asset.id||ids.has(asset.id))fail('Duplicate/empty asset ID: '+asset.id);
 ids.add(asset.id);
 if(asset.status!=='proposed'||asset.image!==null)fail('Unapproved proposal has image: '+asset.id);
 if(!['landmark','decoration'].includes(asset.role))fail('Unknown role: '+asset.id);
 if(asset.role==='decoration'){
  if(Object.hasOwn(asset,'passable'))fail('Decoration must not define passable: '+asset.id);
 }else if(typeof asset.passable!=='boolean')fail('Landmark must define passable: '+asset.id);
 const cells=asset.geometry?.cells;
 if(!Array.isArray(cells)||!cells.length)fail('Empty geometry: '+asset.id);
 const keys=new Set();
 for(const c of cells){
  if(!Array.isArray(c)||c.length!==2||!c.every(Number.isInteger))fail('Invalid axial coordinate: '+asset.id);
  if(keys.has(key(c)))fail('Duplicate cell: '+asset.id);
  keys.add(key(c));
 }
 if(!keys.has('0,0'))fail('Missing origin: '+asset.id);
 const seen=new Set(['0,0']),queue=[[0,0]];
 for(let i=0;i<queue.length;i++){
  const [q,r]=queue[i];
  for(const [dq,dr] of neighbors){
   const n=[q+dq,r+dr],k=key(n);
   if(keys.has(k)&&!seen.has(k)){seen.add(k);queue.push(n);}
  }
 }
 if(seen.size!==keys.size)fail('Disconnected geometry: '+asset.id);
 if(asset.backgroundReview?.seaBlue01!=='pending')fail('Unreviewed compatibility must be pending: '+asset.id);
}
console.log('OK: '+ids.size+' proposed assets; connected geometry; no invented image paths or approvals');
