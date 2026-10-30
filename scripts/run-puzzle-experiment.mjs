import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {runPuzzleExperiment} from './lib/puzzle-experiment.mjs';

export async function main(argv=process.argv.slice(2)){
 const flags=['--b1','--batch','--out','--seed','--route-indices','--max-nodes-per-start','--max-clue-parameters',
  '--max-restarts','--max-solver-checks','--max-match-evaluations','--max-route-filter-evaluations'];
 const values=new Map();
 for(let i=0;i<argv.length;i+=2){
  const flag=argv[i],value=argv[i+1];
  if(!flags.includes(flag)||values.has(flag)||typeof value!=='string'||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+flag);
  values.set(flag,value);
 }
 for(const flag of flags)if(!values.has(flag))throw Error('Missing '+flag);
 const number=flag=>{const raw=values.get(flag);if(!/^(0|[1-9][0-9]*)$/.test(raw))throw Error('Invalid integer '+flag);return Number(raw);};
 const indices=values.get('--route-indices');
 if(!/^(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))*$/.test(indices))throw Error('Explicit --route-indices required');
 return runPuzzleExperiment({b1:values.get('--b1'),batch:values.get('--batch'),out:values.get('--out'),seed:number('--seed'),routeIndices:indices.split(',').map(Number),
  maxNodesPerStart:number('--max-nodes-per-start'),maxClueParameters:number('--max-clue-parameters'),searchBudgets:{
   maxRestarts:number('--max-restarts'),maxSolverChecks:number('--max-solver-checks'),maxMatchEvaluations:number('--max-match-evaluations'),
   maxRouteFilterEvaluations:number('--max-route-filter-evaluations')}});
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{console.log(JSON.stringify(await main()));}catch(error){console.error(error.message);process.exitCode=1;}
}
