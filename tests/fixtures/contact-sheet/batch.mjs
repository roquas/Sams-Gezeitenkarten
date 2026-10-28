import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const project=fileURLToPath(new URL('../../../',import.meta.url));
export const releaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
export function contactBatchFixture({mode='catalog-informed',count=24,targetCount=12,maxAttempts=100,assignmentSeedStart,config}={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-contact-test-')),program=path.join(directory,'program'),batch=path.join(directory,'batch');
 const git=(...args)=>execFileSync('git',args,{stdio:['ignore','pipe','pipe']});
 git('clone','--quiet','--shared','--no-checkout',project,program);
 const constrained=mode==='catalog-compliant';
 git('-C',program,'checkout','--quiet','--detach',constrained?'9d3bd4e8d1d1e47a3f81b1be425ac2b3cdf346e3':'e671d1875813740aecc993437783e65c345c9926');
 const args=[path.join(program,'scripts/generate-map-batch.mjs'),'run','--release',releaseId,
  '--background','sea-blue-01',...(constrained?['--target-count',String(targetCount),'--max-attempts',String(maxAttempts)]:['--count',String(count)]),
  '--seed-start','0','--mode',mode,'--out',batch];
 if(assignmentSeedStart!==undefined)args.push('--assignment-seed-start',String(assignmentSeedStart));
 if(config){const file=path.join(directory,'config.json');fs.writeFileSync(file,JSON.stringify(config));args.push('--config',file);}
 execFileSync(process.execPath,args,{stdio:['ignore','pipe','pipe']});
 return {directory,batch,program,cleanup:()=>fs.rmSync(directory,{recursive:true,force:true})};
}
