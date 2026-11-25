// Adopt the supplied sealed snapshot, preserving its receipt and every old byte.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {sha256} from './content-hash.mjs';
import {json,same,validateStoredProductionRecords,materializeFlavorRevision} from './flavor-production.mjs';
import {ROOT} from './flavor-production-package.mjs';
import {openProductionStore,revisionReference} from './flavor-production-store.mjs';
import {directory,readTree,unseal,publishTree,withStoreLock,parseJsonBytes as parse} from './immutable-file-store.mjs';
export const PILOT_ORDER='flavor-order-85bb07ece126d1b5a2af6d98ea55ad5943f6f41f43a6245f835a16e71ba6b4df';
export const PILOT_RESPONSE_SHA='e69847b8d1c031196aeeb455f558ce2621a0bb6b33af67cff0310e2748adf3c1';
export const PILOT_DIRECTORY=path.join(ROOT,'tests/fixtures/flavor-quality/pilot');
export function verifyPilot(){
 const source=path.join(ROOT,'content/flavor/pilot-v1/local'),store=openProductionStore({directory:source});
 const {order}=store.loadOrder(PILOT_ORDER),files=readTree(path.join(PILOT_DIRECTORY,'import/pilot-1')),body=unseal(files);
 const receipt=parse(body.get('receipt.json')),bytes=body.get('response.json');
 assert.equal(receipt.orderId,PILOT_ORDER);assert.equal(receipt.runId,'pilot-1');assert.equal(receipt.responseSha256,PILOT_RESPONSE_SHA);assert.equal(sha256(bytes),PILOT_RESPONSE_SHA);
 assert.ok(bytes.equals(fs.readFileSync(path.join(PILOT_DIRECTORY,'response.json'))));
 const provenance=parse(fs.readFileSync(path.join(PILOT_DIRECTORY,'transport-provenance.json')));
 assert.equal(sha256(fs.readFileSync(path.join(PILOT_DIRECTORY,'production-source.txt'))),provenance.source.sha256);
 assert.equal(provenance.derivedResponse.sha256,PILOT_RESPONSE_SHA);assert.equal(provenance.derivedResponse.exactOriginalProducerBytesKnown,false);
 same(parse(fs.readFileSync(path.join(PILOT_DIRECTORY,'order.json'))),order,'real pilot order');
 const records=validateStoredProductionRecords(order,parse(bytes),parse(body.get('records.json')));
 same(records.map(r=>r.caseId),['C-06','C-02','C-03','C-11'],'real pilot order');
 same(records.map(r=>Object.keys(r.draft.presentation.clueTexts).length),[6,7,6,4],'real pilot clue counts');
 const presentations=records.map((record,i)=>materializeFlavorRevision(order.positions[i],record));
 return {source,order,files,records,presentations,provenance};
}
export function preparePilotStore(target){
 const verified=verifyPilot();directory(target);const root=fs.realpathSync(target);
 assert.notEqual(root,fs.realpathSync(verified.source),'flavor quality: explicit separate pilot store required');
 for(const sub of ['orders','imports','selections'])directory(path.join(root,sub));
 withStoreLock(root,()=>{
  const entries=sub=>fs.readdirSync(path.join(root,sub)).filter(n=>!n.startsWith('.'));
  assert.ok(entries('orders').every(n=>n===PILOT_ORDER)&&entries('imports').every(n=>n==='pilot-1')&&entries('selections').length===0,'flavor quality: pilot adoption requires an empty or identical unselected pilot store');
  publishTree(path.join(root,'orders',PILOT_ORDER),readTree(path.join(verified.source,'orders',PILOT_ORDER)));
  publishTree(path.join(root,'imports/pilot-1'),verified.files);
 });
 const production=openProductionStore({directory:root});const references=verified.records.map(revisionReference);references.forEach(r=>production.findRecord(r));
 return {production,references,responseSha256:PILOT_RESPONSE_SHA,
  provenance:'Reconstructed user paste; producer bytes, model and time unknown. Sealed original import adopted unchanged. No semantic approval.'};
}
