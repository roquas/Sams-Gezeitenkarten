import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const project=fileURLToPath(new URL('../../../',import.meta.url));
export const releaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
export function contactBatchFixture({targetCount=12,maxAttempts=100,assignmentSeedStart,config={maxMapAttempts:1}}={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-contact-test-')),program=path.join(directory,'program'),batch=path.join(directory,'batch');
 const git=(...args)=>execFileSync('git',args,{stdio:['ignore','pipe','pipe']});
 git('clone','--quiet','--shared','--no-checkout',project,program);
 git('-C',program,'checkout','--quiet','--detach','HEAD');
 for(const name of ['src','scripts'])fs.cpSync(path.join(project,name),path.join(program,name),{recursive:true});
 git('-C',program,'add','src','scripts');
 if(git('-C',program,'diff','--cached','--name-only').length)git('-C',program,'-c','user.name=Contact fixture',
  '-c','user.email=contact@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Current contact fixture program');
 const args=[path.join(program,'scripts/generate-map-batch.mjs'),'run','--release',releaseId,
  '--background','sea-blue-01','--target-count',String(targetCount),'--max-attempts',String(maxAttempts),
  '--seed-start','0','--out',batch];
 if(assignmentSeedStart!==undefined)args.push('--assignment-seed-start',String(assignmentSeedStart));
 if(config){const file=path.join(directory,'config.json');fs.writeFileSync(file,JSON.stringify(config));args.push('--config',file);}
 execFileSync(process.execPath,args,{stdio:['ignore','pipe','pipe']});
 return {directory,batch,program,cleanup:()=>fs.rmSync(directory,{recursive:true,force:true})};
}
