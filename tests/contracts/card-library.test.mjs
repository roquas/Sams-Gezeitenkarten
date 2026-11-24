import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {loadReleasedAssetCatalog} from '../../scripts/lib/released-asset-catalog.mjs';
import {describeIllustratedCard,illustratedCardKey,createNamedCard,validateNamedCard,cardIntegrity} from '../../scripts/lib/illustrated-card.mjs';
import {openCardLibrary} from '../../scripts/lib/card-library.mjs';
import {validateNameSupply,selectCardNames,nameSupplySha256} from '../../scripts/lib/card-names.mjs';
import {canonicalJson,sha256} from '../../scripts/lib/content-hash.mjs';
import {mapFingerprint} from '../../scripts/lib/publication-archive.mjs';
import {classifyChanges} from '../../scripts/ci-changes.mjs';
import {fixture,source,supply,ROCK,BUOY,TESORO} from '../fixtures/cards/public.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const releaseId='gk-catalog-release-v1-sha256-f9dbeb5e6be3664adcef72c1624615e7a016681cd4024ad0442fd54ec825497e';
const options={repositoryRoot:root,releaseId,backgroundId:'sea-blue-01'};
let released;
before(()=>{released=loadReleasedAssetCatalog(options);});
const dir=t=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'gk-cards-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;};
const library=(t,extra={})=>openCardLibrary({directory:dir(t),repositoryRoot:root,...extra});
const store=(lib,input=fixture(released),src=source())=>lib.reuse(input,options,src);
const copy=structuredClone;
function reseal(card){const {integritySha256,...body}=card;return {...body,integritySha256:cardIntegrity(body)};}

test('curated supply explicitly covers all selected motives with 20 short proposed names each',()=>{
 const s=validateNameSupply(supply());
 assert.equal(Object.keys(s.pools).length,23);
 assert.deepEqual(Object.keys(s.assetBindings).sort(),released.catalog.verification.assets.map(a=>a.assetId).sort());
 for(const pool of Object.values(s.pools)){
  assert.equal(pool.names.length,20);
  assert.ok(pool.names.every(n=>[...n].length>=6&&[...n].length<=12));
 }
 assert.equal(s.assetBindings['land-coast.island.h2.mist-forest-01.v1'].poolId,s.assetBindings['land-coast.island.h2.mist-forest-03.v1'].poolId);
 assert.notEqual(s.assetBindings['land-coast.settlement.h2.prison-island-01.v1'].poolId,s.assetBindings['land-coast.settlement.h2.hut-settlement-01.v1'].poolId);
 for(const b of Object.values(s.assetBindings))assert.ok(fs.statSync(path.join(root,b.source)).isFile());
});

test('logical fingerprint stays unchanged; array order and placement plumbing do not affect recognition',()=>{
 const input=fixture(released),before=copy(input),a=describeIllustratedCard(input,released);
 const reordered=copy(input);reordered.map.objects.reverse();reordered.map.objects.forEach(o=>o.cells.reverse());
 reordered.assetPlacements.reverse();reordered.assetPlacements.forEach((p,i)=>p.id='different-'+i);
 assert.deepEqual(describeIllustratedCard(reordered,released),a);
 assert.equal(a.mapFingerprint,mapFingerprint(input.map));assert.deepEqual(input,before);
 const resources=copy(a);resources.resources.assets.reverse();resources.assetPlacements.reverse();
 assert.equal(illustratedCardKey(resources),a.key);
 const multi=fixture(released,[['town',TESORO,'A1']]),original=describeIllustratedCard(multi,released),catalog=copy(released.catalog);
 catalog.library.assets.reverse();catalog.library.backgrounds.reverse();catalog.library.reviews.reverse();
 catalog.library.assets.find(a=>a.id===TESORO).geometry.cells.reverse();
 assert.equal(describeIllustratedCard(multi,{...released,catalog}).key,original.key);
});

test('unconsumed catalog entries, resource paths, release and run provenance do not change card identity',()=>{
 const input=fixture(released),a=describeIllustratedCard(input,released);
 const other=copy(released.catalog),unconsumed=other.library.assets.find(a=>a.id===BUOY);unconsumed.provenance.source+=' catalog annotation';
 const asset=other.library.assets.find(a=>a.id===ROCK),old=asset.image.path;asset.image.path='assets/library/relocated.png';
 const altered={...released,catalog:other,provenance:{...released.provenance,releaseId:'another-approved-release',catalogSha256:'f'.repeat(64)},
  readResource:ref=>released.readResource(ref===asset.image.path?old:ref)};
 assert.equal(describeIllustratedCard(input,altered).key,a.key);
});

