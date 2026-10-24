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

## PR 2: Assetzuordnung und Katalogprofil

Basis: `8d5c7192a1ac9d7bfc7dfb95cd72307ff3f1c668`, aktuelles `main` nach
vollständigem Merge von PR #75. GitHub meldet #75 `merged:true`; der vollständige
Head `e241d1e7…` ist per `git merge-base --is-ancestor` im aktuellen main
nachgewiesen. `src/generation/`, zwölf ursprüngliche Generatortests und der
Vielfaltstest sind vorhanden. Neuer Branch: `feature/f04b-asset-assignment`.
PR #75/#76 und main werden nicht verändert oder gemergt.

Der erste Git-Zugriff scheiterte am Sandboxzugriff zum Proxy. Die GitHub-Daten
wurden über den Connector bezogen und die lokale Basis gegen den tatsächlichen
Commit- und Tree-Hash `9c9f1c26aed504663365991e9e4ed8c04efc012f` verifiziert.
Danach konnte der normale Git-Transport außerhalb der Prozesssandbox die
vollständige Historie holen und die Abstammung bestätigen.

Zusätzlich zu den oben genannten Generatorverträgen geprüft: aktueller
`assets/catalog/library.json`, `ASSET-LIBRARY-45`, `ASSET-CONSOLIDATION-65`,
`ASSET-INVENTORY-65`, `src/assets/{library,geometry}.mjs`, bestehender
`drawAssetPlacements`-Renderer, v2-Präsentationsvertrag, Node-Byte-/Hashprüfer,
Python-Pixelquadrat-/Sicherheitszonenprüfer und F03-Fingerprintdienste.
Der bestehende Platzierungsvertrag erfüllt die Zuordnungsaufgabe bereits.
Keine neue Assetklasse, Transformation, Rendereroption oder globale
Einmaligkeitsregel war erforderlich.

