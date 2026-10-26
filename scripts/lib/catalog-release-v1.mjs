// Frozen business interpretation of release format 1. Extend through a NEW
// evaluator/version, never through imports of the evolving asset/engine/UI code.
// Only schema vocabulary, hashing and structural equality are shared utilities.
import {isDeepStrictEqual} from 'node:util';
import {schemaErrors} from '../../src/puzzles/json-schema.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

const requireV1=(ok,message)=>{if(!ok)throw Error('catalog-release v1: '+message);};
// Canonical historical asset-library schema 2 / semantics 1. The schema itself
// remains pinned DATA in the source snapshot; no second schema copy is needed.
const SCHEMA_SHA256='3b8c74e8f62005f74fd99117389e93202cafb1dd8c553b13dedcb5f99b065f7d';
const neighbors=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const tip=(41**2+68**2)/(2*68),shoulder=tip-41**2/68;
const vertices=[[-41,-shoulder],[0,-tip],[41,-shoulder],[41,shoulder],[0,tip],[-41,shoulder]];
export const BOARD_V1=Object.freeze(Array.from({length:25},(_,i)=>'ABCDE'[i%5]+(Math.floor(i/5)+1)).sort());

function validateGeometry(cells){
 requireV1(cells.length>0&&cells.length<=25&&cells.every(c=>c.length===2&&c.every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=24)),'invalid axial footprint');
 const keys=new Set(cells.map(c=>c.join(',')));
 requireV1(keys.size===cells.length&&keys.has('0,0'),'duplicate cells or missing origin');
 const seen=new Set(['0,0']),queue=[[0,0]];
 for(let i=0;i<queue.length;i++)for(const [dq,dr] of neighbors){
  const cell=[queue[i][0]+dq,queue[i][1]+dr],key=cell.join(',');
  if(keys.has(key)&&!seen.has(key)){seen.add(key);queue.push(cell);}
 }
 requireV1(seen.size===cells.length,'disconnected axial footprint');
}

// Only dimensions are needed for metadata validation, not polygon clipping,
// rendering, ownership, placement validation or pixel containment algorithms.
function dimensions(cells){
 const centers=cells.map(([q,r])=>[82*q+41*r,68*r]);
 const center=[0,1].map(i=>centers.reduce((sum,c)=>sum+c[i]/centers.length,0));
 return [0,1].map(i=>8*Math.ceil(Math.max(...centers.flatMap(c=>vertices.map(v=>Math.abs(c[i]-center[i]+v[i]))))+4));
}

export function validateLibraryV1(library,schema){
 requireV1(sha256(canonicalJson(schema))===SCHEMA_SHA256,'unsupported pinned library schema');
 const errors=schemaErrors(library,schema,'assetLibrary');requireV1(!errors.length,errors.join('; '));
 const assetIds=new Set(library.assets.map(a=>a.id)),backgroundIds=new Set(library.backgrounds.map(b=>b.id));
 requireV1(assetIds.size===library.assets.length&&backgroundIds.size===library.backgrounds.length,'duplicate library IDs');
 const families=new Set(library.backgrounds.map(b=>b.family));
 for(const a of library.assets){
  requireV1((a.role==='decoration')===(a.semanticClass==='decoration'),'semanticClass must describe the role');
  requireV1(a.role==='decoration'?!Object.hasOwn(a,'passable'):typeof a.passable==='boolean','invalid passability');
  validateGeometry(a.geometry.cells);
  const [width,height]=dimensions(a.geometry.cells);
  requireV1(a.image.width===width&&a.image.height===height,'image dimensions do not match V1 geometry');
  requireV1(a.candidateFamilies.every(f=>families.has(f)),'unknown candidate family');
 }
 const pairs=new Set();
 for(const r of library.reviews){
  const pair=r.assetId+'/'+r.backgroundId;
  requireV1(!pairs.has(pair),'duplicate review');pairs.add(pair);
  requireV1(assetIds.has(r.assetId)&&(r.backgroundId==='*'||backgroundIds.has(r.backgroundId)),'unknown review reference');
  if(r.status==='approved')requireV1(r.backgroundId!=='*'&&r.reviewer&&r.date&&r.assetSha256&&r.backgroundSha256,'approval requires concrete background, reviewer, date and hashes');
 }
 return library;
}

export function validateReviewHashesV1(library,readBytes){
 const assets=new Map(library.assets.map(a=>[a.id,sha256(readBytes(a.image.path))]));
 const backgrounds=new Map(library.backgrounds.map(b=>[b.id,sha256(readBytes(b.image))]));
 for(const r of library.reviews)if(r.status==='approved')requireV1(r.assetSha256===assets.get(r.assetId)&&r.backgroundSha256===backgrounds.get(r.backgroundId),'Stale visual approval: '+r.assetId+'/'+r.backgroundId);
}

export function productionEnabledV1(library,assetId,backgroundId){
 const asset=library.assets.find(a=>a.id===assetId);
 return asset?.stage==='illustration'&&asset.production==='enabled'&&library.backgrounds.some(b=>b.id===backgroundId)&&
  library.reviews.some(r=>r.assetId===assetId&&r.backgroundId===backgroundId&&r.status==='approved');
}

export function placedCellsV1(asset,anchor){
 const row=Number(anchor.slice(1))-1,q=anchor.charCodeAt(0)-65-Math.floor(row/2);
 return asset.geometry.cells.map(([dq,dr])=>String.fromCharCode(65+q+dq+Math.floor((row+dr)/2))+(row+dr+1));
}

export function framePixelScopeV1(contract){
 // Contract 4 has one fixed canvas/raster. The 2,234,040 intersecting source
 // squares were established by its geometric SAT mask (also exercised by the
 // existing Python frame tests). This is a versioned scope constant, not a
 // measurement from an image or from the evolving live geometry implementation.
 requireV1(isDeepStrictEqual(contract.format.pixels,{width:2252,height:1892,perSvgUnit:4})&&
  isDeepStrictEqual(contract.format.svgBounds,{x:-37,y:-44.5,width:563,height:473}),'unsupported V1 frame pixel grid');
 const centers=Array.from({length:25},(_,i)=>({id:'ABCDE'[i%5]+(Math.floor(i/5)+1),q:i%5,r:Math.floor(i/5),
  center:[60+(i%5)*82+(Math.floor(i/5)%2)*41,56+Math.floor(i/5)*68]}));
 requireV1(Array.isArray(contract.geometry?.hexes),'missing V1 frame geometry');
 requireV1(isDeepStrictEqual(contract.geometry.hexes.map(({id,q,r,center})=>({id,q,r,center})),centers),'unsupported V1 frame geometry');
 return 2234040;
}
