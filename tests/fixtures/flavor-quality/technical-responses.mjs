// Infrastructure test doubles only. Never observations of a real reader/reviewer.
import {hash,REVIEW_AREAS} from '../../../scripts/lib/flavor-quality-contract.mjs';
export const TECHNICAL_OPERATOR={model:'technical-test-double',producedAt:null,kind:'technical-test'};
export function technicalReader(job,originals){
 return {transportVersion:1,stage:'reader',jobId:job.jobId,methodHash:job.methodHash,items:job.items.map((item,i)=>{
  const claims=item.input.units.map((unit,j)=>{
   const clueId=unit.field.startsWith('clues.')?unit.field.slice(6):null;
   return {id:'c'+(j+1),unitIds:[unit.id],kind:clueId?'mathematical':'narrative',meaning:'TECHNICAL TEST DOUBLE: '+unit.text,
    clueId,state:clueId?'formalized':'narrative',atoms:clueId?[originals[i].find(c=>c.id===clueId)]:[]};
  });
  return {itemId:item.itemId,inputHash:item.inputHash,coverage:item.input.units.map((u,j)=>({unitId:u.id,claimIds:[claims[j].id],assessment:'TECHNICAL TEST ONLY: full-field claim'})),
   claims,interpretations:item.input.presentation.clues.map(c=>({clueId:c.id,claimIds:claims.filter(x=>x.clueId===c.id).map(x=>x.id)}))};
 })};
}
export function technicalReviewer(job){
 return {transportVersion:1,stage:'reviewer',jobId:job.jobId,methodHash:job.methodHash,items:job.items.map(item=>{
  const units=item.input.public.units.map(u=>u.id),evidence={unitIds:units,factRefs:['public.rules'],rationale:'TECHNICAL TEST ONLY: assumes this check is clear'};
  return {itemId:item.itemId,inputHash:item.inputHash,readerHash:hash(item.input.reader),comparisonHash:hash(item.input.comparison),
   coverage:units.map(unitId=>({unitId,assessment:'TECHNICAL TEST ONLY'})),
   checks:REVIEW_AREAS.map(area=>({area,conclusion:'clear',...evidence})),
   claims:item.input.reader.claims.map(c=>({claimId:c.id,disposition:'supported',...evidence})),
   clues:item.input.public.presentation.clues.map(c=>({clueId:c.id,interpretation:'confirmed',selfContained:true,informationBoundary:'preserved',...evidence,factRefs:['original.'+c.id]})),
   findings:[],observations:['form','theme','motif','invention','name','editorial'].map(category=>({category,value:'TECHNICAL TEST ONLY, no independent content observation',unitIds:units}))};
 })};
}
