import {validateMap} from '../engine/validate.mjs';
import {cellsOf} from '../engine/hex.mjs';
import {placedCells} from './geometry.mjs';
import {validateLibrary,validatePlacements,productionEnabled,compatibility,withPlacementValidator} from './library.mjs';
import {randomStream,validateSeed} from '../generation/random.mjs';
import {shapeSignature} from '../generation/map-analysis.mjs';

export const ASSIGNMENT_VERSION='asset-assignment-1';
export const CONSTRAINED_ASSIGNMENT_VERSION='catalog-assignment-1';
export const VERIFICATION_VERSION='asset-placement-pixels-2';
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

export function assignAssets({map,seed,catalog,reusePolicy='unrestricted'}){
 validateMap(map);validateSeed(seed);
 if(!['unrestricted','catalog-compliant'].includes(reusePolicy))throw Error('Unsupported asset reuse policy');
 return withPlacementValidator(catalog.library,map,catalog.backgroundId,validator=>assignInScope(map,seed,catalog,validator,reusePolicy));
}
function assignInScope(map,seed,catalog,validator,reusePolicy){
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
 const constrained=reusePolicy==='catalog-compliant',version=constrained?CONSTRAINED_ASSIGNMENT_VERSION:ASSIGNMENT_VERSION;
 const random=randomStream(seed,version+'/selection'),assets=geographicCandidates(catalog);
 const placements=[],objects=[],rejectionCounts={},assetTypes={},assetUsage={};
 const choices=[];
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
  choices.push({record,candidates});
 }
 const selectedByObject=constrained?matchCatalogChoices(choices,random):null;
 for(const {record,candidates} of choices){
  const selected=constrained?selectedByObject.get(record.objectId):candidates.length?candidates[random.integer(candidates.length)]:null;
  if(selected){
   placements.push(selected.placement);add(assetTypes,selected.semanticClass);add(assetUsage,selected.placement.assetId);
   objects.push({...record,status:'assigned',assetId:selected.placement.assetId,semanticClass:selected.semanticClass});
  }else{
   const reason=candidates.length?'ASSET_REUSE_EXHAUSTED':
    [...stages].reverse().find(code=>record.rejections[code])??'NO_GEOGRAPHIC_ASSETS';
   add(rejectionCounts,reason);objects.push({...record,status:'unassigned',reason});
  }
 }
 const errors=validatePlacements(placements,catalog.library,map,catalog.backgroundId);
 if(errors.length)throw Error('Assignment invariant: '+errors.join('; '));
 return {status:placements.length===map.objects.length?'complete':placements.length?'partial':'none',placements,objects,
  diagnostics:{assignmentVersion:version,seed,backgroundId:catalog.backgroundId,
   catalogSha256:catalog.verification?.catalogSha256??null,objectCount:map.objects.length,
   assignedCount:placements.length,unassignedCount:map.objects.length-placements.length,
   rejectionCounts,assetTypes,assetUsage,candidateChecks,anchorChecks}};
}

// Maximum bipartite matching reserves each blocked painting once across the
// whole map. The same matching first maximizes distinct passable paintings;
// only unmatched passable objects reuse a least-used compatible painting.
// Candidate discovery/validation stays in the existing assignment scope above.
function matchCatalogChoices(choices,random){
 const ordered=choices.map(({record,candidates})=>{
  const shuffled=[...candidates];
  for(let i=shuffled.length-1;i>0;i--){const j=random.integer(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  return {record,candidates:shuffled};
 });
 const owners=new Map(),selected=new Map(),byObject=new Map(ordered.map(o=>[o.record.objectId,o]));
 function augment(objectId,seen){
  for(const candidate of byObject.get(objectId).candidates){
   const id=candidate.placement.assetId;if(seen.has(id))continue;seen.add(id);
   if(!owners.has(id)||augment(owners.get(id),seen)){
    owners.set(id,objectId);selected.set(objectId,candidate);return true;
   }
  }
  return false;
 }
 for(const {record} of ordered)augment(record.objectId,new Set());
 const usage={};for(const c of selected.values())add(usage,c.placement.assetId);
 for(const {record,candidates} of ordered)if(record.passable&&!selected.has(record.objectId)&&candidates.length){
  const minimum=Math.min(...candidates.map(c=>usage[c.placement.assetId]??0));
  const candidate=candidates.find(c=>(usage[c.placement.assetId]??0)===minimum);
  selected.set(record.objectId,candidate);add(usage,candidate.placement.assetId);
 }
 return selected;
}

// Only geographic footprints cross into generation. Deduplicate by footprint
// and passability so nine paintings of one form do not give it nine votes.
export function createCatalogProfile(catalog,{preferencePercent=75,mode='catalog-informed'}={}){
 validateCatalogContext(catalog);
 if(!['catalog-informed','catalog-compliant'].includes(mode))throw Error('Unsupported catalog profile mode');
 if(!Number.isInteger(preferencePercent)||preferencePercent<0||preferencePercent>100)throw RangeError('preferencePercent must be 0–100');
 const board=new Set(cellsOf({columns:5,rows:5})),unique=new Map(),capacities=new Map();
 if(mode==='catalog-compliant')for(const asset of geographicCandidates(catalog)){
  const anchors=verifiedAnchors(catalog,asset);
  if(anchors.length){
   const shape=shapeSignature(placedCells(asset,anchors[0])),key=Number(asset.passable)+':'+shape;
   const group=capacities.get(key)??{shape,passable:asset.passable,count:0};group.count++;capacities.set(key,group);
  }
 }
 for(const asset of geographicCandidates(catalog))for(const anchor of verifiedAnchors(catalog,asset)){
  const cells=placedCells(asset,anchor).sort();
  if(!cells.every(c=>board.has(c)))throw Error('Verified anchor outside chart');
  const key=Number(asset.passable)+':'+cells.join(',');unique.set(key,{cells,passable:asset.passable});
 }
 const placements=[...unique].sort(([a],[b])=>compare(a,b)).map(([,value])=>value);
 if(mode==='catalog-compliant')return {version:'catalog-capacities-1',catalogSha256:catalog.verification?.catalogSha256??null,
  placements,capacities:[...capacities].sort(([a],[b])=>compare(a,b)).map(([,value])=>value)};
 return {version:'catalog-shapes-1',catalogSha256:catalog.verification?.catalogSha256??null,preferencePercent,placements};
}
