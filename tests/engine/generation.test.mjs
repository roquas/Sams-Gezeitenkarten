import test from 'node:test';
import assert from 'node:assert/strict';
import {createRandom,randomStream} from '../../src/generation/random.mjs';
import {generateMap,normalizeConfig,GENERATOR_VERSION} from '../../src/generation/maps.mjs';
import {analyzeMap,evaluateFilters} from '../../src/generation/map-analysis.mjs';
import {validateMap} from '../../src/engine/validate.mjs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {GEOMETRY} from '../../src/puzzles/schema.mjs';

const cells=Array.from({length:25},(_,i)=>String.fromCharCode(65+i%5)+(1+Math.floor(i/5)));
const mapOf=objects=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects});
const object=(id,cells,passable)=>({id,cells,passable});
function restrictedMap(open,starts){
 return mapOf([object('start',starts,true),...cells.filter(c=>!open.includes(c)).map(c=>object('block-'+c,[c],false))]);
}
// Independent offset-neighbor reference, without engine geometry or analysis.
function referenceComponents(allowed){
 const unseen=new Set(allowed),result=[];
 for(const root of [...allowed].sort()){
  if(!unseen.delete(root))continue;
  const queue=[root];
  for(let i=0;i<queue.length;i++){
   const x=queue[i].charCodeAt(0)-65,y=Number(queue[i][1])-1,left=y%2===0?-1:0;
   for(const [dx,dy] of [[-1,0],[1,0],[left,-1],[left+1,-1],[left,1],[left+1,1]]){
    const nx=x+dx,ny=y+dy;if(nx<0||nx>4||ny<0||ny>4)continue;
    const n=String.fromCharCode(65+nx)+(ny+1);if(unseen.delete(n))queue.push(n);
   }
  }
  result.push(queue.sort());
 }
 return result;
}

test('Mulberry32 and phase derivation have fixed uint32 vectors, including zero and maximum seed',()=>{
 for(const [seed,expected] of [
  [0,[1144304738,1416247,958946056,627933444,2007157716]],
  [1,[2693262067,11749833,2265367787,4213581821,4159151403]],
  [4294967295,[3850105811,813802916,3073704848,4054706436,3630262831]]]){
  const r=createRandom(seed);assert.deepEqual(expected.map(()=>r.uint32()),expected);
 }
 const r=randomStream(42,'abstract-maps-1/1/layout');
 assert.deepEqual(Array.from({length:5},()=>r.uint32()),[2968867240,3728819282,3981288836,2158247839,2732570862]);
 const a=randomStream(5,'layout'),b=randomStream(5,'layout');
 randomStream(5,'illustration').uint32();assert.equal(a.uint32(),b.uint32());
 for(const seed of [undefined,-1,0.5,NaN,Infinity,4294967296,'1'])assert.throws(()=>createRandom(seed),RangeError);
 for(const limit of [0,-1,1.5,4294967297])assert.throws(()=>createRandom(0).integer(limit),RangeError);
 assert.equal(createRandom(1).integer(1),0);
 assert.throws(()=>randomStream(1,'ä'),RangeError);
});

test('fixed generator output pins the version; canonical options and repeated calls reproduce the whole result',()=>{
 assert.equal(GENERATOR_VERSION,'abstract-maps-1');
 const a=generateMap({seed:1});assert.deepEqual(a,generateMap({seed:1}));
 assert.deepEqual(a.map.objects,[
  object('geo-01',['C2','D3'],false),object('geo-02',['D4','E2','E3','E4'],false),
  object('geo-03',['B2','C1'],true),object('geo-04',['A4','A5','B4','B5'],false)]);
 assert.deepEqual(a,generateMap({seed:1,config:{objectSizes:[4,1,3,2]}}));
 assert.deepEqual(a,generateMap({seed:1,config:a.diagnostics.config}));
 assert.deepEqual(a.map,generateMap({seed:1,config:{analysis:{steps:[1,6],maxNodes:1}}}).map);
});

