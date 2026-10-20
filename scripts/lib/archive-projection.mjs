// Node-only integration; the public DTO module itself imports no Node modules.
import {validateArchive,logicalFingerprints,sha256} from './publication-archive.mjs';
import {projectPublicPuzzle} from './public-puzzle.mjs';

export function createArchiveProjector(manifest,{readBytes}){
 const archive=structuredClone(manifest);
 validateArchive(archive,{readBytes});
 const publications=new Map(archive.publications.map(p=>[p.publicationId,p]));
 const snapshots=new Map(archive.snapshots.map(s=>[s.snapshotId,s]));
 return {project(publicationId){
  const entry=publications.get(publicationId);
  if(!entry)throw Error('Unknown source publication');
  const bytes=readBytes(entry.source.path,snapshots.get(entry.snapshotId).commit);
  if(sha256(bytes)!==entry.source.sha256)throw Error('Source publication bytes changed');
  const document=JSON.parse(Buffer.from(bytes).toString('utf8'));
  const actual=logicalFingerprints(document,entry.rulesVersion);
  if(Object.entries(actual).some(([key,value])=>entry.fingerprints[key]!==value))throw Error('Source publication identity mismatch');
  return projectPublicPuzzle(document,{rulesVersion:entry.rulesVersion,identity:{
   mapStructureId:entry.mapStructureId,instanceId:entry.instanceId,variantId:entry.variantId,sourcePublicationId:entry.publicationId}});
 }};
}
