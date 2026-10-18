import {schemaErrors,placementSchema} from '../puzzles/schema.mjs';
import {geometryErrors,imageContract,placedCells} from './geometry.mjs';

const id={type:'string',pattern:'^[a-z0-9]+(?:[.-][a-z0-9]+)*$',maxLength:120};
const text={type:'string',minLength:1};
const list=items=>({type:'array',items});
const obj=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const path={type:'string',pattern:'^assets/[a-zA-Z0-9_/-]+[.](png|webp)$'};
const sha={type:'string',pattern:'^[a-f0-9]{64}$'};
const review=obj({assetId:id,backgroundId:{type:'string'},status:{enum:['pending','approved','rejected']},reviewer:text,date:{type:'string',pattern:'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'},assetSha256:sha,backgroundSha256:sha,notes:text},['assetId','backgroundId','status','notes']);
export const librarySchema=obj({schemaVersion:{const:1},backgrounds:list(obj({id,family:id,image:path})),assets:list(obj({
 id,family:id,type:id,role:{enum:['geographic','decoration']},passable:{type:'boolean'},
 stage:{enum:['technical-placeholder','illustration']},geometry:obj({cells:list(list({type:'integer'}))}),
 image:obj({path,width:{type:'integer',minimum:1},height:{type:'integer',minimum:1}}),
 provenance:obj({source:text,rights:text}),candidateFamilies:list(id)
},['id','family','type','role','stage','geometry','image','provenance','candidateFamilies'])),reviews:list(review)});

export function validateLibrary(value){
 const errors=schemaErrors(value,librarySchema,'assetLibrary');
 if(errors.length)throw Error(errors.join('; '));
 const unique=(items,label)=>{const ids=items.map(i=>i.id);if(new Set(ids).size!==ids.length)errors.push('Duplicate '+label+' ID');};
 unique(value.assets,'asset');unique(value.backgrounds,'background');
 for(const a of value.assets){
  errors.push(...geometryErrors(a.geometry.cells).map(e=>a.id+': '+e));
  if(a.role==='decoration'?Object.hasOwn(a,'passable'):typeof a.passable!=='boolean')errors.push(a.id+': passable must be independent of type; decoration has no passable');
  if(!geometryErrors(a.geometry.cells).length){const c=imageContract(a.geometry.cells);if(a.image.width!==c.pixelWidth||a.image.height!==c.pixelHeight)errors.push(a.id+': image dimensions do not match geometry');}
  if(a.candidateFamilies.some(f=>!value.backgrounds.some(b=>b.family===f)))errors.push(a.id+': unknown candidate family');
 }
 const pairs=new Set();
 for(const r of value.reviews){
  const pair=r.assetId+'/'+r.backgroundId;
  if(pairs.has(pair))errors.push('Duplicate review: '+pair);pairs.add(pair);
  if(!value.assets.some(a=>a.id===r.assetId)||!(r.backgroundId==='*'||value.backgrounds.some(b=>b.id===r.backgroundId)))errors.push('Unknown review reference: '+pair);
  if(r.status==='approved'&&(!r.reviewer||!r.date||!r.assetSha256||(r.backgroundId!=='*'&&!r.backgroundSha256)))errors.push('Approval requires reviewer, date and file hashes: '+pair);
 }
 if(errors.length)throw Error(errors.join('; '));
 return value;
}
export function compatibility(library,assetId,backgroundId){
 if(!library.backgrounds.some(b=>b.id===backgroundId))return 'pending';
 // An explicit rejection/pending decision takes precedence over universal approval.
 return library.reviews.find(r=>r.assetId===assetId&&r.backgroundId===backgroundId)?.status??library.reviews.find(r=>r.assetId===assetId&&r.backgroundId==='*')?.status??'pending';
}
export function validatePlacements(placements,library,logic,backgroundId,{development=false}={}){
 validateLibrary(library);
 const shapeErrors=schemaErrors(placements,{type:'array',items:placementSchema},'assetPlacements');
 if(shapeErrors.length)return shapeErrors;
 const errors=[],ids=new Set(),board=new Set(Array.from({length:logic.grid.columns*logic.grid.rows},(_,i)=>String.fromCharCode(65+i%logic.grid.columns)+(1+Math.floor(i/logic.grid.columns))));
 if(!library.backgrounds.some(b=>b.id===backgroundId))errors.push('Unknown background: '+backgroundId);
 const occupied=new Set();
 for(const p of placements){
  if(ids.has(p.id))errors.push('Duplicate placement ID: '+p.id);ids.add(p.id);
  const a=library.assets.find(a=>a.id===p.assetId);
  if(!a){errors.push('Unknown asset: '+p.assetId);continue;}
  const cells=placedCells(a,p.anchor);
  if(cells.some(c=>!board.has(c)))errors.push(p.id+': outside chart');
  if(p.placeId&&(!logic.places[p.placeId]||cells.some(c=>!logic.places[p.placeId].cells.includes(c))))errors.push(p.id+': place membership mismatch');
  if(a.role==='geographic'){
   if(cells.some(c=>logic.blocked.includes(c)===a.passable))errors.push(p.id+': passable conflicts with puzzle; logic is never changed');
   for(const c of cells){if(occupied.has(c))errors.push(p.id+': overlapping geographic assets');occupied.add(c);}
  }else if(p.placeId)errors.push(p.id+': decoration cannot represent a logical place');
  if(!development&&(a.stage!=='illustration'||compatibility(library,a.id,backgroundId)!=='approved'))errors.push(p.id+': illustration/background not visually approved');
 }
 return errors;
}
