import {validateMap} from '../engine/validate.mjs';
import {GEOMETRY} from '../puzzles/schema.mjs';
import {GenerationError,record,integer} from './config.mjs';

// Internal geographic input, not an asset contract. No rendering metadata or
// asset IDs enter the generator; every proposed footprint still satisfies v2.
export function normalizeCatalogProfile(profile){
 record(profile,['version','catalogSha256','preferencePercent','placements'],'catalogProfile');
 if(profile.version!=='catalog-shapes-1')throw new GenerationError('INVALID_CONFIG','Unsupported catalog profile version');
 if(profile.catalogSha256!==null&&!/^[a-f0-9]{64}$/.test(profile.catalogSha256))throw new GenerationError('INVALID_CONFIG','catalogSha256 must be a SHA-256 or null');
 const preferencePercent=integer(profile.preferencePercent,0,100,'preferencePercent');
 if(!Array.isArray(profile.placements)||profile.placements.length>10000)throw new GenerationError('INVALID_CONFIG','Expected at most 10000 catalog placements');
 const unique=new Map();
 for(const placement of profile.placements){
  record(placement,['cells','passable'],'catalog placement');
  try{validateMap({geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[{id:'profile',...placement}]});}
  catch(error){throw new GenerationError('INVALID_CONFIG','Invalid catalog footprint: '+error.message);}
  const cells=[...placement.cells].sort(),key=Number(placement.passable)+':'+cells.join(',');
  unique.set(key,{cells,passable:placement.passable});
 }
 return {version:profile.version,catalogSha256:profile.catalogSha256,preferencePercent,
  placements:[...unique].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,p])=>p)};
}
