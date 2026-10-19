# Teststrategie – Entwurf

## Getrennte Prüfdienste und öffentliche Projektion (F03)

Vertrag, Beispiele und Grenzen: [PUZZLE-SERVICES-F03.md](PUZZLE-SERVICES-F03.md).
`tests/reference/puzzle-services.test.mjs` enthält 20 gezielte Tests mit bekannten
Lösungsmengen und unabhängigen Archivprädikaten für Einzelweglassprüfungen.
Die vollständigen internen/öffentlichen Fixtures stehen in `tests/fixtures/puzzle-services/`.
Die Tests prüfen auch Budgetfehler, vorzeitigen Mehrdeutigkeitsnachweis,
Positivlisten gegen zukünftige Privatfelder, Versionsdispatch und F02-Identitäten.
`node scripts/check-puzzle-services.mjs --benchmark` liefert eine schreibfreie
Prüfung samt optionaler Messung. Produktion und Paketierung bleiben unverändert.

## Veröffentlichungsarchiv v1 (F02)

Vertrag und historische Zuordnung: [PUBLICATION-ARCHIVE-V1.md](PUBLICATION-ARCHIVE-V1.md).
`tests/reference/publication-archive.test.mjs` prüft Kanonisierungsvektoren,
Identitätsgrenzen, Snapshotintegrität am gepinnten Gitstand, widersprüchliche
Referenzen, unveränderliche Veröffentlichungen, Darstellungsrevisionen,
Legacyauflösung, bytegleiche historische Dateien und unveränderte Paketgrenzen.
Die Tests laufen über den bestehenden Unit-Glob; die Unit-CI lädt dafür die
Git-Historie. `node scripts/validate-archive.mjs` prüft das interne Archiv separat.

## Regelvertrag `gezeitenkarten-1` (F01/I01)

Der [eingefrorene Regelvertrag](RULESET-GEZEITENKARTEN-1.md) dokumentiert den
aktuellen modularen Stand. Die älteren datierten Abschnitte unten bleiben als
Historie erhalten; ihre Aussagen über noch fehlende CI-/Browserprüfungen sind
kein aktueller Gesamtstatus.

| Absicherung | Bereits vorhanden / gezielte Ergänzung |
| --- | --- |
| Unverändertes Archiv und unabhängige Referenzlösung | `archive-integrity`, `reference-rules`, `modular-puzzle` bleiben erhalten. |
| Historische Logik-/Sollroutenhashes | `stabilization` behält die vier Hashes und prüft zusätzlich IDs, Schema-/Datenversionen und Manifestpfade. |
| Vier eindeutig berechnete Sollrouten | Bestehende Katalogprüfung in `puzzle-data` um expliziten Vergleich der Solverlösungen erweitert; redaktionelle Tests bleiben erhalten. |
| Wiederbesuch, Land, unbekannte Hinweise, falsche Sollroute, unlösbar/mehrdeutig, Budgetfehler | Bestehende `toolbar`-, `puzzle-data`- und Referenztests wiederverwenden. |
| Geometrie und bisher nicht abgedeckte Routen-/Parametergrenzen | Neue `rules-contract.test.mjs`: 625 Zellpaare gegen unabhängiges Archiv, 1–6 Etappen, tatsächliche Stundenobergrenzen, Ortsarten, Richtungs-/Drehgrenzen, inklusive Zählintervalle. |
| Existenzielle Mehrzellen-Ortsdistanz | Neuer Test mit gleichzeitig wahren Abständen 2 und 3; der bisherige Mehrzellenfall allein unterschied sich nicht vom Mindestabstand. |
| Irredundanzdiagnostik für spätere generierte Basisrätsel | Neue Weglasszahlen gegen Archivprädikate; Gegenbeispiel zum gleichzeitigen Entfernen einzeln redundanter Hinweise. Kein neues Veröffentlichungsgate. |
| Difficulty-Grenze | Drei eindeutige Hinweissätze derselben Route mit gleicher alter Kennzahl; keine Behauptung menschlicher Schwierigkeit. |

