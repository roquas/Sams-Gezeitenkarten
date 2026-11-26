import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {preparePilotStore,verifyPilot,PILOT_RESPONSE_SHA} from '../../scripts/lib/flavor-quality-pilot.mjs';
import {buildReaderInputs,createReaderJob,createReviewerJob,METHOD_HASH,packageFiles} from '../../scripts/lib/flavor-quality-package.mjs';
import {validateReaderItem,validateReviewerItem,validateEnvelope,textUnits,hash,qualify,responseSchema} from '../../scripts/lib/flavor-quality-contract.mjs';
import {compareClue,compareReaderItem,normalForm} from '../../scripts/lib/flavor-quality-compare.mjs';
import {parseQualityResponse} from '../../scripts/lib/flavor-quality-json.mjs';
import {createProductionRecords,createProductionOrder,contentHash,materializeFlavorRevision,validateStoredProductionRecords} from '../../scripts/lib/flavor-production.mjs';
import {revisionReference} from '../../scripts/lib/flavor-production-store.mjs';
import {createFlavorCheckpoint} from '../../scripts/lib/flavor-contract.mjs';
import {canonicalJson,sha256} from '../../scripts/lib/content-hash.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {direction} from '../../src/engine/hex.mjs';
import {schemaErrors} from '../../src/puzzles/schema.mjs';
import {technicalReader,technicalReviewer} from '../fixtures/flavor-quality/technical-responses.mjs';
const copy=structuredClone;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'f02b-contract-'));
let fixture;
function f(){
 if(!fixture){const p=preparePilotStore(path.join(dir,'production')),inputs=buildReaderInputs(p),pkg=createReaderJob(inputs);
  fixture={...p,inputs,pkg,reader:technicalReader(pkg.job,inputs.entries.map(e=>e.originals))};}
 return fixture;
}
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));

test('supplied real snapshots preserve response SHA, receipt, four records, all names, 23 F01 UNCERTAIN checks',()=>{
 const pilot=verifyPilot();assert.equal(sha256(pilot.files.get('response.json')),PILOT_RESPONSE_SHA);
 assert.equal(pilot.records.reduce((n,r)=>n+Object.keys(r.checkpoint.checks).length,0),23);
 for(const [i,r] of pilot.records.entries()){
  assert.equal(r.flavorVariantId,'independent-1');assert.equal(r.draft.revision,1);
  assert.ok(Object.values(r.checkpoint.checks).every(c=>c.status==='UNCERTAIN'&&c.method==='flavor-check-v1'));
  assert.deepEqual(pilot.presentations[i].puzzle.presentation.objectNames,pilot.order.positions[i].card.objectNames);
 }
 assert.equal(pilot.provenance.producer.model,null);assert.equal(pilot.provenance.producer.producedAt,null);
});

test('new drafts retain complete pilot names while historical idempotent imports keep every stored byte',()=>{
 const pilot=verifyPilot(),response=JSON.parse(pilot.files.get('response.json'));
 const current=createProductionRecords(pilot.order,response);
 for(const [i,r] of current.entries()){
  assert.equal(r.draft.contractVersion,2);
  assert.deepEqual(r.draft.presentation.objectNames,pilot.order.positions[i].card.objectNames);
  assert.deepEqual(materializeFlavorRevision(pilot.order.positions[i],r).puzzle,pilot.presentations[i].puzzle);
 }
 const {production}=preparePilotStore(path.join(dir,'legacy-idempotent'));
 const receipt=JSON.parse(pilot.files.get('receipt.json'));
 const imported=production.importResponse({orderId:pilot.order.orderId,runId:'pilot-1',responseBytes:pilot.files.get('response.json'),operator:receipt.operator.value});
 assert.equal(imported.created,false);assert.deepEqual(imported.records,pilot.records);
 for(const [ref,bytes] of pilot.files)assert.deepEqual(fs.readFileSync(path.join(production.directory,'imports/pilot-1',ref)),bytes);
 for(const mutate of [r=>r.pop(),r=>{r[0].draft.contractVersion=3;},r=>{r[0].draft.presentation.objectNames.unknown='Invented';},r=>{r[0].draft.presentation.title+=' changed';}]){
  const changed=copy(pilot.records);mutate(changed);assert.throws(()=>validateStoredProductionRecords(pilot.order,response,changed));
 }
});

