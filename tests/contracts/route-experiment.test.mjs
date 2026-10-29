import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {contactBatchFixture} from '../fixtures/contact-sheet/batch.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {mapFingerprint} from '../../scripts/lib/publication-archive.mjs';
import {analyzeRouteMap,selectTargetRoute,EXPERIMENT_STEPS,ROUTE_ORDER} from '../../scripts/lib/route-experiment.mjs';
import {main} from '../../scripts/run-route-experiment.mjs';

const map=objects=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
const port=(cells=['C3'])=>({id:'port',cells,passable:true});
const openMap=()=>map([port(['C3','D3'])]);
const restricted=(open,starts=['C3'])=>map([port(starts),...cellsOf({columns:5,rows:5}).filter(c=>!open.includes(c))
 .map(c=>({id:'block-'+c,cells:[c],passable:false}))]);
const exact={maxNodesPerStart:1000000};

test('B1 counts all eligible starts at exactly six steps using existing route semantics',()=>{
 const m=openMap(),before=structuredClone(m),a=analyzeRouteMap(m,exact);
 assert.equal(EXPERIMENT_STEPS,6);assert.equal(a.steps,6);
 assert.deepEqual(a.starts.map(s=>s.cell),['C3','D3']);
 let total=0;
 for(const s of a.starts){
  const routes=[...createRules({map:m,start:s.cell,steps:6,clues:[]}).routes()];
  assert.ok(routes.length>0);assert.ok(routes.every(r=>r.length===7));
  assert.equal(s.routeCountLowerBound,routes.length);assert.equal(s.countExact,true);
  assert.equal(s.search.completed,true);assert.equal(s.routeSource.order,ROUTE_ORDER);
  assert.equal(s.routeSource.mapFingerprint,mapFingerprint(m));assert.equal(s.routeSource.steps,6);
  total+=routes.length;
 }
 assert.equal(a.routeCountLowerBound,total);assert.equal(a.countExact,true);assert.deepEqual(m,before);
 for(const options of [{}, {maxNodesPerStart:0},{maxNodesPerStart:1.5},{maxNodesPerStart:1000001},{...exact,steps:3}])
  assert.throws(()=>analyzeRouteMap(m,options));
});

test('empty and blocked-only maps remain explicit no-start results with exact zero',()=>{
 for(const m of [map([]),map([{id:'island',cells:['C3'],passable:false}])]){
  const a=analyzeRouteMap(m,exact);
  assert.equal(a.status,'no-start');assert.equal(a.reason,'NO_ELIGIBLE_START');
  assert.deepEqual(a.starts,[]);assert.equal(a.routeCountLowerBound,0);assert.equal(a.countExact,true);
  assert.equal(a.search.nodesVisited,0);assert.equal(a.search.completed,true);
 }
});

test('component proof and exhaustive zero routes are distinguished from budget exhaustion',()=>{
 const small=analyzeRouteMap(restricted(['C3','E4','E5']),{maxNodesPerStart:1});
 assert.equal(small.status,'no-route');assert.equal(small.starts[0].reason,'COMPONENT_TOO_SMALL');
 assert.equal(small.countExact,true);assert.equal(small.search.nodesVisited,0);
 // Three arms of length two: seven connected cells, but no simple six-step route.
 const tree=restricted(['C3','D3','E3','B4','B5','B2','B1']);
 const none=analyzeRouteMap(tree,exact);
 assert.equal(none.status,'no-route');assert.equal(none.routeCountLowerBound,0);
 assert.equal(none.countExact,true);assert.ok(none.search.nodesVisited>0);
 const unknown=analyzeRouteMap(tree,{maxNodesPerStart:1});
 assert.equal(unknown.status,'unknown');assert.equal(unknown.reason,'SEARCH_BUDGET_EXCEEDED');
 assert.equal(unknown.routeCountLowerBound,0);assert.equal(unknown.countExact,false);
 assert.equal(unknown.search.completed,false);
 const positive=analyzeRouteMap(map([port()]),{maxNodesPerStart:7});
 assert.equal(positive.status,'route-found');assert.ok(positive.routeCountLowerBound>0);
 assert.equal(positive.countExact,false);assert.equal(positive.reason,'SEARCH_BUDGET_EXCEEDED');
});