Ausführen: `npm run test:unit`, `npm run test:puzzles`,
`python3 tests/test_package.py`, `sh scripts/package.sh` und die relevanten
Browserprüfungen am frisch entpackten ZIP nach [Deploymentanleitung](DEPLOYMENT.md).
Die vorhandene CI führt zusätzlich ihre vollständigen Chromium-/WebKit- und
Deploymentjobs aus. Neue Testdateien sind bereits vom bestehenden Unit-Glob erfasst;
keine Workflowänderung erforderlich. Bestandsschutz und neue Generatoranforderung
sind getrennt: Die vier historischen Fälle werden nicht nachträglich irredundant gemacht.

## Automatisierte Ebenen

- **Unit:** Hex-Nachbarschaft, Distanz (Symmetrie, 0, Nachbarn), Richtungen und 60°-Drehungen, Küstenregel, Routenvalidierung, Hinweisprädikate.
- **Generator:** Genau eine Lösung je Fall; reproduzierbare Seeds; keine unerreichbaren Felder; Schwierigkeitsmetriken, Randfälle, Laufzeit.
- **UI/Integration:** Stundenwechsel, Markierungen, `⌫`/`⌫∀`, Undo, Route/Etappe zurück, Distanzanzeige, Routennummern, Einstellungen, Reset, Speichern/Neuladen, Hinweisstatus, Lösungskontrolle.
- **Manuell:** Safari auf Mac und iPhone, Touch, Lesbarkeit, Überlagerungen, Performance, Rätselqualität.

## Release-Gate (Ziel, noch nicht umgesetzt)

Scope/Akzeptanzkriterien festgelegt → Tests grün → Browser-Smoke-Test → manuelle Abnahme → Changelog, bekannte Fehler und Releaseartefakte dokumentieren.

## Ist-Stand

Das README von Prototyp 3.6 dokumentiert eine Prüfung aller 519 zulässigen Routen auf genau eine Lösung sowie einen JavaScript-Syntaxcheck. **Es existiert noch keine vollständige automatisierte Browser- oder Regressionstestsuite im Repository.** Testberichte müssen zwischen bestanden, fehlgeschlagen und nicht ausgeführt unterscheiden.

## Stand 12.10.2026 – Interaktionsrekonstruktion

- [Interaktionsspezifikation 3.6](INTERACTION-SPEC-3.6.md) aus dem unveränderten Original-HTML dokumentiert.
- [Fünf Source-Contract-Tests](../tests/reference/source-contract.test.mjs) für Zustandsinitialisierung/Persistenz, Markierungen, Route, Schalter und Strafpunkte/Reset angelegt. Die fünf enthaltenen Assertionsgruppen wurden lokal anhand des Original-HTML abgeglichen und bestanden.
- **Einschränkung:** Source-Contract-Tests prüfen Quelltextfragmente, **nicht** das tatsächliche Verhalten im Browser. Es wurde noch kein Playwright-/Safari-Test ausgeführt und kein CI-Workflow eingerichtet.
- Offene fachliche Punkte: Undo-Grenzen, Stunde-0-Markierungen, Persistenz einzelner Einstellungen, Drag/Pointer-Capture und Schema-Validierung. Diese Punkte vor einer Verhaltensänderung gemeinsam entscheiden.

## Browser-Test-Harness (12.10.2026)

- Playwright-Konfiguration: `playwright.config.mjs`; Tests: `tests/browser/prototype-3.6.spec.mjs` (7 Szenarien × Chromium/Desktop und mobiles Chromium).
- CI-Workflow: `.github/workflows/tests.yml`, mit getrennten Jobs für Node-Referenztests und Browser-Tests sowie Artefakt-Upload bei Fehlern.
- Ausführung lokal: `npm install`, `npx playwright install chromium`, `npm run test:all` (Python 3 für lokalen HTTP-Server erforderlich).
- **Status:** Dateien in GitHub angelegt; erfolgreicher CI-Lauf und Browserausführung **noch nicht verifiziert**. Vor Abnahme muss das Ergebnis unter GitHub Actions geprüft werden. Der Workflow nutzt derzeit `npm install`, da noch kein Lockfile vorliegt; Lockfile und `npm ci` für reproduzierbare Installationen nachziehen.
- Charakterisierung von 3.6: Tippkosten sind derzeit per Undo rückgängig zu machen. Das ist **kein gewünschtes Sollverhalten** (Issue #10). Reine Anzeigeänderungen sollen künftig auch durch späteres Undo unverändert bleiben (Issue #13).
- Drag/Pointer-Capture und vollständige Interaktionsmatrix sind noch nicht automatisiert getestet.
