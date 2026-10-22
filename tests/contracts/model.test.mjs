import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mapSchema,puzzleSchema,schemaErrors} from '../../src/puzzles/schema.mjs';
import {validateMap,validateLogic,validateLogicDefinition} from '../../src/engine/validate.mjs';
import {validateDefinition} from '../../src/puzzles/validate.mjs';
import {projectPublicPuzzle,validatePublicPuzzle,publicPuzzleSchema} from '../../src/puzzles/public.mjs';
import {manifestSchema} from '../../src/puzzles/loader.mjs';
import {definition,map,logic} from '../fixtures/model/factories.mjs';
const identity={mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'};
test('published schemas equal executable contracts',()=>{
 for(const [file,schema] of [['map-v2',mapSchema],['puzzle-v2',puzzleSchema],['public-puzzle-v2',publicPuzzleSchema],['manifest-v2',manifestSchema]])assert.deepEqual(JSON.parse(fs.readFileSync('puzzles/schema/'+file+'.schema.json')),schema);
});
test('objects have stable unique IDs and disjoint connected nonempty cell sets',()=>{
 for(const mutate of [m=>m.objects[0].cells=[],m=>m.objects[0].cells=['C3','C3'],m=>m.objects[0].cells=['C3','Z9'],m=>m.objects[0].cells=['A1','E5'],m=>m.objects[0].passable='true',m=>m.objects[0].kind='island',m=>m.objects.push({...m.objects[0],id:'other'}),m=>m.objects.push({...m.objects[0],cells:['A1']})]){const m=map();mutate(m);assert.throws(()=>validateMap(m));}
 validateMap(map());validateMap({...map(),objects:[]});
});
test('abstract maps reject presentation and instance data, including independently maintained blocked lists',()=>{
 for(const field of ['start','steps','targetRoute','clues','blocked','assets','assetId','names','placeSemantics'])assert.throws(()=>validateMap({...map(),[field]:[]}));
 for(const field of ['name','assetId','kind']){const m=map();m.objects[0][field]='value';assert.throws(()=>validateMap(m));}
});
test('start must be an explicit cell on a passable object; unnamed objects are valid',()=>{
 const l=logic();l.start='D3';validateLogic(l);
 for(const start of ['A1','B2','Z9'])assert.throws(()=>validateLogic({...l,start}),/start/);
 validateDefinition(definition());
});
test('logic validates clue references, inclusive ranges, zero distance and strict parameter types',()=>{
 const l=logic(),base={id:'C',type:'countDistanceToPlace',fromHour:0,toHour:1,placeId:'port',distance:0,count:2};
 l.clues=[base];validateLogic(l);
 for(const change of [{fromHour:1,toHour:0},{toHour:2},{count:3},{distance:-1},{distance:.5},{placeId:'absent'},{extra:true},{count:'2'}])assert.throws(()=>validateLogic({...l,clues:[{...base,...change}]}));
 for(const type of ['adjacentToPlace','countAdjacentToPlace'])assert.throws(()=>validateLogic({...l,clues:[{id:'L',type,hour:0,place:'port'}]}));
 assert.throws(()=>validateLogic({...l,clues:[base,base]}),/duplicate/);
});
test('new rules and schema versions are explicit; dataVersion is a content revision',()=>{
 const d=definition();d.dataVersion=2;validateLogicDefinition(d);
 for(const change of [{rulesVersion:'gezeitenkarten-1'},{schemaVersion:1},{dataVersion:0},{dataVersion:1.5}])assert.throws(()=>validateLogicDefinition({...d,...change}),e=>e.phase==='version');
 assert.throws(()=>validateLogicDefinition(d,{rulesVersion:'unknown'}),/rulesVersion/);
});
test('complete document validation is independent of solver execution and validates optional target separately',()=>{
 const d=definition();d.logic.clues=[];d.presentation.clueTexts={};delete d.solution;validateDefinition(d);
 d.solution=['C3','C2'];assert.throws(()=>validateDefinition(d),e=>e.phase==='target');
 d.logic.start='A1';assert.throws(()=>validateDefinition(d),e=>e.phase==='semantics');
});
test('public projection deep allowlists maps, objects, clues and placements, and cannot leak internal target or seed',()=>{
 const d=definition();d.generator={seed:'PRIVATE'};d.metadata={kind:'test',source:'PRIVATE'};
 d.logic.map.secret='PRIVATE';d.logic.map.objects[0].privateRoute='PRIVATE';d.logic.clues[0].private='PRIVATE';
 const dto=projectPublicPuzzle(d,{identity});validatePublicPuzzle(dto);
 assert.equal(JSON.stringify(dto).includes('PRIVATE'),false);assert.equal('solution' in dto.puzzle,false);
 assert.equal(dto.projectionSchemaVersion,2);assert.deepEqual(dto.puzzle.logic.map.objects[0],{id:'port',cells:['C3','D3'],passable:true});
 dto.puzzle.logic.map.objects[0].cells.reverse();assert.deepEqual(d.logic.map.objects[0].cells,['C3','D3']);
 assert.deepEqual(projectPublicPuzzle(d,{identity}),projectPublicPuzzle(d,{identity}));
});
test('public DTO rejects private fields and mismatching versions at every strict boundary',()=>{
 const dto=projectPublicPuzzle(definition(),{identity});
 for(const mutate of [v=>v.puzzle.solution=['C3','D3'],v=>v.puzzle.metadata={},v=>v.rulesVersion='gezeitenkarten-1',v=>v.puzzle.rulesVersion='gezeitenkarten-1',v=>v.puzzle.logic.map.objects[0].kind='island',v=>v.identity.extra='private']){const v=structuredClone(dto);mutate(v);assert.throws(()=>validatePublicPuzzle(v));}
});
test('presentation requires only referenced clue texts, permits optional names, rejects unknown object names',()=>{
 const d=definition();d.presentation.clueTexts={};assert.throws(()=>validateDefinition(d),/clueTexts/);
 d.presentation.clueTexts={E:'East'};d.presentation.objectNames.unknown='Name';assert.throws(()=>validateDefinition(d),/objectNames/);
});
test('both interval operators reject reversed ranges and out-of-instance hours; a legal schema may be unsatisfiable',()=>{
 const l=logic();
 for(const hours of [[1,0],[0,2]])assert.throws(()=>validateLogic({...l,clues:[{id:'H',type:'distanceBetweenHours',hours,distance:0}]}));
 const d=definition();d.logic.steps=2;d.logic.clues=[{id:'T',type:'turn',hour:2,degrees:180}];d.presentation.clueTexts={T:'Turn'};delete d.solution;
 validateDefinition(d);
});
