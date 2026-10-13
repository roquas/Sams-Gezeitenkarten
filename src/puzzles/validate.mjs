import {schemaErrors} from './schema.mjs';
import {MOTIFS,BACKGROUNDS} from './assets.mjs';
import {createRules} from '../engine/puzzle.mjs';
import {solvePuzzle} from '../engine/solver.mjs';
export class PuzzleError extends Error{
 constructor(errors){super('Rätsel konnte nicht geladen werden: '+errors.join('; '));this.name='PuzzleError';this.errors=errors;}
}
export function validatePuzzle(document){
 const errors=schemaErrors(document);
 if(errors.length)throw new PuzzleError(errors);
 const {logic,presentation}=document,rules=createRules(logic),known=new Set(rules.cells),blocked=rules.blocked;
 const check=(ok,path,message)=>{if(!ok)errors.push(`${path}: ${message}`);};
 check(!blocked.has(logic.start),'logic.start','Start liegt auf Land');
 check(logic.steps<known.size-blocked.size,'logic.steps','zu wenige befahrbare Felder');
 for(const [id,place] of Object.entries(logic.places))check(place.cells.every(c=>place.kind==='island'?blocked.has(c):!blocked.has(c)),`logic.places.${id}`,'Ortsart widerspricht Befahrbarkeit');
 const clueIds=logic.clues.map(c=>c.id);
 check(new Set(clueIds).size===clueIds.length,'logic.clues','doppelte Hinweis-ID');
 for(const clue of logic.clues){
  const path=`logic.clues.${clue.id}`;
  for(const hour of clue.hours??[clue.hour])check(hour<=logic.steps,path,'Stunde überschreitet Routenlänge');
  if(clue.hours)check(clue.hours[0]<=clue.hours[1],path,'Stundenbereich ist umgekehrt');
  if(clue.place)check(Object.hasOwn(logic.places,clue.place),path,'unbekannte Orts-ID');
  if(clue.type==='countAdjacentToPlace')check(clue.count<=clue.hours[1]-clue.hours[0]+1,path,'Anzahl überschreitet Stundenbereich');
 }
 for(const [name,ids] of [['places',Object.keys(logic.places)],['clues',clueIds]]){
  check(ids.every(id=>Object.hasOwn(presentation[name],id)),`presentation.${name}`,'Textreferenz fehlt');
  check(Object.keys(presentation[name]).every(id=>ids.includes(id)),`presentation.${name}`,'unbekannte Textreferenz');
 }
 check(Object.hasOwn(BACKGROUNDS,presentation.background),'presentation.background','unbekanntes Asset');
 for(const [i,o] of presentation.overlays.entries())check(Object.hasOwn(MOTIFS,o.asset),`presentation.overlays[${i}].asset`,'unbekanntes Asset');
 if(document.solution){
  check(rules.legal(document.solution),'solution','keine legale vollständige Route');
  if(!errors.length)check(logic.clues.every(c=>rules.matches(document.solution,c)),'solution','Sollroute widerspricht Hinweisen');
 }
 if(errors.length)throw new PuzzleError(errors);
 return document;
}
export function compilePuzzle(document){
 validatePuzzle(document);
 const analysis=solvePuzzle(document.logic);
 if(analysis.status!=='unique')throw new PuzzleError([`logic: ${analysis.count} Lösungen (${analysis.status}); veröffentlicht werden nur eindeutige Rätsel`]);
 if(document.solution&&document.solution.some((cell,h)=>cell!==analysis.solutions[0][h]))throw new PuzzleError(['solution: Sollroute weicht von der unabhängig ermittelten Lösung ab']);
 const {logic,presentation}=document;
 // Compatibility view for the existing engine/UI; logic and editorial text stay separate on disk.
 return {...logic,id:document.id,schemaVersion:document.schemaVersion,dataVersion:document.dataVersion,
  places:Object.fromEntries(Object.entries(logic.places).map(([id,p])=>[id,{...p,name:presentation.places[id]}])),
  clues:logic.clues.map(c=>({...c,text:presentation.clues[c.id]})),
  title:presentation.title,intro:presentation.intro,hints:presentation.hints,
  background:{asset:BACKGROUNDS[presentation.background]},overlays:presentation.overlays,
  solution:analysis.solutions[0],resultTexts:document.resultTexts??{},analysis
 };
}
