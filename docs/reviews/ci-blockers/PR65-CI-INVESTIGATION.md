# PR #65: Archivintegration und WebKit-Untersuchung

Stand: 20.10.2026. Ausgangs-Head `bf35e0549dd778b0419574b5243fabfd3c37b87f`.

## Integration mit main

Der tatsächlich ausgelieferte Git-Branch `main` steht bei Beginn auf
`64cd60065471daaa76281ef096b2f188e3165ea1`. Die PR-Metadaten melden daneben
noch `1f968b0` als Basis-SHA; für die Integration wurde der per `git fetch`
und `git ls-remote` verifizierte Branchstand verwendet. `git merge-tree`
meldet keine Konflikte. Ein normaler Merge in den bestehenden PR-Branch
übernimmt F01–F03 einschließlich der Archivtests und vollständiger Git-Historie
im Unit-Checkout. Kein Rebase, kein Force-Push und kein Merge nach main.

## Archivtest

Auf dem zusammengeführten Stand scheitert unverändert genau eine der 21
Archivprüfungen: Der aktuelle Paketumfang wird mit den 54 Dateien der
historischen Veröffentlichung gleichgesetzt. Das aktuelle Paket enthält
100 Dateien. Die zusätzlichen Dateien gehören zur ausdrücklich registrierten
Assetbibliothek und ihren fünf festen Laufzeitmodulen.

Der bereits vorbereitete Patch
`docs/reviews/consolidation/publication-closure-integration.patch` wurde
unverändert angewendet. Die Erwartung bleibt eine **exakte, sortierte
Dateiliste**, gebildet aus dem historischen Bestand, dem Katalog selbst,
den im Katalog registrierten Asset-/Hintergrunddateien und fünf einzeln
benannten Modulen. Es gibt weder Verzeichnis-Wildcards noch eine reine
Teilmenge-Prüfung. Fehlende historische Dateien und zusätzliche,
unregistrierte Laufzeitabhängigkeiten bleiben Fehler.

`archive/publications-v1.json`, die historischen Quellbelege und sämtliche
Prüfungen von Bytes, Hashes, Fingerprints, Aliasbindungen und Append-only-Regeln
bleiben unverändert. Nach dem Patch bestehen **21/21 Archivtests** sowie
**167/167 Unit-Tests** und die vier eindeutigen Solveranalysen.
Zwei zusätzliche Negativkontrollen in einer temporären Paketkopie bestätigen:
Ein neu importiertes, unregistriertes Modul und ein aus der Importkette
entferntes Pflichtmodul lassen die exakte Umfangsprüfung jeweils scheitern.

## Ursprünglicher WebKit-Befund

Quelle: [Lauf 39334503755, WebKit 3](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39334503755/job/118340465975),
Artefakte `webkit-chart-report-3` und `webkit-timings-3`.

- Der erste Desktop-Versuch endet nach 31.945 ms einschließlich Abbruchdiagnostik
  am Testlimit von 30.000 ms. Die letzte Assertion ist bereits die **erste**
  Ergebnisprüfung in Zeile 64; die wiederholten späteren Wechsel sind noch
  nicht erreicht.
- Der beim Abbruch erfasste DOM-Zustand zeigt das richtige Rätsel, die komplette
  korrekte Route und bereits **„Richtig!“**. Ein dauerhaft falscher Spielzustand
  ist damit nicht belegt; der Snapshot beweist nicht, wann das Ergebnis relativ
  zum Testlimit sichtbar wurde.
- Für diesen Erstversuch existiert kein Trace: Die bisherige WebKit-Konfiguration
  zeichnet in CI erst den Retry auf. Diese Evidenzlücke lässt sich nachträglich
  nicht schließen.
- Der erfolgreiche Retry dauert 24.189 ms. Sein Trace zeigt bei vielen Klicks
  1,3–2,0 Sekunden allein für die Sichtbarkeits-/Stabilitätsprüfung, nicht für
  eine ausstehende Navigation. Alle 105 aufgezeichneten Requests sind beendet;
  die Rätsel-JSON-Antworten benötigen etwa 3–10 ms.
