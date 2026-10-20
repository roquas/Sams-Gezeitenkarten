import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {logicalFingerprints,sha256,snapshotFingerprint,publicationFingerprint,validateArchive} from '../../scripts/lib/publication-archive.mjs';
import {createArchiveProjector} from '../../scripts/lib/archive-projection.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=path=>readFileSync(new URL('../../'+path,import.meta.url));
const reference=JSON.parse(read('puzzles/reference-3.6.json'));
const archive=JSON.parse(read('archive/publications-v1.json'));
const catalog=JSON.parse(read('assets/catalog/library.json'));
const beacon='navigation.lighthouse.h1.offcenter-beacon.v1';
const catalogPath='assets/catalog/library.json';
const clone=value=>structuredClone(value);
const cache=new Map();
const pinned=(path,commit)=>{
 const key=commit+':'+path;
 if(!cache.has(key))cache.set(key,execFileSync('git',['show',key],{cwd:root,maxBuffer:32*1024*1024}));
 return cache.get(key);
};
const placed=()=>{
 const document=clone(reference);
 document.presentation.assetBackground='sea-blue-01';
 document.presentation.assetPlacements=[{id:'beacon',assetId:beacon,anchor:'A1'}];
 return document;
};
function revision({document=placed(),library=clone(catalog),suffix='a',revision=2,replaceBytes}={}){
 const manifest=clone(archive),entry=clone(manifest.publications[0]);
 const bytes=new Map([catalogPath,...library.assets.map(a=>a.image.path),...library.backgrounds.map(b=>b.image)]
  .map(path=>[path,read(path)]));
 bytes.set(catalogPath,Buffer.from(JSON.stringify(library)));
 bytes.set(entry.source.path,Buffer.from(JSON.stringify(document)));
 replaceBytes?.(bytes);
 const snapshot={snapshotId:'snapshot-assets-'+suffix,commit:suffix.repeat(40),
  files:[...bytes].map(([path,data])=>({path,sha256:sha256(data)}))};
 snapshot.fingerprint=snapshotFingerprint(snapshot);
 Object.assign(entry,{publicationId:'pub-assets-'+suffix,revision,snapshotId:snapshot.snapshotId,
  source:{path:entry.source.path,sha256:sha256(bytes.get(entry.source.path))}});
 // The expected logical identities come from the unchanged reference, not the code under test's placement path.
 entry.fingerprints={...logicalFingerprints(reference)};
 entry.fingerprints.publication=publicationFingerprint(entry,snapshot);
 manifest.snapshots.push(snapshot);manifest.publications.push(entry);
 const readBytes=(path,commit)=>commit===snapshot.commit?bytes.get(path):pinned(path,commit);
 return {manifest,entry,snapshot,bytes,readBytes};
}
const check=f=>validateArchive(f.manifest,{readBytes:f.readBytes,previous:archive});
function reseal(f){
 f.snapshot.fingerprint=snapshotFingerprint(f.snapshot);
 f.entry.fingerprints.publication=publicationFingerprint(f.entry,f.snapshot);
}

test('approved lighthouse placements compile and retain all logical fingerprints across graphic changes',()=>{
 const document=placed();
 assert.equal(compilePuzzle(document,{assetLibrary:catalog}).analysis.status,'unique');
 const before=logicalFingerprints(reference);
 assert.deepEqual(logicalFingerprints(document,'gezeitenkarten-1',{assetLibrary:catalog}),before);
 document.presentation.assetPlacements[0].anchor='A5';
 document.presentation.title='Another graphic presentation';
 assert.deepEqual(logicalFingerprints(document,'gezeitenkarten-1',{assetLibrary:catalog}),before);
 assert.throws(()=>logicalFingerprints(document),/asset library required/);
});

test('fingerprints still reject invalid, unapproved and disabled placements with a catalog',()=>{
 for(const [mutate,error] of [
  [d=>d.presentation.assetPlacements[0].assetId='missing.asset',/Unknown asset/],
  [d=>d.presentation.assetPlacements[0].anchor='B3',/passable conflicts/],
  [d=>d.presentation.assetPlacements.push({...d.presentation.assetPlacements[0],id:'overlap'}),/overlapping/],
  [d=>d.presentation.assetBackground='meer-pergament',/not visually approved|renders sea-blue-01/]
 ]){
  const d=placed();mutate(d);
  assert.throws(()=>logicalFingerprints(d,'gezeitenkarten-1',{assetLibrary:catalog}),error);
 }
 for(const [mutate,error] of [
  [c=>c.reviews.find(r=>r.assetId===beacon&&r.backgroundId==='sea-blue-01').status='pending',/not visually approved/],
  [c=>c.assets.find(a=>a.id===beacon).production='deferred',/not enabled for production/],
  [c=>c.reviews.find(r=>r.assetId===beacon&&r.backgroundId==='sea-blue-01').backgroundId='*',/concrete hash-bound background/]
 ]){
  const c=clone(catalog);mutate(c);
  assert.throws(()=>logicalFingerprints(placed(),'gezeitenkarten-1',{assetLibrary:c}),error);
 }
});