test('256 seeds produce valid, disjoint, independently connected objects of all sizes and both passabilities',()=>{
 const seen=new Set();
 for(let seed=0;seed<256;seed++){
  const result=generateMap({seed});assert.equal(result.status,'generated');validateMap(result.map);
  const occupied=result.map.objects.flatMap(o=>o.cells);assert.equal(new Set(occupied).size,occupied.length);
  assert.equal(new Set(result.map.objects.map(o=>o.id)).size,result.map.objects.length);
  for(const o of result.map.objects){assert.equal(referenceComponents(o.cells).length,1);seen.add(o.cells.length+':'+o.passable);}
  const blocked=result.map.objects.filter(o=>!o.passable).flatMap(o=>o.cells);
  assert.deepEqual(result.analysis.regions.map(r=>r.cells),referenceComponents(cells.filter(c=>!blocked.includes(c))));
  assert.deepEqual(result.analysis.blockedComponents,referenceComponents(blocked));
  assert.deepEqual(Object.keys(result.map).sort(),['geometry','grid','objects']);
 }
 for(const size of [1,2,3,4])for(const access of [true,false])assert.ok(seen.has(size+':'+access));
});

test('invalid options and impossible area budgets fail early with INVALID_CONFIG',()=>{
 for(const config of [null,[],{extra:true},{objectCount:{min:3,max:2}},{objectCount:26},
  {objectCount:13,objectSizes:[2]},{objectCount:2,objectSizes:[1,25]},
  {objectSizes:[]},{objectSizes:[0]},{objectSizes:[2,2]},{objectSizes:[1.5]},
  {passableProbability:NaN},{passableProbability:2},{maxMapAttempts:0},{maxPlacementAttempts:0},
  {analysis:{steps:[0]}},{analysis:{steps:[1,1]}},{analysis:{steps:[7]}},{analysis:{maxNodes:0}},
  {filters:{routeSteps:[7]}},{filters:{minLargestComponent:26}},{filters:{hidden:true}}]){
  assert.throws(()=>generateMap({seed:1,config}),{code:'INVALID_CONFIG'});
 }
 for(const seed of [undefined,-1,0.5,2**32,'1'])assert.throws(()=>generateMap({seed}),{code:'INVALID_CONFIG'});
 for(const options of [null,[],{seed:1,filters:{}}])assert.throws(()=>generateMap(options),{code:'INVALID_CONFIG'});
 assert.equal(normalizeConfig({objectCount:10,objectSizes:[1,3]}).objectCount.max,10);
});

test('empty, all-water, full blocked and full passable maps are accepted without hidden suitability filters',()=>{
 const empty=generateMap({seed:0,config:{objectCount:0,analysis:{steps:[6]}}});
 assert.equal(empty.status,'generated');assert.deepEqual(empty.map.objects,[]);assert.equal(empty.analysis.routes[0].status,'no-route');
 assert.equal(empty.analysis.metrics.waterFraction,1);
 for(const passableProbability of [0,1]){
  const r=generateMap({seed:0,config:{objectCount:1,objectSizes:[25],passableProbability,analysis:{steps:[6],maxNodes:1}}});
  assert.equal(r.status,'generated');assert.equal(r.map.objects[0].cells.length,25);
  assert.equal(r.analysis.passableCells.length,passableProbability?25:0);
 }
 const noStart=generateMap({seed:0,config:{passableProbability:0}});assert.equal(noStart.status,'generated');assert.deepEqual(noStart.analysis.startCells,[]);
 const split=generateMap({seed:0});assert.ok(split.analysis.regions.length>1);assert.equal(split.diagnostics.attempts,1);
});

