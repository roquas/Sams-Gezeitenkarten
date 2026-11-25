import test from 'node:test';
import assert from 'node:assert/strict';
import {cluePlaceIds,namedPlaceIds,namedStartPlaceId} from '../../src/ui/place-references.mjs';
import {definition} from '../fixtures/model/factories.mjs';
import {validateDefinition} from '../../src/puzzles/validate.mjs';
import {projectPublicPuzzle,validatePublicPuzzle} from '../../src/puzzles/public.mjs';
const puzzle={map:{objects:[{id:'land',cells:['B2','C2']},{id:'boat',cells:['A1'],passable:true},{id:'unnamed',cells:['E5']}]},
 objectNames:{land:'Insel',boat:'Roberts Boot'},clues:[
 {id:'I',type:'distanceToPlace',placeId:'land'},{id:'II',type:'countDistanceToPlace',placeId:'boat'},
 {id:'III',type:'position',cell:'A1',text:'Roberts Boot – no text parsing'}]};
test('only named logical instances are labels, regardless of passability or hex count',()=>{
 assert.deepEqual(namedPlaceIds(puzzle),['land','boat']);
 assert.deepEqual(namedPlaceIds({...puzzle,objectNames:Object.create({land:'inherited'})}),[]);
});
test('references use existing placeIds and explicit editorial lists, never text or position cells',()=>{
 assert.deepEqual(cluePlaceIds(puzzle,'I'),['land']);assert.deepEqual(cluePlaceIds(puzzle,'II'),['boat']);
 assert.deepEqual(cluePlaceIds(puzzle,'III'),[]);
 const editorial={...puzzle,cluePlaceRefs:{III:['boat','land'],I:[]}};
 assert.deepEqual(cluePlaceIds(editorial,'III'),['boat','land']);assert.deepEqual(cluePlaceIds(editorial,'I'),[]);
});
test('optional presentation references are validated and survive public projection without changing logic',()=>{
 const d=definition(),before=structuredClone(d.logic);
 d.presentation.cluePlaceRefs={E:['port','shore']};
 validateDefinition(d);
 const dto=projectPublicPuzzle(d,{identity:{mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'}});
 validatePublicPuzzle(dto);assert.deepEqual(dto.puzzle.presentation.cluePlaceRefs,{E:['port','shore']});
 assert.deepEqual(dto.puzzle.logic,before);
 for(const refs of [{missing:['port']},{E:['unknown']},{E:['port','port']},{E:'port'}]){
  d.presentation.cluePlaceRefs=refs;assert.throws(()=>validateDefinition(d),/cluePlaceRefs/);
 }
});

test('start identity resolves only a named passable singleton at puzzle.start, without changing names',()=>{
 const names={land:'Insel',boat:'Roberts Boot',unnamed:'   '};
 const original={...puzzle,start:'A1',objectNames:names};
 assert.equal(namedStartPlaceId(original),'boat');
 for(const start of ['E5','D4','B2'])assert.equal(namedStartPlaceId({...original,start}),undefined);
 assert.equal(namedStartPlaceId({...original,objectNames:{}}),undefined);
 assert.equal(namedStartPlaceId({...original,objectNames:Object.create({boat:'Inherited'})}),undefined);
 assert.equal(namedStartPlaceId({...original,map:{objects:[{id:'boat',cells:['A1'],passable:false}]}}),undefined);
 assert.equal(namedStartPlaceId({...original,map:{objects:[{id:'boat',cells:['A1','A2'],passable:true}]}}),undefined);
 assert.equal(namedStartPlaceId({...original,start:'D4'}),undefined);
 assert.deepEqual(original.objectNames,names);
 assert.equal(namedStartPlaceId(original),'boat');
});