- Auch der folgende Referenzrätseltest dauert im selben Job 20.232 ms. WebKit
  läuft dort bereits mit nur einem Worker; `fullyParallel` erlaubt auf diesem
  Runner deshalb keine gleichzeitig laufenden Tests. Jeder Test bekommt einen
  eigenen Browserkontext. Die Zeitstempel weisen den Timeout-Fall als den
  **ersten Test dieses Shards** aus: Vorherige Tests desselben Jobs scheiden
  damit als Erklärung des Erstversuchs aus. Kaltstart und Runner-Ressourcen
  bleiben als Hypothesen offen.
- Lokal: macOS, Node 24.19.0, Playwright 1.64.0. CI: Linux, Node 22,
  Playwright 1.64.0, Desktop-DPR 2. Die abweichende Renderingumgebung begrenzt
  die Aussagekraft lokaler Wiederholungen.

## Lade- und Synchronisationsprüfung

Der Auswahlhandler setzt synchron die Ladeanzeige und sperrt das Select.
Er wartet auf Laden und Validierung, ersetzt anschließend Puzzle, Zustand,
Präsentation und Karte und veröffentlicht erst danach den Geladen-Status.
Ein Request-Token verhindert das Übernehmen einer überholten erfolgreichen
Antwort. Die Testhilfe wartet auf Geladen-Status und wieder freigegebene Auswahl.
Ein konkreter Fehler dieses Ablaufs wurde beim ursprünglichen Timeout nicht
nachgewiesen.

Ein neuer Browser-Regressionstest hält die Antwort auf `test-navigation.json`
mit einer Promise gezielt zurück. Er prüft währenddessen Ladeanzeige, gesperrte
Auswahl und die bisherige Überschrift. Nach Freigabe prüft er den neuen Status,
die neue Überschrift, die drei gesperrten Felder und eine tatsächlich gespeicherte
Markierung im neuen Rätsel. Keine zeitgesteuerte Pause und keine abgeschwächte
Assertion.

Für diese Auswahlsuite wird `retain-on-failure` verwendet, damit künftig auch
vom **ersten** fehlgeschlagenen Versuch ein Trace mit Netzwerk-/Aktionsdaten
vorliegt. Diese Diagnoseänderung ist keine behauptete Behebung des Ausreißers.
Timeout, Retries, Flaky-Erkennung und bestehende Assertions bleiben unverändert.

## Reproduzierbarkeit und verbleibende Unsicherheit

Der unveränderte ursprüngliche Test besteht lokal **20/20-mal ohne Retry**:
je zehn Desktop- und Mobilversuche mit Trace-Aufzeichnung. Desktop etwa
3,7–4,4 Sekunden, Mobil etwa 2,2–2,5 Sekunden.

Die Daten sprechen für langsame Frame-/Renderingfortschritte im ursprünglichen
Linux-Lauf. Eine konkrete Ursache des Erstversuchs ist **nicht nachgewiesen**;
insbesondere ist kein allgemeiner Nachweis stabiler CI-Ressourcen erbracht.
Es wurde deshalb keine spekulative Änderung am Anwendungscode vorgenommen.
Ein weiterer grüner CI-Lauf allein darf nicht als Beweis einer behobenen
WebKit-Ursache verstanden werden.

Bei der breiteren lokalen Auswahlsuite fällt außerdem der bestehende native
Select-Tastaturtest unter macOS-WebKit auf: `ArrowDown`, `Enter` belässt die
Auswahl auf `reference-3.6`. Die gleiche ursprüngliche Tastensequenz zeigt dies
auch in einer separaten Browserprobe. Im ursprünglichen Linux-CI-Job besteht
dieser Test in 3.480 ms. Die dreifach ausgeführte lokale Gesamtauswahlsuite
endet mit 72 bestandenen Fällen und sechs Fehlern ausschließlich dieses
Tastaturtests; der Timeout-Fall und der neue verzögerte Ladefall bestehen
in allen sechs Projekt-/Wiederholungskombinationen. Das ist ein anderer Befund als der
ursprüngliche Linux-Timeout und muss in den lokalen Ergebnissen getrennt
berichtet werden; dieser Test wird weder übersprungen noch abgeschwächt.

