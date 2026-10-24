import {performance} from 'node:perf_hooks';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Optional checkout root permits the exact same synthetic probe at the reviewed
// commit and the corrected commit. No files/images are read during measurement.
const root=path.resolve(process.argv[2]??fileURLToPath(new URL('../',import.meta.url)));
const load=ref=>import(pathToFileURL(path.join(root,ref)).href);
const [{assignAssets},{asset,catalog},{syntheticCatalog},{cellsOf},{GEOMETRY}]=await Promise.all([
 load('src/assets/assignment.mjs'),load('tests/fixtures/model/factories.mjs'),
 load('tests/fixtures/model/asset-context.mjs'),load('src/engine/hex.mjs'),load('src/puzzles/schema.mjs')]);
const map={geometry:GEOMETRY,grid:{columns:5,rows:5},objects:cellsOf({columns:5,rows:5}).map((cell,i)=>({id:'geo-'+i,cells:[cell],passable:false}))};
const rows=[];
for(const size of [28,128,512]){
 const library=catalog(Array.from({length:size},(_,i)=>asset('bench.'+String(i).padStart(4,'0'))));
 let catalogValidations=0;
 // This family-reference check occurs once per full validateLibrary call and
 // never in placement checks or JSON serialization. Observe one sentinel asset.
 library.assets[0].candidateFamilies=new Proxy(library.assets[0].candidateFamilies,{get(target,key,receiver){
  if(key==='some')catalogValidations++;
  return Reflect.get(target,key,receiver);
 }});
 const context=syntheticCatalog(library),start=performance.now();
 const result=assignAssets({map,seed:0,catalog:context});
 rows.push({assets:size,objects:25,candidateChecks:result.diagnostics.candidateChecks,
  fullCatalogValidations:catalogValidations,milliseconds:Number((performance.now()-start).toFixed(3)),status:result.status});
}
console.log(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,
 seed:0,repetitions:1,includesPreparation:false,rows},null,2));
