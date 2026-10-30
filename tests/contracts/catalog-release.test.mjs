import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {buildCatalogReleaseCandidate,verifyCatalogReleaseCandidate,approveCatalogRelease,loadCatalogRelease,checkCatalogReleaseArchive} from '../../scripts/lib/catalog-release.mjs';
import {RELEASE_ROOT,releaseIdentity,jsonBytes} from '../../scripts/lib/catalog-release-format.mjs';
import {sha256} from '../../scripts/lib/publication-archive.mjs';
import {asset} from '../fixtures/model/factories.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const cli=path.join(project,'scripts/catalog-release.mjs');
let workspace,base,source,built,candidate;
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const save=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,jsonBytes(value));};
function commit(repo,message){
 git(repo,'add','-A');git(repo,'-c','user.name=Release fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','-qm',message);
 return git(repo,'rev-parse','HEAD');
}
before(()=>{
 workspace=fs.mkdtempSync(path.join(os.tmpdir(),'gk-release-tests-'));base=path.join(workspace,'source');fs.mkdirSync(base);
 for(const dir of ['src','scripts'])fs.cpSync(path.join(project,dir),path.join(base,dir),{recursive:true,filter:p=>!p.includes('__pycache__')});
 for(const file of ['docs/seekarte-template/contract.json','puzzles/schema/asset-library-v2.schema.json',
  'assets/seekarte/sea-blue-01.webp','assets/seekarte/frame-parchment-01.webp','assets/seekarte/frame-parchment-02.webp']){
  fs.mkdirSync(path.dirname(path.join(base,file)),{recursive:true});fs.copyFileSync(path.join(project,file),path.join(base,file));
 }
 const a=asset('test.enabled'),draft=asset('test.draft'),foam={...asset('test.foam'),role:'decoration',semanticClass:'decoration',production:'deferred'};
 delete foam.passable;draft.production='draft';
 const library={schemaVersion:2,semanticVersion:1,backgrounds:[
  {id:'sea-blue-01',family:'test',image:'assets/seekarte/sea-blue-01.webp'},
  {id:'archive-sea',family:'test',image:'assets/test/archive.webp'},
  {id:'prototype-sea',family:'test',image:'assets/test/prototype.webp'}],assets:[a,draft,foam],reviews:[]};
 fs.mkdirSync(path.join(base,'assets/test'),{recursive:true});
 execFileSync('python3',['-c',"from PIL import Image; import sys; from pathlib import Path; r=Path(sys.argv[1]); a=Image.new('RGBA',(360,408)); a.putpixel((180,204),(20,80,100,1)); [a.save(r/p) for p in sys.argv[2:]]; Image.new('RGB',(8,8),(20,80,100)).save(r/'assets/test/archive.webp',format='WEBP'); Image.new('RGB',(9,9),(20,80,100)).save(r/'assets/test/prototype.webp',format='WEBP')",base,...library.assets.map(a=>a.image.path)]);
 const seaHash=sha256(fs.readFileSync(path.join(base,library.backgrounds[0].image)));
 library.reviews=[a,foam].map(a=>({assetId:a.id,backgroundId:'sea-blue-01',status:'approved',reviewer:'Synthetic fixture only',date:'2026-10-26',
  assetSha256:sha256(fs.readFileSync(path.join(base,a.image.path))),backgroundSha256:seaHash,notes:'Isolated release test; not a production approval.'}));
 library.reviews.push({assetId:draft.id,backgroundId:'*',status:'pending',notes:'No approval.'});
 save(path.join(base,'assets/catalog/library.json'),library);
 git(base,'init','-q');source=commit(base,'Synthetic source with pinned release implementation');
 candidate=path.join(workspace,'candidate');built=buildCatalogReleaseCandidate({repositoryRoot:base,source,out:candidate});
});
after(()=>{if(workspace)fs.rmSync(workspace,{recursive:true,force:true});});
function fixture(t){
 const directory=fs.mkdtempSync(path.join(workspace,'case-')),repositoryRoot=path.join(directory,'repo'),copy=path.join(directory,'candidate');
 git(workspace,'clone','--quiet','--no-hardlinks',base,repositoryRoot);fs.cpSync(candidate,copy,{recursive:true});
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return {repositoryRoot,candidate:copy,directory};
}
function approve(f){return approveCatalogRelease({...f,releaseId:built.releaseId,manifestSha256:built.manifestSha256,approvedBy:'Isolated test only'});}
function rebind(directory){
 const file=path.join(directory,'manifest.json'),m=JSON.parse(fs.readFileSync(file));
 for(const n of ['inventory','validation','selection'])m[n+'Sha256']=sha256(fs.readFileSync(path.join(directory,n+'.json')));
 m.releaseId=releaseIdentity(m);save(file,m);return m;
}
function edit(directory,name,fn){const file=path.join(directory,name+'.json'),v=JSON.parse(fs.readFileSync(file));fn(v);save(file,v);return rebind(directory);}
function asyncCLI(args){return new Promise(resolve=>{
 const child=spawn(process.execPath,[cli,...args],{env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});let output='';
 child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);child.on('close',code=>resolve({code,output}));child.on('error',error=>resolve({code:-1,output:error.message}));
});}

