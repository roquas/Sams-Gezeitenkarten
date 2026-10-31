// Derived presentation only; never part of logic, fingerprints or clue effects.
export function cluePresentationForm(clue){
 if(clue.type!=='countDistanceToPlace')return clue.type;
 if(clue.fromHour===clue.toHour){
  if(clue.count===0)return 'NotDistanceAt';
  if(clue.count===1)return 'HasDistanceAt';
 }
 if(clue.count===0)return 'CountDistanceNever';
 return clue.type;
}

// Count occurrences, including different forms of one logical type in a puzzle.
// Deriving from clues also supports historical artifacts without these fields.
export function clueStatistics(clues){
 const byType={},byPresentationForm={};
 for(const clue of clues){
  byType[clue.type]=(byType[clue.type]??0)+1;
  const form=cluePresentationForm(clue);
  byPresentationForm[form]=(byPresentationForm[form]??0)+1;
 }
 return {byType,byPresentationForm};
}