test('asset assignment, anchor, background and used resource revisions are separate identities',()=>{
 const input=fixture(released),a=describeIllustratedCard(input,released);
 const moved=fixture(released,[['north',ROCK,'B1'],['south',ROCK,'D4']]);
 assert.notEqual(describeIllustratedCard(moved,released).key,a.key);
 const reillustrated=copy(input);reillustrated.assetPlacements[0].assetId='land-coast.island.h1.palm-beach.v1';
 assert.equal(mapFingerprint(reillustrated.map),a.mapFingerprint);
 assert.notEqual(describeIllustratedCard(reillustrated,released).key,a.key);
 for(const change of [c=>c.resources.assets[0].imageSha256='2'.repeat(64),c=>c.resources.assets[0].revisionSha256='3'.repeat(64),
  c=>c.resources.background.imageSha256='4'.repeat(64),c=>c.background='other-background',c=>c.assetPlacements[0].anchor='B1']){
  const b=copy(a);change(b);assert.notEqual(illustratedCardKey(b),a.key);
 }
 const revised={...released,readResource:ref=>ref===released.catalog.library.assets.find(a=>a.id===ROCK).image.path?Buffer.from('different-image-revision'):released.readResource(ref)};
 assert.notEqual(describeIllustratedCard(input,revised).key,a.key);
 const renumbered=copy(input);renumbered.map.objects[0].id='another-id';renumbered.assetPlacements[0].objectId='another-id';
 assert.notEqual(describeIllustratedCard(renumbered,released).key,a.key);
 const swapped=copy(input);[swapped.assetPlacements[0].objectId,swapped.assetPlacements[1].objectId]=[swapped.assetPlacements[1].objectId,swapped.assetPlacements[0].objectId];
 assert.notEqual(illustratedCardKey({...a,assetPlacements:swapped.assetPlacements}),a.key);
});

test('complete placements, release selection and approved anchors are mandatory',()=>{
 const input=fixture(released);input.assetPlacements.pop();assert.throws(()=>describeIllustratedCard(input,released),/incomplete/);
 const outside=fixture(released);outside.assetPlacements[0].anchor='B1';assert.throws(()=>describeIllustratedCard(outside,released),/footprint/);
 const unselected={...released,catalog:{...released.catalog,verification:{...released.catalog.verification,assets:[]}}};
 assert.throws(()=>describeIllustratedCard(fixture(released),unselected),/approved release selection/);
});

test('names are deterministic, object-ID ordered and globally distinct across repetitions and overlapping pools',()=>{
 const input=fixture(released),a=createNamedCard(input,released,supply(),source());
 assert.equal(new Set(Object.values(a.naming.objectNames)).size,2);
 input.assetPlacements.reverse();assert.deepEqual(createNamedCard(input,released,supply(),source('other')).naming,a.naming);
 const s=supply();s.pools.rock.names=['Sharedname','Spareplace'];s.pools.buoy.names=['Sharedname','Otherplace'];
 const placements=[{objectId:'a',assetId:ROCK},{objectId:'b',assetId:BUOY},{objectId:'c',assetId:ROCK}];
 const selected=selectCardNames(a.key,placements,s);
 assert.equal(new Set(Object.values(selected.objectNames)).size,3);
 assert.deepEqual(selectCardNames(a.key,placements.slice().reverse(),s),selected);
});

test('same illustration may receive different ordinary names on different cards',()=>{
 const names=new Set();
 for(const anchor of ['A1','B1','C1','D1','E1']){
  const card=createNamedCard(fixture(released,[['place',ROCK,anchor]]),released,supply(),source());names.add(card.naming.objectNames.place);
 }
 assert.ok(names.size>1);
});

test('missing mappings, pool exhaustion and malformed pools are explicit errors',()=>{
 const s=supply(),input=fixture(released);delete s.assetBindings[ROCK];
 assert.throws(()=>createNamedCard(input,released,s,source()),/missing asset binding/);
 const exhausted=supply();exhausted.pools.rock.names=['Onlyplace'];
 assert.throws(()=>createNamedCard(input,released,exhausted,source()),/exhausted pool/);
 for(const change of [s=>s.assetBindings[ROCK].poolId='absent',s=>s.pools.rock.names=['Sameplace','sameplace'],s=>s.pools.rock.names=['AnExtremelyLongName']]){
  const bad=supply();change(bad);assert.throws(()=>validateNameSupply(bad));
 }
});

