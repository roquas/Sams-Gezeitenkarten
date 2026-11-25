// Shared snapshot mechanics; production v1 byte formats remain unchanged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {resolvePackagePath} from './package-path.mjs';
import {json,same} from './flavor-production.mjs';
import {packageInventory} from './flavor-production-package.mjs';

export const localId=value=>assert.match(value,/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/,'flavor production: invalid local reference');
export const parseJsonBytes=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
const regular=file=>{const stat=fs.lstatSync(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'flavor production: regular file required: '+file);};
export function directory(dir){fs.mkdirSync(dir,{recursive:true});assert.ok(!fs.lstatSync(dir).isSymbolicLink()&&fs.statSync(dir).isDirectory(),'flavor production: real directory required');}
export function readTree(dir){
 assert.ok(!fs.lstatSync(dir).isSymbolicLink()&&fs.statSync(dir).isDirectory(),'flavor production: real snapshot directory required');
 const files=new Map();
 function walk(root,prefix=''){
  for(const entry of fs.readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)){
   const ref=prefix+entry.name,file=path.join(root,entry.name);
   assert.ok(!entry.isSymbolicLink(),'flavor production: symlink in snapshot');
   if(entry.isDirectory())walk(file,ref+'/');else{regular(file);files.set(ref,fs.readFileSync(file));}
  }
 }
 walk(dir);return files;
}
function fsyncDirectory(dir){const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export function publishTree(target,files,beforePublish){
 if(fs.existsSync(target)){
  const existing=readTree(target);same(packageInventory(existing),packageInventory(files),'immutable snapshot conflict: '+path.basename(target));return false;
 }
 const staging=path.join(path.dirname(target),'.pending-'+randomUUID());fs.mkdirSync(staging);
 try{
  for(const [ref,bytes] of files){
   const safe=resolvePackagePath('.',ref);assert.equal(safe,ref,'flavor production: invalid snapshot path');
   const file=path.join(staging,safe);fs.mkdirSync(path.dirname(file),{recursive:true});
   const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  }
  const dirs=[staging,...fs.readdirSync(staging,{recursive:true}).map(ref=>path.join(staging,ref)).filter(f=>fs.statSync(f).isDirectory())];
  dirs.reverse().forEach(fsyncDirectory);
  beforePublish?.();fs.renameSync(staging,target);fsyncDirectory(path.dirname(target));return true;
 }finally{fs.rmSync(staging,{recursive:true,force:true});}
}
export function seal(files){return new Map([...files,['complete.json',json(packageInventory(files))]]);}
export function unseal(files){
 assert.ok(files.has('complete.json'),'flavor production: incomplete snapshot');
 const body=new Map([...files].filter(([ref])=>ref!=='complete.json'));
 same(parseJsonBytes(files.get('complete.json')),packageInventory(body),'snapshot integrity mismatch');return body;
}
export function withStoreLock(root,work){
 const file=path.join(root,'.write-lock');let fd;
 try{fd=fs.openSync(file,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('writer lock exists; inspect an interrupted writer before manual removal');throw e;}
 try{fs.writeFileSync(fd,json({pid:process.pid}));fs.fsyncSync(fd);return work();}
 finally{fs.closeSync(fd);fs.unlinkSync(file);}
}
