import {adjacent,axial,cellsOf} from '../engine/hex.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {validateMap,validateLogic} from '../engine/validate.mjs';
import {GenerationError,normalizeAnalysisOptions,normalizeFilters} from './config.mjs';

function components(cells,neighbors){
 const unseen=new Set(cells),result=[];
 for(const root of cells){
  if(!unseen.delete(root))continue;
  const queue=[root];
  for(let i=0;i<queue.length;i++)for(const next of neighbors.get(queue[i]))if(unseen.delete(next))queue.push(next);
  result.push(queue.sort());
 }
 return result;
}
const histogram=values=>{const result={};for(const value of values)result[value]=(result[value]??0)+1;return result;};
export function shapeSignature(cells){
 return axialShapeSignature(cells.map(axial));
}
export function axialShapeSignature(points){
 const q=Math.min(...points.map(p=>p[0])),r=Math.min(...points.map(p=>p[1]));
 return points.map(([a,b])=>[a-q,b-r]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(p=>p.join(',')).join(';');
}

function routePotential(map,start,steps,maxNodes,componentSize){
 const base={cell:start,routeCountLowerBound:0,countExact:true,search:{maxNodes,nodesVisited:0,completed:true,method:'component-size'}};
 if(componentSize<=steps)return {...base,status:'no-route',reason:'COMPONENT_TOO_SMALL'};
 // A large enough component also satisfies validateLogic's global cell budget.
 const logic={map,start,steps,clues:[]};validateLogic(logic);
 const budget={remaining:maxNodes};let count=0,completed=true;
 try{for(const route of createRules(logic).routes([start],budget)){count++;}}
 catch(error){
  // The existing engine decrements once below zero before throwing. Do not
  // swallow unrelated engine defects or depend on a translated error string.
  if(budget.remaining>=0)throw error;
  completed=false;
 }
 return {cell:start,status:count>0?'route-found':completed?'no-route':'unknown',routeCountLowerBound:count,countExact:completed,
  ...(completed?{}:{reason:'SEARCH_BUDGET_EXCEEDED'}),
  search:{maxNodes,nodesVisited:Math.min(maxNodes,maxNodes-budget.remaining),completed,method:'engine-routes'}};
}

// No generator state, contents, selected start, or selected route.
export function analyzeMap(map,options={}){
 validateMap(map);
 const profile=normalizeAnalysisOptions(options),cells=cellsOf(map.grid).sort();
 const neighbors=new Map(cells.map(c=>[c,cells.filter(n=>adjacent(c,n))]));
 const occupied=new Set(map.objects.flatMap(o=>o.cells)),blocked=new Set(map.objects.filter(o=>!o.passable).flatMap(o=>o.cells));
 const passableCells=cells.filter(c=>!blocked.has(c)),blockedCells=cells.filter(c=>blocked.has(c));
 const passableComponents=components(passableCells,neighbors),blockedComponents=components(blockedCells,neighbors);
 const startCells=map.objects.filter(o=>o.passable).flatMap(o=>o.cells).sort();
 const regions=passableComponents.map((region,index)=>({id:'region-'+(index+1),cells:region,size:region.length,
  startCells:region.filter(c=>startCells.includes(c))}));
 const deadEnds=passableCells.filter(c=>neighbors.get(c).filter(n=>!blocked.has(n)).length===1);
 const isolatedCells=passableCells.filter(c=>neighbors.get(c).every(n=>blocked.has(n)));
 const articulationCells=passableCells.filter(c=>components(passableCells.filter(n=>n!==c),neighbors).length>passableComponents.length);
 const objectMetrics=[...map.objects].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(o=>({id:o.id,size:o.cells.length,passable:o.passable,
  shape:shapeSignature(o.cells),boundaryCells:o.cells.filter(c=>neighbors.get(c).length<6).length,
  boundaryEdges:o.cells.reduce((sum,c)=>sum+6-neighbors.get(c).length,0)}));
 const routes=profile.steps.map(steps=>{
  const starts=startCells.map(start=>routePotential(map,start,steps,profile.maxNodes,regions.find(r=>r.cells.includes(start)).size));
  const eligibleStarts=starts.filter(s=>s.status==='route-found').map(s=>s.cell),unknownStarts=starts.filter(s=>s.status==='unknown').map(s=>s.cell);
  const completed=starts.every(s=>s.search.completed);
  return {steps,status:eligibleStarts.length?'route-found':unknownStarts.length?'unknown':'no-route',starts,eligibleStarts,unknownStarts,
   eligibleStartCountLowerBound:eligibleStarts.length,eligibleStartCountExact:unknownStarts.length===0,
   routeCountLowerBound:starts.reduce((sum,s)=>sum+s.routeCountLowerBound,0),countExact:completed,
   search:{completed,maxNodesPerStart:profile.maxNodes,nodesVisited:starts.reduce((sum,s)=>sum+s.search.nodesVisited,0)}};
 });
 return {valid:true,profile,passableCells,blockedCells,regions,blockedComponents,startCells,
  isolatedCells,deadEnds,articulationCells,routes,
  metrics:{objectCount:map.objects.length,objectSizes:histogram(objectMetrics.map(o=>o.size)),
   passableObjects:map.objects.filter(o=>o.passable).length,blockedObjects:map.objects.filter(o=>!o.passable).length,
   occupiedCells:occupied.size,waterCells:25-occupied.size,landFraction:occupied.size/25,waterFraction:(25-occupied.size)/25,
   passableComponentCount:regions.length,passableComponentSizes:regions.map(r=>r.size),
   blockedComponentCount:blockedComponents.length,blockedComponentSizes:blockedComponents.map(r=>r.length),
   objects:objectMetrics,coastEdges:cells.filter(c=>occupied.has(c)).reduce((sum,c)=>sum+neighbors.get(c).filter(n=>!occupied.has(n)).length,0)}};
}

// Three-valued conjunction: a proven failure wins, otherwise unknown stays unknown.
export function evaluateFilters(analysis,options={}){
 const filters=normalizeFilters(options),reasons=[];
 if(Math.max(0,...analysis.metrics.passableComponentSizes)<filters.minLargestComponent)reasons.push({code:'COMPONENT_TOO_SMALL',status:'rejected',minimum:filters.minLargestComponent});
 for(const steps of filters.routeSteps){
  const row=analysis.routes.find(r=>r.steps===steps);
  if(!row)throw new GenerationError('INVALID_CONFIG','filter requires analysis for '+steps+' steps');
  if(row.status==='route-found')continue;
  reasons.push({code:!analysis.startCells.length?'NO_ELIGIBLE_START':row.status==='unknown'?'SEARCH_BUDGET_EXCEEDED':'NO_ROUTE_FOR_STEPS',
   status:row.status==='unknown'?'unknown':'rejected',steps});
 }
 return {status:reasons.some(r=>r.status==='rejected')?'rejected':reasons.length?'unknown':'accepted',reasons};
}
