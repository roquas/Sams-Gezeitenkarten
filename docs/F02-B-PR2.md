# F02-B PR 2: unterbrechbare Beta-Batches

Die unabhängige Nachprüfung von PR #132 bestätigte Head
`89f1b9236e47380450a349859cc6747d7b8c79d7` ohne belastbare Findings.
CI #540 war vollständig erfolgreich. Der Head ist Vorfahr des aktuellen
Ausgangsstands `a268484de6350bc3216c7be3f9729e631fd6a9f8` auf main.
Die Nachprüfung ist im Chat „PR 132 unabhängig prüfen“ dokumentiert;
auf GitHub gibt es dafür keine eingereichte Review. Das Auftragspaket wurde
als technische Fachquelle gelesen; seine ältere Konzeptionsanweisung „noch
keine Implementierung“ ersetzt nicht den aktuellen Implementierungsauftrag.
Private externe Pilotbelege bleiben außerhalb des Repositorys.

## Bedienung

Node 22 und die unveränderten Repository-/Bildvoraussetzungen aus PR 1.
Produktions- und Qualitätsstore ausdrücklich getrennt halten. Ein Plan enthält
bestehende `revisionRef`-Objekte, tatsächlichen Serienkontext und endliche Budgets.
Bei einer externen vollständigen Bibliothek verwenden alle drei Flavor-CLIs
`--library DIR`; programmatisch gilt weiterhin `openProductionStore({directory,
libraryDirectory})`. Der Ersatzpfad übernimmt dieselbe angeschlossene Bibliothek.
Einzelgeschichten laufen mit leerem Kontext, eine Serie in einem getrennten
Batch mit ihren geordneten aktuellen Episodenreferenzen. Ein gemeinsamer
Serienkontext würde auch alle unabhängigen Items daran binden. Beispielplan:

```json
{
  "references": [],
  "context": {"version": 1, "episodes": []},
  "budgets": {"clarifications": 1, "technicalRetries": 2, "systematicFailures": 3, "replacements": 1}
}
```

`references` muss vor dem Start mit tatsächlichen aktuellen Referenzen gefüllt
werden. Der CLI-Start ruft alle intern ausführbaren Stufen auf:

```sh
node scripts/flavor-batch.mjs start --production-store PROD --quality-store QUALITY --batch beta-1 --plan plan.json --out TRANSPORT --report REPORTS
node scripts/flavor-batch.mjs import --production-store PROD --quality-store QUALITY --batch beta-1 --responses responses.json --out TRANSPORT --report REPORTS
node scripts/flavor-batch.mjs resume --production-store PROD --quality-store QUALITY --batch beta-1 --out TRANSPORT --report REPORTS
```

Die Arbeitsliste liegt unter `TRANSPORT/<Inhaltshash>/manifest/work-list.json`.
Nur den jeweils dort genannten **einzelnen Rollenordner** an einen frischen
isolierten Kontext geben. Insbesondere dürfen Manifest, Repository,
Produktionsstore und andere Rollen nicht zum Reader. Die Standardgruppe ist
bewusst eine vollständige Episode: Reviewer-Antworten von ungefähr 46–50 kB
begründen kleine Gruppen, beweisen jedoch keine Ursache eines Vorlagen-Echos.
Die Arbeitsliste bündelt alle offenen Episoden. Es gibt keinen manuellen
Einzelbefehl pro Rätsel oder internem Schritt. Ältere Transportwellen bleiben
historisch erhalten; maßgeblich ist die zuletzt ausgegebene offene Arbeitsliste.

`responses.json` ist ein lokales Transportmanifest, kein Modellantwortschema:

```json
[{"workId":"TATSAECHLICHE-WORK-ID","file":"reader-response.json","operator":{"kind":"external-manual","model":null,"producedAt":null}}]
```

