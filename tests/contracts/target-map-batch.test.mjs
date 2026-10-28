import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {normalizeBatchOptions,generateBatchRecord} from '../../scripts/lib/map-batch.mjs';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {createCatalogProfile,assignAssets} from '../../src/assets/assignment.mjs';
import {generateMap} from '../../src/generation/maps.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {validatePlacements} from '../../src/assets/library.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const releaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
const releaseArgs=['--release',releaseId,'--background','sea-blue-01'];
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
let directory,program,catalog,serial=0;
before(()=>{
 catalog=loadReleasedAssetCatalog({repositoryRoot:project,releaseId,backgroundId:'sea-blue-01'}).catalog;
 directory=fs.mkdtempSync(path.join(os.tmpdir(),'gk-target-batch-'));program=path.join(directory,'program');
 git(project,'clone','--quiet','--shared',project,program);
 for(const name of ['src','scripts'])fs.cpSync(path.join(project,name),path.join(program,name),{recursive:true});
 git(program,'add','src','scripts');
 if(git(program,'diff','--cached','--name-only'))git(program,'-c','user.name=Target test','-c','user.email=target@example.invalid',
  '-c','commit.gpgsign=false','commit','--quiet','-m','Disposable target batch implementation');
});
after(()=>fs.rmSync(directory,{recursive:true,force:true}));
const fresh=name=>path.join(directory,name+'-'+serial++);
const read=(batch,name)=>JSON.parse(fs.readFileSync(path.join(batch,name),'utf8'));
const rows=(batch,name='candidates.jsonl')=>fs.readFileSync(path.join(batch,name),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
function cli(args){
 const r=spawnSync(process.execPath,[path.join(program,'scripts/generate-map-batch.mjs'),...args],{cwd:directory,encoding:'utf8',maxBuffer:32*1024*1024});
 assert.ifError(r.error);return r;
}
function success(args){const r=cli(args);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
function run({target=12,budget=100,config={maxMapAttempts:1},extra=[]}={}){
 const out=fresh('batch'),file=fresh('config.json');fs.writeFileSync(file,JSON.stringify(config));
 const summary=success(['run',...releaseArgs,'--mode','catalog-compliant','--target-count',String(target),'--max-attempts',String(budget),
  '--seed-start','0','--assignment-seed-start','1000','--config',file,'--out',out,...extra]);return {out,summary};
}
const replay=(out,index)=>['replay','--batch',out,'--index',String(index),'--out',fresh('replay.json')];

test('target options require an explicit bounded budget, separate mode and canonical seed schedules',()=>{
 const o=normalizeBatchOptions({mode:'catalog-compliant',targetCount:1000,maxAttempts:10,seedStart:0});
 assert.deepEqual(normalizeBatchOptions(o),o);assert.equal(o.assignmentSeedStart,0);
 for(const change of [{maxAttempts:undefined},{targetCount:0},{maxAttempts:0},{count:1000},{mode:'free'},
  {seedStart:0xffffffff},{assignmentSeedStart:0xffffffff},{preferencePercent:100}])
  assert.throws(()=>normalizeBatchOptions({...o,...change}));
 assert.equal(normalizeBatchOptions({...o,targetCount:1,maxAttempts:1,seedStart:0xffffffff,assignmentSeedStart:0xffffffff}).seedStart,0xffffffff);
});

test('target records use original attempt indices/seeds and existing geography and assignment services',()=>{
 const options=normalizeBatchOptions({mode:'catalog-compliant',targetCount:10,maxAttempts:100,seedStart:40,assignmentSeedStart:80});
 const profile=createCatalogProfile(catalog,{mode:options.mode}),row=generateBatchRecord(7,options,catalog,profile);
 assert.equal(row.index,7);assert.equal(row.generationSeed,47);assert.equal(row.assignmentSeed,87);assert.equal(row.decision,'accepted');
 const g=generateMap({seed:47,config:options.config,mode:options.mode,catalogProfile:profile});
 assert.deepEqual(row.generation,g);
 assert.deepEqual(row.assignment,assignAssets({map:g.map,seed:87,catalog,reusePolicy:options.mode}));
 assert.deepEqual(row,generateBatchRecord(7,options,catalog));
});

test('whole-map assignment remains a final acceptance gate even if a trusted profile overstates stock',()=>{
 const options=normalizeBatchOptions({mode:'catalog-compliant',targetCount:1,maxAttempts:1,seedStart:0,
  config:{objectCount:2,objectSizes:[1],passableProbability:0}});
 const profile=createCatalogProfile(catalog,{mode:options.mode});
 profile.capacities.find(g=>!g.passable&&g.shape==='0,0').count=2;
 const row=generateBatchRecord(0,options,catalog,profile);
 assert.equal(row.generation.status,'generated');assert.equal(row.assignment.status,'partial');
 assert.equal(row.decision,'rejected');assert.ok(row.rejectionReasons.includes('ASSET_REUSE_EXHAUSTED'));
 assert.equal(row.error,undefined);
});

test('real released target batch replaces rejected attempts, saves only complete accepted maps and replays byte exactly',()=>{
 const {out,summary:s}=run(),all=rows(out),accepted=rows(out,'accepted.jsonl'),manifest=read(out,'manifest.json');
 assert.equal(s.status,'target-reached');assert.equal(s.acceptedCount,12);assert.ok(s.attemptedCount>12);
 assert.equal(s.rejectedCount,s.attemptedCount-12);assert.ok(s.rejectionCounts.OBJECT_SPACING_EXHAUSTED>0);
 assert.equal(all.length,s.attemptedCount);assert.deepEqual(accepted,all.filter(r=>r.decision==='accepted'));
 assert.equal(manifest.batchFormatVersion,2);assert.equal(manifest.catalogProfile.version,'catalog-capacities-1');
 assert.equal(manifest.versions.acceptance,'catalog-complete-1');assert.equal(manifest.provenance.releaseId,releaseId);
 assert.equal(s.accepted.assignment.statuses.complete,12);assert.equal(s.accepted.geography.statuses.generated,12);
 const selected=new Set(catalog.verification.assets.map(a=>a.assetId));
 for(const row of accepted){
  validateMap(row.generation.map,{separateObjects:true});assert.equal(row.assignment.status,'complete');assert.deepEqual(row.rejectionReasons,[]);
  assert.deepEqual(validatePlacements(row.assignment.placements,catalog.library,row.generation.map,catalog.backgroundId),[]);
  const usage=row.assignment.diagnostics.assetUsage;
  for(const [id,count] of Object.entries(usage)){
   assert.ok(selected.has(id));const asset=catalog.library.assets.find(a=>a.id===id);if(!asset.passable)assert.equal(count,1);
  }
  const passable=row.generation.map.objects.filter(o=>o.passable).length;
  const passableMotifs=Object.keys(usage).filter(id=>catalog.library.assets.find(a=>a.id===id).passable);
  assert.equal(passableMotifs.length,passable); // current release has nine compatible singlehex paintings
 }
 for(const row of [all[0],accepted.find((r,i)=>r.index!==i),all.find(r=>r.decision==='rejected')]){
  assert.ok(row);const args=replay(out,row.index);assert.equal(success(args).status,'matched');
  assert.equal(fs.readFileSync(args.at(-1),'utf8'),JSON.stringify(row)+'\n');
  assert.equal(row.generationSeed,row.index);assert.equal(row.assignmentSeed,1000+row.index);
 }
 const second=run();for(const name of ['manifest.json','candidates.jsonl','accepted.jsonl','summary.json'])
  assert.deepEqual(fs.readFileSync(path.join(out,name)),fs.readFileSync(path.join(second.out,name)));
});

test('budget exhaustion and impossible catalog requests report zero or actual accepted count without substitute maps',()=>{
 const {out,summary:s}=run({target:1000,budget:3});assert.equal(s.status,'target-unreached');
 assert.equal(s.attemptedCount,3);assert.ok(s.acceptedCount<1000);assert.equal(rows(out,'accepted.jsonl').length,s.acceptedCount);
 const impossible=run({target:5,budget:4,config:{objectCount:2,objectSizes:[1],passableProbability:0,maxMapAttempts:2}});
 assert.equal(impossible.summary.status,'target-unreached');assert.equal(impossible.summary.acceptedCount,0);
 assert.equal(impossible.summary.attemptedCount,4);assert.equal(impossible.summary.rejectionCounts.CATALOG_CAPACITY_EXHAUSTED,4);
 assert.equal(impossible.summary.attempted.geography.rejectionCounts.CATALOG_CAPACITY_EXHAUSTED,8);
 assert.deepEqual(rows(impossible.out,'accepted.jsonl'),[]);success(replay(impossible.out,3));
});

test('empty maps remain explicit duplicates; no uniqueness condition or invented quality score is introduced',()=>{
 const {out,summary:s}=run({target:3,budget:3,config:{objectCount:0}});
 assert.equal(s.acceptedCount,3);assert.equal(s.accepted.geography.distinctMaps,1);assert.equal(s.accepted.geography.duplicateMaps,2);
 assert.equal(s.accepted.geography.emptyMaps,3);assert.equal(s.accepted.repetitionHistogram[0],3);
 assert.equal(rows(out,'accepted.jsonl').length,3);
});

test('target replay rejects manifest/version/seed/decision drift and remains usable after interruption',()=>{
 const {out}=run();
 for(const change of [m=>m.versions.acceptance='other',m=>m.batchFormatVersion=1,m=>m.catalogProfile.capacities[0].count++,
  m=>m.options.maxAttempts=0,m=>m.provenance.releaseId='latest']){
  const copy=fresh('changed');fs.cpSync(out,copy,{recursive:true});const m=read(copy,'manifest.json');change(m);
  fs.writeFileSync(path.join(copy,'manifest.json'),JSON.stringify(m));const args=replay(copy,0);
  assert.equal(cli(args).status,1);assert.ok(!fs.existsSync(args.at(-1)));
 }
 const saved=rows(out),copy=fresh('decision');fs.cpSync(out,copy,{recursive:true});saved[0].decision='invented';
 fs.writeFileSync(path.join(copy,'candidates.jsonl'),saved.map(JSON.stringify).join('\n')+'\n');assert.equal(cli(replay(copy,0)).status,1);
 fs.unlinkSync(path.join(out,'summary.json'));fs.writeFileSync(path.join(out,'candidates.jsonl'),JSON.stringify(rows(out)[0])+'\n{"index":1');
 success(replay(out,0));assert.equal(cli(replay(out,1)).status,1);
});

test('new CLI refuses ambiguous old/new count flags and missing budgets before output',()=>{
 for(const extra of [['--count','10'],['--preference-percent','100'],['--max-attempts','0']]){
  const out=fresh('refused'),r=cli(['run',...releaseArgs,'--mode','catalog-compliant','--target-count','2',
   ...(extra[0]==='--max-attempts'?[]:['--max-attempts','10']),'--seed-start','0','--out',out,...extra]);
  assert.equal(r.status,1);assert.ok(!fs.existsSync(out));
 }
});

test('target run and replay use Git release resources with absent working assets; missing approval cannot fall back',()=>{
 const data=fresh('data');git(project,'clone','--quiet','--shared',project,data);
 fs.rmSync(path.join(data,'assets'),{recursive:true});fs.rmSync(path.join(data,'archive/catalog-releases'),{recursive:true});
 const {out,summary}=run({target:3,budget:30,extra:['--repository',data]});assert.equal(summary.status,'target-reached');
 success([...replay(out,rows(out,'accepted.jsonl')[0].index),'--repository',data]);
 git(data,'add','archive');git(data,'-c','user.name=Target test','-c','user.email=target@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Remove working archive in disposable repository');
 const refused=fresh('unapproved'),r=cli(['run',...releaseArgs,'--mode','catalog-compliant','--target-count','1',
  '--max-attempts','10','--seed-start','0','--repository',data,'--out',refused]);
 assert.equal(r.status,1);assert.match(r.stderr,/incomplete release/);assert.ok(!fs.existsSync(refused));
});
