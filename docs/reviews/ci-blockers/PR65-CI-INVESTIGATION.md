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
  eigenen Browserkontext. Ein Einfluss eines länger lebenden Browserprozesses
  oder der Runner-Ressourcen ist damit nicht ausgeschlossen.
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
auch in einer separaten Browserprobe. Das ist ein anderer Befund als der
ursprüngliche Linux-Timeout und muss in den lokalen Ergebnissen getrennt
berichtet werden; dieser Test wird weder übersprungen noch abgeschwächt.

Die vollständigen Regressionsergebnisse und der CI-Lauf des endgültigen
Commits sind im Abschlussbericht dieses Auftrags festzuhalten. Eine
uneingeschränkte Aussage „WebKit-Ursache behoben“ ist durch diese Untersuchung
nicht gedeckt.
