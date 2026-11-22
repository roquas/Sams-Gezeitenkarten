import {prepareRules} from '../ui/rules.mjs';
import {downloadFeedback} from './export.mjs';
import {puzzleContext,puzzleUrl} from './context.mjs';
import {createBetaStore,puzzleIdentity,recordId} from './storage.mjs';
import {localStorageAccess,storageNotice,setEmergencyExport} from './local-storage.mjs';
import {loadState} from '../persistence/storage.mjs';
import {feedbackForm} from './feedback.mjs';
export async function showLanding(){
 document.body.classList.add('beta-landing');document.title='Sams Gezeitenkarten';
 document.querySelector('.mobile-view-nav').hidden=true;
 const rules=document.querySelector('#gameRules article').cloneNode(true);
 const main=document.createElement('main');main.id='landing';main.innerHTML=`
 <section class="panel pad beta-intro" aria-labelledby="landingTitle"><div class="beta-masthead"><small>Gezeitenkarten · Sams Logbuch</small><span>Freiwilliger Betatest</span></div><div class="beta-intro-copy"><div class="eyebrow">Sechs Stunden · Eine Route</div><h1 id="landingTitle">Sams Gezeitenkarten</h1>
 <p class="story">Rekonstruiere Sams Route aus Robins Logbuch: Kombiniere Hinweise, halte Möglichkeiten auf der Seekarte fest und finde den richtigen Kurs.</p>
 <p>Hilf beim Betatest mit, wenn Du möchtest. Du kannst Rückmeldungen auch ohne Lösung geben. Alles bleibt in diesem Browser, bis Du eine exportierte Datei selbst weitergibst. Ohne Anmeldung und ohne automatischen Upload.</p><nav class="beta-intro-nav" aria-label="Einstieg"><a class="btn primary" href="#selectionTitle">Rätsel auswählen</a><a href="#landingRulesTitle">Spielregeln lesen</a></nav></div><span class="brass-rail rail-bottom" aria-hidden="true"></span></section>
 <section class="panel pad" aria-labelledby="selectionTitle"><h2 id="selectionTitle" tabindex="-1">Rätselauswahl</h2><p id="catalogStatus" role="status">Katalog wird geladen …</p><div id="puzzleCards" class="beta-cards"></div></section>
 <section class="panel pad" aria-labelledby="feedbackTitle"><h2 id="feedbackTitle">Dein Betatest-Feedback</h2>
 <p>Freiwillig und jederzeit änderbar. Änderungen hier werden automatisch lokal gespeichert, sofern die Browserspeicherung verfügbar ist. Bitte keine persönlichen Angaben eintragen.</p>
 <div id="feedbackRecords"></div><label class="beta-general" for="generalFeedback">Allgemeines Feedback zu Bedienung, Lesbarkeit, Regeln oder Mobilnutzung<textarea id="generalFeedback" rows="5"></textarea></label>
 <p id="feedbackSaveStatus" role="status"></p><button class="btn primary" id="exportFeedback" type="button">Betatest-Feedback exportieren</button><p class="muted">Eine JSON-Datei mit Testkennung, Bearbeitungsstatus, ungefährer aktiver Zeit, Hilfenzählern und freiwilligen Rückmeldungen. Keine Routen und kein Klickverlauf. Die Datei bleibt bei Dir.</p></section>
 <section class="panel pad" aria-labelledby="landingRulesTitle"><h2 id="landingRulesTitle" tabindex="-1">Vollständige Spielregeln</h2><div id="landingRules"></div></section>`;
 document.body.append(main);main.querySelector('#landingRules').append(rules);
 const storage=localStorageAccess(),store=createBetaStore({storage,report:storageNotice});
 const $=id=>main.querySelector('#'+id),general=$('generalFeedback');general.value=store.general().comment;
 general.addEventListener('input',()=>{$('feedbackSaveStatus').textContent=store.setGeneral(general.value)?'Allgemeines Feedback lokal gespeichert.':'Noch nicht dauerhaft gespeichert. Bitte exportieren.';});
 let context,catalog,loaded=[];const refreshCards=[];
 function renderFeedback(){
  const records=new Map(store.records().map(r=>[r.recordId,r]));
  // Also allow feedback on an unopened puzzle, without marking it begun.
  for(const puzzle of loaded){const identity=puzzleIdentity(puzzle,context.scope);if(!store.get(identity)){
   const id=recordId(identity);records.set(id,{recordId:id,identity,title:puzzle.title,phases:[],solvedAt:null,feedback:{difficulty:null,fairness:null,status:null,comment:''}});
  }}
  $('feedbackRecords').replaceChildren();
  for(const record of records.values()){
   const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=record.title||record.identity.puzzleId;details.append(summary);
   const version=document.createElement('p');version.className='muted';version.textContent='Bestand: '+record.identity.catalog+' · Datenversion '+record.identity.dataVersion+' · '+(record.identity.sourcePublicationId??record.identity.variantId??record.identity.puzzleId);details.append(version);
   details.append(feedbackForm({record,onChange:values=>{
    store.feedback(record.identity,values,record.title);refreshCards.forEach(refresh=>refresh());
    $('feedbackSaveStatus').textContent=store.hasUnsaved()?'Noch nicht dauerhaft gespeichert. Bitte exportieren.':'Rückmeldung lokal gespeichert.';
   }}));
   for(const phase of record.phases.filter(p=>p.feedbackAtEnd)){
    const history=document.createElement('p');history.className='muted';
    const old=phase.feedbackAtEnd;
    history.textContent='Frühere Rückmeldung ('+phase.startedAt.slice(0,10)+'): '+({easy:'Einfach',medium:'Mittel',hard:'Schwer'}[old.difficulty]??'Keine Schwierigkeit angegeben')+' · '+({yes:'Ja',partly:'Teilweise',no:'Nein'}[old.fairness]??'Keine Fairnessangabe')+' · '+(old.comment||'Ohne Kommentar');details.append(history);
   }
   $('feedbackRecords').append(details);
  }
 }
 function exportFeedback(){downloadFeedback(store,{scope:context?.scope,catalogSchemaVersion:catalog?.schemaVersion});}
 setEmergencyExport(exportFeedback);
 $('exportFeedback').onclick=exportFeedback;
 renderFeedback();
 try{
  context=puzzleContext();catalog=await context.loader.manifest();
  $('catalogStatus').textContent=(context.development?'Entwicklungsbestand '+context.stock+' · ':'')+catalog.puzzles.length+(catalog.puzzles.length===1?' verfügbares Rätsel':' verfügbare Rätsel');
  for(const entry of [...catalog.puzzles].sort((a,b)=>Number(b.id===catalog.defaultId)-Number(a.id===catalog.defaultId))){
   const card=document.createElement('article');card.className='beta-card';const heading=document.createElement('h3');heading.textContent=entry.title;card.append(heading);$('puzzleCards').append(card);
   try{
    const puzzle=await context.loader.load(entry.id);loaded.push(puzzle);const identity=puzzleIdentity(puzzle,context.scope),record=store.get(identity);
    const description=document.createElement('p');description.className='muted';description.textContent=puzzle.steps+' Etappen'+(entry.id===catalog.defaultId?' · Standardrätsel':entry.id==='model-demo'?' · Technische Probefahrt':'');card.append(description);
    const saved=loadState(puzzle,storage),begun=record?.phases.length||Object.keys(saved.marks).length||saved.route.length>1||saved.doneClues.length||saved.hintCount;
    const solved=!!record?.solvedAt,abandoned=record?.phases.at(-1)?.status==='abandoned';
    const status=document.createElement('p');card.append(status);
    const action=document.createElement('a');action.className='btn primary';action.href=puzzleUrl(entry.id,{replay:solved||abandoned});action.textContent=solved?'Erneut spielen':begun?'Fortsetzen':'Beginnen';card.append(action);
    const refresh=()=>{
     const current=store.get(identity),phase=current?.phases.at(-1),done=!!current?.solvedAt,working=phase?.status==='open';
     const givenUp=phase?.status==='abandoned',started=begun||current?.phases.length;
     status.textContent=(done?'Gelöst':started?'Begonnen':'Neu')+(givenUp&&current?.feedback.status==='abandoned'?' · bewusst aufgegeben':done&&working?' · erneut begonnen':'');
     action.textContent=working||givenUp?'Fortsetzen':done?'Erneut spielen':started?'Fortsetzen':'Beginnen';
     action.href=puzzleUrl(entry.id,{replay:done&&!working&&!givenUp,resume:givenUp&&!working});
    };refreshCards.push(refresh);refresh();
    if(solved){const view=document.createElement('a');view.href=puzzleUrl(entry.id);view.textContent='Spielstand ansehen';card.append(view);}
   }catch(error){const failure=document.createElement('p');failure.role='alert';failure.textContent=error.message;card.append(failure);}
  }
  const reference=loaded.find(p=>p.id===catalog.defaultId);
  if(reference){
   prepareRules(document.querySelector('#gameSurface'),reference);
   prepareRules(rules,reference);
   const note=document.createElement('p');note.className='muted';note.textContent='Die Stundenangaben beziehen sich auf „'+reference.title+'“. Bei anderen Rätseln gilt die dort angegebene Anzahl an Etappen.';$('landingRules').prepend(note);
  }
  renderFeedback();
 }catch(error){$('catalogStatus').textContent=error.message;$('catalogStatus').role='alert';}
}
