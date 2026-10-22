import test from 'node:test';
import assert from 'node:assert/strict';
import {mapFingerprint,logicalFingerprints,canonicalJson,contentFingerprint} from '../../scripts/lib/publication-archive.mjs';
import {definition,map} from '../fixtures/model/factories.mjs';
const vectors=JSON.parse((await import('node:fs')).readFileSync(new URL('../fixtures/model/identity-vectors.json',import.meta.url)));
test('fixed v2 identity vectors and canonicalization are stable',()=>{
 assert.equal(mapFingerprint(map()),vectors.mapStructure);assert.deepEqual(logicalFingerprints(definition()),vectors);
 assert.equal(canonicalJson({z:[2,1],a:true}),'\{"a":true,"z":[2,1]}');
 for(const bad of [undefined,NaN,Infinity,1.5,new Date()])assert.throws(()=>canonicalJson(bad));
 assert.throws(()=>contentFingerprint('unknown',{}));
});
test('map fingerprint accepts a map directly and ignores object and cell enumeration order',()=>{
 const m=map(),before=mapFingerprint(m);m.objects.reverse();for(const o of m.objects)o.cells.reverse();assert.equal(mapFingerprint(m),before);
 for(const mutate of [v=>v.objects[1].passable=true,v=>v.objects[1].cells=['B2'],v=>v.objects[1].id='new-id']){const v=map();mutate(v);assert.notEqual(mapFingerprint(v),before);}
});
test('asset, placement, names, story and data revisions do not change any logical identities',()=>{
 const d=definition(),before=logicalFingerprints(d);d.presentation={arbitrary:'assets changed'};d.metadata={seed:42};d.dataVersion=99;
 assert.deepEqual(logicalFingerprints(d),before);
});
test('start and target route change instance identity, clues only variant; clue IDs/order are editorial but multiplicity is retained',()=>{
 const d=definition(),before=logicalFingerprints(d);d.logic.start='D3';d.logic.clues=[{id:'W',type:'direction',hour:1,direction:'W'}];d.solution=['D3','C3'];
 const changed=logicalFingerprints(d);assert.equal(changed.mapStructure,before.mapStructure);assert.notEqual(changed.instance,before.instance);
 const other=definition();other.logic.clues.push({...other.logic.clues[0],id:'copy'});assert.equal(logicalFingerprints(other).instance,before.instance);assert.notEqual(logicalFingerprints(other).variant,before.variant);
 const fp=logicalFingerprints(other);other.logic.clues.reverse();other.logic.clues[0].id='renamed';assert.deepEqual(logicalFingerprints(other),fp);
 delete other.solution;assert.throws(()=>logicalFingerprints(other),/target route required/);
});
test('target route and step count belong to the instance, independently of the chosen clues',()=>{
 const d=definition();d.logic.clues=[];const before=logicalFingerprints(d);
 d.solution=['C3','B3'];assert.notEqual(logicalFingerprints(d).instance,before.instance);assert.equal(logicalFingerprints(d).mapStructure,before.mapStructure);
 d.logic.steps=2;d.solution=['C3','D3','E3'];assert.notEqual(logicalFingerprints(d).instance,before.instance);
});
