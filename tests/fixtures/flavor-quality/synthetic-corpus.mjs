// Hand-authored artificial regression/calibration cases. These are NOT actual
// producer/reader/reviewer outputs and never create a production revision.
import {technicalClueText} from '../../../scripts/lib/clue-text.mjs';
import {createRules} from '../../../src/engine/puzzle.mjs';
import {direction} from '../../../src/engine/hex.mjs';
const clone=structuredClone;
export function syntheticCorpus(entries){
 const a=entries[0],b=entries[2],chart=a.input.chart,h4=a.originals.find(c=>c.id==='H4'),h1=a.originals[0],h2=a.originals[1];
 const text=c=>technicalClueText(c,chart.map),cases=[];
 function add(id,{entry=a,originals=[h4],texts=originals.map(text),interpretations=originals.map(c=>[c]),expected,reason,title='Eintrag im Hafenarchiv',intro=['Eine Möwe wartet auf ihre Limonade.'],context=null,stage3='clear'}){
  const presentation={title,intro,clues:originals.map((c,i)=>({id:c.id,text:texts[i]}))};
  cases.push({fixtureId:id,kind:'synthetic-hand-authored',entryIndex:entries.indexOf(entry),presentation,originals:clone(originals),interpretations:clone(interpretations),context,
   expectation:{comparison:expected,stage3,reason}});
 }
 add('positive-paraphrase',{expected:'equivalent',reason:'Same complete formal condition, no extra information.'});
 add('positive-creative',{texts:[text(h4)+' Die Geistermöwe rechnete mit Bierdeckeln, ohne sie zu trinken.'],expected:'equivalent',stage3:'clear',reason:'Pirates, beer, ghosts and absurd new local ideas alone are not violations.'});
 add('inclusive-end-boundary',{texts:[text({...h4,toHour:1,count:1})],interpretations:[[{...h4,toHour:1,count:1}]],expected:'weakened',stage3:'ERROR',reason:'Dropping inclusive hour 2 loses part of this clue.'});
 add('hour-zero-boundary',{originals:[{...h1,fromHour:0,distance:createRules(chart).distanceToPlace(chart.start,h1.placeId)}],
  texts:[text({...h1,fromHour:1,distance:createRules(chart).distanceToPlace(chart.start,h1.placeId)})],
  interpretations:[[{...h1,fromHour:1,distance:createRules(chart).distanceToPlace(chart.start,h1.placeId)}]],expected:'weakened',stage3:'ERROR',reason:'Hour 0 belongs to the inclusive interval and cannot be dropped.'});
 add('lost-negation',{originals:[h1],texts:[text({...h1,count:1})],interpretations:[[{...h1,count:1}]],expected:'changed',stage3:'ERROR',reason:'Exactly zero is not exactly one.'});
 add('exact-frequency',{texts:[text({...h4,count:1})],interpretations:[[{...h4,count:1}]],expected:'changed',stage3:'ERROR',reason:'Exact frequency changes in both directions.'});
 add('wrong-object',{texts:[text({...h4,placeId:h2.placeId})],interpretations:[[{...h4,placeId:h2.placeId}]],expected:'changed',stage3:'ERROR',reason:'Same number with another object does not preserve the source.'});
 const multi=chart.map.objects.find(o=>o.cells.length>1),far=multi.cells.at(-1),distanceOriginal={id:'H1',type:'distanceToPlace',hour:1,placeId:multi.id,distance:1};
 add('whole-multihex-area',{originals:[distanceOriginal],texts:[`In Stunde 1 hatte das Schiff Abstand 1 zu ${chart.objectNames[multi.id]}, gemessen nur zum Bildanker ${far}.`],
  interpretations:[[]],expected:'incomparable',stage3:'ERROR',reason:'An entire multihex object is not its anchor, start cell or one arbitrarily selected cell.'});
 const distance=a.originals.find(c=>c.type==='distanceBetweenHours');
 add('geometry-not-stages',{originals:[distance],texts:[`Zwischen Stunde ${distance.hours[0]} und ${distance.hours[1]} fuhr Sam genau ${distance.distance} Etappen.`],interpretations:[[]],expected:'incomparable',stage3:'ERROR',reason:'Travelled stages do not express geometric hex distance; unsupported meaning must remain unresolved.'});
 add('additional-other-original',{originals:[h4,h2],texts:[text(h4)+' '+text(h2),text(h2)],interpretations:[[h4,h2],[h2]],expected:'strengthened',stage3:'ERROR',reason:'Adding another original to one clue preserves the global conjunction but strengthens this clue in isolation.'});
 const visit={id:'A1',type:'distanceToPlace',hour:3,placeId:h2.placeId,distance:0};
 add('invented-visit',{texts:[text(h4)+` In Stunde 3 legten wir auf ${chart.objectNames[h2.placeId]} an.`],interpretations:[[h4,visit]],expected:'strengthened',stage3:'ERROR',reason:'An invented landing adds a route restriction despite a correct extracted original.'});
 add('title-extra-information',{title:'Ankunft in Stunde 3 auf '+chart.objectNames[h2.placeId],expected:'equivalent',stage3:'ERROR',reason:'Isolated clue equivalence cannot authorize mathematics in the title.'});
 add('intro-extra-information',{intro:[`In Stunde 3 legten wir auf ${chart.objectNames[h2.placeId]} an.`],expected:'equivalent',stage3:'ERROR',reason:'Introduction must not add a visit or carry a necessary part of a clue.'});
 add('series-extra-information',{context:{version:1,episodes:[{presentation:{title:'Früherer Hafenbericht',intro:[`Die heutige Fahrt besucht in Stunde 3 ${chart.objectNames[h2.placeId]}.`],clues:[]}}]},
  expected:'equivalent',stage3:'ERROR',reason:'Actual ordered series player text is part of the information boundary.'});
 add('ambiguous-quantifier',{texts:[`Sam war manchmal zwei Felder von ${chart.objectNames[h4.placeId]} entfernt, vielleicht in beiden Stunden.`],interpretations:[[]],expected:'incomparable',stage3:'UNCERTAIN',reason:'Uncertain quantifier/interval must not be silently reduced to an original atom.'});
 const firstDirection=b.originals.find(c=>c.id==='H4'),routes=createRules(b.input.chart),first=[...routes.routes()].find(r=>routes.matches(r,firstDirection));
 add('direction-derived-position',{entry:b,originals:[firstDirection],texts:[`In Stunde 1 lag das Schiff auf ${first[1]}.`],interpretations:[[{id:'A1',type:'position',hour:1,cell:first[1]}]],
  expected:'equivalent',stage3:'ERROR',reason:'Known start makes the position equivalent to first direction, but disclosure may preempt the deduction.'});
 const route=createRules(chart).routes().next().value;
 for(const atom of [{id:'H1',type:'position',hour:1,cell:route[1]}, {id:'H1',type:'direction',hour:1,direction:direction(route[0],route[1])},
  {id:'H1',type:'turn',hour:2,degrees:60},{id:'H1',type:'distanceToPlace',hour:2,placeId:multi.id,distance:1},
  {id:'H1',type:'distanceBetweenHours',hours:[0,2],distance:1},{id:'H1',type:'countDistanceToPlace',fromHour:0,toHour:2,placeId:multi.id,distance:1,count:1}])
  add('positive-'+atom.type,{originals:[atom],texts:[text(atom)],interpretations:[[atom]],expected:'equivalent',reason:'Artificial positive for this executable atom type; position and turn are absent from the real pilot.'});
 return cases;
}