## Weitere lokale Regressionsergebnisse

- Alle 167 Unit-Tests bestanden; darunter die 21 Archivtests. Vier bestehende
  Rätsel weiterhin eindeutig lösbar. No-cache-HTTP-Selbsttest bestanden.
- Vollständige Assetprüfung bestanden: Katalog mit 40 Assets und drei
  Hintergründen, Dateien/Hashes, 13 Bild-/Geometrietests, fünf Exporttests,
  zwei Motivtests, Alpha-Normalisierer-Selbsttest sowie Meer und beide Rahmen.
- Vollständiges Chromium-Matrix: **458 bestanden, drei übersprungen, neun
  fehlgeschlagen** (470 Fälle, zwei Worker, keine Retries). Ein Fehler ist
  die native Tastaturauswahl unter macOS; acht weitere Fehler enthalten
  nachweislich nicht geladene Laufzeitmodule: fünfmal
  `ERR_SOCKET_NOT_CONNECTED`, dreimal `ERR_CONNECTION_RESET`.
- Die von Transportfehlern betroffenen Fälle anschließend separat auf beiden
  Geräteprofilen zweimal mit einem Worker geprüft: **48/48 bestanden**, keine
  Retries. Das grenzt die lokalen Transportprobleme ein, ersetzt aber weder
  den fehlgeschlagenen Volltest noch den noch fehlenden Linux-CI-Nachweis.
- **28/28 Paket-/Fehlerfixtures bestanden**, einschließlich Produktivsperren,
  Solver als Veröffentlichungsschranke und Erhalten des letzten gültigen ZIP.
- **275/275 Deployment-Browserfälle bestanden**, ein Worker, keine Retries:
  tatsächliches entpacktes ZIP unter `/gk/pr38/`, Desktop, Smartphone,
  iPhone-WebKit und iPad-WebKit, mit beiden historischen Vergleichspaketen.
- Tatsächlich erzeugtes ZIP: 100 Dateien, alle 40 Katalogbilder bytegleich;
  keine Archiv-, Entwicklungs- oder Testdateien. SHA-256:
  `7f81ec1cfea434e7783321dfc1129b9e7b01b39f26a5794b48cd192d31565c69`.

## Schreibzugang und CI-Abschluss

GitHub weist den autorisierten Push mit folgender Meldung ab:
`refusing to allow an OAuth App to create or update workflow
.github/workflows/tests.yml without workflow scope`.

Die Änderung an dieser Workflow-Datei ist die unverändert von main
übernommene `fetch-depth: 0`-Einstellung für die historische Git-Byteprüfung;
der vorhandene Pillow-Installationsschritt des PRs bleibt erhalten. Diese
notwendige Integration wird nicht wegen einer fehlenden Token-Berechtigung
zurückgenommen oder durch schwächere Archivprüfungen ersetzt.

Die automatische Sicherheitsprüfung lehnt auch das Prüfen bestehender
SSH-Authentifizierung als Suche nach alternativen Zugangsdaten ab. Hierfür
wurde ausdrücklich eine Benutzerfreigabe angefragt. Bis diese vorliegt oder
der vorhandene Zugang die Workflow-Berechtigung erhält, bleibt der Push
blockiert. Es wurde keine alternative Authentifizierung benutzt und kein
Remote-Branch geändert. Abschließend per `git ls-remote` und PR-Abfrage
bestätigt: PR offen auf `bf35e05`, main unverändert auf `64cd600`, kein Merge.
Ein CI-Lauf auf dem neuen Commit kann daher bislang
nicht angegeben werden.

**Keine Merge-Freigabe:** Push und vollständiges CI auf dem endgültigen
Commit fehlen; die ursprüngliche WebKit-Ursache bleibt offen. Die Korrektur
und die Evidenz sind für eine unabhängige Integrationsreview vorbereitet.
Eine uneingeschränkte Aussage „WebKit-Ursache behoben“ ist nicht gedeckt.
