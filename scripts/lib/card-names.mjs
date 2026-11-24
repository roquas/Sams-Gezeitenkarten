// Curated offline data and a finite selector. No model/provider at runtime.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schemaErrors} from '../../src/puzzles/schema.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

const text={type:'string',minLength:1};
const id={type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const dict=values=>({type:'object',propertyNames:id,additionalProperties:values});
const poolBinding=object({mode:{const:'pool'},poolId:id,source:text});
const uniqueBinding=object({mode:{const:'unique'},worldPlaceId:id,source:text});
export const nameSupplySchema=object({schemaVersion:{const:1},version:id,selectionVersion:{const:'card-name-rank-1'},
 status:{const:'new-game-proposals-not-podcast-canon'},
 pools:dict(object({motif:text,names:{type:'array',minItems:1,uniqueItems:true,items:{type:'string',minLength:6,maxLength:12}}})),
 assetBindings:dict({oneOf:[poolBinding,uniqueBinding]}),uniquePlaces:dict(object({name:text,source:text}))});
// Immutable v1 world reference, independent of replaceable ordinary supplies.
// Later illustrations can bind the same world ID without changing this registry.
const worldRegistry=JSON.parse(readFileSync(new URL('../../content/card-names/world-places-v1.json',import.meta.url),'utf8'));
assert.equal(schemaErrors(worldRegistry,object({schemaVersion:{const:1},places:dict(object({name:text,source:text,assetIds:{type:'array',minItems:1,uniqueItems:true,items:id}}))})).length,0);
export const nameKey=name=>name.normalize('NFKC').toLocaleLowerCase('de-DE');
const compare=(a,b)=>a<b?-1:a>b?1:0;
export function validateNameSupply(supply){
 const errors=schemaErrors(supply,nameSupplySchema);assert.equal(errors.length,0,'card names: '+errors.join('; '));
 assert.ok(Object.values(supply.uniquePlaces).every(p=>p.name===p.name.trim()&&p.name===p.name.normalize('NFC')),'card names: noncanonical unique name');
 for(const [worldId,place] of Object.entries(worldRegistry.places)){
  assert.equal(supply.uniquePlaces[worldId]?.name,place.name,'card names: fixed world name conflict: '+worldId);
  assert.equal(supply.uniquePlaces[worldId]?.source,place.source,'card names: fixed world source conflict: '+worldId);
  for(const assetId of place.assetIds)if(Object.hasOwn(supply.assetBindings,assetId)){
   const b=supply.assetBindings[assetId];
   assert.ok(b.mode==='unique'&&b.worldPlaceId===worldId,'card names: fixed unique asset binding conflict: '+assetId);
  }
 }
 const uniqueNames=Object.values(supply.uniquePlaces).map(p=>nameKey(p.name));
 assert.equal(new Set(uniqueNames).size,uniqueNames.length,'card names: conflicting unique names');
 for(const pool of Object.values(supply.pools)){
  assert.ok(pool.names.every(n=>n===n.trim()&&n===n.normalize('NFC')),'card names: noncanonical name');
  assert.equal(new Set(pool.names.map(nameKey)).size,pool.names.length,'card names: duplicate pool name');
 }
 for(const binding of Object.values(supply.assetBindings))assert.ok(Object.hasOwn(binding.mode==='pool'?supply.pools:supply.uniquePlaces,
  binding.mode==='pool'?binding.poolId:binding.worldPlaceId),'card names: missing binding target');
 return supply;
}
export const nameSupplySha256=supply=>sha256('gezeitenkarten-name-supply/v1\0'+canonicalJson(validateNameSupply(supply)));
// Store only the pools used on this card, but all known world names remain
// reserved. This snapshot allows validation after the external supply evolves.
export function sliceNameSupply(supply,assetIds){
 validateNameSupply(supply);
 const assetBindings={};
 for(const id of [...new Set(assetIds)].sort()){
  assert.ok(Object.hasOwn(supply.assetBindings,id),'card names: missing asset binding: '+id);
  assetBindings[id]=structuredClone(supply.assetBindings[id]);
 }
 const used=new Set(Object.values(assetBindings).filter(b=>b.mode==='pool').map(b=>b.poolId));
 return {...structuredClone(supply),assetBindings,pools:Object.fromEntries([...used].sort().map(id=>[id,structuredClone(supply.pools[id])]))};
}
export function selectCardNames(key,placements,supply){
 validateNameSupply(supply);
 const objectNames={},bindings={},used=new Set(Object.values(supply.uniquePlaces).map(p=>nameKey(p.name))),worldPlaces=new Set();
 // Unique places first, so a pool can never consume a known world name.
 const places=placements.filter(p=>p.objectId).sort((a,b)=>compare(a.objectId,b.objectId));
 for(const p of places){
  assert.ok(Object.hasOwn(supply.assetBindings,p.assetId),'card names: missing asset binding: '+p.assetId);
  const b=supply.assetBindings[p.assetId];bindings[p.objectId]=structuredClone(b);
  if(b.mode==='unique'){
   assert.ok(!worldPlaces.has(b.worldPlaceId),'card names: conflicting multiple representations of unique place: '+b.worldPlaceId);
   worldPlaces.add(b.worldPlaceId);objectNames[p.objectId]=supply.uniquePlaces[b.worldPlaceId].name;
  }
 }
 for(const p of places){
  const b=bindings[p.objectId];if(b.mode!=='pool')continue;
  const ranked=supply.pools[b.poolId].names.map(name=>({name,rank:sha256('gezeitenkarten-name-rank/v1\0'+canonicalJson({key,objectId:p.objectId,poolId:b.poolId,name}))}))
   .sort((a,b)=>compare(a.rank,b.rank)||compare(a.name,b.name));
  const selected=ranked.find(({name})=>!used.has(nameKey(name)));
  assert.ok(selected,'card names: exhausted pool: '+b.poolId);
  objectNames[p.objectId]=selected.name;used.add(nameKey(selected.name));
 }
 return {objectNames,bindings};
}
