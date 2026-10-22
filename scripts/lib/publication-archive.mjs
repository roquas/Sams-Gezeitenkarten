import {validateDefinition} from '../../src/puzzles/validate.mjs';
import {projectPublicPuzzle,validatePublicPuzzle} from '../../src/puzzles/public.mjs';
// Internal, Node-only archive tooling. Never imported by the browser application.
import {createHash} from 'node:crypto';
import {schemaErrors} from '../../src/puzzles/schema.mjs';
import {validateLogicDefinition,validateMap,validateTarget} from '../../src/engine/validate.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';
import {validateAssetBytes} from '../validate-assets.mjs';

const compare=(a,b)=>a<b?-1:a>b?1:0;
const assert=(ok,message)=>{if(!ok)throw new Error(`archive: ${message}`);};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

// Deliberately narrower than general JSON: no floats, undefined or exotic objects.
export function canonicalJson(value){
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'){
  assert(Number.isSafeInteger(value),'canonical numbers must be safe integers');
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return '['+Array.from(value,canonicalJson).join(',')+']';
 assert(value&&Object.getPrototypeOf(value)===Object.prototype,'canonical value must be plain JSON');
 return '{'+Object.keys(value).sort(compare).map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
}

const domains=new Set(['map','instance','variant','snapshot','publication']);
export function contentFingerprint(domain,value){
 assert(domains.has(domain),'unknown fingerprint domain');
 return `gk-${domain}-v2-sha256:${sha256('gezeitenkarten-content/v2/'+domain+'\0'+canonicalJson(value))}`;
}

export function mapFingerprint(map){
 validateMap(map);
 return contentFingerprint('map',{geometry:map.geometry,grid:map.grid,
  objects:map.objects.map(o=>({id:o.id,cells:[...o.cells].sort(compare),passable:o.passable})).sort((a,b)=>compare(a.id,b.id))});
}
export function logicalFingerprints(document,rulesVersion=document?.rulesVersion){
 validateLogicDefinition(document,{rulesVersion});
 assert(document.solution,'explicit internal target route required');
 validateTarget(document.logic,document.solution);
 const {logic}=document,mapStructure=mapFingerprint(logic.map);
 const instance=contentFingerprint('instance',{mapStructure,rulesVersion,start:logic.start,steps:logic.steps,targetRoute:document.solution});
 const clues=logic.clues.map(({id,...parameters})=>parameters).sort((a,b)=>compare(canonicalJson(a),canonicalJson(b)));
 const variant=contentFingerprint('variant',{instance,clues});
 return {mapStructure,instance,variant};
}

// Never consult today's catalog: every catalog/image byte must belong to this
// snapshot's inventory and match its pinned hash, including approval hashes.
export function snapshotAssetLibrary(snapshot,readBytes){
 const read=path=>{
  const file=snapshot.files.find(f=>f.path===path);
  assert(file,`asset file absent from snapshot: ${path}`);
  const bytes=readBytes(path,snapshot.commit);
  assert(sha256(bytes)===file.sha256,`snapshot bytes changed: ${path}`);
  return bytes;
 };
 const library=JSON.parse(Buffer.from(read(snapshot.assetCatalog)).toString('utf8'));
 return validateAssetBytes(library,read);
}

export function snapshotFingerprint(snapshot){
 return contentFingerprint('snapshot',{commit:snapshot.commit,files:[...snapshot.files].sort((a,b)=>compare(a.path,b.path)),assetCatalog:snapshot.assetCatalog??null});
}

export function publicationFingerprint(entry,snapshot){
 return contentFingerprint('publication',{rulesVersion:entry.rulesVersion,
  instance:entry.fingerprints.instance,variant:entry.fingerprints.variant,
  revision:entry.revision,schemaVersion:entry.schemaVersion,dataVersion:entry.dataVersion,
  publicSource:entry.publicSource,delivery:{files:[...snapshot.files].sort((a,b)=>compare(a.path,b.path)),assetCatalog:snapshot.assetCatalog??null}});
}

const string=pattern=>({type:'string',pattern});
const id=prefix=>({...string(`^${prefix}-[A-Za-z0-9][A-Za-z0-9._-]*$`),maxLength:160});
const digest=string('^[a-f0-9]{64}$');
const fingerprint=domain=>string(`^gk-${domain}-v2-sha256:[a-f0-9]{64}$`);
const integer={type:'integer',minimum:1,maximum:2147483647};
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const array=items=>({type:'array',minItems:0,items});
const path=string('^(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+$');
const source=object({path,sha256:digest});
export const archiveSchema=object({
 archiveSchemaVersion:{const:2},canonicalizationVersion:{const:2},
 snapshots:array(object({snapshotId:id('snapshot'),commit:string('^[a-f0-9]{40}$'),files:array(source),fingerprint:fingerprint('snapshot'),assetCatalog:path},['snapshotId','commit','files','fingerprint'])),
 publications:array(object({publicationId:id('pub'),mapStructureId:id('map'),instanceId:id('inst'),variantId:id('var'),
  rulesVersion:{const:RULES_VERSION},revision:integer,schemaVersion:{const:2},dataVersion:integer,
  source,publicSource:source,snapshotId:id('snapshot'),fingerprints:object({mapStructure:fingerprint('map'),instance:fingerprint('instance'),variant:fingerprint('variant'),publication:fingerprint('publication')})}))
});

function unique(items,key,label){
 const values=items.map(key);
 assert(new Set(values).size===values.length,`duplicate ${label}`);
}
function bind(forward,reverse,id,fingerprint){
 assert(!forward.has(id)||forward.get(id)===fingerprint,`conflicting identity ${id}`);
 assert(!reverse.has(fingerprint)||reverse.get(fingerprint)===id,`multiple IDs for ${fingerprint}`);
 forward.set(id,fingerprint);reverse.set(fingerprint,id);
}

