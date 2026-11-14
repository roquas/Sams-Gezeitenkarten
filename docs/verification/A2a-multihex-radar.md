# A2a: Mehrhex-Radar – Prüfbericht

Stand: 14. November 2026. Bezug: [Issue #47](https://github.com/roquas/Sams-Gezeitenkarten/issues/47), Teilumfang A2a gemäß Arbeitsauftrag.

## Basis und Integrationsgrenzen

- Branch `fix/a2a-multihex-radar`, direkt von aktuellem `origin/main` auf `aea0bbcc6f8707b1dd9f23b8c4aa7980d0926b8f` erstellt. Der Remote-Stand wurde vor Änderungen abgefragt und nach der Implementierung erneut bestätigt.
- Offene PRs vor Änderungen geprüft: #108 (Offline-Deduktionsprofile) und #38 (ältere Rätselarchitektur). Kein separater Generator-PR war offen; #107 ist bereits in der Basis enthalten.
- #108 hat keine Dateiüberschneidung mit diesem Fix. #38 berührt ebenfalls `src/ui/game.mjs` und `src/ui/map.mjs`, basiert aber auf einer älteren Architektur. Dieser Fix verwendet ausschließlich die aktuellen Schnittstellen auf `main`; keine Abhängigkeit und keine Übernahme oder Änderung des fremden Branches.
- Produktive Änderungen ausschließlich in diesen beiden UI-Dateien. Engine, Generator, Solver, Deduktionsprofile, Assetbibliothek, Rätseldaten, Hinweise und Persistenzformat bleiben bytegleich zur Basis.

## Implementierung

Die Karte erhält das bereits für das aktuelle Rätsel erzeugte `rules`-Objekt. Für den gespeicherten angeklickten Ursprung wird anhand von `puzzle.map.objects[].cells` die konkrete Objektinstanz ermittelt. Die Radarwerte entstehen dann direkt über das vorhandene `rules.distanceToPlace(targetCell, object.id)`. Es gibt keine zweite Implementierung der Minimumdistanz oder der Hexgeometrie.

Für freie Hexfelder bleibt die vorhandene Hexdistanz erhalten. Einhexobjekte ergeben über die bestehende Ortsfunktion dieselben Werte wie bisher. Objektname, Asset-ID, Bild und benachbarte Objektinstanzen beeinflussen die Quellenzuordnung nicht. Die angeklickte Zell-ID bleibt gespeichert; deshalb funktionieren vorhandene Spielstände ohne Migration. Die Auflösung des Fußabdrucks erfolgt bei jedem Rendern aus dem aktuellen Rätsel.

Radarschalter, Ursprungsauswahl, Abbruch, Werkzeugwechsel, Markierungen, Undo, Route und Reload behalten ihre Bedienung. Gesperrte Felder bleiben als Radarursprung auswählbar, aber weder befahrbar noch markierbar. Geometrisch getrennte Teilinseln benötigen in diesem Teilauftrag keine zusätzliche Unterstützung. Issue #47 wird deshalb nicht als vollständig abgeschlossen markiert.

## Regression und Abnahme

Die fünf neuen Fälle in [multihex-radar.spec.mjs](../../tests/browser/multihex-radar.spec.mjs) bedienen das echte Radar. Mobile Ursprünge werden mit nativen Playwright-Touch-Eingaben (`tap`) gewählt. Teständerungen am öffentlichen Demorätsel werden ausschließlich als abgefangene HTTP-Antworten geliefert; keine produktiven Daten oder Katalogdateien werden verändert.

| Kriterium | Nachweis |
| --- | --- |
| Gleiche Distanzen von jedem Objektfeld | Alle 25 Radarwerte nach Auswahl beider Hexfelder, für gesperrtes und befahrbares Mehrhexobjekt |
| Sämtliche Objektfelder bei 0 | Zwei gleichzeitige Nullen; vollständige, fest vorgegebene 5×5-Distanzmatrix |
| Nachbarn und entfernte Ziele geometrisch korrekt | Matrix mit versetzten geraden/ungeraden Reihen, Distanzen 0 bis 3; Abgleich mit unverändertem `distanceToPlace` |
| Konkrete Objektidentität | Zwei direkt benachbarte Zweierobjekte mit identischem Namen und demselben Grafik-Asset; Auswahl aller vier Objektfelder, jeweils eigenes Distanzprofil |
| Einhexobjekte und Wasser unverändert | Alle 25 Werte für gesperrtes Einhexobjekt, befahrbares Einhexobjekt und freies Wasserfeld gegen bisherige Hexdistanz |
| Bedienung Desktop/Mobil | Maus, Touch, Tastatur, Werkzeugwechsel, Markierung, Land-Sperre, Undo, Reload, Radar aus/an; echte Screenshots |
| Regeln, Hinweise und Rätsel unverändert | Bestehende Engine-/Vertrags-/Integrationstests sowie Content-, Puzzle- und Paketprüfungen; keine Änderungen an deren produktiven Eingängen |

Negativkontrolle: Nur die Radarformel wurde vorübergehend auf die alte Einzelhexberechnung zurückgestellt und anschließend zuverlässig wiederhergestellt. Der neue Desktop-Test für das gesperrte Mehrhexobjekt scheiterte erwartungsgemäß: Nach Klick auf `B2` wurde `C2` mit 1 statt 0 angezeigt, außerdem waren die östlichen Ziele um einen Schritt zu weit entfernt. Der Test erkennt den ursprünglichen Fehler tatsächlich.

## Ausgeführte Prüfungen

Lokal unter Linux mit Node v24.19.0, Python 3.12.14 und Playwright 1.64.0. Browserprofile sind Emulationen, keine physische Apple- oder Android-Hardware.

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` | 325 bestanden, keine Fehler oder Skips |
| `npm run test:content` | 20 bestanden |
| `npm run test:puzzles` | bestanden; bestehendes Demorätsel weiterhin eindeutig |
| `python3 tests/test_package.py` | 19 bestanden |
| `npx playwright test tests/browser/multihex-radar.spec.mjs tests/browser/gui-final-review.spec.mjs tests/browser/model.spec.mjs tests/browser/pointer-gesture.spec.mjs` | 102 bestanden auf Chromium Desktop und Pixel 7, einschließlich aller zehn neuen Radarprüfungen |
| `npx playwright test --config playwright.webkit.config.mjs tests/browser/multihex-radar.spec.mjs` | 10 bestanden auf WebKit Desktop und iPhone 13 |
| `git diff --check` | bestanden |

Nach der Vereinheitlichung der WebKit-Testvorbereitung wurden alle zehn neuen Chromium-Radarprüfungen am endgültigen Teststand nochmals erfolgreich ausgeführt.

Die neue Testsuite verwendet die bestehende WebKit-Startvorbereitung und dasselbe 60-Sekunden-Testbudget wie die Kartenmodelltests. Der erste WebKit-Lauf mit dem Standardbudget von 30 Sekunden überschritt dieses beim Fall mit vier Ursprungsauswahlen. Assertions und Eingaben wurden dafür nicht abgeschwächt.

Für den lokalen WebKit-Start wurden fehlende Debian-Bibliotheken im Browsercache bereitgestellt. Die auf systemweit installierte Bibliotheken beschränkte Host-Vorprüfung wurde mit `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` übersprungen; der echte Browser und sämtliche Tests bleiben aktiv. Es gibt keine eingecheckten Änderungen an Browserkonfiguration, Abhängigkeiten oder CI.

Chromium-Screenshots für Desktop und Mobil wurden tatsächlich visuell geprüft: Beide Hexfelder der ausgewählten Insel zeigen gleichzeitig 0, die benachbarten Felder 1 und entfernte Felder die erwarteten größeren Werte.

## Optionaler Hover-Befund

Ursache ist die bestehende Regel `.cell:not(.blocked-cell):hover polygon` in [game.css](../../src/ui/game.css). Sie schließt gesperrte Objektfelder ausdrücklich aus, unabhängig von der Objektgröße. Im Desktop-Browser erreichten `B2` und `C2` zwar korrekt den Zustand `:hover` und behielten `pointer-events: all`, ihre Kontur blieb jedoch 1,05 px breit. Bei dem befahrbaren Objektfeld `D3` wurde sie 3 px breit.

Das erklärt die fehlende Hover-Kontur bei Landobjekten; die transparente Hex-Trefferfläche funktioniert. Eine Hervorhebung des ganzen Objekts oder eine werkzeugabhängige Hover-Regel wäre eine getrennte UI-Verbesserung. Sie ist bewusst nicht Teil dieses kleinen fachlichen Radar-Fixes. Kein automatischer Merge.
