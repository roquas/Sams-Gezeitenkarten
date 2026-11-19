# S04-A – Etappendiagnostik und dauerhafte Spielbeobachtungen

**Repository:** `roquas/Sams-Gezeitenkarten`
**Ausgangsbasis:** aktueller `main` nach PR #111
**Arbeitsmodus:** Implementierung auf eigenem Feature-Branch, PR gegen `main`

## 1. Ziel

Verbessere die Fähigkeit unseres Diagnoseapparats, unterschiedliche **menschlich nachvollziehbare Lösungsverläufe** zu beschreiben.

Ausgangspunkt ist die unabhängige S03-Auswertung vom 19.11.2026:

`/workspace/analysis/s03-2026-11-19/bericht.md`

Falls dieser Pfad im neuen Arbeitskontext nicht verfügbar ist, den Bericht als Eingabe anfordern beziehungsweise auf die beigefügte Kopie zurückgreifen. Keine fehlenden Analyseergebnisse rekonstruieren oder erfinden.

Die Analyse hat gezeigt:

- Vollständige lokale Auflösung garantiert keinen angenehmen Lösungsverlauf.
- Viele markierbare Ausschlüsse oder zertifizierte Wiederverwendungen garantieren keine gute Etappenstruktur.
- Zwischen lokalen Feld-/Nachbarkantenmengen und mehrstündigen Routenbeziehungen besteht eine nachgewiesene Informationslücke.
- Frühe Anker sind hilfreich, aber nicht zwingend erforderlich.
- Gut spielbare Rätsel können einfache geometrische Abschlüsse, kurze gekoppelte Prüfungen oder komplexere verzahnte Teilaufgaben enthalten.

**Ziel von S04-A ist eine beschreibende, überprüfbare Etappendiagnose – noch keine automatische Qualitätsbewertung.**

## 2. Zuerst: Bestehende Architektur prüfen

Untersuche die vorhandenen B2-/S03-Diagnosen, Profilversionen, Trace-Zertifikate, lokalen Feld-/Übergangsmengen und exakten Solverprojektionen.

Bestimme, welche bestehenden Informationen sich unmittelbar wiederverwenden lassen.

Bevorzuge eine additive Diagnoseansicht gegenüber einem Umbau des vorhandenen Deduktionsapparats.

Keine neuen lokalen Deduktionsregeln, kein neuer Solver und keine Änderung der Rätselgenerierung.

## 3. Dauerhafte Erfassung menschlicher Spielbeobachtungen

Erstelle im Repository eine kleine, versionierte und gut lesbare Sammlung der bisher tatsächlich dokumentierten menschlichen Spieltests.

Insbesondere:

- S02-A: ein Hinweis löst praktisch alles; langweilig.
- S02-B: eher langweilig, wenig echte Entscheidungen.
- BC-C: gelungener Kombinationsfall mit markierbaren Zwischenfortschritten.
- S02-D: anspruchsvoller Fall mit gekoppelten Alternativen, gelegentlich akzeptabel.
- POSITIVE V1/V2: angenehm, aber einander im Lösungsverlauf sehr ähnlich.
- BC-T02/T07: teilweise frustrierende mentale Alternativenlast.
- Zehnerserie aus S01/S02/BC, einschließlich der bereits zuvor gespielten Variante.
- Alle neun S03-v2-Spieltests mit ihren konkreten menschlichen Beobachtungen.

**Notation:** H1 = Hinweis 1, S1 = Stunde 1; S0 = bekannte Startposition.

Jeder Datensatz soll mindestens enthalten:

- unveränderte Rätselkennung,
- Quelle der Beobachtung,
- ob tatsächlich gespielt oder nur technisch untersucht,
- soweit bekannt den beobachteten Lösungsverlauf,
- subjektive Gesamteinschätzung in den Worten des Spielers,
- relevante positive und negative Aspekte,
- Unsicherheiten beziehungsweise fehlende Angaben.

Trenne klar:

