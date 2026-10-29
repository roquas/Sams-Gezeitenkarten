// Independent replay through the pre-existing detailed solver. Does not import
// B2's clue producer, search strategy or cached solver.
import fs from 'node:fs';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {logicalFingerprints} from './lib/publication-archive.mjs';

export function verifyCandidates(file){
 const records=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(JSON.parse);
 const variants=new Set();
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
 }
 return {verifiedCandidates:records.length,method:'existing-checkIrredundancy-detailed'};
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{if(process.argv.length!==3)throw Error('Usage: node scripts/verify-puzzle-experiment.mjs candidates.jsonl');console.log(JSON.stringify(verifyCandidates(process.argv[2])));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
