// Offline transport contract. No model calls, solver or semantic interpretation.
import assert from 'node:assert/strict';
import {puzzleSchema,mapSchema,placementSchema,schemaErrors,RULES_VERSION} from '../../src/puzzles/schema.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {createFlavorRequest,validateFlavorRequest,createFlavorDraft,validateFlavorDraft,createFlavorCheckpoint,flavorRequestSchema} from './flavor-contract.mjs';
import {technicalClueText} from './clue-text.mjs';

export const PRODUCTION_VERSION=1;
export const PROMPT_REVISION='flavor-production-2';
export const json=value=>JSON.stringify(value,null,2)+'\n';
export const contentHash=value=>sha256('gezeitenkarten-flavor-production/v1\0'+canonicalJson(value));
export const same=(a,b,message)=>assert.equal(canonicalJson(a),canonicalJson(b),'flavor production: '+message);
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const list=items=>({type:'array',items});
const text=puzzleSchema.properties.presentation.properties.title;
const id=puzzleSchema.properties.id;
const hash={type:'string',pattern:'^[a-f0-9]{64}$'};
const rev={type:'integer',minimum:1,maximum:2147483647};
const nullable=schema=>({oneOf:[{type:'null'},schema]});
const names=puzzleSchema.properties.presentation.properties.objectNames;
export const revisionRefSchema=object({caseId:id,flavorVariantId:id,revision:rev,revisionHash:hash});
export const intentSchema=object({flavorVariantId:id,revision:rev,predecessor:nullable(revisionRefSchema)});
const positionRefs={positionId:id,caseId:id,puzzleId:id,cardRef:{type:'string',pattern:'^gk-illustrated-card-v1-sha256:[a-f0-9]{64}$'},sourceHash:hash};
export const editorialSchema=object({goal:text,impulses:list(text),themes:list(text),context:nullable(text)});
const publicCardSchema=object({cardRef:positionRefs.cardRef,map:mapSchema,background:id,assetPlacements:list(placementSchema),objectNames:names});
export const productionOrderSchema=object({contractVersion:{const:PRODUCTION_VERSION},promptRevision:{enum:['flavor-production-1',PROMPT_REVISION]},
 orderId:{type:'string',pattern:'^flavor-order-[a-f0-9]{64}$'},
 inputHashes:object({rules:hash,prompt:hash,responseSchema:hash,references:hash}),
 world:object({packageId:id,version:text,packageHash:hash}),editorial:editorialSchema,
 positions:{...list(object({...positionRefs,request:flavorRequestSchema,card:publicCardSchema,intent:intentSchema})),minItems:1}});
export const narrativeMetadataSchema=object({form:text,themes:list(text),worldMotifs:list(text),inventions:list(text)});
const responseRefs={...positionRefs,flavorVariantId:id,revision:rev,predecessor:nullable(revisionRefSchema)};
export const productionResponseSchema=object({contractVersion:{const:PRODUCTION_VERSION},orderId:productionOrderSchema.properties.orderId,
 positions:list({oneOf:[object({...responseRefs,status:{const:'complete'},title:text,
 intro:puzzleSchema.properties.presentation.properties.intro,clues:list(object({id,text})),metadata:narrativeMetadataSchema}),
 object({...responseRefs,status:{const:'problem'},problem:text})]})});
export function structure(value,schema){const errors=schemaErrors(value,schema);assert.equal(errors.length,0,'flavor production: '+errors.join('; '));return value;}
const pick=(obj,fields)=>Object.fromEntries(fields.filter(k=>Object.hasOwn(obj,k)).map(k=>[k,structuredClone(obj[k])]));

