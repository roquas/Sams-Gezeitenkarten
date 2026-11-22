// Fixed small Phase-B experiment only; no production option or public export.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {runPilot,config} from './lib/s04-c-pilot.mjs';
const script=fileURLToPath(import.meta.url),args=process.argv.slice(2);
if(args.length===2&&args[0]==='--worker'){
 try{const result=await runPilot(path.resolve(args[1]));console.log(JSON.stringify(result));}
 catch(error){console.error(error.stack);process.exitCode=1;}
}else if(args.length===1&&!args[0].startsWith('--')){
 const out=path.resolve(args[0]);
 if(fs.existsSync(out))throw Error('S04-C output directory must not exist');
 const result=spawnSync(process.execPath,[script,'--worker',out],{stdio:'inherit',timeout:config.timeoutMs,killSignal:'SIGKILL'});
 if(result.error||result.status!==0){
  if(fs.existsSync(out))fs.writeFileSync(path.join(out,'ABORTED.json'),JSON.stringify({status:'aborted',reason:result.error?.code??'WORKER_FAILURE'}));
  console.error('S04-C aborted; partial output is not valid evidence. No retry.');process.exitCode=1;
 }
}else{console.error('Usage: node scripts/run-s04-c-pilot.mjs NEW_OUTPUT_DIRECTORY');process.exitCode=1;}