test('random placement failure is distinct from invalid configuration, bounded and reproducible',()=>{
 const options={seed:0,config:{objectCount:10,objectSizes:[2],maxMapAttempts:1,maxPlacementAttempts:1}};
 const r=generateMap(options);assert.equal(r.status,'exhausted');assert.deepEqual(r,generateMap(options));
 assert.equal(r.diagnostics.attempts,1);assert.equal(r.diagnostics.placementAttempts,8);
 assert.equal(r.diagnostics.rejectionCounts.PLACEMENT_EXHAUSTED,1);assert.equal(r.map,null);
 assert.ok(r.diagnostics.placementAttempts<=10);
 const retried=generateMap({...options,config:{...options.config,maxMapAttempts:5}});
 assert.deepEqual(retried,generateMap({...options,config:{...options.config,maxMapAttempts:5}}));
 assert.ok(retried.diagnostics.attempts<=5);assert.equal(retried.status,'generated');
});

test('analysis finds an isolated water region and never promotes free water into a start',()=>{
 const ring=['B2','C2','B3','D3','B4','C4'];
 const map=mapOf([object('ring',ring,false),object('port',['E4','E5'],true)]),before=structuredClone(map);
 const a=analyzeMap(map,{steps:[1,6]});
 assert.deepEqual(a.isolatedCells,['C3']);assert.ok(a.regions.some(r=>r.cells.length===1&&r.cells[0]==='C3'&&r.startCells.length===0));
 assert.deepEqual(a.startCells,['E4','E5']);assert.deepEqual(a.routes[0].eligibleStarts,['E4','E5']);
 assert.equal(a.metrics.occupiedCells,8);assert.equal(a.metrics.waterCells,17);
 assert.equal(a.metrics.blockedComponentCount,1);assert.deepEqual(map,before);
});

test('component size is only necessary: a four-cell star has no simple three-step route',()=>{
 const map=restrictedMap(['C3','D3','B4','B2'],['C3','D3']);
 const a=analyzeMap(map,{steps:[2,3]});
 assert.deepEqual(a.metrics.passableComponentSizes,[4]);assert.deepEqual(a.articulationCells,['C3']);
 assert.deepEqual(a.deadEnds,['B2','B4','D3']);
 assert.equal(a.routes[0].starts.find(s=>s.cell==='C3').status,'no-route');
 assert.equal(a.routes[0].starts.find(s=>s.cell==='D3').status,'route-found');
 assert.equal(a.routes[1].status,'no-route');assert.equal(a.routes[1].countExact,true);
 assert.equal(a.routes[1].starts[0].search.method,'engine-routes');
 assert.equal(evaluateFilters(a,{routeSteps:[3]}).reasons[0].code,'NO_ROUTE_FOR_STEPS');
});

test('exact route counts agree with the existing engine for every start and 1–6 steps',()=>{
 const map=restrictedMap(['A1','B1','C1','D1','E1','E2','E3'],['A1','B1']);
 const a=analyzeMap(map,{steps:[1,2,3,4,5,6],maxNodes:10000});
 for(const row of a.routes)for(const s of row.starts){
  const expected=[...createRules({map,start:s.cell,steps:row.steps,clues:[]}).routes()].length;
  assert.equal(s.routeCountLowerBound,expected);assert.equal(s.countExact,true);assert.equal(s.status,expected?'route-found':'no-route');
 }
});

test('search budgets distinguish unknown from absence and partial positive counts from exact counts',()=>{
 const map=mapOf([object('port',['C3'],true)]);
 const unknown=analyzeMap(map,{steps:[1],maxNodes:1}).routes[0];
 assert.equal(unknown.status,'unknown');assert.deepEqual(unknown.unknownStarts,['C3']);
 assert.equal(unknown.eligibleStartCountExact,false);assert.equal(unknown.countExact,false);assert.equal(unknown.search.nodesVisited,1);
 const partial=analyzeMap(map,{steps:[1],maxNodes:2}).routes[0];
 assert.equal(partial.status,'route-found');assert.equal(partial.routeCountLowerBound,1);assert.equal(partial.countExact,false);
 assert.equal(partial.eligibleStartCountExact,true);
 assert.equal(evaluateFilters(analyzeMap(map,{steps:[1],maxNodes:2}),{routeSteps:[1]}).status,'accepted');
 const complete=analyzeMap(map,{steps:[1],maxNodes:7}).routes[0];
 assert.equal(complete.routeCountLowerBound,6);assert.equal(complete.countExact,true);assert.equal(complete.search.nodesVisited,7);
 const small=analyzeMap(restrictedMap(['C3'],['C3']),{steps:[1],maxNodes:1}).routes[0];
 assert.equal(small.status,'no-route');assert.equal(small.countExact,true);assert.equal(small.search.nodesVisited,0);
});