// projectPublicPuzzle owns the deep logic allowlist. Never pass a compiled
// definition, its solution, presentation, result texts or metadata through.
export function createProductionPosition({caseId,document,card,assetLibrary,intent,positionId}){
 structure(intent,intentSchema);
 const placements=card.assetPlacements.map(p=>pick(p,['id','assetId','anchor','objectId']));
 const objectNames=Object.fromEntries(card.map.objects.map(o=>[o.id,card.naming.objectNames[o.id]]));
 const neutral={schemaVersion:document.schemaVersion,rulesVersion:document.rulesVersion,dataVersion:document.dataVersion,id:caseId,
 logic:document.logic,presentation:{title:caseId,intro:['Technische Referenzfassung des öffentlichen Rätsels.'],objectNames,
 clueTexts:Object.fromEntries(document.logic.clues.map(c=>[c.id,technicalClueText(c,card.map)])),hints:[],
 background:card.background,assetPlacements:placements}};
 const {puzzle}=projectPublicPuzzle(neutral,{assetLibrary,identity:{mapStructureId:'map-reference',instanceId:'inst-reference',variantId:'var-reference'}});
 // Normalize only map enumeration, as in the existing named-card contract.
 const cleanMap=structuredClone(puzzle.logic.map);
 cleanMap.objects=cleanMap.objects.map(o=>({...o,cells:[...o.cells].sort()})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 assert.equal(mapFingerprint(cleanMap),card.mapFingerprint,'flavor production: puzzle/card geography mismatch');
 same(cleanMap,publicMap(card.map),'puzzle/card map mismatch');
 assert.ok(cleanMap.objects.some(o=>o.passable&&o.cells.length===1),'flavor production: card needs a passable single-hex object');
 puzzle.logic.map=cleanMap;
 const request=createFlavorRequest(puzzle,{assetLibrary});
 const publicCard={cardRef:card.key,map:cleanMap,background:card.background,assetPlacements:placements,objectNames};
 const position={positionId,caseId,puzzleId:puzzle.id,cardRef:card.key,sourceHash:request.sourceHash,request,card:publicCard,intent:structuredClone(intent)};
 validatePosition(position);return position;
}
function publicMap(map){return {geometry:map.geometry,grid:pick(map.grid,['columns','rows']),objects:map.objects.map(o=>pick(o,['id','cells','passable']))};}
function validatePosition(p){
 validateFlavorRequest(p.request);const source=p.request.source;
 assert.equal(p.caseId,p.puzzleId,'flavor production: case/puzzle mismatch');assert.equal(p.puzzleId,source.id,'flavor production: puzzle reference mismatch');
 assert.equal(p.sourceHash,p.request.sourceHash,'flavor production: source reference mismatch');
 assert.equal(p.cardRef,p.card.cardRef,'flavor production: card reference mismatch');
 same(p.card.map,source.logic.map,'card map');same(p.card.objectNames,source.presentation.objectNames,'card names');
 same(p.card.assetPlacements,source.presentation.assetPlacements,'card assets');assert.equal(p.card.background,source.presentation.background);
 same(Object.keys(p.card.objectNames).sort(),p.card.map.objects.map(o=>o.id).sort(),'complete card names');
 assert.ok(p.card.map.objects.some(o=>o.passable&&o.cells.length===1),'flavor production: card needs a passable single-hex object');
 same(source.presentation.hints,[],'no extra hints');assert.equal(source.resultTexts,undefined,'flavor production: no result texts');
 const {intent}=p;
 if(intent.revision===1)assert.equal(intent.predecessor,null,'flavor production: first revision has no predecessor');
 else{
  assert.ok(intent.predecessor,'flavor production: revision requires predecessor');
  same([intent.predecessor.caseId,intent.predecessor.flavorVariantId,intent.predecessor.revision],
   [p.caseId,intent.flavorVariantId,intent.revision-1],'predecessor identity');
 }
}
export function createProductionOrder({positions,world,editorial,inputHashes}){
 const body={contractVersion:PRODUCTION_VERSION,promptRevision:PROMPT_REVISION,inputHashes:structuredClone(inputHashes),world:structuredClone(world),editorial:structuredClone(editorial),positions:structuredClone(positions)};
 return validateProductionOrder({...body,orderId:'flavor-order-'+contentHash(body)});
}
export function validateProductionOrder(order){
 structure(order,productionOrderSchema);const {orderId,...body}=order;
 assert.equal(orderId,'flavor-order-'+contentHash(body),'flavor production: order hash mismatch');
 for(const field of ['positionId','caseId'])assert.equal(new Set(order.positions.map(p=>p[field])).size,order.positions.length,'flavor production: duplicate '+field);
 order.positions.forEach(validatePosition);return order;
}
export const responseReferences=p=>({...pick(p,Object.keys(positionRefs)),...structuredClone(p.intent)});
export function validateProductionResponse(order,response){
 validateProductionOrder(order);structure(response,productionResponseSchema);
 assert.equal(response.orderId,order.orderId,'flavor production: order reference mismatch');
 assert.equal(response.positions.length,order.positions.length,'flavor production: missing or foreign positions');
 for(let i=0;i<order.positions.length;i++){
  const p=order.positions[i],r=response.positions[i],label='position '+p.positionId+' ('+p.caseId+')';
  same(pick(r,Object.keys(responseRefs)),responseReferences(p),label+': reference/order mismatch');
  if(r.status==='problem')continue;
  same(r.clues.map(c=>c.id),p.request.source.logic.clues.map(c=>c.id),label+': missing, duplicate, foreign or reordered clue IDs');
 }
 return {complete:response.positions.every(r=>r.status==='complete'),response};
}
export function createProductionRecords(order,response){return buildProductionRecords(order,response);}
// Decode immutable accepted records using their recorded wire version. This
// does not expose a legacy-generation mode or change historical response bytes.
export function validateStoredProductionRecords(order,response,records){
 assert.ok(Array.isArray(records)&&records.length===order.positions.length,'flavor production: stored record coverage');
 same(records,buildProductionRecords(order,response,records),'stored records/checkpoints');return records;
}
function buildProductionRecords(order,response,storedRecords){
 const checked=validateProductionResponse(order,response);
 assert.ok(checked.complete,'flavor production: incomplete order; unresolved positions: '+response.positions.filter(r=>r.status==='problem').map(r=>r.positionId).join(', '));
 return order.positions.map((p,i)=>{
  const r=response.positions[i],draft=createFlavorDraft(p.request);
  if(storedRecords?.[i]?.draft?.contractVersion===1){
   draft.contractVersion=1;
   draft.presentation.objectNames=structuredClone(storedRecords[i].draft.presentation.objectNames);
  }
  draft.revision=p.intent.revision;draft.presentation.title=r.title;draft.presentation.intro=structuredClone(r.intro);
  draft.presentation.clueTexts=Object.fromEntries(r.clues.map(c=>[c.id,c.text]));
  draft.evidence=Object.fromEntries(r.clues.map(c=>[c.id,{mode:'free'}]));
  validateFlavorDraft(p.request,draft);
  const body={orderId:order.orderId,positionId:p.positionId,caseId:p.caseId,cardRef:p.cardRef,flavorVariantId:p.intent.flavorVariantId,
   predecessor:structuredClone(p.intent.predecessor),request:structuredClone(p.request),draft,checkpoint:createFlavorCheckpoint(p.request,draft),
   metadata:{origin:'model-reported',value:structuredClone(r.metadata)}};
  return {...body,revisionHash:contentHash(body),draftHash:contentHash(draft)};
 });
}
export function materializeFlavorRevision(position,record){
 validatePosition(position);validateFlavorDraft(position.request,record.draft);
 const {revisionHash,draftHash,...body}=record;
 assert.equal(revisionHash,contentHash(body),'flavor production: stale revision hash');
 assert.equal(draftHash,contentHash(record.draft),'flavor production: stale draft hash');
 same(record.checkpoint,createFlavorCheckpoint(position.request,record.draft),'materialization checkpoint');
 same([record.positionId,record.flavorVariantId,record.draft.revision,record.predecessor],
  [position.positionId,position.intent.flavorVariantId,position.intent.revision,position.intent.predecessor],'materialization revision');
 same([record.caseId,record.cardRef,record.request],[position.caseId,position.cardRef,position.request],'materialization binding');
 const presentation={title:record.draft.presentation.title,intro:structuredClone(record.draft.presentation.intro),
 objectNames:structuredClone(position.card.objectNames),clueTexts:structuredClone(record.draft.presentation.clueTexts),hints:[],
 background:position.card.background,assetPlacements:structuredClone(position.card.assetPlacements)};
 const puzzle={...structuredClone(position.request.source),presentation};
 return {puzzle,presentationHash:sha256(canonicalJson(presentation)),draftHash:contentHash(record.draft)};
}
export function prepareBetaEditorial({editorial,position,record,dataVersion}){
 const result=structuredClone(editorial),entry=result.cases.find(c=>c.id===position.caseId);
 assert.ok(entry,'flavor production: unknown beta case');
 assert.ok(Number.isSafeInteger(dataVersion)&&dataVersion>Math.max(entry.dataVersion,position.request.source.dataVersion)&&dataVersion<=2147483647,
  'flavor production: explicit new dataVersion required');
 const {puzzle}=materializeFlavorRevision(position,record);
 assert.equal(result.background,puzzle.presentation.background,'flavor production: beta background mismatch');
 Object.assign(entry,{dataVersion,status:'draft',presentation:puzzle.presentation,semanticReview:null});return result;
}
