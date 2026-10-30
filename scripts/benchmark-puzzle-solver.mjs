// Observational benchmark, with equal exact counts required. No timing gate.
import fs from 'node:fs';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {solvePuzzle} from '../src/engine/solver.mjs';
import {createRouteWorkspace} from './lib/puzzle-route-solver.mjs';
import {clueKey} from './lib/puzzle-clues.mjs';
import {sha256} from './lib/content-hash.mjs';

export function benchmarkSolver(file,checks){
 if(!Number.isSafeInteger(checks)||checks<1||checks>1000)throw Error('checks must be 1–1000');
 const bytes=fs.readFileSync(file),rows=bytes.toString('utf8').split('\n').filter(Boolean).map(JSON.parse);
 if(!rows.length)throw Error('Candidates required');
 const first=rows[0],selected=rows.filter(row=>row.attemptId===first.attemptId);
 const clues=[...new Map(selected.flatMap(row=>row.definition.logic.clues).map(clue=>[clueKey(clue),clue])).values()]
  .map((clue,i)=>({...clue,id:'B'+i}));
 const index=new Map(clues.map((clue,i)=>[clueKey(clue),i]));
 const sets=Array.from({length:checks},(_,i)=>selected[i%selected.length].definition.logic.clues);
 const begin=performance.now(),counts=sets.map(set=>solvePuzzle({...first.definition.logic,clues:set},{maxNodes:1000000,metrics:false}).count);
 const existingSolverMs=performance.now()-begin,start=performance.now();
 const workspace=createRouteWorkspace({...first.definition.logic,clues:[]},{maxNodes:1000000});
 const solver=workspace.forClues(clues,{maxSolverChecks:checks,maxMatchEvaluations:100000000,maxRouteFilterEvaluations:100000000});
 const cachedCounts=sets.map(set=>solver.check(set.map(clue=>index.get(clueKey(clue)))).count);
 const cachedSolverMs=performance.now()-start;assert.deepEqual(cachedCounts,counts);
 return {nodeVersion:process.version,inputSha256:sha256(bytes),checks,distinctSets:selected.length,legalRoutes:workspace.routeCount,
  existingSolverMs:Math.round(existingSolverMs),cachedSolverMs:Math.round(cachedSolverMs),
  cachedMetrics:solver.metrics,enumerationNodes:workspace.nodesVisited};
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{if(process.argv.length!==4||!/^[1-9][0-9]*$/.test(process.argv[3]))throw Error('Usage: node scripts/benchmark-puzzle-solver.mjs candidates.jsonl checks');
  console.log(JSON.stringify(benchmarkSolver(process.argv[2],Number(process.argv[3]))));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
