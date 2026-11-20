import {createCellRegistry} from '../../src/ui/cell-registry.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBetaStore,puzzleIdentity,recordId,PREFIX} from '../../src/beta/storage.mjs';
import {createActiveClock,IDLE_MS} from '../../src/beta/clock.mjs';
import {resultMessage} from '../../src/beta/result-dialog.mjs';
function setup(){const data=new Map(),errors=[];let id=0;const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),key:i=>[...data.keys()][i],get length(){return data.size;}};const options={storage,report:e=>errors.push(e),now:()=> '2026-11-20T12:00:00.000Z',newId:()=>String(++id)};return {data,errors,storage,options,store:createBetaStore(options)};}
const puzzle={id:'one',schemaVersion:2,dataVersion:1,rulesVersion:'gezeitenkarten/1',identity:{variantId:'var-one',sourcePublicationId:'pub-one'}};
const identity=puzzleIdentity(puzzle,'regular');
test('identity binds versions and F02 identities without a second hash function',()=>{
 const identities=[identity,puzzleIdentity({...puzzle,dataVersion:2},'regular'),puzzleIdentity(puzzle,'b2:S01'),puzzleIdentity({...puzzle,identity:{...puzzle.identity,sourcePublicationId:'pub-two'}},'regular'),puzzleIdentity({...puzzle,identity:{...puzzle.identity,variantId:'var-two'}},'regular')];
 assert.equal(new Set(identities.map(recordId)).size,5);assert.equal(identity.sourcePublicationId,'pub-one');
});
test('solved evidence, feedback and phase history survive replay and game reset',()=>{
 const {store,storage,options}=setup();store.start(identity,'One');store.phaseUpdate(identity,(p,r)=>{p.status='solved';p.activeMs=123;p.hints=2;r.solvedAt='yesterday';});store.feedback(identity,{difficulty:'hard',comment:'First'},'One');
 storage.setItem('gezeitenkarten-one-schema2-data1','reset');
 store.start(identity,'One',{replay:true});store.feedback(identity,{comment:'Second'},'One');
 const r=createBetaStore(options).get(identity);assert.equal(r.solvedAt,'yesterday');assert.equal(r.phases.length,2);assert.equal(r.phases[0].feedbackAtEnd.comment,'First');assert.equal(r.phases[0].activeMs,123);assert.equal(r.feedback.comment,'Second');assert.equal(r.feedback.difficulty,null);
});
test('ordinary reopening creates no new phase and giving feedback alone does not start a puzzle',()=>{
 const {store}=setup();store.feedback(identity,{comment:'Unsolved'},'One');assert.equal(store.get(identity).phases.length,0);store.start(identity,'One');store.start(identity,'One');assert.equal(store.get(identity).phases.length,1);
 store.feedback(identity,{status:'abandoned'},'One');assert.equal(store.get(identity).phases[0].status,'abandoned');store.start(identity,'One');assert.equal(store.get(identity).phases[0].status,'abandoned');
});
test('export keeps removed puzzles, versions and a stable tester; excludes game routes',()=>{
 const {store,storage,options}=setup();storage.setItem('gezeitenkarten-game',JSON.stringify({route:['SECRET']}));store.start(identity,'Removed');store.feedback(identity,{comment:'Old'});store.start(puzzleIdentity({...puzzle,dataVersion:2},'regular'),'Revised');
 const first=store.exportData({version:'0.1.0'}),second=createBetaStore(options).exportData({version:'0.1.0'});assert.equal(first.testerId,second.testerId);assert.equal(first.puzzles.length,2);assert.deepEqual(first,second);assert.ok(!JSON.stringify(first).includes('SECRET'));assert.deepEqual(Object.keys(first),['feedbackSchemaVersion','exportedAt','testerId','application','puzzles','generalFeedback']);
});
test('general-only and empty exports are valid; latest fields from concurrent store instances are retained',()=>{
 const {store,options}=setup();assert.equal(store.exportData({}).puzzles.length,0);store.setGeneral('Phone feedback');const other=createBetaStore(options);assert.equal(other.exportData({}).generalFeedback.comment,'Phone feedback');store.start(identity,'One');other.feedback(identity,{comment:'From another tab'});store.phaseUpdate(identity,p=>p.activeMs+=1000);assert.equal(store.get(identity).feedback.comment,'From another tab');
});
test('quota and denied reads report failure, retain an in-page export, and never overwrite unreadable data',()=>{
 const {store,storage,errors,options,data}=setup();storage.setItem=()=>{throw Error('QuotaExceededError');};store.setGeneral('Unsaved');store.feedback(identity,{comment:'Preserved'});assert.ok(store.hasUnsaved());assert.ok(errors.length);assert.equal(store.exportData({}).generalFeedback.comment,'Unsaved');assert.equal(store.exportData({}).puzzles[0].feedback.comment,'Preserved');
 let writes=0;const broken=createBetaStore({...options,storage:{getItem(){throw Error('SecurityError');},setItem(){writes++;},length:0}});broken.setGeneral('Local');assert.equal(writes,0);
 data.set(PREFIX+'general','{');const corrupt=createBetaStore(options);corrupt.setGeneral('Safe');assert.equal(data.get(PREFIX+'general'),'{');
});
test('monotonic active time pauses for background, manual pause, inactivity, sleep and loss of ownership',()=>{
 let time=0,total=0;const clock=createActiveClock({now:()=>time,add:ms=>total+=ms});const step=n=>{time+=n;clock.tick();};clock.set({owner:true});step(5000);assert.equal(total,5000);
 clock.set({visible:false});step(5000);assert.equal(total,5000);clock.set({visible:true});clock.activity();step(1000);assert.equal(total,6000);
 clock.set({paused:true});step(5000);assert.equal(total,6000);clock.set({paused:false});step(1000);assert.equal(total,7000);
 clock.set({owner:false});step(5000);assert.equal(total,7000);clock.set({owner:true});clock.activity();
 for(let i=0;i<IDLE_MS/5000;i++)step(5000);assert.equal(clock.reason,'idle');const idle=total;step(5000);assert.equal(total,idle);
 clock.activity();step(1000);assert.equal(total,idle+1000);step(60000);assert.equal(total,idle+1000);
 clock.set({open:false});step(1000);assert.equal(clock.reason,'ended');assert.equal(total,idle+1000);
});
test('time reload only adds new deltas and each optional result text has an independent fallback',()=>{
 let time=0,total=0;let clock=createActiveClock({now:()=>time,add:n=>total+=n});clock.set({owner:true});time=2000;clock.tick();clock.set({owner:false});clock=createActiveClock({now:()=>time,add:n=>total+=n});clock.set({owner:true});time=4000;clock.tick();assert.equal(total,4000);
 assert.equal(resultMessage({resultTexts:{correct:'Custom'}},true),'Custom');assert.match(resultMessage({resultTexts:{correct:'Custom'}},false),/Hinweisen/);assert.equal(resultMessage({resultTexts:{incorrect:'Custom'}},false),'Custom');assert.match(resultMessage({},true),/rekonstruiert/);
});

test('cell registry replaces both list and lookup when rule cell sets change',()=>{
 let {cells,byId}=createCellRegistry({cells:['A1','B2']});assert.deepEqual(cells.map(c=>c.id),Object.keys(byId));
 ({cells,byId}=createCellRegistry({cells:['C3']}));assert.deepEqual(cells,[{q:2,r:2,id:'C3'}]);assert.equal(byId.A1,undefined);assert.equal(byId.C3,cells[0]);
});
test('a new phase never counts old saved help usage twice',()=>{
 const {store}=setup();store.start(identity,'One',{counters:{hints:2,noteChecks:1,penaltyPoints:25}});store.start(identity,'One',{replay:true,counters:{hints:2,noteChecks:1,penaltyPoints:25}});const r=store.get(identity);assert.equal(r.phases[0].hints,2);assert.equal(r.phases[1].hints,0);assert.equal(r.phases[1].penaltyPoints,0);
});
