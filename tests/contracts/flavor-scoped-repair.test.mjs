import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {flavorFixture} from '../fixtures/flavor/public.mjs';
import {createFlavorRequest,createFlavorDraft,createFlavorCheckpoint} from '../../scripts/lib/flavor-contract.mjs';
import {applyScopedPatch} from '../../scripts/lib/flavor-scoped-repair.mjs';
const copy=structuredClone;
function setup(){
 const request=createFlavorRequest(flavorFixture()),draft=createFlavorDraft(request),ref={caseId:'synthetic',flavorVariantId:'technical',revision:1,revisionHash:'a'.repeat(64)};
 const prior={request,draft,revisionHash:ref.revisionHash};
 const authorization={version:1,jobId:'repair',predecessor:ref,sourceHash:request.sourceHash,methodHash:'b'.repeat(64),findings:[{id:'f1',severity:'ERROR',rationale:'Synthetic scope test'}],
 targets:[{field:'title'},{field:'intro',index:0},{field:'clue',id:'place'},{field:'clue',id:'count'}],actor:'test',reason:'required synthetic fixes',timestamp:'2026-11-26T10:00:00Z'};
 const patch={version:1,jobId:'repair',predecessor:ref,changes:[{target:{field:'title'},value:'Synthetic revised title'},{target:{field:'intro',index:0},value:'Synthetic revised intro'},
 {target:{field:'clue',id:'place'},value:'Synthetic revised place clue'},{target:{field:'clue',id:'count'},value:'Synthetic revised count clue'}]};return {prior,authorization,patch};
}
test('pure apply bundles fields into one complete checkpoint and preserves every unapproved byte',()=>{
 const f=setup(),before=copy(f.prior),{draft,checkpoint}=applyScopedPatch(f.prior,f.authorization,f.patch);assert.equal(draft.revision,2);assert.deepEqual(checkpoint,createFlavorCheckpoint(f.prior.request,draft));
 assert.deepEqual(f.prior,before);assert.deepEqual(draft.resultTexts,before.draft.resultTexts);assert.deepEqual(draft.presentation.objectNames,before.draft.presentation.objectNames);
 assert.deepEqual(draft.presentation.cluePlaceRefs,before.draft.presentation.cluePlaceRefs);for(const id of ['direction','turn','position','between'])assert.equal(draft.presentation.clueTexts[id],before.draft.presentation.clueTexts[id]);
});
for(const [name,mutate] of [
 ['extra target',f=>f.patch.changes.push({target:{field:'clue',id:'direction'},value:'unauthorized'})],
 ['duplicate target',f=>f.patch.changes.push(copy(f.patch.changes[0]))],
 ['renaming',f=>f.patch.changes.push({target:{field:'objectNames'},value:'renamed'})],
 ['logic injection',f=>f.patch.logic={}],['source mutation',f=>f.patch.sourceHash='c'.repeat(64)],
 ['wrong predecessor',f=>f.patch.predecessor={...f.patch.predecessor,revisionHash:'d'.repeat(64)}],
 ['wrong source authorization',f=>f.authorization.sourceHash='d'.repeat(64)],
 ['advisory only',f=>f.authorization.findings[0].severity='ADVISORY'],
 ['no-op',f=>f.patch.changes=[{target:{field:'title'},value:f.prior.draft.presentation.title}]],
 ['whole intro without permission',f=>f.patch.changes=[{target:{field:'intro'},value:['Lost text']}]],
 ['missing intro index',f=>f.patch.changes=[{target:{field:'intro',index:99},value:'x'}]],
 ['owner wording mismatch',f=>f.authorization.exactChanges=[{target:{field:'title'},value:'Different approved text'}]],
 ['overlapping scopes',f=>f.authorization.targets.push({field:'intro'})]
])test('scoped repair rejects '+name,()=>{const f=setup();mutate(f);assert.throws(()=>applyScopedPatch(f.prior,f.authorization,f.patch));});

test('new sparse revision upgrades archived v1 names and proof method without changing other player text or historical checkpoint',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('../fixtures/flavor/archived-v1.json',import.meta.url),'utf8')),before=structuredClone(old);
 const f=setup();f.prior={request:old.request,draft:old.checkpoint.draft,revisionHash:f.patch.predecessor.revisionHash};
 f.authorization.sourceHash=old.request.sourceHash;f.authorization.targets=[{field:'title'}];f.patch.changes=[{target:{field:'title'},value:'TECHNICAL v2 TITLE'}];
 const next=applyScopedPatch(f.prior,f.authorization,f.patch);
 assert.equal(next.draft.contractVersion,2);assert.equal(next.checkpoint.contractVersion,2);
 assert.deepEqual(next.draft.presentation.objectNames,old.request.source.presentation.objectNames);
 assert.deepEqual(next.draft.presentation.intro,old.checkpoint.draft.presentation.intro);assert.deepEqual(next.draft.presentation.clueTexts,old.checkpoint.draft.presentation.clueTexts);
 assert.ok(Object.values(next.checkpoint.checks).every(c=>c.method==='flavor-check-v2'&&c.status==='UNCERTAIN'));assert.deepEqual(old,before);
 assert.throws(()=>applyScopedPatch(f.prior,f.authorization,{...f.patch,changes:[{target:{field:'title'},value:old.checkpoint.draft.presentation.title}]}),/no-op/);
});
