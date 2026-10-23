import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLibrary,validatePlacements,productionEnabled,compatibility} from '../../src/assets/library.mjs';
import {geometryErrors,imageContract,placedCells,assetRectangle} from '../../src/assets/geometry.mjs';
import {validateDefinition,compilePuzzle} from '../../src/puzzles/validate.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {validateAssetBytes} from '../../scripts/validate-assets.mjs';
import {HEXES} from '../../src/ui/chart-geometry.mjs';
import {map,asset,catalog,definition} from '../fixtures/model/factories.mjs';
const placement={id:'shore-art',assetId:'test.island',anchor:'B2',objectId:'shore'};
const shore=()=>asset('test.island',[[0,0],[1,0]]);
const errors=(p=[placement],c=catalog([shore()]),m=map())=>validatePlacements(p,c,m,'test-sea');
test('semantic classification is explicit, small and versioned, independent of passability',()=>{
 const c=catalog();validateLibrary(c);c.assets[0].semanticClass='lighthouse';c.assets[0].passable=true;validateLibrary(c);
 for(const mutate of [v=>v.semanticVersion=2,v=>v.schemaVersion=1,v=>delete v.assets[0].semanticClass,v=>v.assets[0].semanticClass='guessed-from-filename',v=>v.assets[0].type='island']){const v=catalog();mutate(v);assert.throws(()=>validateLibrary(v));}
});
test('one illustration exactly matches one object footprint and passability at either row parity',()=>{
 assert.deepEqual(errors(),[]);
 const m=map();m.objects[1].cells=['B3','C3'];m.objects[0].cells=['D4'];
 assert.deepEqual(errors([{...placement,anchor:'B3'}],catalog([shore()]),m),[]);
 const c=catalog([asset('test.port',[[0,0],[1,0]],true)]);
 assert.deepEqual(errors([{id:'port-art',assetId:'test.port',anchor:'C3',objectId:'port'}],c),[]);
});
test('placements reject absent references, partial footprints, duplicate ownership, overlaps, transforms and passability mismatch',()=>{
 for(const change of [{objectId:undefined},{objectId:'unknown'},{anchor:'E5'},{assetId:'unknown'},{rotation:60},{mirror:true},{scale:2},{dx:1},{cells:['B2']}]){const p={...placement,...change};if(p.objectId===undefined)delete p.objectId;assert.ok(errors([p]).length);}
 assert.ok(errors([placement,placement]).some(e=>e.includes('Duplicate')));
 assert.ok(errors([placement,{...placement,id:'second'}]).some(e=>e.includes('overlap')));
 assert.ok(errors([placement],catalog()).some(e=>e.includes('footprint')));
 assert.ok(errors([placement],catalog([asset('test.island',[[0,0],[1,0]],true)])).some(e=>e.includes('passable')));
});
test('decorations have no logical references, passability or overlap with logical objects',()=>{
 const a=asset('test.deco');a.role='decoration';a.semanticClass='decoration';delete a.passable;
 const c=catalog([a]),p={id:'deco',assetId:a.id,anchor:'A1'};
 assert.deepEqual(errors([p],c),[]);
 assert.ok(errors([{...p,objectId:'shore'}],c).some(e=>e.includes('decoration')));
 assert.ok(errors([{...p,anchor:'C3'}],c).some(e=>e.includes('overlaps logical')));
 c.assets[0].passable=true;assert.throws(()=>validateLibrary(c),/decoration/);
});
test('explicit art release, concrete background approval and byte hashes are independent gates',()=>{
 const c=catalog([shore()]);assert.equal(productionEnabled(c,'test.island','test-sea'),true);
 for(const state of ['draft','historical','deferred']){c.assets[0].production=state;assert.equal(productionEnabled(c,'test.island','test-sea'),false);assert.ok(errors([placement],c).some(e=>e.includes('not enabled')));}
 c.assets[0].production='enabled';c.reviews[0].status='pending';assert.ok(errors([placement],c).some(e=>e.includes('not visually approved')));
 assert.equal(compatibility(c,'test.island','unknown'),'pending');
 c.reviews[0].status='approved';c.reviews[0].backgroundId='*';assert.throws(()=>validateLibrary(c),/concrete/);
 for(const field of ['reviewer','date','assetSha256','backgroundSha256']){const v=catalog();delete v.reviews[0][field];assert.throws(()=>validateLibrary(v),/Approval requires/);}
 assert.throws(()=>validateAssetBytes(catalog(),()=>Buffer.from('changed')),/Stale visual approval/);
});
test('geometry rejects disconnected, fractional, duplicate, empty and nonorigin footprints; renderer preserves aspect ratio',()=>{
 for(const cells of [[],[[0,0],[2,0]],[[0,0],[.5,0]],[[0,0],[0,0]],[[1,0]],[[0,0,0]]])assert.ok(geometryErrors(cells).length);
 assert.deepEqual(geometryErrors([[0,0],[1,0],[0,1]]),[]);
 assert.deepEqual([imageContract([[0,0]]).pixelWidth,imageContract([[0,0]]).pixelHeight],[360,408]);
 const a=shore(),byId=Object.fromEntries(HEXES.map(h=>[h.id,h]));
 assert.deepEqual(placedCells(a,'B2'),['B2','C2']);
 for(const anchor of ['B2','B3']){const rect=assetRectangle(a,anchor,byId);assert.equal(rect.width/rect.height,a.image.width/a.image.height);}
 assert.throws(()=>assetRectangle(a,'E1',byId),/beyond/);
});
test('full validation and public projection accept explicit asset context while pure identity and solver need none',()=>{
 const d=definition(),c=catalog([shore()]);d.presentation.assetPlacements=[placement];
 assert.throws(()=>validateDefinition(d),/library required/);validateDefinition(d,{assetLibrary:c});
 const dto=projectPublicPuzzle(d,{assetLibrary:c,identity:{mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'}});
 assert.deepEqual(dto.puzzle.presentation.assetPlacements,[placement]);
 assert.deepEqual(compilePuzzle(dto.puzzle,{assetLibrary:c}).solution,['C3','D3']);
});