1. tatsächliche Aussagen des Spielers,
2. technische Feststellungen,
3. nachträgliche Interpretationen.

Keine erfundenen Bewertungen, Spielzeiten, Schwierigkeitsgrade oder Schlussreihenfolgen.

Frühere irrtümlich als „unbekannt“ geführte menschliche Beobachtungen, insbesondere zu A, B, C und D, sollen anhand vorhandener belastbarer Quellen richtig erfasst werden.

Wenn der vollständige Wortlaut einer früheren Beobachtung nicht verfügbar ist, eine ausdrücklich als Zusammenfassung gekennzeichnete, belegbare Fassung verwenden. Fehlende Details bleiben unbekannt.

Die Sammlung soll für künftige Generator- und Diagnosearbeiten direkt auffindbar und wiederverwendbar sein, ohne erneut Chatverläufe auswerten zu müssen.

Keine automatischen Qualitätslabels oder Gewichtungen daraus erzeugen.

## 4. Etappenübersicht aus bestehenden Nachweisen

Entwickle eine kompakte, nachvollziehbare Diagnoseansicht, die für ein Rätsel unter anderem zeigt:

- mögliche frühe markierbare Teilerkenntnisse,
- lokale Ausschlüsse und kleine Feldmengen,
- bekannte feste Stundenpositionen einschließlich später Stunden,
- dafür ausreichende Hinweiszusammenstellungen,
- unterschiedliche unabhängige beziehungsweise alternative Teilzeugen,
- belegte Wiederverwendung von Erkenntnissen,
- offene Stundenabschnitte,
- benachbarte Übergangskopplungen,
- relevante Beziehungen über mehrere Stunden, soweit sie nachweisbar sind.

Stelle alternative bekannte Erkenntniswege nebeneinander dar.

**Keine künstliche optimale menschliche Lösungsreihenfolge konstruieren.**

Ein technisches Zertifikat beschreibt einen ausreichenden Beweisweg, nicht zwingend einen intuitiven Denkweg.

## 5. Mehrstündige Restalternativen

Berücksichtige den nachgewiesenen Informationsverlust durch Feld- und Nachbarkantenprojektionen.

Die S03-Analyse zeigte beispielsweise einen Zustand, in dem 75 hinweiskonforme Routen existieren, die rekombinierten exakten Feld-/Kantenmengen aber 107 legale Routen zulassen.

Untersuche daher für ausgewählte Zwischenzustände, ob eine begrenzte Zusatzansicht sinnvoll ist, die beispielsweise zeigt:

- Anzahl kompatibler Teilrouten in einem offenen Stundenabschnitt,
- gemeinsame Anfangs-/Endstücke,
- gekoppelte Alternativen zwischen mehreren Stunden,
- Unterschiede zwischen lokal zulässigen und exakt unterstützten Möglichkeiten,
- bekannte kleine Anschlussmöglichkeiten an einen fixierten Abschnitt.

**Wichtig:** Diese Informationen sind diagnostische Darstellungen, keine automatisch zulässigen lokalen Deduktionsprämissen.

Vollständige Routen dürfen nicht verdeckt in die bestehenden lokalen Regeln gelangen.

Auch die Zahl kompatibler Restwege ist keine gemessene menschliche Arbeitslast.

Implementiere nur eine begrenzte, nachweisbar nützliche Ergänzung. Keine allgemeine Suche nach einem optimalen menschlichen Lösungsplan.

## 6. Prüffälle und Gegenbeispiele

Nutze ausdrücklich die dokumentierten S03-v2-Fälle:

- **01:** Sehr gut; mehrere verwertbare Teilfortschritte und produktiver Abschluss.
- **02:** Eher negativ; hohe mentale Routenlast ohne gut erkennbare Etappen.
- **03:** Okay; viele Markierungen, aber ein großer geometrischer Gesamtschluss.
- **04:** Interessante mehrstufige Routenreduktion, trotzdem kopflastig.
- **05:** Positiv und leicht trotz großer technischer Restmengen – entscheidendes Gegenbeispiel.
- **06:** Lohnend, aber anstrengend; unnötig fragmentierte H2/H3-Hinweise.
- **07:** Positives, einfaches Geometrierätsel.
- **08:** Sehr gut; verzahnte Teilrätsel, Rückwärtsschlüsse, Wiederverwendung früherer Markierungen.
- **09:** Gut; früh erkennbare späte Fixpunkte, überschaubarer Abschluss.

