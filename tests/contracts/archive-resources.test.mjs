import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {definition,asset,catalog} from '../fixtures/model/factories.mjs';
import {readContentPackage} from '../../scripts/lib/content-package.mjs';
import {validateAssetFiles} from '../../scripts/validate-assets.mjs';
import {compilePuzzle} from '../../src/puzzles/validate.mjs';
import {projectPublicPuzzle} from '../../src/puzzles/public.mjs';
import {createPuzzleLoader} from '../../src/puzzles/loader.mjs';
import {sha256,logicalFingerprints,snapshotFingerprint,publicationFingerprint,validateArchive} from '../../scripts/lib/publication-archive.mjs';
import {createArchiveProjector} from '../../scripts/lib/archive-projection.mjs';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const imageCache=new Map();
function makeImageBytes(format,width,height,tag=''){
 const key=JSON.stringify([format,width,height,tag]);
 if(!imageCache.has(key))imageCache.set(key,execFileSync('python3',['-c',`
import sys
from PIL import Image, ImageDraw, PngImagePlugin
kind, width, height, tag = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
ImageDraw.Draw(image).rectangle((width//2-4, height//2-4, width//2+4, height//2+4), fill=(30, 80, 120, 255))
metadata = PngImagePlugin.PngInfo()
metadata.add_text('fixture', tag)
image.save(sys.stdout.buffer, format=kind, **({'pnginfo': metadata} if kind == 'PNG' else {}))
`,format,String(width),String(height),tag]));
 return imageCache.get(key);
}

function fixture(t,resourceBase='resources',{imageRef='assets/test/island.png',imageBytes='island bytes'}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'gk-archive-resources-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const d=definition(),a=asset('test.island',[[0,0],[1,0]]);a.image.path=imageRef;
 const c=catalog([a]),images=new Map([[imageRef,makeImageBytes('PNG',a.image.width,a.image.height,imageBytes)],[c.backgrounds[0].image,makeImageBytes('WEBP',16,16)]]);
 c.reviews[0].assetSha256=sha256(images.get(imageRef));c.reviews[0].backgroundSha256=sha256(images.get(c.backgrounds[0].image));
 d.presentation.assetPlacements=[{id:'island',assetId:a.id,objectId:'shore',anchor:'B2'}];
 const identity={mapStructureId:'map-test',instanceId:'inst-test',variantId:'var-test'},dto=projectPublicPuzzle(d,{identity,assetLibrary:c});
 const files=new Map(),inventory=[];
 const write=(ref,value,publicPath)=>{
  const bytes=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value));files.set(ref,bytes);
  const full=path.join(root,ref);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes);
  const file={path:ref,sha256:sha256(bytes),...(publicPath?{publicPath}:{})};if(publicPath)inventory.push(file);return file;
 };
 const source=write('private/definition.json',d),publicSource=write('puzzles/fixture.json',dto,'puzzles/fixture.json');
 delete publicSource.publicPath;
 const publicManifest={schemaVersion:2,defaultId:'fixture',assetCatalog:'../public-resources/catalog.json',resourceBase:'../public-resources/',puzzles:[{id:'fixture',title:'Test',path:'fixture.json',kind:'test'}]};
 write('delivery/manifest.json',publicManifest,'puzzles/manifest.json');
 write('puzzles/manifest.json',{...publicManifest,assetCatalog:'../'+resourceBase+'/catalog.json',resourceBase:'../'+resourceBase+'/'});
 const catalogPath=resourceBase+'/catalog.json';write(catalogPath,c,'public-resources/catalog.json');
 for(const [ref,bytes] of images)write(resourceBase+'/'+ref,bytes,'public-resources/'+ref);
 const s={snapshotId:'snapshot-test',commit:'a'.repeat(40),files:inventory,assetCatalog:catalogPath,resourceBase:resourceBase+'/',publicResourceBase:'public-resources/'};
 s.fingerprint=snapshotFingerprint(s);
 const p={publicationId:'pub-test',...identity,rulesVersion:d.rulesVersion,revision:1,schemaVersion:2,dataVersion:1,source,publicSource,snapshotId:s.snapshotId,fingerprints:logicalFingerprints(d)};
 p.fingerprints.publication=publicationFingerprint(p,s);
 const manifest={archiveSchemaVersion:2,canonicalizationVersion:2,snapshots:[s],publications:[p]};
 const readBytes=(ref,commit)=>{assert.equal(commit,s.commit);return files.get(ref);};
 return {root,d,c,files,s,p,manifest,readBytes};
}


