// Composition of stored clue occurrences only. No generation, scoring or selection.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readPlaytestSource,validatePlaytestBindings} from './b2-playtest.mjs';
import {clueStatistics,cluePresentationForm} from './clue-presentation.mjs';
import {sha256} from './content-hash.mjs';
import {logicSchema} from '../../src/puzzles/schema.mjs';

const types=new Set(logicSchema.properties.clues.items.oneOf.map(s=>s.properties.type.const));
const sum=values=>values.reduce((a,b)=>a+b,0);
const sorted=record=>Object.fromEntries(Object.entries(record).sort(([a],[b])=>a<b?-1:a>b?1:0));
const assert=(ok,message)=>{if(!ok)throw Error('B2 clue report: '+message);};

export function clueComposition(clues){
 for(const clue of clues)assert(types.has(clue.type),'unknown logical clue type: '+clue.type);
 const statistics=clueStatistics(clues),byType=sorted(statistics.byType),byPresentationForm=sorted(statistics.byPresentationForm);
 const forms=Object.keys(byPresentationForm),counts=Object.fromEntries(Object.keys(byType).map(type=>[
  type,Object.fromEntries(forms.map(form=>[form,0]))]));
 for(const clue of clues)counts[clue.type][cluePresentationForm(clue)]++;
 const rowTotals=Object.fromEntries(Object.entries(counts).map(([type,row])=>[type,sum(Object.values(row))]));
 const columnTotals=Object.fromEntries(forms.map(form=>[form,sum(Object.values(counts).map(row=>row[form]))]));
 const total=sum(Object.values(rowTotals));
 assert(total===clues.length&&sum(Object.values(byType))===total&&sum(Object.values(byPresentationForm))===total,'inconsistent totals');
 for(const type of Object.keys(byType))assert(rowTotals[type]===byType[type],'inconsistent row: '+type);
 for(const form of forms)assert(columnTotals[form]===byPresentationForm[form],'inconsistent column: '+form);
 const percent=record=>Object.fromEntries(Object.entries(record).map(([key,n])=>[key,total?Math.round(n*10000/total)/100:0]));
 return {totalClues:total,byType,byPresentationForm,percentByType:percent(byType),percentByPresentationForm:percent(byPresentationForm),
  crossTable:{types:Object.keys(byType),forms,counts,rowTotals,columnTotals,total}};
}

// Stored candidate.properties lists contain distinct forms, never occurrences.
export function buildClueReport(source,{manifestSha256,candidatesSha256,implementation}){
 const {registry,manifest,rows}=source;
 const byVariant=validatePlaytestBindings(source),occurrences=[];
 for(const entry of [...registry.entries].sort((a,b)=>a.testName<b.testName?-1:a.testName>b.testName?1:0)){
  const row=byVariant.get(entry.fingerprints.variant);
  for(const clue of [...row.definition.logic.clues].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0))
   occurrences.push({testName:entry.testName,clueId:clue.id,logicalType:clue.type,presentationForm:cluePresentationForm(clue)});
 }
 return {reportFormatVersion:1,stockId:registry.stockId,experimentId:manifest.experimentId,
  source:{manifestSha256,candidatesSha256},generationProgram:manifest.program,
  analysis:{method:'stored-clue-composition-1',presentationAssignment:'deterministic-derived',implementation},
  candidateCount:rows.length,...clueComposition(rows.flatMap(row=>row.definition.logic.clues)),occurrences};
}

export function playtestClueReport(stock='S01'){
 const source=readPlaytestSource(stock),base=path.join(ROOT,source.registry.source);
 // Exact implementation hashes avoid a self-reference to a future report commit.
 const files=['scripts/lib/b2-diagnostics.mjs','scripts/lib/b2-playtest.mjs','scripts/lib/clue-presentation.mjs',
  'scripts/lib/clue-text.mjs','scripts/lib/content-hash.mjs','src/puzzles/schema.mjs'];
 return buildClueReport(source,{manifestSha256:sha256(fs.readFileSync(path.join(base,'manifest.json'))),
  candidatesSha256:sha256(fs.readFileSync(path.join(base,'candidates.jsonl'))),
  implementation:files.map(ref=>({path:ref,sha256:sha256(fs.readFileSync(path.join(ROOT,ref)))}))});
}