Mehrere unveränderte Standardantwortdateien gemeinsam importieren. Reader und
Reviewer verwenden unverändert die PR-1-Umschläge und ihre jobgebundenen Schemas.
Jeder Rollenordner trägt seine verbindlichen Dateien. Leere Vorlagen sind keine
Ergebnisse. Technische Fehler verbrauchen ein separates Budget, erzeugen keine
Geschichtsrevision und werden bei wiederholtem Auftreten gesammelt blockiert.
Standardfehler sind feste handlungsfähige Diagnosen ohne Antwort-/Episodentexte;
fehlgeschlagene Importe ergeben Exit 1. Die exakten Antworten und vollständigen
Fehler stehen getrennt in lokalen `rejected/<detailId>`-Snapshots. Mit
`--report DIR` werden auch übergeordnete CLI-Fehler separat in
`failure-…-DETAILS.txt` abgelegt. Die lokale Diagnose ist kein Reader-Reparaturziel.

`report` schreibt bzw. zeigt den aggregierten Stand. Mit `--report DIR` entstehen
getrennte Summary-JSON-/Textdateien und eine ausdrücklich benannte private
DETAILS-Datei. stdout enthält keine Textbelege. Details enthalten dagegen echte
Referenzen, Texte, Befunde, Bindungen, Entscheidungs- und Revisionshistorie.
Die Standardansicht zählt unabhängig belegte Beobachtungen und abstrahiert
bekannte Themenfamilien konservativ. Namen/Ideen bleiben ohne direkte
Episodenzuordnung in den bewusst zu öffnenden Details; unbekannte Begriffe
werden nicht als freie Texte in die Standardansicht übernommen.

## Zustand, Klärung und Reparatur

`QUALITY/batches/ID` hält einen unveränderlichen versionierten Plan, versiegelte
Arbeitsaufträge und eine hashverkettete Ereignishistorie. Die maßgeblichen
Antworten, Vergleiche und Revisionen bleiben in den bestehenden Qualitäts- und
Produktionsstores. Es gibt keinen zweiten Draftbestand. Alle Writer werden
über die vorhandenen exklusiven Sperren serialisiert; Veröffentlichung eines
Snapshots erfolgt durch fsync und atomaren Rename. Bei einer liegengebliebenen
Sperre gilt die bestehende manuelle Inspektionsregel, kein automatisches
Entsperren eines möglicherweise noch lebenden Writers.

Der wirksame Revisionsstand wird aus dem Produktionsstore aufgelöst. Eine
zwischenzeitliche Revision oder ein geänderter tatsächlicher Serienkontext
führt für den neuen Stand zu neuen drei Stufen; alte Jobs bleiben historisch.
Eine Ersatzvariante ändert auch abhängige tatsächliche Serienreferenzen.
Bereits angenommene aktuelle Reader-/Reviewer-Items im selben Qualitätsstore
werden anhand ihrer vollständigen Bindung unter ihren ursprünglichen Job-/Item-IDs
wiederverwendet, auch aus früheren Batches und einschließlich gebundener Klärung.
Mehrere Items eines früheren Jobs werden einzeln referenziert. Herkunft und
Antwortbytes werden nicht umetikettiert; technische Nachweise bleiben technisch.
Verspätete Antworten bleiben als lokale Transportbelege erhalten und können
keine verworfene Variante reaktivieren. Widersprüchliche Wiederholungen werden
vom bestehenden Qualitätsstore abgewiesen. Synchronische Leseabschnitte einer Analyse bzw. eines Berichts teilen
verifizierte unveränderliche Daten und Vergleichsreplays. Nach Abschluss des
API-Aufrufs werden diese Caches verworfen; neue Imports invalidieren sie.
Ein vorhandener atomarer
Produktionsimport wird nach Unterbrechung wiedergefunden, bevor weitere Arbeit
angefordert wird.

