import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT} from './lib/b2-playtest.mjs';
import {buildDeductionReport} from './lib/b2-deduction.mjs';

export const OUTPUT='docs/verification/B2-deduction';
const sum=arrays=>arrays.reduce((n,a)=>n+a.length,0);
const counts=arrays=>arrays.map(a=>a.length).join('/');
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',
 ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');

export function renderSummary(report){
 const [t02,t07,control]=report.cases;
 const all=c=>c.analysis.scenarios.at(-1);
 const comparison=table(['Fall','Legale Routen','Lösungen, alle Hinweise','Lokal mögliche Felder H1–H6','Lokal bestimmte Stunden','Lücke Felder / Übergänge'],
  report.cases.map(c=>{const s=all(c);return [c===control?'T07 + Stunde 3':c===t02?'T02':'T07',c.analysis.legal.routeCount,s.exact.routeCount,
   counts(s.local.domains.slice(1)),s.local.fixedHours.filter(p=>p.hour).map(p=>p.hour).join(', '),`${s.gap.fieldCount} / ${s.gap.transitionCount}`];}));
 return `# B2: Machbarkeitsprototyp der Deduktionsdiagnostik

Die Diagnose erkennt den frühen lokalen Fortschritt von T07 und dessen anschließenden Stillstand. T02 bleibt schon am Anfang breiter offen. Die zusätzliche Vorgabe von Stunde 3 verkleinert T07s Rest, löst ihn lokal aber nicht. **Der gewünschte Vergleich mit einer befriedigenderen Referenz bleibt technisch offen:** „Die Quittung von Nombreo“ liegt nur in einem inkompatiblen historischen Modell vor. Dies ist kein Qualitätsranking und keine Schwierigkeitsskala.

## Datenquellen und Reproduktion

Ausgangspunkt: ${report.baseline}. Offline, Node ≥22, keine Zusatzpakete, kein Generatorlauf:

\`\`\`sh
npm run report:b2:deduction
npm run report:b2:deduction -- --check
node --test tests/engine/b2-deduction.test.mjs tests/contracts/b2-deduction.test.mjs
\`\`\`

Ohne Option erscheint dieser Bericht auf stdout; \`--write\` erzeugt die fest benannten Dateien in diesem Verzeichnis. \`--check\` vergleicht sämtliche Dateien bytegenau. Die Laufzeit beträgt in dieser Umgebung wenige Sekunden. Zeitstempel, absolute Pfade und Laufzeitmessungen sind keine Berichtsinhalte.

T02: \`${t02.id}\`; T07: \`${t07.id}\`. Quelle: \`scripts/config/b2-playtest-bc.json\` und dessen unveränderter Kandidatenstrom unter \`docs/verification/B2-search-comparison/candidates.jsonl\`. Der vorhandene Adapter prüft Registry-, Manifest-, Kandidaten- und Inhaltsbindungen. \`sources.json\` enthält vollständige IDs, SHA-256 und die verwendete Logik. Gespeicherte Zielrouten und Suchmetriken werden nicht an die Diagnose übergeben.

## Methodik und Grenzen

Ebene A verwendet \`createRules().routes()\` und \`matches()\` unverändert: alle legalen Routen (Start, Befahrbarkeit, Nachbarschaft, kein Wiederbesuch), alle Einzelhinweise, sämtliche Paare und Tripel. Zusätzlich gibt es je Fall **einen ausdrücklich bezeichneten Kontrollzustand mit allen Hinweisen**; keine sonstigen Vierer- bis Sechserkombinationen. Das Suchbudget von 250.000 Knoten schlägt bei Überschreitung fehl, statt eine abgeschlossene Analyse vorzutäuschen. Die vollständige Hinweismenge wird zusätzlich mit \`solvePuzzle()\` verglichen; die Tests prüfen auch jeden Teilzustand.

Eine Routenprojektion enthält für Stunde 0–6 die möglichen Felder und für jeden Schritt 0→1 bis 5→6 die möglichen gerichteten Übergänge. Ausgeschlossene Einträge sind die Differenz zum legalen Ausgangsraum. Ein Singleton ist eindeutig, eine leere Menge widersprüchlich, eine größere Menge unbestimmt. „Möglich“ in Ebene B bedeutet nur **noch nicht lokal ausgeschlossen**, keine bewiesene Erweiterbarkeit zu einer Route. Selbst der lokale Zustand ohne Hinweise ist bei T02 um vier Feld-Stunden-Möglichkeiten und 25 Übergänge schwächer als die exakte Legalitätsanalyse; bei T07 fehlen fünf Übergangsausschlüsse. Diese Grundlücken sind in der Gesamtlücke enthalten.

Ebene B startet unabhängig mit allen befahrbaren Feldern und Nachbarschaftskanten. Sie erhält weder legale Routen noch Projektionen oder Zielroute. Implementiert sind:

- Start und ausdrücklich getrennte experimentelle Vorgaben; Singleton-Felder sperren Wiederbesuche in allen anderen Stunden.
- Vorgänger-/Nachfolgerstützung und Entfernung von Kanten ohne mögliche Endpunkte bis zum Fixpunkt.
- Direkte Position und Mindestdistanz zu einem Ort in einer Stunde.
- Kurs auf einer Kante; Drehung auf **nur zwei verbundenen Kanten**, ohne vollständige Route.
- Abstand zwischen zwei Stunden als geometrische Paarstützung, ohne Wege dazwischen zu testen.
- Zählgrenzen pro Intervall: sichere Treffer liefern eine Untergrenze, Stunden mit möglichen Treffern eine Obergrenze. Ist das Ziel bereits erreicht, entfallen weitere Treffer; entspricht es der Obergrenze, müssen alle noch möglichen Trefferstunden treffen. Eine unentscheidbare Zählbedingung bleibt offen.

Keine allgemeine Routenprüfung, kein Widerspruchsversuch ganzer Routen, keine globale Wiederbesuchssuche und keine algebraische Kombination mehrerer Zählgleichungen. Alle sechs aktuellen Hinweistypen besitzen eine lokale Regel, aber deren Konsistenz ist unvollständig. Unbekannte lokale Typen werden ausdrücklich gemeldet; die exakte Ebene verweigert ungültige aktuelle Logik. Die historische Referenz wird auf Dokumentebene als nicht unterstützt gekennzeichnet, statt als Rätsel ohne Fortschritt gezählt zu werden.

Jeder lokale Schritt nennt Regel, Stunde/Kante, entfernte Felder/Übergänge, direkte Hinweis-IDs und frühere Begründungs-IDs. Die IDs bilden einen gerichteten Begründungsgraphen. Voraussetzungen des Karten- und Bewegungsmodells gelten zusätzlich immer. Die Reihenfolge ist deterministisch (Karte, Hinweise, Regelrunden); Runden sind **keine** menschliche Zeit- oder Schwierigkeitsmessung. Die monotone Ausführung wird für jeden Teilzustand gegen seinen vollständigen Lösungsraum auf korrekte Ausschlüsse geprüft. Fehlende lokale Erklärungen bleiben als Mengenlücke sichtbar.

## Vergleich

${comparison}

Die Lücke zählt Feld-Stunden-Paare bzw. gerichtete Übergänge, die lokal verbleiben, obwohl sie exakt unmöglich sind (einschließlich der Legalitätsgrundlücke). Sie misst weder Klicks noch logische Schwierigkeit. Alle vollen Hinweissätze bestimmen mathematisch jede Stunde und jeden Übergang, während lokale Regeln bei beiden Originalfällen stehen bleiben.

## Konkrete Schlussketten und Kombinationswirkung

**T02, H1/H4:** H1 verbietet in Stunde 2 und 3 alle Felder im Abstand 1 zum Startort A4. H4 verlangt in Stunde 2 Kurs NE. Nach Start, Nachbarschaft und diesen Einschränkungen bleiben genau die drei ersten Übergangspaare A4→A3→A2, A4→B3→B2 und A4→B4→C3. Die lokalen Fixpunktmengen des vollen Satzes lauten am Anfang {A3,B3,B4} und {A2,B2,C3}; kein Feld und kein Übergang in Stunde 1–6 wird lokal eindeutig. Die aggregierten H2/H3 können mit den implementierten Zählgrenzen danach keinen weiteren Schritt begründen. Paarabstände H5/H6 schränken zwar geometrische Möglichkeiten ein, schließen die Kette aber nicht. Das passt zu den beschriebenen drei Anfangsmöglichkeiten und der berichteten mentalen Prüfung ganzer Routen; es beweist keine menschliche Notwendigkeit dafür.

**T07, H4→H5→Nachbarschaft:** Start D4 liegt nicht im Abstand 3 zum gesperrten Ort A1. Auch keines der unmittelbar erreichbaren Felder in Stunde 1 erfüllt diese Eigenschaft. H4 fordert genau einen Treffer in Stunde 0–2; also muss Stunde 2 treffen. Lokal bleiben dort {C2,C3,B4}. H5 fordert in Stunde 2 Abstand 3 zu A4; die Schnittmenge ist {C2}. Unter den erreichbaren Vorgängern bleibt D3 als Stunde 1. Im vollständigen lokalen Protokoll sind dies D20→D21→D28→D29; D43 fixiert den ersten Übergang. Erst **H4+H5** bestimmt diese beiden Stunden exakt; kein Einzelhinweis tut dies. Stunde 3 bleibt {B2,C1,C3}; Stunde 4–6 bleiben 4/5/8 Möglichkeiten. H7 reduziert über zwei Kanten die späteren Übergänge, ohne die Restkette zu schließen.

Die Einzel-/Paar-/Tripeltabellen stehen in [T02](T02.md), [T07](T07.md) und [T07 mit Vorgabe](T07-given-3.md). \`combinationOnly\` benennt exakt jene Ausschlüsse, die **kein** echter Teilhinweissatz bereits liefert. So wird zusätzliche Routenreduktion nicht mit neuen sichtbaren Konsequenzen verwechselt. Kombinationen dürfen auf späte Stunden wirken; eine lineare Reihenfolge wird nicht verlangt.

## Kontrollversuch: T07 mit Stunde 3 = C1

Die Vorgabe wird aus der unabhängig berechneten eindeutigen Lösung entnommen, nicht aus dem gespeicherten Zielroutenfeld. Sie wird separat übergeben und verändert die Originaldefinition nicht. Mit allen Hinweisen bleibt die exakte Lösung unverändert. Lokal bleiben Stunde 4 {B1,B2}, Stunde 5 {A2,C3} und Stunde 6 {A3,B1,B2,B4}. Die Übergänge 4→5 sind B1→A2 oder B2→C3; diese Zuordnung ist mehr Information als zwei unabhängige Feldmengen.

Die Lücke sinkt von ${all(t07).gap.fieldCount} auf ${all(control).gap.fieldCount} Feld-Stunden-Paare und von ${all(t07).gap.transitionCount} auf ${all(control).gap.transitionCount} Übergänge. **Ein problematischer Rest bleibt unter diesem Regelapparat bestehen.** Bereits die exakte Kombination H6+H7 legt mit der Vorgabe Stunde 4 und 5 fest; H3+H6+H7 legt zusätzlich Stunde 6 fest. Die lokalen Regeln erklären diese Festlegungen nicht. Das lokal offene Feld B1 in Stunde 6 zeigt auch die begrenzte Wiederbesuchsweitergabe: B1 ist für Stunde 4 noch nicht gesichert. Eine zusätzliche Beziehung zwischen Drehung, Zählung und Besuchsverbot fehlt. Das ist vereinbar mit der menschlichen Beobachtung nach vorgegebener Stunde 3; es ist keine vorausgesetzte Bestätigung oder Aussage über alle menschlichen Lösungswege.

## Grenze der Referenz „Quittung von Nombreo“

Die tatsächliche Originaldefinition stammt aus \`${report.reference.source.gitCommit}:puzzles/quittung-nombreo.json\`, Git-Blob \`${report.reference.source.gitBlob}\`. Eine byteidentische Kopie liegt ausschließlich als Offline-Beleg unter \`${report.reference.source.path}\`, SHA-256 \`${report.reference.source.sha256}\`. Damit ist die Prüfung auch ohne Git-Historie oder Netzwerk reproduzierbar. Die Entfernung ist in \`docs/CONSOLIDATION-F01-F03.md\` dokumentiert.

Schema 1 verwendet \`grid/blocked/places\`, \`place\` statt \`placeId\` und \`countAdjacentToPlace\`; der aktuelle Solver erwartet \`logic.map\`, abstrakte Objekte und \`countDistanceToPlace\`. Zusätzlich änderte sich die Ortsdistanzsemantik von existenzieller Distanz zu Mindestdistanz. Das bloße Umbenennen wäre daher keine zulässige Kompatibilitätsprüfung. Die aktuelle Validierung weist die Originaldefinition zurück; die Fehler stehen in \`sources.json\`. **Kein Routenraum, keine lokalen Ergebnisse und kein Ersatzrätsel für C werden behauptet.** Die historische Dokumentation nennt 521 legale Routen und eine Lösung; das sind alte Prüfwerte, keine mit diesem Prototyp erhobenen Ergebnisse. Ein positiver Referenzvergleich ist damit nicht beantwortet.

## Logik, Kartenmarkierungen und Oberfläche

Ein Zählgrenzenschluss kann logisch kurz sein und dennoch viele Ausschlüsse auf mehreren Stundenkarten erzeugen. Unsere Differenzmengen zählen fachliche Markierungen; ein Schritt kann zugleich mehrere Felder entfernen. Weder die Anzahl der Protokollzeilen noch die Zahl der entfernten Felder ist eine Schwierigkeitsnote.

Die bestehende UI (\`src/state/game-state.mjs\`, \`src/ui/game.mjs\`, \`src/ui/map.mjs\`) kennt getrennte Stundenmarkierungen „?“, „×“, „✓“, Stundenansicht/Gesamtansicht, Routenzeichnung, Undo und Distanzwerkzeug. Sie speichert keine alternativen Übergangsmengen oder maschinellen Begründungsgraphen. Flächige Ausschlüsse erfordern entsprechende Markierarbeit und Stundenwechsel; gekoppelte Möglichkeiten wie B1→A2 versus B2→C3 lassen sich durch unabhängige Stundenmarkierungen nur teilweise darstellen. Diese Codebefunde ersetzen keinen neuen Bedienbarkeitstest. Keine UI-Änderung, kein Export der Diagnose und keine zusätzliche Zielroute im Browser-Spieltest.

## Fachliche Folgerung

Beantwortet sind die exakten Feld-/Übergangskonsequenzen aller Einzelhinweise, Paare und Tripel der zwei aktuellen Fälle, deren zusätzliche Kombinationswirkung, die Grenzen eines expliziten lokalen Regelapparats sowie der T07-Kontrollversuch. Der Ansatz unterscheidet bei T02 und T07 konkrete Anfangs- und Restketten, die reine Lösungszahlen verdecken.

Offen bleibt, ob diese Signale befriedigende von unbefriedigenden Rätseln unterscheiden: Die positivere Referenz kann nicht ausgewertet werden, und zwei problematische Beispiele validieren keine Kandidatenauswahl. Ein sinnvoller nächster fachlicher Versuch wäre eine ausdrücklich freigegebene aktuelle positive Referenz sowie ein kleiner Vergleich dokumentierter menschlicher Schlüsse mit den Begründungsgraphen. Technisch erscheint begrenzte Weiterentwicklung sinnvoll; vor einer automatischen Auswahl muss sich zeigen, ob fehlende lokale Regeln oder tatsächliche Denkhürden die Lücken verursachen. Kein Anlass für Generatorumbau oder allgemeine Qualitätsnoten aus diesem Ergebnis.
`;
}