test('shifted resource base survives package validation, archive, validation, projector and nested public URL loading',async t=>{
 const f=fixture(t,'nested/resources'),content=readContentPackage(f.root);
 validateAssetFiles(content.assetLibrary,content.resourceRoot);
 compilePuzzle(content.readPuzzle(content.manifest.puzzles[0]).puzzle,{assetLibrary:content.assetLibrary});
 // Exercise the actual public package gates, including complete image decoding
 // and alpha/footprint checks, rather than only hashing synthetic byte strings.
 execFileSync('node',['scripts/validate-puzzles.mjs','--root',f.root],{cwd:repository});
 execFileSync('python3',['scripts/check-library-images.py','--root',f.root],{cwd:repository});
 validateArchive(f.manifest,{readBytes:f.readBytes});
 const dto=createArchiveProjector(f.manifest,{readBytes:f.readBytes}).project('pub-test');assert.deepEqual(dto.puzzle.presentation,f.d.presentation);
 const prefix='https://example.test/arbitrary/deep/site/',requested=[];
 const loader=createPuzzleLoader({manifestUrl:prefix+'puzzles/manifest.json',fetcher:async url=>{
  requested.push(String(url));const publicPath=String(url).slice(prefix.length),file=f.s.files.find(file=>(file.publicPath??file.path)===publicPath);
  assert.ok(String(url).startsWith(prefix)&&file,'Unexpected public URL: '+url);
  return {ok:true,json:async()=>JSON.parse(f.files.get(file.path))};
 }});
 const puzzle=await loader.load('fixture');assert.equal(puzzle.resourceBaseUrl.href,prefix+'public-resources/');
 assert.ok(requested.includes(prefix+'public-resources/catalog.json'));
 assert.equal(new URL(f.c.assets[0].image.path,puzzle.resourceBaseUrl).href,prefix+'public-resources/assets/test/island.png');
});

test('publication identity uses public paths and bytes, independent of internal resource storage and provenance',t=>{
 const a=fixture(t),b=fixture(t,'other/deep/storage');
 validateArchive(a.manifest,{readBytes:a.readBytes});validateArchive(b.manifest,{readBytes:b.readBytes});
 assert.notEqual(a.s.fingerprint,b.s.fingerprint);
 assert.equal(a.p.fingerprints.publication,b.p.fingerprints.publication);
 for(const options of [{imageRef:'assets/test/renamed.png'},{imageBytes:'different delivered island bytes'}]){
  const changed=fixture(t,'other/resources',options);validateArchive(changed.manifest,{readBytes:changed.readBytes});
  assert.notEqual(a.p.fingerprints.publication,changed.p.fingerprints.publication);
 }
 // Even an otherwise unused delivered file belongs to the public release.
 b.s.files.push({path:'internal/extra.txt',publicPath:'extra.txt',sha256:sha256('extra')});
 assert.notEqual(a.p.fingerprints.publication,publicationFingerprint(b.p,b.s));
});

test('missing, manipulated or misbound resources fail clearly, including rechecks by a live projector',t=>{
 for(const mode of ['missing','changed','unlisted','public-path','duplicate-public-path']){
  const f=fixture(t),ref=f.s.resourceBase+f.c.assets[0].image.path;
  if(mode==='missing')f.files.delete(ref);
  if(mode==='changed')f.files.set(ref,Buffer.from('tampered'));
  if(mode==='unlisted')f.s.files=f.s.files.filter(file=>file.path!==ref);
  if(mode==='public-path')f.s.files.find(file=>file.path===ref).publicPath='wrong.png';
  if(mode==='duplicate-public-path')f.s.files.find(file=>file.path===ref).publicPath='puzzles/fixture.json';
  f.s.fingerprint=snapshotFingerprint(f.s);f.p.fingerprints.publication=publicationFingerprint(f.p,f.s);
  assert.throws(()=>validateArchive(f.manifest,{readBytes:f.readBytes}),/snapshot resource missing|snapshot bytes changed|asset file absent|asset public path disagrees|duplicate public delivery path/);
 }
 const f=fixture(t),projector=createArchiveProjector(f.manifest,{readBytes:f.readBytes});
 f.files.set(f.s.resourceBase+f.c.assets[0].image.path,Buffer.from('tampered after creation'));
 assert.throws(()=>projector.project('pub-test'),/snapshot bytes changed/);
});

test('package-relative resolution normalizes directory segments and rejects URL or root escapes',async()=>{
 const {resolvePackagePath}=await import('../../scripts/lib/package-path.mjs');
 assert.equal(resolvePackagePath('puzzles','../nested/../resources/'),'resources');
 assert.equal(resolvePackagePath('puzzles',''),'puzzles');
 assert.equal(resolvePackagePath('nested/resources/','./assets/test/island.png'),'nested/resources/assets/test/island.png');
 for(const ref of ['../../escape','/absolute','https://example.test/x','a\\b','%2e%2e/escape','assets/a.png?query','assets/a.png#fragment'])assert.throws(()=>resolvePackagePath('puzzles',ref),/Invalid package reference|escapes root/);
});
