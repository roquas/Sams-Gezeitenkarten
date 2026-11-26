import {cliFailure} from './lib/flavor-cli-diagnostics.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {openProductionStore} from './lib/flavor-production-store.mjs';
import {openQualityStore} from './lib/flavor-quality-store.mjs';
import {openFlavorBatch,manualBetaAdapter} from './lib/flavor-batch.mjs';
import {parseQualityResponse} from './lib/flavor-quality-json.mjs';
import {json} from './lib/flavor-production.mjs';
export const HELP='node scripts/flavor-batch.mjs start|resume|import|report|decide --production-store DIR --quality-store DIR --batch ID [--library DIR] [--plan FILE] [--out DIR] [--responses MANIFEST] [--decision FILE] [--report DIR]. start/resume/import advance all internal stages. Response manifest: [{workId, file, operator?: {model, producedAt, kind}}]. Files contain unchanged standard envelopes, never a combined model answer.';
const read=file=>parseQualityResponse(fs.readFileSync(file));
export function main(args=process.argv.slice(2)){
 if(args.length===1&&args[0]==='--help')return HELP;
 const [command,...rest]=args;assert.ok(['start','resume','import','report','decide'].includes(command),HELP);
 const flags={};for(let i=0;i<rest.length;i+=2){const k=rest[i]?.slice(2);assert.ok(rest[i]?.startsWith('--')&&['production-store','quality-store','library','batch','plan','out','responses','decision','report'].includes(k)&&rest[i+1]&&!Object.hasOwn(flags,k),HELP);flags[k]=rest[i+1];}
 assert.ok(flags['production-store']&&flags['quality-store']&&flags.batch,HELP);
 const production=openProductionStore({directory:flags['production-store'],libraryDirectory:flags.library}),quality=openQualityStore({directory:flags['quality-store'],production});
 let failedImports=0;
 const batch=openFlavorBatch({quality,production,batchId:flags.batch});
 if(command==='start'){assert.ok(flags.plan,HELP);batch.create(read(flags.plan));}
 if(command==='import'){
  assert.ok(flags.responses,HELP);const manifest=read(flags.responses);assert.ok(Array.isArray(manifest),'response manifest must be an array');
  const result=batch.importMany(manifest.map(r=>{assert.ok(Object.keys(r).every(k=>['workId','file','operator'].includes(k)));return {workId:r.workId,responseBytes:fs.readFileSync(path.resolve(path.dirname(flags.responses),r.file)),...(r.operator?{operator:r.operator}:{})};}));
  failedImports=result.filter(r=>r.error).length;
  if(failedImports)console.error(json({technicalImportErrors:result.filter(r=>r.error)}));
 }
 if(command==='decide'){assert.ok(flags.decision,HELP);batch.decide(read(flags.decision));return {decisionStored:true};}
 let report;
 if(['start','resume','import'].includes(command)){assert.ok(flags.out,HELP);report=batch.run(manualBetaAdapter({out:flags.out}));}else report=batch.report();
 if(flags.report){fs.mkdirSync(flags.report,{recursive:true});const id=Date.now()+'-'+Math.random().toString(16).slice(2);
  fs.writeFileSync(path.join(flags.report,id+'-summary.json'),json(report.summary),{flag:'wx'});
  fs.writeFileSync(path.join(flags.report,id+'-summary.txt'),'F02-B Batch\n'+json(report.summary),{flag:'wx'});
  fs.writeFileSync(path.join(flags.report,id+'-DETAILS.json'),json(report.details),{flag:'wx',mode:0o600});
 }
 return {summary:report.summary,openWork:report.work,...(failedImports?{failedImports}:{})};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const result=main();console.log(typeof result==='string'?result:json(result));if(result?.failedImports)process.exitCode=1;}catch(e){cliFailure(e);}}
