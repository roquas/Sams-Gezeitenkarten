import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadReleasedAssetCatalog,RELEASED_ASSET_CATALOG_VERSION} from '../../scripts/lib/released-asset-catalog.mjs';
import {loadCatalogRelease} from '../../scripts/lib/catalog-release.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {assignAssets,createCatalogProfile,verifiedAnchors} from '../../src/assets/assignment.mjs';
import {placedCells} from '../../src/assets/geometry.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';
import {normalizeCatalogProfile} from '../../src/generation/catalog-profile.mjs';
import {mapFingerprint} from '../../scripts/lib/publication-archive.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';

// The real approved PR #82 archive, never rebuilt or approved by these tests.
const RELEASE_ID='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
const CATALOG_ID='gk-catalog-content-v1-sha256-3f406882907a76f99b3c6f816dc664f28f55d1ba42f01baa5fc637dc0b742bd1';
const SOURCE='ccab5f41dae380525f7535de4470848a3ab4d214';
const ARCHIVED='01b660f1206f8c21362d037fcd29d1eaeb623210';
const DIGEST='267bc43dd30c7d6d87beedb298e7045281f073d977065dcea3ce843c39f42112';
const project=fileURLToPath(new URL('../../',import.meta.url));
const archivePath='archive/catalog-releases/'+RELEASE_ID;
const options={repositoryRoot:project,releaseId:RELEASE_ID,backgroundId:'sea-blue-01'};
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const map=objects=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
let loaded,release;
before(()=>{
 release=loadCatalogRelease(options);
 loaded=loadReleasedAssetCatalog(options);
});

function fixture(t,ref=ARCHIVED){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-released-adapter-')),root=path.join(directory,'repo');
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 git(project,'clone','--quiet','--shared','--no-checkout',project,root);
 git(root,'checkout','--quiet','--detach',ref);
 return {directory,root,options:{...options,repositoryRoot:root}};
}
function commit(root){
 git(root,'add','-A');
 return git(root,'-c','user.name=Adapter regression','-c','user.email=adapter@example.invalid',
  '-c','commit.gpgsign=false','commit','--quiet','-m','Disposable adapter regression');
}
function freeze(value){
 if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;
}

test('real approved release supplies exactly 18 assets, 368 anchors and 154 geographic profile placements',()=>{
 const {catalog,provenance}=loaded,selected=release.selection.backgrounds[0].geographicAssetIds;
 assert.equal(catalog.library.assets.length,40);
 assert.deepEqual(catalog.library,release.library); // Do not prune metadata or rewrite art decisions.
 assert.equal(selected.length,18);
 assert.deepEqual(catalog.verification.assets,release.validation.placements.map(({assetId,anchors})=>({assetId,anchors})));
 assert.deepEqual(catalog.verification.assets.map(a=>a.assetId),selected);
 assert.equal(catalog.verification.assets.reduce((n,a)=>n+a.anchors.length,0),368);
 const profile=createCatalogProfile(catalog);
 assert.equal(profile.placements.length,154);
 assert.deepEqual(normalizeCatalogProfile(profile),profile);
 assert.deepEqual(Object.keys(profile).sort(),['catalogSha256','placements','preferencePercent','version']);
 assert.equal(profile.version,'catalog-shapes-1');
 assert.equal(profile.catalogSha256,DIGEST);
 assert.deepEqual(provenance,{adapterVersion:RELEASED_ASSET_CATALOG_VERSION,releaseId:RELEASE_ID,catalogId:CATALOG_ID,
  sourceCommit:SOURCE,archiveCommit:git(project,'rev-parse','HEAD'),backgroundId:'sea-blue-01',catalogSha256:DIGEST});
 assert.equal(catalog.verification.version,'asset-placement-pixels-2');
 assert.equal(catalog.verification.librarySnapshot,JSON.stringify(release.library));
 assert.notEqual(provenance.catalogId,provenance.releaseId);
 assert.notEqual(provenance.catalogSha256,provenance.catalogId.slice(-64));
 assert.notEqual(provenance.catalogSha256,provenance.releaseId.slice(-64));
});

