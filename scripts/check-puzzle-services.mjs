// Read-only smoke analysis of an explicitly supplied internal definition.
import {readFileSync} from 'node:fs';
import {checkIrredundancy} from '../src/puzzles/analysis.mjs';
import {validateLogicDefinition} from '../src/engine/validate.mjs';
const filename=process.argv[2];
if(!filename)throw Error('Usage: node scripts/check-puzzle-services.mjs <internal-definition.json>');
const definition=JSON.parse(readFileSync(filename));validateLogicDefinition(definition);
console.log(JSON.stringify(checkIrredundancy(definition),null,2));
