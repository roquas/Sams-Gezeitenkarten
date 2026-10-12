// Versioned, DOM-independent data for the archived 3.6 reference puzzle.
export const referencePuzzle=Object.freeze({
 id:'reference-3.6',schemaVersion:1,
 grid:{columns:5,rows:5},start:'D4',steps:6,
 blocked:['B3','C3','E2'],
 places:{tesoro:{name:'Tesoro',cells:['B3','C3'],kind:'island'},lighthouse:{name:'Leuchtturm',cells:['C1'],kind:'lighthouse'}},
 solution:['D4','E3','D2','C2','B2','B1','A1'],
 background:{asset:'meer-01.webp'},
 overlays:[
  {asset:'insel-einzeln-01.png',cells:['E2'],w:76,h:76,dx:0,dy:0,opacity:.85},
  {asset:'insel-zweier-01.png',cells:['B3','C3'],w:144,h:124,dx:0,dy:0,opacity:.88},
  {asset:'segelboot-01.png',cells:['D4'],w:60,h:47,dx:0,dy:0,opacity:.83},
  {asset:'leuchtturm-01.png',cells:['C1'],w:68,h:68,dx:0,dy:0,opacity:.92},
  {asset:'riff-01.png',cells:['A3'],w:68,h:66,dx:0,dy:0,opacity:.76},
  {asset:'insel-einzeln-02.png',cells:['D5'],w:64,h:64,dx:0,dy:0,opacity:.82},
  {asset:'segelboot-02.png',cells:['E4'],w:61,h:51,dx:0,dy:0,opacity:.77},
  {asset:'krabbe-01.png',cells:['D5'],w:45,h:42,dx:0,dy:0,opacity:.32}
 ],
 clues:[
  {id:'I',type:'direction',hour:1,direction:'NE',text:'In der ersten Stunde hielten wir Kurs nach Nordosten. Robin sagte, der Kompass habe dabei ausgesprochen überzeugt ausgesehen.'},
  {id:'II',type:'turn',hour:2,degrees:-60,text:'In der zweiten Stunde drehten wir den Kurs um genau 60° nach links. Sam notierte vorsichtshalber auch, dass links nicht dasselbe wie zurück bedeutet.'},
  {id:'III',type:'adjacentToPlace',hour:4,place:'tesoro',text:'Nach Stunde 4 lag unser Boot direkt an der Küste von Tesoro – auf einem Wasserfeld mit gemeinsamer Hexseite zur Insel. Robin winkte einem Felsen zu.'},
  {id:'IV',type:'direction',hour:6,direction:'W',text:'In der sechsten Stunde fuhren wir nach Westen. Das war laut Robin der kürzeste Weg nach irgendwohin.'},
  {id:'V',type:'distanceToPlace',hour:5,place:'lighthouse',distance:1,text:'Nach Stunde 5 waren wir genau ein Hexfeld vom Leuchtturm bei Gamma/Cyan entfernt. Sam konnte sogar die Möwen zählen.'},
  {id:'VI',type:'distanceBetweenHours',hours:[1,3],distance:2,text:'Zwischen unseren Positionen nach Stunde 1 und Stunde 3 lagen genau zwei Hexfelder Luftlinie. Auf dem Papier sah das ordentlicher aus als auf See.'},
  {id:'VII',type:'countAdjacentToPlace',hours:[3,6],place:'tesoro',count:2,text:'Zwischen Stunde 3 und Stunde 6 waren wir insgesamt zweimal direkt an der Küste von Tesoro. Sam zählte die Stunden; Robin hatte inzwischen den Kompass verlegt.'}
 ]
});