test('candidate is reproducible and inventories all referenced assets, backgrounds, frames and contracts',t=>{
 const f=fixture(t),second=path.join(f.directory,'second');
 assert.deepEqual(buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source,out:second}),{...built,directory:second});
 for(const name of fs.readdirSync(candidate))assert.deepEqual(fs.readFileSync(path.join(candidate,name)),fs.readFileSync(path.join(second,name)));
 const inventory=JSON.parse(fs.readFileSync(path.join(candidate,'inventory.json'))),paths=inventory.files.map(f=>f.path);
 const tools=JSON.parse(fs.readFileSync(path.join(candidate,'validation.json'))).tools;
 const codecs=JSON.parse(execFileSync('python3',['-c',"from PIL import features; import json; print(json.dumps({k:features.version(k) for k in ['webp','zlib']}))"],{encoding:'utf8'}));
 assert.equal(tools.zlib,codecs.zlib);assert.equal(tools.webp,codecs.webp);
 for(const p of ['assets/test/test-foam.png','assets/test/test-draft.png','assets/test/archive.webp','assets/test/prototype.webp',
  'assets/seekarte/frame-parchment-01.webp','assets/seekarte/frame-parchment-02.webp','docs/seekarte-template/contract.json','puzzles/schema/asset-library-v2.schema.json',
  'src/assets/geometry.mjs','src/ui/chart-asset-contract.mjs'])assert.ok(paths.includes(p),p);
 assert.equal(fs.existsSync(path.join(f.repositoryRoot,RELEASE_ROOT)),false);
 assert.throws(()=>buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source,out:second}),/already exists/);
});

test('manual approval binds exact ID/hash, preserves art decisions and creates only five JSON files without committing',t=>{
 const f=fixture(t),head=git(f.repositoryRoot,'rev-parse','HEAD');
 assert.throws(()=>approveCatalogRelease({...f,releaseId:built.releaseId,manifestSha256:'0'.repeat(64),approvedBy:'Test'}),/manifest hash mismatch/);
 const wrongId=built.releaseId.slice(0,-1)+(built.releaseId.endsWith('0')?'1':'0');
 assert.throws(()=>approveCatalogRelease({...f,releaseId:wrongId,manifestSha256:built.manifestSha256,approvedBy:'Test'}),/requested release ID mismatch/);
 const approved=approve(f);assert.equal(git(f.repositoryRoot,'rev-parse','HEAD'),head);
 assert.deepEqual(fs.readdirSync(approved.directory).sort(),['approval.json','inventory.json','manifest.json','selection.json','validation.json']);
 assert.throws(()=>loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}),/incomplete release/);
 commit(f.repositoryRoot,'Record explicit synthetic approval');
 const loaded=loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId});
 assert.deepEqual(loaded.library.reviews,JSON.parse(git(f.repositoryRoot,'show',source+':assets/catalog/library.json')).reviews);
 assert.deepEqual(loaded.selection.backgrounds,[{backgroundId:'sea-blue-01',geographicAssetIds:['test.enabled']}]);
 assert.ok(Object.isFrozen(loaded.library.assets[0]));
 assert.throws(()=>approve(f),/already exists/);
 assert.equal(checkCatalogReleaseArchive({repositoryRoot:f.repositoryRoot,previous:source}).releases,1);
});