export function renderClueReport(report){
 const {crossTable:t}=report;
 const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',
  ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
 return `# ${report.stockId}: Zusammensetzung gespeicherter Hinweise\n\n`+
  `Experiment: \`${report.experimentId}\`. ${report.candidateCount} Kandidaten, **${report.totalClues} gespeicherte Hinweise**.\n\n`+
  `Grundlage: vollständiger Kandidatenstrom, SHA-256 \`${report.source.candidatesSha256}\`; Manifest SHA-256 \`${report.source.manifestSha256}\`.\n\n`+
  `Generierung: Commit \`${report.generationProgram.commit}\`, Node \`${report.generationProgram.nodeVersion}\`. Die exakten Quellhashes der Auswertung stehen in \`clue-report.json\` unter \`analysis.implementation\`.\n\n`+
  `Jedes Vorkommen in einem gespeicherten Kandidaten zählt einmal. Identische Hinweise in verschiedenen Kandidaten zählen jeweils erneut. Wahre Hinweispools und verworfene Suchergänzungen gehören nicht zu dieser Population. Prozentwerte beziehen sich auf alle ${report.totalClues} Hinweise und sind auf zwei Nachkommastellen gerundet.\n\n`+
  `## Logische Hinweistypen\n\n`+
  table(['Engine-Kennung','Anzahl','Anteil (%)'],Object.entries(report.byType).map(([key,n])=>['`'+key+'`',n,report.percentByType[key]]))+'\n\n'+
  `## Darstellungsformen\n\n`+
  table(['Darstellungskennung','Anzahl','Anteil (%)'],Object.entries(report.byPresentationForm).map(([key,n])=>['`'+key+'`',n,report.percentByPresentationForm[key]]))+'\n\n'+
  `## Logischer Typ × Darstellungsform\n\n`+
  table(['Logischer Typ',...t.forms.map(f=>'`'+f+'`'),'Summe'],[
   ...t.types.map(type=>['`'+type+'`',...t.forms.map(form=>t.counts[type][form]),t.rowTotals[type]]),
   ['Summe',...t.forms.map(form=>t.columnTotals[form]),t.total]])+'\n\n'+
  `Alle Zeilensummen stimmen mit den logischen Häufigkeiten, alle Spaltensummen mit den Formhäufigkeiten überein. Beide Randverteilungen und die Kreuztabelle summieren sich auf **${report.totalClues}**. Rundungen der Prozentwerte sind keine zusätzlichen Zählungen.\n\n`+
  `## Bindung der Darstellung und Nachvollziehbarkeit\n\n`+
  `Der logische Typ und seine Parameter sind pro Hinweis gespeichert. Die Form wird durch die unveränderte Funktion \`cluePresentationForm()\` eindeutig und deterministisch abgeleitet; \`technicalClueText()\` verwendet beim Export dieselbe Ableitung. Es gibt keine zusätzliche Auswahl alternativer Formen beim Export.\n\n`+
  `Für \`countDistanceToPlace\` gilt: Einzelstunde mit Anzahl 0 → \`NotDistanceAt\`, Einzelstunde mit Anzahl 1 → \`HasDistanceAt\`, sonst Anzahl 0 → \`CountDistanceNever\`, sonst → \`countDistanceToPlace\`. Einzelstunden haben Vorrang. Andere logische Typen behalten ihre Kennung als Form.\n\n`+
  `\`properties.cluePresentationForms\` speichert nur die verschiedenen vorkommenden Formen eines Kandidaten; diese Liste ist keine Häufigkeitsverteilung. \`occurrences\` im JSON weist jedes gezählte Vorkommen mit Testname, Hinweis-ID, logischem Typ und abgeleiteter Form nach. Es werden keine zusätzlichen möglichen Formulierungen unterstellt.\n\n`+
  `Die Auswertung beschreibt ausschließlich Zusammensetzung. Sie enthält keine Qualitätsmetrik, Bewertung, Suchgewichtung oder Auswahl.\n`;
}