Ein gescheiterter vollständiger Durchlauf erhält standardmäßig höchstens eine
Klärung: frischer blind gehaltener Reader, neuer deterministischer Vergleich,
vergleichender unabhängiger Reviewer mit dem alten konkreten Befund. Dessen
Input bindet den früheren Review, die damalige Interpretation und Quellen sowie
die aktuelle vollständige Dreistufenprüfung. Der neue Reader erhält nichts
davon. Eine relevante offene Auslegung bleibt blockiert. ADVISORY allein
startet keine Schleife. Ohne konkrete obligatorische reparierbare Textziele
bleibt der Fall als Quellen-/Readerkonflikt blockiert.

Mehrere notwendige Ziele werden aus den gebundenen Findings und tatsächlichen
Texteinheiten zusammengetragen. Der externe Reparaturauftrag enthält den
unveränderten Quellvertrag, Welt-/Stilpaket, tatsächlichen Serienkontext und die
expliziten Ziele. Titel, Einleitungsabsatz/ganze Einleitung und mehrere
Hinweis-IDs sind als Sparse Patch möglich. Der reine Apply-Adapter ändert nur
diese Ziele, lehnt doppelte/überlappende/fremde Ziele und No-op ab und erzeugt
mit F01-Validierung genau eine neue Revision samt vollständigem Checkpoint.
Andere Spielertextfelder, Karten, Namen, Start, Regeln und Logik bleiben erhalten.
Die Autorisierung bindet den tatsächlichen Kontext. Vor Import prüft der Batch
den wirksamen Kontext erneut; unter derselben Produktionsschreibsperre wie der
Import werden sämtliche gebundenen aktuellen Episodenrevisionen geprüft.
Unabhängige nicht gebundene Episoden invalidieren den Auftrag nicht.

`importScopedRepair` archiviert exakte Patchbytes, Autorisierung und klar
unterschiedene externe bzw. menschlich-redaktionelle Herkunft. Abgeleitete
Records werden bei jedem neuen Lesevorgang aus ihrem echten Vorgänger plus
Patch rekonstruiert und geprüft. Geerbte Erzählmetadaten sind ausdrücklich als
geerbt markiert. Alte Produktionsrecords werden unverändert versionsgetreu
gelesen. `resolveRevisionContext` liefert auch für Patchrevisionen den
validierten effektiven Position-Intent für Auswahl und Materialisierung.
Neue Scoped-Imports heißen `scoped-repair-v2`: Auch ein historischer v1-Vorgänger
erhält durch den gemeinsamen F01-Übergang einen v2-Draft und v2-Checkpoint mit
allen gepinnten Namen. Alte kontrollierte Belege bleiben bis neuer Prüfung
UNCERTAIN. Requests und sourceHash behalten ihren Vertrag. Historische
`scoped-repair-v1`-Records werden ausdrücklich nach ihrer ursprünglichen
Ableitung gelesen und weder neu gehasht noch migriert. Dies führt keine Auswahl
oder Veröffentlichung aus.

Nur vollständig erfolglos geprüfte Reparaturrevisionen zählen: Ein
`failed-repair-review`-Ereignis bindet Revision, Methode, Kontext und vollständigen
Reviewnachweis. Jede Revision zählt höchstens einmal. Ungeprüfte Patchvorfahren,
Transportfehler, fehlende Stufen und ADVISORY zählen nicht. Nach zwei solchen
Reparaturrevisionen wird die Variante einmalig verworfen. Die Ersatzproduktion verwendet den normalen F02-A-Vertrag,
denselben Request und ursprünglichen redaktionellen Auftrag, eine neue
Variantenkennung und Revision 1. Standardmäßig ist ein Ersatz zugelassen.
Alle Revisionen und Befunde der verworfenen Variante bleiben erhalten.

## Redaktionelle Entscheidung und Ausführung

`decide --decision FILE` persistiert eine `human-acceptance` mit genauer
Revision, `reviewJobId`, `findingId`, Akteur, Begründung und Zeitpunkt. Sie
verändert weder externe Antwort noch Qualifikation, Auswahl oder Beta-Gate.
Eine neue Revision erbt diese Entscheidung nicht. Menschlich autorisierte
Textänderungen verwenden den getrennten Scoped-Repair-Import; exakte
`exactChanges` beschränken genehmigte Formulierungen zusätzlich zum Feldziel.

