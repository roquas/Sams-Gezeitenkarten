import {validateMap} from '../engine/validate.mjs';
import {cellsOf} from '../engine/hex.mjs';
import {placedCells} from './geometry.mjs';
import {validateLibrary,validatePlacements,productionEnabled,compatibility,withPlacementValidator} from './library.mjs';
import {randomStream,validateSeed} from '../generation/random.mjs';
import {shapeSignature} from '../generation/map-analysis.mjs';

export const ASSIGNMENT_VERSION='asset-assignment-1';
export const VERIFICATION_VERSION='asset-placement-pixels-1';
const compare=(a,b)=>a<b?-1:a>b?1:0;
const add=(counts,key)=>{counts[key]=(Object.hasOwn(counts,key)?counts[key]:0)+1;};

// verification is an explicit, trusted adapter result, never a claim inferred
// from catalog metadata. Bind it to the exact metadata inspected by the adapter.
export function validateCatalogContext(context){
 validateLibrary(context.library);
 return validateCatalogVerification(context);
}
function validateCatalogVerification(context){
 const {library,backgroundId,verification}=context;
 if(!library.backgrounds.some(b=>b.id===backgroundId))throw Error('Unknown background: '+backgroundId);
 if(verification&&(verification.version!==VERIFICATION_VERSION||verification.librarySnapshot!==JSON.stringify(library)||
  verification.backgroundId!==backgroundId||!/^[a-f0-9]{64}$/.test(verification.catalogSha256)))throw Error('Stale or unsupported asset verification');
 return context;
}

export function geographicCandidates(context){
 return [...context.library.assets].filter(a=>a.role==='geographic').sort((a,b)=>compare(a.id,b.id));
}

// Each gate has a stable code. The most advanced failed gate is the primary
// object reason; the histogram still reports every inspected asset rejection.
function releaseFailure(context,asset,lookup){
 const {library,backgroundId,verification}=context;
 if(asset.production!=='enabled'||asset.stage!=='illustration')return 'PRODUCTION_DISABLED';
 if((lookup?lookup.validator.compatibility(asset.id):compatibility(library,asset.id,backgroundId))!=='approved'||
  !(lookup?lookup.validator.productionEnabled(asset.id):productionEnabled(library,asset.id,backgroundId)))return 'BACKGROUND_NOT_APPROVED';
 if(!verification)return 'PIXEL_VERIFICATION_MISSING';
 const check=lookup?lookup.getCheck(asset.id):verification.assets.find(c=>c.assetId===asset.id);
 if(!check)return 'PIXEL_VERIFICATION_MISSING';
 return check.error?'IMAGE_CONTRACT_REJECTED':null;
}

export function verifiedAnchors(context,asset){
 return releaseFailure(context,asset)?[]:context.verification.assets.find(c=>c.assetId===asset.id).anchors;
}

