// Read-only report over the fixed selection. No generator or search imports.
import fs,{realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,readPlaytestSource,validatePlaytestBindings} from './lib/b2-playtest.mjs';
import {cluePresentationForm,clueStatistics} from './lib/clue-presentation.mjs';

export const REPORT='docs/verification/B2-BC.md';
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',
 ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
const types=clues=>Object.entries(clueStatistics(clues).byType).map(([type,n])=>`${n} × ${type}`).join(', ');
const neverCount=clues=>clues.filter(c=>c.type==='countDistanceToPlace'&&c.count===0&&c.fromHour<c.toHour).length;
const hours=c=>c.hours?.join('/')??(c.hour!==undefined?String(c.hour):`${c.fromHour}–${c.toHour}`);

export function selectionReport(source=readPlaytestSource('BC')){
 const byVariant=validatePlaytestBindings(source),{registry}=source;
 const entries=[...registry.entries].sort((a,b)=>a.testName.localeCompare(b.testName));
 const original=fs.readFileSync(path.join(ROOT,registry.source,'candidates.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 const lines=['# B2-BC: acht gespeicherte Varianten für qualitative Browser-Spieltests','',
  'Reproduzierbare redaktionelle Auswahl aus den 167 Kandidaten von PR #101. Keine Nachgenerierung, Änderung oder Umordnung der ursprünglichen Hinweise. '+
  'Die Kriterien sind vorläufige Testhypothesen; weder Länge noch Routenzahlen beweisen spielerische Qualität. Keine neue Qualitätsmetrik oder Schwierigkeitseinstufung.','',
  '## Bindung und Kriterien','',
  `Quelle: [Suchvergleich](B2-search-comparison.md), Registry: [b2-playtest-bc.json](../../scripts/config/b2-playtest-bc.json).`,
  `Experiment: \`${registry.experimentId}\`.`,
  `Manifest SHA-256: \`${registry.manifestSha256}\`.`,
  `Kandidatenstrom SHA-256: \`${registry.candidatesSha256}\` (${registry.sourceCandidateCount} unveränderte Zeilen).`,'',
  ...registry.selection.criteria.map(c=>'- '+c),'',
  'Die Registry fixiert jede vollständige Kandidaten-ID, Fingerprints, Wirkungsschlüssel, Inhalts- und Datensatzhash, Begründung und hervorgehobene Paare. '+
  'Die acht Einträge sind die vollständige Auswahl; es gibt keine Rangliste, automatische Nachfüllung oder erneute Suche. '+
  'Reproduktion des Berichts: `node scripts/report-b2-bc-playtest.mjs`; Bytevergleich: `node scripts/report-b2-bc-playtest.mjs --check`.','',
  '## Verfügbare Alternativen und Zielkonflikte','',
  table(['Quellziel (Zielroutenreferenz, keine Zellenfolge)','B: 5–7, ohne einzeln exakte Stunde 1','C: 5–7, ohne einzeln exakte Stunde 1'],
   [...new Set(entries.map(e=>e.sourceTarget))].sort().map(target=>[target,...['B','C'].map(arm=>original.filter(r=>
    r.sourceTarget===target&&r.attemptId.split('/')[1]===arm&&r.definition.logic.clues.length>=5&&
    r.definition.logic.clues.length<=7&&!r.properties.hasIndividuallyExactHour1).length)])),'',
  'Es gibt nur vier gespeicherte Karten-/Start-/Zielinstanzen, je eine Zielroute mit Routenindex 0. Acht verschiedene Zielrouten sind damit unmöglich. '+
  'Je ein B/C-Paar pro Instanz nutzt die maximale vorhandene Kartenvielfalt und erlaubt den qualitativen Vergleich auf gleicher Geometrie. '+
  'Die V-Kennung der Quellreferenz benennt die ursprüngliche S02-Variante, nicht die neue Vergleichsvariante. '+
  'Wiederholtes Spielen derselben Route durch dieselbe Person ist für diese Entwicklungsarbeit sinnvoll; Erinnerung und Lernen verhindern einen unverzerrten statistischen Strategievergleich.','',
  'Nicht allein die längsten Sätze wurden bevorzugt: zwei Fünfer-, vier Sechser- und zwei Siebener-Sätze. '+
  'Alle acht enthalten mehrere logische Typen; kein Einzelhinweis bestimmt eine Position in den Stunden 1–6 exakt. '+
  'Zählhinweise dominieren weiterhin. Die früher vorgeschlagenen C-Varianten `1bc4f128…` (M017, nur Zähltyp, zwei flächige Ausschlüsse) und '+
  '`63bc61f3…` (M013, nur Zähltyp, vier flächige Ausschlüsse) wurden zugunsten gemischter Typen ersetzt; `501a55f3…` bleibt enthalten. '+
  'Einige punktuelle und drei flächige Ausschlüsse im Gesamtbestand bleiben bewusst als beobachtbare Arbeit erhalten. Dies ist keine Aussage über gute oder schlechte Hinweisformen.','',
  '## Übersicht','',
  table(['Testkennung','Arm','Karte / Start / Route','Hinweise / logische Typen','Flächige Niemals-Hinweise'],entries.map(e=>{
   const row=byVariant.get(e.fingerprints.variant),clues=row.definition.logic.clues;
   return [e.testName,e.arm,e.sourceTarget.match(/M\d{3}-[A-E][1-5]-R\d+/)[0],`${clues.length}: ${types(clues)}`,neverCount(clues)];
  })),'',
  '## Einzel- und Paarwirkungen','',
  'Rest = Zahl legaler Routen, die den Einzelhinweis bzw. beide Hinweise erfüllen. Ausschluss = Anteil am legalen Grundraum, auf eine Nachkommastelle gerundet. '+
  'Die Zahlen werden aus den gespeicherten Diagnosen übernommen; sie messen keine menschlichen Denkschritte. '+
  'Stunden nennen die Parameter des Hinweises, keine Positionen. „Exakt“ in der letzten Spalte meint eine durch den Einzelhinweis festgelegte Position in Stunden 1–6; Stunde 0 ist der vorgegebene Start. '+
  'Auch Kurse und Drehungen verwenden die üblichen benachbarten Stunden. Alle Hinweise bleiben in ursprünglicher kanonischer Reihenfolge; diese ist kein menschlicher Lösungsweg.',''];
 for(const entry of entries){
  const row=byVariant.get(entry.fingerprints.variant),clues=row.definition.logic.clues;
  lines.push(`### ${entry.testName}`,'',`Vollständige Kandidatenidentität: \`${row.candidateId}\`.`,
   `Arm **${entry.arm}**, Quellziel/Zielroutenreferenz \`${row.sourceTarget}\`, Start **${row.definition.logic.start}**, legaler Grundraum **${row.proof.legalRouteCount}**.`,
   `Kartenfingerprint: \`${row.fingerprints.mapStructure}\`.`,
   `Instanzfingerprint: \`${row.fingerprints.instance}\`.`,
   `Hinweise: **${clues.length}**; ${types(clues)}.`,'',
   table(['Hinweis','Logischer Typ / Darstellungsform','Stunden','Rest','Ausschluss','Einzeln exakte Stunden'],clues.map(c=>{
    const single=row.diagnosis.singleCounts.find(s=>s.clueId===c.id);
    const exact=row.properties.individualExactness.find(s=>s.clueId===c.id).hours;
    return [c.id,`${c.type} / ${cluePresentationForm(c)}`,hours(c),single.count,`${(single.eliminatedFraction*100).toFixed(1)} %`,exact.join(', ')||'keine'];
   })),'','Auffällige gespeicherte Paare:','',...entry.highlightPairs.map(ids=>{
    const pair=row.diagnosis.pairCounts.find(p=>p.clueIds.join('/')===ids.join('/'));
    const singles=ids.map(id=>row.diagnosis.singleCounts.find(s=>s.clueId===id).count);
    return `- ${ids.join(' + ')}: einzeln ${singles.join(' / ')} → gemeinsam **${pair.count}** verbleibende Routen.`;
   }),'',`Aufnahme: ${entry.rationale}`,'');
 }
 lines.push('## Spielen und Beobachten','',
  '[Export, Navigation und manuelles Uberspace-Deployment](../B2-PLAYTEST.md#bc-acht-varianten-aus-dem-suchvergleich). '+
  '[Validierungsnachweis](B2-BC-validation.md). Der Bericht enthält weder Zielzellenfolge noch Lösung. '+
  'Die private Originaldatei und `inspect:b2` enthalten dagegen Lösungen und gehören nicht zur Spieltestauslieferung.','',
  'Beim Spielen Testkennung, beobachtete Teilschlüsse, hilfreiche Kombinationen, mentale Routenprüfung, Ausschlussaufwand und mögliche Erinnerung notieren. '+
  'S02 kann separat als bisheriger Vergleichsbestand geöffnet werden. Keine Telemetrie oder automatische Auswertung.','');
 return lines.join('\n');
}
if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
 try{
  const args=process.argv.slice(2);
  if(args.length&&!(args.length===1&&args[0]==='--check'))throw Error('Usage: report-b2-bc-playtest.mjs [--check]');
  const report=selectionReport();
  if(args[0]==='--check'){
   if(fs.readFileSync(path.join(ROOT,REPORT),'utf8')!==report)throw Error('B2-BC selection report differs');
   console.log('B2-BC selection report matches stored candidates and registry.');
  }else process.stdout.write(report);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
