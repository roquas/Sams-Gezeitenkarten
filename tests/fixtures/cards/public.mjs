// Artificial geography. Technical IDs carry no implicit motive or world meaning.
import {GEOMETRY} from '../../../src/puzzles/schema.mjs';
import {defaultNameSupply} from '../../../scripts/lib/card-library.mjs';
import {placedCells} from '../../../src/assets/geometry.mjs';
export const supply=()=>defaultNameSupply();
export const ROCK='land-coast.island.h1.basalt-spire-water.v1';
export const BUOY='sea-life.accent.h1.buoy.v1';
export const TESORO='land-coast.settlement.h4.tesoro.v4';
export function fixture(released,items=[['north',ROCK,'A1'],['south',ROCK,'D4']]){
 const assets=new Map(released.catalog.library.assets.map(a=>[a.id,a]));
 return {map:{geometry:GEOMETRY,grid:{columns:5,rows:5},objects:items.map(([id,assetId,anchor])=>({id,
  cells:placedCells(assets.get(assetId),anchor),passable:assets.get(assetId).passable}))},
 background:released.catalog.backgroundId,assetPlacements:items.map(([objectId,assetId,anchor],i)=>({id:'source-art-'+i,objectId,assetId,anchor}))};
}
export const source=(id='fixture/run-1',sha256='1'.repeat(64))=>({kind:'illustrated-map',id,sha256});
