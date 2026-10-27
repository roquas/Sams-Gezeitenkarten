import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {runMapBatch,replayMapBatch} from './lib/map-batch.mjs';

const number=(value,name)=>{
 if(!/^(0|[1-9][0-9]*)$/.test(value))throw Error(name+' must be a nonnegative decimal integer');
 const n=Number(value);if(!Number.isSafeInteger(n))throw Error(name+' exceeds safe integer range');return n;
};
export async function main(argv=process.argv.slice(2)){
 if(!Array.isArray(argv)||argv.some(v=>typeof v!=='string'))throw Error('Expected command-line arguments');
 const [command,...args]=argv;
 const flags=command==='run'?['--release','--background','--count','--seed-start','--assignment-seed-start','--mode','--preference-percent','--config','--repository','--out']:
  command==='replay'?['--batch','--index','--repository','--out']:null;
 if(!flags)throw Error('Expected run or replay');
 const values=new Map();
 for(let i=0;i<args.length;i+=2){
  const flag=args[i],value=args[i+1];
  if(!flags.includes(flag)||values.has(flag)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+flag);
  values.set(flag,value);
 }
 for(const flag of command==='run'?['--release','--background','--count','--seed-start','--out']:['--batch','--index','--out']){
  if(!values.has(flag))throw Error('Missing '+flag);
 }
 const common={out:values.get('--out'),...(values.has('--repository')?{repositoryRoot:values.get('--repository')}:{})};
 if(command==='replay')return replayMapBatch({...common,batch:values.get('--batch'),index:number(values.get('--index'),'--index')});
 const options={count:number(values.get('--count'),'--count'),seedStart:number(values.get('--seed-start'),'--seed-start')};
 for(const [flag,key] of [['--assignment-seed-start','assignmentSeedStart'],['--preference-percent','preferencePercent']]){
  if(values.has(flag))options[key]=number(values.get(flag),flag);
 }
 if(values.has('--mode'))options.mode=values.get('--mode');
 if(values.has('--config'))options.config=JSON.parse(fs.readFileSync(values.get('--config'),'utf8'));
 return runMapBatch({...common,releaseId:values.get('--release'),backgroundId:values.get('--background'),options});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await main()));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
