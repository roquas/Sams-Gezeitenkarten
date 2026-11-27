// Versioned, claim-complete independent inference evidence. Legacy judgments stay immutable.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {object,array,refs,text,structure,hash,exactIds} from './flavor-quality-contract.mjs';
import {sha256} from './content-hash.mjs';
export const METHOD='f02b-bound-hint-reader-inference-2';
export const METHOD_HASH=hash({method:METHOD,files:['flavor-reader-inference.mjs','flavor-inference-connection.mjs','../flavor-reader-inference.mjs','../flavor-inference-continuation.mjs','flavor-quality-json.mjs','flavor-quality-contract.mjs','content-hash.mjs','../../src/engine/puzzle.mjs','../../src/engine/hex.mjs','../../src/engine/validate.mjs','../../src/puzzles/schema.mjs','../../src/puzzles/json-schema.mjs'].map(n=>sha256(fs.readFileSync(new URL(n,import.meta.url))))});
export const PUBLIC_FACTS=['public.map','public.names','public.start','public.steps','public.rules'];
export function blockedClaims(result){
 assert.ok(!result.qualified&&result.reasons.length&&result.reasons.every(r=>r.startsWith('additional-mathematics:')),'only additional-mathematics reasons are eligible');
 const ids=result.reasons.map(r=>r.slice('additional-mathematics:'.length));assert.equal(new Set(ids).size,ids.length);return ids.sort();
}
export function premises(input,claimId){
 const claim=input.reader.claims.find(c=>c.id===claimId);assert.ok(claim&&claim.kind==='mathematical'&&claim.state==='formalized'&&claim.clueId===null,'requires a formalized null-clue Reader claim');
 const units=claim.unitIds.map(id=>{const u=input.public.units.find(u=>u.id===id);assert.ok(u);return u;});
 assert.ok(units.every(u=>!u.field.startsWith('series.')),'foreign context is not a local public premise');
 const hintIds=[...new Set(units.filter(u=>u.field.startsWith('clues.')).map(u=>u.field.slice(6)))].sort();assert.ok(hintIds.length,'explicit local hint premises required');
 const other=units.filter(u=>!u.field.startsWith('clues.'));assert.ok(other.every(u=>u.field==='title'||u.field.startsWith('intro.')),'only local text attribution');
 const originals=hintIds.map(id=>{const found=input.originals.filter(c=>c.id===id);assert.equal(found.length,1);return found[0];});return {claim,originals,other,hintIds};
}
function claimSchema(job,id){
 const p=premises(job.input,id);return object({claimId:{const:id},attribution:{enum:['reader-inference','player-statement','uncertain']},
 premiseHintIds:{...refs,items:{enum:p.hintIds},minItems:p.hintIds.length,maxItems:p.hintIds.length},
 publicFactRefs:{...refs,items:{enum:PUBLIC_FACTS},minItems:PUBLIC_FACTS.length,maxItems:PUBLIC_FACTS.length},
 units:{...array(object({unitId:{enum:p.other.map(u=>u.id)},classification:{enum:['public-premise-only','contains-conclusion','uncertain']},rationale:text})),minItems:p.other.length,maxItems:p.other.length},
 otherConcerns:{enum:['clear','error','uncertain']},boundaries:object(Object.fromEntries(['additional-information','deduction-disclosure','clue-self-containment'].map(k=>[k,{enum:['clear','error','uncertain']}]))),rationale:text});
}
export function responseSchema(job){return object({version:{const:2},jobId:{const:job.jobId},methodHash:{const:METHOD_HASH},inputHash:{const:job.inputHash},claims:{...array({oneOf:job.claimIds.map(id=>claimSchema(job,id))}),minItems:job.claimIds.length,maxItems:job.claimIds.length}});}
export function proveInference(input,claimId,{maxNodes=250000}={}){
 assert.ok(Number.isSafeInteger(maxNodes)&&maxNodes>0&&maxNodes<=250000);const {claim,originals,hintIds}=premises(input,claimId),{map,start,steps}=input.public.chart;
 validateLogic({map,start,steps,clues:originals});validateLogic({map,start,steps,clues:claim.atoms});const rules=createRules({map,start,steps,clues:[]}),budget={remaining:maxNodes};let complete=true,legalRoutes=0,premiseRoutes=0,counterexamples=0;
 try{for(const route of rules.routes([start],budget)){assert.ok(rules.legal(route));legalRoutes++;if(originals.every(c=>rules.matches(route,c))){premiseRoutes++;if(!claim.atoms.every(c=>rules.matches(route,c)))counterexamples++;}}}catch(e){if(e.message!=='Suchbudget überschritten; Eindeutigkeit nicht bewiesen')throw e;complete=false;}
 return {entailed:complete&&premiseRoutes>0&&counterexamples===0,complete,legalRoutes,premiseRoutes,counterexamples,maxNodes,premiseHintIds:hintIds,unlistedHintsUsed:false,savedTargetUsed:false};
}
export function createSupplement(input,claimIds,provenance){
 assert.ok(Array.isArray(claimIds)&&claimIds.length);exactIds(claimIds,[...new Set(claimIds)],'supplement claims');claimIds=[...claimIds].sort();claimIds.forEach(id=>premises(input,id));const inputHash=hash({input,claimIds,provenance});return {version:2,stage:'reviewer-inference',method:METHOD,methodHash:METHOD_HASH,jobId:'inference-'+inputHash.slice(0,40),inputHash,claimIds,input,provenance};
}
export function evaluateSupplement(job,response,legacyResult,{kind,maxNodes=250000}={}){
 assert.ok(['external-manual','technical-test'].includes(kind),'explicit evidence provenance required');assert.deepEqual(job,createSupplement(job.input,job.claimIds,job.provenance));structure(response,responseSchema(job));exactIds(response.claims.map(c=>c.claimId),job.claimIds,'response claims');
 const reasons=[],proofs={};let expected;try{expected=blockedClaims(legacyResult);}catch{reasons.push('legacy-result-outside-focused-scope');}if(expected&&hash(expected)!==hash(job.claimIds))reasons.push('incomplete-legacy-claim-coverage');
 for(const c of response.claims){const p=premises(job.input,c.claimId);exactIds(c.premiseHintIds,p.hintIds,'premise hints');exactIds(c.publicFactRefs,PUBLIC_FACTS,'public facts');exactIds(c.units.map(u=>u.unitId),p.other.map(u=>u.id),'attribution units');
  const proof=proveInference(job.input,c.claimId,{maxNodes});proofs[c.claimId]=proof;
  if(c.attribution!=='reader-inference'||c.units.some(u=>u.classification!=='public-premise-only'))reasons.push('source-attribution-open:'+c.claimId);
  if(c.otherConcerns!=='clear')reasons.push('other-review-open:'+c.claimId);
  if(Object.values(c.boundaries).some(v=>v!=='clear'))reasons.push('information-boundary-open:'+c.claimId);
  if(!proof.entailed)reasons.push('bound-premise-proof-open:'+c.claimId);
 }
 return {method:METHOD,methodHash:METHOD_HASH,jobId:job.jobId,inputHash:job.inputHash,responseHash:hash(response),legacyResult,proofs,reasons,
 qualified:false,supportedUnderSupplement:kind==='external-manual'&&reasons.length===0,technicalWouldSupport:kind==='technical-test'&&reasons.length===0,evidenceKind:kind,model:null,producedAt:null,
 scope:'Supplement only; qualification requires the versioned receipt/provenance-checked store connection. Legacy result unchanged.'};
}
