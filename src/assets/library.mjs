import {validateMap} from '../engine/validate.mjs';
import {cellsOf} from '../engine/hex.mjs';
import {schemaErrors,placementSchema} from '../puzzles/schema.mjs';
import {geometryErrors,imageContract,placedCells} from './geometry.mjs';

const id={type:'string',pattern:'^[a-z0-9]+(?:[.-][a-z0-9]+)*$',maxLength:80};
const text={type:'string',minLength:1};
const list=items=>({type:'array',items});
const obj=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const path={type:'string',pattern:'^assets/[a-zA-Z0-9_/-]+[.](png|webp)$'};
const sha={type:'string',pattern:'^[a-f0-9]{64}$'};
const review=obj({assetId:id,backgroundId:{type:'string'},status:{enum:['pending','approved','rejected']},reviewer:text,date:{type:'string',pattern:'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'},assetSha256:sha,backgroundSha256:sha,notes:text},['assetId','backgroundId','status','notes']);
export const librarySchema=obj({schemaVersion:{const:2},semanticVersion:{const:1},backgrounds:list(obj({id,family:id,image:path})),assets:list(obj({
 id,family:id,semanticClass:{enum:['island','lighthouse','buoy','wreck','settlement','atoll','archipelago','algae','barrels','rowboat','crate','bottle','driftwood','decoration']},role:{enum:['geographic','decoration']},passable:{type:'boolean'},
 stage:{enum:['technical-placeholder','illustration']},production:{enum:['enabled','draft','historical','deferred']},geometry:obj({cells:list(list({type:'integer'}))}),
 image:obj({path,width:{type:'integer',minimum:1},height:{type:'integer',minimum:1}}),
 provenance:obj({source:text,rights:text}),candidateFamilies:list(id)
},['id','family','semanticClass','role','stage','production','geometry','image','provenance','candidateFamilies'])),reviews:list(review)});

export function validateLibrary(value){
 const errors=schemaErrors(value,librarySchema,'assetLibrary');
 if(errors.length)throw Error(errors.join('; '));
 const unique=(items,label)=>{const ids=items.map(i=>i.id);if(new Set(ids).size!==ids.length)errors.push('Duplicate '+label+' ID');};
 unique(value.assets,'asset');unique(value.backgrounds,'background');
 const assetIds=new Set(value.assets.map(a=>a.id)),backgroundIds=new Set(value.backgrounds.map(b=>b.id));
 const backgroundFamilies=new Set(value.backgrounds.map(b=>b.family));
 for(const a of value.assets){
  if((a.role==='decoration')!==(a.semanticClass==='decoration'))errors.push(a.id+': semanticClass must describe the role');
  errors.push(...geometryErrors(a.geometry.cells).map(e=>a.id+': '+e));
  if(a.role==='decoration'?Object.hasOwn(a,'passable'):typeof a.passable!=='boolean')errors.push(a.id+': passable must be independent of semanticClass; decoration has no passable');
  if(!geometryErrors(a.geometry.cells).length){const c=imageContract(a.geometry.cells);if(a.image.width!==c.pixelWidth||a.image.height!==c.pixelHeight)errors.push(a.id+': image dimensions do not match geometry');}
  if(a.candidateFamilies.some(f=>!backgroundFamilies.has(f)))errors.push(a.id+': unknown candidate family');
 }
 const pairs=new Set();
 for(const r of value.reviews){
  const pair=r.assetId+'/'+r.backgroundId;
  if(pairs.has(pair))errors.push('Duplicate review: '+pair);pairs.add(pair);
  if(!assetIds.has(r.assetId)||!(r.backgroundId==='*'||backgroundIds.has(r.backgroundId)))errors.push('Unknown review reference: '+pair);
  if(r.status==='approved'&&(!r.reviewer||!r.date||!r.assetSha256||(r.backgroundId!=='*'&&!r.backgroundSha256)))errors.push('Approval requires reviewer, date and file hashes: '+pair);
  if(r.status==='approved'&&r.backgroundId==='*')errors.push('Approval requires one concrete hash-bound background: '+pair);
 }
 if(errors.length)throw Error(errors.join('; '));
 return value;
}
const reviewStatus=(exact,wildcard)=>exact??wildcard()??'pending';
export function compatibility(library,assetId,backgroundId){
 if(!library.backgrounds.some(b=>b.id===backgroundId))return 'pending';
 // An explicit rejection/pending decision takes precedence over universal approval.
 return reviewStatus(library.reviews.find(r=>r.assetId===assetId&&r.backgroundId===backgroundId)?.status,()=>library.reviews.find(r=>r.assetId===assetId&&r.backgroundId==='*')?.status);
}
const released=(asset,backgroundExists,approved)=>asset?.stage==='illustration'&&asset.production==='enabled'&&backgroundExists()&&approved();
// Artistic approval is preserved independently of the current release decision.
export function productionEnabled(library,assetId,backgroundId){
 const asset=library.assets.find(a=>a.id===assetId);
 return released(asset,()=>library.backgrounds.some(b=>b.id===backgroundId),()=>library.reviews.some(r=>r.assetId===assetId&&r.backgroundId===backgroundId&&r.status==='approved'));
}
// Private indices are built only after both source contracts were checked.
// Nothing here is cached across calls or accepted from an external caller.
function placementContext(library,map,backgroundId,development){
 const assets=new Map(library.assets.map(a=>[a.id,a])),objects=new Map(map.objects.map(o=>[o.id,o]));
 const reviews=new Map();
 for(const r of library.reviews){
  if(!reviews.has(r.assetId))reviews.set(r.assetId,new Map());
  reviews.get(r.assetId).set(r.backgroundId,r.status);
 }
 const backgroundExists=library.backgrounds.some(b=>b.id===backgroundId),compatibilities=new Map(),production=new Map();
 for(const a of library.assets){
  const decisions=reviews.get(a.id);
  compatibilities.set(a.id,backgroundExists?reviewStatus(decisions?.get(backgroundId),()=>decisions?.get('*')):'pending');
  production.set(a.id,released(a,()=>backgroundExists,()=>decisions?.get(backgroundId)==='approved'));
 }
 return {assets,objects,backgroundExists,backgroundId,development,
  board:new Set(cellsOf(map.grid)),logicalCells:new Set(map.objects.flatMap(o=>o.cells)),
  compatibility:id=>compatibilities.get(id)??'pending',productionEnabled:id=>production.get(id)??false};
}

