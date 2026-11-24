// A deliberately small local append-only directory. No database or runtime API.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadReleasedAssetCatalog} from './released-asset-catalog.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';
import {createNamedCard,describeIllustratedCard,validateNamedCard,sourceSchema,releaseProvenanceSchema,structure,stableRelease} from './illustrated-card.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const same=(a,b,message)=>assert.equal(canonicalJson(a),canonicalJson(b),'card library: '+message);
const json=value=>JSON.stringify(value,null,2)+'\n';
const read=file=>{assert.ok(fs.lstatSync(file).isFile()&&!fs.lstatSync(file).isSymbolicLink(),'card library: regular file required');return JSON.parse(fs.readFileSync(file,'utf8'));};
const keyHash=key=>{assert.match(key,/^gk-illustrated-card-v1-sha256:([a-f0-9]{64})$/);return key.split(':')[1];};
const linkHash=source=>sha256(canonicalJson({kind:source.kind,id:source.id}));
export const sourceLinkIntegrity=body=>sha256('gezeitenkarten-card-source-link/v1\0'+canonicalJson(body));
const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const hash={type:'string',pattern:'^[a-f0-9]{64}$'};
const linkSchema=obj({schemaVersion:{const:1},source:sourceSchema,cardKey:{type:'string',pattern:'^gk-illustrated-card-v1-sha256:[a-f0-9]{64}$'},
 cardIntegritySha256:hash,release:releaseProvenanceSchema,integritySha256:hash});
export const defaultNameSupply=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'content/card-names/de-v1.json'),'utf8'));

// Link a completely written, fsynced sibling file into the final name. link(2)
// is atomic and exclusive; rename(2) would overwrite a concurrent writer.
function publish(file,value){
 const pending=path.join(path.dirname(file),'.pending-'+randomUUID());
 try{
  const fd=fs.openSync(pending,'wx',0o600);
  try{fs.writeFileSync(fd,json(value));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.linkSync(pending,file);return true;}catch(error){if(error.code==='EEXIST')return false;throw error;}
 }finally{if(fs.existsSync(pending))fs.unlinkSync(pending);}
}
export function openCardLibrary({directory,repositoryRoot=ROOT,supply=defaultNameSupply()}){
 assert.ok(typeof directory==='string'&&directory.trim(),'card library: explicit target directory required');
 fs.mkdirSync(directory,{recursive:true});const root=fs.realpathSync(directory);
 for(const sub of ['cards','links']){
  const target=path.join(root,sub);fs.mkdirSync(target,{recursive:true});
  assert.ok(!fs.lstatSync(target).isSymbolicLink()&&fs.statSync(target).isDirectory(),'card library: directory required');
 }
 const releases=new Map(),archiveChecks=new Set();
 const release=(releaseId,backgroundId)=>{
  const key=canonicalJson([releaseId,backgroundId]);
  if(!releases.has(key))releases.set(key,loadReleasedAssetCatalog({repositoryRoot,releaseId,backgroundId}));
  return releases.get(key);
 };
 function validateProvenance(provenance){
  structure(provenance,releaseProvenanceSchema);
  const loaded=release(provenance.releaseId,provenance.backgroundId);
  same(stableRelease(provenance),stableRelease(loaded.provenance),'release provenance conflict');
  const key=canonicalJson(provenance);
  if(!archiveChecks.has(key)){
   // The claimed archive commit must actually contain this released manifest.
   // Existing release validation remains responsible for approvals and hashes.
   const git=(...args)=>execFileSync('git',['-C',repositoryRoot,...args],{stdio:['ignore','pipe','pipe']});
   const ref='archive/catalog-releases/'+provenance.releaseId+'/manifest.json';
   same(sha256(git('show',provenance.archiveCommit+':'+ref)),sha256(git('show',loaded.provenance.archiveCommit+':'+ref)),'archive provenance conflict');
   archiveChecks.add(key);
  }
  return loaded;
 }
 const fileFor=key=>path.join(root,'cards',keyHash(key)+'.json');
 function load(key,expectedIntegrity){
  const card=read(fileFor(key));
  const loaded=validateProvenance(card.origin?.release);
  validateNamedCard(card,loaded);assert.equal(card.key,key,'card library: filename/key conflict');
  if(expectedIntegrity!==undefined)assert.equal(card.integritySha256,expectedIntegrity,'card library: source/card integrity conflict');
  return card;
 }
 function validateLink(link){
  structure(link,linkSchema);const {integritySha256,...body}=link;
  assert.equal(integritySha256,sourceLinkIntegrity(body),'card library: source link integrity mismatch');
  const card=load(link.cardKey,link.cardIntegritySha256),loaded=validateProvenance(link.release);
  const current=describeIllustratedCard(card,loaded);
  assert.equal(current.key,card.key,'card library: source release/resource conflict');
  return link;
 }
 function lookup(source){
  structure(source,sourceSchema);const file=path.join(root,'links',linkHash(source)+'.json');
  if(!fs.existsSync(file))return null;
  const link=validateLink(read(file));same(link.source,source,'source identity/hash conflict');return link;
 }
 function reuse(input,{releaseId,backgroundId=input.background},source){
  structure(source,sourceSchema);
  const loaded=release(releaseId,backgroundId),description=describeIllustratedCard(input,loaded);
  const prior=lookup(source);
  if(prior)assert.equal(prior.cardKey,description.key,'card library: source/card identity conflict');
  const file=fileFor(description.key);let card,reused=fs.existsSync(file);
  if(reused)card=load(description.key);
  else{
   const proposed=createNamedCard(input,loaded,supply,source);
   reused=!publish(file,proposed);card=reused?load(description.key):proposed;
  }
  // New releases/runs may refer to the same card. Preserve its first origin and
  // names; additional provenance belongs exclusively in the companion index.
  const body={schemaVersion:1,source:structuredClone(source),cardKey:card.key,cardIntegritySha256:card.integritySha256,
   release:structuredClone(loaded.provenance)};
  const proposed={...body,integritySha256:sourceLinkIntegrity(body)};
  const linkFile=path.join(root,'links',linkHash(source)+'.json');
  if(!publish(linkFile,proposed)){
   const existing=validateLink(read(linkFile));same(existing.source,source,'source identity/hash conflict');
   assert.equal(existing.cardKey,card.key,'card library: source/card identity conflict');
   same(stableRelease(existing.release),stableRelease(loaded.provenance),'source release provenance conflict');
  }
  return {card,link:validateLink(read(linkFile)),reused};
 }
 return Object.freeze({directory:root,reuse,load,lookup});
}
