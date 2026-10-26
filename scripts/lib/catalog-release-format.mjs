// Release v1 contracts. No image decoding, subprocesses or working-tree reads.
import {isDeepStrictEqual} from 'node:util';
import {canonicalJson,sha256} from './publication-archive.mjs';
import {resolvePackagePath} from './package-path.mjs';
import {validateLibrary,librarySchema,productionEnabled} from '../../src/assets/library.mjs';
import {validateAssetBytes} from '../validate-assets.mjs';
import {placedCells} from '../../src/assets/geometry.mjs';
import {cellsOf} from '../../src/engine/hex.mjs';

export const POLICY_PATH='scripts/config/catalog-release-v1.json';
export const RELEASE_ROOT='archive/catalog-releases';
export const CANDIDATE_FILES=['inventory.json','manifest.json','selection.json','validation.json'];
export const RELEASE_FILES=[...CANDIDATE_FILES,'approval.json'].sort();
export const VERSIONS=Object.freeze({driver:'catalog-release-checks-1',librarySchema:2,assetSemantics:1,
 geometry:'even-row-offset-pointy-v1',pixelChecker:'asset-placement-pixels-2',frameContract:4});
export const assert=(ok,message)=>{if(!ok)throw Error('catalog-release: '+message);};
export const same=(a,b,message)=>assert(isDeepStrictEqual(a,b),message);
export const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export const commit=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
export const releaseIdValid=value=>typeof value==='string'&&/^gk-catalog-release-v1-sha256-[a-f0-9]{64}$/.test(value);
export const jsonBytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
export const parse=bytes=>JSON.parse(Buffer.from(bytes).toString('utf8'));
export function record(value,keys,label){
 assert(value&&Object.getPrototypeOf(value)===Object.prototype,label+': expected object');
 same(Object.keys(value).sort(),[...keys].sort(),label+': missing or unknown fields');
}
export function safePath(value){
 assert(typeof value==='string'&&/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value)&&
  !value.split('/').some(p=>p==='.'||p==='..'),'unsafe path: '+value);
 same(resolvePackagePath('.',value),value,'noncanonical path: '+value);return value;
}
export const resourcePath=(base,ref)=>safePath(resolvePackagePath(base,safePath(ref)));
export const catalogIdentity=inventory=>'gk-catalog-content-v1-sha256-'+sha256('gezeitenkarten/catalog-content/v1\0'+canonicalJson(inventory));
export function releaseIdentity(manifest){
 const {releaseId,...content}=manifest;
 return 'gk-catalog-release-v1-sha256-'+sha256('gezeitenkarten/catalog-release/v1\0'+canonicalJson(content));
}
export const implementationIdentity=files=>sha256('gezeitenkarten/catalog-checker/v1\0'+canonicalJson(files));
export const checkerPath=p=>/^(src|scripts)\/.*\.(mjs|py)$/.test(p);

