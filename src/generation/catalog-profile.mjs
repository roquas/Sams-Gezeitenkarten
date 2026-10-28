import {validateMap} from '../engine/validate.mjs';
import {GEOMETRY} from '../puzzles/schema.mjs';
import {GenerationError,record,integer} from './config.mjs';
import {shapeSignature} from './map-analysis.mjs';

// Internal geographic input, not an asset contract. No rendering metadata or
// asset IDs enter the generator; every proposed footprint still satisfies v2.
export function normalizeCatalogProfile(profile){
 record(profile,['version','catalogSha256','placements','capacities'],'catalogProfile');
 if(profile.version!=='catalog-capacities-1')throw new GenerationError('INVALID_CONFIG','Unsupported catalog profile version');
 if(profile.catalogSha256!==null&&!/^[a-f0-9]{64}$/.test(profile.catalogSha256))throw new GenerationError('INVALID_CONFIG','catalogSha256 must be a SHA-256 or null');
 if(!Array.isArray(profile.placements)||profile.placements.length>10000)throw new GenerationError('INVALID_CONFIG','Expected at most 10000 catalog placements');
 const unique=new Map();
 for(const placement of profile.placements){
  record(placement,['cells','passable'],'catalog placement');
  try{validateMap({geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'profile',...placement}]});}
  catch(error){throw new GenerationError('INVALID_CONFIG','Invalid catalog footprint: '+error.message);}
  const cells=[...placement.cells].sort(),key=Number(placement.passable)+':'+cells.join(',');
  unique.set(key,{cells,passable:placement.passable});
 }
 const placements=[...unique].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,p])=>p);
 if(!Array.isArray(profile.capacities)||profile.capacities.length>10000)throw new GenerationError('INVALID_CONFIG','Invalid catalog capacities');
 const groups=new Map();
 for(const group of profile.capacities){
  record(group,['shape','passable','count'],'catalog capacity');
  integer(group.count,1,10000,'catalog capacity count');
  if(typeof group.passable!=='boolean'||typeof group.shape!=='string')throw new GenerationError('INVALID_CONFIG','Invalid catalog capacity');
  const key=Number(group.passable)+':'+group.shape;
  if(groups.has(key))throw new GenerationError('INVALID_CONFIG','Duplicate catalog capacity');
  groups.set(key,{shape:group.shape,passable:group.passable,count:group.count});
 }
 const shapes=new Set(placements.map(p=>Number(p.passable)+':'+shapeSignature(p.cells)));
 if(shapes.size!==groups.size||[...shapes].some(k=>!groups.has(k)))throw new GenerationError('INVALID_CONFIG','Catalog capacities do not match footprints');
 return {version:profile.version,catalogSha256:profile.catalogSha256,placements,
  capacities:[...groups].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,g])=>g)};
}
