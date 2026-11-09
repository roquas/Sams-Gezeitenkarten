# B2: Validierung der positiven Kontrollreferenz

Abnahme am 09.11.2026, Linux, Node v24.19.0, Python 3 mit Pillow,
Playwright 1.64.0 / Chromium 156. Desktop und Pixel-7-Emulation.
Ausgangspunkt: main `a8f8cbf97005b3ad888d8443fb40e3118781f717`, nach PR #103.
Diese Zusammenfassung enthält keine Lösungsschritte. Die
[Spieltestanleitung](../B2-POSITIVE-PLAYTEST.md) beschreibt Einstieg und ZIP-Export.

## Erfüllungsgrad

Genau ein ausgeliefertes handentwickeltes Rätsel, sechs Etappen und fünf
irredundante Hinweise. Der vor dem Entwurf separat committede Vertrag A–F ist
technisch erfüllt. Die ursprüngliche Konstruktion wurde genau einmal gezielt
überarbeitet; Versuche und Abweichungen sind privat dokumentiert. Keine
Generator-/Hinweissuche zur Konstruktion und keine neue Suchstrategie.

Der bestehende Solver bestätigt genau eine gültige Route, Zielübereinstimmung und
Notwendigkeit jedes Hinweises. Der unveränderte Diagnostiker aus #103 erklärt
alle Stunden und Übergänge lokal; im vollen Zustand sind beide Mengenlücken null.
Die 27 Standardzustände und fünf zusätzlichen Weglassungszustände belegen
Teilfortschritte, echte Kombinationswirkung und Folgewirkung. Eine separat
nachgerechnete kurze geometrische Argumentation ergänzt den Graphnachweis.

Der menschliche Test steht aus. Die Referenz validiert einen bewusst einfachen
positiven Kontrollfall, keine allgemeine Auswahlmetrik oder menschliche
Schwierigkeitsbewertung. Sie deckt nicht sämtliche Hinweistypen oder bekannte
Grenzen des lokalen Apparats ab. Der allgemeine P3-Befund bleibt separat offen;
es wurden keine lokalen Deduktionsregeln geändert.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` | 313 bestanden, keine Fehler oder übersprungenen Tests; darin vier neue Referenz-Vertragstests |
| `npm run test:content` | 20 bestanden |
| `npm run test:puzzles` | Bestehender öffentlicher Rätselbestand gültig |
| `npm run report:b2:deduction -- --check` | Acht bisherige Dateien bytegleich |
| `npm run report:b2:positive -- --check` | Drei neue private Dateien bytegleich |
| Browser: Referenz und S01/S02/BC | 34 bestanden auf Desktop/Mobil |
| `python3 tests/test_package.py` | 19 bestanden |
| `python3 tests/test_b2_positive_package.py` | Ein neuer ZIP-Vertrag bestanden |

Browseraufruf:

```sh
npx playwright test tests/browser/b2-positive.spec.mjs tests/browser/b2-bc.spec.mjs tests/browser/b2-s02.spec.mjs tests/browser/b2-playtest.spec.mjs
```

In der Cloud war zunächst kein Playwright-Browser installiert. Nach Installation
von Chromium wurden die 34 Anwendungstests vollständig ausgeführt. Keine Tests
oder Assertions wurden dafür deaktiviert.

## Tatsächlich exportiertes Paket

`npm run package:b2:positive` erzeugt ein deterministisches ZIP mit 111 Dateien:
109 unveränderte Laufzeitdateien aus dem bestehenden Packager und genau zwei
öffentliche Referenzdateien. Wiederholter Export bytegleich, Dateirechte im ZIP
644. Module sind für statisches Hosting nach `.js` umgeschrieben.

- Größe: 23.224.562 Bytes.
- SHA-256: `26cf2e9c7df1e8330d8d2222ccb451130def40d0c144c87873f41b32d3d1af05`.
- Keine privaten Definitionen, Zielroute, Verträge, Versuchsdaten, Diagnosen oder
  Begründungsgraphen im Archiv; keine S01/S02/BC-Entwicklungsdateien.
- Das reguläre Paket bleibt frei von Entwicklungsrätseln.

Das tatsächliche ZIP wurde in einen neuen temporären Ordner entpackt und mit
`tests/deployment/static_host.py` unter `/gk/pr38/` und `nosniff` geprüft.
Desktop und Pixel-7-Emulation bestätigten jeweils: Karte und Hinweise laden,
keine vorgezeichnete Route, gespeicherte Markierung nach Neuladen, passende
JavaScript-MIME-Angabe, keine privaten Browserrequests und HTTP 404 für die
private Definition. Ansichten auf beiden Geräten zusätzlich visuell geprüft.
Kein externer Upload; der Webordner ist für einen menschlichen Test vorbereitet.

## Bestandsschutz

Engine, Geometrie, Solver, lokaler Deduktionsapparat, Motive und vorhandene
Rätseldaten sind gegenüber der Basis unverändert. Die Vertragsprüfungen
bestätigen weiterhin die bisherigen öffentlichen S01-/S02-Bytes und die
gespeicherten B/C-Quelldaten. Kein Merge.
