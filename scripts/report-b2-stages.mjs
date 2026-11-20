import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT} from './lib/b2-deduction-profile.mjs';
import {readStageCases,buildStageDiagnosis} from './lib/b2-stage-diagnostics.mjs';
import {buildRouteEvidence} from './lib/b2-stage-routes.mjs';

export const OUTPUT='docs/verification/S04-A/examples';
const READINGS={A:['H1'],B:['H1','H2+H3'],C:['H1+H2','H1+H3'],D:['H1+H2','H1+H2+H5'],
 V1:['H3','H2+H3'],V2:['H3','H2+H3'],T02:['H1+H4'],T07:['H4+H5'],
 'T07-given-3':['none','H3+H6+H7'],
 'S03-01':['H3','H3+H6','H2+H3+H6'], 'S03-02':['H1','H1+H4'],
 'S03-03':['H5','H3+H6'], 'S03-04':['H1+H5'],
 'S03-05':['H2+H3','H1+H2+H3','H2+H3+H4'], 'S03-06':['H1+H2','H1+H5+H6'],
 'S03-07':['H2','H2+H3'], 'S03-08':['H4','H1+H2+H5','H2+H5+H6'],
 'S03-09':['H2','H3','H1+H2','H2+H3']};
const table=(headers,rows)=>['| '+headers.join(' | ')+' |','| '+headers.map(()=>'---').join(' | ')+' |',
 ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
const source=s=>`[${s.state}](../../../../${s.source.path}#L${s.source.line})`;
const fixes=(s,mode)=>s[mode].fixedHours.filter(f=>f.origin==='clues').map(f=>`S${f.hour}=${f.cell}`).join(', ')||'keine';
const fields=s=>s.local.fields.map(f=>`S${f.hour}: ×${f.marks.cross.length}; `+
 (f.marks.check?'✓'+f.marks.check:'?{'+(f.marks.question.length<=3?f.marks.question.join(','):f.marks.question.length+' Felder')+'}')).join('; ')||'keine zusätzlichen Feldausschlüsse';
const section=s=>s.local.openSections.map(o=>`S${o.fromHour}–S${o.toHour}`+
 (o.leftAnchor?` (links S${o.leftAnchor.hour}=${o.leftAnchor.cell})`:'')+
 (o.rightAnchor?` (rechts S${o.rightAnchor.hour}=${o.rightAnchor.cell})`:'')).join('; ')||'keine';
const completeStates=r=>r?.status==='complete'?(r.states??[]).filter(s=>s.status==='complete'):[];
const completeSingleIntersection=r=>r?.status==='complete'&&r.singleIntersection?.status==='complete'?r.singleIntersection:null;
function routeAvailability(r){
 if(r?.status==='not-requested')return 'Für diesen Fall wurde keine zusätzliche Routenberechnung angefordert; mehrstündige Beziehungen bleiben ungeprüft.';
 const states=r?.states??[];
 if(r?.status==='complete'&&states.length&&states.every(s=>s.status==='complete'))
  return 'Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.';
 const status=s=>s.status==='unknown-state'?'unbekannt/nicht verfügbar':
  r?.status==='incomplete-budget'||s.status==='incomplete-budget'?'wegen Budget unvollständig':
  r?.status==='complete'&&s.status==='complete'?'vollständig berechnet':'unbekannt/nicht verfügbar';
 return (states.length?states.map(s=>`${s.state}: ${status(s)}`).join('; '):
  r?.status==='incomplete-budget'?'Routenberechnung wegen Budget unvollständig':'Routenberechnung unbekannt/nicht verfügbar')+
  '. Mehrstündige Beziehungen sind nur für vollständig berechnete Zustände geprüft.';
}

export function renderStageReport(diagnoses,routes){
 const second=completeStates(routes.find(r=>r.id==='S03-02')).find(s=>s.state==='H1+H4');
 const fifthRoutes=routes.find(r=>r.id==='S03-05'),fifth=completeStates(fifthRoutes).find(s=>s.state==='H2+H3');
 const fifthSingles=completeSingleIntersection(fifthRoutes);
 const overview=table(['Fall','Bekannt/möglich','Lokal fixe S aus Hinweisen (Vollsatz)','Lokal offen (Vollsatz)'],diagnoses.map(d=>{
  const full=d.states.find(s=>s.state===d.fullState);
  return [d.id,`${d.coverage.stateCount}/${d.coverage.totalSubsetCount}`,fixes(full,'local'),section(full)];
 }));
 const details=diagnoses.map(d=>{
  const selected=[...new Set([...(READINGS[d.id]??[]),d.fullState])].map(k=>d.states.find(s=>s.state===k));
  const rows=selected.filter(Boolean).map(s=>[source(s),fields(s),fixes(s,'exact'),section(s)]);
  const witnesses=d.alternativeLocalFixationWitnesses.map(w=>[`S${w.hour}=${w.cell}`,
   w.minimumClueCount??(w.minimumKnownClueCount===null?'unbekannt':`kleinster bekannter: ${w.minimumKnownClueCount}`),
   w.witnesses.map(v=>`${v.state} (${v.certificate.step})`).join('; ')||'kein lokaler Zeuge bekannt']);
  const r=routes.find(r=>r.id===d.id),rs=completeStates(r),intersection=completeSingleIntersection(r);
  const routeTable=rs.length?table(['Zustand','Lokal: Felder / +Kanten','Exakt unterstützt','Exakte Felder/Kanten rekombiniert'],
   rs.map(s=>[source(s),`${s.localFieldsOnly.routeCount} / ${s.localFieldsAndEdges.routeCount}`,
    s.exactSupported.routeCount,s.recombinedExactFieldsAndEdges.routeCount]))+'\n\n':'';
  // At most one small window per representation/state, in the fixed window order.
  // The display cap is not a quality threshold or a choice of human solving stage.
  const fragments=rs.flatMap(s=>[['localFieldsAndEdges','lokal kompatibel'],['exactSupported','exakt unterstützt']].flatMap(([key,label])=>{
   const part=s[key].sections.find(p=>p.alternatives.count>1&&p.alternatives.count<=4);
   return part?[[s.state,label,`S${part.fromHour}–S${part.toHour}`,
    part.alternatives.shown.map(v=>v.replaceAll('>','→')).join('; '),
    part.suffix.length?part.suffix.join('→'):'keines']]:[];
  }));
  const fragmentTable=fragments.length?table(['Zustand','Darstellung','Fenster','Vollständige kleine Teilroutenmenge','Gemeinsames Endstück'],fragments)+
   '\n\nLesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.\n\n':'';
  const singles=intersection?
   `Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **${intersection.localFieldsOnly.routeCount}** feldkompatible, `+
   `mit Nachbarkanten **${intersection.localFieldsAndEdges.routeCount}** legale Wege. Keine beobachtete menschliche Arbeitslast.\n\n`:
   r?.singleIntersection?.status==='unknown-missing-single-states'?
    `Schnitt aller gespeicherten Einzelhinweise: unbekannt/nicht verfügbar (${r.singleIntersection.missingStates.join(', ')}). Keine vollständige Zählung bestätigt.\n\n`:'';
  const reuse=selected.filter(Boolean).flatMap(s=>s.local.fields.flatMap(f=>f.witnesses.filter(w=>w.reusedBy.length)
   .map(w=>`${source(s)}: S${f.hour}, ${w.step} → ${w.reusedBy[0].step} (direkte Trace-Prämisse)`)));
  const gaps=rs.filter(s=>s.recombinationLoss.routeCount).map(s=>`${s.state}: ${s.recombinationLoss.routeCount} `+
   'rekombinierte Wege erfüllen die Hinweise nicht.').join(' ');
  return `## ${d.id} — ${d.puzzleId}\n\n`+
   table(['Bekannter Zustand','Lokale Feldmarkierungen gegenüber Basis','Exakt feste Stunden aus Hinweisen','Lokal offene Abschnitte'],rows)+'\n\n'+
   table(['Stundenposition','Minimale Hinweisanzahl / Kenntnisgrenze','Alternative ausreichende lokale Teilzeugen'],witnesses)+'\n\n'+
   `Fehlende Teilmengen: ${d.coverage.missingStates.join('; ')||'keine'}. `+
   'Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.\n\n'+
   (reuse.length?`Beispiel belegter Weiterverwendung: ${reuse[0]}. Weitere Nachfolger stehen pro Feldzeuge im JSON.\n\n`:'')+
   routeTable+fragmentTable+singles+(gaps?gaps+'\n\n':'')+
   `[Etappendaten](${d.id}.json) · [Begrenzte Routenansicht](${d.id}.routes.json). `+
   routeAvailability(r)+'\n\n';
 }).join('');
 return '# S04-A — beschreibende Etappendiagnose\n\n'+
  '**Enthält Lösungen. Keine Qualitätsrangliste, Schwierigkeitsskala oder menschliche Lösungsreihenfolge.**\n\n'+
  'H1 = Hinweis 1; S1 = Stunde 1; S0 = bekannte Startposition. Kleine Hinweiszusammenstellungen sind mögliche verfügbare Teilzeugen, kein zeitlich gemessener Einstieg. ' +
  'Alternative Teilzeugen stehen nebeneinander. Trace-Zertifikate sind ausreichende technische Beweiswege; menschliche Entdeckbarkeit und Unabhängigkeit sind ungeprüft.\n\n'+
  '[Menschliche Beobachtungen](../../../observations/README.md) sind eigenständige Evidenz. Die Zuordnung S03-01 bis S03-09 folgt der Tabelle im bereitgestellten Analysebericht, ' +
  'entsprechend der nach vollständiger Kennung sortierten Spieltestanzeige; sie folgt nicht der Reihenfolge des Auswahlregisters.\n\n'+
  overview+'\n\n'+
  '× = zusätzlicher lokaler Ausschluss, ? = lokal verbleibende Menge, ✓ = Singleton. Start, Vorgaben und hinweisfreie Folgen zählen nicht als Hinweisleistung. ' +
  'Lokale Möglichkeiten müssen zu keiner legalen Gesamtroute erweiterbar sein. Exakte Projektionen tragen keine lokalen Beweiszertifikate.\n\n'+
  'Die Routenansicht enumeriert je ausgewähltem Fall einmal mit höchstens 250.000 Knoten. Fehlende Zustände bleiben unbekannt; bei Budgetabbruch werden keine vollständigen Zählungen behauptet. ' +
  'Die drei festen Stundenintervalle sind Diagnosefenster, keine vorgeschriebenen menschlichen Etappen. Nicht untersuchte Beziehungen bleiben offen.\n\n'+
  details+
  '## Verpflichtende Gegenproben und Grenzen\n\n'+
  (second?`S03-02/H1+H4 reproduziert ${second.exactSupported.routeCount} exakt unterstützte gegenüber ${second.recombinedExactFieldsAndEdges.routeCount} aus exakten Feld-/Kantenprojektionen rekombinierten legalen Routen. `+
   `Die ${second.recombinationLoss.routeCount} zusätzlichen Wege enthalten ausschließlich einzeln exakt unterstützte Bestandteile und verletzen trotzdem Hinweise.\n\n`:
   'S03-02/H1+H4: kein vollständiger Routenvergleich verfügbar; numerische Reproduktion nicht bestätigt.\n\n')+
  (fifth?`S03-05/H2+H3 besitzt ${fifth.exactSupported.routeCount===8?'acht':fifth.exactSupported.routeCount} exakte Routen, während lokale Felder die Kombination nicht erklären. `:
   'S03-05/H2+H3: keine vollständige Routenzählung verfügbar. ')+
  (fifthSingles?`Der Schnitt aller Einzelhinweise lässt sogar ${fifthSingles.localFieldsOnly.routeCount} feldkompatible bzw. ${fifthSingles.localFieldsAndEdges.routeCount} kantenkompatible Wege. `:
   'Für den Schnitt aller Einzelhinweise ist keine vollständige Zählung bestätigt. ')+
  'Die menschliche positive, leichte Erfahrung verbietet es, solche Zahlen pauschal als Last oder Qualität auszulegen.\n\n'+
  'S03-08 hat bis zwei Hinweise keine lokale Stundenfixierung und wurde sehr positiv erlebt. ' +
  'H1+H2+H5 liefert einen lokalen S2-Zeugen; H2+H5+H6 einen anderen exakten Zeugen. Frühe Fixierungen werden nicht vorausgesetzt. ' +
  'Die beobachtete H4-Wiederverwendung ist nicht mit H4 allein gleichzusetzen.\n\n'+
  'A/B/C/D und V1/V2, T02/T07 einschließlich der künstlichen S3-Vorgabe bleiben Kontrollen. ' +
  'Ihre technischen Profile bestimmen keine nachgetragenen menschlichen Urteile. Die nachgelieferte Zehnerserie einschließlich Wiederholung und Kennungsabweichung ist in der Beobachtungssammlung erfasst.\n\n'+
  'Reproduktion: `npm run report:b2:stages -- --check`; bewusstes Erneuern nur mit `--write`. ' +
  '[Architektur, Format und Aussagegrenzen](../README.md).\n';
}

export function stageReportFiles(){
 const cases=readStageCases(),diagnoses=cases.map(buildStageDiagnosis),routes=cases.map(c=>buildRouteEvidence(c));
 return new Map([...diagnoses.map(d=>[d.id+'.json',JSON.stringify(d)+'\n']),
  ...routes.map(r=>[r.id+'.routes.json',JSON.stringify(r)+'\n']),['report.md',renderStageReport(diagnoses,routes)]]);
}
export function main(argv=process.argv.slice(2)){
 assert(argv.length<=1&&(!argv.length||['--write','--check'].includes(argv[0])),
  'Usage: report-b2-stages.mjs [--write|--check]');
 const files=stageReportFiles();
 if(!argv.length)return files.get('report.md');
 if(argv[0]==='--write')fs.mkdirSync(path.join(ROOT,OUTPUT),{recursive:true});
 for(const [name,bytes] of files){
  if(argv[0]==='--write')fs.writeFileSync(path.join(ROOT,OUTPUT,name),bytes);
  else assert.equal(fs.readFileSync(path.join(ROOT,OUTPUT,name),'utf8'),bytes,'Stage report changed: '+name);
 }
 return `S04-A: ${files.size} files ${argv[0]==='--write'?'written':'reproduced byte-for-byte'}.`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
