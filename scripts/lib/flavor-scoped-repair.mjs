// Pure sparse apply: one revision for the complete authorized change.
import assert from 'node:assert/strict';
import {contentHash,same,structure,revisionRefSchema} from './flavor-production.mjs';
import {validateFlavorDraft,createFlavorCheckpoint} from './flavor-contract.mjs';
const text={type:'string',minLength:1,maxLength:12000};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const patchTargetSchema={oneOf:[object({field:{const:'title'}}),object({field:{const:'intro'},index:{type:'integer',minimum:0}}),object({field:{const:'intro'}}),object({field:{const:'clue'},id:text})]};
export const scopedPatchSchema=object({version:{const:1},jobId:text,predecessor:revisionRefSchema,changes:{type:'array',minItems:1,items:object({target:patchTargetSchema,value:{oneOf:[text,{type:'array',minItems:1,items:text}]}})}});
export const targetKey=t=>JSON.stringify(t.field==='clue'?['clue',t.id]:t.field==='intro'?['intro',t.index??'all']:['title']);
export function applyScopedPatch(prior,authorization,patch){
 structure(patch,scopedPatchSchema);same(patch.predecessor,authorization.predecessor,'repair predecessor');assert.equal(patch.jobId,authorization.jobId);
 assert.equal(prior.revisionHash,patch.predecessor.revisionHash);assert.ok(authorization.actor?.trim()&&authorization.reason?.trim()&&authorization.timestamp?.trim(),'repair authorization provenance');
 assert.match(authorization.methodHash,/^[a-f0-9]{64}$/);assert.ok(authorization.findings?.length,'repair requires bound findings and method');
 same(authorization.sourceHash,prior.request.sourceHash,'repair source binding');
 assert.equal(new Set(authorization.findings.map(f=>f.id)).size,authorization.findings.length,'unique bound findings');
 assert.ok(authorization.findings.every(f=>typeof f.id==='string'&&['ERROR','UNCERTAIN'].includes(f.severity)&&f.rationale?.trim()),'mandatory finding evidence');
 if(authorization.exactChanges)same(patch.changes,authorization.exactChanges,'exact owner-approved wording');
 const allowed=authorization.targets.map(t=>{structure(t,patchTargetSchema);return targetKey(t);});assert.equal(new Set(allowed).size,allowed.length);
 assert.ok(!(allowed.includes('["intro","all"]')&&allowed.some(t=>t.startsWith('["intro",')&&t!=='["intro","all"]')),'overlapping intro targets');
 const draft=structuredClone(prior.draft),seen=new Set();
 for(const {target,value} of patch.changes){
  const key=targetKey(target);assert.ok(allowed.includes(key)&&!seen.has(key),'unauthorized or duplicate patch target');seen.add(key);
  if(target.field==='title'){assert.equal(typeof value,'string');draft.presentation.title=value;}
  else if(target.field==='intro'&&target.index===undefined){assert.ok(Array.isArray(value));draft.presentation.intro=structuredClone(value);}
  else if(target.field==='intro'){assert.equal(typeof value,'string');assert.ok(target.index<draft.presentation.intro.length,'intro index');draft.presentation.intro[target.index]=value;}
  else{assert.equal(typeof value,'string');assert.ok(Object.hasOwn(draft.presentation.clueTexts,target.id),'unknown clue');draft.presentation.clueTexts[target.id]=value;draft.evidence[target.id]={mode:'free'};}
 }
 assert.notEqual(contentHash(draft.presentation),contentHash(prior.draft.presentation),'no-op repair');draft.revision++;
 validateFlavorDraft(prior.request,draft);
 return {draft,checkpoint:createFlavorCheckpoint(prior.request,draft)};
}
export function deriveScopedRecord(prior,authorization,patch,provenance){
 const {draft,checkpoint}=applyScopedPatch(prior,authorization,patch);
 const body={orderId:prior.orderId,positionId:prior.positionId,caseId:prior.caseId,cardRef:prior.cardRef,flavorVariantId:prior.flavorVariantId,
 predecessor:structuredClone(patch.predecessor),request:structuredClone(prior.request),draft,checkpoint,
 metadata:{origin:'inherited-from-predecessor',predecessor:patch.predecessor,value:structuredClone(prior.metadata.value)},
 derivation:{kind:'scoped-repair-v1',jobId:patch.jobId,authorizationHash:contentHash(authorization),patchHash:contentHash(patch),provenance:structuredClone(provenance)}};
 return {...body,revisionHash:contentHash(body),draftHash:contentHash(draft)};
}
