import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeDefinition,checkIrredundancy} from '../../src/puzzles/analysis.mjs';
import {validateLogicDefinition} from '../../src/engine/validate.mjs';
import {definition} from '../fixtures/model/factories.mjs';
test('logic validation and solver never inspect presentation, private generator fields or catalogs',()=>{
 const d=definition();delete d.solution;
 for(const key of ['presentation','generator','metadata'])Object.defineProperty(d,key,{get(){throw Error('must not read '+key);}});
 validateLogicDefinition(d);assert.equal(analyzeDefinition(d).status,'unique');
});
test('bounded and detailed modes agree on the exact independent one-step solution and omissions',()=>{
 for(const detailed of [false,true]){
  const d=definition(),a=checkIrredundancy(d,{detailed});
  assert.equal(a.status,'unique');assert.deepEqual(a.uniqueSolution,['C3','D3']);assert.equal(a.target.status,'match');assert.equal(a.irredundant,true);
  assert.equal(a.omissions[0].necessary,true);
  assert.equal(a.omissions[0].count,detailed?4:2);
 }
});
test('duplicate hints are individually redundant; removing both releases alternatives',()=>{
 const d=definition();d.logic.clues.push({...d.logic.clues[0],id:'E2'});
 const a=checkIrredundancy(d);assert.equal(a.irredundant,false);assert.deepEqual(a.omissions.map(o=>o.count),[1,1]);
 assert.equal(checkIrredundancy({...d,logic:{...d.logic,clues:[]}}).status,'ambiguous');
});
test('target diagnostics distinguish absence, invalidity, mismatch and ambiguity',()=>{
 const d=definition();delete d.solution;assert.equal(checkIrredundancy(d).target.status,'absent');assert.equal(checkIrredundancy(d).irredundant,false);
 assert.equal(analyzeDefinition(d,{targetRoute:['C3','A1']}).target.status,'invalid');
 assert.equal(analyzeDefinition(d,{targetRoute:['C3','B3']}).target.status,'mismatch');
 d.logic.clues=[];assert.equal(analyzeDefinition(d,{targetRoute:['C3','D3']}).target.status,'not-unique');
 d.logic.clues=[{id:'P',type:'position',hour:1,cell:'C3'}];assert.equal(analyzeDefinition(d).status,'unsolvable');
});
test('search saturation is never an exact ambiguity count or a uniqueness claim on budget failure',()=>{
 const d=definition();d.logic.clues=[];
 const a=analyzeDefinition(d);assert.equal(a.count,2);assert.equal(a.countExact,false);assert.equal(a.search.completed,false);
 assert.throws(()=>analyzeDefinition(d,{maxNodes:1}),/Suchbudget/);
 assert.throws(()=>analyzeDefinition(d,{maxNodes:0}),/Suchbudget/);
});
