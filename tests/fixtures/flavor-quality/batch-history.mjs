// Synthetic cross-method history fixture. No external execution or real stores.
import fs from 'node:fs';
import {productionFixture,technicalResponse} from '../flavor-production.mjs';
import {technicalReader,technicalReviewer,TECHNICAL_OPERATOR} from './technical-responses.mjs';
import {openProductionStore,revisionReference} from '../../../scripts/lib/flavor-production-store.mjs';
import {openQualityStore} from '../../../scripts/lib/flavor-quality-store.mjs';
import {openFlavorBatch,technicalTestAdapter} from '../../../scripts/lib/flavor-batch.mjs';
import {METHOD_HASH} from '../../../scripts/lib/flavor-quality-package.mjs';
const bytes=x=>Buffer.from(JSON.stringify(x)),fixture=productionFixture(),base=process.argv[2],output=[];
for(const count of [1,2]){
 const directory=base+'/'+count,production=openProductionStore({directory:directory+'/production'});production.saveOrder(fixture);
 const records=production.importResponse({orderId:fixture.order.orderId,runId:'technical-seed',responseBytes:bytes(technicalResponse(fixture.order)),operator:TECHNICAL_OPERATOR}).records;
 let reference=revisionReference(records[0]);const quality=openQualityStore({directory:directory+'/quality',production}),batch=openFlavorBatch({quality,production,batchId:'historical'});
 function patch(id){const authorization={version:1,jobId:id,predecessor:reference,sourceHash:production.findRecord(reference).request.sourceHash,methodHash:METHOD_HASH,findings:[{id:'test',severity:'ERROR',rationale:'TECHNICAL TEST ONLY'}],targets:[{field:'title'}],actor:'technical fixture',reason:'synthetic method boundary',timestamp:'2026-11-26T10:00:00Z'};
  reference=revisionReference(production.importScopedRepair({runId:id,responseBytes:bytes({version:1,jobId:id,predecessor:reference,changes:[{target:{field:'title'},value:'TECHNICAL OLD METHOD '+id}]}),authorization,provenance:{kind:'external-model-patch',actor:'test',operator:TECHNICAL_OPERATOR}}).records[0]);
 }
 patch('r2');batch.create({references:[reference],budgets:{clarifications:0,replacements:0}});
 const adapter=technicalTestAdapter(({work})=>work.some(w=>w.kind==='repair')?[]:work.map(w=>{
  const s=quality.loadJob(w.jobId),reply=w.kind==='reader'?technicalReader(s.job,s.sidecar.items.map(b=>production.findRecord(b.revisionRef).request.source.logic.clues)):technicalReviewer(s.job);
  if(w.kind==='reviewer')reply.items[0].findings=[{id:'f1',severity:'ERROR',requirement:'technical',unitIds:[s.job.items[0].input.public.units[0].id],factRefs:['public.rules'],rationale:'TECHNICAL TEST ONLY',claimIds:[],method:'technical-test',evidenceRefs:['reader'],repairTarget:'title'}];
  return {workId:w.id,responseBytes:bytes(reply)};
 }));
 let report=batch.run(adapter);if(count===2){patch('r3');report=batch.run(adapter);}
 let partialClarification=null;
 if(count===1){
  const prior=report.details.evidence.find(e=>e.work.kind==='reviewer'),clarification={jobId:prior.work.jobId,itemId:prior.quality.results[0].result.itemId};
  const fresh=quality.createBlindBatch({references:[reference],omitCompleted:false,clarification}),saved=quality.loadJob(fresh.jobId);
  quality.importResponse({jobId:fresh.jobId,runId:'technical-partial-clarification',responseBytes:bytes(technicalReader(saved.job,[production.findRecord(reference).request.source.logic.clues])),operator:TECHNICAL_OPERATOR});quality.compare(fresh.jobId);
  partialClarification={reference:clarification,readerJobId:fresh.jobId};
 }
 output.push({directory,reference,failedRevisions:count,discarded:report.summary.discardedStories,methodHash:METHOD_HASH,partialClarification});
}
fs.writeFileSync(base+'/history.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
