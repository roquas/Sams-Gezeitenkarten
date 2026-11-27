// A supplemental independent provenance judgment; never a rewrite of a legacy result.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {object,array,refs,text,structure,hash} from './flavor-quality-contract.mjs';
import {sha256} from './content-hash.mjs';
export const METHOD='f02b-single-hint-public-reader-inference-1';
export const METHOD_HASH=hash({method:METHOD,files:['flavor-reader-inference.mjs','../flavor-reader-inference.mjs','flavor-quality-contract.mjs','content-hash.mjs','../../src/engine/puzzle.mjs','../../src/engine/hex.mjs','../../src/engine/validate.mjs','../../src/puzzles/schema.mjs','../../src/puzzles/json-schema.mjs'].map(n=>sha256(fs.readFileSync(new URL(n,import.meta.url))))});
export const PUBLIC_FACTS=['public.map','public.names','public.start','public.steps','public.rules'];
export function premises(input,claimId){
 const claim=input.reader.claims.find(c=>c.id===claimId);assert.ok(claim&&claim.kind==='mathematical'&&claim.state==='formalized'&&claim.clueId===null,'requires a formalized null-clue Reader claim');
 const units=claim.unitIds.map(id=>{const u=input.public.units.find(u=>u.id===id);assert.ok(u);return u;});
 assert.ok(units.every(u=>!u.field.startsWith('series.')),'foreign context is not a local public premise');
 const hints=[...new Set(units.filter(u=>u.field.startsWith('clues.')).map(u=>u.field.slice(6)))];assert.equal(hints.length,1,'this supplement is limited to one local hint');
 const other=units.filter(u=>!u.field.startsWith('clues.'));assert.ok(other.length&&other.every(u=>u.field==='title'||u.field.startsWith('intro.')),'requires explicit local non-hint attribution');
 const original=input.originals.find(c=>c.id===hints[0]);assert.ok(original);return {claim,original,other,hintId:hints[0]};
}
export function responseSchema(job){
 const p=premises(job.input,job.claimId);
 return object({version:{const:1},jobId:{const:job.jobId},methodHash:{const:METHOD_HASH},inputHash:{const:job.inputHash},claimId:{const:job.claimId},
 attribution:{enum:['reader-inference','player-statement','uncertain']},premiseHintIds:{...array({const:p.hintId}),minItems:1,maxItems:1},
 publicFactRefs:{...refs,items:{enum:PUBLIC_FACTS},minItems:PUBLIC_FACTS.length,maxItems:PUBLIC_FACTS.length},
 units:{...array(object({unitId:{enum:p.other.map(u=>u.id)},classification:{enum:['public-premise-only','contains-conclusion','uncertain']},rationale:text})),minItems:p.other.length,maxItems:p.other.length},
 otherConcerns:{enum:['clear','error','uncertain']},boundaries:object(Object.fromEntries(['additional-information','deduction-disclosure','clue-self-containment'].map(k=>[k,{enum:['clear','error','uncertain']}]))),rationale:text});
}
export function proveSingleHint(input,claimId,{maxNodes=250000}={}){
 assert.ok(Number.isSafeInteger(maxNodes)&&maxNodes>0&&maxNodes<=250000);const {claim,original}=premises(input,claimId),{map,start,steps}=input.public.chart;
 validateLogic({map,start,steps,clues:[original]});validateLogic({map,start,steps,clues:claim.atoms});const rules=createRules({map,start,steps,clues:[]}),budget={remaining:maxNodes};let complete=true,legalRoutes=0,premiseRoutes=0,counterexamples=0;
 try{for(const route of rules.routes([start],budget)){assert.ok(rules.legal(route));legalRoutes++;if(rules.matches(route,original)){premiseRoutes++;if(!claim.atoms.every(c=>rules.matches(route,c)))counterexamples++;}}}catch(e){if(e.message!=='Suchbudget überschritten; Eindeutigkeit nicht bewiesen')throw e;complete=false;}
 return {entailed:complete&&premiseRoutes>0&&counterexamples===0,complete,legalRoutes,premiseRoutes,counterexamples,maxNodes,otherHintsUsed:false,savedTargetUsed:false};
}
export function createSupplement(input,claimId,provenance){
 premises(input,claimId);const inputHash=hash({input,claimId,provenance});return {version:1,stage:'reviewer-inference',method:METHOD,methodHash:METHOD_HASH,jobId:'inference-'+inputHash.slice(0,40),inputHash,claimId,input,provenance};
}
export function evaluateSupplement(job,response,legacyResult,{kind,maxNodes=250000}={}){
 assert.ok(['external-manual','technical-test'].includes(kind),'explicit evidence provenance required');assert.deepEqual(job,createSupplement(job.input,job.claimId,job.provenance));assert.equal(job.methodHash,METHOD_HASH);assert.equal(job.inputHash,hash({input:job.input,claimId:job.claimId,provenance:job.provenance}));structure(response,responseSchema(job));
 const p=premises(job.input,job.claimId);assert.deepEqual([...response.publicFactRefs].sort(),[...PUBLIC_FACTS].sort());assert.deepEqual(response.units.map(u=>u.unitId).sort(),p.other.map(u=>u.id).sort());
 const proof=proveSingleHint(job.input,job.claimId,{maxNodes}),reasons=[];
 if(legacyResult.qualified||legacyResult.reasons.length!==1||legacyResult.reasons[0]!=='additional-mathematics:'+job.claimId)reasons.push('legacy-result-outside-focused-scope');
 if(response.attribution!=='reader-inference'||response.units.some(u=>u.classification!=='public-premise-only'))reasons.push('source-attribution-open');
 if(response.otherConcerns!=='clear')reasons.push('other-review-open');
 if(Object.values(response.boundaries).some(v=>v!=='clear'))reasons.push('information-boundary-open');
 if(!proof.entailed)reasons.push('single-hint-proof-open');
 return {method:METHOD,methodHash:METHOD_HASH,jobId:job.jobId,inputHash:job.inputHash,responseHash:hash(response),legacyResult,proof,reasons,
 qualified:false,supportedUnderSupplement:kind==='external-manual'&&reasons.length===0,technicalWouldSupport:kind==='technical-test'&&reasons.length===0,evidenceKind:kind,model:null,producedAt:null,
 scope:'Composite supplemental evidence only. Legacy result and stores unchanged. This supplement never grants store qualification or bypasses inherited provenance. No selection/publication.'};
}
