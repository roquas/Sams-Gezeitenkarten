import {pathToFileURL} from 'node:url';
import {createMapContactSheet} from './lib/map-contact-sheet.mjs';

export async function main(argv=process.argv.slice(2)){
 const allowed=['--batch','--accepted-indices','--out','--repository'],values=new Map();
 for(let i=0;i<argv.length;i+=2){
  const flag=argv[i],value=argv[i+1];
  if(!allowed.includes(flag)||values.has(flag)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+flag);
  values.set(flag,value);
 }
 for(const flag of ['--batch','--accepted-indices','--out'])if(!values.has(flag))throw Error('Missing '+flag);
 const flag='--accepted-indices',raw=values.get(flag);
 if(!/^(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))*$/.test(raw))throw Error(flag+' requires comma-separated nonnegative decimal integers');
 return createMapContactSheet({batch:values.get('--batch'),acceptedIndices:raw.split(',').map(Number),out:values.get('--out'),
  ...(values.has('--repository')?{repositoryRoot:values.get('--repository')}:{})});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await main()));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
