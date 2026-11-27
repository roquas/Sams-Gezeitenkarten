// Infrastructure test doubles only. Never observations of a real reader/reviewer.
import {hash,REVIEW_AREAS,reviewAreas,scopedSeries} from '../../../scripts/lib/flavor-quality-contract.mjs';
export const TECHNICAL_OPERATOR={model:'technical-test-double',producedAt:null,kind:'technical-test'};
export function technicalReader(job,originals){
 return {transportVersion:1,stage:'reader',jobId:job.jobId,methodHash:job.methodHash,items:job.items.map((item,i)=>{
  const claims=item.input.units.map((unit,j)=>{
   const clueId=unit.field.startsWith('clues.')?unit.field.slice(6):null;
   const foreign=unit.scope==='series-context';
   return {id:'c'+(j+1),unitIds:[unit.id],...(scopedSeries(item.input)?{scope:foreign?'series-context':'current-episode',episodeId:foreign?unit.episodeId:item.input.seriesContext.currentEpisodeId}:{}),kind:foreign?'context':clueId?'mathematical':'narrative',meaning:'TECHNICAL TEST DOUBLE: '+unit.text,
    clueId,state:foreign?'contextual':clueId?'formalized':'narrative',atoms:clueId?[originals[i].find(c=>c.id===clueId)]:[]};
  });
  return {itemId:item.itemId,inputHash:item.inputHash,coverage:item.input.units.map((u,j)=>({unitId:u.id,claimIds:[claims[j].id],assessment:'TECHNICAL TEST ONLY: full-field claim'})),
   claims,interpretations:item.input.presentation.clues.map(c=>({clueId:c.id,claimIds:claims.filter(x=>x.clueId===c.id).map(x=>x.id)})),...(scopedSeries(item.input)?{series:item.input.seriesContext.episodes.map(e=>({episodeId:e.episodeId,assessment:'independent',unitIds:item.input.units.filter(u=>u.episodeId===e.episodeId).map(u=>u.id),claimIds:claims.filter(c=>c.episodeId===e.episodeId).map(c=>c.id),rationale:'TECHNICAL TEST ONLY: independent episodes'}))}:{})};
 })};
}
export function technicalReviewer(job){
 return {transportVersion:1,stage:'reviewer',jobId:job.jobId,methodHash:job.methodHash,items:job.items.map(item=>{
  const units=item.input.public.units.map(u=>u.id),evidence={unitIds:units,factRefs:['public.rules'],rationale:'TECHNICAL TEST ONLY: assumes this check is clear'};
  return {itemId:item.itemId,inputHash:item.inputHash,readerHash:hash(item.input.reader),comparisonHash:hash(item.input.comparison),
   coverage:units.map(unitId=>({unitId,assessment:'TECHNICAL TEST ONLY'})),
   checks:reviewAreas(item.input.public).map(area=>({area,conclusion:'clear',...evidence})),
   claims:item.input.reader.claims.map(c=>({claimId:c.id,disposition:c.kind==='context'?'context-only':'supported',...evidence,...(c.kind==='context'?{factRefs:['series.'+c.episodeId+'.presentation','public.episode']}:{} )})),
   clues:item.input.public.presentation.clues.map(c=>({clueId:c.id,interpretation:'confirmed',selfContained:true,informationBoundary:'preserved',...evidence,factRefs:['original.'+c.id]})),
   ...(scopedSeries(item.input.public)?{series:item.input.public.seriesContext.episodes.map(e=>({episodeId:e.episodeId,conclusion:'independent',unitIds:item.input.public.units.filter(u=>u.episodeId===e.episodeId).map(u=>u.id),factRefs:['public.episode','series.'+e.episodeId+'.presentation'],rationale:'TECHNICAL TEST ONLY'}))}:{}),findings:[],observations:['form','theme','motif','invention','name','editorial'].map(category=>({category,value:'TECHNICAL TEST ONLY, no independent content observation',unitIds:units}))};
 })};
}
