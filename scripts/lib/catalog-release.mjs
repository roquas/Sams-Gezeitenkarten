// Node/Git adapter. Loading and verification spawn Git only; the image worker
// is reachable solely through buildCatalogReleaseCandidate.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {sha256} from './content-hash.mjs';
import {assert,same,hash,commit,releaseIdValid,safePath,parse,jsonBytes,record,
 POLICY_PATH,RELEASE_ROOT,CANDIDATE_FILES,RELEASE_FILES,checkerPath,implementationIdentity,
 describeSnapshot,releaseIdentity,validateTechnical} from './catalog-release-format.mjs';

function git(repositoryRoot,args){
 try{return execFileSync('git',['-C',repositoryRoot,...args],{maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});}
 catch(error){throw Error('catalog-release: Git object/command unavailable ('+args[0]+'): '+(error.stderr?.toString().trim()||error.message));}
}
function resolveCommit(root,ref){
 assert(typeof ref==='string'&&ref.length>0&&!ref.startsWith('-'),'invalid Git revision');
 const result=git(root,['rev-parse','--verify',ref+'^{commit}']).toString().trim();
 assert(commit(result),'unsupported Git object format');return result;
}
function repository(root){return fs.realpathSync(git(root,['rev-parse','--show-toplevel']).toString().trim());}
function ancestor(root,source,target){
 try{git(root,['merge-base','--is-ancestor',source,target]);}
 catch{throw Error('catalog-release: source commit must be an available ancestor of the archive commit');}
}
function snapshotReader(repositoryRoot,sourceCommit){
 assert(commit(sourceCommit),'invalid source commit');
 const tree=new Map();
 for(const entry of git(repositoryRoot,['ls-tree','-r','--full-tree','-z',sourceCommit]).toString().split('\0').filter(Boolean)){
  const tab=entry.indexOf('\t'),[mode,type,oid]=entry.slice(0,tab).split(' '),p=entry.slice(tab+1);
  tree.set(p,{mode,type,oid});
 }
 const cache=new Map();
 const read=p=>{
  safePath(p);const item=tree.get(p);
  assert(item&&item.type==='blob'&&['100644','100755'].includes(item.mode),'missing or unsafe Git resource: '+p);
  if(!cache.has(p))cache.set(p,git(repositoryRoot,['cat-file','blob',item.oid]));
  return cache.get(p);
 };
 return {tree,read};
}
function implementationFor(sourceCommit,reader){
 const files=[...reader.tree.keys()].filter(checkerPath).sort().map(path=>({path,sha256:sha256(reader.read(path))}));
 assert(files.some(f=>f.path==='scripts/check-catalog-release.mjs')&&files.some(f=>f.path==='scripts/check-catalog-release-images.py'),
  'source commit lacks release v1 checker; commit the infrastructure first (no working-tree fallback)');
 return {sourceCommit,files,sha256:implementationIdentity(files)};
}
function frozen(value){
 if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;
}
function verifyDocuments({repositoryRoot,documents,releaseId,approval=false,archiveCommit}){
 const manifest=parse(documents.get('manifest.json'));
 record(manifest,['releaseSchemaVersion','releaseId','catalogId','sourceCommit','assetCatalog','resourceBase','inventorySha256','validationSha256','selectionSha256'],'manifest');
 assert(manifest.releaseSchemaVersion===1,'unsupported release schema');
 assert(releaseIdValid(manifest.releaseId)&&manifest.releaseId===releaseIdentity(manifest),'release identity mismatch');
 if(releaseId!==undefined)same(manifest.releaseId,releaseId,'requested release ID mismatch');
 assert(commit(manifest.sourceCommit),'invalid source commit');
 for(const name of ['inventory','validation','selection']){
  assert(hash(manifest[name+'Sha256']),'invalid '+name+' hash');
  same(sha256(documents.get(name+'.json')),manifest[name+'Sha256'],name+' hash mismatch');
 }
 const reader=snapshotReader(repositoryRoot,manifest.sourceCommit),snapshot=describeSnapshot(reader.read);
 same(parse(documents.get('inventory.json')),snapshot.inventory,'inventory/size/hash/closure mismatch');
 same(manifest.catalogId,snapshot.catalogId,'catalog identity mismatch');
 same(manifest.assetCatalog,snapshot.policy.assetCatalog,'catalog path mismatch');
 same(manifest.resourceBase,snapshot.policy.resourceBase,'resource base mismatch');
 same(parse(documents.get('selection.json')),snapshot.selection,'production selection conflict');
 const validation=parse(documents.get('validation.json'));
 validateTechnical(validation,snapshot,implementationFor(manifest.sourceCommit,reader));
 const manifestSha256=sha256(documents.get('manifest.json'));
 if(approval){
  const decision=parse(documents.get('approval.json'));
  record(decision,['approvalSchemaVersion','decision','releaseId','manifestSha256','approvedBy','approvedAt'],'approval');
  assert(decision.approvalSchemaVersion===1&&decision.decision==='approved','release approval missing/invalid');
  same(decision.releaseId,manifest.releaseId,'approval release mismatch');same(decision.manifestSha256,manifestSha256,'approval manifest hash mismatch');
  assert(typeof decision.approvedBy==='string'&&decision.approvedBy.trim().length>0,'approval name missing');
  assert(typeof decision.approvedAt==='string'&&!Number.isNaN(Date.parse(decision.approvedAt))&&new Date(decision.approvedAt).toISOString()===decision.approvedAt,'invalid approval date');
  ancestor(repositoryRoot,manifest.sourceCommit,archiveCommit);
 }
 // Capture all verified bytes before exposing a handle; copies prevent callers
 // from modifying the private snapshot or reading a later working-tree file.
 const resources=new Map(snapshot.inventory.files.map(f=>[f.path,Buffer.from(reader.read(f.path))]));
 return {manifest,manifestSha256,snapshot,validation,resources};
}
function diskDocuments(directory,names){
 assert(!fs.lstatSync(directory).isSymbolicLink()&&fs.statSync(directory).isDirectory(),'candidate must be a real directory');
 same(fs.readdirSync(directory).sort(),[...names].sort(),'incomplete candidate or unexpected files');
 return new Map(names.map(name=>{
  const p=path.join(directory,name);assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink(),'unsafe candidate file: '+name);
  return [name,fs.readFileSync(p)];
 }));
}
function isWithin(parent,child){return child===parent||child.startsWith(parent+path.sep);}
function realDestination(directory){
 // Resolve existing ancestors to reject a candidate hidden inside the archive
 // through an alias/symlink. Destinations themselves must not already exist.
 const absolute=path.resolve(directory),parent=fs.realpathSync(path.dirname(absolute));
 return path.join(parent,path.basename(absolute));
}
function writeNewDirectory(directory,documents){
 assert(!fs.existsSync(directory),'destination already exists: '+directory);
 const temporary=fs.mkdtempSync(path.join(path.dirname(directory),'.catalog-pending-'));
 try{
  for(const [name,bytes] of documents)fs.writeFileSync(path.join(temporary,name),bytes,{flag:'wx'});
  // mkdir is the no-overwrite reservation; concurrent writers cannot both win.
  fs.mkdirSync(directory);
  try{for(const name of documents.keys())fs.renameSync(path.join(temporary,name),path.join(directory,name));}
  catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}

export function buildCatalogReleaseCandidate({repositoryRoot,source,out}){
 repositoryRoot=repository(repositoryRoot);const sourceCommit=resolveCommit(repositoryRoot,source);
 const destination=realDestination(out),archive=path.join(repositoryRoot,RELEASE_ROOT);
 assert(!isWithin(archive,destination),'candidate must be outside release archive');
 assert(!fs.existsSync(destination),'destination already exists');
 const reader=snapshotReader(repositoryRoot,sourceCommit);
 assert(reader.tree.has(POLICY_PATH),'source commit lacks release v1 policy; commit the infrastructure first');
 const implementation=implementationFor(sourceCommit,reader),snapshot=describeSnapshot(reader.read);
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'gk-catalog-check-'));
 let validation;
 try{
  const files=new Set([...snapshot.inventory.files.map(f=>f.path),...implementation.files.map(f=>f.path)]);
  for(const p of files){const full=path.join(temporary,p);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,reader.read(p));}
  const worker=spawnSync(process.execPath,[path.join(temporary,'scripts/check-catalog-release.mjs')],{
   cwd:temporary,input:JSON.stringify({sourceCommit,catalogId:snapshot.catalogId,implementation}),encoding:'utf8',maxBuffer:64*1024*1024,
   env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  if(worker.error)throw worker.error;
  assert(worker.status===0,'pinned technical validation failed: '+worker.stderr);
  validation=parse(worker.stdout);validateTechnical(validation,snapshot,implementation);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 const documents=new Map([['inventory.json',jsonBytes(snapshot.inventory)],['validation.json',jsonBytes(validation)],['selection.json',jsonBytes(snapshot.selection)]]);
 const manifest={releaseSchemaVersion:1,catalogId:snapshot.catalogId,sourceCommit,assetCatalog:snapshot.policy.assetCatalog,resourceBase:snapshot.policy.resourceBase,
  inventorySha256:sha256(documents.get('inventory.json')),validationSha256:sha256(documents.get('validation.json')),selectionSha256:sha256(documents.get('selection.json'))};
 manifest.releaseId=releaseIdentity(manifest);documents.set('manifest.json',jsonBytes(manifest));
 const checked=verifyDocuments({repositoryRoot,documents});writeNewDirectory(destination,documents);
 return {releaseId:manifest.releaseId,catalogId:manifest.catalogId,manifestSha256:checked.manifestSha256,directory:destination};
}

export function verifyCatalogReleaseCandidate({repositoryRoot,candidate}){
 repositoryRoot=repository(repositoryRoot);
 const checked=verifyDocuments({repositoryRoot,documents:diskDocuments(candidate,CANDIDATE_FILES)});
 return {releaseId:checked.manifest.releaseId,catalogId:checked.manifest.catalogId,manifestSha256:checked.manifestSha256};
}

// Read-only candidate handle: the same verification as `verify`, with captured
// Git resources. No archive or approval is needed, and no checkout fallback.
export function loadCatalogReleaseCandidate({repositoryRoot,candidate}){
 repositoryRoot=repository(repositoryRoot);
 const checked=verifyDocuments({repositoryRoot,documents:diskDocuments(candidate,CANDIDATE_FILES)});
 return Object.freeze({manifest:frozen(checked.manifest),manifestSha256:checked.manifestSha256,
  library:frozen(checked.snapshot.library),selection:frozen(checked.snapshot.selection),validation:frozen(checked.validation),
  readResource(ref){safePath(ref);assert(checked.resources.has(ref),'resource not in candidate: '+ref);return Buffer.from(checked.resources.get(ref));}});
}

export function approveCatalogRelease({repositoryRoot,candidate,releaseId,manifestSha256,approvedBy}){
 repositoryRoot=repository(repositoryRoot);
 assert(releaseIdValid(releaseId)&&hash(manifestSha256),'explicit release ID and manifest hash required');
 assert(typeof approvedBy==='string'&&approvedBy.trim().length>0,'approval name required');
 const archive=path.join(repositoryRoot,RELEASE_ROOT),candidatePath=fs.realpathSync(candidate);
 assert(!isWithin(archive,candidatePath),'candidate must be outside release archive');
 const documents=diskDocuments(candidatePath,CANDIDATE_FILES),checked=verifyDocuments({repositoryRoot,documents,releaseId});
 same(checked.manifestSha256,manifestSha256,'explicit manifest hash mismatch');
 ancestor(repositoryRoot,checked.manifest.sourceCommit,resolveCommit(repositoryRoot,'HEAD'));
 // Reject symlinked archive components rather than writing through an alias.
 let component=repositoryRoot;
 for(const part of RELEASE_ROOT.split('/')){
  component=path.join(component,part);
  if(fs.existsSync(component))assert(fs.lstatSync(component).isDirectory()&&!fs.lstatSync(component).isSymbolicLink(),'unsafe archive directory');
  else fs.mkdirSync(component);
 }
 const destination=path.join(archive,releaseId),lock=path.join(archive,'.'+releaseId+'.lock');
 const fd=fs.openSync(lock,'wx');
 try{
  assert(!fs.existsSync(destination),'release already exists');
  documents.set('approval.json',jsonBytes({approvalSchemaVersion:1,decision:'approved',releaseId,manifestSha256,
   approvedBy:approvedBy.trim(),approvedAt:new Date().toISOString()}));
  // Publish one complete directory by rename while holding the exclusive lock.
  const temporary=fs.mkdtempSync(path.join(archive,'.pending-'));
  try{
   for(const [name,bytes] of documents)fs.writeFileSync(path.join(temporary,name),bytes,{flag:'wx'});
   fs.renameSync(temporary,destination);
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
 return {releaseId,directory:destination};
}

function archiveDocuments(reader,releaseId){
 assert(releaseIdValid(releaseId),'invalid release ID');const prefix=RELEASE_ROOT+'/'+releaseId+'/';
 same([...reader.tree.keys()].filter(p=>p.startsWith(prefix)).map(p=>p.slice(prefix.length)).sort(),RELEASE_FILES,'incomplete release or unexpected files');
 return new Map(RELEASE_FILES.map(name=>[name,reader.read(prefix+name)]));
}
export function loadCatalogRelease({repositoryRoot,releaseId}){
 repositoryRoot=repository(repositoryRoot);
 const archiveCommit=resolveCommit(repositoryRoot,'HEAD'),reader=snapshotReader(repositoryRoot,archiveCommit);
 const checked=verifyDocuments({repositoryRoot,documents:archiveDocuments(reader,releaseId),releaseId,approval:true,archiveCommit});
 return Object.freeze({releaseId,catalogId:checked.manifest.catalogId,archiveCommit,
  manifest:frozen(checked.manifest),library:frozen(checked.snapshot.library),selection:frozen(checked.snapshot.selection),validation:frozen(checked.validation),
  readResource(ref){safePath(ref);assert(checked.resources.has(ref),'resource not in release: '+ref);return Buffer.from(checked.resources.get(ref));}});
}

export function checkCatalogReleaseArchive({repositoryRoot,previous,archiveRef='HEAD'}){
 repositoryRoot=repository(repositoryRoot);
 const archiveCommit=resolveCommit(repositoryRoot,archiveRef),current=snapshotReader(repositoryRoot,archiveCommit);
 const prefix=RELEASE_ROOT+'/',paths=[...current.tree.keys()].filter(p=>p.startsWith(prefix));
 if(previous&&!/^0+$/.test(previous)){
  const before=snapshotReader(repositoryRoot,resolveCommit(repositoryRoot,previous));
  for(const p of before.tree.keys())if(p.startsWith(prefix)){
   same(current.tree.get(p),before.tree.get(p),'previously accepted release changed or removed: '+p);
  }
 }
 const ids=[...new Set(paths.map(p=>p.slice(prefix.length).split('/')[0]))].sort();
 for(const releaseId of ids)verifyDocuments({repositoryRoot,documents:archiveDocuments(current,releaseId),releaseId,approval:true,archiveCommit});
 return {archiveCommit,releases:ids.length};
}
