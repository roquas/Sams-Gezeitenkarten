import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT,buildProfiles} from './lib/b2-deduction-profile.mjs';

export const OUTPUT='docs/verification/B2-deduction-profile';
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',
 ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
const hours=items=>items.map(p=>p.hour).join(', ')||'keine';
const witnessCount=w=>w.minimumClueCount??(w.minimumKnownClueCount===null?'offen':`bekannt: ${w.minimumKnownClueCount}`);
const sourceLink=(p,state)=>{
 const s=p.evidence.states.find(s=>s.id===state);
 return `[${state}](../../../${s.source.path}#L${s.source.line})`;
};
const entryText=p=>{
 const fixed=p.evidence.clueWitnesses.local.filter(w=>w.origin==='clues'&&w.minimumClueCount!==null&&w.minimumClueCount<=2);
 if(fixed.length)return fixed.map(w=>`Stunde ${w.hour} (${w.minimumClueCount} ${w.minimumClueCount===1?'Hinweis':'Hinweise'})`).join('; ');
 const small=p.evidence.entryOffer.states.flatMap(e=>e.local.filter(f=>f.kind==='small-alternatives').map(f=>f.remaining.length));
 return small.length?`keine Festlegung; Alternativmengen mit ${Math.min(...small)} Feldern`:'Ausschlüsse, keine Festlegung';
};

