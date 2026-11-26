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
bestehende `revisionRef`-Objekte, tatsächlichen Serienkontext und endliche Budgets:

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
Die lokale Fehlermeldung ist eine Formatdiagnose, kein Reader-Reparaturziel.

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
Verspätete Antworten bleiben als lokale Transportbelege erhalten und können
keine verworfene Variante reaktivieren. Widersprüchliche Wiederholungen werden
vom bestehenden Qualitätsstore abgewiesen. Ein vorhandener atomarer
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
Andere Textfelder, Karten, Namen, Start, Regeln und Logik bleiben erhalten.

`importScopedRepair` archiviert exakte Patchbytes, Autorisierung und klar
unterschiedene externe bzw. menschlich-redaktionelle Herkunft. Abgeleitete
Records werden bei jedem neuen Lesevorgang aus ihrem echten Vorgänger plus
Patch rekonstruiert und geprüft. Geerbte Erzählmetadaten sind ausdrücklich als
geerbt markiert. Alte Produktionsrecords werden unverändert versionsgetreu
gelesen. `resolveRevisionContext` liefert auch für Patchrevisionen den
validierten effektiven Position-Intent für Auswahl und Materialisierung.
Dies führt keine Auswahl oder Veröffentlichung aus.

Nach zwei vollständig geprüften erfolglosen Reparaturrevisionen wird die
Variante verworfen. Die Ersatzproduktion verwendet den normalen F02-A-Vertrag,
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
`technical-test` für alle Ergebnisse. Technische Herkunft bleibt auch über
Produktionsreparaturen/Ersatz erhalten und kann keine reale Qualifikation
bewirken. Die Testimplementierung ist in den Regressionen ausführbar; sie ist
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
