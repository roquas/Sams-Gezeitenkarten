# F02-B – episodischer Serienvertrag und manuelle Rollenübergabe

Dieser Folge-PR baut auf main `f760e1cd05c6fe2341e70724fea3dbc8e9f9add6` und dem
integrierten PR134-Head `95f510fcd4dcc84b8df670da35c35e48e28692a9` auf. Er verändert
keine Produktionsgeschichte, Originalhinweise, Karten, Namen oder Auswahl-/Releasegates.

## Zwei Prüfebenen

Neue reguläre Serieninputs tragen `seriesContext.version: 2`. Ihre aktuelle Folge
hat eine opake `currentEpisodeId`; `order` bindet die Reihenfolge. `episodes` enthält
ausschließlich die anderen Folgen, jeweils mit vollständigem unverändertem Spielertext
und inventargebundener `chartRef`/`chartSha256`. Alle öffentlichen Karten einschließlich
Start, Etappen, ganzer Objektflächen, Namen und Assets liegen einmal je Paket vor.
Die eigene Episode wird nicht nochmals als Kontexteinheit dupliziert.

Die eigenen Titel-/Intro-/Hinweisfelder bleiben eigenständige Texteinheiten. Claims
im `current-episode`-Scope haben genau die aktuelle Episodenkennung. Formalisierte
Atome und äußere H-IDs gehören ausschließlich zu deren Karte; derselbe H-/geo-Name
in einer anderen Folge hat keinen impliziten Bezug. Der vorhandene isolierte
Enginevergleich prüft weiterhin ausschließlich jeden eigenen Hinweis 1:1 gegen
sein eigenes Original. Keine neue Engine und kein fremder Routenraum.

Jede fremde Episode bildet eine vollständig enthaltene Kontexteinheit. Die Aufgabe
ist ihre Beziehung zur aktuellen Fahrt, nicht eine erneute vollständige mathematische
Rekonstruktion ihrer Hinweise. Ein fremder, nur kontextueller Claim darf ausschließlich
seine Episode adressieren und keine Atome oder lokale clueId enthalten. Echte
Übertragung, aktuelle Zusatzbedingungen, ausgelagerte Informationen, Widersprüche
und vorweggenommene Deduktionen sind weiterhin aktuelle mathematische/potenzielle/
Interaktionsclaims; nicht darstellbare Bedeutung bleibt unresolved. Sie dürfen nicht
als `context` verschwinden.

Reader UND Reviewer müssen für jede fremde Folge ein explizites `series`-Urteil
mit Einheiten-/Evidenzbezug liefern. Der Reviewer erhält die öffentlichen fremden
Karten-/Textfakten, aber nur lokale Originalhinweise. `series-independence` ist ein
zusätzlicher Pflichtcheck. Jede Abhängigkeit, Zusatzbedingung, Widerspruch,
Deduktionsvorwegnahme oder Unsicherheit bleibt blockierend. `context-only` ist nur
für tatsächlich fremde context-Claims unter deren eigener Faktenkennung zulässig.
`public.episode` ist eine Scopeangabe und autorisiert keine Mathematik. Nur konkrete
aktuelle öffentliche/Originalfakten können aktuelle zusätzliche Aussagen autorisieren.
Öffentliche Karten-/Startfakten werden dabei nicht zu privaten Lösungen erklärt.

## Ehrliche Methodentrennung

Der Standardumschlag bleibt `transportVersion: 1`; das jobgebundene Schema drückt
die neuen Scopefelder und Serienurteile vollständig aus. Methode und
Implementierungsfingerprint ändern sich. Alte Antworten werden niemals auf neue
Hashes umgebunden. Historische Version-1-Eingaben bleiben für ihre ursprünglichen
Belege lesbar; die historische Negativnachweisprüfung rekonstruiert deren tatsächliche
alte Kontextprojektion ausschließlich zur Verifikation terminaler Verwerfung.
Das erlaubt keine aktuelle Qualifikation unter einer fremden Methode.

Die zehn bereits akzeptierten unabhängigen Reader und ihre 48 eigenen Vergleiche
laufen mit den schon exportierten regulären Reviewerjobs unter dem gepinnten
PR134-Verfahren weiter. Der manuelle Transport kann mehrere unveränderte Jobs in
einem Rollenchat bündeln; seine PNG-/Lesefassungen ändern weder jobId, inputHash,
Antwortschema noch angenommene Rohbytes. Der Operatorplan benennt explizit den
Gitcommit und die getrennte Runtime. Falscher Commit oder veränderte getrackte
Runtime-Dateien führen zum Abbruch, nicht zu geratenen Methoden.

Die fünf alten Serienantworten bleiben unveränderte Diagnosebelege. Ihre separaten
23 äquivalenten eigenen Vergleiche sind keine neue Serienqualifikation. Nur für diese
fünf Episoden werden frische korrigierte Readerjobs vorbereitet; kein Neustart aller15.

## Bedienung

Der neue Einstieg ist `scripts/flavor-handoff.mjs refresh|import --plan FILE`.
Der private Plan enthält je Prüfbereich den gepinnten Codecheckout, Commit,
Produktions-/Qualitätsstore, Kartenbibliothek und bestehende Batch-ID. Der Batch
bleibt die Autorität für Fortschritt, Herkunft, Reparatur-/Verwerfungsgrenzen,
Klärung und technische Budgets. Die neue Schicht verwaltet nur Zuordnung und
Darstellung der vorhandenen Rollenjobs. Producer-/Repairarbeit wird nicht in die
Reader-/Reviewergruppen gemischt oder extern ausgeführt.