test('an asset-bearing archive revision validates without changing historical rows or logical identities',()=>{
 const f=revision();
 assert.equal(check(f),f.manifest);
 for(const field of ['mapStructureId','instanceId','variantId'])assert.equal(f.entry[field],archive.publications[0][field]);
 for(const field of ['mapStructure','instance','variant'])assert.equal(f.entry.fingerprints[field],archive.publications[0].fingerprints[field]);
 assert.notEqual(f.entry.fingerprints.publication,archive.publications[0].fingerprints.publication);
});

test('each archive snapshot and archive projection use their own pinned catalog, never the current catalog',()=>{
 function historical(suffix,number){
  const library=clone(catalog),id='navigation.lighthouse.snapshot-'+suffix;
  library.assets.find(a=>a.id===beacon).id=id;
  for(const r of library.reviews)if(r.assetId===beacon)r.assetId=id;
  const document=placed();document.presentation.assetPlacements[0].assetId=id;
  assert.throws(()=>compilePuzzle(document,{assetLibrary:catalog}),/Unknown asset/);
  assert.equal(compilePuzzle(document,{assetLibrary:library}).analysis.status,'unique');
  return revision({document,library,suffix,revision:number});
 }
 const first=historical('a',2),second=historical('b',3);
 const manifest=clone(first.manifest);
 manifest.snapshots.push(second.snapshot);manifest.publications.push(second.entry);
 const readBytes=(path,commit)=>commit===second.snapshot.commit?second.readBytes(path,commit):first.readBytes(path,commit);
 assert.equal(validateArchive(manifest,{readBytes,previous:archive}),manifest);
 const projector=createArchiveProjector(manifest,{readBytes});
 for(const f of [first,second])assert.equal(projector.project(f.entry.publicationId).identity.sourcePublicationId,f.entry.publicationId);
 // A pinned context that revokes approval must win even though today's catalog approves this asset.
 const library=clone(catalog);library.reviews.find(r=>r.assetId===beacon&&r.backgroundId==='sea-blue-01').status='rejected';
 assert.throws(()=>check(revision({library})),/not visually approved/);
});

test('archive validation rejects invalid or disabled placements even with consistent source and snapshot hashes',()=>{
 for(const mutate of [d=>d.presentation.assetPlacements[0].assetId='missing.asset',d=>d.presentation.assetPlacements[0].anchor='B3']){
  const document=placed();mutate(document);assert.throws(()=>check(revision({document})),/Unknown asset|passable conflicts/);
 }
 const library=clone(catalog);library.assets.find(a=>a.id===beacon).production='deferred';
 assert.throws(()=>check(revision({library})),/not enabled for production/);
});

test('catalog, image and background must be pinned in the snapshot inventory with unchanged bytes',()=>{
 const asset=catalog.assets.find(a=>a.id===beacon),background=catalog.backgrounds.find(b=>b.id==='sea-blue-01');
 for(const path of [catalogPath,asset.image.path,background.image]){
  const missing=revision();missing.snapshot.files=missing.snapshot.files.filter(f=>f.path!==path);reseal(missing);
  assert.throws(()=>check(missing),/absent from snapshot/);
  const changed=revision();changed.bytes.set(path,Buffer.from('changed'));
  assert.throws(()=>check(changed),/snapshot bytes changed/);
 }
});

test('hash-bound visual approvals are checked against pinned asset and background bytes',()=>{
 const asset=catalog.assets.find(a=>a.id===beacon),background=catalog.backgrounds.find(b=>b.id==='sea-blue-01');
 for(const path of [asset.image.path,background.image]){
  // Inventory hashes are internally consistent; only the approval hash is stale.
  const f=revision({replaceBytes:bytes=>bytes.set(path,Buffer.from('new unreviewed image bytes'))});
  assert.throws(()=>check(f),/Stale visual approval/);
 }
 const library=clone(catalog);library.reviews.find(r=>r.assetId===beacon&&r.status==='approved').assetSha256='0'.repeat(64);
 assert.throws(()=>check(revision({library})),/Stale visual approval/);
});
