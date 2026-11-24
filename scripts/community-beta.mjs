// Repackage existing S04-C cases only. No generator, search or clue changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {canonicalJson, sha256} from './lib/content-hash.mjs';
import {logicalFingerprints} from './lib/publication-archive.mjs';
import {technicalClueText} from './lib/clue-text.mjs';
import {projectPublicPuzzle} from '../src/puzzles/public.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
import {validateManifest} from '../src/puzzles/loader.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
export const SOURCE='content/community-beta/s04-c-v1';
export const OUTPUT='puzzles/community-s04-c-v1';
const json=value=>JSON.stringify(value,null,2)+'\n';
const read=ref=>JSON.parse(fs.readFileSync(path.join(ROOT,ref),'utf8'));

export function buildCommunityBeta({release=false,editorial=read(SOURCE+'/editorial.json')}={}){
 const sourceBytes=fs.readFileSync(path.join(ROOT,SOURCE,'cases.json'));
 const migration=read(SOURCE+'/migration.json'),source=JSON.parse(sourceBytes);
 assert.equal(sha256(sourceBytes),migration.casesSha256,'Original S04-C handoff changed');
 const selection=read(SOURCE+'/selection.json');
 const ids=Array.from({length:15},(_,i)=>'C-'+String(i+1).padStart(2,'0'));
 assert.deepEqual(source.cases.map(c=>c.id),ids);
 assert.deepEqual(editorial.cases.map(c=>c.id).sort(),ids);
 assert.deepEqual([...selection.order].sort(),ids);
 assert.deepEqual(selection.entries.map(c=>c.id).sort(),ids);
 const library=read('assets/catalog/library.json'),files=new Map(),entries=[];
 const sourceById=new Map(source.cases.map(c=>[c.id,c]));
 const editorialById=new Map(editorial.cases.map(c=>[c.id,c]));
 for(const id of selection.order){
  const row=sourceById.get(id),edit=editorialById.get(id),{logic}=row.definition;
  assert.deepEqual(logicalFingerprints(row.definition),row.fingerprints,'Logical identity changed: '+id);
  assert.ok(['pending','draft','approved'].includes(edit.status),'Editorial status: '+id);
  assert.ok(Number.isSafeInteger(edit.dataVersion)&&edit.dataVersion>=row.definition.dataVersion);
  if(edit.presentation){
   assert.ok(edit.dataVersion>row.definition.dataVersion,'Flavor needs a new dataVersion: '+id);
   for(const key of ['title','intro','objectNames','clueTexts'])assert.ok(edit.presentation[key],'Missing '+key+': '+id);
   assert.deepEqual(Object.keys(edit.presentation.clueTexts).sort(),logic.clues.map(c=>c.id).sort());
   assert.deepEqual(Object.keys(edit.presentation.objectNames).sort(),logic.map.objects.map(o=>o.id).sort());
  }
  if(release||edit.status==='approved'){
   assert.equal(edit.status,'approved','Flavor not approved: '+id);
   assert.ok(edit.presentation,'Missing flavor: '+id);
   const review=edit.semanticReview;
   assert.ok(review?.reviewer?.trim()&&review.introAndNamesChecked===true,'Missing semantic review: '+id);
   assert.equal(review.presentationSha256,sha256(canonicalJson(edit.presentation)),'Stale semantic review: '+id);
   assert.deepEqual([...review.clueIds].sort(),logic.clues.map(c=>c.id).sort(),'Review every clue: '+id);
  }
  const presentation=edit.presentation??{
   title:id,
   intro:['Redaktionelle Vorschau – Podcasttexte und Bedeutungsprüfung stehen noch aus.',
    'Hexabstand zu einem Ort: kleinster geometrischer Abstand zu einer seiner Zellen; Land verlängert ihn nicht.'],
   objectNames:Object.fromEntries(logic.map.objects.map(o=>[o.id,'Ort '+o.id])),
   clueTexts:Object.fromEntries(logic.clues.map(c=>[c.id,technicalClueText(c,logic.map)]))
  };
  // Background and assignments stay attached to their original map objects.
  const internal={...row.definition,id,dataVersion:edit.dataVersion,presentation:{...presentation,
   hints:[],background:editorial.background,assetPlacements:row.assetPlacements}};
  const identity=Object.fromEntries(['mapStructure','instance','variant'].map((key,i)=>[
   ['mapStructureId','instanceId','variantId'][i],['map','inst','var'][i]+'-'+row.fingerprints[key].split(':')[1]]));
  const dto=projectPublicPuzzle(internal,{identity,assetLibrary:library});
  const compiled=compilePuzzle(dto.puzzle,{assetLibrary:library});
  assert.deepEqual(compiled.solution,row.definition.solution,'Target route changed: '+id);
  files.set(id+'.json',json(dto));
  entries.push({id,title:presentation.title,path:id+'.json',kind:'test'});
 }
 files.set('manifest.json',json(validateManifest({schemaVersion:2,defaultId:selection.order[0],
  assetCatalog:'../../assets/catalog/library.json',resourceBase:'../../',puzzles:entries})));
 files.set('inventory.json',json({schemaVersion:1,scope:'community:S04-C-v1',
  releaseReady:editorial.cases.every(c=>c.status==='approved'),
  files:[...files].map(([name,bytes])=>({path:name,bytes:Buffer.byteLength(bytes),sha256:sha256(bytes)}))}));
 return files;
}

export function main(args=process.argv.slice(2)){
 assert.ok(args.length<=1&&args.every(a=>['--write','--release-check'].includes(a)),
  'Usage: node scripts/community-beta.mjs [--write|--release-check]');
 const files=buildCommunityBeta({release:args.includes('--release-check')});
 const out=path.join(ROOT,OUTPUT);
 if(args.includes('--write')){
  fs.mkdirSync(out,{recursive:true});
  for(const [name,bytes] of files)fs.writeFileSync(path.join(out,name),bytes);
 }
 assert.deepEqual(fs.readdirSync(out).sort(),[...files.keys()].sort(),'Unexpected catalog files');
 for(const [name,bytes] of files)assert.equal(fs.readFileSync(path.join(out,name),'utf8'),bytes,'Stale export: '+name);
 return 'S04-C: 15 existing cases validated; '+(args.includes('--release-check')?'flavor approvals checked.':'check editorial.json before a community release.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