test('B2 route ordinals use the engine order, stable instance identity and an independent explicit budget',()=>{
 const m=openMap(),routes=[...createRules({map:m,start:'C3',steps:6,clues:[]}).routes()];
 assert.equal(routes.length,2020);
 assert.deepEqual(routes.slice(0,2),[
  ['C3','B2','B1','A1','A2','A3','B3'],['C3','B2','B1','A1','A2','A3','A4']]);
 assert.deepEqual(routes.at(-1),['C3','C4','D5','E5','E4','D4','E3']);
 for(const routeIndex of [0,1,routes.length-1]){
  const a=selectTargetRoute(m,{start:'C3',routeIndex,maxNodes:1000000});
  assert.equal(a.status,'selected');assert.deepEqual(a.route,routes[routeIndex]);
  assert.equal(a.source.routeIndex,routeIndex);assert.equal(a.source.order,ROUTE_ORDER);
  assert.match(a.instanceFingerprint,/^gk-instance-v2-sha256:/);
  assert.deepEqual(a,selectTargetRoute(m,{start:'C3',routeIndex,maxNodes:1000000}));
 }
 const a=selectTargetRoute(m,{start:'C3',routeIndex:0,maxNodes:1000000});
 assert.equal(selectTargetRoute(m,{start:'C3',routeIndex:0,maxNodes:100}).instanceFingerprint,a.instanceFingerprint);
 const unknown=selectTargetRoute(m,{start:'C3',routeIndex:0,maxNodes:1});
 assert.equal(unknown.status,'unknown');assert.equal(unknown.search.completed,false);assert.equal(unknown.route,undefined);
 const absent=selectTargetRoute(m,{start:'C3',routeIndex:routes.length,maxNodes:1000000});
 assert.equal(absent.status,'not-found');assert.equal(absent.search.completed,true);assert.equal(absent.search.routesVisited,routes.length);
 for(const change of [{start:'A1'},{routeIndex:-1},{maxNodes:undefined},{steps:5}])
  assert.throws(()=>selectTargetRoute(m,{start:'C3',routeIndex:0,maxNodes:100,...change}));
});

let fixture,serial=0;
before(()=>{fixture=contactBatchFixture({targetCount:12,maxAttempts:40,assignmentSeedStart:100000,
 config:{objectCount:{min:0,max:7},maxMapAttempts:1}});});
after(()=>fixture?.cleanup());
const fresh=name=>path.join(fixture.directory,name+'-'+serial++);
const read=(dir,name)=>fs.readFileSync(path.join(dir,name),'utf8');
const rows=(dir,name)=>read(dir,name).trim().split('\n').filter(Boolean).map(JSON.parse);
function cli(args,entry=path.join(fixture.program,'scripts/run-route-experiment.mjs')){
 const result=spawnSync(process.execPath,[entry,...args],{encoding:'utf8'});
 assert.ifError(result.error);return result;
}
function run({batch=fixture.batch,selection='all',budget=1000000,out=fresh('run')}={}){
 const result=cli(['--batch',batch,'--accepted-indices',selection,'--max-nodes-per-start',String(budget),'--out',out]);
 assert.equal(result.status,0,result.stderr);return {out,summary:JSON.parse(result.stdout)};
}

test('symlink CLI without required arguments fails like the canonical entry point',()=>{
 const link=fresh('route-cli.mjs');fs.symlinkSync(path.join(fixture.program,'scripts/run-route-experiment.mjs'),link);
 const canonical=cli([]),linked=cli([],link);
 assert.equal(canonical.status,1);assert.match(canonical.stderr,/Missing --batch/);
 assert.equal(linked.status,1);assert.equal(linked.stdout,'');assert.equal(linked.stderr,canonical.stderr);
});

