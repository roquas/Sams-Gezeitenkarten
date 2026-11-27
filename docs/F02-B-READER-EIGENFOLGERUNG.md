# Version 2: vollständige Ergänzungsnachweise und expliziter Storeanschluss

PR136 v1 war ein separater Einzelclaim-Befund ohne Storequalifikation. Version 2
ersetzt diesen Vertrag: pro Episode werden alle ausschließlich mit
`additional-mathematics:<claimId>` blockierenden Claims gebunden. Jeder Claim
verlangt seine eigene unabhängige Herkunfts-/Informationsgrenzenbeurteilung und
seine exakt aus lokalen Hinweis-Einheiten gebundenen Originalhinweisprämissen.
Mehrere solche Prämissen sind zulässig; nicht ausgewiesene Hinweise, gespeicherte
Zielrouten und fremde Episodenmathematik werden nicht verwendet. `meaning` ist kein
Wahrheitsbeweis und wird nicht nach Schlüsselwörtern durchsucht.

Die Engine enumeriert legalen Grundraum unter Karte/Start/Etappen und genau den
Prämissen des jeweiligen Claims. Alle Atome müssen auf sämtlichen Prämissenrouten
gelten. Leerer Prämissenraum, Gegenbeispiel und unvollständige Suche blockieren.
Das ist nur die mathematische Hälfte: tatsächliche Spielerzusätze oder vorgezogene
Deduktion werden auch bei bewiesener Gesamtimplikation nicht autorisiert. Herkunft,
Nicht-Hinweiseinheiten, Informationsgrenzen und sonstige Bedenken bleiben eigene
notwendige Reviewerurteile. Eine Episode mit drei blockierenden Claims benötigt
alle drei vollständigen Beurteilungen, keine Teilfreigabe.

Neue und eingefrorene historische Antwortrohbytes werden vor der Bewertung mit
`parseQualityResponse` geprüft: ungültiges UTF-8, doppelte (auch verschachtelte)
Schlüssel und mehrdeutige Umschläge sind kein Nachweis. Originalrohbytes werden
niemals bereinigt, Dispositionen/Hashes niemals umgeschrieben. Die Vorbereitung
friert das vollständige historische Jobpaket und die Originalantwort ein. Das neue
Rollenpaket enthält keine früheren Reviewerurteile oder gewünschten Ergebnisse.

## Qualifikation und reguläre Fortsetzung

`openInferenceConnection` ist ein opt-in Storeblick mit eigener versionierter
Methode `f02b-inference-store-connection-1` und dem neuen Vertragsfingerprint.
Der originale Store, seine Methode, Befunde, Jobs und Importreceipts bleiben
unverändert. Im neuen Blick heißt eine abweichende Qualifikation ausdrücklich
anders und enthält `legacyResult` sowie den gebundenen Ergänzungsnachweis.

Vor jeder Ableitung prüft der Anschluss die akzeptierte Reviewerantwort, ihre
Originalrohbytes, den zugehörigen Reader, Vergleich, Revision, Kontext und
Quellbindungen durch die tatsächliche gepinnte Qualitätsruntime. Nur eine aktuelle
vollständige Kette mit regulärer Herkunft kann echt qualifizieren. Technische
Reader-/Reviewer-/Produktionsherkunft, technische Ergänzungen, unvollständige
Antworten, andere offene Gründe, geänderte Bindungen, beantwortete nachfolgende
Klärungen und verworfene Varianten dürfen nicht aufgewertet werden. Ein bloßer
Methodenwechsel erzeugt keinen PASS. Ergänzungsreceipts sind versiegelt; ein
technischer Import kann nicht durch Wiederholung als external-manual umetikettiert
werden. Konflikte werden abgewiesen, identische Wiederholung ist idempotent.

`connectInferenceBatch` verwendet die normale gepinnte Batchlogik mit diesem
expliziten Qualitätsblick. Nach vollständigem echtem Nachweis wird die Episode
regulär qualified; der alte Qualifier ohne Anschluss bleibt blockiert. Offene
Ergänzungen erhalten `waiting-inference`/`heldWork`; ihre Klärungsreader werden
nicht als neue Modellarbeit exportiert. Bestehende Work-/Exporthistorie bleibt
sichtbar, gültige Teilitems anderer Jobs werden weiter bedient. Auswahl und
Veröffentlichung sind keine Funktion des Anschlusses.

## Bedienung auf separatem Fortsetzungsstand

```
node scripts/flavor-reader-inference.mjs prepare BINDING.json NEW_OUTPUT PYTHON
node scripts/flavor-inference-continuation.mjs import CONTINUATION.json
node scripts/flavor-inference-continuation.mjs resume CONTINUATION.json
```

Der Fortsetzungsplan muss `version:1`, `mode:isolated-continuation`, `operatorPlan`
und `cases:[{datasetId,package}]` enthalten. Produktions-/Qualitätsstores sowie der
Operatorplan müssen physisch im isolierten Fortsetzungsroot liegen; Bibliotheken
und gepinnte Runtimes dürfen unveränderte dauerhafte Lesequellen sein. So wird kein
bestehender Arbeitsstand durch einen versehentlich übernommenen Pfad beschrieben.
`evidenceKind` ist normalerweise external-manual; technische Proben verwenden
technical-test ausschließlich auf Kopien.

Alle sechs Episoden/acht Claims des belegten Bestands werden als drei überschaubare
Zweiergruppen vorbereitet. Das frühere E01 ist **ersetzt**, bleibt unverändert als
v1-Beleg erhalten und darf nicht still auf v2 umetikettiert werden. Vollständige neue
JSON-Dateien kommen ohne Umbenennen in den neuen gemeinsamen EINGANG. Job-/Input-/
Methodenbindung entscheidet; unbekannte/defekte Dateien werden getrennt archiviert.
Alte gültige Reader-/Reviewerbelege werden weiterverwendet, keine Readerneustarts
allein wegen dieser Vertragslücke. Erst unabhängige Review; keine echten Modellaufrufe
im Implementierungsauftrag. Die technische Kopie ist kein empirischer Qualitätsbeleg.

Der gemeinsame neue EINGANG nimmt auch reguläre Reader-/Reviewerantworten auf.
Diese werden nach strikt geprüfter Identität an den vorhandenen regulären
Importpfad mit Batchbindung und dessen Herkunfts-/Teilantwortregeln weitergereicht;
sie werden nicht als Ergänzungen interpretiert. Offene oder unbekannte Dateien
ändern keine Qualifikation. Ein positiver Ergänzungsbefund und die anschließende
normale Fortsetzung laufen damit im selben expliziten Qualitätsblick.

Der gelieferte Fortsetzungsstand ist ein Snapshot. Bei parallel eingegangenen
regulären Antworten müssen diese vor der operativen Übernahme ebenfalls über den
neuen Importer eingelesen werden. Neue Revisionen, andere Quellen oder bereits
beantwortete Klärungen verlangen eine erneute explizite Bindungsprüfung; nie
laufende Stores oder Identitäten still überschreiben. Serienarbeit außerhalb der
betroffenen Legacyepisoden bleibt im vorhandenen separaten Arbeitsstand.

Beim lokalen Export wurde außerdem ein konkreter Renderer-EOF-Hänger diagnostiziert.
Der reine öffentliche Rendererinput kommt nun aus einer endlichen temporären Datei,
mit Zeitbegrenzung und anschließender Löschung. Karten-/Namensdaten und mathematische
Verträge ändern sich dadurch nicht. Die PNG-Regression prüft den dateigestützten
Eingang und weiterhin vollständige Karte/Legende sowie Metadatenfreiheit.