export function renderProfileReport(profiles){
 const comparison=table(['Fall','Einstieg aus ≤2 Hinweisen','Lokal verbleibende Felder S1–S6','Feste Stunden aus Hinweisen','Lücke Felder / Kanten'],
  profiles.map(p=>{const f=p.evidence.localCoverage.full;return [p.label,entryText(p),
   f.local.domains.map(d=>d.length).join('/'),hours(f.local.clueDerivedFixedHours),`${f.gap.fieldCount} / ${f.gap.transitionCount}`];}));
 const detail=profiles.map(p=>{
  const e=p.evidence,full=e.localCoverage.full,local=e.clueWitnesses.local;
  const anchors=local.filter(w=>w.origin==='clues'&&w.minimumClueCount!==null&&w.minimumClueCount<=2)
   .map(w=>`Stunde ${w.hour}: ${w.witnesses.map(s=>sourceLink(p,s.state)).join(' oder ')}`).join('; ');
  const coupling=[...e.representation.localCouplings].sort((a,b)=>a.transitions.length-b.transitions.length)[0];
  const h3=local.find(w=>w.hour===3),end=e.milestones.items.find(m=>m.hour===6);
  const exactOnly=e.clueWitnesses.exact.filter(w=>full.gap.exactlyFixedLocallyOpenHours.includes(w.hour)&&w.minimumKnownClueCount<=3);
  return `### ${p.label}\n\n`+
   `Belegt: ${anchors||'Kein zusätzlicher Stundenanker aus Einzelhinweisen oder Paaren.'}`+
   (anchors?'.':'')+' '+
   `Die lokalen Restmengen und exakten Unterschiede beziehen sich auf ${sourceLink(p,full.local.state)}.\n\n`+
   (e.coverage.complete?`Alle ${e.coverage.stateCount} Teilhinweissätze liegen vor. Kleinster lokaler Hinweisanzahlvektor: **${local.map(w=>witnessCount(w)).join('/')}**.\n\n`:
    `${e.coverage.stateCount}/${e.coverage.totalSubsetCount} Teilhinweissätze liegen vor; **${e.coverage.missingStates.length} sind unbekannt**. `+
    'Pro Erkenntnis wird nur bei Abdeckung sämtlicher kleineren Kombinationen ein Minimum behauptet.\n\n')+
   (h3?.origin==='clues'&&h3.witnesses.length?`Stunde 3: ${h3.witnesses.map(w=>sourceLink(p,w.state)).join(' oder ')}; `+
    `kleinste bekannte Anzahl ${h3.minimumKnownClueCount}${h3.minimumClueCount===null?' (Minimum nicht belegt)':' (Minimum belegt)'}.\n\n`:'')+
   (end?`Abschluss Stunde 6: ${end.certificate.rule==='no-revisit-singleton'?'Wiederbesuchsverbot nach bereits belegten Positionen':'lokal begründete Festlegung'}. `+
    (e.milestones.dependencies.some(d=>d.from==='hour-3'&&d.to===end.id)?'Die Festlegung von Stunde 3 trägt im gespeicherten Zertifikat dazu bei. ':'')+
    'Weitere Prämissen und Trace-IDs stehen im Profil; daraus folgt keine notwendige menschliche Reihenfolge.\n\n':'')+
   (coupling?`Darstellungsgrenze im lokalen Rest: Stunde ${coupling.fromHour}→${coupling.toHour}: `+
    coupling.transitions.map(t=>t.replace('>','→')).join(', ')+'. Die Feldmarkierungen speichern diese Zuordnungen nicht.\n\n':'')+
   (exactOnly.length?'Exakt, lokal nicht erklärt: '+exactOnly.map(w=>`Stunde ${w.hour}: ${w.witnesses.map(s=>sourceLink(p,s.state)).join(' oder ')}`).join('; ')+'.\n\n':'')+
   (p.id==='T07-given-3'?'Die Vorgabe in Stunde 3 sowie die daraus schon ohne Hinweise folgenden Stunden 1 und 2 zählen nicht als Erfolge aus Hinweisen.\n\n':'')+
   `Nachweise: [versioniertes Profil](${p.id}.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.\n`;
 }).join('\n');
 return `# B2 – beschreibende Deduktionsprofile\n\n`+
  'Auswertung gespeicherter Nachweise nach PR #106/#105. Kein Solveraufruf, keine neue Deduktionsregel, kein Generatorlauf. **Keine Schwierigkeitsschätzung, Qualitätsnote oder automatische Auswahl.** Enthält Lösungsschlüsse; kein Spieltestexport.\n\n'+
  '## Belegte Eigenschaften\n\n'+comparison+'\n\n'+
  'Alle fünf vollen Hinweissätze bestimmen exakt alle Stunden und Übergänge. Die Tabelle zeigt den lokalen Apparat. Die Lücken enthalten auch Grenzen der hinweisfreien Legalitätsweitergabe; Basismengen und Basislücke stehen separat im JSON. Start und Vorgaben sind keine aus Hinweisen gewonnenen Erfolge.\n\n'+
  detail+'\n'+
  '## Vergleich der Lösungsstruktur\n\n'+
  'V1 und V2 teilen den sofort markierbaren Anker Stunde 5, den Anker Stunde 4 aus H2+H3 und den Hinweisanzahlvektor **3/4/4/2/1/5**. Beide besitzen unter H1 kleine frühe Alternativmengen und gekoppelte Übergänge; der Abschluss nutzt die Belegung von Stunde 3 und das Wiederbesuchsverbot. Die Quellen dieser Gemeinsamkeiten stehen in `entryOffer`, `clueWitnesses`, `representation.smallEntryCouplings` und `milestones` der beiden Profile.\n\n'+
  'Der Zeuge für Stunde 3 unterscheidet sich: V1 H1+H2+H3+H4, V2 H1+H2+H3+H6. Bei V2 ist H6 eine wirksame Mehrstundenzählung mit innerem Zählziel. Sie ist für diesen Zeugen notwendig. Ein neuer Mechanismus bedeutet somit nicht automatisch einen neuen Gesamtverlauf. T02 erreicht keine weitere feste Stunde; T07 gewinnt einen frühen Anker und bleibt später offen. Die Vorgabe verkleinert T07s Rest, beseitigt die gekoppelten Alternativen aber nicht.\n\n'+
  '## Mögliche spielerische Interpretationen\n\n'+
  'Markierbare Anker und kleine Feldmengen könnten Zwischenfortschritt erleichtern. Gemeinsame Anker- und Abschlussmuster könnten Wiederholungen in einer Tagesrätselserie sichtbar machen. Gekoppelte Übergänge könnten Gedächtnisarbeit verlangen; auch die positiven Referenzen enthalten solche Kopplungen. Keine dieser Deutungen ist eine automatische Bewertung. Die menschlichen Beobachtungen aus dem Analyseauftrag bleiben eigenständige Evidenz: V1 angenehm und eher leicht, V2 angenehm und ähnlich erlebt, T02/T07 schwieriger und teilweise frustrierend.\n\n'+
  '## Unbekannt und Grenzen\n\n'+
  'Entdeckbarkeit, Bedienaufwand, Gedächtnislast, Freude und menschliche Bearbeitungsreihenfolge sind nicht gemessen. Die Trace-Reihenfolge ist keine Spielerreihenfolge. Zertifikatsvorfahren sind ausreichend, aber nicht zwingend minimal; alternative bekannte Hinweiszeugen ersetzen keine vollständige Sammlung menschlicher Argumente. Es wird keine technische Graphentiefe als Denktiefe ausgegeben. Lokale Kanten müssen nicht zu einer legalen Gesamtroute erweiterbar sein. Auch Nachbarschaft erzeugt Kopplungen; höhere Korrelationen fehlen.\n\n'+
  '## Reproduktion\n\n'+
  '`npm run report:b2:profile` zeigt diesen Bericht; `-- --check` prüft die fünf JSON-Dateien und diesen Bericht bytegenau; `-- --write` erneuert ausschließlich diese sechs Dateien. Datenformat und Methodik: [Dokumentation](../B2-deduction-profile.md).\n';
}

export function profileReportFiles(){
 const profiles=buildProfiles();
 return new Map([...profiles.map(p=>[p.id+'.json',JSON.stringify(p,null,2)+'\n']),['report.md',renderProfileReport(profiles)]]);
}
export function main(argv=process.argv.slice(2)){
 if(!argv.length)return renderProfileReport(buildProfiles());
 assert(argv.length===1&&['--write','--check'].includes(argv[0]),'Usage: report-b2-profile.mjs [--write|--check]');
 const output=path.join(ROOT,OUTPUT),files=profileReportFiles();
 if(argv[0]==='--write')fs.mkdirSync(output,{recursive:true});
 for(const [name,bytes] of files){
  const target=path.join(output,name);
  if(argv[0]==='--write')fs.writeFileSync(target,bytes);
  else assert.equal(fs.readFileSync(target,'utf8'),bytes,'Profile evidence changed: '+name);
 }
 return `B2 profile: ${files.size} files ${argv[0]==='--write'?'written':'reproduced byte-for-byte'}.`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
