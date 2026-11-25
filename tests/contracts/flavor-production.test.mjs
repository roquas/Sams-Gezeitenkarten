import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {productionFixture,technicalResponse} from '../fixtures/flavor-production.mjs';
import {createProductionPosition,createProductionOrder,validateProductionResponse,createProductionRecords,materializeFlavorRevision,prepareBetaEditorial,contentHash,json} from '../../scripts/lib/flavor-production.mjs';
import {loadWorldPackage,createProductionPackage,packageInventory,verifyProductionPackage,ROOT} from '../../scripts/lib/flavor-production-package.mjs';
import {createFlavorDraft,createFlavorCheckpoint} from '../../scripts/lib/flavor-contract.mjs';
import {openCardLibrary} from '../../scripts/lib/card-library.mjs';
import {flavorFixture} from '../fixtures/flavor/public.mjs';
import {mapFingerprint} from '../../scripts/lib/publication-archive.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {distance,directions} from '../../src/engine/hex.mjs';
import {buildCommunityBeta} from '../../scripts/community-beta.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
import {classifyChanges} from '../../scripts/ci-changes.mjs';
const copy=structuredClone;
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));

test('real pilot has four pinned cards, all names and 23 unchanged ordered clues; free prose stays UNCERTAIN',()=>{
 const {order}=productionFixture(),records=createProductionRecords(order,technicalResponse(order));
 assert.deepEqual(order.positions.map(p=>p.caseId),['C-06','C-02','C-03','C-11']);
 assert.equal(new Set(order.positions.map(p=>p.cardRef)).size,4);
 assert.deepEqual(order.positions.map(p=>p.request.source.logic.clues.length),[6,7,6,4]);
 const starts=order.positions.map(p=>{const o=p.card.map.objects.find(o=>o.cells.includes(p.request.source.logic.start));return p.card.objectNames[o.id];});
 assert.deepEqual(starts,['Tangruh','Gelbpunkt','Treibkahn','Nebellicht']);
 const cases=read('content/community-beta/s04-c-v1/cases.json').cases;
 for(const [i,p] of order.positions.entries()){
  assert.deepEqual(p.request.source.logic.clues,cases.find(r=>r.id===p.caseId).definition.logic.clues);
  assert.equal(p.request.source.logic.start,cases.find(r=>r.id===p.caseId).definition.logic.start);
  assert.deepEqual(Object.keys(p.card.objectNames).sort(),p.card.map.objects.map(o=>o.id).sort());
  const start=p.card.map.objects.find(o=>o.cells.includes(p.request.source.logic.start));
  assert.equal(records[i].draft.presentation.objectNames[start.id],undefined);
  assert.deepEqual(records[i].checkpoint,createFlavorCheckpoint(p.request,records[i].draft));
  assert.ok(Object.values(records[i].checkpoint.checks).every(c=>c.status==='UNCERTAIN'));
 }
});

const responseMutations=[
 ['missing position',r=>r.positions.pop()],['duplicate position',r=>r.positions[1]=copy(r.positions[0])],
 ['foreign position',r=>r.positions[0].positionId='foreign'],['reordered positions',r=>r.positions.reverse()],
 ['wrong order',r=>r.orderId='flavor-order-'+'0'.repeat(64)],
 ...['caseId','puzzleId','cardRef','sourceHash','flavorVariantId','revision','predecessor'].map(key=>['wrong '+key,r=>{
  const p=r.positions[0];p[key]=key==='revision'?2:key==='predecessor'?{}:key==='sourceHash'?'0'.repeat(64):key==='cardRef'?'gk-illustrated-card-v1-sha256:'+'0'.repeat(64):'foreign';}]),
 ['missing clue',r=>r.positions[0].clues.pop()],['duplicate clue',r=>r.positions[0].clues[1]=copy(r.positions[0].clues[0])],
 ['foreign clue',r=>r.positions[0].clues[0].id='foreign'],['reordered clues',r=>r.positions[0].clues.reverse()],
 ...['request','manifest','solution','logic','objectNames','start','assetPlacements','evidence','checks','semanticReview','hints','resultTexts'].map(key=>['injected '+key,r=>r.positions[0][key]={}]),
 ['returned manifest',r=>r.manifest={}],['returned request',r=>r.request={}],['returned names',r=>r.positions[0].metadata.objectNames={}]
];
for(const [label,mutate] of responseMutations)test('strict result rejects '+label,()=>{
 const {order}=productionFixture(),response=technicalResponse(order);mutate(response);
 assert.throws(()=>validateProductionResponse(order,response),/flavor production/);
});
test('explicit production problem is structurally valid but cannot become a partial draft batch',()=>{
 const {order}=productionFixture(),response=technicalResponse(order),p=response.positions[2];
 response.positions[2]={...Object.fromEntries(Object.entries(p).filter(([k])=>!['title','intro','clues','metadata','status'].includes(k))),status:'problem',problem:'TECHNISCHER TEST: fehlende Eingabe'};
 assert.equal(validateProductionResponse(order,response).complete,false);
 assert.throws(()=>createProductionRecords(order,response),/incomplete order.*P03/);
});

