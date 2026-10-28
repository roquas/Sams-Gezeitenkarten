import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {contactBatchFixture} from '../fixtures/contact-sheet/batch.mjs';
import {readContactBatch,createMapContactSheet,renderContactSvg} from '../../scripts/lib/map-contact-sheet.mjs';
import {main} from '../../scripts/render-map-contact-sheet.mjs';
import {assetRectangle} from '../../src/assets/geometry.mjs';
import {HEXES,CHART_BOUNDS} from '../../src/ui/chart-geometry.mjs';

const read=(batch,name)=>JSON.parse(fs.readFileSync(path.join(batch,name),'utf8'));
const rows=(batch,name)=>fs.readFileSync(path.join(batch,name),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
let fixture,accepted,loaded,serial=0;
before(async()=>{
 fixture=contactBatchFixture({assignmentSeedStart:1000,config:{maxMapAttempts:1}});
 accepted=rows(fixture.batch,'accepted.jsonl');
 loaded=await readContactBatch({batch:fixture.batch,acceptedIndices:[11,0,7]});
});
after(()=>fixture?.cleanup());
const fresh=name=>path.join(fixture.directory,name+'-'+serial++);
function changed(file,change){
 const batch=fresh('modified');fs.cpSync(fixture.batch,batch,{recursive:true});
 const jsonl=file.endsWith('.jsonl'),data=jsonl?rows(batch,file):read(batch,file);change(data);
 fs.writeFileSync(path.join(batch,file),jsonl?data.map(r=>JSON.stringify(r)).join('\n')+'\n':JSON.stringify(data));return batch;
}

test('accepted positions resolve original attempts and both independent seeds without changing records',async()=>{
 assert.ok(accepted.some((row,i)=>row.index!==i));
 assert.deepEqual(loaded.acceptedIndices,[11,0,7]);
 assert.deepEqual(loaded.rows,[accepted[11],accepted[0],accepted[7]]);
 for(const row of loaded.rows){
  assert.equal(row.generationSeed,row.index);assert.equal(row.assignmentSeed,1000+row.index);
  assert.equal(row.assignment.status,'complete');assert.equal(row.decision,'accepted');
  assert.equal(row.assignment.diagnostics.unassignedCount,0);
  assert.equal(row.assignment.placements.length,row.generation.map.objects.length);
 }
});

test('only accepted complete results are displayed; removed selection and invalid result indices are refused',async()=>{
 const rejected=rows(fixture.batch,'candidates.jsonl').find(r=>r.decision==='rejected');assert.ok(rejected);
 await assert.rejects(readContactBatch({batch:fixture.batch,indices:[rejected.index]}),/unknown contact batch option/);
 for(const selection of [{acceptedIndices:[12]},{acceptedIndices:[0,0]},{acceptedIndices:[]},{},
  {indices:[accepted[0].index],acceptedIndices:[0]}])await assert.rejects(readContactBatch({batch:fixture.batch,...selection}));
 for(const version of [1,2]){
  const batch=changed('manifest.json',m=>m.batchFormatVersion=version);
  await assert.rejects(readContactBatch({batch,acceptedIndices:[0]}),/unsupported batch format/);
 }
});

test('both saved streams and target summaries are validated including unselected rows',async()=>{
 for(const [file,change] of [
  ['accepted.jsonl',r=>r.reverse()],['accepted.jsonl',r=>r.pop()],['accepted.jsonl',r=>r.push(r[0])],
  ['accepted.jsonl',r=>r[5].generationSeed++],['accepted.jsonl',r=>r[5].assignment.placements[0].anchor='E5'],
  ['candidates.jsonl',r=>r[0].decision='accepted'],['candidates.jsonl',r=>r.at(-1).assignmentSeed++],
  ['candidates.jsonl',r=>r.pop()],['candidates.jsonl',r=>r[0].rejectionReasons=[]],
  ['summary.json',s=>s.acceptedCount++],['summary.json',s=>s.rejectedCount++],
  ['summary.json',s=>s.status='completed'],['summary.json',s=>s.batchFormatVersion=1],
  ['summary.json',s=>s.accepted.assignment.statuses.complete++],['summary.json',s=>s.rejectionCounts={version:'wrong'}],
  ['manifest.json',m=>m.catalogProfile.capacities[0].count++],['manifest.json',m=>m.versions.acceptance='other']
 ]){
  const batch=changed(file,change),out=fresh('refused');
  await assert.rejects(createMapContactSheet({batch,acceptedIndices:[0],out}),file);assert.ok(!fs.existsSync(out));
 }
 const missing=fresh('missing');fs.cpSync(fixture.batch,missing,{recursive:true});fs.unlinkSync(path.join(missing,'accepted.jsonl'));
 await assert.rejects(readContactBatch({batch:missing,acceptedIndices:[0]}),/ENOENT/);
});

test('complete rendering preserves exact motif rectangle, anchor, orientation and edge placement',async()=>{
 const all=await readContactBatch({batch:fixture.batch,acceptedIndices:Array.from({length:12},(_,i)=>i)});
 const library=all.released.catalog.library,byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
 const edges=new Set();
 for(const row of all.rows){
  const svg=renderContactSvg(row,library,all.released.chartContract.format.files,ref=>ref);
  assert.ok(!svg.includes('data-unillustrated-object='));assert.ok(!svg.includes('transform='));
  for(const p of row.assignment.placements){
   const asset=library.assets.find(a=>a.id===p.assetId),{cells,...rect}=assetRectangle(asset,p.anchor,byId);
   const image=svg.match(new RegExp('<image[^>]*data-placement-id="'+p.id+'"[^>]*>'))[0];
   for(const [key,value] of Object.entries(rect))assert.ok(image.includes(key+'="'+value+'"'));
   assert.ok(image.includes('data-asset-id="'+p.assetId+'"'));assert.ok(image.includes('data-art-cells="'+cells.join(' ')+'"'));
   assert.ok(image.includes('preserveAspectRatio="xMidYMid meet"'));
   assert.ok(rect.x>=CHART_BOUNDS.x&&rect.y>=CHART_BOUNDS.y&&rect.x+rect.width<=CHART_BOUNDS.x+CHART_BOUNDS.width&&rect.y+rect.height<=CHART_BOUNDS.y+CHART_BOUNDS.height);
   for(const cell of cells){if(cell[0]==='A')edges.add('left');if(cell[0]==='E')edges.add('right');if(cell[1]==='1')edges.add('top');if(cell[1]==='5')edges.add('bottom');}
  }
 }
 assert.deepEqual([...edges].sort(),['bottom','left','right','top']);
});

test('HTML links result, attempt, fingerprint and saved motif anchors and is byte reproducible',async()=>{
 const args={batch:fixture.batch,acceptedIndices:[11,0,7]},first=fresh('sheet'),second=fresh('sheet');
 const result=await createMapContactSheet({...args,out:first});await createMapContactSheet({...args,out:second});
 assert.deepEqual(result.indices,loaded.rows.map(r=>r.index));assert.deepEqual(result.acceptedIndices,[11,0,7]);
 const html=fs.readFileSync(path.join(first,'index.html'),'utf8');
 for(const [i,row] of loaded.rows.entries()){
  assert.ok(html.includes('Ergebnis '+loaded.acceptedIndices[i]+' · Versuch '+row.index));
  assert.ok(html.includes('data-attempt-index="'+row.index+'" data-result-index="'+loaded.acceptedIndices[i]+'"'));
  assert.ok(html.includes(row.mapFingerprint));
  for(const p of row.assignment.placements){assert.ok(html.includes(p.assetId));assert.ok(html.includes('Anker '+p.anchor));}
 }
 const files=['index.html',...fs.readdirSync(path.join(first,'resources')).map(f=>'resources/'+f)];
 for(const file of files)assert.deepEqual(fs.readFileSync(path.join(first,file)),fs.readFileSync(path.join(second,file)));
 const cli=await main(['--batch',fixture.batch,'--accepted-indices','11,0,7','--out',fresh('cli')]);
 assert.deepEqual(cli.indices,result.indices);assert.deepEqual(cli.acceptedIndices,[11,0,7]);
 await assert.rejects(main(['--batch',fixture.batch,'--indices','0','--accepted-indices','0','--out',fresh('ambiguous')]),/Invalid or duplicate option/);
});

test('regular budget exhaustion retains actual accepted results and explicitly reports an unmet target',async()=>{
 const partial=contactBatchFixture({targetCount:100,maxAttempts:6,config:{maxMapAttempts:1}});
 try{
  const summary=read(partial.batch,'summary.json');assert.equal(summary.status,'target-unreached');assert.ok(summary.acceptedCount>0);
  const out=path.join(partial.directory,'sheet');await createMapContactSheet({batch:partial.batch,acceptedIndices:[0],out});
  assert.ok(fs.readFileSync(path.join(out,'index.html'),'utf8').includes('target-unreached'));
 }finally{partial.cleanup();}
});

test('a thousand-result batch supports sparse selection across the complete accepted stream',async()=>{
 const large=contactBatchFixture({targetCount:1000,maxAttempts:5000,assignmentSeedStart:100000,config:{maxMapAttempts:1}});
 try{
  const result=await readContactBatch({batch:large.batch,acceptedIndices:[999,0,500]});
  assert.equal(result.summary.acceptedCount,1000);assert.equal(result.rows.length,3);
  assert.ok(result.rows[0].index>999);assert.equal(result.rows[0].assignmentSeed,100000+result.rows[0].index);
  const saved=rows(large.batch,'accepted.jsonl');assert.deepEqual(result.rows,[saved[999],saved[0],saved[500]]);
 }finally{large.cleanup();}
});
