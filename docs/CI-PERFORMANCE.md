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

Die lokale Browserumgebung benötigte zusätzliche Bibliotheken aus Debian-
Paketen im Arbeitsverzeichnis (keine Produkt-/CI-Änderung). Der Zwei-Worker-
Versuch umfasste alle zwölf Desktop-/Mobilfälle der technischen DPR-2-Matrix
bei 768px mit `--workers=2 --retries=0`. Er scheiterte an Schriftgeometrie
und nativen Eingabe-Timeouts. Die gezielte Gegenprobe mit einem Worker und
zwei Desktopfällen scheiterte an denselben Problemen. Deshalb ist der lokale
Versuch **kein belastbarer A/B-Nachweis** gegen zwei Worker auf GitHub.
Die frühere GitHub-Beobachtung in `022e9bb` spricht weiter gegen die Erhöhung;
die gewählte Optimierung benötigt sie nicht. Keine Assertions oder Zeitbudgets
wurden an die lokale Umgebung angepasst.

## Gemessener vollständiger GitHub-Lauf

[PR-Lauf 39078040914](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39078040914)
auf `12a23b8`: alle acht Jobs grün, keine fehlgeschlagenen oder als flaky
klassifizierten Fälle. WebKit: 315 bestanden und drei bestehende Auslassungen;
Chromium: ebenfalls 315 bestanden und drei bestehende Auslassungen;
Deployment: 59 bestanden. Unit, Rätsel, HTTP, Assets und Pakettests grün.
Die WebKit-Ergebnisse verteilen sich auf 79/78/79/79 bestandene Fälle und
1/2/0/0 bestehende Auslassungen. Keine neuen Auslassungen oder Retries.

| Messgröße | Referenz | Optimiert |
| --- | ---: | ---: |
| Vollständiger Workflow (Erstellung bis Abschluss) | 32:31 | **11:59** |
| WebKit einschließlich Setup und Uploads, längster Job | 32:28 | 11:56 |
| WebKit Vollsuite, kritischer Testschritt | 25:57 | 11:04 |
| WebKit Vorabtests im normalen Lauf | 5:50 | entfällt |
| Chromium-Job | 7:40 | 7:51 |
| Deployment-Job | 3:43 | 5:14 |
| Summe WebKit-Jobzeiten | 32:28 | 38:28 |

Die Gesamtdauer sinkt um **20:32 Minuten / 63,1 %**. Zeiten stammen aus den
GitHub-API-Zeitstempeln, nicht aus lokalen Hochrechnungen. Die vier WebKit-
Testschritte dauern 10:12 / 9:12 / 11:04 / 4:33 Minuten. Die bisherige
Aufteilung nach Fallzahl ist ungleich, erreicht aber das Ziel mit deutlichem
Abstand. Eine maßgeschneiderte Verteilung würde zusätzliche Wartung erfordern;
sie ist für das erreichte Ziel nicht nötig. Installation und unveränderte Jobs
schwanken ebenfalls zwischen den Läufen. Das ist eine Messung, keine Garantie
für jede Runnerauslastung.

Der nachfolgende Dokumentationscommit verändert keine ausführbaren Dateien.
Den Status des jeweils aktuellen Branchstands und weitere vollständige Läufe
zeigt [PR #53](https://github.com/roquas/Sams-Gezeitenkarten/pull/53).

## Verbleibende Risiken

Vier Runner erhöhen die Gleichzeitigkeit und den Setupaufwand in
Runner-Minuten (WebKit im gemessenen Lauf insgesamt +6:00 / 18,5 %); Warteschlangen und Kontingente können die Gesamtdauer erhöhen.
Playwright verteilt nach Fallzahl statt nach gemessener Dauer. Einzelne langsame
Fälle können deshalb Shards ungleich auslasten. Ein erfolgreicher Lauf allein
belegt keine langfristige Flake-Freiheit. Die bisherigen drei WebKit-Auslassungen
sind unverändert browser-/mobilbedingt; es wurden keine Tests deaktiviert.

Branchschutz-Regeln mit festem Jobnamen `webkit` müssen gegebenenfalls vom
Repository-Administrator auf die vier Matrixchecks angepasst werden; die
Repository-Einstellungen werden hier nicht geändert. Keine Übernahme nach main.