// readBytes(path, commit) must read the pinned snapshot, not an arbitrary latest file.
// previous is a trusted earlier manifest: accepted publications/snapshots are append-only.
export function validateArchive(manifest,{readBytes,previous}={}){
 const errors=schemaErrors(manifest,archiveSchema);
 assert(!errors.length,errors.join('; '));
 assert(typeof readBytes==='function','snapshot byte reader required');
 unique(manifest.snapshots,s=>s.snapshotId,'snapshot ID');
 unique(manifest.publications,p=>p.publicationId,'publication ID');
 unique(manifest.publications,p=>canonicalJson([p.variantId,p.revision]),'variant revision');
 const snapshots=new Map(manifest.snapshots.map(s=>[s.snapshotId,s]));
 const bindings=new Map(),reverseBindings=new Map(),bytesBySnapshot=new Map();
 const identity=(domain,id,fp)=>{
  if(!bindings.has(domain)){bindings.set(domain,new Map());reverseBindings.set(domain,new Map());}
  bind(bindings.get(domain),reverseBindings.get(domain),id,fp);
 };
 for(const snapshot of manifest.snapshots){
  unique(snapshot.files,f=>f.path,'snapshot path');
  const bytes=new Map();
  for(const file of snapshot.files){
   assert(!file.path.split('/').some(p=>p==='.'||p==='..'),'unsafe snapshot path');
   const data=readBytes(file.path,snapshot.commit);
   assert(sha256(data)===file.sha256,`snapshot bytes changed: ${file.path}`);
   bytes.set(file.path,data);
  }
  assert(snapshotFingerprint(snapshot)===snapshot.fingerprint,'snapshot fingerprint mismatch');
  identity('snapshot',snapshot.snapshotId,snapshot.fingerprint);
  bytesBySnapshot.set(snapshot.snapshotId,bytes);
 }
 for(const entry of manifest.publications){
  const snapshot=snapshots.get(entry.snapshotId);
  assert(snapshot,`missing snapshot ${entry.snapshotId}`);
  // Internal provenance is pinned separately from the delivered inventory.
  // Private metadata must not influence the publication's content identity.
  assert(!snapshot.files.some(f=>f.path===entry.source.path),'internal definition must not be delivered');
  assert(!entry.source.path.split('/').some(p=>p==='.'||p==='..'),'unsafe internal source path');
  const bytes=readBytes(entry.source.path,snapshot.commit);
  assert(sha256(bytes)===entry.source.sha256,`source fingerprint mismatch: ${entry.source.path}`);
  const document=JSON.parse(Buffer.from(bytes).toString('utf8'));
  assert(document.schemaVersion===entry.schemaVersion&&document.dataVersion===entry.dataVersion,'source versions disagree');
  const assetLibrary=snapshot.assetCatalog?
   snapshotAssetLibrary(snapshot,path=>bytesBySnapshot.get(snapshot.snapshotId).get(path)):undefined;
  const actual=logicalFingerprints(document,entry.rulesVersion);
  validateDefinition(document,{assetLibrary});
  const delivered=bytesBySnapshot.get(entry.snapshotId).get(entry.publicSource.path);
  assert(delivered!==undefined,'public source absent from delivered snapshot');
  assert(sha256(delivered)===entry.publicSource.sha256,'public source hash mismatch');
  const dto=validatePublicPuzzle(JSON.parse(Buffer.from(delivered).toString('utf8')),{assetLibrary});
  const publicIdentity={mapStructureId:entry.mapStructureId,instanceId:entry.instanceId,variantId:entry.variantId,
   ...(dto.identity.sourcePublicationId?{sourcePublicationId:dto.identity.sourcePublicationId}:{})};
  const projected=projectPublicPuzzle(document,{assetLibrary,identity:publicIdentity});
  assert(canonicalJson(dto)===canonicalJson(projected),'delivered public puzzle disagrees with internal definition');
  for(const [domain,field] of [['mapStructure','mapStructureId'],['instance','instanceId'],['variant','variantId']]){
   assert(actual[domain]===entry.fingerprints[domain],`${domain} fingerprint mismatch`);
   identity(domain,entry[field],actual[domain]);
  }
  assert(publicationFingerprint(entry,snapshot)===entry.fingerprints.publication,'publication fingerprint mismatch');
 }
 if(previous){
  assert(previous.archiveSchemaVersion===manifest.archiveSchemaVersion&&previous.canonicalizationVersion===manifest.canonicalizationVersion,'archive version migration requires an explicit new validator');
  for(const [field,key] of [['snapshots',s=>s.snapshotId],['publications',p=>p.publicationId]]){
   const current=new Map(manifest[field].map(row=>[key(row),row]));
   for(const old of previous[field])assert(canonicalJson(current.get(key(old))??null)===canonicalJson(old),`frozen ${field} changed or removed: ${key(old)}`);
  }
  const acceptedIds=new Set(previous.publications.map(p=>p.publicationId));
  for(const entry of manifest.publications)if(!acceptedIds.has(entry.publicationId)){
   const latest=Math.max(0,...previous.publications.filter(p=>p.variantId===entry.variantId).map(p=>p.revision));
   assert(entry.revision>latest,`new publication revision must exceed ${latest}: ${entry.variantId}`);
  }
 }
 return manifest;
}

export function resolveContentId(manifest,domain,fingerprint){
 const field={mapStructure:'mapStructureId',instance:'instanceId',variant:'variantId'}[domain];
 assert(field,'unknown logical identity domain');
 return manifest.publications.find(p=>p.fingerprints[domain]===fingerprint)?.[field];
}
