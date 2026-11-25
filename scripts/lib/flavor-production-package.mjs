// Small trusted filesystem/release adapter for the public production export.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256} from './content-hash.mjs';
import {resolvePackagePath} from './package-path.mjs';
import {openCardLibrary} from './card-library.mjs';
import {loadReleasedAssetCatalog} from './released-asset-catalog.mjs';
import {describeIllustratedCard} from './illustrated-card.mjs';
import {originSourceRecordSha256} from './candidate-origin-contract.mjs';
import {renderSavedMapSvg,decodeContactImages} from './map-contact-sheet.mjs';
import {buildCommunityBeta,SOURCE} from '../community-beta.mjs';
import {json,contentHash,same,structure,productionResponseSchema,createProductionPosition,createProductionOrder,responseReferences,validateProductionOrder} from './flavor-production.mjs';

export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const PILOT_IDS=['C-06','C-02','C-03','C-11'];
export const PILOT_GOAL='Erzeuge zu jedem der vier feststehenden Rätsel genau eine eigenständige Episode. Themen, Erzählformen und Länge sind innerhalb des Welt-/Stilpakets frei. Die Geschichten sind voneinander unabhängig und keine Fortsetzungen. Bewahre sämtliche mathematischen Hinweise vollständig unter ihren IDs. Ergänze keine Lösungsinformationen. Gib ausschließlich das vereinbarte maschinenlesbare Ergebnis zurück; melde konkrete Produktionsprobleme ausdrücklich.';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const str={type:'string',minLength:1};
const hash={type:'string',pattern:'^[a-f0-9]{64}$'};
export const worldManifestSchema=obj({manifestVersion:{const:1},packageId:{type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$',maxLength:80},
 version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},language:{const:'de'},
 files:{type:'array',items:obj({path:{enum:['world.md','style.md','production.md']},sha256:hash}),minItems:3,maxItems:3},
 sourceCategories:obj({A:str,B:str,U:str,I:str,N:str}),provenance:obj({archive:str,archiveSha256:hash,originalManifestSha256:hash,integration:str})});