Ein Adapter hat `kind` und `execute({batchId, work})`. `work` enthält nur
rollenspezifische öffentliche Dateien und Jobkennungen, keine Store-Handles.
Das Ergebnis ist eine Liste `{workId,responseBytes,operator}` bestehender
Standardantworten. Leere Ergebnisse bedeuten Warten. `manualBetaAdapter`
exportiert gebündelte offene Arbeit. `technicalTestAdapter` erzwingt
`technical-test` für alle Ergebnisse. Die explizite `operator.kind`-Deklaration bleibt beim Produktionsimport erhalten;
`replacementOf` bindet die echte Ersatzabstammung im unveränderlichen
Produktionsbeleg. Technische Herkunft wird über Reparatur-/Ersatzketten
rekonstruiert und verhindert auch nach späteren manuell deklarierten positiven
Prüfungen eine reale Qualifikation. Modellnamen entscheiden bei neuen explizit
deklarierten Belegen nicht über diese Herkunft. Der bisherige Modellnamensmarker
wird ausschließlich für alte Belege ohne `kind` konservativ weitergelesen. Die Testimplementierung ist in den Regressionen ausführbar; sie ist
keine Modellgüteprüfung.

Kein Liveanbieter ist ausgewählt oder angeschlossen. Ein späterer zulässiger
Adapter kann dieselbe Grenze verwenden. Unbeaufsichtigter Livebetrieb ist
unbewiesen. Exporte sind keine gemessenen Modellaufrufe. Unbekannte Tokens,
Kosten und unabhängige Aufrufzahlen bleiben null. Deklarierte Modelle und
Zeiten sind nur Betreiberangaben. Es gibt keine Geheimnisse in den Paketen.

Qualifikation, redaktionelle Annahme, Auswahl und Veröffentlichung bleiben
getrennt. `editorial.json`, `semanticReview`, Beta-Gate, `dataVersion`-Pflicht,
Archiv und bereits ausgelieferte statische Pakete bleiben unverändert. Die
bestehenden Katalog-/Archivanschlüsse erhalten alte Releases; bereits
heruntergeladene statische Pakete lassen sich hierdurch nicht fernwiderrufen.
Kein Scheduler, Publisher, Deployment und kein vollständiger 10+5-Lauf.

## Batchübergreifende Zustandsbindung (Nachreview von bf7ae48)

Die unabhängige Nachreview bestätigte die ursprünglichen Korrekturen 1, 2, 4,
6 und 7. Bei Reparaturgrenze/Verwerfung (3) und Klärungswiederverwendung (5)
blieben zwei konkret reproduzierte Restlücken; diese Änderung adressiert sie.
Eine erneute unabhängige Nachprüfung ist damit nicht vorweggenommen.

Die versiegelten Pläne und hashverketteten Ereignisse aller Batches desselben
Qualitätsstores bilden eine abgeleitete variantenspezifische Sicht. Ein gemeinsamer
Batch-Schreiberlock serialisiert ihre Entscheidungen zusätzlich zu den bestehenden
Storelocks. Es gibt keine zweite Revisionsablage und keine Umschreibung alter
Ereignisse. Vollständig negative Reparaturnachweise werden gegen Produktionsrevision,
Readerantwort, Vergleich, unabhängige Reviewantwort, Methode und tatsächlichen
Kontext geprüft und nach Revisionshash dedupliziert. Ein neuer Batch setzt ihre
Zählung nicht zurück. Bei Fortschreibung der eigenen Episode darf lediglich deren
Selbstreferenz im Serienkontext mitwandern; andere Kontextrevisionen und die
Methode müssen für die Zählung übereinstimmen. Positive/ADVISORY-Durchläufe,
fehlende Stufen, Transportfehler und ungeprüfte Patchvorfahren zählen nicht.

