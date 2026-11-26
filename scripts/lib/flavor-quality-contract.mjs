// F02-B is a separate method/transport domain, never flavor-check-v1.
import assert from 'node:assert/strict';
import {logicSchema,schemaErrors} from '../../src/puzzles/schema.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

export const QUALITY_VERSION=1;
export const QUALITY_METHOD='f02b-three-stage-2';
export const UNIT_METHOD='whole-field-utf16-1';
export const hash=value=>sha256('gezeitenkarten-flavor-quality/v1\0'+canonicalJson(value));
export const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const text={type:'string',minLength:1,maxLength:60000};
export const id={type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'};
export const digest={type:'string',pattern:'^[a-f0-9]{64}$'};
export const array=items=>({type:'array',items,maxItems:4096});
export const refs={...array(id),uniqueItems:true};
export const nullable=s=>({oneOf:[{type:'null'},s]});
export const atomSchema=logicSchema.properties.clues.items;
const reference={itemId:id,inputHash:digest};
const claimFields={id,unitIds:{...refs,minItems:1},kind:{enum:['mathematical','potential','narrative','invention','ambiguous','interaction']},
 meaning:text,clueId:nullable(id)};
// Mutually exclusive variants express the same kind/state/atom rules as the
// runtime. A model should not need hidden validation rules to form a reply.
const claimSchema={oneOf:[
 object({...claimFields,kind:{const:'mathematical'},state:{const:'formalized'},atoms:{...array(atomSchema),minItems:1}}),
 object({...claimFields,state:{const:'unresolved'},atoms:{...array(atomSchema),maxItems:0}}),
 object({...claimFields,kind:{enum:['narrative','invention']},state:{const:'narrative'},atoms:{...array(atomSchema),maxItems:0}})
]};
export const readerItemSchema=object({...reference,
 coverage:{...array(object({unitId:id,claimIds:{...refs,minItems:1},assessment:text})),minItems:1},claims:{...array(claimSchema),minItems:1},
 interpretations:{...array(object({clueId:id,claimIds:{...refs,minItems:1}})),minItems:1}});
export const OBSERVATION_CATEGORIES=['form','theme','motif','invention','name','editorial'];
export const REVIEW_AREAS=['interpretation','additional-information','deduction-disclosure','clue-self-containment','contradictions',
 'ambiguity','world-style','comprehensibility','legal','political','discrimination','sexual-content','names'];
const evidence={unitIds:{...refs,minItems:1},factRefs:refs,rationale:text};
export const reviewerItemSchema=object({...reference,readerHash:digest,comparisonHash:digest,
 coverage:array(object({unitId:id,assessment:text})),
 checks:array(object({area:{enum:REVIEW_AREAS},conclusion:{enum:['clear','error','uncertain']},...evidence})),
 claims:array(object({claimId:id,disposition:{enum:['supported','not-puzzle-relevant','authorized','reader-error','unresolved']},...evidence})),
 clues:array(object({clueId:id,interpretation:{enum:['confirmed','incorrect','uncertain']},
 selfContained:{type:'boolean'},informationBoundary:{enum:['preserved','deduction','additional','uncertain']},...evidence})),
 findings:array(object({id,severity:{enum:['ERROR','UNCERTAIN','ADVISORY']},requirement:text,...evidence,claimIds:refs,
 method:text,evidenceRefs:refs,repairTarget:nullable(text)})),
 observations:array(object({category:{enum:OBSERVATION_CATEGORIES},value:text,unitIds:{...refs,minItems:1}}))});
// Validate the envelope separately: malformed items can remain technically open,
// but a foreign/duplicate identity or ambiguous envelope cannot yield partial success.
const looseItem={type:'object',properties:{itemId:id},required:['itemId'],additionalProperties:true};
export const envelopeSchema=stage=>object({transportVersion:{const:QUALITY_VERSION},stage:{const:stage},jobId:id,methodHash:digest,items:array(looseItem)});
// Job-bound schemas expose public IDs/namespace limits, never private originals
// in a reader job. Cross-reference reciprocity and engine validity remain runtime
// checks and are stated in the prompt rather than silently auto-repaired.
function boundItemSchema(stage,item){
 const schema=structuredClone(stage==='reader'?readerItemSchema:reviewerItemSchema),p=schema.properties;
 p.itemId={const:item.itemId};p.inputHash={const:item.inputHash};
 const input=stage==='reader'?item.input:item.input.public;
 const units=input.units.map(u=>u.id),clues=input.presentation.clues.map(c=>c.id);
 const references=values=>({...refs,items:{enum:values}});
 const complete=(field,ids)=>{p[field].minItems=ids.length;p[field].maxItems=ids.length;};
 p.coverage.items.properties.unitId={enum:units};complete('coverage',units);
 if(stage==='reader'){
  for(const branch of p.claims.items.oneOf){branch.properties.unitIds={...references(units),minItems:1};branch.properties.clueId=nullable({enum:clues});}
  p.interpretations.items.properties.clueId={enum:clues};complete('interpretations',clues);
 }else{
  const facts=item.input.facts.map(f=>f.id),claims=item.input.reader.claims.map(c=>c.id);
  p.readerHash={const:hash(item.input.reader)};p.comparisonHash={const:hash(item.input.comparison)};
  for(const field of ['checks','claims','clues','findings']){
   const q=p[field].items.properties;q.unitIds={...references(units),minItems:1};q.factRefs=references(facts);
  }
  p.claims.items.properties.claimId={enum:claims};complete('claims',claims);
  p.clues.items.properties.clueId={enum:clues};complete('clues',clues);complete('checks',REVIEW_AREAS);
  p.findings.items.properties.claimIds=references(claims);
  p.findings.items.properties.evidenceRefs=references(['reader','comparison',...facts]);
  p.observations.items.properties.unitIds={...references(units),minItems:1};p.observations.minItems=OBSERVATION_CATEGORIES.length;
 }
 return schema;
}
export function responseSchema(stage,job){
 assert.ok(['reader','reviewer'].includes(stage),'flavor quality: unknown response stage');
 const schema={...envelopeSchema(stage),properties:{...envelopeSchema(stage).properties,
  items:{...array(stage==='reader'?readerItemSchema:reviewerItemSchema),minItems:1}}};
 if(job){
  assert.equal(stage,job.stage);schema.properties.jobId={const:job.jobId};schema.properties.methodHash={const:job.methodHash};
  const variants=job.items.map(item=>boundItemSchema(stage,item));
  schema.properties.items.items=variants.length===1?variants[0]:{oneOf:variants};schema.properties.items.maxItems=job.items.length;
 }
 return schema;
}
export function structure(value,schema){
 const errors=schemaErrors(value,schema);assert.equal(errors.length,0,'flavor quality: '+errors.join('; '));return value;
}
export function exactIds(actual,expected,label){
 assert.equal(new Set(actual).size,actual.length,'flavor quality: duplicate '+label);
 assert.equal(canonicalJson([...actual].sort()),canonicalJson([...expected].sort()),'flavor quality: missing/foreign '+label);
}
function validRefs(actual,allowed,label){
 assert.equal(new Set(actual).size,actual.length,'flavor quality: duplicate '+label);
 assert.ok(actual.every(x=>allowed.includes(x)),'flavor quality: foreign '+label);
}
export function validateReaderItem(item,result){
 structure(result,boundItemSchema('reader',item));assert.equal(result.itemId,item.itemId);assert.equal(result.inputHash,item.inputHash,'flavor quality: stale public input');
 const units=item.input.units,unitIds=units.map(u=>u.id),clueIds=item.input.presentation.clues.map(c=>c.id),claims=result.claims;
 exactIds(result.coverage.map(c=>c.unitId),unitIds,'coverage units');
 exactIds(result.interpretations.map(c=>c.clueId),clueIds,'interpretations');
 exactIds(claims.map(c=>c.id),[...new Set(claims.map(c=>c.id))],'claims');
 const ids=claims.map(c=>c.id);
 for(const c of claims){
  validRefs(c.unitIds,unitIds,'claim units');
  assert.ok(c.clueId===null||clueIds.includes(c.clueId),'flavor quality: foreign claim clue');
  if(c.clueId!==null)assert.ok(c.unitIds.some(u=>units.find(x=>x.id===u).field==='clues.'+c.clueId),'flavor quality: claim must address its clue text');
  if(c.state==='formalized'){
   assert.ok(c.atoms.length,'flavor quality: formalized claim needs atoms');
   assert.equal(c.kind,'mathematical','flavor quality: formal atoms require mathematical claim');
  }else assert.equal(c.atoms.length,0,'flavor quality: unresolved/narrative claims cannot hide formal atoms');
  if(['mathematical','potential','ambiguous','interaction'].includes(c.kind))assert.notEqual(c.state,'narrative','flavor quality: relevant claim needs interpretation or explicit uncertainty');
  // Atoms are a conjunction inside one outer clue; their IDs have no semantic role.
  validateLogic({map:item.input.chart.map,start:item.input.chart.start,steps:item.input.chart.steps,clues:c.atoms});
 }
 for(const coverage of result.coverage){
  assert.ok(coverage.claimIds.length,'flavor quality: each unit needs interpreted claims');
  validRefs(coverage.claimIds,ids,'coverage claims');
  for(const c of coverage.claimIds)assert.ok(claims.find(x=>x.id===c).unitIds.includes(coverage.unitId),'flavor quality: coverage/claim reference mismatch');
 }
 for(const c of claims)for(const u of c.unitIds)assert.ok(result.coverage.find(x=>x.unitId===u).claimIds.includes(c.id),'flavor quality: unassessed claim unit');
 for(const interpretation of result.interpretations){
  validRefs(interpretation.claimIds,ids,'interpretation claims');
  assert.ok(interpretation.claimIds.length,'flavor quality: missing clue interpretation');
  exactIds(interpretation.claimIds,claims.filter(c=>c.clueId===interpretation.clueId).map(c=>c.id),'clue claims');
 }
 return result;
}
export function validateReviewerItem(item,result){
 structure(result,boundItemSchema('reviewer',item));assert.equal(result.itemId,item.itemId);assert.equal(result.inputHash,item.inputHash,'flavor quality: stale review input');
 assert.equal(result.readerHash,hash(item.input.reader));assert.equal(result.comparisonHash,hash(item.input.comparison));
 const units=item.input.public.units.map(u=>u.id),facts=item.input.facts.map(f=>f.id),claims=item.input.reader.claims.map(c=>c.id);
 const checkEvidence=e=>{validRefs(e.unitIds,units,'review units');validRefs(e.factRefs,facts,'review facts');};
 exactIds(result.coverage.map(u=>u.unitId),units,'review coverage');
 exactIds(result.checks.map(c=>c.area),REVIEW_AREAS,'review areas');
 exactIds(result.claims.map(c=>c.claimId),claims,'review claims');
 exactIds(result.clues.map(c=>c.clueId),item.input.public.presentation.clues.map(c=>c.id),'review clues');
 exactIds(result.findings.map(f=>f.id),[...new Set(result.findings.map(f=>f.id))],'finding IDs');
 [...result.checks,...result.claims,...result.clues,...result.findings].forEach(checkEvidence);
 for(const c of result.claims){
  const source=item.input.reader.claims.find(x=>x.id===c.claimId);
  if(source.kind==='mathematical'&&mathematicsNeedsAuthority(item,source)&&c.disposition==='authorized')assert.ok(c.factRefs.some(f=>f.startsWith('public.')||f.startsWith('original.')),'flavor quality: additional mathematics needs explicit public/original fact authority');
  if(c.disposition==='reader-error')assert.ok(c.factRefs.length,'flavor quality: reader objection needs source evidence');
 }
 for(const c of result.clues)assert.ok(c.factRefs.includes('original.'+c.clueId),'flavor quality: clue judgment needs its original source');
 for(const f of result.findings){validRefs(f.claimIds,claims,'finding claims');validRefs(f.evidenceRefs,['reader','comparison',...facts],'finding evidence');}
 for(const o of result.observations)validRefs(o.unitIds,units,'observation units');
 exactIds([...new Set(result.observations.map(o=>o.category))],OBSERVATION_CATEGORIES,'observation categories (explicit absence allowed)');
 return result;
}
export function validateEnvelope(job,response){
 structure(response,envelopeSchema(job.stage));assert.equal(response.jobId,job.jobId,'flavor quality: foreign job');
 assert.equal(response.methodHash,job.methodHash,'flavor quality: stale method');
 const ids=response.items.map(i=>i.itemId);validRefs(ids,job.items.map(i=>i.itemId),'envelope items');return response;
}
export function textUnits(presentation,context){
 const units=[];
 const add=(field,value)=>units.push({id:'u'+String(units.length+1).padStart(4,'0'),field,start:0,end:value.length,text:value});
 const addPresentation=(p,prefix='')=>{add(prefix+'title',p.title);p.intro.forEach((v,i)=>add(prefix+'intro.'+i,v));p.clues.forEach(c=>add(prefix+'clues.'+c.id,c.text));};
 addPresentation(presentation);context.episodes.forEach((p,i)=>addPresentation(p.presentation,'series.'+i+'.'));
 return units;
}
export function interpretationFor(reader,clueId){
 const claims=reader.claims.filter(c=>c.clueId===clueId);
 return {atoms:claims.flatMap(c=>c.atoms).map((a,i)=>({...a,id:'A'+(i+1)})),
 unresolved:claims.filter(c=>c.state==='unresolved').map(c=>c.id)};
}
export const CALIBRATION='Technical regressions and separately archived manual pilot observations; no empirical F02-B reader/reviewer reliability or unattended-production approval established.';
// A null outer clue ID is also used for Reader reasoning across hints. It is
// not evidence that the player text states additional mathematics. Allow only
// a supported multi-hint reading with explicit source authority and independent
// confirmation of every involved hint. Global information-boundary checks
// remain independently blocking in qualify(), even for unrelated open issues.
function supportedHintInteraction(item,source,judgment,review){
 if(source.clueId!==null||judgment.disposition!=='supported'||!source.unitIds.length)return false;
 const input=item.input.public??item.input,units=input.units??[],ids=[];
 for(const ref of source.unitIds){
  const field=units.find(u=>u.id===ref)?.field;if(!field?.startsWith('clues.'))return false;
  const id=field.slice(6);if(!input.presentation.clues.some(c=>c.id===id))return false;ids.push(id);
 }
 const hints=[...new Set(ids)];
 return hints.length>=2&&hints.every(id=>judgment.factRefs.includes('original.'+id)&&review.clues.some(c=>c.clueId===id&&c.interpretation==='confirmed'&&c.selfContained&&c.informationBoundary==='preserved'));
}
function mathematicsNeedsAuthority(item,source){
 const input=item.input.public??item.input;
 return source.clueId===null||source.unitIds.some(ref=>!input.units?.find(u=>u.id===ref)?.field?.startsWith('clues.'));
}
export function qualify(item,reader,comparison,review){
 const reasons=[];
 if(!reader)reasons.push('reader-missing');if(!comparison)reasons.push('comparison-missing');if(!review)reasons.push('review-missing');
 if(comparison&&comparison.clues.some(c=>c.result!=='equivalent'||!c.completeInterpretation))reasons.push('comparison-open');
 if(reader&&review){
  for(const c of review.claims){
   const source=reader.claims.find(x=>x.id===c.claimId);
   if(['reader-error','unresolved'].includes(c.disposition))reasons.push('claim-open:'+c.claimId);
   if(source.state==='unresolved'&&c.disposition!=='not-puzzle-relevant')reasons.push('unresolved-interpretation:'+c.claimId);
   if(source.kind==='mathematical'&&mathematicsNeedsAuthority(item,source)&&c.disposition!=='authorized'&&!supportedHintInteraction(item,source,c,review))reasons.push('additional-mathematics:'+c.claimId);
  }
  if(review.checks.some(c=>c.conclusion!=='clear'))reasons.push('review-area-open');
  if(review.clues.some(c=>c.interpretation!=='confirmed'||!c.selfContained||c.informationBoundary!=='preserved'))reasons.push('clue-review-open');
  if(review.findings.some(f=>f.severity!=='ADVISORY'))reasons.push('blocking-findings');
 }
 return {method:QUALITY_METHOD,inputHash:item.inputHash,qualified:reasons.length===0,reasons:[...new Set(reasons)],calibration:CALIBRATION,
 scope:'Evidence-based semantic qualification for these exact bindings. Formal coverage is not interpretation proof. No selection or publication; F01 remains unchanged.'};
}