// The closure is derived from the pinned policy/catalog/contracts, never from
// today's puzzle manifest or from a second catalog of asset metadata.
export function describeSnapshot(read){
 const policy=parse(read(POLICY_PATH));
 record(policy,['schemaVersion','assetCatalog','resourceBase','librarySchema','graphicContracts','productionBackgrounds'],'policy');
 assert(policy.schemaVersion===1,'unsupported policy version');
 assert(policy.resourceBase==='.'||safePath(policy.resourceBase),'invalid resource base');
 const library=validateLibrary(parse(read(safePath(policy.assetCatalog))));
 same(parse(read(safePath(policy.librarySchema))),librarySchema,'unsupported pinned library schema');
 validateAssetBytes(library,ref=>read(resourcePath(policy.resourceBase,ref)));
 const expected=new Map();
 const add=(p,kind)=>{safePath(p);assert(!expected.has(p)||expected.get(p)===kind,'conflicting resource kinds: '+p);expected.set(p,kind);};
 add(POLICY_PATH,'policy');add(policy.assetCatalog,'catalog');add(policy.librarySchema,'schema');
 assert(Array.isArray(policy.graphicContracts)&&policy.graphicContracts.length>0&&new Set(policy.graphicContracts).size===policy.graphicContracts.length,'missing/duplicate graphic contracts');
 for(const p of policy.graphicContracts)add(p,'graphic-contract');
 for(const a of library.assets)add(resourcePath(policy.resourceBase,a.image.path),'image');
 for(const b of library.backgrounds)add(resourcePath(policy.resourceBase,b.image),'image');
 assert(Array.isArray(policy.productionBackgrounds)&&policy.productionBackgrounds.length>0,'production backgrounds missing');
 const seen=new Set(),contracts=[];
 for(const entry of policy.productionBackgrounds){
  record(entry,['id','chartContract'],'production background');
  assert(typeof entry.id==='string'&&!seen.has(entry.id),'duplicate/invalid production background');seen.add(entry.id);
  const background=library.backgrounds.find(b=>b.id===entry.id);assert(background,'unknown production background: '+entry.id);
  const contractPath=safePath(entry.chartContract),contract=parse(read(contractPath));add(contractPath,'chart-contract');
  assert(contract.format?.version===VERSIONS.frameContract,'unsupported frame contract');
  same(Object.keys(contract.format.files).sort(),['frame','quietFrame','sea'],'incomplete frame resource contract');
  assert(contract.format.files.sea===background.image,'production background disagrees with frame contract');
  for(const ref of Object.values(contract.format.files))add(resourcePath(policy.resourceBase,ref),'image');
  contracts.push({backgroundId:entry.id,path:contractPath,contract});
 }
 const inventory={inventorySchemaVersion:1,files:[...expected].sort(([a],[b])=>a<b?-1:a>b?1:0)
  .map(([path,kind])=>{const bytes=read(path);return {path,kind,bytes:bytes.length,sha256:sha256(bytes)};})};
 const catalogId=catalogIdentity(inventory);
 const selection={selectionSchemaVersion:1,catalogId,backgrounds:policy.productionBackgrounds.map(({id})=>({backgroundId:id,
  geographicAssetIds:library.assets.filter(a=>a.role==='geographic'&&productionEnabled(library,a.id,id)).map(a=>a.id).sort()}))};
 const board=cellsOf({columns:5,rows:5}).sort(),allowed=new Set(board);
 const placements=selection.backgrounds.flatMap(b=>b.geographicAssetIds.map(assetId=>{
  const asset=library.assets.find(a=>a.id===assetId);
  return {backgroundId:b.backgroundId,assetId,status:'passed',method:'local-contract-equality-1',
   anchors:board.filter(anchor=>placedCells(asset,anchor).every(c=>allowed.has(c)))};
 }));
 return {policy,library,contracts,inventory,catalogId,selection,placements};
}