Zusätzlich historische Kontrollen A/B/C/D, POSITIVE V1/V2 sowie BC-T02/T07 berücksichtigen.

Keine Kennzahl entwickeln, die lediglich die neun bekannten Gesamturteile nachträglich perfekt sortiert.

Test 05 muss vor einer pauschalen Bestrafung großer Restmengen schützen; Test 08 vor einer Pflicht zu frühen Stundenfixierungen.

## 7. Ausgabeformat

Die neue Diagnose soll gut lesbar und maschinell prüfbar sein.

Erwünscht:

- kompakte Übersicht zentraler Fortschrittsmöglichkeiten,
- eindeutig referenzierte Hinweiszusammenstellungen,
- Quellenverweise auf gespeicherte Zustände und Trace-Schritte,
- getrennte lokale und exakte Aussagen,
- Kennzeichnung fehlender Teilmengen und ungeprüfter Beziehungen,
- gezielte Darstellung kleiner gekoppelter Restfälle.

Die Darstellung soll einem Entwickler oder späteren Rätselredakteur helfen, unterschiedliche Lösungsverläufe zu verstehen.

Sie darf keine versteckte Qualitätsrangliste enthalten.

## 8. Determinismus und Korrektheit

Sichere ab:

- reproduzierbare Diagnoseausgaben,
- stabile Identitäten,
- eindeutige Quellenbindung,
- korrekte Darstellung bekannter und unbekannter Teilzustände,
- unveränderte Altprofile,
- unveränderte Solver- und Deduktionssemantik,
- keine Zielroute als lokale Beweisprämisse,
- keine ungeprüfte Behauptung menschlicher Entdeckbarkeit.

Neue Aussagen mit gezielten positiven und negativen Gegenprüfungen absichern.

Falls zusätzliche Enumerationen nötig sind, feste Budgets verwenden und unvollständige Berechnungen ausdrücklich kennzeichnen.

## 9. Abgrenzung zu S04-B und S04-C

**Nicht Bestandteil dieses PR:**

- Zusammenfassung überlappender Null-/Allzählhinweise.
- Änderung der Hinweisproduktion.
- Neue Qualitätsfilter.
- Neue Gewichtungen oder Schwierigkeitsskalen.
- Automatische Serienauswahl.
- Neue Rätselgenerierung.
- GUI- oder Radaränderungen.

Diese Themen bleiben separaten Entwicklungsschritten vorbehalten.

## 10. Lieferung

1. Versionierte Sammlung menschlicher Spielbeobachtungen mit nachvollziehbarer Herkunft.
2. Additives Etappendiagnoseformat auf Basis vorhandener Daten.
3. Begrenzte Analyse mehrstündiger Restalternativen, sofern fachlich sinnvoll.
4. Positive und negative Regressionstests.
5. Reproduzierbare Beispielberichte für ausgewählte S03- und historische Kontrollfälle.
6. Dokumentation der Aussagegrenzen.
7. PR mit klarer Beschreibung der Änderungen und Nachweise.

Nach Implementierung:

- vollständige relevante Tests ausführen,
- GitHub-CI abwarten,
- PR-Nummer und fixierten Head nennen,
- unabhängige Review vorbereiten.

**Kein automatischer Merge.**

## Leitprinzip

Wir wollen nicht möglichst viele technische Schritte zählen.

Wir wollen besser erkennen, ob ein Rätsel **mehrere überschaubare, sinnvoll zusammenhängende Erkenntnismöglichkeiten** bietet – ohne einfache gute Rätsel zu benachteiligen oder einen bestimmten Lösungsverlauf vorzuschreiben.