function renderCase(c,label){
 const a=c.analysis,s=a.scenarios.at(-1);
 return `# ${label}: Details\n\n\`${c.id}\`. Vorgaben: ${JSON.stringify(a.givens)}.\n\n`+
  `Feldmengen und Übergänge des legalen Raums sowie jeder Szenarioprojektion stehen in \`${label}.jsonl\`. Indizes: Felder Stunde 0–6, Übergänge Ankunftsstunde 1–6. \`A>B\` bezeichnet eine gerichtete Kante. Leere Mengen sind widersprüchlich, Singletons fest, größere Mengen unbekannt. Ausschlüsse beziehen sich auf die legale Basis, nicht alle Kartenfelder.\n\n`+
  `Exakte Basismöglichkeiten Stunde 1–6: ${counts(a.legal.domains.slice(1))}; Übergänge: ${counts(a.legal.transitions)}.\n\n`+
  `## Einzelhinweise, Paare und Tripel\n\n`+
  table(['Hinweise','Routen','Exakte Felder 1–6','Exakte Übergänge','Neue Kombinationsausschlüsse Felder/Kanten'],a.scenarios.map(row=>[
   row.clueIds.join('+')||'keine',row.exact.routeCount,counts(row.exact.domains.slice(1)),counts(row.exact.transitions),
   row.combinationOnly?sum(row.combinationOnly.excludedFields)+'/'+sum(row.combinationOnly.excludedTransitions):'—']))+
  '\n\nDie letzte Zeile ist der gesonderte Kontrollzustand mit allen Hinweisen. Neue Kombinationsausschlüsse fehlen in jedem echten Teilhinweissatz; „—“ bedeutet nicht untersucht/kein Paar oder Tripel.\n\n'+
  '## Lokaler Fixpunkt mit allen Hinweisen\n\n'+
  table(['Stunde','Mögliche Felder','Zuerst eindeutig (Regelrunde/Schritt)'],s.local.domains.map((d,h)=>{
   const first=s.local.trace.find(t=>t.kind==='field'&&t.hour===h&&t.fixed);
   return [h,d.join(', ')||'Widerspruch',first?first.round+'/'+first.id:'offen'];}))+
  '\n\n'+table(['Ankunftsstunde','Mögliche Übergänge'],s.local.transitions.map((d,i)=>[i+1,d.join(', ')]))+
  '\n\n## Lokale Schlusskette (alle Hinweise)\n\n'+
  'Vollständige entfernte Feld-/Kantenmengen und Erklärungen je Schritt stehen im JSONL auch für alle Teilhinweissätze. Die ausführbare API enthält zusätzlich Vorher-/Nachhermengen. Premissen verweisen ausschließlich auf frühere Schritte desselben Szenarios.\n\n'+
  table(['Schritt','Runde','Regel','Art/Stunde','Entfernt','Fest','Hinweise','Premissen'],s.local.trace.map(t=>[
   t.id,t.round,t.rule,t.kind+'/'+t.hour,t.removed.length,t.fixed??'—',t.clueIds.join(', '),t.premises.join(', ')]))+'\n';
}

