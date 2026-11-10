# Privat – B2 V2, Konstruktion und lokaler Lösungsweg

Enthält Lösung. Vor einem lösungsfreien Spieltest nicht lesen oder ausliefern.

## Festgeschriebener Rahmen und Budget

Basis ist main nach PR #105, `21f9bf5`. Der unveränderte Benutzervertrag wurde
vor konkreten Hinweisparametern in Commit `95024e5` festgeschrieben.
Genau eine gezielte Erstkonstruktion, null logische Überarbeitungen. Der Entwurf
`attempt-0.json` ist bytegleich zu `definition.json`. Keine Kandidatensuche,
kein Generatorlauf, keine Parameterreihen oder nachträgliche Auswahl.

Die neue Konstruktion verwendet die offene Karte und die frühen/späten
Kursbedingungen der einfachen Kontrollreferenz als Ausgangsmaterial. Gezielt
geplant wurden eine andere frühe Abstandsbedingung (3 statt 2), eine zusätzliche
einhexige Zählboje auf C2 und ein echter Zählhinweis über die Stunden 2–4.
Das sind Bestandteile des Erstentwurfs von V2, keine verschwiegenen Versuche.
Alle Motive sind bereits freigegeben, alle Hexfelder befahrbar.

Die erste anschließende Prüfung bestätigte genau eine Lösung, sechs notwendige
Hinweise und vollständige lokale Auflösung. Weglassungsroutenzahlen H1…H6:
3 / 5 / 4 / 2 / 4 / 3. Kein Konflikt zwischen Irredundanz und Verständlichkeit.

## Ein möglicher Weg mit der vorhandenen Oberfläche

Die Nummern beschreiben einen vorgeschlagenen Weg, keinen beobachteten Spieltest.
Markierungen erfolgen jeweils auf der Stundenkarte; alternative Kanten oder
gekoppelte Routensegmente müssen nicht gespeichert werden.

1. **A, H3:** Stunde 5 liegt auf D2. Sofort als feste Stundenposition markierbar.
2. **C, H2+H3:** Der Südostkurs in Etappe 5 erzwingt Stunde 4 auf D1. Dessen
   Nachbarn sind C1, E1, C2 und D2. D2 ist bereits belegt, E1 liegt vier Hex
   vom Start entfernt und ist bis Stunde 3 unerreichbar. Für Stunde 3 bleiben
   C1/C2; beide auf derselben Stundenkarte als Möglichkeiten festhalten.
3. **C, H1:** Die erste Stunde liegt neben A1, also B1/A2. Mit dem Ostkurs der
   zweiten Etappe bleiben für Stunde 2 C1/B2. Für den nächsten Schluss genügt
   diese Feldmenge einer Stunde; eine Zuordnung zu alternativen Routen ist
   nicht nötig. Beide Felder liegen genau ein Hex von der Zählboje C2 entfernt.
4. **B+D, H6:** Von Stunde 2, 3 und 4 sollen genau zwei Positionen ein Hex von
   C2 entfernt sein. Stunde 2 ist unabhängig von ihrer noch offenen Position
   ein sicherer Treffer; Stunde 4 auf D1 ist ebenfalls ein Treffer. Damit darf
   Stunde 3 kein Treffer sein. Von C1/C2 trifft C1, C2 selbst hat Abstand null.
   **Stunde 3 ist C2.** Das ist ein Zählschluss über drei Stunden mit zwei
   sicheren Treffern und Restziel null; der ursprüngliche Hinweis ist weder
   ein Nullzählhinweis noch ein Einzelstundenabstand.
5. **E, H5:** In Stunde 6 muss das Schiff neben D2 und drei Hex von E5 sein.
   Vor D verbleiben C2/E2. Weil C2 nun Stunde 3 belegt, bleibt **E2**. Die
   Folgededuktion ist als Stundenposition markierbar.
6. **F, H4:** Von B1/A2 hat nur A2 Abstand drei zu D1 (B1 hat Abstand zwei).
   Also Stunde 1 A2; mit H1 folgt Stunde 2 B2. H4 lässt sich auch früher lösen,
   ohne D vorwegzunehmen: Dann ist B2 statt C1/B2 der sichere Treffer.

Vollständige Route: **A1–A2–B2–C2–D1–D2–E2**.
Jeder Schritt nutzt einzelne Felder, Nachbarschaft, einen geometrischen Abstand
oder die Trefferzahl. Keine vollständige Route wird dafür hypothetisch gefahren.

## Notwendige Abhängigkeiten und technische Nachweise

D benötigt genau die Kombination H1+H2+H3+H6. Jeder echte Teilhinweissatz
lässt Stunde 3 sowohl exakt als auch lokal offen. Auch beim Weglassen eines
dieser vier Hinweise aus dem vollständigen Rätsel bleibt Stunde 3 offen.
H4 und H5 sind für D nicht notwendig; für die vollständige Route sind sie nötig.
H6 allein lässt alle drei Treffermuster {2,3}, {2,4}, {3,4} zu und bestimmt die
entscheidende Position nicht. Ohne H6 bleiben selbst mit allen übrigen Hinweisen
Stunde 3 C1/C2 und Stunde 6 C2/E2 offen.

Der Bericht prüft alle 64 Teilhinweissätze dieses einen festen Rätsels. Das ist
eine endliche Nachweisprüfung nach der Konstruktion, kein Suchlauf nach Rätseln.
`handCertificate` rechnet die kleine Geometrie separat ohne Solverprojektionen
als Ausgangsmengen nach. Der lokale Apparat erhält nur `logic` und weder die
gespeicherte Zielroute noch Solverergebnisse.

Der produktive Graph arbeitet in anderer Reihenfolge: Der Zählschritt schließt
zunächst Trefferfelder aus einer noch größeren Menge aus; Nachbarschaft macht
danach Stunde 3 eindeutig. Die dokumentierte menschliche Reihenfolge wartet
auf C1/C2 und benötigt nur diese zwei lokalen Alternativen. Der Nachweis erfasst
den Pfad Zählschritt → Festlegung Stunde 3 → Festlegung Stunde 6. Die Tests
validieren jeden Graphen mit dem unveränderten erreichbaren-Prämissen-Prüfer
aus PR #105. Eine absichtlich gekappte notwendige Begründungskante muss scheitern.
Kein globaler Eindeutigkeitsbeweis ersetzt eine lokale Begründung.

Engine, Solver, Geometrie, lokale Regeln und Testprüfer bleiben unverändert.
Keine fehlende lokale Regel wurde zur Erfüllung dieses Entwurfs ergänzt.

## Technische und spielerische Aussage getrennt

Technisch: eindeutige legale Zielroute; alle sechs Hinweise notwendig; sämtliche
Stunden und Übergänge lokal erklärt; zentrale Abhängigkeiten und Kettenreaktion
geprüft. Die Dateien sind deterministisch reproduzierbar.

Spielerisch: ein plausibler, vollständig markierbarer Weg ist oben dokumentiert.
Ein menschlicher lösungsfreier Spieltest steht aus. Die Konstruktion ist daher
noch nicht als tatsächlich „mittelschwer“ oder spielerisch erfolgreich bewertet.
Der Konstrukteur kennt die Lösung und kann diesen Blindtest nicht ersetzen.
Die lösungsfreie Anleitung enthält ein leeres Beobachtungsprotokoll; erst nach
dem Spielen mit diesem Dokument und dem technischen Graphen vergleichen.