### Lokale Abnahme PR 2

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` | 112 bestanden: 98 bisherige + 14 neue |
| `node --test --test-isolation=none …` für dieselbe Gruppe | Ebenfalls 112 bestanden |
| `npm run test:content` / vollständige Einzeltestausgabe | 20 bestanden |
| `npm run test:puzzles` | Gültig, eindeutig, Hinweise irredundant |
| `npm run test:assets` | Datei-/Freigabehash-/Pixelprüfungen und 20 Python-Tests bestanden |
| Bisheriges `node scripts/sample-maps.mjs` + `cmp` | Bytegleich zu `F04b-map-sample.json` |
| `node scripts/sample-catalog-maps.mjs` + `cmp` | Gesamter Adapter-/Generierungspfad reproduziert `F04b-catalog-sample.json` bytegleich |
| `playwright test tests/browser/model.spec.mjs` | 20 Desktop-/Mobil-Chromium-Fälle bestanden |
| `git diff --check` | Bestanden |

Die 14 neuen Tests decken exakte Ein-/Mehrfeldtranslation und Zeilenparität,
asymmetrische Rotation/Spiegelung, Nichtmutation gefrorener Daten, Freigaben,
Semantikversion, Befahrbarkeit, Wiederverwendung, mehrere Bilder, leeren/ungeeigneten
Katalog, vollständige/teilweise/fehlende Zuordnung, unabhängige Zufallsströme,
abwechslungsreiche Profilkarten, leeres/0-Prozent-Profil und Vergleichsdiagnosen ab.
Drei davon prüfen den echten Node-/Python-Adapter mit synthetischen Bilddateien:
vollständiges Alphapixel im Inneren, dasselbe Pixel an unzulässigem Kartenrand,
leeres Bild, beschädigter Hintergrund und veraltete Freigabehashes.

Die Prozesssandbox meldete beim bestehenden Archivtest und den neuen
Node-/Python-Tests `spawnSync python3 EPERM`; die unveränderten Prüfungen
bestanden außerhalb dieser Sandbox. Im ersten Browseranlauf fehlte das
Playwright-Chromium-Binary. Nach Installation der exakt zur vorhandenen
Playwright-Version gehörenden Binärdateien bestanden alle 20 Fälle ohne
Test-/Budget-/Retryänderung. Keine WebKit-Stabilisierung in diesem PR.

Die vollständige bestehende CI-Matrix bleibt aktiv. Ihr aktueller Stand wird im
PR angegeben; lokale Erfolge ersetzen keine Behauptung eines grünen Gesamtlaufs.
Der Unit-/Inhalte-/Rätseljob des ersten PR-Laufs
[40044295656](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/40044295656)
am Implementierungscommit `18fe51a90d288f81ef8c7782888e63d0b42ea4b6` ist bereits
erfolgreich abgeschlossen; die Gesamtmatrix war beim Abruf noch in Arbeit.
Der nachfolgende Abschlusscommit ergänzt ausschließlich diesen Prüfbericht.
Die historischen, bereits auf main nachgewiesenen WebKit-Probleme sind oben und
in `WebKit-CI-investigation.md` dokumentiert.

### Feste Vergleichsstichprobe PR 2

Katalogdigest: `656e70d5fd714dbd3aa02341848dfa5543ccbc21a245454f3941e6bf4fce3dc9`.
Geprüft: 28 geografische Katalogeinträge, davon 18 produktive Illustrationen,
368 zulässige Asset-/Ankerpaare; alle passen mit ihren vollständigen sichtbaren
Pixelquadraten. Nach Deduplizierung nach Geografie/Befahrbarkeit enthält das
Profil 154 positionierte Footprints. Keine Bilddatei oder Freigabe wurde geändert.
Die nicht freigegebenen vierfeldigen Krabbenzangen bleiben ausgeschlossen.

Reproduktion: `node scripts/sample-catalog-maps.mjs`; Seeds 0–127, 3–8 Objekte,
Größen `[1,2,3,4]`, Befahrbarkeitswahrscheinlichkeit 0,25, Präferenz 75 Prozent.
Sonstige Optionen sind die dokumentierten Defaults: 20 Kartenversuche,
20 Platzierungsversuche je Objekt, keine Routenanalyse und keine Filter.
Versionen: `abstract-maps-1`, `catalog-informed-maps-1`, `asset-assignment-1`,
`catalog-shapes-1`, `asset-placement-pixels-1`.

| Kennzahl | Frei | Kataloginformiert |
| --- | --- | --- |
| Gültige / unterschiedliche Karten | 128 / 128 | 128 / 128 |
| Vollständig bebilderbar | 4 (3,125 %) | 27 (21,094 %) |
| Teilweise / ohne Illustration | 113 / 11 | 101 / 0 |
| Objekte zugeordnet / gesamt | 302 / 679 (44,48 %) | 483 / 670 (72,09 %) |
| Ohne Illustration | 377 | 187 |
| Orientierte Formsignaturen | 56 | 44 |
| Objektgrößen 1 / 2 / 3 / 4 | 173 / 167 / 178 / 161 | 175 / 163 / 171 / 161 |
| Kandidatenversuche | 134 | 137 (+2,24 %) |
| Platzierungsversuche | 883 | 921 (+4,30 %) |
| Zusätzliche Profil-Footprintprüfungen | 0 | 107646 |
| Asset-/Objektprüfungen in der Zuordnung | 19012 | 18760 |
| Übersetzungsprüfungen in der Zuordnung | 47180 | 46424 |

Profilversuche: 921 Präferenzentscheidungen, 450 erfolgreiche Profilplatzierungen,
277 erfolgreiche Wachstumsplatzierungen, 249 Präferenzfälle ohne verfügbare
passende Profilposition. Die erfolgreichen Platzierungen zählen auch Objekte
aus später verworfenen Kandidaten; ihre Summe ist deshalb nicht die finale
Objektanzahl. Verifikationsvorbereitung und Zuordnung sind getrennte Kosten.
Die Tabelle misst deterministische Arbeitsmengen, keinen laufzeitunabhängigen
CPU-Speedup. Die vollständige Pixelprüfung dauert in dieser Cloudumgebung
mehrere Minuten und ist als eigene, wiederverwendbare Vorbereitung vorgesehen.

Primäre Fehlgründe frei → informiert: `NO_EXACT_FOOTPRINT` 318 → 146,
`PASSABILITY_MISMATCH` 50 → 38, `PRODUCTION_DISABLED` 9 → 3.
Alle 121 befahrbaren Mehrfeldobjekte jedes Modus bleiben ohne Bild. Bei
unbefahrbaren Objekten fehlen frei 77 Zweier-, 69 Dreier- und 110 Viererformen;
informiert noch 24, 14 und 28. Fehlende Dreh-/Spiegelorientierungen werden nicht
umgedeutet. Fehlende Bilder invalidieren keine dieser Karten.

Die höhere Bebilderbarkeit geht in dieser Stichprobe mit weniger orientierten
Formen einher (56 → 44). Alle 128 Karten beider Modi sind unterschiedlich;
Größen, Befahrbarkeiten und mehrere Formklassen bleiben vertreten. Das ist ein
gemessener Auswahlbias und keine Aussage über Rätselqualität oder über alle Seeds.
Formen mit vielen verfügbaren Positionen werden bevorzugt; Größen-/Anzahlwerte
können zusätzlich durch unterschiedliche Platzierungswiederholungen verschoben
werden. Der freie Modus bleibt vollständig erhalten.

Vollständige Histogramme, Asset-IDs/-Klassen, Fehlformen und Beispielkarten:
[`F04b-catalog-sample.json`](F04b-catalog-sample.json). Beispiele im identischen
Stichprobenprofil: Seed 0 frei und informiert je 6/8 Objekte zugeordnet; Seed 1
frei 0/5, informiert 2/5; Seed 2 frei 1/5, informiert 4/5. Erste vollständige
Beispiele: frei Seed 16 (3/3), informiert Seed 5 (5/5). Ein gesonderter,
ausdrücklich enger Einfeldfall (Seed 0, vier Objekte, Wahrscheinlichkeit 0,5)
belegt vollständige Zuordnung 4/4, ohne ein allgemeines Erfolgsversprechen.
Alle Beispiele besitzen den bestehenden `mapFingerprint` und standardkonforme
separate `placements`.

Die unabhängige zweite Vorbereitung durch das fertige Vergleichsskript ergibt
dieselbe 70.457-Byte-Datei wie die erste vorbereitete Katalogstichprobe.
Stichproben-SHA-256:
`b5e587ee97496b878dd0ee94118d16328eabe69e30272dfc5050875dc6fc818f`.
Alle acht vielfältigen Beispielkarten wurden zusätzlich direkt aus den
dokumentierten Seeds, der Config und dem abgeleiteten Profil reproduziert.

### Übergabe und verbleibende Grenzen

Kein grundlegender Vertragswiderspruch und keine offene inkompatible
Architekturentscheidung. PR 3 erhält `generateMap`, `assignAssets`,
`prepareAssetCatalog` und `createCatalogProfile`, ihre Versionen und die
getrennten Diagnosen. Es muss Katalog-/Ressourcenbytes pinnen und die
Bildverifikation vor Wiederverwendung an genau diese Bytes binden.
Eine spätere Entscheidung, nur vollständige Zuordnungen zu veröffentlichen,
muss ausdrücklich erfolgen und ihren zusätzlichen Auswahlbias berichten.
Aktuelle Kataloglücken, aufwendige Pixelvorbereitung und mögliche Verteilungs-
verschiebungen durch Profile bleiben reale Grenzen. Start-/Routenauswahl,
Hinweise, Schwierigkeit, Produktions-CLI und Veröffentlichung bleiben außerhalb
dieses PR. Vor einem Merge ist die gewünschte unabhängige Prüfung vorgesehen.
