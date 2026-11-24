// Offline card identity. Existing logical hash domains and runtime schemas stay intact.
import assert from 'node:assert/strict';
import {schemaErrors,mapSchema,placementSchema} from '../../src/puzzles/schema.mjs';
import {validateB2Places} from './puzzle-clues.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {nameSupplySchema,nameSupplySha256,sliceNameSupply,selectCardNames} from './card-names.mjs';

const compare=(a,b)=>a<b?-1:a>b?1:0;
const same=(a,b,message)=>assert.equal(canonicalJson(a),canonicalJson(b),'illustrated card: '+message);
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const text={type:'string',minLength:1};
const hash={type:'string',pattern:'^[a-f0-9]{64}$'};
const commit={type:'string',pattern:'^[a-f0-9]{40}$'};
const array=items=>({type:'array',items});
const dictionary=values=>({type:'object',additionalProperties:values});
const cardKey={type:'string',pattern:'^gk-illustrated-card-v1-sha256:[a-f0-9]{64}$'};
export const sourceSchema=object({kind:{enum:['batch-map','puzzle-candidate','illustrated-map']},id:text,sha256:hash});
export const releaseProvenanceSchema=object({adapterVersion:{const:'released-asset-catalog-1'},releaseId:text,catalogId:text,
 sourceCommit:commit,archiveCommit:commit,backgroundId:text,catalogSha256:hash});
export const resourcesSchema=object({background:object({id:text,imageSha256:hash}),
 assets:array(object({assetId:text,imageSha256:hash,revisionSha256:hash}))});
export const namedCardSchema=object({schemaVersion:{const:1},key:cardKey,mapFingerprint:text,map:mapSchema,background:text,
 assetPlacements:array(placementSchema),resources:resourcesSchema,
 naming:object({supplyVersion:text,selectionVersion:{const:'card-name-rank-1'},supplySha256:hash,
  selectionSupply:nameSupplySchema,objectNames:dictionary(text),bindings:dictionary({oneOf:[
   object({mode:{const:'pool'},poolId:text,source:text}),object({mode:{const:'unique'},worldPlaceId:text,source:text})]})}),
 origin:object({source:sourceSchema,release:releaseProvenanceSchema}),integritySha256:hash});
export function structure(value,schema){
 const errors=schemaErrors(value,schema);assert.equal(errors.length,0,'illustrated card: '+errors.join('; '));return value;
}
export const stableRelease=({archiveCommit,...stable})=>stable;
export const cardIntegrity=body=>sha256('gezeitenkarten-named-card/v1\0'+canonicalJson(body));
export function illustratedCardKey({mapFingerprint,background,assetPlacements,resources}){
 // Placement IDs are serializer plumbing. Caller-normalized sorting is not a
 // precondition: public identity always removes them and sorts both inventories.
 const placements=assetPlacements.map(({assetId,anchor,objectId})=>({assetId,anchor,...(objectId?{objectId}:{})}))
  .sort((a,b)=>compare(canonicalJson(a),canonicalJson(b)));
 const binding={background:resources.background,assets:[...resources.assets].sort((a,b)=>compare(a.assetId,b.assetId))};
 return 'gk-illustrated-card-v1-sha256:'+sha256('gezeitenkarten-illustrated-card/v1\0'+canonicalJson({mapFingerprint,background,placements,resources:binding}));
}
// released is a trusted in-memory result of loadReleasedAssetCatalog, not JSON
// supplied next to a claimed release ID. The disk adapter establishes this trust.
export function describeIllustratedCard({map,background,assetPlacements},released){
 const {catalog,provenance,readResource}=released;
 assert.equal(background,catalog.backgroundId,'illustrated card: background/release mismatch');
 validateB2Places(map,assetPlacements,catalog);
 const library=catalog.library,byId=new Map(library.assets.map(a=>[a.id,a]));
 for(const p of assetPlacements)assert.ok(catalog.verification.assets.some(a=>a.assetId===p.assetId&&a.anchors.includes(p.anchor)),
  'illustrated card: asset/anchor absent from approved release selection: '+p.assetId+'/'+p.anchor);
 const normalizedMap={...structuredClone(map),objects:map.objects.map(o=>({...o,cells:[...o.cells].sort(compare)})).sort((a,b)=>compare(a.id,b.id))};
 const placements=assetPlacements.map(({assetId,anchor,objectId})=>({assetId,anchor,...(objectId?{objectId}:{})}))
  .sort((a,b)=>compare(canonicalJson(a),canonicalJson(b))).map((p,i)=>({id:'art-'+String(i+1).padStart(3,'0'),...p}));
 const bg=library.backgrounds.find(b=>b.id===background);
 const resources={background:{id:background,imageSha256:sha256(readResource(bg.image))},
  assets:[...new Set(placements.map(p=>p.assetId))].sort(compare).map(assetId=>{
   const a=byId.get(assetId);
   // Resource revision includes render-relevant metadata, not storage paths,
   // catalog-wide digests, annotations or unused resources.
   const cells=[...a.geometry.cells].sort((a,b)=>Number(b[0]===0&&b[1]===0)-Number(a[0]===0&&a[1]===0)||a[1]-b[1]||a[0]-b[0]);
   const revision={geometry:{cells},image:{width:a.image.width,height:a.image.height},role:a.role,...(a.role==='geographic'?{passable:a.passable}:{})};
   return {assetId,imageSha256:sha256(readResource(a.image.path)),revisionSha256:sha256(canonicalJson(revision))};
  })};
 const body={map:normalizedMap,mapFingerprint:mapFingerprint(map),background,assetPlacements:placements,resources};
 structure(provenance,releaseProvenanceSchema);
 return {key:illustratedCardKey(body),...body};
}
export function createNamedCard(input,released,supply,source){
 structure(source,sourceSchema);
 const card=describeIllustratedCard(input,released);
 const selectionSupply=sliceNameSupply(supply,card.assetPlacements.filter(p=>p.objectId).map(p=>p.assetId));
 const naming={supplyVersion:supply.version,selectionVersion:supply.selectionVersion,supplySha256:nameSupplySha256(supply),
  selectionSupply,...selectCardNames(card.key,card.assetPlacements,selectionSupply)};
 const body={schemaVersion:1,...card,naming,origin:{source:structuredClone(source),release:structuredClone(released.provenance)}};
 return validateNamedCard({...body,integritySha256:cardIntegrity(body)},released);
}
export function validateNamedCard(card,released){
 structure(card,namedCardSchema);
 const {integritySha256,...body}=card;same(integritySha256,cardIntegrity(body),'complete state integrity mismatch');
 const actual=describeIllustratedCard(card,released);
 for(const field of Object.keys(actual))same(card[field],actual[field],field+' binding mismatch');
 same(stableRelease(card.origin.release),stableRelease(released.provenance),'origin release conflict');
 const n=card.naming;
 same([n.supplyVersion,n.selectionVersion],[n.selectionSupply.version,n.selectionSupply.selectionVersion],'name supply version conflict');
 same(n.selectionSupply,sliceNameSupply(n.selectionSupply,card.assetPlacements.filter(p=>p.objectId).map(p=>p.assetId)),'unexpected name supply entries');
 const selected=selectCardNames(card.key,card.assetPlacements,n.selectionSupply);
 same(n.objectNames,selected.objectNames,'name selection mismatch');same(n.bindings,selected.bindings,'name binding mismatch');
 return card;
}
