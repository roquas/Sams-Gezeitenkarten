# PR #65: Linux-WebKit, Framefortschritt und Testinitialisierung

Ausgangspunkt: `5d00144`, vollständiger CI-Lauf 39394185902.
Keine Änderungen am Spiel, Kartenrenderer, Assets, Freigaben oder Archiv.

## Nachgewiesene Evidenz

Die beiden ursprünglichen Ausreißer betreffen jeweils den ersten Test von
WebKit-Shard 3, aber verschiedene Interaktionen. Der neue Erstversuchs-Trace
von Lauf 39394185902 enthält keine Meldung über ein instabiles, abgelöstes
oder verdecktes Element. Der erste Kartenklick wartet 5.437 ms innerhalb einer
Sichtbarkeits-/Stabilitätsprüfung, die eigentliche Aktion ist schnell.
Alle 103 Requests sind abgeschlossen. Bereits `newPage` benötigt 6.041 ms.

Playwright 1.64.0 prüft Stabilität durch zwei aufeinanderfolgende
`requestAnimationFrame`-Messungen derselben Bounding Box. Bei geänderter Box
liefert die interne Prüfung `missingState: stable` und versucht erneut.
Das beobachtete lange Warten innerhalb eines einzigen erfolgreichen Checks
ist deshalb von wiederholtem Warten auf ein bewegtes Element zu unterscheiden.
Quellen: installierter 1.64.0-Code (`_checkElementIsStable` in `coreBundle.js`)
und [offizielle Actionability-Dokumentation](https://playwright.dev/docs/actionability#stable).

## Linux-Vergleiche mit unveränderten Assertions

Optionaler Workflow `diagnose-webkit.yml`, explizit mit `actionability=true`.
Die Diagnose kopiert die vorhandenen Auswahltests in ein temporäres Verzeichnis;
die Assertions werden nicht verändert. Je Variante laufen beide betroffenen
Fälle dreimal, ein Worker, 30 s Testlimit und **keine Retries**.
Die Baseline hat keine zusätzlichen Frame-Messungen, um Messaufwand zu trennen.

Erste Vergleichsmatrix:
[Lauf 39398559487](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39398559487)
auf `7bef54b`.

| Variante | Ergebnis | Beobachtung |
|---|---|---|
| DPR 2, normale Bewegung, ohne Frame-Monitor | 6/6 | Erster Fall 21,5 s, spätere etwa 13–14 s |
| DPR 2, normale Bewegung, Frame-Monitor | 6/6 | Frame-Abstände bis 2.109 ms; Messaufwand kein ausreichender Grund für den ursprünglichen Fehler |
| DPR 2, reduzierte Bewegung | 6/6 | Erster Fall nahe am Limit; spätere etwa 19–21 s, Frame-Abstände weiterhin über 1 s |
| DPR 1, normale Bewegung | 5/6 | Erster Fall Timeout, erste Seitenerstellung allein 15.532 ms; spätere Fälle etwa 9–11 s |
| DPR 2, nur ein initialer Spielaufruf | 5/6 | Erster Fall Timeout, Frame-Abstand bis 4.848 ms |

Die Runner hatten unterschiedliche AMD-CPU-Modelle. Deshalb wäre es unzulässig,
aus den Zeiten verschiedener Runner eine präzise Animations- oder DPR-Wirkung
abzuleiten. Insbesondere verhindert weder DPR 1 noch der einzelne Seitenaufruf
den Kaltstart-Ausreißer zuverlässig. Reduzierte Bewegung entfernt zwar die
beobachteten CSS-Transitions, beseitigt aber die langsamen Frames nicht.
Sie wird nicht als vermeintliche Fehlerbehebung übernommen.

Gepaarter Vergleich mit beiden Reihenfolgen auf jeweils demselben Runner:
[Lauf 39399408550](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39399408550)
auf `90e4690`.

| Reihenfolge | Baseline | Separate leere Renderer-Initialisierung |
|---|---|---|
| Baseline zuerst | 5/6; erster Fall Timeout nach 30-s-Budget, gemeldete 33,5 s inkl. Abbruch | 6/6; etwa 21,2–23,5 s |
| Initialisierung zuerst | danach 6/6 | 6/6, auch beim ersten kalten Worker |

Beim frischen Worker der zweiten Reihenfolge dauert die leere Initialisierung
4.288 ms; die anschließende echte Testseite benötigt für `newPage` nur 128 ms.
Der erste eigentliche Interaktionsfall benötigt dort etwa 18 s ab Erstellung
der Testseite. Beide Reihenfolgen bestätigen: Die erste Renderer-Initialisierung
ist erheblich teurer als spätere Seiten. Dass auch eine nachfolgende Baseline
schnell wird, ist Teil dieses Kaltstartbefunds, kein unabhängiger Fixnachweis.

## Kleine testseitige Korrektur

Nur die Auswahltests importieren nun `tests/integration/webkit-startup.mjs`.
Eine automatische **Worker-Fixture** initialisiert für WebKit einen frischen,
leeren Kontext bei DPR 2 und wartet zwei echte Frames ab. Anschließend wird
dieser Kontext vollständig geschlossen. Keine Spielseite, Grafik oder
Spielstandsdatei wird vorgeladen; kein Spielzustand wird übernommen.
Erst danach erzeugt die normale Testfixture den unabhängigen Spielkontext.

Damit wird Renderer-Initialisierung dem dafür vorgesehenen Worker-Setup
zugeordnet, statt beim ersten langen Funktionstest dessen Aktionsbudget zu
verbrauchen. Playwright verwendet für Worker-Fixtures ein getrenntes
Standard-Setupbudget; die Test- und Assertion-Timeouts werden nicht erhöht.
Die gemeldete Wandzeit eines Tests darf Setupzeit enthalten und ist deshalb
nicht mit dem unveränderten 30-s-Aktionsbudget gleichzusetzen.

DPR, Viewports, Animationen, native Klick-/Touch-Ereignisse, Stabilitätsprüfungen,
Testreihenfolge innerhalb der Datei und sämtliche vorhandenen Assertions bleiben
erhalten. Kein `force`, kein Sleep, kein zusätzlicher Retry, keine deaktivierte
Flaky-Erkennung. Der bisherige doppelte Spielaufruf bleibt ebenfalls unverändert.
Die gesonderten Kaltstart-/Dekodier-/Lifecycle-Tests verwenden diese Fixture
nicht und behalten ihre unabhängige Abdeckung.

## Regression und Grenzen

- Diagnoseharness lokal: 6/6 mit Frame-Messung, 6/6 mit leerer Initialisierung.
- Betroffene Fälle mit der tatsächlichen neuen Testfixture: WebKit Desktop/Mobil
  20/20, Chromium Desktop/Mobil 12/12, jeweils ohne Retry.
- Vollständige lokale WebKit-Auswahl: 24 bestanden, zwei Fehler ausschließlich
  des bereits zuvor nachgewiesenen nativen Tastaturtests unter macOS. Dieser
  Test bleibt unverändert und wird nicht übersprungen.
- Gepaarter Linux-Vergleich: initialisierte Variante 12/12 ohne Retry. Eine
  unveränderte Baseline reproduziert den ersten Timeout auf demselben Runner.
- Vollständige CI auf dem abschließenden Branchstand ist gesondert abzuschließen;
  die Diagnose-Läufe ersetzen diese Prüfung ausdrücklich nicht.

Es ist kein Fehler im logischen Spielzustand und keine dauerhaft bewegte
Trefferfläche nachgewiesen. Nachgewiesen ist das Zusammenspiel aus teurem
Linux-WebKit-Kaltstart, langsamen Frames und deren Abrechnung im Testbudget.
Die tiefere Ursache der unterschiedlichen WebProcess-/Software-Rendering-
Latenzen auf verschiedenen GitHub-Runnern ist nicht abschließend geklärt.
Die Korrektur beschleunigt nicht pauschal den Produktionsrenderer, sondern
trennt Browserbereitschaft von den unverändert strengen Funktionstests.