test('every archived anchor can represent its exact object without changing map identities or admitting excluded assets',()=>{
 const {catalog}=loaded,selected=new Set(catalog.verification.assets.map(a=>a.assetId));
 const byId=new Map(catalog.library.assets.map(a=>[a.id,a]));
 for(const check of catalog.verification.assets){
  const asset=byId.get(check.assetId);
  assert.deepEqual(verifiedAnchors(catalog,asset),check.anchors);
  for(const anchor of check.anchors){
   const m=freeze(map([{id:'shore',cells:placedCells(asset,anchor),passable:asset.passable}]));
   const fingerprint=mapFingerprint(m),result=assignAssets({map:m,seed:0,catalog});
   assert.equal(result.status,'complete',asset.id+'/'+anchor);
   assert.equal(result.diagnostics.assignmentVersion,'asset-assignment-1');
   assert.equal(result.diagnostics.catalogSha256,DIGEST);
   assert.ok(result.placements.every(p=>selected.has(p.assetId)));
   assert.deepEqual(validatePlacements(result.placements,catalog.library,m,catalog.backgroundId),[]);
   assert.equal(mapFingerprint(m),fingerprint);
  }
 }
 const excluded=catalog.library.assets.filter(a=>!selected.has(a.id));
 assert.equal(excluded.length,22);
 assert.ok(excluded.some(a=>a.production==='deferred'));
 assert.ok(excluded.some(a=>a.production==='historical'));
 assert.ok(excluded.some(a=>a.stage==='technical-placeholder'));
 for(const a of excluded)assert.deepEqual(verifiedAnchors(catalog,a),[],a.id);
 // The actual catalog still has no passable multihex paintings. Keep coverage
 // separate from validity and retain the existing partial/none results.
 const port={id:'port',cells:['A1'],passable:true},gap={id:'gap',cells:['C3','D3'],passable:true};
 assert.equal(assignAssets({map:map([port,gap]),seed:0,catalog}).status,'partial');
 assert.equal(assignAssets({map:map([gap]),seed:0,catalog}).status,'none');
 assert.equal(assignAssets({map:map([]),seed:0,catalog}).status,'complete');
});

test('context and provenance are deeply immutable; all 54 resource reads return isolated verified bytes',()=>{
 const {catalog,provenance,readResource}=loaded;
 assert.ok(Object.isFrozen(loaded));
 assert.throws(()=>{provenance.releaseId='other';},TypeError);
 assert.throws(()=>{catalog.library.assets[0].production='enabled';},TypeError);
 assert.throws(()=>catalog.verification.assets.pop(),TypeError);
 assert.throws(()=>catalog.verification.assets[0].anchors.pop(),TypeError);
 assert.throws(()=>{catalog.verification.catalogSha256='0'.repeat(64);},TypeError);
 const inventory=JSON.parse(git(project,'show',ARCHIVED+':'+archivePath+'/inventory.json'));
 assert.equal(inventory.files.length,54);
 for(const item of inventory.files){
  const bytes=readResource(item.path);
  assert.equal(bytes.length,item.bytes,item.path);assert.equal(sha256(bytes),item.sha256,item.path);
  bytes.fill(0);
  assert.equal(sha256(readResource(item.path)),item.sha256,item.path);
 }
 for(const ref of ['../outside','assets/../catalog/library.json','/etc/passwd','assets\\catalog\\library.json','assets/missing.png']){
  assert.throws(()=>readResource(ref),/unsafe path|resource not in release/);
 }
});

test('release and production background must be explicit; archived alternatives do not inherit approval',()=>{
 for(const releaseId of [undefined,'latest',RELEASE_ID.slice(0,-1)+'0'])assert.throws(()=>loadReleasedAssetCatalog({...options,releaseId}),/invalid release ID|incomplete release/);
 for(const backgroundId of [undefined,''])assert.throws(()=>loadReleasedAssetCatalog({...options,backgroundId}),/explicit background ID/);
 for(const b of release.library.backgrounds.filter(b=>b.id!==options.backgroundId)){
  assert.throws(()=>loadReleasedAssetCatalog({...options,backgroundId:b.id}),/background not selected for production/);
 }
 assert.throws(()=>loadReleasedAssetCatalog({...options,backgroundId:'unknown-sea'}),/background not selected for production/);
});

test('working-tree archive files cannot promote the pre-approval source commit',t=>{
 const f=fixture(t,SOURCE),destination=path.join(f.root,archivePath);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.cpSync(path.join(project,archivePath),destination,{recursive:true});
 assert.throws(()=>loadReleasedAssetCatalog(f.options),/incomplete release/);
 assert.equal(git(f.root,'rev-parse','HEAD'),SOURCE);
});

test('missing or mismatched approval and changed selection/anchors are rejected before any context is returned',t=>{
 for(const [name,change,error] of [
  ['approval.json',null,/incomplete release/],
  ['approval.json',a=>{a.decision='pending';},/release approval missing\/invalid/],
  ['approval.json',a=>{a.manifestSha256='0'.repeat(64);},/approval manifest hash mismatch/],
  ['selection.json',s=>{s.backgrounds[0].geographicAssetIds.push('unapproved.asset');},/selection hash mismatch/],
  ['validation.json',v=>{v.placements[0].anchors.pop();},/validation hash mismatch/]
 ]){
  const f=fixture(t),file=path.join(f.root,archivePath,name);
  if(change){const value=JSON.parse(fs.readFileSync(file));change(value);fs.writeFileSync(file,JSON.stringify(value));}
  else fs.unlinkSync(file);
  commit(f.root);
  assert.throws(()=>loadReleasedAssetCatalog(f.options),error,name);
 }
});

