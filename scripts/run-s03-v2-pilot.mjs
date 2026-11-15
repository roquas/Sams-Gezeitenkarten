// Fixed v2 source replay; the watchdog covers preparation, diagnoses and export.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {runV2,configV2} from './lib/s03-v2-pilot.mjs';
const script=fileURLToPath(import.meta.url);
if(process.argv[2]==='--worker'&&process.argv.length===4){
 try{const result=runV2(path.resolve(process.argv[3]));console.log(JSON.stringify({experimentId:result.experimentId,selected:result.selected.length}));}
 catch(error){console.error(error.stack);process.exitCode=1;}
}else if(process.argv.length===3){
 const out=path.resolve(process.argv[2]);
 if(fs.existsSync(out))throw Error('S03 output directory must not exist');
 const result=spawnSync(process.execPath,[script,'--worker',out],{stdio:'inherit',timeout:configV2.timeoutMs,killSignal:'SIGKILL'});
 if(result.error||result.status!==0){
  if(fs.existsSync(out))fs.writeFileSync(path.join(out,'ABORTED.json'),JSON.stringify({status:'aborted',reason:result.error?.code??'WORKER_FAILURE'}));
  console.error('S03 v2 aborted; partial files are not a valid stock. No retry.');process.exitCode=1;
 }
}else{console.error('Usage: node scripts/run-s03-v2-pilot.mjs NEW_OUTPUT_DIRECTORY');process.exitCode=1;}
