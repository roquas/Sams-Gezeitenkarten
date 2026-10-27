// Node/Git adapter for generation. Approval and evidence validation belong to
// the release loader; this module neither decodes images nor prepares anchors.
import {loadCatalogRelease} from './catalog-release.mjs';
import {resourcePath} from './catalog-release-format.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

export const RELEASED_ASSET_CATALOG_VERSION='released-asset-catalog-1';

function frozen(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  Object.values(value).forEach(frozen);Object.freeze(value);
 }
 return value;
}

// Pure assignment/profile services retain their trusted-adapter contract.
// Only this entry point establishes that their data came from an approved
// release. A release ID supplied alongside arbitrary metadata is not evidence.
export function loadReleasedAssetCatalog({repositoryRoot,releaseId,backgroundId}){
 if(typeof backgroundId!=='string'||!backgroundId.length)throw Error('released-asset-catalog: explicit background ID required');
 const release=loadCatalogRelease({repositoryRoot,releaseId});
 const selection=release.selection.backgrounds.find(b=>b.backgroundId===backgroundId);
 if(!selection)throw Error('released-asset-catalog: background not selected for production: '+backgroundId);
 const {library}=release,background=library.backgrounds.find(b=>b.id===backgroundId);
 const byId=new Map(library.assets.map(a=>[a.id,a]));
 const checks=new Map(release.validation.placements.filter(p=>p.backgroundId===backgroundId).map(p=>[p.assetId,p]));
 const assets=selection.geographicAssetIds.map(assetId=>({assetId,anchors:checks.get(assetId).anchors}));
 const readResource=ref=>release.readResource(resourcePath(release.manifest.resourceBase,ref));
 // Preserve the existing technical digest, including its reference paths and
 // complete library. It is distinct from both catalogId and releaseId.
 const references=[...new Set([background.image,...selection.geographicAssetIds.map(id=>byId.get(id).image.path)])].sort();
 const resources=references.map(ref=>({path:ref,sha256:sha256(readResource(ref))}));
 const checkerVersion=release.validation.versions.pixelChecker;
 const catalogSha256=sha256(canonicalJson({library,backgroundId,resources,checkerVersion}));
 // Keep nonselected metadata for the established candidate diagnostics. Only
 // the release selection receives verification entries and can be assigned.
 const catalog=frozen({library,backgroundId,verification:{version:checkerVersion,backgroundId,
  librarySnapshot:JSON.stringify(library),catalogSha256,assets}});
 const provenance=frozen({adapterVersion:RELEASED_ASSET_CATALOG_VERSION,releaseId:release.releaseId,catalogId:release.catalogId,
  sourceCommit:release.manifest.sourceCommit,archiveCommit:release.archiveCommit,backgroundId,catalogSha256});
 // Reads cover the verified inventory (also archived, nonproductive resources),
 // with the same copy isolation as the loader. They do not grant selection.
 return Object.freeze({catalog,provenance,readResource});
}
