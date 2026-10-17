# CI-Laufzeiten

Ausgangspunkt: `8a03555`, Referenzlauf [39072099435](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39072099435).

## Befund und Änderung

Der Referenzlauf dauerte von Erstellung bis Abschluss 32:31 Minuten. Jobs:
WebKit 32:28, Chromium 7:40, Deployment 3:43, Assets 0:13, Unit 0:07.
WebKit-Installation: 0:35; Vorabtests: 0:14 + 5:36; Vollsuite: 25:57.
Die Vorabtests führten zwei mobile Fälle und 74 weitere Projektfälle aus
(73 bestanden, eine bestehende bedingte Auslassung). Beide Filter sind Teil
der Vollsuite mit 318 Fällen (315 bestanden, drei bestehende Auslassungen).
Die beiden mobilen Fälle wurden dadurch dreimal ausgeführt.

- Vier Playwright-Shards mit 80/80/79/79 Fällen auf getrennten Runnern,
  weiterhin **ein Worker je Runner**. Vollständige Test-/Projektmenge lokal
  anhand der JSON-Testlisten auf Gleichheit und überschneidungsfreie Partition
  geprüft. Frische Browserkontexte isolieren LocalStorage und Seiteneffekte;
  Playwright-Anhänge nutzen testbezogene Ausgabepfade. Server und Ports liegen
  pro Shard in einer eigenen VM.
- Zwei gleichzeitige Worker sind laut Commit `022e9bb` bereits an nativen
  DPR-2-Masken-/Zeilentests bei 768px gescheitert. Getrennte Runner vermeiden
  diese Konkurrenz um Software-Renderingressourcen. DPR, Viewports und
  Tests bleiben unverändert.
- Vorabtests nach `Diagnose WebKit regressions` verschoben (workflow_dispatch).
  Der normale Lauf prüft ihre Assertions weiterhin in der Vollsuite.
- `maxFailures: 1` entfernt und Matrix `fail-fast: false`: auch bei Fehlern
  werden die übrigen Fälle und Shards ausgeführt.
- JSON-Berichte mit Einzeltestzeiten und Ergebnissen werden für jeden Shard
  auch bei Erfolg drei Tage aufbewahrt; Fehler behalten HTML, Screenshots und
  die bisherige Trace-Konfiguration.
- Pillow/numpy nur einmal im Assetjob installieren.

Chromium Desktop/Mobil, beide WebKit-Projekte, Rätsellogik, HTTP-Semantik,
Asset- und Normalizerprüfungen, Pakettests und sämtliche Deployment-ZIP-
Projekte inklusive iPhone/iPad und historischen Vergleichspaketen bleiben
Bestandteil des normalen Laufs. ZIP-Tests prüfen einen anderen Auslieferungspfad
als die Quelltests und sind deshalb nicht redundant. Keine Änderung an Tests,
Assertions, Timeouts, Retries, Produktcode, Rätseln oder Assets.

Browserinstallation dauert nur 18–36 Sekunden; ein zusätzlicher Browsercache
wurde wegen Restore-/Invalidierungsaufwand nicht eingeführt. Deployment ist
mit 3:43 Minuten kein Engpass und bleibt zusammenhängend.

## Verifikation

Lokal bestanden: `npm ci`, `npm run test:unit`, `npm run test:puzzles`,
`python3 scripts/dev-server.py --self-test`, `python3 tests/test_package.py`
(sieben Tests), Alpha-Normalizer-Selbsttest und `check-chart-assets.py`.
318 WebKit-Test-/Projektfälle werden vollständig und ohne Dopplung verteilt.

GitHub-Messung und lokale Browserprüfung werden nach Abschluss ergänzt.

## Verbleibende Risiken

Vier Runner erhöhen die Gleichzeitigkeit und etwas den Setupaufwand in
Runner-Minuten; Warteschlangen und Kontingente können die Gesamtdauer erhöhen.
Playwright verteilt nach Fallzahl statt nach gemessener Dauer. Einzelne langsame
Fälle können deshalb Shards ungleich auslasten. Ein erfolgreicher Lauf allein
belegt keine langfristige Flake-Freiheit. Die bisherigen drei WebKit-Auslassungen
sind unverändert browser-/mobilbedingt; es wurden keine Tests deaktiviert.

Branchschutz-Regeln mit festem Jobnamen `webkit` müssen gegebenenfalls vom
Repository-Administrator auf die vier Matrixchecks angepasst werden; die
Repository-Einstellungen werden hier nicht geändert. Keine Übernahme nach main.
