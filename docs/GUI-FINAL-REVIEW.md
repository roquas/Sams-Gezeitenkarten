# Abschließende GUI-Abnahme

Bestehender Branch `feature/coordinates-chart-logbook`, bestehender PR #30. Kein neuer Branch, kein Merge. Die Rätselarchitektur (#18, #19, #23, #33, #34) bleibt ein separater Schritt.

PR #30 ist für die gemeinsame GUI-Abnahme direkt auf `main` ausgerichtet. Er enthält auch die bereits abgenommenen Grafikvorarbeiten aus PR #25/#28. `main` (`f0b8786`) ist vollständig im Featurebranch enthalten, ohne fehlende oder konfligierende Main-Änderungen. Die vorherigen Grafik-PRs wurden weder gemergt noch geschlossen.

## Unabhängige Abstandsanzeige

`src/state/distance-overlay.mjs` trennt das bestehende Kartenoverlay von der vorübergehenden Ursprungsauswahl und von `state.tool`:

1. Radar aktivieren, befahrbares Ursprungsfeld auswählen.
2. Die geometrischen Hexabstände bleiben bei Stunden-/Werkzeugwechsel, beliebig vielen Markierungen, beiden Radierern, Route und Undo sichtbar. Das aktive Markierwerkzeug bleibt als aktiv erkennbar.
3. Erneut auf das Radar drücken: neuen Ursprung auswählen. Bis dahin bleibt das bisherige Overlay erhalten. Der Auswahlklick erzeugt keine Markierung, auch ein anschließendes Ziehen derselben Auswahlgeste nicht.
4. Ein weiterer Radardruck während der Auswahl schaltet das Overlay aus. Ein Markierwerkzeug während der Auswahl bricht die Auswahl ab und behält einen vorhandenen Ursprung bei.

Vorhandene Speicherkennung bleibt unverändert. Ein gültiger Ursprung und das Overlay werden weiter gespeichert; eine ausstehende Neuauswahl ist transient und wird nach Neuladen nicht fortgesetzt. Ohne Ursprung bleibt die bestehende zweistufige Auswahl nötig. Reset beginnt ohne Overlay. Getrennte Rätselschlüssel und frischer Zustand werden per Unit-Test geprüft; eine Rätselauswahl gibt es in diesem GUI-Schritt ausdrücklich noch nicht.

Hexdistanz, Befahrbarkeit, Regeln, Hinweistexte und Aquarellassets unverändert. Keine neue Entfernungsmethode oder zusätzliche Spielhilfe.

## Responsiver Instrumentenrahmen

Die tatsächliche Kartenbreite steuert das Layout über einen CSS-Container (`.map-panel`), unabhängig davon, ob ein Tablet die volle Karte oder ein Desktop eine schmale Karte neben der Hilfe zeigt:

- Über 560 Pixel Kartenbreite: eine Zeile, links Undo/Radar/Anzeigeoptionen, rechts drei Routenaktionen.
- Bis einschließlich 560 Pixel: absichtliches Raster mit vier Anzeige-/Bearbeitungsbuttons oben und einer mittig ausgerichteten Gruppe aus drei Routenaktionen unten.
- Kein automatisches Flex-Wrapping, keine dritte Zeile, kein horizontales Scrollen; mindestens 44 Pixel Touchfläche, kompakte zweizeilige Aktionen 48×48 Pixel. Beide Messingschienen umfassen die gesamte Gruppe.
- Der alte spezifische Hintergrund von `#routeBack` wird entfernt; auch aktive, inaktive und deaktivierte Knöpfe haben einen transparenten HTML-Hintergrund. Die vorhandenen Messingfassungen und deren Petrol-/Pergament-Innenflächen bleiben erhalten. Sanduhr/Feder bleiben transparent, Radar geometrisch und optisch zentriert.

## Lektorat #31

