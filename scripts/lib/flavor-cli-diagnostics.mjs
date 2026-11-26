// Standard channels never receive parser/assertion payloads or input paths.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function cliFailure(error,args=process.argv.slice(2)){
 const index=args.indexOf('--report');
 if(index>=0&&args[index+1]&&!args[index+1].startsWith('--')){
  try{const dir=args[index+1];fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'failure-'+randomUUID()+'-DETAILS.txt'),String(error.stack??error),{flag:'wx',mode:0o600});}catch{/* A diagnostic write failure must also stay spoiler-free. */}
 }
 const message=String(error.message??'');
 const action=message.startsWith('writer lock exists;')?'writer lock exists; inspect the writer before retrying.':
  message.startsWith('flavor production: variant already exists:')?'variant already exists; inspect the current revision before retrying.':
  'Check required arguments and file access; inspect separate local diagnostics. Batch commands accept --report DIR for private failure details.';
 console.error('Command failed. '+action);
 process.exitCode=1;
}