Eine nach zwei passenden vollständigen Fehldurchläufen rechtmäßig verworfene
Variante bleibt auch in einem anderen Batch oder nach einem Methodenwechsel
terminal. Historische negative Belege werden hierfür mit ihren ursprünglichen
Bindungen und Bytes verifiziert; sie werden nie als aktuelle Qualifikation oder
aktuelle Stufenwiederverwendung ausgegeben. Fehlende/beschädigte Historie führt zu
einem technischen Fehler statt zur Reaktivierung. Ersatzbeziehungen und bereits
verbrauchte Ersatzbudgets werden über Batchgrenzen nachvollzogen. Ein wartender
Ersatzauftrag wird mit seiner ursprünglichen Identität weiterverwendet; der neue
Variantenstand beginnt unverändert bei Revision 1. Unabhängige Varianten/Fälle
bleiben getrennt.

Ein frischer Klärungsreader erhält ausschließlich im privaten Sidecar einen Bezug
auf den konkreten früheren Reviewerjob und dessen Item. Keine frühere Bewertung
oder Klärungskennzeichnung wird dem öffentlichen Readerjob hinzugefügt. Genau
diese Bindung erlaubt die Wiederverwendung seiner angenommenen Antwort und des
Vergleichs, während der Klärungsreviewer noch offen ist. Der neue Batch exportiert
nur die fehlende Rolle unter den bestehenden Job-/Itembezügen. Auch offene Jobs
können dabei weiterverwendet werden, ohne aus fehlenden Antworten Erfolg abzuleiten.
Mehrere Auslegungsverläufe werden als getrennte, zusammenhängende Nachweisketten
behandelt; ursprüngliche Erstlesungen dürfen nicht zu frischen Klärungen werden.
Der vergleichende Reviewer bleibt an genau die alten/neuen Belege seiner Kette
gebunden. Mehrfach referenzierte Jobs zählen im Aufwand weiterhin nur einmal.

Die Implementierungsänderung erzeugt einen neuen Qualitätsmethodenhash. Die
bestehende korrekte private Produktionsrevision 2 bleibt mit ihrem bisherigen Hash
und sämtlichen Spielertextbytes gültig. Nur der frühere Readerexport ist unter
seinem alten Methodenstand historisch. Ein neuer getrennter Export bindet dieselbe
unveränderte Revision an neue Jobkennungen; keine alte Antwort wird umetikettiert,
kein Produktionsimport und keine neue Textrevision ausgeführt.

## Teilantworten bestehender Mehritemjobs (Nachreview von d461120)

Die unabhängige Nachreview bestätigte die batchübergreifenden A/B-Korrekturen.
Die zusätzliche Übernahme noch offener Mehritemjobs führte jedoch zu einer
Transportregression. Neue Arbeit übernimmt offene Jobs deshalb nur bei genau
einem Item; tatsächlich angenommene Stufen bleiben auch aus Mehritemjobs unter
ihren ursprünglichen Bezügen wiederverwendbar. Andernfalls entsteht ein regulärer
Einzelitemjob für die tatsächlich fehlende Rolle, ohne neue Antwortschemafamilie.

Bereits versiegelte d461120-Batchpläne bleiben unter genau ihrem bekannten
Batchmethodenhash und unverändertem Qualitätsmethodenhash ausführbar. Plan und
Worksnapshots werden nicht umgeschrieben. Unbekannte Batchmethoden und abweichende
Qualitätsmethoden bleiben gesperrt. Start mit demselben Plan ist idempotent.
Mehrere offene Work-Items desselben historischen Jobs transportieren dessen
vollständiges unverändertes Rollenpaket einmal pro Exportwelle. Die Itemliste im
bestehenden Transportmanifest benennt ausschließlich die aktuell benötigten Items;
sie ist kein neuer Job oder Modellantwortvertrag. Bei Teilfortschritt ändert sich
diese Liste, ohne erledigte Items erneut anzufordern. Die Antwort darf
weiterhin nur vollständige einzelne Items enthalten. Fehlende Geschwister sind
kein Transportfehler. Ein gültig angenommenes Geschwisteritem schließt weder die
adressierte andere Workrolle noch den gesamten Batch; maßgeblich ist der tatsächliche
Qualitätsnachweis je benötigtem Item. Identische Wiederholungen desselben Jobs
werden nicht erneut importiert oder als technischer Fehler gezählt, auch wenn zwei
persistierte Work-IDs auf diesen Job zeigen. Fremde/ungültige Antworten bleiben
abgewiesen; gültige Teilannahmen und ursprüngliche Herkunft bleiben erhalten.