export function reportFiles(report=buildDeductionReport()){
 const labels=['T02','T07','T07-given-3'],files=new Map();
 files.set('report.md',renderSummary(report));
 files.set('sources.json',JSON.stringify({format:report.format,maxCombinedClues:report.maxCombinedClues,fullClueControl:report.fullClueControl,
  baseline:report.baseline,cases:report.cases.map(({analysis,...c})=>({...c,givens:analysis.givens,legal:analysis.legal,
   baselineLocal:{domains:analysis.baselineLocal.domains,transitions:analysis.baselineLocal.transitions},validation:analysis.validation})),reference:report.reference},null,2)+'\n');
 report.cases.forEach((c,i)=>{
  files.set(labels[i]+'.md',renderCase(c,labels[i]));
  // Compact but complete proofs: before/after can be reconstructed from initial
  // passable domains/adjacency and monotonically removed entries. No trace lost.
  files.set(labels[i]+'.jsonl',c.analysis.scenarios.map(s=>JSON.stringify({...s,
   local:{...s.local,trace:s.local.trace.map(({before,after,...t})=>t)}})).join('\n')+'\n');
 });
 return files;
}

export function main(argv=process.argv.slice(2)){
 if(argv.length>1||argv.some(a=>!['--write','--check'].includes(a)))throw Error('Aufruf: node scripts/report-b2-deduction.mjs [--write|--check]');
 const files=reportFiles();
 if(!argv.length){process.stdout.write(files.get('report.md'));return;}
 const output=path.join(ROOT,OUTPUT);
 if(argv[0]==='--write')fs.mkdirSync(output,{recursive:true});
 for(const [name,content] of files){
  const target=path.join(output,name);
  if(argv[0]==='--write')fs.writeFileSync(target,content);
  else if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==content)throw Error('Bericht nicht reproduzierbar: '+name);
 }
 process.stdout.write(`${files.size} Berichtsdateien ${argv[0]==='--write'?'geschrieben':'bytegenau geprüft'}.\n`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
