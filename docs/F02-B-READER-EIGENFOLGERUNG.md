# Einzelhinweis und öffentlicher Start: gezielter Ergänzungsnachweis

Der alte Gatevertrag unterscheidet bei formalisierten null-clueId-Claims nicht
maschinenlesbar zwischen einer Eigenfolgerung des Readers und einer zusätzlichen
Aussage im Spielertext. Die vorhandene supported-Ausnahme verlangt ausschließlich
Hinweiseinheiten und mindestens zwei Hinweise. Ein öffentlicher Start in einer
Einleitung plus ein Hinweis fällt folglich heraus. Eine Begründung in meaning
ist kein Herkunftsbeweis und wird nicht nach Schlüsselwörtern durchsucht.

Die bestehende Qualifikation und ihre Methode bleiben unverändert. Das neue,
separat versionierte Verfahren `f02b-single-hint-public-reader-inference-1` ist ein
enger Ergänzungsnachweis, keine allgemeine Impikationsautorisierung und keine
Migration alter Qualitätsstores. Es darf ausschließlich den einzelnen verbleibenden
additional-mathematics-Grund eines formalisierten Readerclaims behandeln.

Ein neuer unabhängiger Reviewer erhält den vollständigen öffentlichen Spielertext,
Karte/Regeln/Weltquellen, Originalhinweise und die unveränderte Readerantwort.
Frühere Reviewerurteile, gewünschte Einstufungen und der lokale Enginebefund werden
nicht in das Rollenpaket gelegt. Die neuen Antwortfelder verlangen explizit:

- Herkunft reader-inference/player-statement/uncertain, unabhängig vom Readertext;
- Herkunftsurteil für jede beteiligte lokale Nicht-Hinweiseinheit;
- exakt einen lokalen Originalhinweis und konkrete öffentliche Prämissenbezüge;
- erneute Urteile zu Zusatzinformation, Deduktionsvorwegnahme, Selbstständigkeit
  und möglichen anderen offenen Bedenken.

Nur reader-inference mit ausschließlich public-premise-only-Einheiten und klaren
Grenzen kann weiterkommen. Zusätzlich enumeriert die bestehende Engine alle legalen
Grundrouten unter Karte/Start/Etappen und genau diesem einen Originalhinweis. Alle
Claimatome müssen auf jeder solchen Route gelten. Andere Hinweise und gespeicherte
Lösungen werden nicht benutzt. Leere Prämissenräume, Gegenbeispiele oder ein
überschrittenes Suchbudget liefern keinen Beweis. Auch eine bewiesene Implikation
entlastet eine tatsächliche Spielertextaussage nicht: Herkunft und Informationsgrenze
bleiben unabhängige notwendige Reviewerurteile. Neue oder bisherige offene Befunde
blockieren weiter. Die bisherige Mehrhinweisregel bleibt unberührt.

`prepare` prüft den ausdrücklich gepinnten historischen Code, das vollständige
Originalpaket, Reader- und Reviewerantwortschema sowie den alten Gatebefund. Es
friert alte Job-/Item-/Input-/Methodenbindungen und Rohbytehashes in einem neuen
Job ein. `evaluate` liest und validiert diese Originale erneut und archiviert die
neuen Antwortrohbytes ohne sie umzuschreiben. Es schreibt niemals in bestehende
Produktions-/Qualitäts-/Batchstores. Seine Entscheidung benennt die neue Methode,
behält legacyResult unverändert bei und ist kein rückwirkender Legacy-PASS.
Technische Antworten können nur technicalWouldSupport ergeben. supportedUnderSupplement
verlangt explizit external-manual-Herkunft und benennt ausschließlich den neuen
Ergänzungsbefund. qualified bleibt immer false: Die CLI prüft keine Importreceipts
oder vollständige Herkunftskette aus einem lebenden Store und darf deshalb auch
keine geerbte technische Evidenz zu echter Qualifikation aufwerten. Die bestehende
Storeautorität, Herkunftssperren und alte Qualifikation bleiben unangetastet. Auch
ein positiver echter Ergänzungsbefund ist keine automatische Batchfortsetzung,
Auswahl oder Veröffentlichung.

Bedienung (private Bindungspfade, niemals öffentlich committen):

```
node scripts/flavor-reader-inference.mjs prepare BINDING.json NEW_OUTPUT PYTHON
node scripts/flavor-reader-inference.mjs evaluate OUTPUT RESPONSE external-manual
```

BINDING enthält runtime, commit, jobDirectory und response. Nur E01/ gehört in den
neuen frischen Reviewerchat; operator-binding.json und private-evidence/ bleiben
lokal. E01-LESEFASSUNG.html ist selbstständig; die PNG ist direkt anhängbar. Der
Starttext bittet ausdrücklich um den Titel E01 · Reviewer. Auch reguläre zukünftige
Gruppenstarttexte bitten um Nummer/Rolle als Chattitel; IDs bleiben Autorität.
Bestehende ausgelieferte Runtimes und Exporte werden dadurch nicht verändert.

Für den betroffenen Bestandsfall ist genau diese eine neue unabhängige Beurteilung
vorbereitet. Kein Readerneustart, keine Dispositionskorrektur, keine Storyreparatur.
Bis zur echten Ergänzungsantwort bleibt der Legacybefund blockiert. Die Fortführung
bisheriger gültiger Nachweise und laufender anderer Rollenpakete bleibt getrennt.
