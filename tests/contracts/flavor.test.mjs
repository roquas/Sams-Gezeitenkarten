import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFlavorRequest,validateFlavorRequest,createFlavorDraft,validateFlavorDraft,renderControlledClue,
 checkFlavorClue,createFlavorCheckpoint,resumeFlavorCheckpoint,repairFlavorClue} from '../../scripts/lib/flavor-contract.mjs';
import {flavorFixture,alteredStatements,freeProse} from '../fixtures/flavor/public.mjs';
import {validateDefinition,compilePuzzle} from '../../src/puzzles/validate.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {definition,catalog} from '../fixtures/model/factories.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
const setup=()=>{const request=createFlavorRequest(flavorFixture());return {request,draft:createFlavorDraft(request)};};
function controlled(request,draft,statement,options={}){
 const evidence={mode:'controlled-v2',statement:structuredClone(statement),order:'time-first',...options};
 draft.evidence[statement.id]=evidence;draft.presentation.clueTexts[statement.id]=renderControlledClue(request,statement,evidence);
 return evidence;
}

for(const clue of flavorFixture().logic.clues)for(const order of ['time-first','fact-first'])test(`complete controlled ${clue.type}, ${order}`,()=>{
 const {request,draft}=setup();controlled(request,draft,clue,{order});
 assert.equal(checkFlavorClue(request,draft,clue.id).status,'PASS');
});
for(const [id,key,value] of alteredStatements)test(`reject changed ${id}.${key}=${JSON.stringify(value)}`,()=>{
 const {request,draft}=setup(),statement=structuredClone(request.source.logic.clues.find(c=>c.id===id));
 statement[key]=value;controlled(request,draft,statement);
 assert.equal(checkFlavorClue(request,draft,id).code,'changed-statement');
 assert.equal(checkFlavorClue(request,draft,id).status,'FAIL');
});
for(const text of freeProse)test(`free prose remains uncertain: ${text}`,()=>{
 const {request,draft}=setup();draft.presentation.clueTexts.count=text;
 assert.equal(checkFlavorClue(request,draft,'count').status,'UNCERTAIN');
});
for(const suffix of [' und nie am Start.',' Immer nach Osten!',' ','\n',' Genau einmal.'])test(`no uncovered extra text ${JSON.stringify(suffix)}`,()=>{
 const {request,draft}=setup();controlled(request,draft,request.source.logic.clues[0]);
 draft.presentation.clueTexts.direction+=suffix;
 assert.equal(checkFlavorClue(request,draft,'direction').status,'FAIL');
});
test('negation, exact counts, hour zero and inclusive endpoints are explicit',()=>{
 const {request,draft}=setup(),base=request.source.logic.clues.at(-1);
 for(const [fromHour,toHour,count] of [[0,0,0],[0,0,1],[0,6,0],[0,6,7],[2,5,2]]){
  const statement={...base,fromHour,toHour,count};
  request.source.logic.clues=[statement];
  const document={...request.source,presentation:{...request.source.presentation,clueTexts:{count:'Test'},cluePlaceRefs:{}}};
  const next=createFlavorRequest(document),output=createFlavorDraft(next);
  controlled(next,output,statement);
  const text=output.presentation.clueTexts.count;
  assert.match(text,new RegExp(`Von Stunde ${fromHour} bis einschließlich Stunde ${toHour}`));
  assert.match(text,new RegExp(`in genau ${count} dieser Stunden gleich 1`));
  if(count===0)assert.match(text,/in keiner dieser Stunden/);
  assert.equal(checkFlavorClue(next,output,'count').status,'PASS');
 }
});
test('start retains its pinned name on single and multihex objects and across different starts',()=>{
 const source=flavorFixture(),before=structuredClone(source),request=createFlavorRequest(source),draft=createFlavorDraft(request);
 assert.equal(draft.contractVersion,2);assert.deepEqual(draft.presentation.objectNames,request.source.presentation.objectNames);
 assert.equal(draft.presentation.objectNames.port,'Alter Hafen');assert.deepEqual(source,before);
 const statement={id:'start-ref',type:'distanceToPlace',hour:0,placeId:'port',distance:0};
 assert.match(renderControlledClue(request,statement),/gesamten Fläche von "Alter Hafen" \[port\]/);
 assert.throws(()=>renderControlledClue(request,statement,{startAlias:'Start'}),/obsolete/);
 source.logic.map.objects[0].cells=['C3'];const single=createFlavorRequest(source);
 assert.match(renderControlledClue(single,statement),/"Alter Hafen" \[port\]/);
 const other=structuredClone(source);other.logic.map.objects.push({id:'boat',cells:['E5'],passable:true});other.presentation.objectNames.boat='Kahn';
 const first=createFlavorDraft(createFlavorRequest(other));other.logic.start='E5';
 const second=createFlavorDraft(createFlavorRequest(other));assert.deepEqual(first.presentation.objectNames,second.presentation.objectNames);
 const missing=structuredClone(draft);delete missing.presentation.objectNames.port;
 assert.throws(()=>validateFlavorDraft(request,missing),/all pinned names/);
 draft.presentation.objectNames.port='Piratenhafen';assert.throws(()=>validateFlavorDraft(request,draft),/all pinned names/);
});
test('archived v1 proofs remain readable; repairing them creates a complete-name v2 draft without rewriting old text',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('../fixtures/flavor/archived-v1.json',import.meta.url),'utf8'));
 const before=structuredClone(old);assert.deepEqual(resumeFlavorCheckpoint(old.request,old.checkpoint).pendingClueIds,[]);
 assert.equal(old.checkpoint.draft.presentation.objectNames.port,undefined);
 const statement=old.request.source.logic.clues.find(c=>c.id==='start_ref');
 const evidence={mode:'controlled-v2',statement,order:'time-first'};
 const updated=repairFlavorClue(old.request,old.checkpoint,{clueId:statement.id,expectedRevision:1,text:renderControlledClue(old.request,statement),evidence});
 assert.equal(updated.contractVersion,2);assert.equal(updated.draft.revision,2);
 assert.deepEqual(updated.draft.presentation.objectNames,old.request.source.presentation.objectNames);
 assert.equal(updated.checks.start_ref.method,'flavor-check-v2');assert.equal(updated.checks.start_ref.status,'PASS');
 for(const c of old.request.source.logic.clues.filter(c=>c.id!=='start_ref')){
  assert.equal(updated.draft.presentation.clueTexts[c.id],old.checkpoint.draft.presentation.clueTexts[c.id]);
  assert.equal(updated.checks[c.id].status,'UNCERTAIN');
 }
 assert.deepEqual(old,before);
});
test('names and references bind IDs; duplicates, unknowns and renaming fail',()=>{
 for(const mutate of [
  d=>{d.presentation.objectNames.shore='Neuer Name';},
  d=>{d.presentation.objectNames.unknown='Ort';},
  d=>{delete d.presentation.clueTexts.count;},d=>{d.presentation.clueTexts.extra='Text';},
  d=>{d.presentation.cluePlaceRefs.count=['missing'];},d=>{d.presentation.cluePlaceRefs.count=['shore','shore'];},
  d=>{d.evidence.extra={mode:'free'};}
 ]){const {request,draft}=setup();mutate(draft);assert.throws(()=>validateFlavorDraft(request,draft));}
});
test('invalid statements, extra predicates and unsupported contract versions fail closed',()=>{
 for(const mutate of [
  d=>{d.contractVersion=3;},d=>{d.presentation.logic={};},d=>{d.evidence.count.statement.extra='never north';},
  d=>{d.evidence.count.statement.count=8;},d=>{d.evidence.count.statement.toHour=7;},
  d=>{d.evidence.count.statement.fromHour=6;d.evidence.count.statement.toHour=0;},
  d=>{d.evidence.count.statement.placeId='missing';},d=>{d.evidence.count.statement.id='wrong';},
  d=>{d.evidence.count.mode='llm-approved';}
 ]){const {request,draft}=setup();controlled(request,draft,request.source.logic.clues.at(-1));mutate(draft);assert.throws(()=>validateFlavorDraft(request,draft));}
});
test('source binding survives JSON persistence and detects any original mutation',()=>{
 const {request,draft}=setup();assert.deepEqual(validateFlavorRequest(JSON.parse(JSON.stringify(request))),request);
 for(const mutate of [r=>{r.source.logic.clues[0].direction='W';},r=>{r.source.presentation.intro=['Changed'];},r=>{r.source.dataVersion++;}]){
  const modified=structuredClone(request);mutate(modified);assert.throws(()=>validateFlavorRequest(modified),/hash mismatch/);
 }
 const other=flavorFixture();other.dataVersion++;assert.throws(()=>validateFlavorDraft(createFlavorRequest(other),draft),/another source/);
 assert.equal(request.source.solution,undefined);assert.equal(request.source.metadata,undefined);
});
test('checkpoint resume recomputes proof and repairs exactly one clue with revision guard',()=>{
 const {request,draft}=setup();controlled(request,draft,request.source.logic.clues[0]);
 const checkpoint=JSON.parse(JSON.stringify(createFlavorCheckpoint(request,draft))),before=structuredClone(checkpoint);
 assert.deepEqual(resumeFlavorCheckpoint(request,checkpoint).pendingClueIds,['turn','position','place','between','count']);
 const statement=request.source.logic.clues[1],evidence={mode:'controlled-v2',statement,order:'fact-first'};
 const updated=repairFlavorClue(request,checkpoint,{clueId:statement.id,expectedRevision:1,text:renderControlledClue(request,statement,evidence),evidence});
 assert.equal(updated.draft.revision,2);assert.equal(updated.checks.turn.status,'PASS');assert.deepEqual(checkpoint,before);
 assert.deepEqual(updated.checks.direction,checkpoint.checks.direction);
 assert.deepEqual(updated.draft.presentation.intro,checkpoint.draft.presentation.intro);
 assert.deepEqual(updated.draft.resultTexts,checkpoint.draft.resultTexts);
 assert.throws(()=>repairFlavorClue(request,updated,{clueId:'turn',expectedRevision:1,text:'Text',evidence}),/stale repair/);
 for(const mutate of [c=>{c.checks.turn.status='PASS';},c=>{delete c.checks.turn;},c=>{c.draft.presentation.clueTexts.direction+=' Zusatz';},c=>{c.checks.direction.inputHash='a'.repeat(64);}]){
  const changed=structuredClone(checkpoint);mutate(changed);assert.throws(()=>resumeFlavorCheckpoint(request,changed),/stale or tampered/);
 }
});
test('existing validation, solver predicates, public game view and identities remain unchanged',()=>{
 const document=definition(),before=structuredClone(document),library=catalog([]);
 const view=compilePuzzle(document,{assetLibrary:library}),fingerprints=logicalFingerprints(document);
 const rules=createRules(document.logic),routes=[...rules.routes()],matches=routes.map(r=>rules.matches(r,document.logic.clues[0]));
 const request=createFlavorRequest(document),draft=createFlavorDraft(request);controlled(request,draft,document.logic.clues[0]);
 createFlavorCheckpoint(request,draft);
 assert.deepEqual(validateDefinition(document),validateDefinition(before));assert.deepEqual(document,before);
 assert.deepEqual(compilePuzzle(document,{assetLibrary:library}),view);assert.deepEqual(logicalFingerprints(document),fingerprints);
 assert.deepEqual([...createRules(document.logic).routes()],routes);assert.deepEqual(routes.map(r=>rules.matches(r,document.logic.clues[0])),matches);
 const invalid=structuredClone(document.logic);invalid.clues[0].hour=2;assert.throws(()=>validateLogic(invalid),/hour exceeds/);
});
test('controlled text rejects confused or additional display references; targeted repair can fix them',()=>{
 const {request,draft}=setup(),statement=request.source.logic.clues.find(c=>c.id==='place');
 const evidence=controlled(request,draft,statement);
 for(const refs of [[],['port'],['shore','port']]){
  draft.presentation.cluePlaceRefs.place=refs;
  assert.equal(checkFlavorClue(request,draft,'place').code,'changed-place-references');
 }
 const checkpoint=createFlavorCheckpoint(request,draft);
 const fixed=repairFlavorClue(request,checkpoint,{clueId:'place',expectedRevision:1,text:draft.presentation.clueTexts.place,evidence,placeRefs:['shore']});
 assert.equal(fixed.checks.place.status,'PASS');
 const tampered=structuredClone(fixed);tampered.draft.presentation.cluePlaceRefs.place=['port'];
 assert.throws(()=>resumeFlavorCheckpoint(request,tampered),/stale or tampered/);
});
test('a copied original statement never certifies unrelated free prose',()=>{
 const {request,draft}=setup(),statement=request.source.logic.clues.at(-1);controlled(request,draft,statement);
 draft.presentation.clueTexts.count=freeProse[2];
 assert.equal(checkFlavorClue(request,draft,'count').status,'FAIL');
 draft.evidence.count={mode:'free'};assert.equal(checkFlavorClue(request,draft,'count').status,'UNCERTAIN');
});
test('controlled wording has explicit independent reference examples for all six types',()=>{
 const {request}=setup();
 const expected=[
  'Von Stunde 0 zu Stunde 1: fährt das Schiff nach Osten.',
  'In Stunde 2: ändert das Schiff gegenüber der unmittelbar vorherigen Fahrtrichtung seinen Kurs um 60° rechts (0° bedeutet geradeaus).',
  'In Stunde 0: befindet sich das Schiff auf Feld C3.',
  'In Stunde 3: beträgt der kleinste Hexabstand des Schiffs zur gesamten Fläche von "Klippeninsel" [shore] genau 2.',
  'Zwischen den Positionen in Stunde 0 und Stunde 6: beträgt der Hexabstand genau 3.',
  'Von Stunde 0 bis einschließlich Stunde 6: ist der kleinste Hexabstand des Schiffs zur gesamten Fläche von "Klippeninsel" [shore] in genau 2 dieser Stunden gleich 1.'
 ];
 assert.deepEqual(request.source.logic.clues.map(c=>renderControlledClue(request,c)),expected);
});
test('schema-valid IDs matching Object prototype keys remain ordinary stable IDs',()=>{
 const source=flavorFixture();source.logic.map.objects[1].id='constructor';
 source.logic.clues=[{id:'toString',type:'distanceToPlace',hour:3,placeId:'constructor',distance:2}];
 source.presentation.objectNames={};source.presentation.clueTexts={toString:'Original'};delete source.presentation.cluePlaceRefs;
 const request=createFlavorRequest(source),draft=createFlavorDraft(request);
 assert.equal(checkFlavorClue(request,draft,'toString').status,'UNCERTAIN');
 controlled(request,draft,request.source.logic.clues[0]);
 assert.match(draft.presentation.clueTexts.toString,/"Ort" \[constructor\]/);
 assert.equal(checkFlavorClue(request,draft,'toString').status,'PASS');
 assert.deepEqual(resumeFlavorCheckpoint(request,createFlavorCheckpoint(request,draft)).pendingClueIds,[]);
});