test('build and load ignore dirty resource, schema, policy and checker working files',t=>{
 const f=fixture(t);approve(f);commit(f.repositoryRoot,'Synthetic release');
 for(const p of ['assets/test/test-enabled.png','puzzles/schema/asset-library-v2.schema.json','scripts/config/catalog-release-v1.json',
  'src/assets/geometry.mjs','scripts/check-library-images.py'])fs.writeFileSync(path.join(f.repositoryRoot,p),'invalid current working file');
 const other=path.join(f.directory,'pinned');
 assert.equal(buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source,out:other}).releaseId,built.releaseId);
 const loaded=loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}),bytes=loaded.readResource('assets/test/test-enabled.png');
 assert.deepEqual(bytes,Buffer.from(execFileSync('git',['-C',f.repositoryRoot,'show',source+':assets/test/test-enabled.png'])));
 bytes.fill(0);assert.notDeepEqual(loaded.readResource('assets/test/test-enabled.png'),bytes);
 fs.writeFileSync(path.join(f.repositoryRoot,RELEASE_ROOT,built.releaseId,'approval.json'),'broken uncommitted approval');
 assert.equal(loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}).releaseId,built.releaseId);
 assert.throws(()=>loaded.readResource('../outside'),/unsafe path/);
 assert.throws(()=>loaded.readResource('not-in-release.png'),/not in release/);
});

test('loader and candidate verification work with only Git on PATH and never invoke Python',t=>{
 const f=fixture(t);approve(f);commit(f.repositoryRoot,'Synthetic release');
 const bin=path.join(f.directory,'bin'),marker=path.join(f.directory,'python-started');fs.mkdirSync(bin);
 const gitBinary=execFileSync('which',['git'],{encoding:'utf8'}).trim();fs.symlinkSync(gitBinary,path.join(bin,'git'));
 for(const name of ['python','python3'])fs.writeFileSync(path.join(bin,name),'#!/bin/sh\ntouch "'+marker+'"\nexit 99\n',{mode:0o755});
 for(const args of [['verify','--release',built.releaseId],['verify','--candidate',f.candidate]]){
  const output=execFileSync(process.execPath,[cli,...args,'--repository',f.repositoryRoot],{env:{...process.env,PATH:bin},encoding:'utf8'});
  assert.equal(JSON.parse(output).releaseId,built.releaseId);
 }
 assert.equal(fs.existsSync(marker),false);
});

test('missing Git objects and mismatched source bytes fail without working-tree fallback',t=>{
 const f=fixture(t),empty=path.join(f.directory,'empty');fs.mkdirSync(empty);git(empty,'init','-q');
 assert.throws(()=>verifyCatalogReleaseCandidate({repositoryRoot:empty,candidate:f.candidate}),/Git object\/command unavailable/);
 fs.appendFileSync(path.join(f.repositoryRoot,'assets/test/test-draft.png'),'changed bytes');
 const changed=commit(f.repositoryRoot,'Different historical resource');
 edit(f.candidate,'manifest',m=>{m.sourceCommit=changed;});
 assert.throws(()=>verifyCatalogReleaseCandidate(f),/inventory\/size\/hash\/closure mismatch/);
});

