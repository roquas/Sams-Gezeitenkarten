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
 <label class="beta-general">Wie viel Erfahrung hast Du mit Logik- und Deduktionsrätseln? (Einmal pro Browser, freiwillig)<select id="puzzleExperience"><option value="">Keine Angabe</option><option value="beginner">Kaum / keine</option><option value="occasional">Gelegentlich</option><option value="experienced">Viel Erfahrung</option></select></label><div id="feedbackRecords"></div><label class="beta-general" for="generalFeedback">Allgemeines Feedback zu Bedienung, Lesbarkeit, Regeln oder Mobilnutzung<textarea id="generalFeedback" rows="5"></textarea></label>
 <p id="feedbackSaveStatus" role="status"></p><button class="btn primary" id="exportFeedback" type="button">Betatest-Feedback exportieren</button><p class="muted">Eine JSON-Datei mit Testkennung, Bearbeitungsstatus, ungefährer aktiver Zeit, Hilfenzählern und freiwilligen Rückmeldungen. Keine Routen und kein Klickverlauf. Die Datei bleibt bei Dir.</p></section>
 <section class="panel pad" aria-labelledby="landingRulesTitle"><h2 id="landingRulesTitle" tabindex="-1">Vollständige Spielregeln</h2><div id="landingRules"></div></section>`;
 document.body.append(main);main.querySelector('#landingRules').append(rules);
 const storage=localStorageAccess(),store=createBetaStore({storage,report:storageNotice});
 const $=id=>main.querySelector('#'+id),general=$('generalFeedback');general.value=store.general().comment;
 general.addEventListener('input',()=>{$('feedbackSaveStatus').textContent=store.setGeneral(general.value)?'Allgemeines Feedback lokal gespeichert.':'Noch nicht dauerhaft gespeichert. Bitte exportieren.';});
 const experience=$('puzzleExperience');experience.value=store.general().experience??'';
 experience.addEventListener('change',()=>{$('feedbackSaveStatus').textContent=store.setExperience(experience.value||null)?'Rätselerfahrung lokal gespeichert.':'Noch nicht dauerhaft gespeichert. Bitte exportieren.';});
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
  if(context.community){
   const story=main.querySelector('.beta-intro-copy>.story');story.nextElementSibling.remove();
   story.outerHTML=`<div class="beta-community-invitation">
    <h2>Sam und Robin brauchen eure Hilfe!</h2>
    <p>Also. Wir haben da ein paar Gezeitenkarten. Und ein paar Schiffsreisen, bei denen offenbar niemand auf die Idee gekommen ist, den tatsächlichen Kurs ordentlich aufzuschreiben.</p>
    <p>Robin behauptet, dass man die Routen mit den vorhandenen Hinweisen trotzdem herausfinden kann. Sam behauptet, dass Robin das dann ja gerne mal vormachen darf.</p>
    <p>Und jetzt kommt ihr ins Spiel!</p>
    <p><strong>Ihr könnt uns helfen, die verschollenen Routen zu rekonstruieren.</strong> Dabei gibt es ein paar Dinge, die ihr wissen solltet:</p>
    <ul>
     <li><strong>Fangt ruhig irgendwo an!</strong> Ihr müsst die Rätsel nicht der Reihe nach lösen. Besonders hilfreich wäre es sogar, wenn nicht alle mit dem ersten anfangen.</li>
     <li><strong>Spielt so viel oder wenig, wie ihr mögt.</strong> Ein einziges Rätsel hilft uns schon. Wenn euch alle packen, umso besser!</li>
     <li><strong>Kein Stress!</strong> Ihr müsst nicht alles hintereinander lösen. Heute eine Karte, morgen die nächste – ganz wie es euch passt.</li>
     <li><strong>Eure Fortschritte und Rückmeldungen bleiben im Browser gespeichert.</strong> Ihr könnt also auch an einem anderen Tag weiterspielen. Wichtig: Handy und Computer speichern getrennt. Wenn ihr auf beiden Geräten spielt, entstehen zwei getrennte Spielstände und Feedbacksammlungen. Bitte exportiert am Ende gegebenenfalls beide.</li>
     <li><strong>Schickt uns eure Ergebnisse bitte erst am Schluss.</strong> Dafür gibt es eine Exportfunktion. Egal ob ihr eine Karte oder fünfzehn gelöst habt: Wir freuen uns über eure Rückmeldungen!</li>
    </ul>
    <p>Und noch etwas: Uns interessiert nicht nur, <strong>ob</strong> ihr eine Route findet, sondern auch, ob euch das Knobeln Spaß macht. Wenn euch ein Rätsel begeistert, sagt es uns. Wenn ihr am liebsten die Karte über Bord werfen würdet, sagt uns das bitte ebenfalls.</p>
    <p><strong>Vielen Dank fürs Mithelfen!</strong></p>
    <p>Sam &amp; Robin</p>
    <p><em>P. S. von Sam: „Über Bord werfen“ ist übrigens nicht wörtlich gemeint. Wir brauchen die Karten noch.</em></p>
    <p><em>P. P. S. von Robin: Ich habe das mit dem Aufschreiben der Kurse vorgeschlagen. Mehrfach.</em></p>
   </div>`;
   const invitation=document.createElement('p');invitation.textContent='Wähle frei, was Dich anspricht, und teste so viel oder wenig Du möchtest. Fang gerne auch in der Mitte an, damit sich die Rückmeldungen verteilen.';$('catalogStatus').after(invitation);
   const inventory=await fetch(new URL('inventory.json',context.manifestUrl)).then(r=>{if(!r.ok)throw Error('Katalogstatus nicht verfügbar');return r.json();});
   if(!inventory.releaseReady){const notice=document.createElement('p');notice.role='status';notice.textContent='Redaktionelle Vorschau: Podcasttexte und Bedeutungsprüfung stehen noch aus. Dieser Stand ist noch nicht für den Community-Test freigegeben.';$('catalogStatus').after(notice);}
  }
  for(const entry of [...catalog.puzzles].sort((a,b)=>Number(b.id===catalog.defaultId)-Number(a.id===catalog.defaultId))){
   const card=document.createElement('article');card.className='beta-card';const heading=document.createElement('h3');heading.textContent=entry.title;card.append(heading);$('puzzleCards').append(card);
   try{
    const puzzle=await context.loader.load(entry.id);loaded.push(puzzle);const identity=puzzleIdentity(puzzle,context.scope),record=store.get(identity);
    const description=document.createElement('p');description.className='muted';description.textContent=puzzle.steps+' Etappen'+(entry.id===catalog.defaultId&&!context.community?' · Standardrätsel':entry.id==='model-demo'?' · Technische Probefahrt':'');card.append(description);
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
  }
  renderFeedback();
 }catch(error){$('catalogStatus').textContent=error.message;$('catalogStatus').role='alert';}
}
