// Presentation only. No predicates, solver decisions or narrative templates.
import {cluePresentationForm} from './clue-presentation.mjs';
export function technicalClueText(clue,map){
 const place=()=>{
  const object=map.objects.find(o=>o.id===clue.placeId);
  if(!object)throw Error('Unknown place '+clue.placeId);
  return `Ort ${object.id} (${object.cells.join(', ')})`;
 };
 switch(cluePresentationForm(clue)){
  case 'position':return `Position in Stunde ${clue.hour}: ${clue.cell}.`;
  case 'direction':return `Fahrtrichtung von Stunde ${clue.hour-1} zu Stunde ${clue.hour}: ${{E:'Ost',SE:'Südost',SW:'Südwest',W:'West',NW:'Nordwest',NE:'Nordost'}[clue.direction]}.`;
  case 'turn':return `Kurswechsel in Stunde ${clue.hour} gegenüber der unmittelbar vorherigen Fahrtrichtung: ${clue.degrees===0?'geradeaus (0°)':`${Math.abs(clue.degrees)}° ${clue.degrees>0?'rechts':'links'}`}.`;
  case 'distanceToPlace':return `Hexabstand in Stunde ${clue.hour} zu ${place()}: genau ${clue.distance}.`;
  case 'distanceBetweenHours':return `Hexabstand zwischen den Positionen in Stunde ${clue.hours[0]} und Stunde ${clue.hours[1]}: genau ${clue.distance}.`;
  case 'NotDistanceAt':
  case 'HasDistanceAt':
  case 'CountDistanceNever':
  case 'countDistanceToPlace':{
   const duration=clue.toHour-clue.fromHour+1;
   const time=duration===1?`In Stunde ${clue.fromHour}`:`Von Stunde ${clue.fromHour} bis Stunde ${clue.toHour}`;
   const times=['nullmal','einmal','zweimal','dreimal','viermal','fünfmal','sechsmal','siebenmal'];
   const frequency=duration===1&&clue.count===1?'':clue.count===0?(duration===1?'nicht ':'nie '):
    duration>1&&clue.count===duration?'in jeder Stunde ':`genau ${times[clue.count]??`${clue.count} Mal`} `;
   // This technical formatter uses "Ort <id>", not inflected editorial names.
   const location=clue.distance===0?`auf dem ${place()}`:clue.distance===1?`neben dem ${place()}`:
    `genau ${clue.distance} Hexfelder von dem ${place()} entfernt`;
   return `${time} war das Schiff ${frequency}${location}.`;
  }
  default:throw Error('Unsupported clue text type '+clue.type);
 }
}
