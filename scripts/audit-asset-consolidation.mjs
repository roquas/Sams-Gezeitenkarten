/** Verify preservation against the last artistic round; never grant approvals. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validateAssetFiles} from './validate-assets.mjs';
import {productionEnabled} from '../src/assets/library.mjs';
const baseline='ad575f727ad530fe5ec80faa2adbe965bbca612f';
const git=(...args)=>execFileSync('git',args,{maxBuffer:50*1024*1024});
const old=JSON.parse(git('show',baseline+':assets/catalog/library.json'));
const library=validateAssetFiles(JSON.parse(fs.readFileSync('assets/catalog/library.json')));
assert.deepEqual(library.reviews,old.reviews,'No artistic decisions or hashes may change');
assert.deepEqual(library.backgrounds,old.backgrounds);
assert.deepEqual(library.assets.map(({production,...a})=>a),old.assets,'Only release metadata may change');
const rasters=git('ls-tree','-r',baseline,'assets').toString().trim().split('\n')
 .map(line=>line.split('\t')[1]).filter(file=>/\.(png|webp|jpe?g|svg)$/.test(file));
const files=rasters.map(file=>{
 const bytes=fs.readFileSync(file);assert.deepEqual(bytes,git('show',baseline+':'+file),file+' changed');
 return {file,sha256:createHash('sha256').update(bytes).digest('hex'),byteIdenticalToBaseline:true};
});
const approvals=library.reviews.filter(r=>r.status==='approved');
assert.equal(approvals.length,19);
const enabled=library.assets.filter(a=>productionEnabled(library,a.id,'sea-blue-01'));
assert.equal(enabled.length,18);assert.ok(enabled.every(a=>a.role==='geographic'));
const productionCounts=Object.fromEntries(['enabled','draft','historical','deferred'].map(s=>[s,library.assets.filter(a=>a.production===s).length]));
const report={baseline,artisticReviewRecordsPreserved:library.reviews.length,approvedPairsPreserved:approvals.length,
 approvedPairsVerified:approvals.map(r=>({assetId:r.assetId,backgroundId:r.backgroundId,assetSha256:r.assetSha256,backgroundSha256:r.backgroundSha256,exact:true})),
 productionCounts,enabledPlaces:enabled.map(a=>a.id),files};
fs.mkdirSync('docs/reviews/consolidation',{recursive:true});
fs.writeFileSync('docs/reviews/consolidation/preservation-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(`Preserved ${files.length} raster/vector files, all ${library.reviews.length} review records and ${approvals.length} exact approvals; ${enabled.length} productive places.`);