test('strict verification rejects incomplete, duplicate, unsupported and contradictory rebound evidence',t=>{
 const f=fixture(t);
 const cases=[
  ['validation',v=>v.assets.pop(),/incomplete asset/],
  ['validation',v=>v.assets[1]=v.assets[0],/asset result mismatch/],
  ['validation',v=>delete v.assets[0].checks.alpha,/incomplete asset checks/],
  ['validation',v=>v.backgrounds.pop(),/incomplete background/],
  ['validation',v=>v.frames[0].report.files.quietFrame.label_zones.pop(),/incomplete frame label/],
  ['validation',v=>v.frames[0].report.files.frame.geographic_graphic_cells.overlapping_alpha_pixels=1,/frame footprint/],
  ['validation',v=>v.placements[0].anchors.pop(),/geographic anchors/],
  ['validation',v=>v.placements.push(v.placements[0]),/geographic anchors/],
  ['validation',v=>v.versions.pixelChecker='asset-placement-pixels-1',/unsupported checker/],
  ['validation',v=>v.implementation.files.pop(),/implementation mismatch/],
  ['validation',v=>v.tools.pillow='',/dependency version/],
  ['selection',v=>v.backgrounds[0].geographicAssetIds.push('test.foam'),/selection conflict/],
  ['inventory',v=>v.files.pop(),/inventory\/size\/hash\/closure mismatch/],
  ['inventory',v=>v.files[0].bytes++,/inventory\/size\/hash\/closure mismatch/],
  ['manifest',v=>v.releaseSchemaVersion=2,/unsupported release schema/]
 ];
 for(const [i,[name,mutate,error]] of cases.entries()){
  const directory=path.join(f.directory,'bad-'+i);fs.cpSync(candidate,directory,{recursive:true});edit(directory,name,mutate);
  assert.throws(()=>verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:directory}),error,String(i));
 }
 fs.writeFileSync(path.join(f.candidate,'validation.json'),'{}');assert.throws(()=>verifyCatalogReleaseCandidate(f),/validation hash mismatch/);
});

test('explicit source contracts and unsafe/symlinked resources are checked, never replaced by checkout validators',t=>{
 const f=fixture(t);
 // The pinned JSON now disagrees with its pinned executable frame contract.
 const contractPath=path.join(f.repositoryRoot,'docs/seekarte-template/contract.json');
 const contract=JSON.parse(fs.readFileSync(contractPath));contract.format.pixels.width--;
 save(contractPath,contract);const changed=commit(f.repositoryRoot,'Inconsistent pinned contract');
 assert.throws(()=>buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:changed,out:path.join(f.directory,'bad-contract')}),/pinned frame JSON disagrees/);
 git(f.repositoryRoot,'reset','--hard',source);
 fs.unlinkSync(path.join(f.repositoryRoot,'assets/test/test-draft.png'));fs.symlinkSync('test-enabled.png',path.join(f.repositoryRoot,'assets/test/test-draft.png'));
 const linked=commit(f.repositoryRoot,'Symlink asset');
 assert.throws(()=>buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:linked,out:path.join(f.directory,'bad-link')}),/unsafe Git resource/);
});

test('a technically broken enabled asset prevents candidate creation instead of shrinking production selection',t=>{
 const f=fixture(t),image=path.join(f.repositoryRoot,'assets/test/test-enabled.png');
 execFileSync('python3',['-c',"from PIL import Image; import sys; Image.new('RGBA',(360,408)).save(sys.argv[1])",image]);
 const libPath=path.join(f.repositoryRoot,'assets/catalog/library.json'),library=JSON.parse(fs.readFileSync(libPath));
 library.reviews.find(r=>r.assetId==='test.enabled').assetSha256=sha256(fs.readFileSync(image));save(libPath,library);
 const changed=commit(f.repositoryRoot,'Hash-bound but empty enabled image'),out=path.join(f.directory,'bad-image');
 assert.throws(()=>buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:changed,out}),/empty image/);
 assert.equal(fs.existsSync(out),false);
});

test('production background is pinned configuration rather than a hardcoded loader restriction',t=>{
 const f=fixture(t),policyPath=path.join(f.repositoryRoot,'scripts/config/catalog-release-v1.json');
 const policy=JSON.parse(fs.readFileSync(policyPath));policy.productionBackgrounds[0].id='configured-sea';save(policyPath,policy);
 const libraryPath=path.join(f.repositoryRoot,'assets/catalog/library.json'),library=JSON.parse(fs.readFileSync(libraryPath));
 library.backgrounds[0].id='configured-sea';for(const r of library.reviews)if(r.backgroundId==='sea-blue-01')r.backgroundId='configured-sea';save(libraryPath,library);
 const configured=commit(f.repositoryRoot,'Synthetic alternative production configuration'),out=path.join(f.directory,'configured');
 const result=buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:configured,out});
 approveCatalogRelease({repositoryRoot:f.repositoryRoot,candidate:out,...result,approvedBy:'Configuration test only'});
 commit(f.repositoryRoot,'Record synthetic configured release');
 assert.equal(loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:result.releaseId}).selection.backgrounds[0].backgroundId,'configured-sea');
});

