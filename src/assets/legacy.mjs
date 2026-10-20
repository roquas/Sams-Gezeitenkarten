import {MOTIFS} from '../puzzles/assets.mjs';

// Explicit transition catalog. These illustrations predate the local footprint
// contract; retain their sizes, offsets and the historical 3-cell stretch.
// No entry is a visually approved modern asset or supplies movement rules.
export const LEGACY_ASSETS=Object.entries(MOTIFS).map(([reference,motif])=>({
 id:'legacy.'+reference.replace('.png',''),reference,family:'legacy-chart',
 type:reference.startsWith('segelboot')?'ship':reference.startsWith('leuchtturm')?'lighthouse':reference.startsWith('krabbe')?'accent':'island',
 stage:'legacy',motif,compatibility:'unreviewed',
 exception:motif?'Historical size/offset/footprint retained; replace with separately approved illustration.':'Crab accent historically omitted; retain associated island.'
}));
export function legacyOverlay(overlay){
 const entry=LEGACY_ASSETS.find(a=>a.reference===overlay.asset);
 if(!entry)throw Error('Unmapped chart motif: '+overlay.asset);
 if(!entry.motif)return null;
 const extent=overlay.cells.length>2?{w:overlay.w,h:overlay.h,dx:overlay.dx,dy:overlay.dy}:{};
 return {...overlay,...entry.motif,...extent,assetId:entry.id,legacy:true,asset:'assets/seekarte/'+entry.motif.asset};
}
