# PR #65: Linux-WebKit, Actionability und funktionale Testprofile

Ausgangspunkt: `5d00144`, CI-Lauf 39394185902. Keine Änderungen am Spiel,
Kartenrenderer, Assets, Freigaben oder historischen Archiv.

## Evidenz und tatsächlicher Engpass

Die ursprünglichen Ausreißer betreffen jeweils den ersten Test von WebKit-Shard 3,
aber unterschiedliche Interaktionen. Die Traces zeigen keine wiederholten
Meldungen über instabile, abgelöste oder verdeckte Elemente. Stattdessen dauert
bereits eine einzelne erfolgreiche Stabilitätsprüfung mehrere Sekunden.
Im Erstversuch von 39394185902 benötigt `newPage` 6.041 ms und die Stabilitätsprüfung
vor dem ersten Kartenklick 5.437 ms; alle 103 Requests sind abgeschlossen.

Playwright 1.64.0 prüft die Bounding Box in aufeinanderfolgenden
`requestAnimationFrame`-Callbacks. Bei geänderter Box liefert die Prüfung
`missingState: stable` und versucht erneut. Langsame Framefortschritte können
also auch bei unveränderter Trefferfläche lange Actionability-Wartezeiten
verursachen. Quellen: installierter 1.64.0-Code (`_checkElementIsStable` in
`coreBundle.js`) und [offizielle Dokumentation](https://playwright.dev/docs/actionability#stable).

Die kontrollierten Linux-Vergleiche belegen zwei Kostenanteile:

1. Die erste WebProcess-/Renderer-Initialisierung ist wesentlich teurer als
   spätere Seiten. In den Messungen variieren erste `newPage`-Aufrufe von
   etwa 1,1 bis 15,5 s; spätere liegen typischerweise um 0,1–0,3 s.
2. Die eigentlichen Interaktionen bleiben unter headless Linux-WebKit bei
   DPR 2 stark von der Raster-/Frame-Arbeit abhängig. Auf demselben langsameren
   Runner brauchen identische Interaktionsfälle etwa 20–29 s bei DPR 2,
   aber nur 8,5–10,5 s bei DPR 1. CSS-Viewports und Assertions sind dabei gleich.

Kein Fehler des Spielzustands und keine dauerhaft bewegte Trefferfläche ist
nachgewiesen. Die genaue tiefe Ursache der WebKit-/Treiberlatenzen bzw.
physischer Runner-Ressourcenschwankungen bleibt offen. Ein einziger Worker
reproduziert den Fehler ebenfalls; parallele Tests im selben Job sind keine
notwendige Voraussetzung. Die ersten Ausreißer haben keine Vorgängertests
im jeweiligen Shard.

## Kontrollierte Linux-Vergleiche

Der optionale Workflow `diagnose-webkit.yml`, Eingabe `actionability=true`,
kopiert die vorhandenen Auswahltests in ein temporäres Verzeichnis. Die
Assertions bleiben unverändert: beide betroffenen Fälle je dreimal, ein Worker,
30 s Testlimit und **keine Retries**. Eine Baseline ohne Frame-Monitor trennt
Messaufwand von Verhalten; weitere Varianten erfassen Frame-Abstände,
Bounding-Box-Änderungen, Animationen und Seitenerstellungszeit.

Erste Matrix: [39398559487](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39398559487), `7bef54b`.

| Variante | Ergebnis | Schlussfolgerung |
|---|---|---|
| DPR 2, normale Bewegung, ohne Frame-Monitor | 6/6 | Erster Fall 21,5 s, spätere etwa 13–14 s |
| DPR 2, normale Bewegung, Frame-Monitor | 6/6 | Frame-Abstände bis 2.109 ms; Instrumentierung allein erklärt den ursprünglichen Fehler nicht |
| DPR 2, reduzierte Bewegung | 6/6 | Erster Fall nahe am Limit, Frame-Abstände weiter über 1 s; kein ausreichender Animations-Ursachennachweis |
| DPR 1, normale Bewegung | 5/6 | Erster Fall Timeout, `newPage` 15.532 ms; DPR 1 allein reicht bei kaltem Browser nicht |
| DPR 2, nur ein initialer Spielaufruf | 5/6 | Erster Fall Timeout, Frame-Abstand bis 4.848 ms; Entfernen des doppelten Aufrufs allein reicht nicht |

Diese Jobs hatten unterschiedliche AMD-CPU-Modelle. Aus ihrem direkten
Zeitvergleich wäre eine präzise DPR-/Animationswirkung deshalb nicht ableitbar.

Gepaarte Initialisierung: [39399408550](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39399408550), `90e4690`.
Auf zwei Runnern wurden beide Reihenfolgen ausgeführt. Baseline zuerst: erster
Fall Timeout, danach initialisierte Variante 6/6. Initialisierung zuerst:
initialisierte Variante 6/6, nachfolgende Baseline ebenfalls 6/6.
Die erste leere Initialisierung des kalten Workers benötigt 4.288 ms,
die anschließende Testseite für `newPage` nur 128 ms.

Die Initialisierung **allein** ist dennoch keine ausreichende Korrektur:
[vollständige CI 39400464751](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39400464751)
auf `39870d9` meldet erneut den ersten Auswahltest als flaky. Der erste echte
Kartenklick benötigt trotz getrennter Initialisierung 6.747 ms, der Radar-Klick
4.067 ms. Diese fehlgeschlagene Zwischenkorrektur wird nicht als Behebungsnachweis
gewertet und ist der Grund für den folgenden kontrollierten DPR-Vergleich.

Gepaarte Pixeldichte: [39402923178](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39402923178), `dea7b85`.
Beide Profile verwenden dieselbe leere Initialisierung und denselben Frame-Monitor;
pro Runner werden beide Dichten in umgekehrter Reihenfolge geprüft.

| Reihenfolge / gleicher Runner | DPR 1: Fixture-Zeiten der Interaktionsfälle | DPR 2: Fixture-Zeiten der Interaktionsfälle |
|---|---|---|
| DPR 1 zuerst | 5.270–9.847 ms; 6/6 | 11.773–14.016 ms; 6/6 |
| DPR 2 zuerst | 8.527–10.518 ms; 6/6 | 20.066–29.149 ms; 6/6 |

Diese Werte beginnen bei der tatsächlichen Testseitenerstellung und schließen
die Worker-Initialisierung aus. Im langsameren Runner sinkt auch der höchste
Frame-Abstand von 3.833 ms auf 937 ms. Damit ist die erhebliche Pixeldichtewirkung
auf demselben Host und bei unveränderter Geometrie nachgewiesen. Alle zwölf
Fälle der kombinierten DPR-1-Variante bestehen ohne Retry, mit großem Abstand
zum 30-s-Limit. Insgesamt wurden 78 Linux-Vergleichsfälle ausgeführt.

## Endgültige kleine Testkorrektur

Nur `puzzle-selection.spec.mjs` importiert `tests/integration/webkit-startup.mjs`.

- Eine automatische Worker-Fixture initialisiert für WebKit einen frischen,
  leeren Renderer und wartet zwei echte Frames ab. Danach wird der Kontext
  geschlossen. Kein Spiel, Bild oder Spielstand wird vorgeladen. Die echte
  Spielseite entsteht weiterhin in einem unabhängigen Testkontext.
- Renderer-Initialisierung fällt damit in das normale Worker-Setupbudget.
  Playwright 1.64.0 setzt dieses standardmäßig auf dasselbe Projektlimit
  von 30 s. Test- und Assertion-Timeouts bleiben unverändert; Spielinitialisierung
  und alle Interaktionen müssen weiterhin in ihr bisheriges Testbudget passen.
- Nur die funktionale WebKit-Auswahlsuite verwendet DPR 1. Sie prüft DOM,
  Spielstände, Routen, Undo, Reload und CSS-Pixel-Trefferflächen, keine physische
  Retina-Pixelauflösung. Ihre beiden Screenshot-Anhänge verwenden bereits
  `scale: 'css'`. Viewports, Animationen, native Ereignisse und Assertions bleiben
  gleich. Chromium behält seine Projektwerte: Desktop 1, Mobil 2,625.

DPR 2 bleibt Standard der übrigen Desktop-WebKit-Suite. Insbesondere
`consolidation.spec.mjs` / `puzzle-consolidation.mjs` prüfen dort weiterhin
Rätselwechsel, getrennte Markierungen, Rahmen, Geometrie, Reload und Reset.
Die Rendering-, Karten-, Pointer-/Touch- und Lifecycle-Tests werden nicht
auf eine andere Pixeldichte umgestellt. Die Auswahlfälle selbst bleiben
vollständig erhalten; insgesamt weiterhin 470 WebKit-Fälle.

Diese Profiltrennung beseitigt unnötige vierfache Rasterpixelarbeit in Tests,
deren fachlicher Vertrag in CSS-Pixeln und Spielzuständen liegt. Sie ist keine
Behauptung, die Retina-Renderleistung des Produktionsspiels verbessert zu haben.
Kein `force`, kein Sleep, kein zusätzlicher Retry, kein reduziertes Timeout-
Schutzniveau und keine abgeschaltete Flaky-Erkennung. Der doppelte initiale
Spielaufruf bleibt unverändert, um keine weitere Teststrukturänderung zu mischen.
Reduzierte Animationen werden mangels ausreichender kausaler Evidenz nicht gesetzt.

## Regression und Abschluss

Die endgültige kombinierte Variante besteht lokal in den betroffenen WebKit-
Desktop-/Mobilfällen 20/20 ohne Retry. Die vollständige lokale Auswahlsuite
meldet 24 bestanden und zwei Fehler ausschließlich des bereits vorher
nachgewiesenen nativen Tastaturtests unter macOS. Dieser Test bleibt unverändert.
Die tatsächlichen Browserprofile wurden zusätzlich gemessen: WebKit 1/1,
Chromium 1/2,625. Chromium-Interaktionsregression: 12/12 ohne Retry.

Die Diagnose-Zwischenstände lösen reguläre CI-Läufe aus; überholte Zwischenläufe
werden nach dem nächsten endgültigen Push abgebrochen, die abgeschlossenen
Diagnoseartefakte bleiben erhalten. Der vollständige CI-Lauf des abschließenden
Commits wird separat bis zum Ende geprüft und im Abschlussnachtrag festgehalten.
Eine grüne Diagnose ersetzt diesen Volltest nicht.

Verbleibendes Risiko: Runner- und WebKit-Latenzen schwanken weiterhin. Das
funktionale Testprofil besitzt nach den Messungen deutlich mehr Reserve;
DPR-2-Verhalten bleibt durch separate Integration-/Renderingtests abgedeckt.
Ein Fehler ausschließlich in einer nicht geprüften Kombination aus Pixeldichte
und Rätselzustand lässt sich durch endliche Tests nicht ausschließen. Die
Abwägung für die Merge-Empfehlung benötigt deshalb auch die vollständige finale CI.
