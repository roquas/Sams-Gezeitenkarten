import {prepareCoordinates} from './coordinates.mjs';
// Both views prepare the same article, scoped to the active/reference puzzle.
export function prepareRules(root,puzzle){
 root.querySelectorAll('[data-rule-hours]').forEach(el=>{
  el.textContent=puzzle.steps===6&&el.dataset.ruleHours!=='number'?
   (el.dataset.ruleHours==='capital'?'Sechs':'sechs'):String(puzzle.steps);
 });
 if(root.matches('.rules-introduction'))prepareCoordinates(root);
 else root.querySelectorAll('.rules-introduction,[data-coordinate-prose]').forEach(prepareCoordinates);
}