// The sole placement-validation implementation, shared by standalone, candidate
// and final combination checks. Only the lifetime of the checked indices varies.
function placementErrors(placements,context){
 const shapeErrors=schemaErrors(placements,{type:'array',items:placementSchema},'assetPlacements');
 if(shapeErrors.length)return shapeErrors;
 const {assets,objects,board,logicalCells,backgroundExists,backgroundId,development}=context;
 const errors=[],ids=new Set(),represented=new Set(),occupied=new Set();
 if(!backgroundExists)errors.push('Unknown background: '+backgroundId);
 for(const p of placements){
  if(ids.has(p.id))errors.push('Duplicate placement ID: '+p.id);ids.add(p.id);
  const a=assets.get(p.assetId);
  if(!a){errors.push('Unknown asset: '+p.assetId);continue;}
  const cells=placedCells(a,p.anchor),object=objects.get(p.objectId);
  if(cells.some(c=>!board.has(c)))errors.push(p.id+': outside chart');
  for(const c of cells){if(occupied.has(c))errors.push(p.id+': overlapping asset footprints');occupied.add(c);}
  if(a.role==='geographic'){
   if(!object)errors.push(p.id+': geographic asset requires an object reference');
   else{
    if(represented.has(object.id))errors.push(p.id+': duplicate object illustration');represented.add(object.id);
    if(cells.length!==object.cells.length||cells.some(c=>!object.cells.includes(c)))errors.push(p.id+': object footprint mismatch');
    if(a.passable!==object.passable)errors.push(p.id+': passable conflicts with object; logic is never changed');
   }
  }else{
   if(p.objectId)errors.push(p.id+': decoration cannot represent a logical object');
   if(cells.some(c=>logicalCells.has(c)))errors.push(p.id+': decoration overlaps logical object');
  }
  if(!development&&a.production!=='enabled')errors.push(p.id+': asset not enabled for production ('+a.production+')');
  if(!development&&(a.stage!=='illustration'||context.compatibility(a.id)!=='approved'))errors.push(p.id+': illustration/background not visually approved');
 }
 return errors;
}

// Resource and art-release checks are explicit; this validator never mutates logic.
export function validatePlacements(placements,library,map,backgroundId,{development=false}={}){
 validateLibrary(library);validateMap(map);
 return placementErrors(placements,placementContext(library,map,backgroundId,development));
}

// Internal synchronous scope: validate once, then inspect any number of
// independent candidates. The capability expires on return/throw; metadata is
// compared at the boundary, never reserialized per candidate. No reusable token,
// skip-validation flag or mutable index is exposed.
export function withPlacementValidator(library,map,backgroundId,callback,{development=false}={}){
 validateLibrary(library);validateMap(map);
 const context=placementContext(library,map,backgroundId,development);
 const librarySnapshot=JSON.stringify(library),mapSnapshot=JSON.stringify(map);
 let active=true;
 const guard=fn=>(...args)=>{
  if(!active)throw Error('Expired placement validation scope');
  return fn(...args);
 };
 const validator=Object.freeze({candidateErrors:guard(p=>placementErrors([p],context)),
  compatibility:guard(context.compatibility),productionEnabled:guard(context.productionEnabled)});
 try{
  const result=callback(validator);
  if(result&&typeof result.then==='function')throw Error('Placement validation scope must be synchronous');
  if(JSON.stringify(library)!==librarySnapshot||JSON.stringify(map)!==mapSnapshot)throw Error('Stale placement validation scope: metadata changed');
  return result;
 }finally{active=false;}
}
