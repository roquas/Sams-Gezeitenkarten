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
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));
export const contentHash=row=>sha256(canonicalJson({definition:row.definition,assetPlacements:row.assetPlacements}));
export function readPlaytestSource(){
 const registry=read(REGISTRY),manifestBytes=fs.readFileSync(path.join(ROOT,registry.source,'manifest.json'));
 if(sha256(manifestBytes)!==registry.manifestSha256)throw Error('B2 source manifest changed');
 const manifest=JSON.parse(manifestBytes);
 if(manifest.experimentId!==registry.experimentId)throw Error('B2 experiment mismatch');
 const rows=fs.readFileSync(path.join(ROOT,registry.source,'candidates.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 return {registry,manifest,rows};
}
export function buildPlaytest({registry,manifest,rows}=readPlaytestSource()){
 const assert=(ok,message)=>{if(!ok)throw Error('B2 export: '+message);};
 assert(registry.registryVersion===1&&manifest.puzzleExperimentFormatVersion===2,'unsupported stock version');
 assert(manifest.experimentId===registry.experimentId,'experiment mismatch');
 const names=registry.entries.map(e=>e.testName),variants=registry.entries.map(e=>e.fingerprints.variant);
 assert(new Set(names).size===names.length&&names.every(n=>/^B2-S01-M\d{3}-[A-E][1-5]-R\d+-V\d+$/.test(n)),'invalid or duplicate test names');
 assert(new Set(variants).size===variants.length,'duplicate variant binding');
 const byVariant=new Map(rows.map(r=>[r.fingerprints.variant,r]));
 assert(byVariant.size===rows.length&&rows.length===registry.entries.length,'candidate inventory mismatch');
 const catalog=read('puzzles/manifest.json'),assetLibrary=read('assets/catalog/library.json');
 const background=manifest.input.b1Manifest.input.batchManifest.provenance.backgroundId;
 const files=new Map(),entries=[];
 for(const entry of [...registry.entries].sort((a,b)=>a.testName.localeCompare(b.testName))){
  const row=byVariant.get(entry.fingerprints.variant);
  assert(row&&row.experimentId===registry.experimentId&&row.attemptId===entry.attemptId,'missing or rebound candidate '+entry.testName);
  assert(contentHash(row)===entry.contentSha256,'candidate content changed: '+entry.testName);
  assert(row.effectKey===entry.effectKey&&isDeepStrictEqual(row.fingerprints,entry.fingerprints),'identity changed: '+entry.testName);
  assert(isDeepStrictEqual(logicalFingerprints(row.definition),entry.fingerprints),'fingerprint mismatch: '+entry.testName);
  const {logic}=row.definition;
  const internal={...row.definition,id:entry.testName,presentation:{title:entry.testName,
   intro:[`Entwicklungstest ${entry.testName}. Start: ${logic.start}.`,
    'Sachliche Hinweise ohne Erzähltext. Hexabstand zu einem Ort: kleinster geometrischer Abstand zu einer seiner Zellen; Land verlängert ihn nicht.'],
   objectNames:Object.fromEntries(logic.map.objects.map(o=>[o.id,`Ort ${o.id}`])),
   clueTexts:Object.fromEntries(logic.clues.map(c=>[c.id,technicalClueText(c,logic.map)])),
   hints:[],background,assetPlacements:row.assetPlacements}};
  const identity=Object.fromEntries(['mapStructure','instance','variant'].map((key,i)=>[
   ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+entry.fingerprints[key].split(':')[1]]));
  const dto=projectPublicPuzzle(internal,{identity,assetLibrary});
  const compiled=compilePuzzle(dto.puzzle,{assetLibrary});
  assert(isDeepStrictEqual(compiled.solution,row.definition.solution),'solution mismatch: '+entry.testName);
  files.set(entry.testName+'.json',JSON.stringify(dto,null,2)+'\n');
  entries.push({id:entry.testName,title:entry.testName,path:entry.testName+'.json',kind:'test'});
 }
 const exported=validateManifest({schemaVersion:2,defaultId:entries[0]?.id??catalog.defaultId,
  assetCatalog:'../../assets/catalog/library.json',resourceBase:'../../',
  puzzles:[...catalog.puzzles.map(e=>({...e,path:'../../puzzles/'+e.path})),...entries]});
 files.set('manifest.json',JSON.stringify(exported,null,2)+'\n');
 return files;
}
