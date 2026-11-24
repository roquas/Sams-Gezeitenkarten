// Artificial, public fixture. No S04 content, private catalog or world-canon claims.
import {definition} from '../model/factories.mjs';
export function flavorFixture(){
 const source=definition();delete source.solution;
 source.id='flavor-public';source.logic.steps=6;
 source.logic.clues=[
  {id:'direction',type:'direction',hour:1,direction:'E'},
  {id:'turn',type:'turn',hour:2,degrees:60},
  {id:'position',type:'position',hour:0,cell:'C3'},
  {id:'place',type:'distanceToPlace',hour:3,placeId:'shore',distance:2},
  {id:'between',type:'distanceBetweenHours',hours:[0,6],distance:3},
  {id:'count',type:'countDistanceToPlace',fromHour:0,toHour:6,placeId:'shore',distance:1,count:2}
 ];
 source.presentation.objectNames={port:'Alter Hafen',shore:'Klippeninsel'};
 source.presentation.clueTexts=Object.fromEntries(source.logic.clues.map(c=>[c.id,`Öffentlicher Originaltext ${c.id}`]));
 source.presentation.cluePlaceRefs={place:['shore'],count:['shore']};
 source.resultTexts={correct:'Geschafft!',incorrect:'Noch einmal prüfen.'};
 return source;
}
export const alteredStatements=[
 ['direction','hour',2],['direction','direction','W'],['turn','degrees',-60],['turn','hour',3],
 ['position','hour',1],['position','cell','D3'],['place','placeId','port'],['place','distance',1],['place','hour',4],
 ['between','hours',[1,6]],['between','distance',2],
 ['count','count',1],['count','count',0],['count','count',7],
 ['count','fromHour',1],['count','toHour',5],['count','distance',2],['count','placeId','port']
];
export const freeProse=[
 'Genau zweimal war Sam neben der Klippeninsel, irgendwann während der Fahrt.',
 'Von Stunde 0 bis 6 war das Schiff mindestens zweimal neben der Klippeninsel.',
 'Von Stunde 0 bis 6 war das Schiff genau zweimal neben der Klippeninsel und nie am Start.',
 'Neben der Insel blieb Sam wohl eine Weile.',
 'Vielleicht war der Abstand genau eins.',
 'In Stunde 3 war das Schiff genau 2 Hexfelder von der Klippeninsel entfernt.',
 'Die Klippeninsel lag in Stunde 3 genau 2 Hexfelder vom Schiff entfernt.'
];