export function loadWorldPackage(directory=path.join(ROOT,'content/flavor/world-style-v1')){
 const bytes=fs.readFileSync(path.join(directory,'manifest.json')),manifest=read(path.join(directory,'manifest.json'));
 structure(manifest,worldManifestSchema);
 same(manifest.files.map(f=>f.path),['world.md','style.md','production.md'],'world package file order/coverage');
 const files=new Map([['manifest.json',bytes]]);
 for(const f of manifest.files){
  const file=path.join(directory,resolvePackagePath('.',f.path)),data=fs.readFileSync(file);
  assert.equal(sha256(data),f.sha256,'flavor production: world file hash mismatch: '+f.path);files.set(f.path,data);
 }
 return {manifest,files,reference:{packageId:manifest.packageId,version:manifest.version,packageHash:sha256(bytes)}};
}
export function loadCommunityProduction({ids=PILOT_IDS,intents,libraryDirectory=path.join(ROOT,'content/card-library/f02a-v1')}={}){
 assert.ok(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length,'flavor production: explicit distinct cases required');
 // The existing migration, logical identity and route validators remain the
 // historical editorial source authority. No replacement B2 claim is made.
 buildCommunityBeta();
 const cases=read(path.join(ROOT,SOURCE,'cases.json')),config=read(path.join(ROOT,'scripts/config/s04-c-production-v1.json'));
 const lib=openCardLibrary({directory:libraryDirectory});
 const positions=[],origins=[],releases=new Map();
 for(const [i,id] of ids.entries()){
  const row=cases.cases.find(c=>c.id===id);assert.ok(row,'flavor production: unknown case '+id);
  const source={kind:'puzzle-candidate',id:'community:s04-c-v1/'+id,sha256:originSourceRecordSha256(row)};
  const link=lib.lookup(source);assert.ok(link,'flavor production: missing saved card/link: '+id);
  const card=lib.load(link.cardKey,link.cardIntegritySha256);
  const released=loadReleasedAssetCatalog({repositoryRoot:ROOT,releaseId:link.release.releaseId,backgroundId:link.release.backgroundId});
  const description=describeIllustratedCard({map:row.definition.logic.map,background:config.backgroundId,assetPlacements:row.assetPlacements},released);
  assert.equal(description.key,card.key,'flavor production: original illustration/card mismatch');
  positions.push(createProductionPosition({caseId:id,positionId:'P'+String(i+1).padStart(2,'0'),document:row.definition,
   card,assetLibrary:released.catalog.library,intent:intents?.[i]??{flavorVariantId:'independent-1',revision:1,predecessor:null}}));
  origins.push({caseId:id,source,link,cardIntegritySha256:card.integritySha256,identity:row.fingerprints,candidateId:row.candidateId});
  releases.set(card.key,released);
 }
 const sourceFiles=['cases.json','migration.json'].map(name=>({path:SOURCE+'/'+name,sha256:sha256(fs.readFileSync(path.join(ROOT,SOURCE,name)))}));
 return {positions,releases,origin:{schemaVersion:1,kind:'existing-s04-c-editorial-handoff',sourceFiles,positions:origins}};
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function packageInventory(files){return {schemaVersion:1,files:[...files].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,bytes])=>({path:name,bytes:Buffer.byteLength(bytes),sha256:sha256(bytes)}))};}
export function createProductionPackage({positions,releases,world=loadWorldPackage(),editorial={goal:PILOT_GOAL,impulses:[],themes:[],context:null}}){
 const prompt=fs.readFileSync(path.join(ROOT,'content/flavor/production-v1/prompt.md')),
  rules=fs.readFileSync(path.join(ROOT,'content/flavor/production-v1/rules.md')),schema=json(productionResponseSchema);
 let order=createProductionOrder({positions,world:world.reference,editorial,
 inputHashes:{rules:sha256(rules),prompt:sha256(prompt),responseSchema:sha256(schema),references:sha256('')}});
 const files=new Map([['order.json',json(order)],['prompt.md',prompt],['rules.md',rules],['response.schema.json',schema]]);
 for(const [ref,bytes] of world.files)files.set('world/'+ref,bytes);
 const resources=new Map(),articles=[];
 for(const p of order.positions){
  const released=releases.get(p.cardRef);assert.ok(released,'flavor production: missing verified release');
  const {library}=released.catalog,chartFiles=released.chartContract.format.files;
  const refs=[...new Set([chartFiles.sea,chartFiles.frame,...p.card.assetPlacements.map(x=>library.assets.find(a=>a.id===x.assetId).image.path)])];
  const paths=new Map();
  for(const ref of refs){
   assert.ok(/\.(png|webp)$/.test(ref),'flavor production: unsupported image type');
   const bytes=released.readResource(ref),name='resources/'+sha256(bytes)+path.extname(ref);
   if(resources.has(name))assert.ok(resources.get(name).bytes.equals(bytes));
   else resources.set(name,{ref,bytes});
   paths.set(ref,name);
  }
  const resolveImage=ref=>{
   const key=ref.startsWith('https://released.invalid/')?new URL(ref).pathname.slice(1):ref;
   assert.ok(paths.has(key),'flavor production: non-allowlisted image');
   return '../'+paths.get(key);
  };
  const svg=renderSavedMapSvg({map:p.card.map,placements:p.card.assetPlacements,prefix:p.positionId+'-',
   title:p.caseId+' · öffentliche Karte',coordinates:true},library,chartFiles,resolveImage);
  files.set('maps/'+p.positionId+'.svg',svg+'\n');
  const start=p.card.map.objects.find(o=>o.cells.includes(p.request.source.logic.start));
  const rows=p.card.map.objects.map(o=>'<tr><td>'+escape(o.id)+'</td><td>'+escape(p.card.objectNames[o.id])+'</td><td>'+o.cells.join(', ')+'</td><td>'+o.passable+'</td><td>'+p.card.assetPlacements.filter(x=>x.objectId===o.id).map(x=>escape(x.assetId)+' @ '+x.anchor).join(', ')+'</td></tr>').join('');
  articles.push('<article><h2>'+escape(p.positionId+' · '+p.caseId)+'</h2><p>Start: '+escape(p.request.source.logic.start+' · '+start.id+' · '+p.card.objectNames[start.id])+'. Etappen: '+p.request.source.logic.steps+'. Hinweise: '+p.request.source.logic.clues.length+'.</p><object type="image/svg+xml" data="maps/'+p.positionId+'.svg" aria-label="Öffentliche Karte '+p.caseId+'"></object><table><tr><th>Objekt</th><th>Name</th><th>Zellen</th><th>Befahrbar</th><th>Motiv / Anker</th></tr>'+rows+'</table><ol>'+p.request.source.logic.clues.map(c=>'<li><code>'+escape(c.id)+'</code>: '+escape(p.request.source.presentation.clueTexts[c.id])+'</li>').join('')+'</ol><p>Kartenreferenz: '+escape(p.cardRef)+'</p></article>');
 }
 decodeContactImages([...resources.values()]);
 // Only resources actually selected above. Their verified original bytes are
 // referenced locally; no complete catalog or repository is transported.
 for(const [ref,{bytes}] of resources)files.set(ref,bytes);
 files.set('index.html','<!doctype html>\n<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flavor-Produktionsauftrag</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;padding:16px;color:#17232a}object{display:block;width:100%;max-width:800px;aspect-ratio:563/473}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid #9ca;padding:6px;text-align:left}article{margin-bottom:48px}p{overflow-wrap:anywhere}</style><h1>Öffentlicher Produktionsauftrag</h1><p>'+escape(editorial.goal)+'</p><p>Vollständige Daten: order.json. Verbindliche Eingaben: prompt.md, rules.md und world/. Keine externe Anwendung oder nachzuladenden Quellen.</p>'+articles.join('\n')+'</html>\n');
 order=createProductionOrder({...order,inputHashes:{...order.inputHashes,references:referenceFilesHash(files)}});
 files.set('order.json',json(order));
 files.set('response-template.json',json({contractVersion:1,orderId:order.orderId,positions:order.positions.map(p=>({...responseReferences(p),status:'complete',title:'TITEL ERSETZEN',intro:['EINLEITUNG ERSETZEN'],
 clues:p.request.source.logic.clues.map(c=>({id:c.id,text:'HINWEISTEXT ERSETZEN'})),metadata:{form:'ERZÄHLFORM ERSETZEN',themes:[],worldMotifs:[],inventions:[]}}))}));
 files.set('README.txt','Dieses vollständige Verzeichnis an einen separaten Produktionschat ohne Repository-/Projektquellen übergeben. prompt.md ist die exakte Anweisung. Alle vier Karten stehen in index.html und maps/. Keine Geschichten sind enthalten. Ergebnis als unveränderte UTF-8-JSON-Datei zurückgeben. response-template.json ist ausschließlich eine auszufüllende Vorlage. Fehlermeldungen entsprechen response.schema.json. inventory.json bindet alle anderen Dateien und enthält bewusst keinen Selbsthash. Nur diesen öffentlichen Ordner übergeben; der lokale Store mit Herkunftsbindung bleibt zurück.\n');
 files.set('inventory.json',json(packageInventory(files)));
 verifyProductionPackage(files);return {order,files};
}
export function verifyProductionPackage(files){
 assert.ok(files.has('inventory.json'),'flavor production: missing inventory');
 const inventory=JSON.parse(files.get('inventory.json'));
 same(inventory,packageInventory(new Map([...files].filter(([name])=>name!=='inventory.json'))),'package inventory mismatch');
 const order=validateProductionOrder(JSON.parse(files.get('order.json')));
 for(const [name,key] of [['rules.md','rules'],['prompt.md','prompt'],['response.schema.json','responseSchema']])
  assert.equal(sha256(files.get(name)),order.inputHashes[key],'flavor production: input hash mismatch '+name);
 const manifest=JSON.parse(files.get('world/manifest.json'));structure(manifest,worldManifestSchema);
 same(manifest.files.map(f=>f.path),['world.md','style.md','production.md'],'world file coverage');
 for(const f of manifest.files)assert.equal(sha256(files.get('world/'+f.path)),f.sha256,'flavor production: world file mismatch');
 same(order.world,{packageId:manifest.packageId,version:manifest.version,packageHash:sha256(files.get('world/manifest.json'))},'world binding');
 assert.equal(order.inputHashes.references,referenceFilesHash(files),'flavor production: public reference files hash');
 same(JSON.parse(files.get('response.schema.json')),productionResponseSchema,'response schema');
 return order;
}

// These files contain no order ID; hash them before inserting that ID elsewhere.
function referenceFilesHash(files){return contentHash(packageInventory(new Map([...files].filter(([name])=>name==='index.html'||name.startsWith('maps/')||name.startsWith('resources/')))));}