Alle neun Punkte des [verbindlichen Kommentars](https://github.com/roquas/Sams-Gezeitenkarten/issues/31#issuecomment-6145987099) wurden abgeglichen: zeitlich aufeinanderfolgende Kartenblätter; generische Landregel; befahrbare besondere Orte mit orangefarbenem Kreis und fallabhängigen Namen; gemeinsame Hexseite ohne Eckenpassage; allgemeine Küstenregel mit Tesoro nur als Beispiel; beide Radierer; tatsächlich vorhandene Anzeigeoptionen; Nummerierung der bereits gesetzten Route; Fundorte aller drei Hilfen mit unveränderten Kosten/Wirkungen.

**Präzisierung zu Punkt 7:** Der vorhandene Schalter blendet die kleinen Eckmarkierungen der jeweils ausgewählten Stunde aus. Für alle Stunden muss jede Stunde separat ausgeschaltet werden; es gibt keinen globalen Alle-Stunden-Schalter. Die große Zentralmarkierung bleibt sichtbar. Die Einstellung „Markierungen auf Routenfeldern ausblenden“ betrifft die Eckmarkierungen sämtlicher Stunden auf Routenfeldern. Der Regeltext erklärt diese vorhandenen Funktionen, statt eine neue Funktion zu behaupten oder einzubauen.

Regeln bleiben eingeklappt. Haupttitel, acht Unterabschnitte, Absätze und Listen bleiben lesbar auf Pergament. Die beiden Illustrationen bleiben die ausdrücklich erlaubten Folgeaufgaben; Anforderungen und Einbauorte stehen in `RULES-FINAL-POLISH.md`. Alle übrigen Abschnitte des ursprünglichen Textes wurden beibehalten.

## Vollständigkeitsprüfung bestehender GUI-Themen

| Issue | Prüfergebnis |
|---|---|
| #9 | Genau sechs Stundentasten, keine auswählbare Stunde 0. |
| #10 / #13 | Undo betrifft Bearbeitungen; Anzeigezustände und bezahlte Denkanstöße bleiben erhalten. |
| #15 | Dezenter Start, perspektivische Ortsringe, Randkoordinaten innerhalb des tatsächlichen Pergaments; originale Grafiken und Archiv unverändert. |
| #16 / #17 | Gemeinsame Messingschienen, zugängliche Symbolbuttons, abgenommene Buchkomposition, Blättern/Abhaken/Reduced Motion erhalten. |
| #26 | Eine gemeinsame zugängliche Koordinatendarstellung, auch im überarbeiteten Regeltext. |
| #27 | Kleine transparente sichere Labels, zusammenhängende Inselflächen und Perspektive; keine neue Labeländerung. |
| #29 | Drei Radarzustände, unabhängig nutzbares Overlay, dauerhafte mobile Navigation und alle sieben Hinweise. |
| #31 | Neun Lektoratspunkte eingearbeitet; nur zwei zugelassene Illustrationen offen. |
| #32 | Alle vier konkreten Vorgaben umgesetzt; Hintergründe/Zentrierung/Umbruch nochmals geprüft. |

Keine offenen Review-Threads oder zusätzlichen PR-Kommentare beim initialen Abgleich. Issues bleiben bis zur Abnahme/Integration nachvollziehbar mit dem bestehenden PR verknüpft.

## Validierung

Lokal 40 Unit-Tests bestanden. Fünf neue reine Zustandsprüfungen für Overlay/Werkzeugwechsel, Ursprung ändern/ausschalten, Auswahlabbruch, Undo/Neuladen und Reset/getrennte Rätselschlüssel. Neue Playwright-Tests markieren fünf Felder mit Abstand 2 ab C1 und prüfen die unverändert sichtbaren Zahlen nach jeder Aktion; zusätzlich beide Radierer, Route, Undo, Neuladen, Tastatur, Ursprungwechsel, Landklick, Ausschalten und Reset.

Layoutprüfungen bei 320/360/390/430/540/580/600/620/768/820/900/1024/1280/1440 CSS-Pixeln: Anzahl der Zeilen abhängig von tatsächlicher Kartenbreite, Zentrierung, Touchflächen, transparente Buttonhintergründe, volle Breite der Schienen und kein horizontaler Überlauf. Bestehende Browserprüfungen bleiben erhalten. Echte Chromium-/Pixel-7-Browserläufe in GitHub Actions; keine Prüfung auf echter Safari-/iPhone-Hardware.

Geprüfter Stand `c36901b`: [PR-Actions 38405931680](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38405931680) und [Push-Actions 38405922823](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38405922823) vollständig grün: **40 Unit-Tests, 107 Browserprüfungen bestanden, 3 erwartete projektabhängige Skips, keine Fehler oder Flakes**. Der PR-Lauf prüft die Integration gegen `main`. Der nachfolgende Abschlusscommit ergänzt nur Dokumentation und die folgenden echten Browserbilder.

## Tatsächliche Browserbilder

- [Desktop-Gesamtansicht](screenshots/gui-review-desktop.jpg)
- [1440 Pixel: einzeilige Leiste](screenshots/gui-review-1440-rail.jpg)
- [1024 Pixel: einzeilige Leiste](screenshots/gui-review-1024-rail.jpg)
- [768 Pixel: einzeilige Tablet-Leiste](screenshots/gui-review-768-rail.jpg)
- [900 Pixel: zweizeilige schmale Desktop-Kartenspalte](screenshots/gui-review-900-rail.jpg)
- [540 Pixel: zweizeilige Leiste](screenshots/gui-review-540-rail.jpg)
- [390 Pixel: zweizeilige Smartphone-Leiste](screenshots/gui-review-390-rail.jpg)
- [320 Pixel: zweizeilige Smartphone-Leiste](screenshots/gui-review-320-rail.jpg)
- [Aktives Abstandsoverlay mit mehreren „?“-Markierungen bei Abstand 2](screenshots/gui-review-overlay.jpg)
- [Lektorierte Regelansicht auf Smartphone](screenshots/gui-review-rules-mobile.jpg)

Alle Bilder stammen aus dem erfolgreichen PR-Lauf 38405931680, mit CSS-Pixel-Auflösung. Sichtkontrolle bestätigt die mittige zweite Zeile, vollständige Messingschienen, entfernte rechteckige Buttonhintergründe, unveränderte Materialwirkung und weiterhin sichtbare Entfernungszahlen bei Markierungen. Die Buch-/Kartenkomposition bleibt unverändert.