export function assignAssets({map,seed,catalog}){
 validateMap(map);validateSeed(seed);
 return withPlacementValidator(catalog.library,map,catalog.backgroundId,validator=>assignInScope(map,seed,catalog,validator));
}
function assignInScope(map,seed,catalog,validator){
 validateCatalogVerification(catalog);
 let checks;
 const getCheck=assetId=>{
  if(!catalog.verification)return undefined;
  // Keep the original access/failure behavior for malformed trusted-adapter
  // results; only actual arrays receive the lazily built first-match index.
  if(!Array.isArray(catalog.verification.assets))return catalog.verification.assets.find(c=>c.assetId===assetId);
  if(!checks){
   checks=new Map();
   for(const check of catalog.verification.assets)if(!checks.has(check.assetId))checks.set(check.assetId,check);
  }
  return checks.get(assetId);
 };
 const lookup={validator,getCheck};
 const random=randomStream(seed,ASSIGNMENT_VERSION+'/selection'),assets=geographicCandidates(catalog);
 const placements=[],objects=[],rejectionCounts={},assetTypes={},assetUsage={};
 let candidateChecks=0,anchorChecks=0;
 const stages=['NO_EXACT_FOOTPRINT','PASSABILITY_MISMATCH','PRODUCTION_DISABLED','BACKGROUND_NOT_APPROVED',
  'PIXEL_VERIFICATION_MISSING','IMAGE_CONTRACT_REJECTED','PIXEL_POSITION_REJECTED','PLACEMENT_CONTRACT_REJECTED'];
 for(const [index,object] of [...map.objects].sort((a,b)=>compare(a.id,b.id)).entries()){
  const candidates=[],rejections={},details=[];
  const reject=(code,assetId,errors)=>{add(rejections,code);if(errors)details.push({assetId,code,errors});};
  for(const asset of assets){
   candidateChecks++;
   const anchors=[...object.cells].sort().filter(anchor=>{
    anchorChecks++;
    const cells=placedCells(asset,anchor);
    return cells.length===object.cells.length&&cells.every(c=>object.cells.includes(c));
   });
   if(!anchors.length){reject('NO_EXACT_FOOTPRINT',asset.id);continue;}
   if(asset.passable!==object.passable){reject('PASSABILITY_MISMATCH',asset.id);continue;}
   const failure=releaseFailure(catalog,asset,lookup),check=getCheck(asset.id);
   if(failure){
    const error=check?.error;
    reject(failure,asset.id,error?[error]:undefined);continue;
   }
   for(const anchor of anchors){
    if(!check.anchors.includes(anchor)){
     const error=check.rejected?.find(p=>p.anchor===anchor)?.error;
     reject('PIXEL_POSITION_REJECTED',asset.id,error?[error]:undefined);continue;
    }
    const placement={id:'art-'+String(index+1).padStart(2,'0'),assetId:asset.id,anchor,objectId:object.id};
    const errors=validator.candidateErrors(placement);
    if(errors.length)reject('PLACEMENT_CONTRACT_REJECTED',asset.id,errors);
    else candidates.push({placement,semanticClass:asset.semanticClass});
   }
  }
  const record={objectId:object.id,size:object.cells.length,shape:shapeSignature(object.cells),passable:object.passable,
   candidateCount:candidates.length,rejections,...(details.length?{details}:{})};
  if(candidates.length){
   const selected=candidates[random.integer(candidates.length)];
   placements.push(selected.placement);add(assetTypes,selected.semanticClass);add(assetUsage,selected.placement.assetId);
   objects.push({...record,status:'assigned',assetId:selected.placement.assetId,semanticClass:selected.semanticClass});
  }else{
   const reason=[...stages].reverse().find(code=>rejections[code])??'NO_GEOGRAPHIC_ASSETS';
   add(rejectionCounts,reason);objects.push({...record,status:'unassigned',reason});
  }
 }
 const errors=validatePlacements(placements,catalog.library,map,catalog.backgroundId);
 if(errors.length)throw Error('Assignment invariant: '+errors.join('; '));
 return {status:placements.length===map.objects.length?'complete':placements.length?'partial':'none',placements,objects,
  diagnostics:{assignmentVersion:ASSIGNMENT_VERSION,seed,backgroundId:catalog.backgroundId,
   catalogSha256:catalog.verification?.catalogSha256??null,objectCount:map.objects.length,
   assignedCount:placements.length,unassignedCount:map.objects.length-placements.length,
   rejectionCounts,assetTypes,assetUsage,candidateChecks,anchorChecks}};
}

// Only geographic footprints cross into generation. Deduplicate by footprint
// and passability so nine paintings of one form do not give it nine votes.
export function createCatalogProfile(catalog,{preferencePercent=75}={}){
 validateCatalogContext(catalog);
 if(!Number.isInteger(preferencePercent)||preferencePercent<0||preferencePercent>100)throw RangeError('preferencePercent must be 0–100');
 const board=new Set(cellsOf({columns:5,rows:5})),unique=new Map();
 for(const asset of geographicCandidates(catalog))for(const anchor of verifiedAnchors(catalog,asset)){
  const cells=placedCells(asset,anchor).sort();
  if(!cells.every(c=>board.has(c)))throw Error('Verified anchor outside chart');
  const key=Number(asset.passable)+':'+cells.join(',');unique.set(key,{cells,passable:asset.passable});
 }
 return {version:'catalog-shapes-1',catalogSha256:catalog.verification?.catalogSha256??null,preferencePercent,
  placements:[...unique].sort(([a],[b])=>compare(a,b)).map(([,value])=>value)};
}
