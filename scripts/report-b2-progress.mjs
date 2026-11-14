import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT} from './lib/b2-deduction-profile.mjs';
import {buildProgressProfiles} from './lib/b2-markable-progress.mjs';

export const OUTPUT='docs/verification/B2-deduction-profile-v2';
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
const cells=values=>values.length<=6?'{'+values.join(', ')+'}':`${values.length} Felder (im JSON vollständig)`;
// Fixed reading examples, not ranked candidates or a proposed solution plan.
const READINGS={
 A:[['H1',[1,2]]], B:[['H1',[1]],['H2+H3',[3,4,5,6]],['full',[2]]],
 C:[['H1+H2',[4],'D19'],['H1+H3',[1,2,3]],['H1+H2+H3',[4]],['H1+H2+H3+H4',[4]],['full',[5,6]]],
 D:[['H1',[1]],['H2',[1]],['H1+H2',[1]],['H1+H2+H5',[6]],['full',[3,4,6]]],
 V1:[['H1',[1,2]],['H3',[5]],['H2+H3',[4]],['full',[3,6]]],
 V2:[['H1',[1,2]],['H3',[5]],['H2+H3',[4]],['full',[3,6]]],
 T02:[['H1+H4',[1,2]]],T07:[['H4+H5',[1,2]],['full',[3,4]]],
 'T07-given-3':[['none',[1,2,3]],['full',[4,5]]]
};
const sourceLink=s=>`[${s.state}](../../../${s.source.path}#L${s.source.line})`;
export function renderProgressReport(profiles){
 const c=profiles.find(p=>p.id==='C'),cs=c.intermediateProgress.states.find(s=>s.state==='H1+H2');
 const cw=cs?.local.fields.find(f=>f.hour===4)?.witnesses.find(w=>w.step==='D19');
 const lead=cw?`**C: markierbarer Ausschluss ohne feste Stunde.** Im Zustand ${sourceLink(cs)} gibt es `+
  `${cs.local.additionalFixedHours.length} zusätzliche feste Stunden. Trotzdem belegt ${cw.step} (\`${cw.rule}\`) für Stunde 4 **× ${cells(cw.removed)}**. `+
  `Erreichbare Hinweiszeugen: ${cw.reachableClueIds.join('+')}; direkte Prämissen: ${cw.premises.join(', ')}. Dieser Fortschritt wird gleichwertig zu einer Feldfestlegung sichtbar.\n\n`:
  '**C, H1+H2: nicht untersucht; kein Ausschluss behauptet.**\n\n';
 const comparison=table(['Fall','Lokal feste Stunden aus Hinweisen','Feldanzahlen S1–S6 im Vollsatz','Lücke Felder/Kanten'],profiles.map(p=>{
  const f=p.evidence.localCoverage.full;return [p.id,f.local.clueDerivedFixedHours.map(h=>h.hour).join(', ')||'keine',f.local.domains.map(d=>d.length).join('/'),`${f.gap.fieldCount}/${f.gap.transitionCount}`];
 }));
 const details=profiles.map(p=>{
  const rows=[];
  for(const [requested,hours,step] of READINGS[p.id]??[]){
   const id=requested==='full'?p.evidence.localCoverage.full.local.state:requested;
   const s=p.intermediateProgress.states.find(s=>s.state===id);
   if(!s){rows.push([id,'nicht untersucht (unbekannt)','keine Zeugen behauptet']);continue;}
   for(const hour of hours){
    const f=s.local.fields.find(f=>f.hour===hour);
    if(!f){
     const base=p.evidence.localCoverage.baseline.local.domains[hour-1];
     rows.push([sourceLink(s),`Stunde ${hour}: ${base.length===1?'✓ '+base[0]:'? '+cells(base)} (bereits Basis)`,
      'Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext']);continue;
    }
    const witnesses=step?f.witnesses.filter(w=>w.step===step):f.witnesses;
    const removed=step?witnesses.flatMap(w=>w.removed):f.marks.cross;
    const marks=[removed.length?`× ${cells(removed)}`:'',f.marks.check?`✓ ${f.marks.check}`:`? ${cells(f.marks.question)}`].filter(Boolean).join('; ');
    const shown=step?witnesses:[witnesses.find(w=>w.fixed)??witnesses.at(-1)];
    const proof=shown.map(w=>`${w.step} (\`${w.rule}\`; ${w.reachableClueIds.join('+')||'Basiskontext'})`).join(', ')+
     (witnesses.length>shown.length?' (weitere Zeugen im JSON)':'');
    const reuse=shown.flatMap(w=>w.reusedBy.map(n=>`${w.step}→${n.step}`));
    rows.push([sourceLink(s),`Stunde ${hour}: ${marks}`,proof+(reuse.length?`; bekannte Weitergabe z. B. ${reuse[0]}`:'')]);
   }
  }
  const singles=p.intermediateProgress.singleClueCompleteWitnesses;
  const special=p.id==='A'&&singles.length?`**${singles.join(', ')} allein trägt bereits alle sechs Stunden.** Ein Mehrhinweis-Kombinationsschluss ist für diese vollständige lokale Lösung nicht erforderlich.\n\n`:
   p.id==='B'?'B besitzt getrennte bekannte Hinweiszeugen und einen Verbindungsschluss; eine menschliche Qualitätsbewertung wird nicht ergänzt.\n\n':
   p.id==='C'?'Die ersten beiden Paarzustände sind alternative nutzbare Teilbefunde, keine erzwungene Reihenfolge. Beim markierten D19-Beispiel zeigt × nur dessen fünf Ausschlüsse; ? zeigt den Fixpunkt des gesamten Zustands einschließlich weiterer Propagation.\n\n':
   p.id==='D'?'Stunde 6 ist im frühen H1+H2+H5-Zustand als Alternativmenge markierbar, noch nicht als sichere Position. „H6“ bezeichnet hier Stunde 6, keinen sechsten Hinweis.\n\n':'';
  const coupled=p.evidence.representation.localCouplings;
  const relation=coupled.length?'**Relationale Restalternativen:** '+coupled.map(r=>`Stunde ${r.fromHour}→${r.toHour}: ${cells(r.transitions.map(t=>t.replace('>','→')))}`).join('; ')+
   '. Feldmarkierungen können die Endpunkte festhalten, ihre Zuordnungen bleiben in der heutigen GUI unvollständig darstellbar. Lokale Kanten sind keine bewiesenen Restwege.\n\n':'';
  return `## ${p.id} – ${p.label}\n\n`+special+table(['Bekannter Zustand','Zusätzlicher feldbezogener Befund am Fixpunkt','Regelzeugen / Begründungsweitergabe'],rows)+'\n\n'+relation+
   `Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](${p.id}.json). `+
   `Exakte Projektionen stehen dort getrennt unter \`intermediateProgress.states[].exact\` und tragen keine lokalen Regelzertifikate.\n\n`;
 }).join('');
 return '# B2 – markierbare Zwischenfortschritte\n\n'+
  'Profilversion 2 ergänzt die fünf bisherigen Merkmalsfamilien. Alle Daten stammen aus gespeicherten Zuständen. Die Auswertung ist rein lesend, ohne Solver- oder Generatorlauf. **Enthält Lösungsschlüsse; keine Qualitätsnote oder Schwierigkeitsschätzung.**\n\n'+lead+
  '× bedeutet sicher ausgeschlossen, ? lokal noch nicht ausgeschlossen und ✓ eine eindeutige Stundenposition. Fragezeichen beweisen keine Erweiterbarkeit zu einer legalen Route. Alle Markierungen beziehen sich auf dieselbe hinweisfreie Basis einschließlich möglicher Vorgaben.\n\n'+
  'Die Tabellen sind fest dokumentierte Lesebeispiele. Sie erhalten unterschiedliche bekannte Hinweiszeugen und mögliche Einstiege, geben aber weder eine menschliche Reihenfolge noch einen optimalen Lösungsplan vor. Ein Pfeil zwischen Trace-IDs belegt nur eine zitierte Prämisse. Zertifikatsvorfahren sind ausreichend, nicht zwingend minimal.\n\n'+comparison+'\n\n'+details+
  '## Bestandsschutz und Grenzen\n\n'+
  'Die Profilversion 1 aus PR #107 und sämtliche bisherigen Diagnoseartefakte bleiben unverändert. Version 2 erhält ihre bestehenden Aussagen und ergänzt \`intermediateProgress\`; die eigene Formatkennung macht die Erweiterung explizit. Fehlende Teilzustände bleiben unbekannt. C/D besitzen zusätzlich genau die zehn nachgeprüften Viererzustände, daher sind ihre 32 Teilmengen jeweils vollständig; das erweitert weder Regeln noch Kandidatenbestand.\n\n'+
  'V1 und V2 behalten den minimalen lokalen Hinweisanzahlvektor **3/4/4/2/1/5**, gemeinsame Einstiege und den Abschluss über Wiederbesuchsweitergabe. Für Stunde 3 unterscheiden sich ihre bekannten Zeugen und Mechanismen. Ausschlüsse, Feldfestlegung und angehängte feste Kante werden nicht zu mehreren Meilensteinen derselben Erkenntnis gezählt.\n\n'+
  'Entdeckbarkeit, Markieraufwand, Gedächtnislast, tatsächliche Stillstände und menschliche Präferenzen werden nicht gemessen. Die genannten Folgebeziehungen sind bekannte Beweisverwendungen, keine vollständige Sammlung menschlicher Argumente. Es gibt keine neue GUI und keinen Tagesrätsel-Selektor.\n\n'+
  'Reproduktion: `npm run report:b2:progress` zeigt diesen Bericht; `-- --check` prüft neun kompakte JSON-Profile und den Bericht, `-- --write` erneuert ausschließlich diese zehn Dateien. [Datenformat und Quellenreproduktion](../B2-markable-progress.md).\n';
}
export function progressReportFiles(){
 const profiles=buildProgressProfiles();
 return new Map([...profiles.map(p=>[p.id+'.json',JSON.stringify(p)+'\n']),['report.md',renderProgressReport(profiles)]]);
}
export function main(argv=process.argv.slice(2)){
 if(!argv.length)return renderProgressReport(buildProgressProfiles());
 assert(argv.length===1&&['--write','--check'].includes(argv[0]),'Usage: report-b2-progress.mjs [--write|--check]');
 const directory=path.join(ROOT,OUTPUT),files=progressReportFiles();
 if(argv[0]==='--write')fs.mkdirSync(directory,{recursive:true});
 for(const [name,bytes] of files){
  if(argv[0]==='--write')fs.writeFileSync(path.join(directory,name),bytes);
  else assert.equal(fs.readFileSync(path.join(directory,name),'utf8'),bytes,'Progress profile changed: '+name);
 }
 return `B2 progress: ${files.size} files ${argv[0]==='--write'?'written':'reproduced byte-for-byte'}.`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 try{console.log(main());}catch(error){console.error(error.message);process.exitCode=1;}
}
