import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../scripts/lib/b2-playtest.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
export const regularCatalog=()=>read('puzzles/manifest.json');
export function assertCatalogExtension(current,previous){
 assert.deepEqual(current,{...previous,defaultId:'drei-peilungen',puzzles:[...previous.puzzles,
  {id:'drei-peilungen',title:'Die drei Peilungen',path:'drei-peilungen.json',kind:'demo'}]});
}
// Preserve exact historic export hashes after checking the complete live manifest.
// Only the explicitly authorized additive regular-catalog entry is projected out.
export function historicalCatalogFiles(files,baseCommit){
 const previous=JSON.parse(execFileSync('git',['show',baseCommit+':puzzles/manifest.json'],{cwd:ROOT,encoding:'utf8'}));
 const current=regularCatalog();assertCatalogExtension(current,previous);
 const result=new Map(files),manifest=JSON.parse(result.get('manifest.json'));
 const entries=c=>c.puzzles.map(e=>({...e,path:'../../puzzles/'+e.path}));
 assert.deepEqual(manifest.puzzles.slice(0,current.puzzles.length),entries(current));
 manifest.puzzles=[...entries(previous),...manifest.puzzles.slice(current.puzzles.length)];
 result.set('manifest.json',JSON.stringify(manifest,null,2)+'\n');return result;
}
