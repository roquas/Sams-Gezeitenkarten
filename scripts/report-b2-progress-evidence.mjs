// Bounded reproduction of four existing playtest cases, never candidate search.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT,readPlaytestSource,validatePlaytestBindings} from './lib/b2-playtest.mjs';
import {diagnosePuzzle,projectRoutes,assertLocalSound} from './lib/b2-deduction.mjs';
import {localDeduction} from './lib/b2-local-deduction.mjs';
import {solvePuzzle} from '../src/engine/solver.mjs';
import {sha256} from './lib/content-hash.mjs';

export const OUTPUT='docs/verification/B2-deduction-progress/private';
const REFERENCES=[['A','S02','B2-S02-M010-E4-R00-V01'],['B','S02','B2-S02-M000-A1-R00-V01'],
 ['C','BC','B2-BC-T06-M005-E3-R00'],['D','S02','B2-S02-M017-C3-R00-V02']];
export function progressEvidenceFiles(){
 const files=new Map(),cases=[],stocks=new Map();
 for(const [id,stock,label] of REFERENCES){
  if(!stocks.has(stock)){
   const source=readPlaytestSource(stock);stocks.set(stock,{source,rows:validatePlaytestBindings(source)});
  }
  const {source,rows}=stocks.get(stock),binding=source.registry.entries.find(e=>e.testName===label);
  const row=rows.get(binding.fingerprints.variant),logic=row.definition.logic;
  const states=diagnosePuzzle(logic).scenarios;
  // Exactly ten additional four-clue states close C/D's known coverage gap.
  if(['C','D'].includes(id))for(const omitted of logic.clues){
   const clues=logic.clues.filter(c=>c.id!==omitted.id),partial={...logic,clues};
   const local=localDeduction(partial),exact=projectRoutes(solvePuzzle(partial,{metrics:false,maxNodes:250000}).solutions);
   assertLocalSound(exact,local);states.push({clueIds:clues.map(c=>c.id),exact,local});
  }
  const compact=s=>({clueIds:s.clueIds,exact:{domains:s.exact.domains,transitions:s.exact.transitions,routeCount:s.exact.routeCount},
   local:{domains:s.local.domains,transitions:s.local.transitions,trace:s.local.trace.map(({before,after,...t})=>t)}});
  const name=id+'.jsonl',bytes=states.map(compact).map(JSON.stringify).join('\n')+'\n';files.set(name,bytes);
  const inputs=[`scripts/config/b2-playtest-${stock.toLowerCase()}.json`,source.registry.source+'/candidates.jsonl'];
  cases.push({id,label,puzzleId:row.definition.id,variant:row.fingerprints.variant,logic,givens:[],
   inputs:inputs.map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(ROOT,ref)))})),
   states:{path:OUTPUT+'/'+name,sha256:sha256(bytes),count:states.length}});
 }
 const implementation=['scripts/report-b2-progress-evidence.mjs','scripts/lib/b2-deduction.mjs',
  'scripts/lib/b2-local-deduction.mjs','src/engine/solver.mjs','src/engine/puzzle.mjs','src/engine/hex.mjs']
  .map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(ROOT,ref)))}));
 files.set('sources.json',JSON.stringify({format:'b2-progress-evidence-1',implementation,scope:'Four fixed existing cases; no stored answers passed to diagnosis.',cases},null,2)+'\n');
 return files;
}
export function main(argv=process.argv.slice(2)){
 assert(argv.length===1&&['--write','--check'].includes(argv[0]),'Usage: report-b2-progress-evidence.mjs --write|--check');
 const files=progressEvidenceFiles(),directory=path.join(ROOT,OUTPUT);
 if(argv[0]==='--write')fs.mkdirSync(directory,{recursive:true});
 for(const [name,bytes] of files){
  if(argv[0]==='--write')fs.writeFileSync(path.join(directory,name),bytes);
  else assert.equal(fs.readFileSync(path.join(directory,name),'utf8'),bytes,'Progress source changed: '+name);
 }
 return `B2 progress evidence: ${files.size} files ${argv[0]==='--write'?'written':'reproduced byte-for-byte'} (4 cases, 74 states).`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
