import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,buildPlaytest,readPlaytestSource,playtestStock,parsePlaytestArgs} from './lib/b2-playtest.mjs';
import {buildPositiveV2Playtest} from './lib/b2-positive-v2.mjs';
import {buildPositivePlaytest} from './lib/b2-positive.mjs';

export function main(argv=process.argv.slice(2)){
 const {stock,args}=parsePlaytestArgs(argv);
 if(args.length)throw Error('Usage: export-b2-playtest.mjs [--stock S01|S02|BC|POSITIVE|POSITIVE-V2]');
 const files=stock==='POSITIVE-V2'?buildPositiveV2Playtest():stock==='POSITIVE'?buildPositivePlaytest():buildPlaytest(readPlaytestSource(stock)); // Validate before replacing output.
 const target=path.join(ROOT,playtestStock(stock).output);
 const identical=()=>{
  try{return fs.readdirSync(target).length===files.size&&[...files].every(([name,bytes])=>fs.readFileSync(path.join(target,name),'utf8')===bytes);}catch{return false;}
 };
 fs.mkdirSync(path.dirname(target),{recursive:true});
 const staging=fs.mkdtempSync(path.join(ROOT,'.dev/b2-export-'));
 try{
  for(const [name,bytes] of files)fs.writeFileSync(path.join(staging,name),bytes);
  if(!identical()){
   try{fs.renameSync(staging,target);}catch(error){
    if(!['EEXIST','ENOTEMPTY'].includes(error.code))throw error;
    if(!identical()){
     fs.rmSync(target,{recursive:true,force:true});
     fs.renameSync(staging,target);
    }
   }
  }
 }finally{fs.rmSync(staging,{recursive:true,force:true});}
 // mkdtemp creates 700 directories. Static Uberspace serving needs traversal
 // and readable public DTOs, including after an otherwise identical export.
 fs.chmodSync(path.dirname(target),0o755);
 fs.chmodSync(target,0o755);
 for(const name of files.keys())fs.chmodSync(path.join(target,name),0o644);
 return `B2: ${files.size-1} Kandidaten exportiert. Start: http://localhost:8000/?dev=b2${stock==='S01'?'':'&stock='+stock}`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
