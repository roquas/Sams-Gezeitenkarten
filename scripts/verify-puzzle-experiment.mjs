// Independent replay through the pre-existing detailed solver. Does not import
// B2's clue producer, search strategy or cached solver.
import fs from 'node:fs';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {logicalFingerprints} from './lib/publication-archive.mjs';
import {createRules} from '../src/engine/puzzle.mjs';
import {createClueEffectKey} from './lib/puzzle-clue-effects.mjs';
import {canonicalJson} from './lib/content-hash.mjs';
import {verifyCandidateOrigins} from './lib/candidate-origin-contract.mjs';

// Independent provenance replay: do not call the candidate normalizer. Check
// structural equivalence as well as every group's truth on every legal route.
function verifyNormalization(record,{rules,routes}){
 const p=record.normalization,clues=record.definition.logic.clues;
 const key=({id,...parameters})=>canonicalJson(parameters);
 assert.equal(p.format,'count-distance-extremes-1');
 const rawDefinition={...record.definition,logic:{...record.definition.logic,clues:p.rawClues}};
 assert.deepEqual(logicalFingerprints(rawDefinition),p.rawFingerprints);
 assert.notEqual(p.rawFingerprints.variant,record.fingerprints.variant);
 const raw=new Map(p.rawClues.map(c=>[c.id,c])),used=new Set();let merged=0;
 assert.deepEqual(p.outputs.map(o=>o.clueId),clues.map(c=>c.id));
 for(const [i,output] of p.outputs.entries()){
  const clue=clues[i],sources=output.sources.map(source=>{
   const c=raw.get(source.id);assert.ok(c&&!used.has(c.id),'missing or reused raw clue');
   used.add(c.id);assert.equal(key(c),source.key);return c;
  });
  if(output.rule==='unchanged'){
   assert.equal(sources.length,1);assert.equal(key(sources[0]),key(clue));
  }else{
   merged++;assert.ok(sources.length>=2);
   assert.ok(['zero-union','all-union'].includes(output.rule));
   assert.equal(clue.type,'countDistanceToPlace');
   const all=output.rule==='all-union',ordered=[...sources].sort((a,b)=>a.fromHour-b.fromHour);
   let end=ordered[0].toHour;
   for(const c of ordered){
    assert.equal(c.type,clue.type);assert.equal(c.placeId,clue.placeId);assert.equal(c.distance,clue.distance);
    assert.equal(c.count,all?c.toHour-c.fromHour+1:0);
    assert.ok(c.fromHour<=end+1,'raw intervals have a gap');end=Math.max(end,c.toHour);
   }
   assert.equal(clue.fromHour,ordered[0].fromHour);assert.equal(clue.toHour,end);
   assert.equal(clue.count,all?end-clue.fromHour+1:0);
  }
  for(const route of routes)assert.equal(rules.matches(route,clue),sources.every(c=>rules.matches(route,c)));
 }
 assert.equal(used.size,raw.size);assert.ok(merged>0);
}

export function verifyCandidates(file,originContext){
 const records=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(JSON.parse);
 // This decision comes from a trusted external inventory, never an optional
 // candidate field or a row-declared downgrade to an old format.
 verifyCandidateOrigins(records,originContext);
 const variants=new Set(),effects=new Set(),workspaces=new Map();
 for(const record of records){
  const result=checkIrredundancy(record.definition,{detailed:true,maxNodes:1000000});
  assert.equal(record.definition.logic.steps,6);assert.equal(record.definition.solution.length,7);
  assert.equal(result.irredundant,true);assert.equal(result.target.status,'match');
  assert.deepEqual(result.uniqueSolution,record.proof.uniqueSolution);
  assert.equal(result.count,record.proof.count);assert.equal(result.countExact,record.proof.countExact);
  assert.equal(result.search.legalRoutesVisited,record.proof.legalRouteCount);
  assert.deepEqual(result.omissions.map(({clueId,count,necessary})=>({clueId,count,necessary})),
   record.proof.omissions.map(({clueId,count,necessary})=>({clueId,count,necessary})));
  assert.deepEqual(logicalFingerprints(record.definition),record.fingerprints);
  const key=record.attemptId+'/'+record.fingerprints.variant;assert.ok(!variants.has(key),'duplicate variant for target attempt');variants.add(key);
  if(record.puzzleExperimentFormatVersion>=2){
   const scope=record.fingerprints.mapStructure+'/'+record.definition.logic.start;
   if(!workspaces.has(scope)){
    const rules=createRules(record.definition.logic),routes=[...rules.routes([record.definition.logic.start],{remaining:1000000})];
    workspaces.set(scope,{rules,routes,keyForMasks:createClueEffectKey(record.definition.logic,routes)});
   }
   const {rules,routes,keyForMasks}=workspaces.get(scope);
   if(record.preparation?.status==='normalized')verifyNormalization(record,{rules,routes});
   const effectKey=keyForMasks(record.definition.logic.clues.map(clue=>Uint8Array.from(routes,route=>Number(rules.matches(route,clue)))));
   assert.equal(record.effectKey,effectKey);
   const attemptEffect=record.attemptId+'/'+effectKey;assert.ok(!effects.has(attemptEffect),'equivalent clue effects for target attempt');effects.add(attemptEffect);
  }
 }
 return {verifiedCandidates:records.length,method:'existing-checkIrredundancy-detailed'};
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{
  const [file,...args]=process.argv.slice(2);
  if(!file||(args.length!==0&&!(args.length===4&&args[0]==='--origin-contract'&&args[2]==='--expect-origin-contract-sha256')))
   throw Error('Usage: node scripts/verify-puzzle-experiment.mjs candidates.jsonl [--origin-contract file --expect-origin-contract-sha256 trusted-digest]');
  const context=args.length?{originContract:JSON.parse(fs.readFileSync(args[1],'utf8')),expectedOriginContractSha256:args[3]}:undefined;
  console.log(JSON.stringify(verifyCandidates(file,context)));
 }
 catch(error){console.error(error.message);process.exitCode=1;}
}
