import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,buildPlaytest,readPlaytestSource,playtestStock,parsePlaytestArgs} from './lib/b2-playtest.mjs';

export function main(argv=process.argv.slice(2)){
 const {stock,args}=parsePlaytestArgs(argv);
 if(args.length)throw Error('Usage: export-b2-playtest.mjs [--stock S01|S02]');
 const files=buildPlaytest(readPlaytestSource(stock)); // Validate everything before replacing local output.
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
 return `B2: ${files.size-1} Kandidaten exportiert. Start: http://localhost:8000/?dev=b2${stock==='S01'?'':'&stock='+stock}`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
