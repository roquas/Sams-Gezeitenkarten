import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256,contentFingerprint,logicalFingerprints,snapshotFingerprint,
 publicationFingerprint,validateArchive,resolveLegacy,resolveContentId} from '../../scripts/lib/publication-archive.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=path=>readFileSync(new URL('../../'+path,import.meta.url));
const archive=JSON.parse(read('archive/publications-v1.json'));
const historicalIds=['reference-3.6','test-navigation','quittung-nombreo','ankerbuch-tesoro'];
const reference=JSON.parse(read('puzzles/reference-3.6.json'));
const clone=value=>structuredClone(value);
const cache=new Map();
const pinned=(path,commit)=>{
 const key=commit+':'+path;
 if(!cache.has(key))cache.set(key,execFileSync('git',['show',key],{cwd:root,maxBuffer:32*1024*1024}));
 return cache.get(key);
};
const check=(manifest,options={})=>validateArchive(manifest,{readBytes:pinned,...options});
const changed=(document,mutate)=>{const result=clone(document);mutate(result);return logicalFingerprints(result);};
const tiny={schemaVersion:1,dataVersion:1,id:'identity-fixture',logic:{grid:{columns:5,rows:5},start:'A1',steps:1,
 blocked:[],places:{},clues:[{id:'one',type:'position',hour:0,cell:'A1'}]},
 presentation:{title:'Fixture',intro:['Fixture'],places:{},clues:{one:'At the start'},hints:[],background:'meer-pergament',overlays:[]},solution:['A1','B1']};
const reverseKeys=value=>Array.isArray(value)?value.map(reverseKeys):value&&typeof value==='object'?
 Object.fromEntries(Object.entries(value).reverse().map(([k,v])=>[k,reverseKeys(v)])):value;