test('blind files, image bytes, filenames, metadata and template expose only positive-list inputs',()=>{
 const {pkg,inputs}=f();const textual=[...pkg.files].filter(([n])=>!n.startsWith('resources/')).map(([n,b])=>n+'\n'+b).join('\n');
 assert.doesNotMatch(textual,/C-06|C-02|C-03|C-11|independent-1|revisionRef|sourceHash|draftHash|checkpoint|controlled-v1|candidateId|repairTarget|expectedResult|originals|logic\.clues|cluePlaceRefs|\/Users\//);
 for(const e of inputs.entries){
  assert.ok(!textual.includes(e.binding.sourceHash));assert.ok(!textual.includes(e.binding.revisionRef.revisionHash));
  for(const c of e.originals)assert.ok(!textual.includes(canonicalJson(c)));
 }
 for(const p of verifyPilot().order.positions)for(const t of Object.values(p.request.source.presentation.clueTexts))assert.ok(!textual.includes(t),'technical source text leaked');
 for(const [name,bytes] of pkg.files){
  assert.ok(!/C-0|C-11|pilot|positive|negative|mutation|local|sourceHash/.test(name));
  for(const secret of ['sourceHash','revisionHash','checkpoint','controlled-v1'])assert.ok(!Buffer.from(bytes).includes(Buffer.from(secret)),name+': '+secret);
 }
 assert.equal(pkg.job.methodHash,METHOD_HASH);assert.equal(pkg.job.items.length,4);
 const template=JSON.parse(pkg.files.get('response-template.json'));assert.ok(template.items.every(i=>i.claims.length===0));
});

test('only private original mutation changes local source binding; same player text yields identical full blind files with fixed opaque IDs',()=>{
 const {inputs,pkg}=f(),pilot=verifyPilot();
 const order=copy(pilot.order);order.positions[0].request.source.logic.clues[0].distance=2;
 order.positions[0].request.source.presentation.clueTexts.H1+=' PRIVATE_NESTED_ORIGINAL_SENTINEL';
 const p=order.positions[0];p.request.sourceHash=sha256('gezeitenkarten-flavor/v1\0'+canonicalJson(p.request.source));p.sourceHash=p.request.sourceHash;
 const changedOrder=createProductionOrder(order),response=JSON.parse(pilot.files.get('response.json'));response.orderId=changedOrder.orderId;
 for(let i=0;i<response.positions.length;i++){response.positions[i].sourceHash=changedOrder.positions[i].sourceHash;}
 response.positions[0].metadata.form='PRIVATE_PRODUCER_METADATA_SENTINEL';response.positions[0].metadata.inventions=['PRIVATE_FINDING_SENTINEL'];
 const records=createProductionRecords(changedOrder,response),stored=f().production.loadOrder(pilot.order.orderId);
 const fake={findRecord:ref=>records.find(r=>r.caseId===ref.caseId),loadOrder:()=>({...stored,order:changedOrder})};
 const changed=buildReaderInputs({production:fake,references:records.map(revisionReference)}),other=createReaderJob(changed,{jobId:pkg.job.jobId,itemIds:pkg.job.items.map(i=>i.itemId)});
 assert.deepEqual([...other.files],[...pkg.files]);assert.equal(changed.entries[0].binding.publicInputHash,inputs.entries[0].binding.publicInputHash);
 assert.notEqual(changed.entries[0].binding.sourceBinding,inputs.entries[0].binding.sourceBinding);
 // No promotion of old F01 checks into F02-B.
 assert.ok(Object.values(records[0].checkpoint.checks).every(c=>c.status==='UNCERTAIN'));
});

test('actual title, map, names, series order, context and method are bound; editorial.context is not actual context',()=>{
 const {inputs,production,references}=f();
 assert.deepEqual(inputs.entries[0].input.seriesContext,{version:1,episodes:[]});
 const context={version:1,episodes:[references[1],references[2]]},series=buildReaderInputs({production,references:[references[0]],context});
 assert.notEqual(series.entries[0].binding.sourceBinding,inputs.entries[0].binding.sourceBinding);
 assert.notEqual(series.entries[0].binding.publicInputHash,inputs.entries[0].binding.publicInputHash);
 const reverse=buildReaderInputs({production,references:[references[0]],context:{version:1,episodes:[...context.episodes].reverse()}});
 assert.notEqual(series.entries[0].binding.contextHash,reverse.entries[0].binding.contextHash);
 for(const field of ['presentation','chart']){
  const changed=copy(inputs.entries[0].input);if(field==='presentation')changed.presentation.title+=' 🧭';else changed.chart.objectNames[Object.keys(changed.chart.objectNames)[0]]+=' neu';
  assert.notEqual(hash(changed),inputs.entries[0].binding.publicInputHash);
 }
 assert.notEqual(hash({methodHash:METHOD_HASH}),hash({methodHash:'new-method'}));
});

test('whole-field pinned units cover Unicode, emoji, abbreviations, line breaks and multi-sentence QA without loss',()=>{
 const presentation={title:'ÄÖÜ 🧭',intro:['Dr. Sam\nfragt: Wohin?\n„Da!“'],clues:[{id:'H1',text:'Frage?\nAntwort: z. B. südöstlich. 🏴‍☠️'}]},context={version:1,episodes:[{presentation}]};
 const units=textUnits(presentation,context);assert.equal(units.length,6);
 for(const u of units){assert.equal(u.start,0);assert.equal(u.end,u.text.length);assert.equal(u.text.slice(u.start,u.end),u.text);}
 assert.deepEqual(units,textUnits(presentation,context));
});

test('closed reader contract rejects missing, duplicate, foreign units/claims, dangling refs, hidden atoms and unknown fields',()=>{
 const {pkg,reader}=f(),item=pkg.job.items[0],good=reader.items[0];assert.equal(validateReaderItem(item,good),good);
 const mutations=[r=>r.coverage.pop(),r=>r.coverage.push(copy(r.coverage[0])),r=>r.coverage[0].unitId='foreign',
  r=>r.claims.push(copy(r.claims[0])),r=>r.claims[0].unitIds=['foreign'],r=>r.coverage[0].claimIds=['foreign'],
  r=>r.coverage[0].claimIds=[],r=>r.claims[0].clueId='foreign',r=>r.interpretations.pop(),r=>r.interpretations[0].claimIds=[],
  r=>r.qualified=true,r=>r.claims[0].confidence=1,r=>r.claims[0].atoms=[copy(good.claims.find(c=>c.atoms.length).atoms[0])],
  r=>r.claims.find(c=>c.atoms.length).atoms[0].placeId='foreign',r=>r.inputHash='0'.repeat(64),
  r=>r.claims[0].kind='potential'];
 for(const mutate of mutations){const bad=copy(good);mutate(bad);assert.throws(()=>validateReaderItem(item,bad));}
 const badEnvelope=copy(reader);badEnvelope.items.push(copy(reader.items[0]));assert.throws(()=>validateEnvelope(pkg.job,badEnvelope),/duplicate/);
 for(const raw of ['{"a":1,"a":2}','{"a":1,"\\u0061":2}','{"items":[{"x":0,"x":1}]}'])assert.throws(()=>parseQualityResponse(Buffer.from(raw)),/duplicate JSON key/);
 assert.throws(()=>parseQualityResponse(Buffer.from([0xff])),/encoded data/);assert.deepEqual(parseQualityResponse(Buffer.from('{"a":[{},"ä\\\"",1,true,null]}')),{a:[{},'ä"',1,true,null]});
});

test('unrepresentable additional condition stays explicit; formal coverage alone never qualifies',()=>{
 const {pkg,reader}=f(),item=pkg.job.items[0],response=copy(reader.items[0]),c=response.claims.find(c=>c.clueId==='H4');
 c.state='unresolved';c.atoms=[];c.kind='ambiguous';c.meaning='TECHNICAL: disjunction cannot safely be expressed';
 validateReaderItem(item,response);const comparison=compareReaderItem(item,response,f().inputs.entries[0].originals);
 assert.equal(comparison.clues.find(c=>c.clueId==='H4').result,'incomparable');
 assert.equal(qualify(item,response,comparison,null).qualified,false);
});

function realCompare(original,atoms,options){const p=f().inputs.entries[0].input.chart;return compareClue({...p,original,atoms},options);}
test('isolated joint conjunction detects equivalence, weakening, strengthening, change and validates both witness directions',()=>{
 const originals=f().inputs.entries[0].originals,h4=originals.find(c=>c.id==='H4');
 const distances=[1,2].map((hour,i)=>({id:'A'+i,type:'distanceToPlace',hour,placeId:h4.placeId,distance:h4.distance}));
 const equivalent=realCompare(h4,distances);assert.equal(equivalent.result,'equivalent');assert.equal(equivalent.scope.legalRoutes,1170);
 assert.equal(equivalent.proof,'joint-conjunction-engine-enumeration');
 assert.equal(realCompare(h4,[distances[0]]).result,'weakened');
 const strengthened=originals.map(c=>realCompare(h4,[h4,c])).find(c=>c.result==='strengthened');assert.ok(strengthened);assert.ok(strengthened.counts.originalOnly>0);
 const changed=realCompare(h4,[{...h4,count:1}]);assert.equal(changed.result,'changed');assert.equal(changed.counts.originalOnly,82);assert.equal(changed.counts.interpretationOnly,333);
 const rules=createRules(f().inputs.entries[0].input.chart);
 for(const [key,witnesses] of Object.entries(changed.witnesses))for(const witness of witnesses){assert.ok(rules.legal(witness.route));assert.equal(rules.matches(witness.route,h4),witness.original);assert.equal(rules.matches(witness.route,{...h4,count:1}),witness.interpretation);assert.notEqual(witness.original,witness.interpretation);}
 assert.deepEqual(realCompare(h4,[h4]),realCompare(h4,[{...h4,id:'another-id'}]));
 const first=realCompare(h4,[h4]);const changedOthers=copy(originals);changedOthers[0].distance=1;
 assert.deepEqual(first,realCompare(changedOthers.find(c=>c.id==='H4'),[h4]));
});

test('safe zero/all normalization stays inside a clue, includes hour zero and ignores atom IDs',()=>{
 const a={id:'x',type:'countDistanceToPlace',placeId:'geo-01',distance:1,fromHour:0,toHour:1,count:0},b={...a,id:'y',fromHour:2,toHour:3};
 assert.deepEqual(normalForm([a,b]),[{type:a.type,placeId:a.placeId,distance:1,fromHour:0,toHour:3,count:0}]);
 assert.deepEqual(normalForm([a,a]),normalForm([a]));assert.equal(realCompare({...a,toHour:3},[a,b]).result,'equivalent');
 const startDistance=createRules(f().inputs.entries[0].input.chart).distanceToPlace(f().inputs.entries[0].input.chart.start,a.placeId);
 const zero={...a,distance:startDistance};assert.notEqual(realCompare(zero,[{...zero,fromHour:1}]).result,'equivalent');
});

test('all six existing forms, whole multihex areas and geometric distances use engine semantics',()=>{
 const chart=f().inputs.entries[0].input.chart,rules=createRules(chart),route=rules.routes().next().value;
 const multi=chart.map.objects.find(o=>o.cells.length>1);
 const atoms=[{id:'p',type:'position',hour:1,cell:route[1]},
 {id:'d',type:'direction',hour:1,direction:direction(route[0],route[1])},{id:'t',type:'turn',hour:2,degrees:60},
 {id:'a',type:'distanceToPlace',hour:0,placeId:multi.id,distance:rules.distanceToPlace(chart.start,multi.id)},
 {id:'b',type:'distanceBetweenHours',hours:[0,2],distance:1},
 {id:'c',type:'countDistanceToPlace',fromHour:0,toHour:1,placeId:multi.id,distance:0,count:0}];
 assert.equal(new Set(atoms.map(c=>c.type)).size,6);
 for(const original of atoms)assert.equal(compareClue({...chart,original,atoms:[original]}).result,'equivalent');
 const allCells=multi.cells;assert.equal(rules.distanceToPlace(allCells.at(-1),multi.id),0);
 const p3=f().inputs.entries[2],directionClue=p3.originals.find(c=>c.id==='H4'),rr=createRules(p3.input.chart),first=[...rr.routes()].find(r=>rr.matches(r,directionClue));
 const position={id:'p',type:'position',hour:1,cell:first[1]};assert.equal(compareClue({...p3.input.chart,original:directionClue,atoms:[position]}).result,'equivalent');
 // The independently required deduction-disclosure check must still reject a disclosed position.
 assert.ok(qualify(p3,{}, {clues:[]},null).reasons.includes('review-missing'));
});

test('budget exhaustion and empty legal bases never assert equivalence or unproved inclusion',()=>{
 const h4=f().inputs.entries[0].originals.find(c=>c.id==='H4');
 assert.notEqual(realCompare(h4,[h4],{maxNodes:1}).result,'equivalent');
 const partial=realCompare(h4,[{...h4,count:1}],{maxNodes:100});assert.equal(partial.scope.enumerationComplete,false);
 assert.ok(!['weakened','strengthened','equivalent','changed'].includes(partial.result));
 for(const w of [...partial.witnesses.originalOnly,...partial.witnesses.interpretationOnly])assert.ok(createRules(f().inputs.entries[0].input.chart).legal(w.route));
 const chart=copy(f().inputs.entries[0].input.chart);chart.start='A1';chart.map.objects=[{id:'start',cells:['A1'],passable:true},{id:'wall',cells:['B1','A2','B2'],passable:false}];chart.steps=2;
 const c={id:'H1',type:'position',hour:0,cell:'A1'},empty=compareClue({...chart,original:c,atoms:[c]});assert.equal(empty.scope.emptyBase,true);assert.equal(empty.result,'incomparable');
 assert.throws(()=>compareClue({...chart,original:c,atoms:[{...c,hour:6}]}));
});


test('exported kind/state/atom variants match runtime acceptance, including pilot-invalid combinations',()=>{
 const {pkg,reader}=f(),job=pkg.job,item=job.items[0],good=reader.items[0],schema=responseSchema('reader',job);
 const index=good.claims.findIndex(c=>c.state==='formalized');
 for(const kind of ['mathematical','potential','narrative','invention','ambiguous','interaction'])for(const state of ['formalized','unresolved','narrative'])for(const atoms of [[],good.claims[index].atoms]){
  const r=copy(good);Object.assign(r.claims[index],{kind,state,atoms:copy(atoms)});
  const expected=state==='formalized'?kind==='mathematical'&&atoms.length>0:atoms.length===0&&(state==='unresolved'||['narrative','invention'].includes(kind));
  const envelope={...copy(reader),items:[r]};assert.equal(schemaErrors(envelope,schema).length===0,expected,kind+'/'+state+'/'+atoms.length);
  if(expected)assert.doesNotThrow(()=>validateReaderItem(item,r));else assert.throws(()=>validateReaderItem(item,r));
 }
});

test('job-bound reply schema exposes reference namespaces and complete required slots; templates remain invalid work',()=>{
 const {pkg,inputs,reader}=f();
 assert.ok(schemaErrors(JSON.parse(pkg.files.get('response-template.json')),JSON.parse(pkg.files.get('response.schema.json'))).length);
 const comparisons=reader.items.map((r,i)=>compareReaderItem(pkg.job.items[i],r,inputs.entries[i].originals));
 // Build an independent reviewer job through the public factory, with no inferred result defaults.
 const review=createReviewerJob({readerJob:pkg.job,readerSidecar:pkg.sidecar,readerResults:reader.items,comparisons,originals:inputs.entries.map(e=>e.originals),files:pkg.files});
 const response=technicalReviewer(review.job),schema=JSON.parse(review.files.get('response.schema.json'));
 assert.deepEqual(schemaErrors(response,schema),[]);
 const template=JSON.parse(review.files.get('response-template.json'));assert.ok(schemaErrors(template,schema).length);
 assert.equal(template.items[0].coverage.length,review.job.items[0].input.public.units.length);
 assert.equal(template.items[0].checks.length,13);assert.equal(template.items[0].claims.length,reader.items[0].claims.length);
 assert.ok(template.items[0].checks.every(c=>c.conclusion===null));
 const bad=copy(response),r=bad.items[0],unit=review.job.items[0].input.public.units[0].id;
 r.findings=[{id:'F1',severity:'ADVISORY',requirement:'Technical namespace regression',unitIds:[unit],factRefs:['public.rules'],rationale:'Technical double',claimIds:[],method:'technical-test',evidenceRefs:[unit],repairTarget:null}];
 assert.ok(schemaErrors(bad,schema).length);assert.throws(()=>validateReviewerItem(review.job.items[0],r));
 r.findings[0].evidenceRefs=['reader'];assert.deepEqual(schemaErrors(bad,schema),[]);validateReviewerItem(review.job.items[0],r);
 r.inputHash='0'.repeat(64);assert.ok(schemaErrors(bad,schema).length);
});

test('multi-hint Reader reasoning requires independent supported source-bound approval; narrative math and disclosure stay blocked',()=>{
 const {pkg,inputs,reader}=f(),publicItem=copy(pkg.job.items[0]),r=copy(reader.items[0]);
 const hints=r.claims.filter(c=>c.clueId!==null).slice(0,2),extra={id:'cross',unitIds:hints.flatMap(c=>c.unitIds),kind:'mathematical',meaning:'TECHNICAL Reader conjunction, not a new player statement',clueId:null,state:'formalized',atoms:hints.flatMap(c=>copy(c.atoms))};
 r.claims.push(extra);for(const u of extra.unitIds)r.coverage.find(c=>c.unitId===u).claimIds.push(extra.id);
 validateReaderItem(publicItem,r);
 const comparison=compareReaderItem(publicItem,r,inputs.entries[0].originals),reviewJob=createReviewerJob({readerJob:{...pkg.job,items:[publicItem]},readerSidecar:{...pkg.sidecar,items:[pkg.sidecar.items[0]]},readerResults:[r],comparisons:[comparison],originals:[inputs.entries[0].originals],files:pkg.files});
 const item=reviewJob.job.items[0],review=technicalReviewer(reviewJob.job).items[0],claim=review.claims.find(c=>c.claimId==='cross');claim.unitIds=extra.unitIds;claim.factRefs=hints.map(c=>'original.'+c.clueId);
 validateReviewerItem(item,review);assert.equal(qualify(item,r,comparison,review).qualified,true);
 for(const mutate of [
  v=>{v.checks.find(c=>c.area==='deduction-disclosure').conclusion='error';},
  v=>{v.checks.find(c=>c.area==='additional-information').conclusion='uncertain';},
  v=>{v.clues[0].informationBoundary='deduction';},
  v=>{v.claims.find(c=>c.claimId==='cross').factRefs.pop();},
  v=>{v.claims.find(c=>c.claimId==='cross').disposition='unresolved';}
 ]){const changed=copy(review);mutate(changed);assert.equal(qualify(item,r,comparison,changed).qualified,false);}
 for(const field of ['title','intro.0','series.0.clues.H1']){
  const changed=copy(item),source=copy(r);changed.input.public.units.push({id:'outside',field,start:0,end:1,text:'X'});source.claims.find(c=>c.id==='cross').unitIds.push('outside');
  assert.ok(qualify(changed,source,comparison,review).reasons.includes('additional-mathematics:cross'));
 }
 // Intro mathematics still needs authority even if a Reader supplies an outer clue ID.
 const withIntro=copy(r),ordinary=withIntro.claims.find(c=>c.id===hints[0].id),intro=publicItem.input.units.find(u=>u.field==='intro.0');
 ordinary.unitIds.push(intro.id);withIntro.coverage.find(c=>c.unitId===intro.id).claimIds.push(ordinary.id);
 validateReaderItem(publicItem,withIntro);
 assert.ok(qualify(item,withIntro,comparison,review).reasons.includes('additional-mathematics:'+ordinary.id));
 // An unrelated uncertain area does not relabel a supported inference as extra text;
 // it independently keeps the overall result blocked.
 const otherIssue=copy(review);otherIssue.checks.find(c=>c.area==='ambiguity').conclusion='uncertain';
 const blocked=qualify(item,r,comparison,otherIssue);assert.equal(blocked.qualified,false);
 assert.ok(!blocked.reasons.includes('additional-mathematics:cross'));
 const single=copy(r);single.claims.find(c=>c.id==='cross').unitIds=hints[0].unitIds;
 assert.ok(qualify(item,single,comparison,review).reasons.includes('additional-mathematics:cross'));
 const unresolved=copy(r);unresolved.claims.find(c=>c.id==='cross').state='unresolved';unresolved.claims.find(c=>c.id==='cross').atoms=[];
 assert.equal(qualify(item,unresolved,comparison,review).qualified,false);
});