test('file and directory symlink CLI calls execute and produce the canonical result files',()=>{
 const canonical=run(),fileLink=fresh('route-cli.mjs'),directoryLink=fresh('program-alias');
 fs.symlinkSync(path.join(fixture.program,'scripts/run-route-experiment.mjs'),fileLink);
 fs.symlinkSync(fixture.program,directoryLink,'dir');
 for(const entry of [fileLink,path.join(directoryLink,'scripts/run-route-experiment.mjs')]){
  const out=fresh('symlink-run'),result=cli(['--batch',fixture.batch,'--accepted-indices','all',
   '--max-nodes-per-start','1000000','--out',out],entry);
  assert.equal(result.status,0,result.stderr);
  for(const file of ['manifest.json','maps.jsonl','summary.json']){
   assert.ok(fs.existsSync(path.join(out,file)),file+' must be created by the symlink invocation');
   assert.equal(read(out,file),read(canonical.out,file));
  }
  assert.deepEqual(JSON.parse(result.stdout),canonical.summary);
 }
});

test('real completed input produces byte-identical B1 files across output paths and preserves every selected map',()=>{
 const before=Object.fromEntries(['manifest.json','summary.json','accepted.jsonl','candidates.jsonl'].map(f=>[f,read(fixture.batch,f)]));
 const a=run(),b=run(),input=rows(fixture.batch,'accepted.jsonl'),output=rows(a.out,'maps.jsonl');
 for(const file of ['manifest.json','summary.json','maps.jsonl'])assert.equal(read(a.out,file),read(b.out,file));
 assert.equal(a.summary.mapCount,input.length);assert.equal(output.length,input.length);
 assert.equal(a.summary.startCount,input.reduce((n,r)=>n+r.generation.map.objects.filter(o=>o.passable).flatMap(o=>o.cells).length,0));
 assert.ok(a.summary.mapStatuses['no-start']>0);assert.equal(a.summary.countExact,true);
 assert.equal(a.summary.search.totalNodeBudget,a.summary.startCount*1000000);
 assert.equal(new Set(output.map(r=>r.mapTrialId)).size,output.length);
 const manifest=JSON.parse(read(a.out,'manifest.json'));
 assert.equal(manifest.steps,6);assert.equal(manifest.experimentFormatVersion,1);
 assert.equal(manifest.input.batchManifest.versions.rules,'gezeitenkarten-2');
 assert.equal(manifest.input.batchManifest.provenance.releaseId,JSON.parse(before['manifest.json']).provenance.releaseId);
 for(let i=0;i<input.length;i++){
  assert.equal(output[i].source.acceptedIndex,i);assert.equal(output[i].source.candidateIndex,input[i].index);
  assert.equal(output[i].mapFingerprint,input[i].mapFingerprint);assert.deepEqual(output[i].map,input[i].generation.map);
  assert.deepEqual(output[i].assetPlacements,input[i].assignment.placements);
 }
 for(const [file,bytes] of Object.entries(before))assert.equal(read(fixture.batch,file),bytes);
});

