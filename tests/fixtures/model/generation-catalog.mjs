import {asset,catalog} from './factories.mjs';
import {syntheticCatalog} from './asset-context.mjs';
import {createCatalogProfile} from '../../../src/assets/assignment.mjs';
const forms=[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[1,1]],[[0,0],[1,0],[0,1],[1,1]]];
export const generationCatalog=syntheticCatalog(catalog(forms.flatMap((cells,size)=>[false,true].flatMap(passable=>
 Array.from({length:4},(_,i)=>asset('test.form-'+size+'-'+Number(passable)+'-'+i,cells,passable))))));
export const catalogProfile=createCatalogProfile(generationCatalog);
