# B1: lokaler Betatest und Feedbackschema 1

## Einstieg und Quellen

`index.html` ohne Parameter zeigt die Landingpage. `?puzzle=model-demo` ist der
stabile Direkteinstieg; `?play=1` erhält den Einstieg über die zuletzt ausgewählte
Spielansicht. `?view=selection` öffnet die Auswahl und bewahrt einen ausdrücklich
gewählten Entwicklungsbestand. `?dev=b2&stock=…` bleibt der bestehende
Entwicklungseinstieg. Ein `stock` ohne `dev=b2` schaltet keinen Bestand um.
Unbekannte Direktlink-IDs führen zu einer sichtbaren Fehlermeldung, nicht zu einem
anderen Rätsel. Alle Ressourcen und Links funktionieren relativ zum URL-Präfix.

Das unveränderte Manifest und `createPuzzleLoader` bleiben die einzigen Quellen
für Katalog, Quellauflösung, Validierung, Kompilierung und Eindeutigkeit. Der dünne
Transportadapter in `src/beta/context.mjs` bewahrt nur die bereits vorhandenen
öffentlichen F02-Identitäten, die der kompilierte UI-Wert sonst verliert. Er lädt
keine Datei zusätzlich, prüft keine Lösung und erzeugt keine Fingerprints. Die
Loaderdatei bleibt wegen der historischen B2-Nachweise bytegleich.

Der reguläre Katalog enthält gegenwärtig ausschließlich „Die Probefahrt“. Es
werden keine Rätsel erzeugt oder Entwicklungsrätsel in den regulären Bestand
aufgenommen. Weitere gültige Manifesteinträge erscheinen automatisch.
Redaktionelle Schwierigkeit wird nicht angezeigt.

Die vollständige Regelquelle bleibt das vorhandene `#gameRules article` in
`index.html`. Die Landingpage zeigt eine direkt lesbare Kopie daraus. Stundenwerte
werden auf das Standardrätsel bezogen und entsprechend erläutert. Das bestehende
Logbuch mit Geschichte, Regeln, Hinweisen, Hilfen und Einstellungen bleibt erhalten.

## Getrennte Daten

- Spielstand: unverändert `src/persistence/storage.mjs`, Schlüssel aus Rätsel-ID,
  Schema- und Datenversion. Route, Notizen und Bedienzustand bleiben dort.
- Betatest: eigener Namensraum `gezeitenkarten-beta-v1:`, einschließlich dauerhafter
  Lösungsbestätigung, Bearbeitungsphasen, ungefährer aktiver Zeit und Hilfenzähler.
- Freiwilliges Feedback: eigenständige Felder innerhalb des Betatestdatensatzes;
  allgemeiner Kommentar unter einem eigenen Schlüssel ohne Rätselbindung.

Ein Spielstandreset verändert weder Lösungsbestätigung noch Feedback. Ein Wechsel
oder Schließen ist keine Aufgabe. Die ausdrücklich gewählte Feedbackangabe
„Aufgegeben“ beendet eine offene Phase; „Gelöst“ als freiwillige Selbstauskunft
ist von der nur durch die Routenprüfung gesetzten Lösungsbestätigung getrennt.
„Noch offen“ im Feedback allein startet keine neue Phase.

„Erneut spielen“ startet eine neue Phase und setzt den normalen Spielstand zurück.
Beim Wiederaufnehmen eines aufgegebenen Rätsels wird ebenfalls eine neue Phase
angelegt; dabei bleiben vorhandene Notizen und Route erhalten (`phase=resume`).
Eine bereits laufende Wiederholung kann mit „Fortsetzen“ ohne weitere Phase
wieder geöffnet werden. Die URL-Anweisung `phase=new` wird einmalig verbraucht. Vorheriges
Feedback wird unter `feedbackAtEnd` der alten Phase erhalten; das neue Formular
beginnt leer. Alte Kommentare sind auf der Landingpage lesbar. Ein gewöhnliches
Öffnen oder Neuladen legt keine zusätzliche Phase an.

