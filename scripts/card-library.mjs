import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {importCardBatch,importPuzzleCandidates,importCommunityCards} from './lib/card-import.mjs';
import {openCardLibrary} from './lib/card-library.mjs';

const usage='Usage: node scripts/card-library.mjs batch|candidates|community|check --library DIR [--batch DIR | --file JSONL --release ID --background ID [--origin-contract FILE --expect-origin-contract-sha256 HASH] | --ids C-06,C-02,C-03,C-11 | --key KEY] [--supply FILE] [--repository DIR]';
export async function main(args=process.argv.slice(2)){
 const [mode,...rest]=args,options={};
 const allowed={batch:['library','batch','repository','supply'],candidates:['library','file','release','background','origin-contract','expect-origin-contract-sha256','repository','supply'],
  community:['library','ids','supply'],check:['library','key','repository']};
 assert.ok(Object.hasOwn(allowed,mode)&&rest.length%2===0,usage);
 for(let i=0;i<rest.length;i+=2){
  const key=rest[i].slice(2);assert.ok(rest[i].startsWith('--')&&allowed[mode].includes(key)&&!Object.hasOwn(options,key)&&rest[i+1],usage);
  options[key]=rest[i+1];
 }
 assert.ok(options.library,usage);
 const common={directory:options.library,...(options.repository?{repositoryRoot:options.repository}:{}),
  ...(options.supply?{supply:JSON.parse(fs.readFileSync(options.supply,'utf8'))}:{})};
 if(mode==='batch'){assert.ok(options.batch,usage);return importCardBatch({...common,batch:options.batch});}
 if(mode==='community')return importCommunityCards({...common,...(options.ids?{ids:options.ids.split(',')}:{})});
 if(mode==='check'){assert.ok(options.key,usage);const card=openCardLibrary(common).load(options.key);return {key:card.key,integritySha256:card.integritySha256,status:'validated'};}
 assert.ok(options.file&&options.release&&options.background,usage);
 assert.equal(Boolean(options['origin-contract']),Boolean(options['expect-origin-contract-sha256']),usage);
 const originContext=options['origin-contract']?{originContract:JSON.parse(fs.readFileSync(options['origin-contract'],'utf8')),
  expectedOriginContractSha256:options['expect-origin-contract-sha256']}:undefined;
 return importPuzzleCandidates({...common,file:options.file,releaseId:options.release,backgroundId:options.background,originContext});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await main(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
