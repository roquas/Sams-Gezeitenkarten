# B2 V2 – technischer Prüfstand und offener Spieltest

Prüfung am 10.11.2026 mit Node v24.19.0, Python 3.12.14 und
Playwright 1.64.0 / Chromium 156. Basis: main nach PR #105 (`21f9bf5`).
Diese Zusammenfassung enthält keine Lösungsschritte.
[Lösungsfreie Spieltestanleitung](../B2-POSITIVE-V2-PLAYTEST.md).

## Konstruktion und technischer Befund

Der Benutzervertrag V2 wurde unverändert in Commit `95024e5` vor konkreten
Hinweisparametern festgeschrieben. Genau ein handentwickelter Erstentwurf,
keine Überarbeitung und kein Suchlauf nach geeigneten Kandidaten.
Das ausgelieferte Rätsel hat sechs Etappen und sechs Hinweise.

Genau eine legale, zur handentwickelten Zielroute passende Lösung. Jeder Hinweis
ist notwendig. Die vorhandenen lokalen Regeln erklären sämtliche Stunden und
Übergänge. Ein echter, zunächst mehrdeutiger Zählhinweis wird erst zusammen mit
weiteren Bedingungen entscheidend; danach wird eine weitere Stundenposition
eindeutig. Der private Nachweis prüft alle 64 Teilhinweissätze einschließlich
aller zentralen Teilmengen und vollständigen Weglassungszustände.

Der unveränderte Testprüfer aus PR #105 rekonstruiert jeden Zustand aus den
erreichbaren Prämissen. Alle 64 Graphen bestehen; eine gezielt gekappte
notwendige Kante am Zählschritt wird zurückgewiesen. Ein zusätzlicher kurzer
geometrischer Nachweis kommt ohne vollständige Routen aus. Die lokalen
Berechnungen erhalten ausschließlich die logischen Bedingungen.

Engine, Solver, Geometrie, Motive, Platzierungsverträge, lokale Regeln und
Testprüfer sind gegenüber der Basis unverändert. Die bestehende Oberfläche
erhält lediglich einen weiteren Entwicklungsbestand, keine neuen Werkzeuge.
Die bisherigen S01-/S02-/BC-/POSITIVE-Bestände bleiben erhalten.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` | 319 bestanden, keine Fehler oder übersprungenen Tests |
| `npm run test:content` | 20 bestanden |
| `npm run test:puzzles` | Bestehender öffentlicher Bestand gültig |
| `npm run report:b2:deduction -- --check` | Acht bisherige Dateien bytegleich |
| `npm run report:b2:positive -- --check` | Drei bisherige private Dateien bytegleich |
| `npm run report:b2:positive-v2 -- --check` | Zwei neue private Dateien bytegleich |
| Browser: V2 und S01/S02/BC/POSITIVE | 40 bestanden auf Desktop/Mobil |
| `python3 tests/test_b2_positive_v2_package.py` | Deterministischer öffentlicher ZIP-Vertrag bestanden |
| `git diff --check` | Bestanden |

Der erste Browseraufruf scheiterte vor Testausführung am fehlenden Chromium.
Nach Installation des zur vorhandenen Playwright-Version gehörenden Browsers
bestanden die Anwendungstests vollständig; keine Assertions wurden deaktiviert.

## Browser und tatsächlich exportiertes ZIP

40 Browserprüfungen bestanden auf Desktop und Pixel-7-Emulation: die bisherigen
34 B2-Prüfungen plus sechs V2-Prüfungen. Dazu gehören das Speichern der
tatsächlich benötigten Alternativmengen auf getrennten Stundenkarten sowie das
Markieren der zentralen und folgenden Festlegung, ohne Routenzug.

Der ZIP-Vertrag prüft das exakte öffentliche Dateiinventar, Leserechte und
bytegleiche Wiederholung. Das tatsächliche ZIP wurde separat entpackt und unter
`/gk/pr38/` mit `nosniff` auf Desktop/Mobil geprüft: Laden, keine vorgezeichnete
Route, persistente Alternativen, Stundenmarkierungen, JavaScript-MIME-Angabe,
keine privaten Browserrequests und HTTP 404 für die private Definition.
Beide Anfangsansichten wurden zusätzlich visuell geprüft.

- Datei: `dist/B2-positive-v2-playtest.zip`, 111 Dateien, 23.224.710 Bytes.
- SHA-256: `b8e94e2eb7c7f755dc5ff974b5f3cf7eb620f312de2dff83b59f43696679fd3c`.
- Genau zwei öffentliche V2-Dateien ergänzen die regulären Laufzeitdateien.
- Keine privaten Definitionen, Zielroute, Verträge oder Begründungsgraphen.

## Spielerischer Befund

Ein möglicher vollständig markierbarer lokaler Lösungsweg ist privat
dokumentiert; seine benötigten Markierungen wurden technisch erprobt.
Ein menschlicher lösungsfreier Test steht aus. Weder die Schwierigkeit
„mittelschwer“ noch der spielerische Gesamterfolg sind damit schon bestätigt.
Das vorbereitete Beobachtungsprotokoll gibt keine Lösungsreihenfolge vor.
Erst nach dem Spielen soll mit dem Begründungsgraphen verglichen werden.
