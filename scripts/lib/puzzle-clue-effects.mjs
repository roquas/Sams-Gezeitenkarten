// Private B2 identity only. Existing instance/variant fingerprints stay intact.
import {canonicalJson,sha256} from './content-hash.mjs';
import {mapFingerprint} from './publication-archive.mjs';
import {ROUTE_ORDER} from './route-experiment.mjs';
import {RULES_VERSION} from '../../src/puzzles/schema.mjs';

export function createClueEffectKey(logic,routes){
 const scope={rulesVersion:RULES_VERSION,mapFingerprint:mapFingerprint(logic.map),start:logic.start,
  steps:logic.steps,routeOrder:ROUTE_ORDER,routesSha256:sha256(canonicalJson(routes))};
 // Each mask describes ONE clue on EVERY legal route. Sorting/deduplicating
 // these effects never collapses all unique puzzles to their shared solution.
 return masks=>`gk-b2-effects-v1-sha256:${sha256(canonicalJson({...scope,
  clueEffects:[...new Set(masks.map(mask=>sha256(mask)))].sort()}))}`;
}
