import fs from 'node:fs';
const read=ref=>JSON.parse(fs.readFileSync(new URL('../../'+ref,import.meta.url)));

// All approval metadata belongs to this intercepted automated fixture only.
// The repository's actual catalog keeps every technical asset pending.
export async function interceptNewAssets(page){
 const document=read('puzzles/reference-3.6.json'),library=read('assets/catalog/library.json');
 document.presentation.overlays=document.presentation.overlays.filter(o=>!['insel-einzeln-01.png','insel-zweier-01.png','leuchtturm-01.png'].includes(o.asset));
 document.presentation.assetBackground='sea-blue-01';
 document.presentation.assetPlacements=[
  {id:'single',assetId:'technical.single.v1',anchor:'E2',placeId:'cliffs'},
  {id:'double',assetId:'technical.double.v1',anchor:'B3',placeId:'tesoro'},
  {id:'light',assetId:'technical.lighthouse.v1',anchor:'C1',placeId:'lighthouse'},
  {id:'decoration',assetId:'technical.decoration.v1',anchor:'D1'}
 ];
 for(const a of library.assets){a.stage='illustration';a.production='enabled';}
 for(const r of library.reviews)Object.assign(r,{status:'approved',reviewer:'Automated intercepted fixture only',date:'2026-10-18',assetSha256:'0'.repeat(64),backgroundSha256:'0'.repeat(64)});
 await page.route('**/puzzles/reference-3.6.json',r=>r.fulfill({json:document}));
 await page.route('**/assets/catalog/library.json',r=>r.fulfill({json:library}));
}