test('Tesoro has a stable world ID; ordinary selection reserves world names, including absent unique assets',()=>{
 const s=supply(),a=createNamedCard(fixture(released,[['town',TESORO,'B2'],['marker',BUOY,'E5']]),released,s,source());
 assert.equal(a.naming.objectNames.town,'Tesoro');assert.equal(a.naming.bindings.town.worldPlaceId,'world.tesoro');
 assert.throws(()=>createNamedCard(fixture(released,[['town-a',TESORO,'A1'],['town-b',TESORO,'D1']]),released,s,source()),/multiple representations/);
 s.pools.rock.names=['Tesoro','Ordinary'];
 assert.equal(createNamedCard(fixture(released,[['rock',ROCK,'A1']]),released,s,source()).naming.objectNames.rock,'Ordinary');
 s.pools.rock.names=['Tesoro'];assert.throws(()=>createNamedCard(fixture(released,[['rock',ROCK,'A1']]),released,s,source()),/exhausted/);
 const aliases=supply();aliases.assetBindings['future.tesoro.art']={...aliases.assetBindings[TESORO]};
 assert.throws(()=>selectCardNames(a.key,[{objectId:'one',assetId:TESORO},{objectId:'two',assetId:'future.tesoro.art'}],aliases),/multiple representations/);
 aliases.uniquePlaces['another.world']={name:'Tesoro',source:'fixture'};assert.throws(()=>validateNameSupply(aliases),/conflicting unique/);
 for(const change of [s=>s.uniquePlaces['world.tesoro'].name='Otherplace',s=>delete s.uniquePlaces['world.tesoro'],
  s=>s.assetBindings[TESORO]={mode:'pool',poolId:'huts',source:'fixture'}]){
  const bad=supply();change(bad);assert.throws(()=>validateNameSupply(bad),/fixed (world name|unique asset binding) conflict/);
 }
});

test('known world names stay reserved with replacement supplies and no corresponding asset bindings',()=>{
 const input=fixture(released,[['rock',ROCK,'A1']]);
 for(const name of ['Nombreo','Tiburon','Kapuzien','Carribera']){
  const fullwidth=name.replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+0xfee0));
  for(const spelling of [name,name.toUpperCase(),fullwidth]){
   const replacement=supply();replacement.version='replacement-names-2';
   delete replacement.assetBindings[TESORO];
   assert.ok(!Object.values(replacement.uniquePlaces).some(p=>p.name===name));
   replacement.pools.rock.names=[spelling,'Felswacht'];
   const card=createNamedCard(input,released,replacement,source());
   assert.equal(card.naming.objectNames.rock,'Felswacht',spelling+' must remain reserved');
   replacement.pools.rock.names=[spelling];
   assert.throws(()=>createNamedCard(input,released,replacement,source()),/exhausted pool/);
  }
 }
});

test('replacement supplies cannot rebind a reserved world name through an invented unique place',()=>{
 for(const name of ['Nombreo','Tiburon','Kapuzien','Carribera']){
  const replacement=supply();
  replacement.uniquePlaces['world.claimed']={name,source:'replacement supply'};
  replacement.assetBindings[ROCK]={mode:'unique',worldPlaceId:'world.claimed',source:'replacement supply'};
  assert.throws(()=>validateNameSupply(replacement),/reserved world name conflict/);
 }
});

test('persisted cards survive new runs and supply extensions without writes or renaming',t=>{
 const lib=library(t),first=store(lib),file=path.join(lib.directory,'cards',first.card.key.split(':')[1]+'.json');
 const bytes=fs.readFileSync(file),stat=fs.statSync(file),extended=supply();extended.version='card-names-de-2';extended.pools.rock.names.push('Newrockname');
 assert.notEqual(nameSupplySha256(extended),first.card.naming.supplySha256);
 const next=openCardLibrary({directory:lib.directory,repositoryRoot:root,supply:extended});
 const second=store(next,fixture(released),source('fixture/run-2'));
 assert.equal(second.reused,true);assert.deepEqual(second.card,first.card);
 assert.deepEqual(fs.readFileSync(file),bytes);assert.equal(fs.statSync(file).mtimeMs,stat.mtimeMs);
 assert.equal(fs.readdirSync(path.join(lib.directory,'cards')).length,1);assert.equal(fs.readdirSync(path.join(lib.directory,'links')).length,2);
 assert.deepEqual(store(next).card.naming,first.card.naming);
});

test('two actual approved releases with unused catalog additions reference the same stored card',t=>{
 const lib=library(t),input=fixture(released);
 const oldReleaseId='gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1';
 const first=lib.reuse(input,{...options,releaseId:oldReleaseId},source('historical-release/run'));
 const second=store(lib,input,source('new-release/run'));
 assert.equal(second.reused,true);assert.deepEqual(first.card,second.card);
 assert.equal(first.card.origin.release.releaseId,oldReleaseId);assert.equal(second.link.release.releaseId,releaseId);
 assert.throws(()=>store(lib,input,source('historical-release/run')),/source release provenance conflict/);
});

