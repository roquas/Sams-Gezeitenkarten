import {cellsOf} from '../../../src/engine/hex.mjs';
import {placedCells} from '../../../src/assets/geometry.mjs';
import {VERIFICATION_VERSION} from '../../../src/assets/assignment.mjs';

const board=cellsOf({columns:5,rows:5});
// Explicit synthetic adapter attestation; never approves production resources.
export function syntheticCatalog(library){
 return {library,backgroundId:'test-sea',verification:{version:VERIFICATION_VERSION,backgroundId:'test-sea',
  catalogSha256:'c'.repeat(64),librarySnapshot:JSON.stringify(library),assets:library.assets.map(a=>({assetId:a.id,
   anchors:board.filter(anchor=>placedCells(a,anchor).every(c=>board.includes(c)))}))}};
}