`refresh` erzeugt einen statischen nummerierten `START.html` samt `STATUS.json`.
Die Übersicht enthält keine Storytitel/Pointen. Zuerst R01 (zwei Serienfolgen) und
V01 (zwei vorhandene Einzelgeschichten) nach technischer Review erproben. Erst dann
die übrigen vorbereiteten Gruppen benutzen. Jede Gruppe hat:

- einen exakt kopierbaren Starttext mit Rolle, Nummer und Umfang in der ersten Zeile;
- ein ZIP aus unveränderten regulären Rollenjobs und einer klaren Arbeitsliste;
- eine direkt anhängbare lineare HTML-Lesefassung mit sämtlichen normativen
  Aufgaben/JSONs/Schemas/Regeln und eingebetteten PNGs;
- zusätzlich direkt anhängbare PNG-Gesamtkarten mit Koordinaten, Startmarkierung
  und vollständiger öffentlicher Namens-/Objektflächenlegende;
- nummerierte Einzel-Fallbacks mit denselben Orientierungshilfen, alternativ statt
  zusätzlich zur Gruppe auszuführen.

Gleiche Rolle darf mehrere unabhängige Episoden in einem frischen Kontext prüfen.
Reader, Reviewer und Producer werden niemals gemischt. Gruppen sind konservativ
auf maximal zwei benötigte Items begrenzt; gleiche Methoden werden zusammengehalten.
Die beobachteten 15 Readerantworten lagen ungefähr bei14–56KB, die vorhandenen
historischen Reviewerantworten bei46–51KB je Episode. Zwei reguläre Ausgabedateien
bleiben ein kleiner erster Praxistest; es gibt kein Versprechen für15Episoden in
 einer Antwort oder unbekannte Modell-/Downloadfähigkeiten. Neue Serienaufgaben
verlangen deutlich weniger wiederholte fremde Mathematik, müssen aber real erprobt
werden. Bei konkreten Datei-/Ausgabegrenzen wird gestoppt oder der nummerierte
Einzel-Fallback genutzt; kein stilles Kürzen oder neues Ergebnisformat.

PNG/Lesefassung werden ausschließlich aus der zulässigen öffentlichen Projektion
abgeleitet. Die vollständigen ursprünglichen SVG-/Assetbytes bleiben im ZIP. Die
abgeleiteten PNGs, alle Originaldateien und die Quelleninventare sind gebunden.
Die Grafikproduktion benutzt die bestehenden SVG-/Hexkoordinaten, Pillow/numpy und
liefert reine PNGs ohne übernommene Quelldatei-Metadaten. Mehrhexflächen und Namen
werden vollständig in der Legende ausgewiesen. Gemeinsame Serienkarten und
Kontexttexte werden in der Lesefassung zusammengeführt, nicht blind vervielfacht.
Alle Laufzeitressourcen sind lokal bzw. direkt eingebettet; kein Browserchat-Automat.

## Rückgaben und Wiederaufnahme

Alle heruntergeladenen Standard-JSON-Dateien unverändert in EINEN `EINGANG` legen.
Beliebige Dateinamen und OS-Downloadsuffixe sind zulässig. `IMPORT.command` bzw.
`node scripts/flavor-handoff.mjs import --plan operator-plan.json` ordnet ausschließlich
über jobId/stage/itemId und verifizierte gespeicherte Bindungen zu. Modelle und
Produktionszeiten bleiben unbekannt/null. Es gibt keinen filenamebasierten Matcher.

Rohbytes werden vor dem Parsen unveränderlich archiviert. Gültige vollständige
Teilitems bleiben erhalten; andere Jobs können gemeinsam verarbeitet werden.
Duplikate werden idempotent erkannt. Auch ein erneut eingelesener defekter Download
verursacht keine weitere Batch-Fehlzählung. Fremde Jobs, Bindungsfehler, defektes JSON
und widersprüchliche Wiederholungen werden getrennt und spoilerarm gemeldet,
ohne angenommene Daten zu überschreiben. Links/Unterordner werden nicht verfolgt.
Aktuelle Bindungen werden vor Wiederverwendung erneut geprüft; alte Stände dürfen
keine neue aktuelle Qualifikation vortäuschen.

Danach wird der bestehende Batch fortgesetzt: vollständige Reader führen zum
Vergleich und fehlender Reviewerarbeit. Technisch erschöpfte Budgets werden sichtbar
als blockiert angezeigt, nicht als erledigt. Nach neuer echter Readerarbeit entstehen
weitere nummerierte Reviewergruppen; vorher werden keine Ergebnisse erfunden.
Synthetische Bedienproben laufen ausschließlich auf Kopien mit expliziter
`technical-test`-Herkunft. Sie dürfen keinen semantischen Produktivnachweis erzeugen.

## Lieferung und Reproduktion

Der private Lieferstand enthält vollständige Originalarchive, getrennte Arbeitsstores,
beide gepinnten Code-Runtimes, Pythonumgebung, Startübersicht, alle aktuellen Pakete,
Eingangs-/Rohdatenordner, Größen-/Integritätsnachweise und eine Abschlussnotiz.
Die Runtime-Commits, tatsächlichen aktuellen Testzahlen und CI stehen im PR und im
Lieferbeleg. Produktionsdaten und echte Antworten werden nicht ins öffentliche Repo
committet. Die lokale Übersicht ist ausschließlich für die Bedienperson; in einen
Rollenchat gehören nur die dort bezeichneten Rollenpakete/Lesefassungen und Bilder.

Die nächste echte kleine Bedienprobe führt der Nutzer nach unabhängiger Review aus.
Empirische Reader-/Reviewerqualität und Downloadkomfort sind bis dahin offen.
Keine Auswahl, Veröffentlichung, Deployment, Modellaufrufe, neuer Provider oder Merge.
