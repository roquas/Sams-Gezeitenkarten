import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRules} from '../../src/engine/puzzle.mjs';
import {logicalFingerprints} from '../../scripts/lib/publication-archive.mjs';
import {generateTrueClues,clueKey} from '../../scripts/lib/puzzle-clues.mjs';
import {createRouteWorkspace} from '../../scripts/lib/puzzle-route-solver.mjs';
import {searchPuzzleCandidates} from '../../scripts/lib/puzzle-candidate-search.mjs';

const regression=JSON.parse(fs.readFileSync(new URL('../fixtures/generation/b2-effect-equivalence.json',import.meta.url),'utf8'));
const [a,b]=regression.definitions,logic={...a.logic,clues:[]},rules=createRules(logic),routes=[...rules.routes()];
const effects=definition=>[...new Set(definition.logic.clues.map(clue=>routes.map(route=>Number(rules.matches(route,clue))).join('')))].sort();

test('P2-1: old B2 lines 73/77 have distinct parameter fingerprints and equal individual clue effects on all 821 routes',()=>{
 assert.equal(routes.length,regression.legalRouteCount);
 assert.equal(logic.start,'E1');assert.equal(regression.routeSource.routeIndex,0);
 assert.deepEqual(logicalFingerprints(a),regression.fingerprints[0]);assert.deepEqual(logicalFingerprints(b),regression.fingerprints[1]);
 assert.notEqual(regression.fingerprints[0].variant,regression.fingerprints[1].variant);
 assert.deepEqual(effects(a),effects(b));
});

test('P2-1: same seed and six restarts retain one of the equivalent variants without replacement search',()=>{
 const workspace=createRouteWorkspace(logic,{maxNodes:regression.budgets.maxNodesPerStart});
 const pool=generateTrueClues(logic,a.solution,{maxClueParameters:regression.budgets.maxClueParameters});
 const {maxRestarts,maxSolverChecks,maxMatchEvaluations,maxRouteFilterEvaluations}=regression.budgets;
 const result=searchPuzzleCandidates({logic,targetRoute:a.solution,cluePool:pool,workspace,seed:regression.seed,
  budgets:{maxRestarts,maxSolverChecks,maxMatchEvaluations,maxRouteFilterEvaluations}});
 const keys=result.candidates.map(c=>JSON.stringify(effects(c.definition)));
 assert.equal(new Set(keys).size,result.candidates.length,'equivalent single-clue effects must not be counted twice');
 assert.equal(result.candidates.length,5);assert.equal(result.search.restarts,6);
 assert.equal(result.search.failures.EQUIVALENT_CLUE_EFFECTS,1);
 assert.ok(result.candidates.some(c=>c.fingerprints.variant===regression.fingerprints[0].variant));
 assert.ok(!result.candidates.some(c=>c.fingerprints.variant===regression.fingerprints[1].variant));
 // All candidates have the same combined solution; different sets of individual
 // effects must still survive as different puzzles.
 assert.ok(new Set(result.candidates.map(c=>c.effectKey)).size>1);
});

test('P2-1: effect keys ignore clue order and parameter aliases, use complete route universes, and consume existing masks',()=>{
 const clues=[...new Map([...a.logic.clues,...b.logic.clues].map(clue=>[clueKey(clue),clue])).values()].map((clue,i)=>({...clue,id:'K'+i}));
 const indices=definition=>definition.logic.clues.map(clue=>clues.findIndex(c=>clueKey(c)===clueKey(clue)));
 const solver=createRouteWorkspace(logic,{maxNodes:100000}).forClues(clues,regression.budgets);
 solver.check(indices(a));solver.check(indices(b));const before={...solver.metrics};
 const key=solver.effectKey(indices(a));assert.equal(key,solver.effectKey(indices(b).reverse()));
 assert.equal(key,solver.effectKey([...indices(a),...indices(a)]));assert.deepEqual(solver.metrics,before);
 const otherBudget=createRouteWorkspace(logic,{maxNodes:1000000}).forClues(clues,regression.budgets);
 assert.equal(key,otherBudget.effectKey(indices(a)));
 assert.equal(createRouteWorkspace(logic,{maxNodes:1}).forClues,undefined);
});
