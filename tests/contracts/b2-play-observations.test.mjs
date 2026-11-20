import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../../scripts/lib/b2-deduction-profile.mjs';
import {readPlaytestSource} from '../../scripts/lib/b2-playtest.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
const collection=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/observations/human-playtests.v1.json'),'utf8'));
const observations=collection.observations;
const observation=id=>observations.find(o=>o.id===id);

test('all supplied observations have stable identities, source hashes, play status and separate evidence layers',()=>{
 assert.equal(collection.format,'human-play-observations-1');assert.equal(observations.length,30);
 assert.equal(new Set(observations.map(o=>o.id)).size,30);
 const sources=new Map(collection.sources.map(s=>[s.id,s]));
 for(const s of sources.values())assert.equal(sha256(fs.readFileSync(path.join(ROOT,s.path))),s.sha256);
 for(const o of observations){
  assert.match(o.puzzleId,/^B2-[A-Z0-9-]+$/);
  assert.ok([true,false,null].includes(o.actuallyPlayed));assert.ok(o.documentedStatus);
  assert.ok(o.sources.length);assert.equal(o.playerAccount.form,'summary');
  assert.ok(o.playerAccount.provenance);
  for(const k of ['observedCourse','positiveAspects','negativeAspects'])assert.ok(Array.isArray(o.playerAccount[k]));
  assert.deepEqual(o.technicalFindings,[]);assert.deepEqual(o.laterInterpretations,[]);
  assert.ok(Array.isArray(o.uncertainties));
  for(const ref of o.sources){
   const src=sources.get(ref.sourceId);assert.ok(src);
   const lines=fs.readFileSync(path.join(ROOT,src.path),'utf8').split('\n');
   assert.ok(Number.isSafeInteger(ref.line)&&ref.line>0&&ref.line<=lines.length);
   assert.ok(lines[ref.line-1].trim());
  }
  for(const key of ['score','weight','qualityLabel','duration','difficulty'])assert.equal(Object.hasOwn(o,key),false);
 }
});

test('the full ten-series has original inventory identities, no fabricated repeated-test judgment, and explicit typo uncertainty',()=>{
 const series=observations.filter(o=>o.id.startsWith('ten-'));assert.equal(series.length,10);
 const inventories=['S01','S02','BC'].flatMap(stock=>readPlaytestSource(stock).registry.entries.map(e=>e.testName));
 for(const o of series)assert.ok(inventories.includes(o.puzzleId),o.puzzleId);
 const repeat=observation('ten-03');assert.equal(repeat.documentedStatus,'previously-played-no-new-test');
 assert.equal(repeat.actuallyPlayed,true);assert.equal(repeat.playerAccount.overallAssessment,null);
 assert.deepEqual(repeat.playerAccount.observedCourse,[]);
 assert.deepEqual(repeat.playerAccount.verbatimQuotes,['Hatte ich schon gelöst, k.A. was ich Dir dazu schrieb :-)']);
 const typo=observation('ten-05');assert.equal(typo.puzzleId,'B2-S02-M015-E4-R00-V01');
 assert.deepEqual(typo.identityUncertainty,{reportedId:'B2-S02-M015-A4-R00-V01',overviewId:typo.puzzleId,binding:'test-position-and-context'});
 assert.match(typo.uncertainties.join(),/keine fehlerfrei verifizierte/);
 for(const o of series)assert.equal(o.playerAccount.provenance,'primary-observation-summary');
 assert.ok(collection.seriesFeedback.preference.includes('Geometrische und einfache Rätsel'));
});

test('A/B/C/D are corrected from unknown without inventing an order; controls remain individual experiences',()=>{
 for(const letter of ['A','B','C','D']){
  const o=observation('historical-'+letter);assert.equal(o.actuallyPlayed,true);
  assert.ok(o.playerAccount.overallAssessment);assert.match(o.uncertainties.join(),/irrtümlich als unbekannt/);
 }
 assert.deepEqual(observation('historical-B').playerAccount.observedCourse,[]);
 assert.match(observation('historical-A').playerAccount.overallAssessment,/langweilig/);
 assert.match(observation('historical-C').playerAccount.overallAssessment,/gelungener Kombinationsfall/);
 assert.match(observation('positive-v2').playerAccount.overallAssessment,/nahezu identisch/);
 assert.equal(observation('historical-T07-given-3').condition.givenHour,3);
 for(const id of ['technical-combination','technical-course']){
  const o=observation(id);assert.equal(o.actuallyPlayed,null);assert.equal(o.documentedStatus,'technical-only');
  assert.equal(o.playerAccount.overallAssessment,null);assert.deepEqual(o.playerAccount.observedCourse,[]);
 }
});

test('all nine S03 accounts preserve counterexamples, observed reuse and known context discrepancies',()=>{
 const s03=observations.filter(o=>o.id.startsWith('s03-'));assert.equal(s03.length,9);
 const inventory=readPlaytestSource('S03-V2').registry.entries.map(e=>e.testName).sort();
 assert.deepEqual(s03.map(o=>o.puzzleId),inventory);
 for(const o of s03){assert.equal(o.actuallyPlayed,true);assert.equal(o.playerAccount.provenance,'secondary-summary');
  assert.ok(o.playerAccount.overallAssessment);assert.ok(o.playerAccount.observedCourse.length);}
 assert.match(observation('s03-05').playerAccount.overallAssessment,/nett, eher einfach/);
 assert.match(observation('s03-08').playerAccount.observedCourse.join(),/H4-Markierungen/);
 assert.match(observation('s03-08').uncertainties.join(),/nicht der lokale Einzelhinweis/);
 assert.match(observation('s03-01').uncertainties.join(),/fünf S6/);
 assert.match(observation('s03-06').playerAccount.negativeAspects.join(),/H2\/H3/);
});
