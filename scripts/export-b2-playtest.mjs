import fs from 'node:fs';
import path from 'node:path';
import {ROOT,OUTPUT,buildPlaytest} from './lib/b2-playtest.mjs';

const files=buildPlaytest(); // Validate everything before replacing local output.
const target=path.join(ROOT,OUTPUT);
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
console.log(`B2: ${files.size-1} Kandidaten exportiert. Start: http://localhost:8000/?dev=b2`);
