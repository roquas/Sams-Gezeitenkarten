import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCatalogProof} from './lib/catalog-proof.mjs';

export function main(argv=process.argv.slice(2)){
 const options=new Map(),allowed=['repository','candidate','out','background','expected-count'];
 for(let i=0;i<argv.length;i+=2){
  const key=argv[i]?.slice(2),value=argv[i+1];
  if(!argv[i]?.startsWith('--')||!allowed.includes(key)||options.has(key)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+argv[i]);
  options.set(key,value);
 }
 for(const key of ['candidate','out'])if(!options.has(key))throw Error('Missing --'+key);
 const expected=options.get('expected-count');
 if(expected!==undefined&&!/^(0|[1-9][0-9]*)$/.test(expected))throw Error('Invalid --expected-count');
 return createCatalogProof({repositoryRoot:path.resolve(options.get('repository')??'.'),candidate:options.get('candidate'),out:options.get('out'),backgroundId:options.get('background'),expectedCount:expected===undefined?undefined:Number(expected)});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const result=main();console.log(JSON.stringify(result,null,2));if(!result.complete)process.exitCode=1;}
 catch(error){console.error(error.message);process.exitCode=1;}
}