export function validateTechnical(validation,snapshot,implementation){
 record(validation,['validationSchemaVersion','catalogId','versions','implementation','tools','catalog','assets','backgrounds','frames','placements'],'validation');
 assert(validation.validationSchemaVersion===1,'unsupported validation schema');
 same(validation.catalogId,snapshot.catalogId,'validation catalog mismatch');
 same(validation.versions,VERSIONS,'unsupported checker/contract versions');
 same(validation.implementation,implementation,'checker implementation mismatch');
 record(validation.tools,['node','python','pillow','numpy','webp','zlib'],'tools');
 for(const v of Object.values(validation.tools))assert(typeof v==='string'&&/^\d+\.\d+(?:\.[A-Za-z0-9.+-]+)*$/.test(v),'missing/invalid dependency version');
 same(validation.catalog,{schema:'passed',references:'passed',reviewHashes:'passed'},'incomplete catalog checks');
 const byPath=new Map(snapshot.inventory.files.map(f=>[f.path,f]));
 const {library,policy}=snapshot;
 assert(Array.isArray(validation.assets)&&validation.assets.length===library.assets.length,'incomplete asset results');
 library.assets.forEach((a,i)=>{
  const result=validation.assets[i];record(result,['assetId','path','sha256','format','width','height','checks'],'asset result');
  const p=resourcePath(policy.resourceBase,a.image.path);
  same({assetId:result.assetId,path:result.path,sha256:result.sha256,width:result.width,height:result.height},
   {assetId:a.id,path:p,sha256:byPath.get(p).sha256,width:a.image.width,height:a.image.height},'asset result mismatch/duplicate: '+a.id);
  assert(['PNG','WEBP'].includes(result.format),'unsupported asset format');
  same(result.checks,{staticFormat:'passed',dimensions:'passed',alpha:'passed',nonempty:'passed',orientation:'passed',localPixels:'passed'},'incomplete asset checks');
 });
 assert(Array.isArray(validation.backgrounds)&&validation.backgrounds.length===library.backgrounds.length,'incomplete background results');
 library.backgrounds.forEach((b,i)=>{
  const result=validation.backgrounds[i];record(result,['backgroundId','path','sha256','format','width','height','checks'],'background result');
  const p=resourcePath(policy.resourceBase,b.image);
  same({backgroundId:result.backgroundId,path:result.path,sha256:result.sha256},
   {backgroundId:b.id,path:p,sha256:byPath.get(p).sha256},'background result mismatch/duplicate');
  assert(['PNG','WEBP'].includes(result.format)&&Number.isSafeInteger(result.width)&&result.width>0&&Number.isSafeInteger(result.height)&&result.height>0,'invalid background image result');
  same(result.checks,{staticFormat:'passed',decode:'passed'},'incomplete background checks');
 });
 same(validation.placements,snapshot.placements,'incomplete/duplicate geographic anchors');
 assert(Array.isArray(validation.frames)&&validation.frames.length===snapshot.contracts.length,'incomplete frame checks');
 snapshot.contracts.forEach(({backgroundId,path,contract},i)=>{
  const entry=validation.frames[i];record(entry,['backgroundId','contractPath','resources','report'],'frame entry');
  same(entry.backgroundId,backgroundId,'frame background mismatch');same(entry.contractPath,path,'frame contract mismatch');
  same(entry.resources,Object.fromEntries(Object.entries(contract.format.files).map(([kind,ref])=>{
   const p=resourcePath(policy.resourceBase,ref);return [kind,{path:p,sha256:byPath.get(p).sha256}];
  })),'frame resources mismatch');
  const r=entry.report;record(r,['status','files','manual_review_required','errors'],'frame report');
  assert(r.status==='passed','frame validation failed');same(r.errors,[],'frame errors');
  same(r.manual_review_required,['neutral object-free sea','no cracks or illustrations in quiet label zones','text contrast in actual SVG','artistic approval'],'missing manual-review boundary');
  same(Object.keys(r.files).sort(),['frame','quietFrame','sea'],'incomplete frame resources');
  for(const kind of ['sea','frame','quietFrame']){
   const f=r.files[kind];
   record(f,kind==='sea'?['size','format','mode']:['size','format','mode','alpha_diagnostics','geographic_graphic_cells','label_zones'],'frame resource result');
   same(f.size,[contract.format.pixels.width,contract.format.pixels.height],'frame dimensions mismatch');
   assert(f.format==='WEBP'&&(kind==='sea'?['RGB','RGBA'].includes(f.mode):f.mode==='RGBA'),'invalid frame format');
   if(kind==='sea')continue;
   same(f.alpha_diagnostics,{},'frame alpha violations');
   record(f.geographic_graphic_cells,['tested_pixel_squares','overlapping_alpha_pixels'],'frame footprint');
   assert(Number.isSafeInteger(f.geographic_graphic_cells.tested_pixel_squares)&&f.geographic_graphic_cells.tested_pixel_squares>0&&f.geographic_graphic_cells.overlapping_alpha_pixels===0,'incomplete/failed frame footprint');
   assert(Array.isArray(f.label_zones)&&f.label_zones.length===contract.zones.headings.items.length,'incomplete frame label checks');
   contract.zones.headings.items.forEach((z,j)=>{
    const actual=f.label_zones[j];record(actual,['side','index','min_luminance','max_luminance'],'label check');
    assert(actual.side===z.side&&actual.index===z.index&&Number.isFinite(actual.min_luminance)&&Number.isFinite(actual.max_luminance)&&
     actual.min_luminance>=0&&actual.max_luminance<=1&&actual.min_luminance<=actual.max_luminance,'invalid/duplicate label check');
   });
  }
 });
}
