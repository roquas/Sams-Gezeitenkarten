import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {runRouteExperiment} from './lib/route-experiment.mjs';

export async function main(argv=process.argv.slice(2)){
 if(!Array.isArray(argv)||argv.some(v=>typeof v!=='string'))throw Error('Expected command-line arguments');
 const flags=['--batch','--accepted-indices','--max-nodes-per-start','--out','--repository'],values=new Map();
 for(let i=0;i<argv.length;i+=2){
  const flag=argv[i],value=argv[i+1];
  if(!flags.includes(flag)||values.has(flag)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+flag);
  values.set(flag,value);
 }
 for(const flag of flags.filter(f=>f!=='--repository'))if(!values.has(flag))throw Error('Missing '+flag);
 const raw=values.get('--accepted-indices'),decimal='(0|[1-9][0-9]*)';
 if(raw!=='all'&&!new RegExp('^'+decimal+'(,'+decimal+')*$').test(raw))throw Error('--accepted-indices requires all or explicit comma-separated indices');
 const budget=values.get('--max-nodes-per-start');
 if(!/^[1-9][0-9]*$/.test(budget))throw Error('--max-nodes-per-start requires a positive decimal integer');
 return runRouteExperiment({batch:values.get('--batch'),acceptedIndices:raw==='all'?'all':raw.split(',').map(Number),
  maxNodesPerStart:Number(budget),out:values.get('--out'),
  ...(values.has('--repository')?{repositoryRoot:values.get('--repository')}:{})});
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{console.log(JSON.stringify(await main()));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
