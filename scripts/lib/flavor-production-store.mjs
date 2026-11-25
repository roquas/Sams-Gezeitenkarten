// Local immutable snapshots. A single exclusive lock serializes every mutation;
// a complete fsynced sibling directory is renamed into view in one operation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {sha256} from './content-hash.mjs';
import {openCardLibrary} from './card-library.mjs';
import {json,contentHash,same,structure,revisionRefSchema,validateProductionOrder,createProductionRecords,validateStoredProductionRecords} from './flavor-production.mjs';
import {packageInventory,verifyProductionPackage,ROOT} from './flavor-production-package.mjs';

import {localId as id,parseJsonBytes as parse,directory,readTree,publishTree,seal,unseal,withStoreLock} from './immutable-file-store.mjs';
export {readTree} from './immutable-file-store.mjs';
export function openProductionStore({directory:target,libraryDirectory=path.join(ROOT,'content/card-library/f02a-v1'),beforePublish}={}){
 assert.ok(typeof target==='string'&&target.trim(),'flavor production: explicit store directory required');
 directory(target);const root=fs.realpathSync(target);
 for(const sub of ['orders','imports','selections'])directory(path.join(root,sub));
 const locked=work=>withStoreLock(root,work);
 let cachedLibrary;
 const library=()=>cachedLibrary??=openCardLibrary({directory:libraryDirectory});
 function verifyOrigin(order,origin){
  assert.equal(origin?.schemaVersion,1,'flavor production: local origin version');
  assert.equal(origin.kind,'existing-s04-c-editorial-handoff','flavor production: local origin kind');
  assert.equal(origin.positions.length,order.positions.length,'flavor production: local origin coverage');
  const lib=library();
  order.positions.forEach((p,i)=>{
   const o=origin.positions[i];assert.equal(o.caseId,p.caseId,'flavor production: local case binding');
   same(lib.lookup(o.source),o.link,'local source link');const card=lib.load(p.cardRef,o.cardIntegritySha256);
   same([p.cardRef,p.card.map,p.card.objectNames,p.card.background,p.card.assetPlacements],
    [card.key,card.map,card.naming.objectNames,card.background,card.assetPlacements],'local pinned card binding');
   assert.equal(o.link.cardKey,p.cardRef,'flavor production: local card reference');
  });
 }
 function orderPath(orderId){assert.match(orderId,/^flavor-order-[a-f0-9]{64}$/);return path.join(root,'orders',orderId);}
 function loadOrder(orderId){
  const files=unseal(readTree(orderPath(orderId))),binding=parse(files.get('binding.json'));
  const publicFiles=new Map([...files].filter(([ref])=>ref.startsWith('public/')).map(([ref,b])=>[ref.slice(7),b]));
  const order=verifyProductionPackage(publicFiles);
  assert.equal(order.orderId,orderId,'flavor production: stored order identity');
  same(binding,{schemaVersion:1,orderId,inventorySha256:sha256(publicFiles.get('inventory.json')),origin:binding.origin,originHash:contentHash(binding.origin)},'local origin integrity');
  verifyOrigin(order,binding.origin);return {order,files:publicFiles,binding};
 }
 function loadImports(){
  return fs.readdirSync(path.join(root,'imports')).filter(n=>!n.startsWith('.')).sort().map(runId=>{
   id(runId);const files=unseal(readTree(path.join(root,'imports',runId)));
   const receipt=parse(files.get('receipt.json')),responseBytes=files.get('response.json');
   assert.equal(receipt.runId,runId);assert.equal(sha256(responseBytes),receipt.responseSha256,'flavor production: response hash mismatch');
   const {order}=loadOrder(receipt.orderId),records=validateStoredProductionRecords(order,parse(responseBytes),parse(files.get('records.json')));
   return {receipt,records};
  });
 }
 const allRecords=()=>loadImports().flatMap(batch=>batch.records);
 function checkIntents(order,records){
  for(const p of order.positions){
   const prior=records.filter(r=>r.caseId===p.caseId&&r.flavorVariantId===p.intent.flavorVariantId).sort((a,b)=>a.draft.revision-b.draft.revision);
   const latest=prior.at(-1);
   if(p.intent.revision===1)assert.ok(!latest,'flavor production: variant already exists: '+p.caseId+'/'+p.intent.flavorVariantId);
   else{
    assert.ok(latest,'flavor production: missing predecessor: '+p.positionId);
    same(p.intent.predecessor,revisionReference(latest),'stale or conflicting predecessor: '+p.positionId);
    same(latest.request,p.request,'revision must retain its pinned F01 request');
   }
  }
 }
 function saveOrder({order,files,origin}){
  validateProductionOrder(order);same(verifyProductionPackage(files),order,'exported order');verifyOrigin(order,origin);
  return locked(()=>{
   const dest=orderPath(order.orderId);
   if(!fs.existsSync(dest))checkIntents(order,allRecords());
   const binding={schemaVersion:1,orderId:order.orderId,inventorySha256:sha256(files.get('inventory.json')),origin:structuredClone(origin),originHash:contentHash(origin)};
   const snapshot=seal(new Map([...files].map(([ref,b])=>['public/'+ref,b]).concat([['binding.json',json(binding)]])));
   const created=publishTree(dest,snapshot,beforePublish);return {orderId:order.orderId,created};
  });
 }
 function exportOrder(orderId,out){
  assert.ok(typeof out==='string'&&out.trim(),'flavor production: explicit public output required');
  const {files}=loadOrder(orderId),parent=path.dirname(path.resolve(out));directory(parent);
  // Use the store lock for same-store concurrent exports; arbitrary existing
  // targets are verified byte-for-byte, never overwritten.
  return locked(()=>({out:path.resolve(out),created:publishTree(path.resolve(out),files,beforePublish)}));
 }
 function importResponse({orderId,runId,responseBytes,operator={model:null,producedAt:null}}){
  id(runId);assert.ok(Buffer.isBuffer(responseBytes),'flavor production: exact response bytes required');
  structure(operator,{type:'object',properties:{model:{oneOf:[{type:'null'},{type:'string',minLength:1}]},producedAt:{oneOf:[{type:'null'},{type:'string',minLength:1}]}},required:['model','producedAt'],additionalProperties:false});
  const {order}=loadOrder(orderId),records=createProductionRecords(order,parse(responseBytes));
  return locked(()=>{
   const dest=path.join(root,'imports',runId),responseSha256=sha256(responseBytes);
   if(fs.existsSync(dest)){
    const files=unseal(readTree(dest)),prior=parse(files.get('receipt.json'));
    same([prior.orderId,prior.responseSha256,prior.operator],[orderId,responseSha256,{origin:'operator-supplied',value:operator}],'run reference conflict');
    assert.equal(sha256(files.get('response.json')),prior.responseSha256,'flavor production: stored response hash');
    const stored=validateStoredProductionRecords(order,parse(responseBytes),parse(files.get('records.json')));
    return {runId,responseSha256,created:false,records:stored};
   }
   checkIntents(order,allRecords());
   const receipt={schemaVersion:1,orderId,runId,responseSha256,operator:{origin:'operator-supplied',value:structuredClone(operator)},
    observation:{origin:'technically-observed',importedAt:new Date().toISOString()},
    limits:'Manual transport: model execution, hidden system parameters and unprovided chat history are not independently observed.'};
   const files=seal(new Map([['response.json',responseBytes],['receipt.json',json(receipt)],['records.json',json(records)]]));
   publishTree(dest,files,beforePublish);return {runId,responseSha256,created:true,records};
  });
 }
 function findRecord(ref){structure(ref,revisionRefSchema);const record=allRecords().find(r=>r.revisionHash===ref.revisionHash);
  assert.ok(record,'flavor production: unknown revision');same(revisionReference(record),ref,'revision reference');return record;}
 function selectionHistory(){
  return fs.readdirSync(path.join(root,'selections')).filter(n=>!n.startsWith('.')).sort().map(n=>{
   const files=unseal(readTree(path.join(root,'selections',n)));const event=parse(files.get('selection.json'));
   assert.equal(n,String(event.sequence).padStart(10,'0'));findRecord(event.selected);
   const {eventHash,...body}=event;assert.equal(eventHash,contentHash(body));return event;
  });
 }
 function selected(caseId){id(caseId);const history=selectionHistory();let prior=null;
  for(const e of history.filter(e=>e.caseId===caseId)){
   same(e.previous,prior?.eventHash??null,'selection history chain');prior=e;
  }
  return prior??{caseId,selected:null};
 }
 function selectRevision({reference,actor,reason,expectedSelectionHash=null}){
  assert.ok(typeof actor==='string'&&actor.trim()&&typeof reason==='string'&&reason.trim(),'flavor production: selection actor and reason required');
  return locked(()=>{
   findRecord(reference);const previous=selected(reference.caseId);
   assert.equal(previous.eventHash??null,expectedSelectionHash,'flavor production: stale selection');
   const sequence=selectionHistory().length+1;
   const body={schemaVersion:1,sequence,caseId:reference.caseId,selected:structuredClone(reference),previous:previous.eventHash??null,
    operator:{origin:'operator-supplied',actor,reason},observation:{origin:'technically-observed',selectedAt:new Date().toISOString()}};
   const event={...body,eventHash:contentHash(body)};
   publishTree(path.join(root,'selections',String(sequence).padStart(10,'0')),seal(new Map([['selection.json',json(event)]])),beforePublish);return event;
  });
 }
 return Object.freeze({directory:root,saveOrder,loadOrder,exportOrder,importResponse,findRecord,selected,selectRevision,
  latestRevision:(caseId,variant)=>{const latest=allRecords().filter(r=>r.caseId===caseId&&r.flavorVariantId===variant).sort((a,b)=>a.draft.revision-b.draft.revision).at(-1);return latest?revisionReference(latest):null;},
  validateIntent:order=>checkIntents(order,allRecords())});
}
export const revisionReference=record=>({caseId:record.caseId,flavorVariantId:record.flavorVariantId,revision:record.draft.revision,revisionHash:record.revisionHash});
