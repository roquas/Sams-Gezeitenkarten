// Presentation only. No predicates, solver decisions or narrative templates.
export function technicalClueText(clue,map){
 const place=()=>{
  const object=map.objects.find(o=>o.id===clue.placeId);
  if(!object)throw Error('Unknown place '+clue.placeId);
  return `Ort ${object.id} (${object.cells.join(', ')})`;
 };
 switch(clue.type){
  case 'position':return `Position in Stunde ${clue.hour}: ${clue.cell}.`;
  case 'direction':return `Fahrtrichtung von Stunde ${clue.hour-1} zu Stunde ${clue.hour}: ${{E:'Ost',SE:'Südost',SW:'Südwest',W:'West',NW:'Nordwest',NE:'Nordost'}[clue.direction]}.`;
  case 'turn':return `Kurswechsel in Stunde ${clue.hour} gegenüber der unmittelbar vorherigen Fahrtrichtung: ${clue.degrees===0?'geradeaus (0°)':`${Math.abs(clue.degrees)}° ${clue.degrees>0?'rechts':'links'}`}.`;
  case 'distanceToPlace':return `Hexabstand in Stunde ${clue.hour} zu ${place()}: genau ${clue.distance}.`;
  case 'distanceBetweenHours':return `Hexabstand zwischen den Positionen in Stunde ${clue.hours[0]} und Stunde ${clue.hours[1]}: genau ${clue.distance}.`;
  case 'countDistanceToPlace':return `In den Stunden ${clue.fromHour} bis ${clue.toHour} (beide einschließlich) beträgt der Hexabstand zu ${place()} in genau ${clue.count} Stunden genau ${clue.distance}.`;
  default:throw Error('Unsupported clue text type '+clue.type);
 }
}