Eine Rückmeldung zu einem noch nicht geöffneten Rätsel legt einen Datensatz ohne
Bearbeitungsphase an. Automatische Zähler bleiben dann leer. Beim ersten Öffnen
eines älteren Spielstands werden vorhandene Tipps und Strafpunkte übernommen;
Notizprüfungen können daraus nur als Untergrenze rekonstruiert werden, da die alte
Undo-Funktion Strafpunkte zurücknehmen kann. B1 erfindet keine frühere Lösungszeit.

## Identität und Revisionen

`identity` hat immer diese Feldreihenfolge:

`catalog`, `puzzleId`, `schemaVersion`, `dataVersion`, `rulesVersion`,
`mapStructureId`, `instanceId`, `variantId`, `sourcePublicationId`.

`catalog` ist `regular` oder ein expliziter Entwicklungsbestand wie `b2:S02`.
Nicht vorhandene F02-IDs sind `null`. `recordId` ist das JSON-Array dieser Werte in
der festgelegten Reihenfolge. Es ist ein Zuordnungsschlüssel, kein Fingerprint.
Katalog, Daten-/Regel-/Schemaversion, logische Variante und Veröffentlichungs-ID
gehen in die Bindung ein. Entfernte Rätsel werden beim Export durch Aufzählung
der gespeicherten Datensätze weiterhin berücksichtigt.

Ohne Veröffentlichungsidentität müssen fachliche oder redaktionelle Revisionen
wie im bestehenden Inhaltsvertrag eine neue `dataVersion` erhalten. B1 kann
unversionierte Änderungen unter absichtlich wiederverwendeten Identitäten nicht
erkennen und führt dafür keine konkurrierende Hashfunktion ein. Der normale
Spielstandschlüssel bleibt im bestehenden Vertrag; Betatestbewertungen sind
zusätzlich an die F02-Identitäten gebunden.

## Aktive Zeit

Zeit ist ein Näherungswert in Millisekunden (`activeMs`), je Bearbeitungsphase.
Die Summe aller Phasen ergibt die kumulierte Bearbeitungszeit des Datensatzes.
Sie beginnt beim ersten Spielen, läuft bei sichtbarem Dokument, pausiert bei
Hintergrund, manueller Pause oder 15 Minuten ohne Eingabe. „Zeit fortsetzen“ oder
eine neue Interaktion hebt die automatische Inaktivitätspause auf. Die manuelle
Pause bleibt bei Reload erhalten. Nachdenken ohne Eingabe zählt bis zur großzügigen
15-Minuten-Heuristik weiter; längere Denkphasen bleiben eine bekannte Messgrenze.

Ein monotoner Takt schreibt Deltas spätestens alle fünf Sekunden sowie bei
Interaktionen, Rätselwechsel, Hintergrundwechsel und `pagehide`. Event-Loop-Lücken
über zehn Sekunden werden als mögliche Geräte-/Browserpause nicht nachgezählt.
Nach einem abrupten Prozessabbruch können bis zu fünf Sekunden fehlen. Eine
korrekt gelöste oder aufgegebene Phase zählt beim späteren Öffnen nicht weiter.

Web Locks geben genau einem sichtbaren Tab je versioniertem Rätsel Schreibrecht
für die Zeit. Ein inaktiver oder beendeter Besitzer gibt die Sperre frei. Jede
Session bindet sich an ihre Phase; alte Tabs schreiben nicht in eine neu gestartete
Phase. Ohne Web Locks (insbesondere außerhalb eines sicheren Browserkontexts)
bleibt das Spiel spielbar; die UI meldet die fehlende Zeitmessung und exportiert
`timeTracking: "unavailable"`, statt konkurrierende Uhren zu verwenden. Unterstützte
Zeitmessung wird mit `"available"` bezeichnet. Es gibt keine Klickverläufe.

## JSON-Export

Eine Datei, UTF-8, zwei Leerzeichen Einrückung und abschließender Zeilenumbruch.
Keine Anmeldung, kein Backend, kein Upload, keine Mailzustellung. Blob-Download
auf der Landingpage; bei Speicherfehlern zusätzlich direkt in der Spielansicht.

Top-Level-Felder in festgelegter Reihenfolge:

