import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {main,sampleCatalogMaps,SAMPLE_CONFIG} from '../../scripts/sample-catalog-maps.mjs';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {prepareAssetCatalog} from '../../scripts/lib/asset-catalog.mjs';
import {assignAssets,createCatalogProfile} from '../../src/assets/assignment.mjs';
import {generateMap} from '../../src/generation/maps.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const cli=path.join(project,'scripts/sample-catalog-maps.mjs');
const RELEASE_ID='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
const args=['--release',RELEASE_ID,'--background','sea-blue-01'];
const options={repositoryRoot:project,releaseId:RELEASE_ID,backgroundId:'sea-blue-01'};
const referenceBytes=fs.readFileSync(path.join(project,'docs/verification/graphic-contract-A-catalog-sample.json'),'utf8');
const reference=JSON.parse(referenceBytes);
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
let released;
before(()=>{released=loadReleasedAssetCatalog(options);});

function temporary(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-catalog-diagnostics-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return directory;
}
function fixture(t){
 const directory=temporary(t),root=path.join(directory,'repo');
 git(project,'clone','--quiet','--shared','--no-checkout',project,root);
 git(root,'checkout','--quiet','--detach',git(project,'rev-parse','HEAD'));
 // Also exercise the currently edited entry before it has been committed.
 fs.copyFileSync(cli,path.join(root,'scripts/sample-catalog-maps.mjs'));
 return {directory,root};
}

test('approved diagnostic entry reproduces the entire existing 128-seed report with separate release provenance',()=>{
 const {provenance,...report}=main([...args,'--repository',project]);
 assert.deepEqual(provenance,released.provenance);
 assert.deepEqual(report,reference);
 assert.equal(JSON.stringify(report,null,2)+'\n',referenceBytes);
 assert.equal(report.catalog.eligibleAssets,18);
 assert.equal(report.catalog.preparation.allowedAnchors,368);
 assert.equal(report.catalog.profilePlacements,154);
 // Provenance is an added report field, never injected into profile/map data.
 assert.equal(report.catalogSha256,'267bc43dd30c7d6d87beedb298e7045281f073d977065dcea3ce843c39f42112');
});

test('entry accepts only explicit release/background arguments, never contexts, provenance or batch options',()=>{
 for(const argv of [[],['--release',RELEASE_ID],['--background','sea-blue-01']])assert.throws(()=>main(argv),/Missing --/);
 for(const argv of [
  ['--release'],[...args,'--release',RELEASE_ID],[...args,'--background','sea-blue-01'],
  [...args,'--repository',project,'--repository',project],[...args,'--catalog','{}'],
  [...args,'--provenance',JSON.stringify(released.provenance)],[...args,'--seed-count','1'],
  [...args,'positional'],['--release='+RELEASE_ID,'--background','sea-blue-01']
 ])assert.throws(()=>main(argv),/Invalid or duplicate option/);
 for(const argv of [released,released.catalog,{...options,provenance:released.provenance},[...args,{}]]){
  assert.throws(()=>main(argv),/Expected command-line arguments/);
 }
 assert.throws(()=>main(['--release','latest','--background','sea-blue-01','--repository',project]),/invalid release ID/);
 assert.throws(()=>main(['--release',RELEASE_ID,'--background','prototype-sea','--repository',project]),/background not selected for production/);
});

test('CLI argument errors exit unsuccessfully without emitting a report',()=>{
 for(const argv of [[],[...args,'--provenance','{}']]){
  const result=spawnSync(process.execPath,[cli,...argv],{encoding:'utf8'});
  assert.ifError(result.error);assert.equal(result.status,1);assert.equal(result.stdout,'');
  assert.match(result.stderr,/Missing --release|Invalid or duplicate option: --provenance/);
 }
});

