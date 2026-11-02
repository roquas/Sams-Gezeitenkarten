import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildCatalogReleaseCandidate} from '../../scripts/lib/catalog-release.mjs';

export const project=fileURLToPath(new URL('../../',import.meta.url));
export function catalogProofFixture(){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-catalog-proof-'));
 const source=execFileSync('git',['-C',project,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const candidate=path.join(directory,'candidate');
 try{
  const built=buildCatalogReleaseCandidate({repositoryRoot:project,source,out:candidate});
  return {directory,candidate,source,built,cleanup:()=>fs.rmSync(directory,{recursive:true,force:true})};
 }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
}