test('analysis rejects invalid maps/options, is order invariant, and does not mutate frozen maps',()=>{
 const r=generateMap({seed:5}),map=structuredClone(r.map);
 for(const o of map.objects){Object.freeze(o.cells);Object.freeze(o);}Object.freeze(map.objects);Object.freeze(map.grid);Object.freeze(map);
 const a=analyzeMap(map,{steps:[3,1]});assert.deepEqual(a,analyzeMap({...map,objects:[...map.objects].reverse().map(o=>({...o,cells:[...o.cells].reverse()}))},{steps:[1,3]}));
 assert.throws(()=>analyzeMap({...map,geometry:'other'}));assert.throws(()=>analyzeMap(map,{steps:[7]}),{code:'INVALID_CONFIG'});
 assert.throws(()=>evaluateFilters(a,{routeSteps:[6]}),{code:'INVALID_CONFIG'});
});

test('explicit filters report proven rejections, incomplete searches, and deterministic retries separately',()=>{
 const bare={seed:3,config:{objectCount:1,objectSizes:[1],passableProbability:1,analysis:{steps:[1],maxNodes:1},maxMapAttempts:2}};
 assert.equal(generateMap(bare).status,'generated');
 const filtered={...bare,config:{...bare.config,filters:{routeSteps:[1]}}},r=generateMap(filtered);
 assert.equal(r.status,'inconclusive');assert.deepEqual(r,generateMap(filtered));
 assert.equal(r.diagnostics.unknownAttempts,2);assert.equal(r.diagnostics.rejectedAttempts,0);
 assert.equal(r.diagnostics.rejectionCounts.SEARCH_BUDGET_EXCEEDED,2);
 assert.ok(r.diagnostics.attemptLog.every(a=>a.routes[0].status==='unknown'&&!a.routes[0].search.completed));
 const rejected=generateMap({seed:3,config:{objectCount:0,filters:{routeSteps:[1]},maxMapAttempts:2}});
 assert.equal(rejected.status,'exhausted');assert.equal(rejected.diagnostics.rejectionCounts.NO_ELIGIBLE_START,2);
 const a=analyzeMap(mapOf([object('port',['C3'],true)]),{steps:[1],maxNodes:1});
 assert.equal(evaluateFilters(a,{routeSteps:[1]}).status,'unknown');
 assert.equal(evaluateFilters(a,{routeSteps:[1],minLargestComponent:25}).status,'unknown');
 const split=analyzeMap(restrictedMap(['C3','E5'],['C3']),{steps:[1]});
 assert.equal(evaluateFilters(split,{minLargestComponent:2}).reasons[0].code,'COMPONENT_TOO_SMALL');
 const retryOptions={seed:2,config:{passableProbability:0.15,filters:{routeSteps:[3]}}};
 const retry=generateMap(retryOptions);assert.equal(retry.status,'generated');assert.equal(retry.diagnostics.attempts,2);
 assert.equal(retry.diagnostics.rejectionCounts.NO_ELIGIBLE_START,1);assert.deepEqual(retry,generateMap(retryOptions));
 assert.equal(retry.analysis.routes[0].status,'route-found');
 const mixed=analyzeMap(restrictedMap(['C3','D3','B4','B2'],['C3']),{steps:[1],maxNodes:1});
 const conjunction=evaluateFilters(mixed,{routeSteps:[1],minLargestComponent:5});
 assert.equal(conjunction.status,'rejected');assert.equal(conjunction.reasons.find(r=>r.code==='SEARCH_BUDGET_EXCEEDED').status,'unknown');
});