test('actual CLI needs only Git and committed release data despite absent working catalog/resources and poisoned image preparation',t=>{
 const f=fixture(t),entry=path.join(f.root,'scripts/sample-catalog-maps.mjs');
 for(const ref of ['assets','archive/catalog-releases','scripts/config/catalog-release-v1.json',
  'puzzles/schema/asset-library-v2.schema.json','docs/seekarte-template/contract.json']){
  fs.rmSync(path.join(f.root,ref),{recursive:true});
 }
 fs.writeFileSync(path.join(f.root,'scripts/lib/asset-catalog.mjs'),"throw Error('image preparation imported by diagnostic');\n");
 const bin=path.join(f.directory,'git-only');fs.mkdirSync(bin);
 fs.symlinkSync(execFileSync('which',['git'],{encoding:'utf8'}).trim(),path.join(bin,'git'));
 const guard=path.join(f.directory,'guard.mjs'),commands=path.join(f.directory,'commands.jsonl');
 fs.writeFileSync(guard,`
  import assert from 'node:assert/strict';
  import cp from 'node:child_process';
  import fs from 'node:fs';
  import {syncBuiltinESMExports} from 'node:module';
  const execFileSync=cp.execFileSync;
  cp.execFileSync=(file,args,...rest)=>{
   assert.equal(file,'git');
   fs.appendFileSync(${JSON.stringify(commands)},JSON.stringify(args[2])+'\\n');
   return execFileSync(file,args,...rest);
  };
  for(const name of ['exec','execSync','execFile','spawn','spawnSync','fork'])cp[name]=()=>{throw Error('unexpected subprocess: '+name);};
  syncBuiltinESMExports();
 `);
 // Run outside the repository: the default root remains the entry's own repo.
 const output=execFileSync(process.execPath,['--import',guard,entry,...args],{
  cwd:f.directory,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,PATH:bin}});
 const {provenance,...report}=JSON.parse(output);
 assert.deepEqual(report,reference);
 assert.deepEqual(provenance,released.provenance);
 const operations=fs.readFileSync(commands,'utf8').trim().split('\n').map(line=>JSON.parse(line));
 assert.ok(operations.includes('cat-file'));
 assert.ok(operations.every(name=>['rev-parse','ls-tree','cat-file','merge-base'].includes(name)));
});

test('diagnostic refuses a committed archive with missing approval even when its other data are present',t=>{
 const f=fixture(t);
 fs.unlinkSync(path.join(f.root,'archive/catalog-releases',RELEASE_ID,'approval.json'));
 git(f.root,'add','-A');
 git(f.root,'-c','user.name=Diagnostic regression','-c','user.email=diagnostic@example.invalid',
  '-c','commit.gpgsign=false','commit','--quiet','-m','Disposable missing-approval regression');
 assert.throws(()=>main([...args,'--repository',f.root]),/incomplete release/);
});

test('legacy preparation of the real pinned bytes matches the complete release context, profile and deterministic assignments',t=>{
 // Python/Pillow are needed ONLY for this old/new regression. Production loads
 // the stored evidence; no candidate/release or art approval is created here.
 const root=temporary(t),{library}=released.catalog;
 const references=new Set([...library.assets.map(a=>a.image.path),...library.backgrounds.map(b=>b.image)]);
 for(const ref of references){
  const file=path.join(root,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,released.readResource(ref));
 }
 const legacy=prepareAssetCatalog({library,backgroundId:'sea-blue-01',resourceRoot:root});
 assert.deepEqual(legacy,released.catalog);
 const legacyProfile=createCatalogProfile(legacy),profile=createCatalogProfile(released.catalog);
 assert.deepEqual(legacyProfile,profile);
 for(let seed=0;seed<32;seed++)for(const catalogProfile of [undefined,profile]){
  const result=generateMap({seed,config:SAMPLE_CONFIG,...(catalogProfile?{catalogProfile}:{})});
  assert.equal(result.status,'generated');
  assert.deepEqual(assignAssets({map:result.map,seed,catalog:legacy}),assignAssets({map:result.map,seed,catalog:released.catalog}));
 }
 assert.deepEqual(sampleCatalogMaps(legacy),reference);
});