test('canonical JSON and domain-separated SHA-256 have fixed independent vectors',()=>{
 assert.equal(canonicalJson({z:[3,1],a:{b:2,a:'ä'}}),'{"a":{"a":"ä","b":2},"z":[3,1]}');
 assert.equal(canonicalJson({'10':1,'2':2}),'{"10":1,"2":2}');
 assert.equal(sha256('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(contentFingerprint('map',{}),'gk-map-v1-sha256:'+sha256(Buffer.from('gezeitenkarten-content/v1/map\0{}','utf8')));
 assert.notEqual(contentFingerprint('map',{}),contentFingerprint('instance',{}));
 for(const value of [undefined,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1,new Date(),[undefined],Array(1)])assert.throws(()=>canonicalJson(value));
 assert.throws(()=>contentFingerprint('unknown',{}));
});

test('identical contents, object-key permutations and fresh JSON round trips have identical fingerprints',()=>{
 assert.deepEqual(logicalFingerprints(reference),logicalFingerprints(reverseKeys(reference)));
 assert.deepEqual(logicalFingerprints(reference),logicalFingerprints(JSON.parse(JSON.stringify(reference))));
 assert.deepEqual(logicalFingerprints(reference),
  Object.fromEntries(Object.entries(archive.publications[0].fingerprints).filter(([k])=>k!=='publication')));
});

test('blocked cells, place cells and place dictionary order are canonical sets',()=>{
 const before=logicalFingerprints(reference);
 const after=changed(reference,p=>{
  p.logic.blocked.reverse();
  p.logic.places=Object.fromEntries(Object.entries(p.logic.places).reverse());
  for(const place of Object.values(p.logic.places))place.cells.reverse();
 });
 assert.deepEqual(after,before);
});

test('blocked cell, local place ID, place kind and logical place cell affect the map',()=>{
 const before=logicalFingerprints(reference);
 for(const mutate of [p=>p.logic.blocked.push('A5'),p=>p.logic.places.reef.cells=['A4'],
  p=>p.logic.places.reef.kind='landmark',p=>{
   p.logic.places.shoal=p.logic.places.reef;delete p.logic.places.reef;
   p.presentation.places.shoal=p.presentation.places.reef;delete p.presentation.places.reef;
  }]){
  const after=changed(reference,mutate);
  for(const key of ['mapStructure','instance','variant'])assert.notEqual(after[key],before[key]);
 }
});

test('different starts, target routes and lengths retain the map but change the instance',()=>{
 const before=logicalFingerprints(tiny);
 for(const mutate of [p=>{p.logic.start='B1';p.solution=['B1','A1'];p.logic.clues[0].cell='B1';},
  p=>p.solution=['A1','A2'],p=>{p.logic.steps=2;p.solution.push('C1');}]){
  const after=changed(tiny,mutate);
  assert.equal(after.mapStructure,before.mapStructure);
  assert.notEqual(after.instance,before.instance);assert.notEqual(after.variant,before.variant);
 }
});

test('route positions remain ordered in the canonical instance content',()=>{
 // Two legal routes, same start and same visited-cell set.
 const p=clone(tiny);p.logic.steps=2;p.solution=['A1','B1','A2'];
 const after=changed(p,q=>q.solution=['A1','A2','B1']);
 assert.notEqual(after.instance,logicalFingerprints(p).instance);
});

test('changed base constraints and duplicate base constraints produce new variants',()=>{
 const before=logicalFingerprints(reference);
 for(const mutate of [p=>{p.logic.clues.shift();delete p.presentation.clues.I;},p=>{
  p.logic.clues.push({...p.logic.clues[0],id:'duplicate'});p.presentation.clues.duplicate='Duplicate';
 }]){
  const after=changed(reference,mutate);
  assert.equal(after.mapStructure,before.mapStructure);assert.equal(after.instance,before.instance);
  assert.notEqual(after.variant,before.variant);
 }
});

test('clue ordering and editorial clue IDs do not change the structured variant',()=>{
 const after=changed(reference,p=>{
  p.logic.clues.reverse();p.presentation.clues={};
  p.logic.clues.forEach((c,i)=>{c.id='new'+i;p.presentation.clues[c.id]='Reworded';});
 });
 assert.deepEqual(after,logicalFingerprints(reference));
});

test('help, texts, illustration layout, document IDs, data versions and generation metadata are not logical identities',()=>{
 const after=changed(reference,p=>{
  p.presentation.hints.push('Additional help: hour 1 is E3.');
  p.presentation.title='New title';p.presentation.intro=['New intro'];p.presentation.places.reef='New name';
  p.presentation.clues.I='New wording';p.presentation.overlays[0].w+=1;
  p.resultTexts={correct:'New result'};p.metadata.source='generator-v99 at another time';
  p.id='another-editorial-id';p.dataVersion=2;
 });
 assert.deepEqual(after,logicalFingerprints(reference));
});

test('rules versions are separated in instances and variants; unsupported semantics are not publishable',()=>{
 const first=logicalFingerprints(reference),next=logicalFingerprints(reference,'gezeitenkarten-2');
 assert.equal(next.mapStructure,first.mapStructure);assert.notEqual(next.instance,first.instance);assert.notEqual(next.variant,first.variant);
 const manifest=clone(archive);manifest.publications[0].rulesVersion='gezeitenkarten-2';
 assert.throws(()=>check(manifest),/erwartet/);
});

test('identity calculation rejects malformed puzzles and missing or contradictory target routes',()=>{
 for(const mutate of [p=>delete p.solution,p=>p.solution.reverse(),p=>p.logic.clues[0].type='unknown',p=>p.logic.blocked.push('B3')]){
  const p=clone(reference);mutate(p);assert.throws(()=>logicalFingerprints(p));
 }
});

test('historical archive validates against the pinned Git bytes and freezes all original mappings',()=>{
 assert.equal(check(archive),archive);
 // Only these historical rows are frozen; future snapshots/publications may be appended.
 const frozen={snapshots:archive.snapshots.filter(s=>s.snapshotId==='snapshot-historical-main-f01'),
  publications:historicalIds.map(id=>resolveLegacy(archive,id)),legacyAliases:historicalIds.map(id=>archive.legacyAliases.find(a=>a.id===id))};
 assert.equal(sha256(canonicalJson(frozen)),'f67a5a678e8ca187f0ab6d5b96a10f31ebae4c7c6313b1bcb78927d3fc5dcc52');
 for(const id of historicalIds){
  const entry=resolveLegacy(archive,id);
  assert.equal(entry.publicationId,`pub-historical-${id}-r1`);
  assert.equal(entry.mapStructureId,`map-historical-${id}`);assert.equal(entry.instanceId,`inst-historical-${id}`);assert.equal(entry.variantId,`var-historical-${id}`);
  assert.equal(entry.source.path,`puzzles/${id}.json`);
  assert.equal(sha256(read(entry.source.path)),entry.source.sha256,id+' remains byte-identical');
 }
 assert.equal(resolveLegacy(archive,'unknown'),undefined);assert.equal(resolveLegacy(archive,historicalIds[0],1,2),undefined);
});

test('new representation revisions append a publication and retain all three logical IDs',()=>{
 const manifest=clone(archive),entry=clone(manifest.publications[0]);
 const snapshot=clone(manifest.snapshots[0]);snapshot.snapshotId='snapshot-text-revision';
 const source=JSON.parse(pinned(entry.source.path,snapshot.commit));source.presentation.title='Revised title';
 const bytes=Buffer.from(JSON.stringify(source));
 snapshot.files.find(f=>f.path===entry.source.path).sha256=sha256(bytes);
 snapshot.fingerprint=snapshotFingerprint(snapshot);
 entry.publicationId='pub-text-revision';entry.revision=2;entry.snapshotId=snapshot.snapshotId;entry.source.sha256=sha256(bytes);
 entry.fingerprints.publication=publicationFingerprint(entry,snapshot);
 manifest.snapshots.push(snapshot);manifest.publications.push(entry);
 const reader=(path,commit)=>path===entry.source.path?bytes:pinned(path,commit);
 // Separate commit represents the new source tree; a byte reader must distinguish trees.
 snapshot.commit='a'.repeat(40);snapshot.fingerprint=snapshotFingerprint(snapshot);
 entry.fingerprints.publication=publicationFingerprint(entry,snapshot);
 check(manifest,{previous:archive,readBytes:(path,commit)=>commit===snapshot.commit?reader(path,archive.snapshots[0].commit):pinned(path,commit)});
 for(const key of ['mapStructureId','instanceId','variantId'])assert.equal(entry[key],archive.publications[0][key]);
 assert.notEqual(entry.fingerprints.publication,archive.publications[0].fingerprints.publication);
 assert.equal(resolveLegacy(manifest,'reference-3.6').publicationId,archive.publications[0].publicationId);
});

test('manifest rejects duplicate IDs, missing references, conflicting bindings and unsupported fields',()=>{
 const cases=[
  [m=>m.publications.push(clone(m.publications[0])),/duplicate publication/],
  [m=>m.snapshots.push(clone(m.snapshots[0])),/duplicate snapshot/],
  [m=>m.legacyAliases.push(clone(m.legacyAliases[0])),/duplicate legacy/],
  [m=>m.publications[0].snapshotId='snapshot-missing',/missing snapshot/],
  [m=>m.legacyAliases[0].publicationId='pub-missing',/missing publication/],
  [m=>m.legacyAliases[0].id='wrong-id',/legacy alias/],
  [m=>m.publications[0].source.path='puzzles/missing.json',/source absent/],
  [m=>m.publications[0].source.sha256='0'.repeat(64),/source fingerprint/],
  [m=>m.publications[0].dataVersion=2,/source versions/],
  [m=>m.publications[0].fingerprints.variant=m.publications[1].fingerprints.variant,/variant fingerprint/],
  [m=>m.publications[1].mapStructureId=m.publications[0].mapStructureId,/conflicting identity/],
  [m=>m.publications[0].packageId='daily',/unbekanntes Feld/],
  [m=>m.archiveSchemaVersion=2,/erwartet/],
  [m=>m.snapshots[0].files[0].path='../outside',/unsafe snapshot path/]
 ];
 for(const [mutate,error] of cases){const m=clone(archive);mutate(m);assert.throws(()=>check(m),error);}
});

test('manifest rejects mutated snapshot bytes, hashes, paths and publication fingerprints',()=>{
 assert.throws(()=>check(archive,{readBytes:()=>Buffer.from('changed')}),/snapshot bytes/);
 for(const [mutate,error] of [
  [m=>m.snapshots[0].files.push(clone(m.snapshots[0].files[0])),/duplicate snapshot path/],
  [m=>m.snapshots[0].fingerprint='gk-snapshot-v1-sha256:'+'0'.repeat(64),/snapshot fingerprint/],
  [m=>m.publications[0].revision=2,/publication fingerprint/]
 ]){const m=clone(archive);mutate(m);assert.throws(()=>check(m),error);}
});

test('append-only verification prevents rebinding stable IDs and dropping accepted publications or aliases',()=>{
 for(const mutate of [m=>m.publications.shift(),m=>m.legacyAliases.shift(),
  m=>m.publications[0].variantId='var-reassigned',m=>m.snapshots[0].snapshotId='snapshot-reassigned']){
  const m=clone(archive);mutate(m);assert.throws(()=>check(m,{previous:archive}));
 }
 // A fully self-consistent ID reallocation still must not overwrite accepted records.
 const m=clone(archive);m.publications[0].variantId='var-reassigned';
 assert.doesNotThrow(()=>check(m));assert.throws(()=>check(m,{previous:archive}),/frozen publications/);
});

test('a later registration cannot insert an older revision for an already published variant',()=>{
 const previous=clone(archive),snapshot=previous.snapshots[0];
 previous.publications[0].revision=3;
 previous.publications[0].fingerprints.publication=publicationFingerprint(previous.publications[0],snapshot);
 check(previous);
 const next=clone(previous),entry=clone(next.publications[0]);
 entry.publicationId='pub-older-revision';entry.revision=2;
 entry.fingerprints.publication=publicationFingerprint(entry,snapshot);next.publications.push(entry);
 assert.doesNotThrow(()=>check(next));
 assert.throws(()=>check(next,{previous}),/revision must exceed 3/);
});

test('paths and snapshot inventory order do not determine logical identities or snapshot order fingerprints',()=>{
 const snapshot=clone(archive.snapshots[0]);snapshot.files.reverse();
 assert.equal(snapshotFingerprint(snapshot),archive.snapshots[0].fingerprint);
 assert.deepEqual(logicalFingerprints(JSON.parse(read('puzzles/reference-3.6.json'))),logicalFingerprints(reference));
});

test('regenerated canonical content resolves to persisted IDs regardless of registration order',()=>{
 const manifest=clone(archive);manifest.publications.reverse();
 const fingerprints=logicalFingerprints(reference);
 for(const [domain,field] of [['mapStructure','mapStructureId'],['instance','instanceId'],['variant','variantId']]){
  assert.equal(resolveContentId(manifest,domain,fingerprints[domain]),archive.publications[0][field]);
 }
 assert.equal(resolveContentId(manifest,'variant','unknown'),undefined);
});

test('the static package includes the original runtime closure and excludes archive metadata/tooling',()=>{
 const script=`import importlib.util, json, pathlib
s=importlib.util.spec_from_file_location('packager','scripts/package.py')
m=importlib.util.module_from_spec(s)
s.loader.exec_module(m)
print(json.dumps(m.collect(pathlib.Path.cwd())))`;
 // Keep the existing packager as the source of deployment dependency discovery.
 const files=JSON.parse(execFileSync('python3',['-c',script],{cwd:root,encoding:'utf8'}));
 assert.ok(files.every(path=>!path.startsWith('archive/')&&!path.startsWith('scripts/')));
 assert.deepEqual(files,archive.snapshots[0].files.map(f=>f.path));
});

test('the unchanged browser loader still resolves all four historical IDs through the original manifest',async()=>{
 const manifestUrl=new URL('https://fixture.invalid/puzzles/manifest.json');
 const loader=createPuzzleLoader({manifestUrl,fetcher:async url=>({ok:true,json:async()=>JSON.parse(read('puzzles/'+new URL(url).pathname.split('/').at(-1)))})});
 assert.deepEqual((await loader.manifest()).puzzles.map(p=>p.id),historicalIds);
 for(const id of historicalIds){const puzzle=await loader.load(id);assert.equal(puzzle.id,id);assert.equal(puzzle.analysis.status,'unique');}
});