test('stored artifacts are self contained and strict; corruption and provenance conflicts fail',()=>{
 const original=createNamedCard(fixture(released),released,supply(),source());
 for(const change of [c=>delete c.map,c=>c.naming.objectNames.north='Tampered',c=>c.origin.source.sha256='x',c=>c.solution=['A1'],
  c=>c.naming.supplyVersion='another-supply']){
  const c=copy(original);change(c);assert.throws(()=>validateNamedCard(c,released));
 }
 for(const change of [c=>c.resources.assets[0].imageSha256='9'.repeat(64),c=>c.origin.release.catalogSha256='9'.repeat(64),
  c=>c.naming.objectNames.north=c.naming.objectNames.south]){
  const c=copy(original);change(c);assert.throws(()=>validateNamedCard(reseal(c),released));
 }
 assert.equal(Object.hasOwn(original,'solution'),false);assert.equal(Object.hasOwn(original,'logic'),false);
});

test('damaged existing files are never replaced; source conflicts and dangling indices are rejected',t=>{
 const lib=library(t),{card,link}=store(lib),file=path.join(lib.directory,'cards',card.key.split(':')[1]+'.json');
 assert.throws(()=>store(lib,fixture(released),source('fixture/run-1','2'.repeat(64))),/source identity\/hash conflict/);
 assert.throws(()=>store(lib,fixture(released,[['north',ROCK,'B1'],['south',ROCK,'D4']])),/source\/card identity conflict/);
 fs.writeFileSync(file,'{"partial":');assert.throws(()=>store(lib));assert.equal(fs.readFileSync(file,'utf8'),'{"partial":');
 fs.unlinkSync(file);assert.throws(()=>lib.lookup(source()),/ENOENT/);
 fs.writeFileSync(file,JSON.stringify(card));
 const linkFile=path.join(lib.directory,'links',sha256(canonicalJson({kind:link.source.kind,id:link.source.id}))+'.json');
 const bad=copy(link);bad.cardIntegritySha256='0'.repeat(64);fs.writeFileSync(linkFile,JSON.stringify(bad));assert.throws(()=>lib.lookup(source()),/link integrity/);
});

test('partial staging files are ignored; aliases and unproven archive commits are rejected',t=>{
 const lib=library(t);fs.writeFileSync(path.join(lib.directory,'cards','.pending-aborted'),'{');
 const result=store(lib);assert.equal(result.reused,false);
 const broken=copy(result.card);broken.origin.release.archiveCommit='0'.repeat(40);
 const file=path.join(lib.directory,'cards',result.card.key.split(':')[1]+'.json');fs.writeFileSync(file,JSON.stringify(reseal(broken)));
 assert.throws(()=>lib.load(result.card.key));
 fs.unlinkSync(file);fs.symlinkSync(path.join(lib.directory,'cards','.pending-aborted'),file);
 assert.throws(()=>store(lib),/regular file/);
});

test('independent processes racing to store one card preserve a complete immutable winner',async t=>{
 const directory=dir(t),input=fixture(released),config=path.join(directory,'input.json');
 fs.writeFileSync(config,JSON.stringify({directory,input,options}));
 const script=`import fs from 'node:fs';import {openCardLibrary} from './scripts/lib/card-library.mjs';const c=JSON.parse(fs.readFileSync(process.argv[1]));openCardLibrary({directory:c.directory}).reuse(c.input,c.options,{kind:'illustrated-map',id:'race/'+process.argv[2],sha256:'1'.repeat(64)});`;
 const {spawn}=await import('node:child_process');
 const run=id=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',script,config,id],{cwd:root});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('exit',code=>code?reject(Error(err)):resolve());});
 await Promise.all([run('one'),run('two')]);
 const lib=openCardLibrary({directory}),key=describeIllustratedCard(input,released).key;
 assert.ok(lib.load(key).integritySha256);assert.equal(fs.readdirSync(path.join(directory,'cards')).length,1);
 assert.equal(fs.readdirSync(path.join(directory,'links')).length,2);
});

test('new F02 code and data retain full CI without changing its allowlist',()=>{
 for(const p of ['scripts/lib/card-library.mjs','scripts/lib/card-names.mjs','scripts/lib/card-import.mjs','scripts/lib/illustrated-card.mjs',
  'scripts/card-library.mjs','content/card-names/de-v1.json','tests/contracts/card-library.test.mjs']){
  assert.equal(classifyChanges([{path:p,status:'A',oldMode:'000000',newMode:'100644'}]).profile,'full');
 }
});
