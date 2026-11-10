// Offline allowlist adapter: private experiment rows never enter the web package.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {canonicalJson,sha256} from './content-hash.mjs';
import {logicalFingerprints} from './publication-archive.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {validateManifest} from '../../src/puzzles/loader.mjs';
import {technicalClueText} from './clue-text.mjs';

export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const REGISTRY='scripts/config/b2-playtest-s01.json';
export const OUTPUT='.dev/b2';
// Explicit development stocks, not a general registry or a production catalog.
const STOCKS={S01:{registry:REGISTRY,output:OUTPUT},
 S02:{registry:'scripts/config/b2-playtest-s02.json',output:'.dev/b2-s02'},
 BC:{registry:'scripts/config/b2-playtest-bc.json',output:'.dev/b2-bc'},
 POSITIVE:{output:'.dev/b2-positive'},
 'POSITIVE-V2':{output:'.dev/b2-positive-v2'}};
export function playtestStock(stock='S01'){
 if(!Object.hasOwn(STOCKS,stock))throw Error('Unknown B2 stock: '+stock+' (expected S01, S02, BC, POSITIVE or POSITIVE-V2)');
 return {...STOCKS[stock]};
}
export function parsePlaytestArgs(argv){
 let stock='S01',explicit=false;const args=[];
 for(let i=0;i<argv.length;i++){
  if(argv[i]!=='--stock'){args.push(argv[i]);continue;}
  if(explicit||!argv[i+1])throw Error('Expected one --stock S01, S02, BC, POSITIVE or POSITIVE-V2');
  stock=argv[++i];explicit=true;
 }
 playtestStock(stock);return {stock,args};
}
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));
export const contentHash=row=>sha256(canonicalJson({definition:row.definition,assetPlacements:row.assetPlacements}));
export function readPlaytestSource(stock='S01'){
 if(['POSITIVE','POSITIVE-V2'].includes(stock))throw Error('Editorial reference: use scripts/report-b2-'+stock.toLowerCase()+'.mjs for private evidence.');
 const registry=read(playtestStock(stock).registry),manifestBytes=fs.readFileSync(path.join(ROOT,registry.source,'manifest.json'));
 if(registry.stockId!=='B2-'+stock)throw Error('B2 stock mismatch');
 if(sha256(manifestBytes)!==registry.manifestSha256)throw Error('B2 source manifest changed');
 const manifest=JSON.parse(manifestBytes);
 if(manifest.experimentId!==registry.experimentId)throw Error('B2 experiment mismatch');
 const candidateBytes=fs.readFileSync(path.join(ROOT,registry.source,'candidates.jsonl'));
 let rows=candidateBytes.toString('utf8').trim().split('\n').map(JSON.parse);
 if(stock==='BC'){
  if(sha256(candidateBytes)!==registry.candidatesSha256||rows.length!==registry.sourceCandidateCount)
   throw Error('B2 comparison candidate inventory changed');
  const byId=new Map(rows.map(row=>[row.candidateId,row]));
  if(byId.size!==rows.length)throw Error('B2 comparison has duplicate candidate identities');
  rows=registry.entries.map(entry=>{
   const row=byId.get(entry.candidateId);
   if(!row)throw Error('B2 comparison candidate missing: '+entry.testName);
   return row;
  });
 }
 return {registry,manifest,rows};
}
export function validatePlaytestBindings({registry,manifest,rows}){
 const assert=(ok,message)=>{if(!ok)throw Error('B2 export: '+message);};
 const comparison=registry.stockId==='B2-BC';
 assert(comparison?registry.registryVersion===2&&manifest.protocol==='b2-search-comparison-1':
  registry.registryVersion===1&&manifest.puzzleExperimentFormatVersion===2,'unsupported stock version');
 assert(['B2-S01','B2-S02','B2-BC'].includes(registry.stockId),'unsupported stock');
 assert(manifest.experimentId===registry.experimentId,'experiment mismatch');
 const names=registry.entries.map(e=>e.testName),variants=registry.entries.map(e=>e.fingerprints.variant);
 const namePattern=new RegExp('^'+registry.stockId+(comparison?'-T\\d{2}':'')+'-M\\d{3}-[A-E][1-5]-R\\d+'+(comparison?'':'-V\\d+')+'$');
 assert(new Set(names).size===names.length&&names.every(n=>namePattern.test(n)),'invalid or duplicate test names');
 assert(new Set(variants).size===variants.length,'duplicate variant binding');
 const byVariant=new Map(rows.map(r=>[r.fingerprints.variant,r]));
 assert(byVariant.size===rows.length&&rows.length===registry.entries.length,'candidate inventory mismatch');
 for(const entry of [...registry.entries].sort((a,b)=>a.testName.localeCompare(b.testName))){
  const row=byVariant.get(entry.fingerprints.variant);
  assert(row&&row.experimentId===registry.experimentId&&row.attemptId===entry.attemptId,'missing or rebound candidate '+entry.testName);
  if(comparison){
   assert(['B','C'].includes(entry.arm)&&row.attemptId===manifest.experimentId+'/'+entry.arm+'/'+entry.sourceTarget&&
    row.candidateId===row.attemptId+'/'+row.fingerprints.variant&&row.candidateId===entry.candidateId&&
    row.sourceTarget===entry.sourceTarget&&row.sourceAttemptId===entry.sourceAttemptId,'comparison identity changed: '+entry.testName);
   assert(sha256(JSON.stringify(row))===entry.recordSha256,'comparison record changed: '+entry.testName);
   assert(entry.testName.endsWith(entry.sourceTarget.match(/M\d{3}-[A-E][1-5]-R\d+/)?.[0]),'comparison target name mismatch');
  }
  assert(contentHash(row)===entry.contentSha256,'candidate content changed: '+entry.testName);
  assert(row.effectKey===entry.effectKey&&isDeepStrictEqual(row.fingerprints,entry.fingerprints),'identity changed: '+entry.testName);
  assert(isDeepStrictEqual(logicalFingerprints(row.definition),entry.fingerprints),'fingerprint mismatch: '+entry.testName);
 }
 return byVariant;
}
export function buildPlaytest(source=readPlaytestSource()){
 const {registry,manifest}=source,byVariant=validatePlaytestBindings(source);
 const catalog=read('puzzles/manifest.json'),assetLibrary=read('assets/catalog/library.json');
 const background=(manifest.sourceManifest??manifest).input.b1Manifest.input.batchManifest.provenance.backgroundId;
 const files=new Map(),entries=[];
 for(const entry of [...registry.entries].sort((a,b)=>a.testName.localeCompare(b.testName))){
  const row=byVariant.get(entry.fingerprints.variant);
  const {logic}=row.definition;
  const internal={...row.definition,id:entry.testName,presentation:{title:entry.testName,
   intro:[registry.stockId==='B2-BC'?`Entwicklungstest aus dem Vergleichsbestand. Start: ${logic.start}.`:
    `Entwicklungstest ${entry.testName}. Start: ${logic.start}.`,
    'Sachliche Hinweise ohne Erzähltext. Hexabstand zu einem Ort: kleinster geometrischer Abstand zu einer seiner Zellen; Land verlängert ihn nicht.'],
   objectNames:Object.fromEntries(logic.map.objects.map(o=>[o.id,`Ort ${o.id}`])),
   clueTexts:Object.fromEntries(logic.clues.map(c=>[c.id,technicalClueText(c,logic.map)])),
   hints:[],background,assetPlacements:row.assetPlacements}};
  const identity=Object.fromEntries(['mapStructure','instance','variant'].map((key,i)=>[
   ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+entry.fingerprints[key].split(':')[1]]));
  const dto=projectPublicPuzzle(internal,{identity,assetLibrary});
  const compiled=compilePuzzle(dto.puzzle,{assetLibrary});
  if(!isDeepStrictEqual(compiled.solution,row.definition.solution))throw Error('B2 export: solution mismatch: '+entry.testName);
  files.set(entry.testName+'.json',JSON.stringify(dto,null,2)+'\n');
  entries.push({id:entry.testName,title:entry.testName,path:entry.testName+'.json',kind:'test'});
 }
 const exported=validateManifest({schemaVersion:2,defaultId:entries[0]?.id??catalog.defaultId,
  assetCatalog:'../../assets/catalog/library.json',resourceBase:'../../',
  puzzles:[...catalog.puzzles.map(e=>({...e,path:'../../puzzles/'+e.path})),...entries]});
 files.set('manifest.json',JSON.stringify(exported,null,2)+'\n');
 return files;
}
