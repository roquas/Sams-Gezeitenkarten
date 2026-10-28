import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {normalizeBatchOptions,generateBatchRecord,createBatchSummary} from '../../scripts/lib/map-batch.mjs';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {createCatalogProfile} from '../../src/assets/assignment.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const releaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
const releaseArgs=['--release',releaseId,'--background','sea-blue-01'];
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const commit=root=>git(root,'-c','user.name=Batch regression','-c','user.email=batch@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Disposable batch regression');
let catalog,directory,program,programCommit,serial=0;
before(()=>{
 catalog=loadReleasedAssetCatalog({repositoryRoot:project,releaseId,backgroundId:'sea-blue-01'}).catalog;
 directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-map-batch-'));program=path.join(directory,'program');
 git(project,'clone','--quiet','--shared','--no-checkout',project,program);
 git(program,'checkout','--quiet','--detach',git(project,'rev-parse','HEAD'));
 // Exercise uncommitted implementation too, but launch it from its own clean,
 // committed checkout. Production has no program-root override or dirty bypass.
 for(const name of ['src','scripts'])fs.cpSync(path.join(project,name),path.join(program,name),{recursive:true});
 git(program,'add','scripts','src');
 if(git(program,'diff','--cached','--name-only'))commit(program);
 programCommit=git(program,'rev-parse','HEAD');
});
after(()=>fs.rmSync(directory,{recursive:true,force:true}));
const fresh=label=>path.join(directory,label+'-'+serial++);
function cli(args,{root=program,...options}={}){
 const r=spawnSync(process.execPath,[path.join(root,'scripts/generate-map-batch.mjs'),...args],{
  cwd:directory,encoding:'utf8',maxBuffer:32*1024*1024,...options});assert.ifError(r.error);return r;
}
function success(args,options){const r=cli(args,options);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
const read=(root,name)=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const rows=root=>fs.readFileSync(path.join(root,'candidates.jsonl'),'utf8').trim().split('\n').map(line=>JSON.parse(line));
function run(extra=[]){const out=fresh('batch');success(['run',...releaseArgs,'--target-count','3','--max-attempts','30','--seed-start','0','--out',out,...extra]);return out;}
function changeManifest(batch,change){const m=read(batch,'manifest.json');change(m);fs.writeFileSync(path.join(batch,'manifest.json'),JSON.stringify(m));}
const replay=(batch,index=0,extra=[])=>['replay','--batch',batch,'--index',String(index),'--out',fresh('replay.json'),...extra];

test('existing topology and incomplete route analysis are preserved with their exactness flags',()=>{
 const options=normalizeBatchOptions({targetCount:1,maxAttempts:1,seedStart:0,config:{objectCount:1,objectSizes:[1],passableProbability:1,analysis:{steps:[3],maxNodes:1}}});
 const row=generateBatchRecord(0,options,catalog),a=row.generation.analysis,totals=createBatchSummary();totals.record(row);
 assert.equal(a.routes[0].status,'unknown');assert.equal(a.routes[0].countExact,false);
 const s=totals.summary.geography;
 for(const k of ['deadEnds','isolatedCells','articulationCells','startCells'])assert.deepEqual(s.histograms[k],{[a[k].length]:1});
 assert.deepEqual(s.routes[3],{statuses:{unknown:1},routeCountLowerBound:0,inexactRouteCounts:1,
  eligibleStartCountLowerBound:0,inexactEligibleStartCounts:1,unknownStarts:1,nodesVisited:1});
});

test('empty maps, duplicates, exhaustion and inconclusive filters are retained as distinct outcomes',()=>{
 const options=normalizeBatchOptions({targetCount:2,maxAttempts:2,seedStart:0,config:{objectCount:0}}),totals=createBatchSummary();
 for(let i=0;i<2;i++){const row=generateBatchRecord(i,options,catalog);assert.equal(row.assignment.status,'complete');totals.record(row);}
 const s=totals.summary;assert.equal(s.geography.emptyMaps,2);assert.equal(s.geography.duplicateMaps,1);
 assert.deepEqual(s.assignment.statuses,{complete:2});assert.deepEqual(s.assignment.nonemptyStatuses,{});
 for(const [config,status] of [
  [{objectCount:10,objectSizes:[2],maxMapAttempts:1},'exhausted'],
  [{objectCount:1,objectSizes:[1],passableProbability:1,maxMapAttempts:1,analysis:{maxNodes:1},filters:{routeSteps:[3]}},'inconclusive']]){
  const o=normalizeBatchOptions({targetCount:1,maxAttempts:1,seedStart:0,config}),row=generateBatchRecord(0,o,catalog);
  assert.equal(row.generation.status,status);assert.equal(row.generation.map,null);assert.equal(row.assignment,null);
  assert.equal(row.mapFingerprint,null);assert.equal(row.generation.diagnostics.attemptLog.length,1);
 }
});

test('an unexpected assignment error preserves geography and is never coverage none',()=>{
 const o=normalizeBatchOptions({targetCount:1,maxAttempts:1,seedStart:0}),row=generateBatchRecord(0,o,{},createCatalogProfile(catalog));
 assert.equal(row.generation.status,'generated');assert.ok(row.generation.analysis);assert.ok(row.mapFingerprint);
 assert.equal(row.assignment,null);assert.equal(row.error.phase,'assignment');assert.equal(row.error.code,'ASSIGNMENT_ERROR');
 const totals=createBatchSummary();totals.record(row);assert.deepEqual(totals.summary.assignment.statuses,{});
 assert.deepEqual(totals.summary.errors,{assignment:1});
});

test('actual CLI writes every record, canonical manifest and summary; repeated batches and replay are byte identical',()=>{
 const batch=run(),second=run(),manifest=read(batch,'manifest.json');
 assert.equal(manifest.program.commit,programCommit);assert.equal(manifest.seedScheduleVersion,'sequential-uint32-1');
 assert.equal(manifest.provenance.releaseId,releaseId);assert.equal(manifest.provenance.sourceCommit,'ccab5f41dae380525f7535de4470848a3ab4d214');
 assert.deepEqual(manifest.catalogProfile,createCatalogProfile(catalog));assert.equal(read(batch,'summary.json').acceptedCount,3);
 for(const name of ['manifest.json','candidates.jsonl','summary.json'])assert.deepEqual(fs.readFileSync(path.join(batch,name)),fs.readFileSync(path.join(second,name)));
 for(const row of rows(batch)){
  const args=replay(batch,row.index),result=success(args),out=args[args.indexOf('--out')+1];
  assert.deepEqual(result,{status:'matched',index:row.index,mapFingerprint:row.mapFingerprint});
  assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')),row);
 }
 const before=fs.readFileSync(path.join(batch,'manifest.json'));
 const refused=cli(['run',...releaseArgs,'--target-count','1','--max-attempts','1','--seed-start','0','--out',batch]);assert.notEqual(refused.status,0);
 assert.deepEqual(fs.readFileSync(path.join(batch,'manifest.json')),before);
 const args=replay(batch);fs.writeFileSync(args[args.indexOf('--out')+1],'keep');
 assert.notEqual(cli(args).status,0);assert.equal(fs.readFileSync(args[args.indexOf('--out')+1],'utf8'),'keep');
});

test('CLI accepts the maximum uint32 seed for a one-attempt batch',()=>{
 const out=fresh('max-seed');success(['run',...releaseArgs,'--target-count','1','--max-attempts','1','--seed-start','4294967295','--out',out]);
 assert.equal(rows(out)[0].generationSeed,0xffffffff);success(replay(out));
});

test('CLI refuses malformed arguments/configs and unapproved releases before creating output',()=>{
 const malformed=fresh('invalid.json');fs.writeFileSync(malformed,'{"extra":true}');
 const cases=[[],['run'],['run',...releaseArgs,'--target-count','2','--max-attempts','20','--seed-start','4294967295'],
  ['run',...releaseArgs,'--count','1.5','--seed-start','0'],['run',...releaseArgs,'--target-count','1','--max-attempts','1','--seed-start','0','--config',malformed],
  ['run','--release','latest','--background','sea-blue-01','--target-count','1','--max-attempts','1','--seed-start','0'],
  ['run','--release',releaseId,'--background','sea-unused','--target-count','1','--max-attempts','1','--seed-start','0'],
  ['run',...releaseArgs,'--target-count','1','--max-attempts','1','--seed-start','0','--catalog','{}'],
  ['run',...releaseArgs,'--target-count','1','--max-attempts','1','--target-count','2','--max-attempts','20','--seed-start','0']];
 for(const args of cases){const out=fresh('refused');const r=cli([...args,'--out',out]);assert.equal(r.status,1);assert.equal(r.stdout,'');assert.ok(!fs.existsSync(out));}
});

test('replay refuses commit, algorithm, format, profile, provenance and stored-result drift without output',()=>{
 for(const change of [m=>m.program.commit='0'.repeat(40),m=>m.batchFormatVersion=2,m=>m.seedScheduleVersion='other',
  ...['generator','assignment','catalogProfile','pixelChecker','releaseAdapter','rules'].map(key=>m=>m.versions[key]='other'),
  m=>m.catalogProfile={},m=>m.options.targetCount=0,m=>m.provenance.catalogSha256='0'.repeat(64)]){
  const batch=run();changeManifest(batch,change);const args=replay(batch),r=cli(args);
  assert.equal(r.status,1,r.stdout);assert.match(r.stderr,/mismatch|unsupported|positive|properties/i);assert.ok(!fs.existsSync(args[args.indexOf('--out')+1]));
 }
 const batch=run(),saved=rows(batch);saved[0].assignmentSeed=123;
 fs.writeFileSync(path.join(batch,'candidates.jsonl'),saved.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const r=cli(replay(batch));assert.equal(r.status,1);assert.match(r.stderr,/differs from stored/);
});

test('replay rejects dirty actual program files and a different actual program commit',()=>{
 const batch=run(),file=path.join(program,'src/generation/maps.mjs'),bytes=fs.readFileSync(file);
 try{
  fs.appendFileSync(file,'\n// local modification\n');
  const r=cli(replay(batch));assert.equal(r.status,1);assert.match(r.stderr,/clean and committed/);
 }finally{fs.writeFileSync(file,bytes);}
 try{
  fs.writeFileSync(path.join(program,'batch-test.txt'),'new commit');git(program,'add','batch-test.txt');commit(program);
  const r=cli(replay(batch));assert.equal(r.status,1);assert.match(r.stderr,/program commit mismatch/);
 }finally{git(program,'reset','--hard',programCommit);}
});

test('complete candidates remain replayable after interruption; truncated target records fail',()=>{
 const batch=run();fs.unlinkSync(path.join(batch,'summary.json'));
 const saved=rows(batch);fs.writeFileSync(path.join(batch,'candidates.jsonl'),JSON.stringify(saved[0])+'\n{"index":1');
 success(replay(batch));assert.equal(cli(replay(batch,1)).status,1);
 assert.equal(cli(replay(batch,30)).status,1);
});

test('write failure leaves earlier candidates and no successful summary',()=>{
 const guard=fresh('write-fault')+'.mjs',out=fresh('write-failed');
 fs.writeFileSync(guard,`
  import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
  const write=fs.writeFileSync;
  fs.writeFileSync=(file,data,...args)=>{
   if(typeof file==='number'&&JSON.parse(data).index===1)throw Error('Injected write failure');
   return write(file,data,...args);
  };syncBuiltinESMExports();
 `);
 const r=cli(['run',...releaseArgs,'--target-count','3','--max-attempts','30','--seed-start','0','--out',out],{env:{...process.env,NODE_OPTIONS:'--import='+guard}});
 assert.equal(r.status,1);assert.match(r.stderr,/Injected write failure/);assert.equal(rows(out).length,1);
 assert.ok(!fs.existsSync(path.join(out,'summary.json')));success(replay(out));
});

test('unexpected assignment failure in the actual CLI retains geography and aborts the batch',()=>{
 const file=path.join(program,'src/assets/assignment.mjs');
 try{
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace("export function assignAssets(options){",
   "export function assignAssets(options){ throw Error(\"Injected assignment failure\");"));
  git(program,'add','src/assets/assignment.mjs');commit(program);
  const out=fresh('assignment-failed'),r=cli(['run',...releaseArgs,'--target-count','3','--max-attempts','30','--seed-start','0','--out',out]);
  assert.equal(r.status,1);assert.match(r.stderr,/failed during assignment/);
  const [row]=rows(out);assert.equal(rows(out).length,1);assert.equal(row.generation.status,'generated');
  assert.ok(row.generation.map);assert.ok(row.generation.analysis);assert.ok(row.mapFingerprint);
  assert.equal(row.assignment,null);assert.equal(row.error.phase,'assignment');
  assert.ok(!fs.existsSync(path.join(out,'summary.json')));
 }finally{git(program,'reset','--hard',programCommit);}
});

test('batch and replay read pinned Git resources with Git-only PATH and no working resource files',()=>{
 const data=path.join(directory,'data');git(project,'clone','--quiet','--shared','--no-checkout',project,data);
 git(data,'checkout','--quiet','--detach','12689f6b8c25429580a1d7fb11200b8753e39fe3');
 for(const name of ['assets','archive/catalog-releases'])fs.rmSync(path.join(data,name),{recursive:true});
 const bin=fresh('git-only');fs.mkdirSync(bin);fs.symlinkSync(execFileSync('which',['git'],{encoding:'utf8'}).trim(),path.join(bin,'git'));
 const out=fresh('git-data'),env={...process.env,PATH:bin};
 success(['run',...releaseArgs,'--target-count','2','--max-attempts','20','--seed-start','0','--repository',data,'--out',out],{env});
 success(replay(out,0,['--repository',data]),{env});
 // Reading the same release through a later archive commit changes provenance
 // only; stable release data still replay identically.
 fs.writeFileSync(path.join(data,'new.txt'),'later');git(data,'add','new.txt');commit(data);
 success(replay(out,0,['--repository',data]),{env});
 // Committed removal of approval is rejected before output, even with the
 // entire other release evidence still present in Git.
 git(data,'reset','--hard','12689f6b8c25429580a1d7fb11200b8753e39fe3');
 fs.unlinkSync(path.join(data,'archive/catalog-releases',releaseId,'approval.json'));git(data,'add','archive');commit(data);
 const refused=fresh('no-approval');const r=cli(['run',...releaseArgs,'--target-count','1','--max-attempts','1','--seed-start','0','--repository',data,'--out',refused]);
 assert.equal(r.status,1);assert.match(r.stderr,/incomplete release/);assert.ok(!fs.existsSync(refused));
});
