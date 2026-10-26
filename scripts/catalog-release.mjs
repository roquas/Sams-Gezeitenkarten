import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCatalogReleaseCandidate,verifyCatalogReleaseCandidate,approveCatalogRelease,loadCatalogRelease,checkCatalogReleaseArchive} from './lib/catalog-release.mjs';

export function main(argv=process.argv.slice(2)){
 const [command,...rest]=argv,options=new Map();
 const allowed={build:['source','out'],verify:['candidate','release'],approve:['candidate','release-id','manifest-sha256','by'], 'check-archive':['previous']};
 if(!Object.hasOwn(allowed,command))throw Error('Usage: catalog-release <build|verify|approve|check-archive> [--repository PATH] ...');
 for(let i=0;i<rest.length;i+=2){
  const key=rest[i]?.slice(2),value=rest[i+1];
  if(!rest[i]?.startsWith('--')||![...allowed[command],'repository'].includes(key)||options.has(key)||!value||value.startsWith('--'))throw Error('Invalid or duplicate option: '+rest[i]);
  options.set(key,value);
 }
 const requireOption=key=>{if(!options.has(key))throw Error('Missing --'+key);return options.get(key);};
 const repositoryRoot=path.resolve(options.get('repository')??'.');let result;
 if(command==='build')result=buildCatalogReleaseCandidate({repositoryRoot,source:requireOption('source'),out:requireOption('out')});
 if(command==='verify'){
  if(options.has('candidate')===options.has('release'))throw Error('Specify exactly one of --candidate or --release');
  if(options.has('candidate'))result=verifyCatalogReleaseCandidate({repositoryRoot,candidate:options.get('candidate')});
  else{const loaded=loadCatalogRelease({repositoryRoot,releaseId:options.get('release')});result={releaseId:loaded.releaseId,catalogId:loaded.catalogId,archiveCommit:loaded.archiveCommit};}
 }
 if(command==='approve')result=approveCatalogRelease({repositoryRoot,candidate:requireOption('candidate'),releaseId:requireOption('release-id'),
  manifestSha256:requireOption('manifest-sha256'),approvedBy:requireOption('by')});
 if(command==='check-archive')result=checkCatalogReleaseArchive({repositoryRoot,previous:options.get('previous')});
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(main(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