test('explicit selection order, duplicates of map content, and incomplete counts remain visible without replacements',()=>{
 const selected=run({selection:'11,0,3'}),out=rows(selected.out,'maps.jsonl');
 assert.deepEqual(out.map(r=>r.source.acceptedIndex),[11,0,3]);assert.equal(selected.summary.mapCount,3);
 const low=run({budget:1});assert.equal(low.summary.mapCount,12);assert.equal(low.summary.countExact,false);
 assert.ok(low.summary.incompleteStarts>0);assert.ok(low.summary.mapStatuses.unknown>0);
 assert.ok(low.summary.mapStatuses['no-start']>0);
 for(const r of rows(low.out,'maps.jsonl'))for(const s of r.starts){
  assert.ok(s.search.nodesVisited<=1);assert.equal(s.routeSource.steps,6);
  if(!s.countExact)assert.notEqual(s.status,'no-route');
 }
 const empty=rows(low.out,'maps.jsonl').filter(r=>r.map.objects.length===0);
 assert.ok(empty.length>=2);assert.equal(new Set(empty.map(r=>r.mapFingerprint)).size,1);
 assert.equal(new Set(empty.map(r=>r.mapTrialId)).size,empty.length);
 assert.notEqual(low.summary.experimentId,selected.summary.experimentId);
 const retry=cli(['--batch',fixture.batch,'--accepted-indices','all','--max-nodes-per-start','1','--out',low.out]);
 assert.notEqual(retry.status,0);assert.match(retry.stderr,/EEXIST/);
});

test('all also records a completed source batch with zero accepted cards',()=>{
 const empty=contactBatchFixture({targetCount:1,maxAttempts:1,config:{objectCount:1,objectSizes:[25],maxMapAttempts:1}});
 try{
  const a=run({batch:empty.batch});assert.equal(a.summary.mapCount,0);assert.equal(a.summary.startCount,0);
  assert.equal(a.summary.countExact,true);assert.equal(read(a.out,'maps.jsonl'),'');
 }finally{empty.cleanup();}
});

test('invalid or unfinished input, including corrupt UNSELECTED records, is refused before reserving output',()=>{
 for(const change of [
  batch=>fs.unlinkSync(path.join(batch,'summary.json')),
  batch=>{const data=rows(batch,'candidates.jsonl');data.at(-1).mapFingerprint='corrupt';fs.writeFileSync(path.join(batch,'candidates.jsonl'),data.map(JSON.stringify).join('\n')+'\n');}
 ]){
  const batch=fresh('corrupt');fs.cpSync(fixture.batch,batch,{recursive:true});change(batch);
  const out=fresh('refused'),r=cli(['--batch',batch,'--accepted-indices','0','--max-nodes-per-start','100','--out',out]);
  assert.equal(r.status,1);assert.ok(!fs.existsSync(out));
 }
 const out=path.join(fixture.batch,'nested-output');
 const nested=cli(['--batch',fixture.batch,'--accepted-indices','all','--max-nodes-per-start','1','--out',out]);
 assert.equal(nested.status,1);assert.match(nested.stderr,/outside the input batch/);assert.ok(!fs.existsSync(out));
});

test('source suitability filters cannot silently select the B1 corpus',()=>{
 const filtered=contactBatchFixture({targetCount:1,maxAttempts:40,config:{maxMapAttempts:1,filters:{routeSteps:[1]}}});
 try{
  const out=fresh('filtered'),r=cli(['--batch',filtered.batch,'--accepted-indices','all','--max-nodes-per-start','100','--out',out]);
  assert.equal(r.status,1);assert.match(r.stderr,/suitability filters/);assert.ok(!fs.existsSync(out));
 }finally{filtered.cleanup();}
});

test('CLI rejects implicit budgets, shorter routes, malformed and duplicate selections and unknown strategy flags',async()=>{
 const required=['--batch',fixture.batch,'--accepted-indices','all','--max-nodes-per-start','100','--out',fresh('invalid')];
 for(const args of [[],required.filter((_,i)=>i!==4&&i!==5),[...required,'--steps','3'],[...required,'--strategy','other'],
  [...required,'--accepted-indices','0'],required.map(v=>v==='all'?'0,,1':v),required.map(v=>v==='100'?'1.5':v)])
  await assert.rejects(main(args));
 for(const selection of ['0,0','999999']){
  const out=fresh('invalid-selection'),r=cli(['--batch',fixture.batch,'--accepted-indices',selection,'--max-nodes-per-start','1','--out',out]);
  assert.equal(r.status,1);assert.ok(!fs.existsSync(out));
 }
});