test('nonproductive resource changes affect catalog identity, while checker-only changes affect release identity',t=>{
 const f=fixture(t),image=path.join(f.repositoryRoot,'assets/test/test-draft.png');fs.appendFileSync(image,'trailing metadata');
 const resourceCommit=commit(f.repositoryRoot,'Changed nonproductive bytes');
 const resourceResult=buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:resourceCommit,out:path.join(f.directory,'resource')});
 assert.notEqual(resourceResult.catalogId,built.catalogId);
 git(f.repositoryRoot,'reset','--hard',source);
 fs.appendFileSync(path.join(f.repositoryRoot,'scripts/check-catalog-release-images.py'),'\n# Checker provenance regression.\n');
 const checkerCommit=commit(f.repositoryRoot,'Different checker implementation');
 const checkerResult=buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:checkerCommit,out:path.join(f.directory,'checker')});
 assert.equal(checkerResult.catalogId,built.catalogId);assert.notEqual(checkerResult.releaseId,built.releaseId);
});

test('parallel approval attempts produce one complete release and never overwrite it',async t=>{
 const f=fixture(t),args=['approve','--repository',f.repositoryRoot,'--candidate',f.candidate,'--release-id',built.releaseId,'--manifest-sha256',built.manifestSha256,'--by','Parallel fixture'];
 const results=await Promise.all([asyncCLI(args),asyncCLI(args)]);
 assert.equal(results.filter(r=>r.code===0).length,1,JSON.stringify(results));
 assert.equal(results.filter(r=>r.code!==0).length,1);
 commit(f.repositoryRoot,'One parallel approval');
 assert.equal(loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}).releaseId,built.releaseId);
});

test('interrupted staging, locks and incomplete candidates cannot become accepted releases',t=>{
 const f=fixture(t),archive=path.join(f.repositoryRoot,RELEASE_ROOT);fs.mkdirSync(archive,{recursive:true});
 const lock=path.join(archive,'.'+built.releaseId+'.lock');fs.writeFileSync(lock,'');
 const pending=path.join(archive,'.pending-interrupted');fs.mkdirSync(pending);fs.copyFileSync(path.join(candidate,'manifest.json'),path.join(pending,'manifest.json'));
 assert.throws(()=>approve(f),/EEXIST/);assert.equal(fs.existsSync(path.join(archive,built.releaseId)),false);
 commit(f.repositoryRoot,'Accidentally staged interrupted artifacts');
 assert.throws(()=>checkCatalogReleaseArchive({repositoryRoot:f.repositoryRoot,previous:source}),/invalid release ID/);
 fs.rmSync(lock);fs.rmSync(pending,{recursive:true});
 fs.unlinkSync(path.join(f.candidate,'validation.json'));assert.throws(()=>approve(f),/incomplete candidate/);
});

test('archive comparison detects edits/deletions and new incomplete releases; bad approval binding is rejected',t=>{
 const f=fixture(t),approved=approve(f),accepted=commit(f.repositoryRoot,'Accepted fixture');
 const approvalPath=path.join(approved.directory,'approval.json'),approval=JSON.parse(fs.readFileSync(approvalPath));
 approval.manifestSha256='0'.repeat(64);save(approvalPath,approval);commit(f.repositoryRoot,'Accidental approval edit');
 assert.throws(()=>loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}),/approval manifest hash mismatch/);
 assert.throws(()=>checkCatalogReleaseArchive({repositoryRoot:f.repositoryRoot,previous:accepted}),/changed or removed/);
 git(f.repositoryRoot,'reset','--hard',accepted);fs.unlinkSync(approvalPath);commit(f.repositoryRoot,'Accidental deletion');
 assert.throws(()=>checkCatalogReleaseArchive({repositoryRoot:f.repositoryRoot,previous:accepted}),/changed or removed/);
 assert.throws(()=>loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}),/incomplete release/);
});

