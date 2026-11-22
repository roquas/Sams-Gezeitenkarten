// Editorial promotion of the frozen, human-playtested six-hour reference.
// No generation, solver changes or updates to historical evidence.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readPositiveV2Definition,buildPositiveV2Playtest,POSITIVE_V2_ID} from './lib/b2-positive-v2.mjs';
import {validatePublicPuzzle} from '../src/puzzles/public.mjs';
import {compilePuzzle} from '../src/puzzles/validate.mjs';
export function landingPuzzle(){
 const definition=readPositiveV2Definition();
 const dto=JSON.parse(buildPositiveV2Playtest(definition).get(POSITIVE_V2_ID+'.json'));
 dto.puzzle.id='drei-peilungen';
 dto.puzzle.presentation.intro=[
  'Sam und Robin waren sechs Stunden unterwegs. Das Startwrack liegt auf Alpha / Cyan; sechs Etappen später endet die gesuchte Fahrt. Robins Logbuch enthält sechs Beobachtungen. Er hält das für eine ordentliche Buchführung.',
  'Alle Hexfelder dieser Karte sind befahrbar. Nordboje: Delta / Magenta. Südboje: Epsilon / Orange. Zählboje: Gamma / Magenta. Abstände sind geometrische Hexabstände, unabhängig vom gefahrenen Weg.'
 ];
 dto.puzzle.presentation.hints=[
  'Beginne bei der fest angegebenen Position in Stunde 5. Die Fahrtrichtung dorthin verrät auch die Position eine Stunde davor.',
  'Der Abstand zwischen Stunde 1 und Stunde 4 ist genauso groß wie die drei dazwischenliegenden Schritte. Welche Umwege scheiden dadurch aus?',
  'Prüfe die noch möglichen Positionen der Stunden 2, 3 und 4 gemeinsam am Zählhinweis. Genau zwei dieser drei Positionen müssen Abstand 1 zur Zählboje haben.',
  'Für die letzte Etappe bleiben nur unbesuchte Nachbarn der Position in Stunde 5. Vergleiche ihren Hexabstand mit dem Hinweis zur Südboje.'
 ];
 const assetLibrary=JSON.parse(fs.readFileSync(new URL('../assets/catalog/library.json',import.meta.url)));
 validatePublicPuzzle(dto,{assetLibrary});
 const compiled=compilePuzzle(dto.puzzle,{assetLibrary});
 if(JSON.stringify(compiled.solution)!==JSON.stringify(definition.solution))throw Error('Editorial promotion changed solution');
 return JSON.stringify(dto,null,2)+'\n';
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const target=new URL('../puzzles/drei-peilungen.json',import.meta.url),bytes=landingPuzzle();
 if(process.argv.includes('--write'))fs.writeFileSync(target,bytes);
 else if(fs.readFileSync(target,'utf8')!==bytes)throw Error('Landing puzzle differs from validated projection');
 console.log('Landing puzzle: validated, unique, source logic unchanged.');
}