| Feld | Inhalt |
| --- | --- |
| `feedbackSchemaVersion` | Ganzzahl `1` |
| `exportedAt` | ISO-Zeitpunkt in UTC |
| `testerId` | Zufällige, lokal gespeicherte pseudonyme Kennung |
| `application` | `name`, `version` (aktuell `0.1.0`), `catalog`, `catalogSchemaVersion` |
| `puzzles` | Alle lokalen Datensätze, nach `recordId` mit Codepoint-Reihenfolge sortiert |
| `generalFeedback` | `comment`, `updatedAt`, `revision` |

Ein Puzzle-Datensatz enthält in Reihenfolge `recordId`, `title`, `createdAt`,
`updatedAt`, `revision`, `solvedAt`, `identity`, `phases`, `feedback`.
`solvedAt` ist die dauerhafte, fachlich bestätigte Erstlösung oder `null`.
`revision` steigt bei Aktualisierungen des Datensatzes; Zeitaktualisierungen zählen
mit. Zeitstempel sind UTC-ISO-Strings, fehlende optionale Werte `null`.

Jede Phase enthält `phaseId`, `startedAt`, `endedAt`, `status` (`open`, `solved`,
`abandoned`), `activeMs`, `paused`, `hints`, `noteChecks`, `routeChecks`,
`penaltyPoints`, `timeTracking`, `feedbackAtEnd`. Zähler sind kumulativ, unabhängig
von einem späteren Zurücknehmen oder Zurücksetzen des normalen Spielstands.

`feedback` und ein vorhandenes `feedbackAtEnd` enthalten `difficulty`
(`easy`, `medium`, `hard`, `null`), `fairness` (`yes`, `partly`, `no`, `null`),
`comment`, `status` (`open`, `solved`, `abandoned`, `null`), `updatedAt`.
Das allgemeine Feedback hat eine eigene Revision und ist unabhängig exportierbar,
auch bei leerem `puzzles`-Array. Rückmeldungen ohne Bewertung sind gültig.

Spätere Auswertung: anhand `(testerId, recordId)` zuordnen, den jüngeren
Datensatz anhand `revision` und `updatedAt` ersetzen, Phasen über `phaseId`
identifizieren; kumulierte Zeiten oder Zähler verschiedener Exporte **nicht
addieren**. Allgemeines Feedback nach `(testerId, generalFeedback.revision)`
aktualisieren. Exportzeitpunkte sind keine neuen Rückmeldungsidentitäten.
Unbekannte Erweiterungsfelder aus der Browserspeicherung werden nicht exportiert.
Keine Route, Notizmatrix, vollständige Lösung oder private Generatordaten im Export.

## Speicherung und Fehler

Änderungen auf der Landingpage werden unmittelbar lokal gespeichert. Im
Erfolgsdialog wird ein freiwilliger Entwurf erst mit „Feedback speichern“
übernommen; Schließen, Escape und Überspringen verwerfen ausschließlich diesen
Entwurf. Die korrekte Lösung ist dann bereits unabhängig bestätigt.

Gesperrter Speicher, Quota-Fehler und unlesbare Daten erzeugen eine sichtbare
Meldung, keine falsche Speicherbestätigung. Nicht gespeicherte Änderungen bleiben
für einen sofortigen Export im aktuellen Dokument erhalten. Unlesbare vorhandene
Werte werden nicht überschrieben. Bei nicht gesichertem Spielstand verlangt ein
bewusster Wechsel eine ausdrückliche Entscheidung. Bei komplett deaktivierter
Speicherung kann auch die Testkennung über einen Reload hinweg nicht garantiert
werden. Die Anwendung behauptet dies nicht.

## Dialog und Abgrenzung

Native `<dialog>`-Semantik, eindeutiger Ergebnistitel, Textbeschreibung, sichtbare
Schließenaktion, Escape, explizite Tab-Fokusführung und Rückgabe an den Prüfbutton.
Beide `resultTexts` sind unabhängig optional; bestehende neutrale Rückfalltexte
verraten bei falscher Route keine Lösungsinformation. Die bestehende
`rules.legal && clues.every(rules.matches)`-Entscheidung bleibt die einzige Prüfung.
Keine neuen Illustrationen oder Animationen; die späteren grafischen Wünsche aus
Issue #35 bleiben offen. Die statische Fassung funktioniert auch bei reduzierter
Bewegung.
