// Manual offline transport only. No GenAI calls, repair, selection or publishing.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {json} from './lib/flavor-production.mjs';
import {openProductionStore} from './lib/flavor-production-store.mjs';
import {openQualityStore} from './lib/flavor-quality-store.mjs';
import {preparePilotStore} from './lib/flavor-quality-pilot.mjs';
import {EMPTY_CONTEXT} from './lib/flavor-quality-package.mjs';
export const HELP=`F02-B PR1 · offline manual three-stage quality checks
node scripts/flavor-quality.mjs COMMAND --production-store DIR --quality-store DIR ...
  prepare-pilot --out DIR              Adopt sealed real pilot in separate production store and export blind batch
  blind-export --references FILE --out DIR [--context FILE] [--repeat yes]
  export --job ID --out DIR            Re-export the exact immutable public job
  reader-import --job ID --run ID --response FILE [--model NAME] [--produced-at ISO] [--context FILE] [--evidence-kind external-manual|technical-test]
  compare --job ID                     Deterministic isolated comparisons for complete reader items
  review-export --reader-job ID --out DIR [--repeat yes]
  review-import --job ID --run ID --response FILE [--model NAME] [--produced-at ISO] [--context FILE] [--evidence-kind external-manual|technical-test]
  inspect --job ID [--context FILE]    Bound local result, technical progress and calibration limits
references FILE: JSON array of existing revisionRef objects. context FILE: {version:1,episodes:[revisionRef,...]} in actual series order, empty by default. editorial.context is never used as player text.
Only the --out directory is transportable. The quality store contains private bindings and must remain local. Reader and review jobs go to separate fresh chats without repository/project sources. No external answers are generated here.\n`;
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export function main(args=process.argv.slice(2)){
 if(args.length===0||args[0]==='--help')return HELP;
 const [command,...rest]=args,flags={};
 const extra={ 'prepare-pilot':['out'],'blind-export':['references','out','context','repeat'],export:['job','out'],
 'reader-import':['job','run','response','model','produced-at','context','evidence-kind'],compare:['job'],
 'review-export':['reader-job','out','repeat'],'review-import':['job','run','response','model','produced-at','context','evidence-kind'],inspect:['job','context']}[command];
 assert.ok(extra,HELP);const allowed=['production-store','quality-store',...extra];
 for(let i=0;i<rest.length;i+=2){const key=rest[i]?.slice(2);assert.ok(rest[i]?.startsWith('--')&&allowed.includes(key)&&rest[i+1]&&!rest[i+1].startsWith('--')&&!Object.hasOwn(flags,key),HELP);flags[key]=rest[i+1];}
 const required={'prepare-pilot':['out'],'blind-export':['references','out'],export:['job','out'],'reader-import':['job','run','response'],compare:['job'],
 'review-export':['reader-job','out'],'review-import':['job','run','response'],inspect:['job']}[command];
 assert.ok(['production-store','quality-store',...required].every(k=>flags[k]),HELP);
 if(flags.repeat)assert.equal(flags.repeat,'yes',HELP);
 const pilot=command==='prepare-pilot'?preparePilotStore(flags['production-store']):null;
 const production=pilot?.production??openProductionStore({directory:flags['production-store']}),quality=openQualityStore({directory:flags['quality-store'],production});
 const context=flags.context?read(flags.context):undefined;
 if(command==='prepare-pilot'||command==='blind-export'){
  const batch=quality.createBlindBatch({references:pilot?.references??read(flags.references),context:context??EMPTY_CONTEXT,omitCompleted:flags.repeat!=='yes'});
  return {...batch,...(batch.jobId?quality.exportJob(batch.jobId,flags.out):{}),...(pilot?{responseSha256:pilot.responseSha256,provenance:pilot.provenance}:{})};
 }
 if(command==='export')return quality.exportJob(flags.job,flags.out);
 if(command.endsWith('-import')){
  const saved=quality.loadJob(flags.job);assert.equal(saved.job.stage,command==='reader-import'?'reader':'reviewer','Incorrect import stage');
  const result=quality.importResponse({jobId:flags.job,runId:flags.run,responseBytes:fs.readFileSync(flags.response),context,
   operator:{model:flags.model??null,producedAt:flags['produced-at']??null,kind:flags['evidence-kind']??'external-manual'}});
  return {...result,accepted:result.accepted.map(i=>i.itemId)};
 }
 if(command==='compare')return quality.compare(flags.job);
 if(command==='review-export'){
  const batch=quality.createReviewBatch({readerJobId:flags['reader-job'],omitCompleted:flags.repeat!=='yes'});
  return {...batch,...(batch.jobId?quality.exportJob(batch.jobId,flags.out):{})};
 }
 return quality.inspect(flags.job,{context});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=main();console.log(typeof result==='string'?result:json(result));}catch(error){console.error(error.message);process.exitCode=1;}
}