test('nested private data cannot affect any public JSON, text, SVG, image resource or inventory byte',()=>{
 const fixture=productionFixture(),lib=openCardLibrary({directory:path.join(ROOT,'content/card-library/f02a-v1')});
 const sentinel='PRIVATE_SENTINEL_DO_NOT_EXPORT',positions=[];
 for(const p of fixture.order.positions){
  const card=lib.load(p.cardRef),document=copy(p.request.source);
  // Private fields at every object level, plus compiled fields and arbitrary old
  // presentation text, must not even affect the public content hash.
  document.solution=[sentinel];document.analysis={solutions:[[sentinel]]};document.metadata={secret:sentinel};
  document.presentation={title:sentinel,hints:[sentinel],resultTexts:{correct:sentinel}};document.resultTexts={correct:sentinel};
  document.logic.private={secret:sentinel};document.logic.map.secret={url:sentinel};document.logic.map.grid.secret=sentinel;
  document.logic.map.objects.forEach(o=>o.private={nested:[sentinel]});document.logic.clues.forEach(c=>c.secret={nested:[sentinel]});
  card.origin={private:sentinel};card.naming.secret={private:sentinel};card.resources.private=sentinel;
  card.map.objects.forEach(o=>o.private=sentinel);card.assetPlacements.forEach(p=>p.private={href:sentinel});
  positions.push(createProductionPosition({positionId:p.positionId,caseId:p.caseId,document,card,assetLibrary:fixture.releases.get(p.cardRef).catalog.library,intent:p.intent}));
 }
 const poisoned=createProductionPackage({...fixture,positions});
 assert.equal(poisoned.order.orderId,fixture.order.orderId);
 assert.deepEqual(packageInventory(poisoned.files),packageInventory(fixture.files));
 for(const [name,bytes] of poisoned.files){assert.equal(Buffer.from(bytes).includes(Buffer.from(sentinel)),false,name);assert.deepEqual(Buffer.from(bytes),Buffer.from(fixture.files.get(name)),name);}
 for(const p of fixture.order.positions){
  for(const secret of [p.request.source.solution,p.request.source.analysis,p.request.source.metadata])assert.equal(secret,undefined);
 }
 const all=JSON.stringify([...poisoned.files].filter(([p])=>!p.startsWith('resources/')));
 assert.doesNotMatch(all,/candidateId|archiveCommit|gk-instance-v2|gk-variant-v2|cardIntegritySha256|\/Users\//);
});

test('one saved card supports different puzzle starts without storing a start; multihex distance uses entire area',()=>{
 const f=productionFixture(),p=f.order.positions[0],lib=openCardLibrary({directory:path.join(ROOT,'content/card-library/f02a-v1')}),card=lib.load(p.cardRef);
 const document=copy(p.request.source),newStart=card.map.objects.find(o=>o.passable&&!o.cells.includes(document.logic.start)).cells[0];
 document.logic.start=newStart;
 const changed=createProductionPosition({positionId:p.positionId,caseId:p.caseId,document,card,assetLibrary:f.releases.get(p.cardRef).catalog.library,intent:p.intent});
 assert.equal(changed.cardRef,p.cardRef);assert.notEqual(changed.sourceHash,p.sourceHash);assert.equal(card.start,undefined);
 const source=flavorFixture();source.logic.map.objects.push({id:'single',cells:['E5'],passable:true});
 source.presentation.objectNames.single='Einzel';
 source.logic.map.objects.sort((a,b)=>a.id.localeCompare(b.id));
 const fakeCard={key:p.cardRef,map:source.logic.map,mapFingerprint:mapFingerprint(source.logic.map),background:source.presentation.background,assetPlacements:[],naming:{objectNames:source.presentation.objectNames}};
 const multi=createProductionPosition({caseId:'TEST',positionId:'TEST',document:source,card:fakeCard,intent:p.intent});
 assert.equal(multi.request.source.logic.start,'C3');assert.deepEqual(multi.card.map.objects[0].cells,['C3','D3']);
 assert.equal(createFlavorDraft(multi.request).presentation.objectNames.port,undefined);
 assert.equal(createRules(source.logic).distanceToPlace('E3','port'),1);assert.equal(distance('E3',source.logic.start),2);
 fakeCard.map.objects=fakeCard.map.objects.filter(o=>o.id!=='single');source.logic.map=fakeCard.map;delete source.presentation.objectNames.single;fakeCard.mapFingerprint=mapFingerprint(fakeCard.map);
 assert.throws(()=>createProductionPosition({caseId:'TEST',positionId:'TEST',document:source,card:fakeCard,intent:p.intent}),/single-hex/);
});

test('materialization restores all pinned names; beta draft preserves identities and rejects implicit dataVersion/freedom to approve',()=>{
 const {order}=productionFixture(),records=createProductionRecords(order,technicalResponse(order)),before=buildCommunityBeta();
 let editorial=read('content/community-beta/s04-c-v1/editorial.json');
 for(const [i,p] of order.positions.entries()){
  const m=materializeFlavorRevision(p,records[i]);
  assert.deepEqual(m.puzzle.presentation.objectNames,p.card.objectNames);
  assert.deepEqual(m.puzzle.logic,p.request.source.logic);assert.deepEqual(m.puzzle.presentation.assetPlacements,p.card.assetPlacements);
  assert.deepEqual(m.puzzle.presentation.hints,[]);assert.equal(m.puzzle.resultTexts,undefined);
  assert.throws(()=>prepareBetaEditorial({editorial,position:p,record:records[i],dataVersion:1}),/new dataVersion/);
  editorial=prepareBetaEditorial({editorial,position:p,record:records[i],dataVersion:2});
 }
 const beta=buildCommunityBeta({editorial});
 for(const p of order.positions){
  const original=JSON.parse(before.get(p.caseId+'.json')),now=JSON.parse(beta.get(p.caseId+'.json'));
  assert.deepEqual(now.identity,original.identity);assert.deepEqual(now.puzzle.logic,original.puzzle.logic);
  assert.deepEqual(now.puzzle.presentation.assetPlacements,original.puzzle.presentation.assetPlacements);
  const e=editorial.cases.find(c=>c.id===p.caseId);assert.equal(e.status,'draft');assert.equal(e.semanticReview,null);
 }
 assert.deepEqual(buildCommunityBeta(),before);assert.throws(()=>buildCommunityBeta({editorial,release:true}),/Flavor not approved/);
 const changed=copy(records[0]);changed.draft.presentation.title+=' changed';
 assert.throws(()=>materializeFlavorRevision(order.positions[0],changed),/stale revision hash/);
 const response=technicalResponse(order);response.positions[0].title+=' changed';
 const revised=createProductionRecords(order,response)[0];
 assert.notEqual(revised.draftHash,records[0].draftHash);
 assert.notEqual(materializeFlavorRevision(order.positions[0],revised).presentationHash,materializeFlavorRevision(order.positions[0],records[0]).presentationHash);
});

test('world package binds actual files and all U entries; new package versions cannot alter old snapshots',()=>{
 const f=productionFixture(),world=loadWorldPackage();
 for(let i=1;i<=15;i++)assert.match(world.files.get('world.md').toString(),new RegExp('### U'+String(i).padStart(3,'0')+' '));
 assert.deepEqual(Object.keys(world.manifest.sourceCategories),['A','B','U','I','N']);
 const orig=path.join(ROOT,'content/flavor/handoff-20261124');
 for(const n of ['style.md','production.md'])assert.equal(sha256(world.files.get(n)),sha256(fs.readFileSync(path.join(orig,'welt-stilpaket-v1',n))));
 assert.equal(sha256(fs.readFileSync(path.join(orig,'referenzen/ploetzlich-piratin-stil-und-weltreferenz.md'))),'317602fe3759ec6fc55a32c65d85d13d4318d4b65af36871774089152664f7be');
 const next=copy(world);next.manifest.version='1.1.0';next.files.set('manifest.json',Buffer.from(json(next.manifest)));next.reference={...next.reference,version:'1.1.0',packageHash:sha256(next.files.get('manifest.json'))};
 const exported=createProductionPackage({...f,world:next});assert.notEqual(exported.order.orderId,f.order.orderId);
 assert.equal(verifyProductionPackage(f.files).world.version,'1.0.0');
 const broken=new Map(f.files);broken.set('world/world.md','changed');assert.throws(()=>verifyProductionPackage(broken),/inventory mismatch/);
});
test('all new code/data and renderer change keep the existing full CI profile',()=>{
 for(const p of ['scripts/lib/flavor-production.mjs','scripts/lib/flavor-production-store.mjs','scripts/lib/map-contact-sheet.mjs','content/flavor/world-style-v1/manifest.json','tests/contracts/flavor-production.test.mjs'])
 assert.equal(classifyChanges([{path:p,status:'A',oldMode:'000000',newMode:'100644'}]).profile,'full');
});

test('checked-in pilot is the exact reproducible public export and keeps its local origin outside the transport',async()=>{
 const {readTree,openProductionStore}=await import('../../scripts/lib/flavor-production-store.mjs');
 const f=productionFixture(),base=path.join(ROOT,'content/flavor/pilot-v1');
 const files=readTree(path.join(base,'public'));
 assert.deepEqual(packageInventory(files),packageInventory(f.files));
 const store=openProductionStore({directory:path.join(base,'local')});
 const saved=store.loadOrder(f.order.orderId);assert.deepEqual(saved.order,f.order);
 assert.equal(saved.binding.origin.positions.length,4);
 assert.equal(files.has('binding.json'),false);assert.equal(files.has('complete.json'),false);
 assert.equal(fs.readdirSync(path.join(base,'local/imports')).length,0);
});