test('committing a candidate cannot approve it and approval requires a source ancestor',t=>{
 const f=fixture(t),destination=path.join(f.repositoryRoot,RELEASE_ROOT,built.releaseId);
 fs.mkdirSync(path.dirname(destination),{recursive:true});fs.cpSync(f.candidate,destination,{recursive:true});
 commit(f.repositoryRoot,'Candidate files without explicit approval');
 assert.throws(()=>loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:built.releaseId}),/incomplete release/);
 assert.throws(()=>checkCatalogReleaseArchive({repositoryRoot:f.repositoryRoot,previous:source}),/incomplete release/);
 // The objects exist but are deliberately detached from the current history.
 git(f.repositoryRoot,'checkout','--orphan','unrelated');git(f.repositoryRoot,'rm','-rf','.');
 fs.writeFileSync(path.join(f.repositoryRoot,'unrelated.txt'),'unrelated');commit(f.repositoryRoot,'Unrelated history');
 assert.throws(()=>approve(f),/source commit must be an available ancestor/);
});

test('V1 keeps all 674 current-catalog fixture anchors in fresh processes from the actually changed runtime checkout',t=>{
 const f=fixture(t),library=JSON.parse(fs.readFileSync(path.join(project,'assets/catalog/library.json')));
 // Full real resource data, but an isolated disposable Git repository and an
 // explicit test-only approval. The project's release archive is never touched.
 for(const ref of ['assets/catalog/library.json',...library.assets.map(a=>a.image.path),...library.backgrounds.map(b=>b.image)]){
  const destination=path.join(f.repositoryRoot,ref);fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(path.join(project,ref),destination);
 }
 const historicalSource=commit(f.repositoryRoot,'Historical full V1 catalog in isolated test repository');
 const out=path.join(f.directory,'historical'),result=buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:historicalSource,out});
 approveCatalogRelease({repositoryRoot:f.repositoryRoot,candidate:out,...result,approvedBy:'Historical V1 regression only; not production'});
 commit(f.repositoryRoot,'Record isolated historical V1 test release');
 const expected=loadCatalogRelease({repositoryRoot:f.repositoryRoot,releaseId:result.releaseId});
 assert.equal(expected.validation.placements.reduce((n,p)=>n+p.anchors.length,0),674);
 const geometryPath=path.join(f.repositoryRoot,'src/assets/geometry.mjs');
 const geometry=fs.readFileSync(geometryPath,'utf8');
 assert.ok(geometry.includes('export function placedCells(asset,anchor){'));
 fs.writeFileSync(geometryPath,geometry.replace('export function placedCells(asset,anchor){',"export function placedCells(asset,anchor){ return ['Z99'];"));
 // These sentinels also catch transitive imports through the old archive/hash,
 // generic schema entry point, or filesystem asset validator.
 for(const ref of ['src/assets/library.mjs','src/puzzles/schema.mjs','scripts/validate-assets.mjs','scripts/lib/publication-archive.mjs']){
  const file=path.join(f.repositoryRoot,ref);fs.writeFileSync(file,"throw Error('mutable domain module imported by V1 loader');\n"+fs.readFileSync(file,'utf8'));
 }
 commit(f.repositoryRoot,'Later incompatible general runtime contracts');
 const ownCli=path.join(f.repositoryRoot,'scripts/catalog-release.mjs');
 const probe=execFileSync(process.execPath,['--input-type=module','-e',
  "import {placedCells} from './src/assets/geometry.mjs'; console.log(JSON.stringify(placedCells({geometry:{cells:[[0,0]]}},'A1')));"],{cwd:f.repositoryRoot,encoding:'utf8'});
 assert.deepEqual(JSON.parse(probe),['Z99']);
 const bin=path.join(f.directory,'git-only');fs.mkdirSync(bin);
 fs.symlinkSync(execFileSync('which',['git'],{encoding:'utf8'}).trim(),path.join(bin,'git'));
 const options={cwd:f.repositoryRoot,encoding:'utf8',env:{...process.env,PATH:bin}};
 const verified=JSON.parse(execFileSync(process.execPath,[ownCli,'verify','--release',result.releaseId],options));
 assert.equal(verified.releaseId,result.releaseId);assert.equal(verified.catalogId,result.catalogId);
 const loaded=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',
  "import {loadCatalogRelease} from './scripts/lib/catalog-release.mjs'; const r=loadCatalogRelease({repositoryRoot:'.',releaseId:process.argv[1]}); console.log(JSON.stringify({catalogId:r.catalogId,selection:r.selection,placements:r.validation.placements}));",result.releaseId],options));
 assert.equal(loaded.catalogId,expected.catalogId);assert.deepEqual(loaded.selection,expected.selection);
 assert.deepEqual(loaded.placements,expected.validation.placements);
 assert.equal(loaded.placements.reduce((n,p)=>n+p.anchors.length,0),674);
 // Exercise the OUTER build path in that same changed installation too. Its
 // image worker still runs exclusively from the historical source snapshot.
 const rebuilt=JSON.parse(execFileSync(process.execPath,[ownCli,'build','--source',historicalSource,'--out',path.join(f.directory,'rebuilt')],
  {cwd:f.repositoryRoot,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}}));
 assert.equal(rebuilt.releaseId,result.releaseId);assert.equal(rebuilt.manifestSha256,result.manifestSha256);
});