test('dirty catalog, image, checker, policy and approval files cannot change a pinned context or its resources',t=>{
 const f=fixture(t),expected=loadReleasedAssetCatalog(f.options),ref=expected.catalog.library.assets[0].image.path;
 const bytes=expected.readResource(ref);
 const paths=['assets/catalog/library.json',ref,'assets/seekarte/sea-blue-01.webp',
  'puzzles/schema/asset-library-v2.schema.json','scripts/config/catalog-release-v1.json',
  'scripts/check-catalog-release-images.py','scripts/verify-asset-positions.py',archivePath+'/approval.json'];
 for(const ref of paths)fs.writeFileSync(path.join(f.root,ref),'invalid working file');
 const actual=loadReleasedAssetCatalog(f.options);
 assert.deepEqual(actual.catalog,expected.catalog);assert.deepEqual(actual.provenance,expected.provenance);
 assert.deepEqual(actual.readResource(ref),bytes);
 const m=map([{id:'port',cells:['A1'],passable:true}]);
 assert.deepEqual(assignAssets({map:m,seed:42,catalog:actual.catalog}),assignAssets({map:m,seed:42,catalog:expected.catalog}));
 assert.deepEqual(createCatalogProfile(actual.catalog),createCatalogProfile(expected.catalog));
});

test('later archive commits change observed provenance without changing the release, catalog or technical digest',t=>{
 const f=fixture(t),before=loadReleasedAssetCatalog(f.options);
 fs.writeFileSync(path.join(f.root,'adapter-regression.txt'),'Unrelated later repository content.');commit(f.root);
 const after=loadReleasedAssetCatalog(f.options);
 assert.notEqual(after.provenance.archiveCommit,before.provenance.archiveCommit);
 assert.equal(after.provenance.archiveCommit,git(f.root,'rev-parse','HEAD'));
 assert.deepEqual({...after.provenance,archiveCommit:before.provenance.archiveCommit},before.provenance);
 assert.deepEqual(after.catalog,before.catalog);
});

test('fresh adapter, profile and assignment process uses only Git, never imports image-preparation modules',t=>{
 const f=fixture(t),adapter='scripts/lib/released-asset-catalog.mjs';
 fs.copyFileSync(path.join(project,adapter),path.join(f.root,adapter));
 for(const ref of ['scripts/lib/asset-catalog.mjs','scripts/validate-assets.mjs']){
  fs.writeFileSync(path.join(f.root,ref),"throw Error('image preparation imported');\n");
 }
 const bin=path.join(f.directory,'git-only');fs.mkdirSync(bin);
 fs.symlinkSync(execFileSync('which',['git'],{encoding:'utf8'}).trim(),path.join(bin,'git'));
 const output=execFileSync(process.execPath,['--input-type=module','-e',`
  import assert from 'node:assert/strict';
  import cp from 'node:child_process';
  import {syncBuiltinESMExports} from 'node:module';
  const execFileSync=cp.execFileSync,commands=[];
  cp.execFileSync=(file,args,...rest)=>{assert.equal(file,'git');commands.push(args[2]);return execFileSync(file,args,...rest);};
  for(const name of ['exec','execSync','execFile','spawn','spawnSync','fork'])cp[name]=()=>{throw Error('unexpected subprocess: '+name);};
  syncBuiltinESMExports();
  const {loadReleasedAssetCatalog}=await import('./scripts/lib/released-asset-catalog.mjs');
  const {assignAssets,createCatalogProfile}=await import('./src/assets/assignment.mjs');
  const {GEOMETRY}=await import('./src/puzzles/schema.mjs');
  const r=loadReleasedAssetCatalog({repositoryRoot:'.',releaseId:process.argv[1],backgroundId:'sea-blue-01'});
  const m={geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'port',cells:['A1'],passable:true}]};
  console.log(JSON.stringify({provenance:r.provenance,assets:r.catalog.verification.assets.length,
   anchors:r.catalog.verification.assets.reduce((n,a)=>n+a.anchors.length,0),
   profile:createCatalogProfile(r.catalog).placements.length,status:assignAssets({map:m,seed:0,catalog:r.catalog}).status,
   bytes:r.readResource(r.catalog.library.assets[0].image.path).length,commands}));
 `,RELEASE_ID],{cwd:f.root,encoding:'utf8',env:{...process.env,PATH:bin}});
 const result=JSON.parse(output);
 assert.equal(result.assets,18);assert.equal(result.anchors,368);assert.equal(result.profile,154);assert.equal(result.status,'complete');
 assert.equal(result.provenance.catalogSha256,DIGEST);assert.equal(result.provenance.archiveCommit,ARCHIVED);assert.ok(result.bytes>0);
 assert.ok(result.commands.includes('cat-file'));
 assert.ok(result.commands.every(c=>['rev-parse','ls-tree','cat-file','merge-base'].includes(c)));
});

test('committed archive documents without pinned source objects cannot fall back to working resources',t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-adapter-missing-source-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 git(directory,'init','--quiet');
 const destination=path.join(directory,archivePath);fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.cpSync(path.join(project,archivePath),destination,{recursive:true});commit(directory);
 assert.throws(()=>loadReleasedAssetCatalog({...options,repositoryRoot:directory}),/Git object\/command unavailable/);
});
