import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {sha256,logicalFingerprints,snapshotFingerprint,publicationFingerprint,validateArchive,resolveContentId} from '../../scripts/lib/publication-archive.mjs';
import {createArchiveProjector} from '../../scripts/lib/archive-projection.mjs';
import {projectPublicPuzzle,validatePublicPuzzle} from '../../src/puzzles/public.mjs';
import {definition,catalog} from '../fixtures/model/factories.mjs';
function fixture(){
 const d=definition(),bytes=Buffer.from(JSON.stringify(d)),source={path:'arbitrary/puzzle.json',sha256:sha256(bytes)},commit='a'.repeat(40);
 const dto=projectPublicPuzzle(d,{identity:{mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'}}),publicBytes=Buffer.from(JSON.stringify(dto));
 const publicSource={path:'delivered/puzzle.json',sha256:sha256(publicBytes)};
 const s={snapshotId:'snapshot-test',commit,files:[publicSource]};s.fingerprint=snapshotFingerprint(s);
 const p={publicationId:'pub-test',mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test',rulesVersion:d.rulesVersion,revision:1,schemaVersion:2,dataVersion:1,source,publicSource,snapshotId:s.snapshotId,fingerprints:logicalFingerprints(d)};
 p.fingerprints.publication=publicationFingerprint(p,s);
 const manifest={archiveSchemaVersion:2,canonicalizationVersion:2,snapshots:[s],publications:[p]};
 const files=new Map([[source.path,bytes],[publicSource.path,publicBytes]]),readBytes=(path,at)=>{assert.equal(at,commit);return files.get(path);};
 return {d,manifest,s,p,files,readBytes};
}
test('generic archive and preview use pinned source bytes and detached identity bindings',()=>{
 const f=fixture();validateArchive(f.manifest,{readBytes:f.readBytes});
 const projector=createArchiveProjector(f.manifest,{readBytes:f.readBytes});f.manifest.publications[0].instanceId='inst-mutated';
 const dto=projector.project('pub-test');validatePublicPuzzle(dto);assert.equal(dto.identity.instanceId,'inst-test');assert.equal(dto.identity.sourcePublicationId,'pub-test');assert.equal('solution' in dto.puzzle,false);
 assert.throws(()=>projector.project('unknown'),/Unknown/);
 f.files.set(f.p.source.path,Buffer.from('changed'));assert.throws(()=>projector.project('pub-test'),/bytes changed/);
});
test('publication identity covers full delivered document and resource inventory; map identity stays independent',()=>{
 const a=fixture(),b=fixture();b.d.presentation.title='New story';
 const dto=projectPublicPuzzle(b.d,{identity:{mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'}});
 b.p.publicSource.sha256=sha256(JSON.stringify(dto));b.s.files=[b.p.publicSource];b.s.fingerprint=snapshotFingerprint(b.s);
 assert.deepEqual(logicalFingerprints(b.d),logicalFingerprints(a.d));assert.notEqual(publicationFingerprint(b.p,b.s),a.p.fingerprints.publication);
 b.s.files.push({path:'resources/image.png',sha256:'b'.repeat(64)});const fp=snapshotFingerprint(b.s);assert.notEqual(fp,a.s.fingerprint);
});
test('archive rejects corruption, conflicting identities, duplicate entries and mutable accepted history',()=>{
 for(const mutate of [f=>f.files.set(f.p.source.path,Buffer.from('bad')),f=>f.s.fingerprint='gk-snapshot-v2-sha256:'+'0'.repeat(64),f=>f.p.fingerprints.instance='gk-instance-v2-sha256:'+'0'.repeat(64),f=>f.manifest.publications.push(f.p),f=>f.s.files.push(f.s.files[0]),f=>f.p.source.path='../escape']){
  const f=fixture();mutate(f);assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes}));
 }
 const f=fixture(),previous=structuredClone(f.manifest);f.p.revision=2;f.p.fingerprints.publication=publicationFingerprint(f.p,f.s);assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes,previous}),/frozen/);
});
test('empty unpublished archive is valid; legacy aliases and old rule versions are rejected',()=>{
 const empty={archiveSchemaVersion:2,canonicalizationVersion:2,snapshots:[],publications:[]};validateArchive(empty,{readBytes:()=>{throw Error('no files');}});
 assert.throws(()=>validateArchive({...empty,legacyAliases:[]},{readBytes:()=>{}}));
 const f=fixture();assert.equal(resolveContentId(f.manifest,'mapStructure',f.p.fingerprints.mapStructure),'map-test');f.p.rulesVersion='gezeitenkarten-1';assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes}));
});
test('archive catalog location is explicit and approval checks use snapshot bytes instead of the installed content package',()=>{
 const f=fixture(),c=catalog([]),ref='other/catalog.json',bytes=Buffer.from(JSON.stringify(c));
 const sea=Buffer.from('synthetic background bytes');f.files.set(c.backgrounds[0].image,sea);f.s.files.push({path:c.backgrounds[0].image,sha256:sha256(sea)});
 f.files.set(ref,bytes);f.s.files.push({path:ref,sha256:sha256(bytes)});f.s.assetCatalog=ref;f.s.fingerprint=snapshotFingerprint(f.s);f.p.fingerprints.publication=publicationFingerprint(f.p,f.s);
 validateArchive(f.manifest,{readBytes:f.readBytes});
 const dto=createArchiveProjector(f.manifest,{readBytes:f.readBytes}).project('pub-test');validatePublicPuzzle(dto,{assetLibrary:c});
 f.files.set(ref,Buffer.from('{}'));assert.throws(()=>createArchiveProjector(f.manifest,{readBytes:f.readBytes}),/bytes changed/);
});

test('fixed snapshot and full publication vectors bind all delivered source bytes',()=>{
 const f=fixture(),vectors=JSON.parse(readFileSync(new URL('../fixtures/model/archive-vectors.json',import.meta.url)));
 assert.equal(f.s.fingerprint,vectors.snapshot);assert.equal(f.p.fingerprints.publication,vectors.publication);
});

test('private provenance changes cannot change publication identity, but cannot be shipped either',()=>{
 const f=fixture(),before=f.p.fingerprints.publication;
 f.d.metadata={kind:'test',source:'different private seed provenance'};
 const bytes=Buffer.from(JSON.stringify(f.d));f.files.set(f.p.source.path,bytes);f.p.source.sha256=sha256(bytes);
 assert.equal(publicationFingerprint(f.p,f.s),before);validateArchive(f.manifest,{readBytes:f.readBytes});
 f.s.files.push(f.p.source);f.s.fingerprint=snapshotFingerprint(f.s);f.p.fingerprints.publication=publicationFingerprint(f.p,f.s);
 assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes}),/internal definition must not be delivered/);
});

test('delivered DTO bytes must be public and exactly project the pinned internal definition',()=>{
 for(const mutate of [dto=>dto.puzzle.solution=['C3','D3'],dto=>dto.puzzle.presentation.title='changed delivery']){
  const f=fixture(),dto=JSON.parse(f.files.get(f.p.publicSource.path));mutate(dto);
  const bytes=Buffer.from(JSON.stringify(dto));f.files.set(f.p.publicSource.path,bytes);f.p.publicSource.sha256=sha256(bytes);
  f.s.files=[f.p.publicSource];f.s.fingerprint=snapshotFingerprint(f.s);f.p.fingerprints.publication=publicationFingerprint(f.p,f.s);
  assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes}));
 }
});
