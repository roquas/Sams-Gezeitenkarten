# B2: Hinweisformen und illustrierte Ortsreferenzen

Ausgangsbasis: aktueller `main`, am 31.10.2026 über GitHub und Git geprüft:
`acd8a23e87b7fe840062a697d593d3ac9bbed596`. Die Befunde der Vorprüfung
bestätigten sich: zentrale Texte in `clue-text.mjs`, Parameterenumeration in
`puzzle-clues.mjs`, objektgebundene Distanzhinweise, bisher alle 25 Positionszellen.

## Semantik und historische Verträge

- Keine Änderungen in `src/`, an Schema, Prädikaten, Solver, Routenlegalität,
  Fingerprintbildung, `effectKey` oder Wirkungsdeduplikation.
- Darstellungsformen werden ausschließlich aus bestehenden Hinweisen abgeleitet.
  Innerhalb von `logic.clues` werden keine Felder ergänzt.
- Positionen werden vor Wahrheitsprüfung in deterministischer Rasterreihenfolge
  auf tatsächliche Objektzellen begrenzt. Die B2-Eingangsgrenze sichert mit dem
  bestehenden Platzierungsvertrag vollständige Illustrationen ab.
- Die S01-Quelldateien, Registry und historischen Definitionen bleiben bytegleich.
  Alle 95 Kandidaten bestehen Loader-, Lösungs- und Identitätsprüfungen.
- S01: 306 logische Zählhinweise ergeben exakt **210 / 57 / 23 / 16** normale,
  Never-, Has- und Not-Formen. Alle Formen zählen insgesamt 383 Hinweisvorkommen.
- Der historische P2-Replay verwendet den vor dieser Änderung gesicherten Pool
  aus `main`; bestehende Testnamen und Sollwerte bleiben erhalten. Ein zusätzlicher
  Test zeigt, dass alle Nichtpositionsparameter der neuen Produktion gleich sind.
- Kein neuer Rätselbestand, Release, Exportvertrag oder Namensregister wurde erzeugt.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` (Engine, Contracts, Integration) | 271 bestanden, keine übersprungen |
| `npm run test:content` | 20 bestanden |
| `npm run test:puzzles` | bestehendes Paket gültig und eindeutig |
| `python3 tests/test_package.py` | 19 bestanden |
| `sh scripts/package.sh` | ZIP gebaut: 109 Dateien, 23.222.786 Bytes |
| B2- und Langtext-Browserprüfungen, Chromium Desktop/Mobil | 16 bestanden |
| B2- und Langtext-Browserprüfungen, WebKit Desktop/Mobil | 16 bestanden |
| `npm run inspect:b2 -- --statistics` | historische Aufteilung bestätigt |
| `git diff --check` und Vergleich von Engine/S01/Assets mit `origin/main` | ohne Abweichungen in geschützten Beständen |

Browserumfang: `tests/browser/b2-playtest.spec.mjs` und
`tests/browser/long-clue.spec.mjs`. Chromium lief mit einer temporären Konfiguration,
die ausschließlich den ausführbaren Browser auf `/usr/bin/chromium` setzte und
Arbeits-/Ausgabepfade anpasste. Verwendet wurden Node 24.19.0, Playwright 1.64.0,
Chromium 154.0.8037.57 und WebKit-Build 2370. Fehlende WebKit-Bibliotheken wurden
lokal aus Debian-Paketen ergänzt; der systemweite `ldconfig`-Vorabcheck wurde
deshalb übersprungen. Browserstart und sämtliche Testassertionen blieben aktiv.

Die vollständige Browser- und Deploymentmatrix wurde lokal nicht ausgeführt;
sie bleibt Aufgabe der bestehenden CI. Die positionsbedingte Änderung neuer
Generatorergebnisse ist beabsichtigt und wird nicht auf historische Artefakte
übertragen. Poolstatistiken zählen bei Parameterbudgetabbruch nur den geprüften
Teilpool und weisen dessen Unvollständigkeit ausdrücklich aus.
