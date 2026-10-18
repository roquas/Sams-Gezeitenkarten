# Teststrategie – Entwurf

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

## Assetbibliothek und Grafikzellen (18.10.2026)

Die früheren Statusabschnitte oben sind historische Stände. Aktuell existieren Unit-, Puzzle-, Asset-, Chromium-, WebKit- und echte ZIP-Deploymentprüfungen in `.github/workflows/tests.yml`.

| Regression | Nachweis |
| --- | --- |
| Tatsächliches gestrecktes Voronoi-Raster, Flächeninhalt 5576, sechs gemeinsame Kanten, keine positiven Schnittflächen, Vergleich mit nächsten Zentren | `tests/reference/graphic-geometry.test.mjs` |
| Unveränderte Zentren, korrekte axiale Platzierung in beiden Zeilenparitäten, geometrischer Mittelpunkt, vier feste Bildmaße | `graphic-geometry.test.mjs`, `asset-library.test.mjs` |
| Konkavitäten und Ring mit ausgelassener Innenzelle; Rand aus vollständigem Raster mit bestehender 8-Einheiten-Schutzzone | `graphic-geometry.test.mjs`, `tests/test_library_images.py` |
| Alpha 1, ganze Pixelquadrate statt Mittelpunkt/Ecken, gültige interne diagonale Kante, ungültige äußere Schräge, eingeschlossene kleine Aussparung und ehemalige Wasserlücke | `tests/test_library_images.py` |
| Exakte, reproduzierbare Masken für vier Formen, jeder Maskenpixel gegen Vertrag geprüft | `tests/test_library_images.py`, `graphic-geometry.test.mjs` |
| B1: falsche/veraltete Asset-/Meerhashes, fehlende Freigabefelder, scale/dx/dy/rotation/mirror, Mehrhex über Kartenrand, getrennte Geometrie, beschädigte Asset-/Meer-/Legacydatei, Alpha außerhalb Geometrie/Schutzzone, nicht eindeutiges Rätsel | `tests/test_package.py`; gültiges freigegebenes Testasset als Positivkontrolle; beide CLI-Einstiege; altes ZIP bleibt bei Fehler erhalten |
| B2: gleiche Hintergrund-ID mit anderem Pfad wird trotz aktueller Hashes abgelehnt | `asset-library.test.mjs`, `tests/test_package.py` |
| B3: interner Alias, ausbrechender Symlink und symbolische Verzeichniskomponente werden abgelehnt | `asset-library.test.mjs`, `tests/test_package.py` |
| B5: deterministische gerade/ungerade Zeilen × Rand/Innen je geeigneter Form; unmögliche Kategorie wird ausgelassen | `graphic-geometry.test.mjs`, `tests/browser/asset-library.spec.mjs` |
| Tatsächliche Footprints sichtbar; feste Maße, gemeinsam verwendeter Renderer; Rand/Innen; unveränderte Landeingabe und Ebenen | `tests/browser/asset-library.spec.mjs` auf Desktop/Mobil in Chromium/WebKit, zusätzlich DPR-2-Tablet |
| Reihenfolgeunabhängige Browserkomposition benachbarter halbtransparenter Vollmasken bei responsiver Skalierung | `tests/browser/asset-library.spec.mjs`: Screenshotgleichheit nach Umkehrung der Reihenfolge für horizontale und diagonale Nachbarn in beiden Zeilenparitäten |
| Echtes ZIP mit Katalog, geänderten Bildmaßen und `.js`-Modulen, Unterpfadbetrieb | `tests/deployment/asset-library.spec.mjs` auf Desktop, Smartphone, iPhone und iPad |

B4 und B6 sind dokumentierte Folgearbeiten in [ASSET-LIBRARY-45.md](ASSET-LIBRARY-45.md); keine Beschriftungsänderung und keine neue Browserfehleroberfläche in diesem Auftrag. Die vier Rätseldateien und Legacy-Ausnahmen bleiben unverändert; der unabhängige Solver muss jeweils genau eine Lösung finden.

```sh
npm run test:unit
npm run test:puzzles
npm run test:assets
python3 tests/test_package.py
python3 scripts/check-chart-assets.py
npx playwright test
npx playwright test --config playwright.webkit.config.mjs
sh scripts/package.sh
# ZIP außerhalb des Checkouts entpacken; DEPLOY_ROOT auf dieses Verzeichnis setzen:
DEPLOY_ROOT=/pfad/zum/entpackten/zip npx playwright test --config playwright.deployment.config.mjs
```

Die Deployment-CI führt zusätzlich die vorhandenen Vergleiche mit den beiden historischen PR-38-Paketen aus. Jobstatus und Lauf-URL müssen für den tatsächlich gepushten Commit geprüft werden.
