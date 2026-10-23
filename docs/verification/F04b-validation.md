# F04b / PR 1 – Vorprüfung und Abnahme

Basis: aktuelles `origin/main`, am 23.10.2026 per `git fetch origin main`
bestätigt, Commit `b53e25bb2434c2db4b7f227d220366701556998c`.
Das ist der Merge von PR #74; dessen Head war
`97680969cffd6ceee1c25e66bdaae9c985cd0ca8`.
Featurebranch: `feature/f04b-abstract-map-generation`. Keine Änderung an main.
Ein gesonderter F04a-Delta-Bericht war im Auftrag/Kontext nicht verfügbar;
maßgeblich waren Auftrag und tatsächliche v2-Verträge.

## Gelesene Verträge und Dienste

- `src/puzzles/schema.mjs`: exakter Karten-/Logikvertrag, leere Objektliste
  erlaubt, feste 5×5-Geometrie und 1–6 Etappen.
- `src/engine/validate.mjs`: `validateMap`, `validateLogic`, disjunkte und
  seitenzusammenhängende Objekte, Start auf befahrbarem Objekt.
- `src/engine/hex.mjs`, `puzzle.mjs`: gemeinsame Nachbarschaft/Distanz,
  bestehender einfacher Routengenerator mit veränderlichem Knotenbudget.
- `src/puzzles/analysis.mjs` und Engine-/Vertragstests: vorhandene F03-Analyse,
  Solver- und Budgetsemantik. Keine Änderung an Regeln, Engine oder Schema.
- `ARCHITECTURE`, `PUZZLE-DESIGN`, `PUZZLE-SERVICES-F03`,
  `CONSOLIDATION-F01-F03`: bestehende Grenzen und noch offene Generatorpipeline.

## Post-Merge-CI von main

[Lauf 39925145855](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39925145855)
prüft exakt den Basiscommit (Push nach main, Versuch 1).
Bei der Vorprüfung war er noch `in_progress`, nicht erfolgreich abgeschlossen.
Vor PR-Erstellung wurde der finale Stand erneut gelesen: **`completed/failure`,
9 von 10 Jobs erfolgreich**. `webkit (2)` ist fehlgeschlagen. Erfolgreich:
Unit/Inhalte/Rätsel, Assets, Chromium, Deployment und WebKit-Shards 1 und 3–6.

Originallog des fehlgeschlagenen Jobs
[`120319567091`](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39925145855/job/120319567091)
über den GitHub-Connector gelesen:

- `tests/integration/chart-scroll.mjs:104`, WebKit Desktop, 820px:
  „native tap and horizontal touch drawing preserve one-step undo“ bricht
  im Erstlauf und Retry nach jeweils 30 Sekunden ab. Das Log nennt keinen
  engeren Ausführungsschritt; eine detailliertere Ursache ist daraus nicht bewiesen.
- Drei weitere 820px-Scrollfälle bestehen erst im Retry (`3 flaky`): Wasser,
  Land und wartender Radar. Erstläufe erreichen bei PageDown nur 11, 18 bzw.
  4 Pixel statt der geforderten Bewegung über 20 Pixel innerhalb von 5 Sekunden.
- Jobbilanz: `1 failed`, `3 flaky`, `43 passed`.

Relevanz für F04b: Die Fehler existieren bereits auf unverändertem main und
betreffen Browser-/Eingabe-/Scrollverhalten. Der neue Generator ist rein und
wird in der Anwendung nicht eingebunden. Keine belegte fachliche Blockade für
abstrakte Kartengenerierung. Die Browsertests und ihre Fristen bleiben erhalten;
es gibt weder Abschwächung noch Umgehung oder externe CI-Neustarts in diesem PR.
Ein weiterhin roter Gesamtlauf wird auch bei grünen Generatortests als rot ausgewiesen.

## Lokale Prüfungen

Node `v24.19.0` (Projektvoraussetzung Node 22+), Python mit Pillow/NumPy.

| Befehl | Ergebnis |
| --- | --- |
| `npm run test:unit` | 98 Tests bestanden: 85 bestehende und 13 neue |
| `npm run test:content` | 20 Tests bestanden, einschließlich isolierter Paketprüfungen |
| `npm run test:puzzles` | Garantierte Probefahrt valide, eindeutig, Hinweise irredundant |
| `npm run test:assets` | Asset-/Hash-/Alpha-/Footprint- und Python-Bild-/Exportprüfungen bestanden |
| `node scripts/sample-maps.mjs` | Freie/gefilterte Stichprobe reproduziert `F04b-map-sample.json` exakt |
| `git diff --check` | Bestanden |

Die neuen 13 Tests prüfen Zufallsvektoren, eine feste Generatorfolge,
Konfigurationsfehler/Flächenbudget, 256 Seeds und unabhängige Offset-Komponenten,
isoliertes Wasser, Mehrfeldstarts, Sterntopologie ohne lange einfache Route,
Engine-Routenzahlen für 1–6 Etappen, Budgetgrenzen/Untergrenzen, Nichtmutation,
explizite und unentscheidbare Filter sowie feste freie/gefilterte Stichproben.

Ein erster Lauf unter der Prozesssandbox scheiterte beim vorhandenen
Archivressourcentest mit `spawnSync python3 EPERM`. Der unveränderte Test startet
Python zur Erzeugung dekodierbarer PNG-/WebP-Fixtures. Nach freigegebener Ausführung
außerhalb dieser Sandbox bestand die vollständige Gruppe. Das war ein
Ausführungsproblem, kein durch entfernte Tests kaschierter Defekt.

Keine lokalen Browser-/Bildscreenshotläufe für diese reine Generatoränderung.
Die vollständige bestehende GitHub-Matrix bleibt aktiv; ihr Status wird getrennt
von den lokalen Ergebnissen im PR dokumentiert.

## Abweichungen und Grenzen

Ein kleines gemeinsames `src/generation/config.mjs` hält Optionsvalidierung und
Fehlertypen ohne Kreisabhängigkeit zwischen Generator und Analyse. Die bestehenden
npm-Globs erfassen die neuen Tests unter `tests/engine/`; kein neues Framework
oder npm-Skript. Keine Vertragsänderung und kein blockierender Vertragsdefekt.
Das Stichprobenskript ist ausschließlich ein interner reproduzierbarer Demoaufruf.
Formen sind wachstumsgewichtet, nicht gleichverteilt. Es wird keine tatsächliche
Rätselqualität behauptet. Offene Übergabepunkte für PR 2 stehen im Modulbericht.