Dieser Fix ändert ausschließlich die Batchorchestrierung. Der Qualitätsmethodenhash
und die bestehende separate Readerbindung von d461120 bleiben gültig; der neue
Batchmethodenhash ist ein eigener Orchestrierungsbezug. Es gibt keinen Anlass für
neue Readerjobs, Produktionsimporte oder Revisionen an den privaten Beständen.
Die erneute unabhängige Nachprüfung des Transportfixes steht aus.

## Belegte alte Transport-Fehlzählungen (Nachreview von f8c3ea0)

Die unabhängige Nachreview bestätigte den übrigen Transportfix und die A/B-
Garantien. Bereits unter d461120 aufgezeichnete falsche Transportfehler konnten
jedoch das aktive Budget weiterhin erschöpfen. Der Batch leitet dieses Budget
jetzt aus der unveränderten Historie ab; es gibt keinen Reset, Ersatzbatch oder
Umschreiben angenommener Antworten und keine Korrekturereignisse.

Nur der bekannte d461120-Batchmethodenstand bei unveränderter Qualitätsmethode
kommt für diese enge Neubewertung infrage. Der genaue Fehler muss mit dem
versiegelten Workauftrag, der ursprünglichen Revisions-/Item-/Kontextbindung,
den unveränderten abgelehnten Antwortbytes samt Hash und dem deterministisch
zugehörigen Qualitätsimport verknüpft sein. Die vorhandene Qualitätsprüfung
verifiziert Paket, Quelle, Methode, Antwortschema und angenommene Ergebnisse;
bei Reviewerjobs einschließlich der ursprünglichen Readerabhängigkeit. Der
konkrete Import muss das benötigte Item bereits vor dem Fehlereignis gültig
angenommen haben, ohne Itemfehler und mit tatsächlich fehlenden Geschwistern.
Allein eine spätere andere gültige Antwort oder ein passender Fehlertext genügt
nicht. Unklare, fehlende, beschädigte oder anders gebundene Belege berechtigen
zu keiner Neutralisierung. Echte Fehler behalten ihre Budgetwirkung.

`effort.technicalFailures` zählt die wirksamen Fehler; `historicalTechnicalFailures`
die insgesamt aufgezeichneten und `correctedHistoricalTechnicalFailures` die
belegten alten Fehlklassifikationen. Diese Standardzähler enthalten keine Texte
oder Referenzen. `details.technicalFailureBudget` bindet jede korrigierte
Klassifikation an Ereignishash/-sequenz, Work/Job/Item, exakten Import und
Antwort-/Methoden-/Quellen-/Kontextnachweis. Die Ableitung wird nach Reload erneut
verifiziert. Alle drei Wiederholungsfehler derselben belegten Teilantwort werden
unwirksam, ohne Importe, Jobs oder Korrekturereignisse zu vervielfachen. Fachliche
Verwerfung aufgrund tatsächlicher Inhaltsmisserfolge bleibt davon unberührt.

Versiegelte f8c3ea0-Batchpläne bleiben ebenfalls bei identischer Qualitätsmethode
kompatibel, erhalten aber keine pauschale Fehleramnestie. Der Qualitätsmethodenhash
und die bestehende separate Readerbindung von d461120 bleiben unverändert gültig.
Die erneute unabhängige Nachprüfung dieser Budgetkorrektur steht aus.