test('rebound evidence rejects contradictory background/frame facts and shortened V1 pixel scopes',t=>{
 const f=fixture(t),cases=[
  [v=>v.backgrounds[0].width++,/inconsistent image measurements/],
  [v=>v.backgrounds[0].height++,/inconsistent image measurements/],
  [v=>v.backgrounds[0].format='PNG',/inconsistent image measurements/],
  [v=>v.frames[0].report.files.quietFrame.geographic_graphic_cells.tested_pixel_squares--,/frame footprint/],
  [v=>{for(const name of ['frame','quietFrame'])v.frames[0].report.files[name].geographic_graphic_cells.tested_pixel_squares=1;},/frame footprint/],
  // Area*scale^2 omits intersecting boundary squares: plausible but incomplete.
  [v=>{for(const name of ['frame','quietFrame'])v.frames[0].report.files[name].geographic_graphic_cells.tested_pixel_squares=25*5576*16;},/frame footprint/]
 ];
 for(const [i,[mutate,error]] of cases.entries()){
  const directory=path.join(f.directory,'inconsistent-'+i);fs.cpSync(candidate,directory,{recursive:true});
  edit(directory,'validation',mutate);
  assert.throws(()=>verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:directory}),error);
 }
});

test('two background IDs sharing one resource must report identical dimensions',t=>{
 const f=fixture(t),file=path.join(f.repositoryRoot,'assets/catalog/library.json'),library=JSON.parse(fs.readFileSync(file));
 library.backgrounds.push({...library.backgrounds[1],id:'archive-alias'});save(file,library);
 const aliasSource=commit(f.repositoryRoot,'Two background references to the same resource'),out=path.join(f.directory,'aliased');
 buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:aliasSource,out});
 verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:out});
 edit(out,'validation',v=>{v.backgrounds.at(-1).height++;});
 assert.throws(()=>verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:out}),/inconsistent image measurements/);
 // The same bytes at a different path are the same measured image as well.
 const copyPath='assets/test/archive-copy.webp';
 fs.copyFileSync(path.join(f.repositoryRoot,library.backgrounds[1].image),path.join(f.repositoryRoot,copyPath));
 library.backgrounds.at(-1).image=copyPath;save(file,library);
 const copySource=commit(f.repositoryRoot,'Identical image bytes at different paths'),copyOut=path.join(f.directory,'content-alias');
 buildCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,source:copySource,out:copyOut});
 verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:copyOut});
 edit(copyOut,'validation',v=>{v.backgrounds.at(-1).height++;});
 assert.throws(()=>verifyCatalogReleaseCandidate({repositoryRoot:f.repositoryRoot,candidate:copyOut}),/inconsistent image measurements/);
});
