import {asset,catalog,map} from './factories.mjs';
import {syntheticCatalog} from './asset-context.mjs';
import {placedCells} from '../../../src/assets/geometry.mjs';

// Inputs for results captured from the reviewed a233965 implementation. No
// alternate validation implementation is retained in the regression suite.
export function assignmentCases(){
 const cases=[];
 const add=(name,mutate=()=>{},seed=0)=>{
  const c=syntheticCatalog(catalog([asset('test.one'),asset('test.two'),asset('test.double',[[0,0],[1,0]],true)]));
  const input={map:map(),seed,catalog:c};input.map.objects[1].cells=['B2'];mutate(input);
  cases.push({name,input});
 };
 add('complete');
 add('complete-seed-19',()=>{},19);
 add('partial',i=>i.map.objects[1].cells=['A1','A2']);
 add('none',i=>{i.map.objects[0].cells=['A1','A2'];i.map.objects[1].cells=['D4','E5'];});
 add('empty-map',i=>i.map.objects=[]);
 add('translated-multicell',i=>i.map.objects[0].cells=['B4','C4']);
 for(const [name,mutate] of [
  ['production-draft',c=>c.library.assets.forEach(a=>a.production='draft')],
  ['approval-pending',c=>c.library.reviews.forEach(r=>r.status='pending')],
  ['wrong-passability',c=>c.library.assets.forEach(a=>a.passable=!a.passable)],
  ['image-rejected',c=>c.verification.assets.forEach(a=>a.error='synthetic image error')],
  ['position-rejected',c=>c.verification.assets.forEach(a=>{a.anchors=[];a.rejected=[{anchor:'B2',error:'synthetic safety boundary'}];})],
  ['missing-check',c=>c.verification.assets=[]],
  ['duplicate-check-first-wins',c=>c.verification.assets.unshift({...c.verification.assets[0],anchors:[],error:'first check'})],
  ['extraneous-check-ignored',c=>c.verification.assets.push({assetId:'unknown',anchors:[]})],
 ])add(name,i=>{mutate(i.catalog);i.catalog.verification.librarySnapshot=JSON.stringify(i.catalog.library);});
 add('missing-verification',i=>delete i.catalog.verification);
 add('malformed-verification-assets',i=>delete i.catalog.verification.assets);
 add('stale-metadata',i=>i.catalog.library.assets[0].semanticClass='atoll');
 add('invalid-digest',i=>i.catalog.verification.catalogSha256='bad');
 add('wrong-verification-background',i=>i.catalog.verification.backgroundId='other');
 add('unknown-review-reference',i=>i.catalog.library.reviews[0].assetId='missing');
 add('invalid-semantic-version',i=>i.catalog.library.semanticVersion=2);
 add('empty-catalog',i=>i.catalog=syntheticCatalog(catalog([])));
 add('asymmetric-footprint',i=>{
  const a=asset('test.asymmetric',[[0,0],[1,0],[1,1]],true);
  i.catalog=syntheticCatalog(catalog([a]));i.map.objects=[{id:'port',cells:placedCells(a,'B2'),passable:true}];
 });
 return cases;
}

export function placementCases(){
 const cases=[];
 const add=(name,mutate=()=>{})=>{
  const deco=asset('test.deco');deco.role='decoration';deco.semanticClass='decoration';delete deco.passable;
  const input={placements:[{id:'shore-art',assetId:'test.shore',anchor:'B2',objectId:'shore'}],
   library:catalog([asset('test.shore',[[0,0],[1,0]]),asset('test.port',[[0,0],[1,0]],true),deco]),map:map(),backgroundId:'test-sea'};
  mutate(input);cases.push({name,input});
 };
 add('valid-shore');
 add('valid-port',i=>i.placements=[{id:'port-art',assetId:'test.port',anchor:'C3',objectId:'port'}]);
 add('outside',i=>i.placements[0].anchor='E5');
 add('wrong-footprint',i=>i.placements[0].anchor='C2');
 add('wrong-passability',i=>i.placements[0].assetId='test.port');
 add('missing-object',i=>delete i.placements[0].objectId);
 add('unknown-object',i=>i.placements[0].objectId='unknown');
 add('unknown-asset',i=>i.placements[0].assetId='unknown');
 add('rotation',i=>i.placements[0].rotation=60);
 add('mirror',i=>i.placements[0].mirror=true);
 add('pending',i=>i.library.reviews[0].status='pending');
 add('draft',i=>i.library.assets[0].production='draft');
 add('unknown-background',i=>i.backgroundId='missing');
 add('duplicate-id',i=>i.placements.push({...i.placements[0]}));
 add('duplicate-representation-overlap',i=>i.placements.push({...i.placements[0],id:'second'}));
 add('decoration-overlap',i=>i.placements=[{id:'deco',assetId:'test.deco',anchor:'B2'}]);
 add('decoration-free',i=>i.placements=[{id:'deco',assetId:'test.deco',anchor:'A1'}]);
 add('unknown-review-reference',i=>i.library.reviews[0].backgroundId='missing');
 add('development-draft',i=>{i.library.assets[0].production='draft';i.options={development:true};});
 add('explicit-approval-over-wildcard',i=>i.library.reviews.push({assetId:'test.shore',backgroundId:'*',status:'rejected',notes:'synthetic'}));
 return cases;
}
