// Read-only offline verification and optional bounded profiling. Writes no puzzle.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {validateDefinition} from './lib/puzzle-contract.mjs';
import {analyzeDefinition,checkIrredundancy} from './lib/puzzle-analysis.mjs';
import {createArchiveProjector} from './lib/archive-projection.mjs';
import {validatePublicPuzzle} from './lib/public-puzzle.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const archive=read('archive/publications-v1.json'),options={rulesVersion:'gezeitenkarten-1'};
const projector=createArchiveProjector(archive,{readBytes:(path,commit)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:root,maxBuffer:32*1024*1024})});
const historical=archive.legacyAliases.map(alias=>{
 const publication=archive.publications.find(p=>p.publicationId===alias.publicationId);
 const document=read(publication.source.path),validation=validateDefinition(document,options);
 const analysis=checkIrredundancy(document,options);
 if(analysis.status!=='unique'||analysis.target.status!=='match')throw Error(`Historical analysis failed: ${document.id}`);
 const projected=projector.project(publication.publicationId);validatePublicPuzzle(projected);
 return {id:document.id,validation,status:analysis.status,count:analysis.count,target:analysis.target.status,
  irredundant:analysis.irredundant,diagnostics:analysis.diagnostics,identity:projected.identity};
});
const report={historical};
if(process.argv.includes('--benchmark')){
 const reference=read('puzzles/reference-3.6.json');
 const cases={ambiguous:{schemaVersion:1,dataVersion:1,logic:{...reference.logic,clues:[{id:'P',type:'position',hour:0,cell:reference.logic.start}]}},
  irredundant:{...reference,logic:{...reference.logic,clues:reference.logic.clues.filter(c=>c.id!=='I')}}};
 report.benchmark=Object.entries(cases).flatMap(([name,definition])=>[false,true].map(detailed=>{
  const iterations=100;let last;
  for(let i=0;i<10;i++)analyzeDefinition(definition,{...options,detailed,irredundancy:true});
  const start=performance.now();
  for(let i=0;i<iterations;i++)last=analyzeDefinition(definition,{...options,detailed,irredundancy:true});
  return {name,detailed,iterations,milliseconds:performance.now()-start,status:last.status,count:last.count,countExact:last.countExact,search:last.search};
 }));
}
console.log(JSON.stringify(report,null,2));
