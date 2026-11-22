import {createPuzzleLoader} from '../puzzles/loader.mjs';
// Capture public envelope metadata at the transport boundary. The existing loader
// alone validates, resolves sources and compiles puzzles; its pinned bytes stay intact.
export function createIdentifiedLoader({fetcher=globalThis.fetch,...options}){
 const identities=new Map();
 const loader=createPuzzleLoader({...options,fetcher:async url=>{
  const response=await fetcher(url);
  return {ok:response.ok,status:response.status,json:async()=>{
   const value=await response.json();
   if(value?.projectionSchemaVersion===2&&value.puzzle?.id)identities.set(value.puzzle.id,structuredClone(value.identity));
   return value;
  }};
 }});
 return {...loader,async load(id){const puzzle=await loader.load(id);return {...puzzle,identity:structuredClone(identities.get(id))};}};
}
export function puzzleContext(search=window.location.search){
 const params=new URLSearchParams(search),development=params.get('dev')==='b2',stock=params.get('stock')??'S01';
 if(development&&!['S01','S02','S03','S03-V2','BC','POSITIVE','POSITIVE-V2'].includes(stock))throw Error('Unbekannter B2-Bestand: '+stock);
 const relative=development?(stock==='S01'?'../../.dev/b2/manifest.json':'../../.dev/b2-'+stock.toLowerCase()+'/manifest.json'):'../../puzzles/manifest.json';
 const manifestUrl=new URL(relative,import.meta.url),scope=development?'b2:'+stock:'regular';
 return {params,development,stock,scope,manifestUrl,loader:createIdentifiedLoader({manifestUrl})};
}
export function puzzleUrl(id,{replay=false,resume=false}={}){
 const url=new URL(window.location.href);url.hash='';
 for(const name of ['play','puzzle','phase'])url.searchParams.delete(name);
 if(id)url.searchParams.set('puzzle',id);else url.searchParams.set('view','selection');
 if(id)url.searchParams.delete('view');
 if(replay||resume)url.searchParams.set('phase',resume?'resume':'new');
 return url;
}
