// Offline only. Manual whole-package handoff; no external model invocation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {json,prepareBetaEditorial,materializeFlavorRevision} from './lib/flavor-production.mjs';
import {loadCommunityProduction,loadWorldPackage,createProductionPackage,PILOT_IDS,ROOT} from './lib/flavor-production-package.mjs';
import {openProductionStore} from './lib/flavor-production-store.mjs';

const usage='Usage: node scripts/flavor-production.mjs pilot --store DIR --out DIR | export --store DIR --out DIR --spec FILE [--world DIR] | import --store DIR --order ID --run ID --response FILE [--model NAME] [--produced-at ISO] | select --store DIR --reference FILE --actor NAME --reason TEXT [--expected-selection HASH] | inspect --store DIR --case ID | materialize --store DIR --case ID --data-version N --out FILE';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export function main(args=process.argv.slice(2)){
 const [command,...rest]=args,flags={};
 const allowed={pilot:['store','out'],export:['store','out','spec','world'],import:['store','order','run','response','model','produced-at'],
 select:['store','reference','actor','reason','expected-selection'],inspect:['store','case'],materialize:['store','case','data-version','out']}[command];
 assert.ok(allowed,usage);
 for(let i=0;i<rest.length;i+=2){const key=rest[i]?.slice(2);assert.ok(rest[i]?.startsWith('--')&&allowed.includes(key)&&rest[i+1]&&!rest[i+1].startsWith('--')&&!Object.hasOwn(flags,key),usage);flags[key]=rest[i+1];}
 const required={pilot:['store','out'],export:['store','out','spec'],import:['store','order','run','response'],select:['store','reference','actor','reason'],inspect:['store','case'],materialize:['store','case','data-version','out']}[command];
 assert.ok(required.every(k=>flags[k]),usage);
 const store=openProductionStore({directory:flags.store});
 if(command==='pilot'||command==='export'){
  const spec=command==='pilot'?{caseIds:PILOT_IDS}:read(flags.spec);
  assert.ok(Object.keys(spec).every(k=>['caseIds','intents','editorial'].includes(k)),'Unknown production spec field');
  assert.ok(Array.isArray(spec.caseIds)&&spec.caseIds.length,'Explicit caseIds required');
  if(spec.intents)assert.equal(spec.intents.length,spec.caseIds.length,'Intent coverage');
  const inputs=loadCommunityProduction({ids:spec.caseIds,intents:spec.intents});
  const pkg=createProductionPackage({...inputs,world:loadWorldPackage(flags.world),editorial:spec.editorial});
  store.saveOrder({...pkg,origin:inputs.origin});const exported=store.exportOrder(pkg.order.orderId,flags.out);
  return {orderId:pkg.order.orderId,positions:pkg.order.positions.length,cards:new Set(pkg.order.positions.map(p=>p.cardRef)).size,
   clues:pkg.order.positions.reduce((n,p)=>n+p.request.source.logic.clues.length,0),...exported};
 }
 if(command==='import'){
  const result=store.importResponse({orderId:flags.order,runId:flags.run,responseBytes:fs.readFileSync(flags.response),
   operator:{model:flags.model??null,producedAt:flags['produced-at']??null}});
  return {...result,records:result.records.map(r=>({caseId:r.caseId,flavorVariantId:r.flavorVariantId,revision:r.draft.revision,revisionHash:r.revisionHash}))};
 }
 if(command==='select')return store.selectRevision({reference:read(flags.reference),actor:flags.actor,reason:flags.reason,expectedSelectionHash:flags['expected-selection']??null});
 const selection=store.selected(flags.case);
 if(command==='inspect')return selection;
 assert.ok(selection.selected,'flavor production: no selected revision');
 const {record,position}=store.resolveRevisionContext(selection.selected);
 const editorial=prepareBetaEditorial({editorial:read(path.join(ROOT,'content/community-beta/s04-c-v1/editorial.json')),position,record,dataVersion:Number(flags['data-version'])});
 fs.writeFileSync(flags.out,json(editorial),{flag:'wx'});
 return {out:path.resolve(flags.out),status:'draft',presentationSha256:materializeFlavorRevision(position,record).presentationHash};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(json(main()));}catch(error){console.error(error.message);process.exitCode=1;}
}
