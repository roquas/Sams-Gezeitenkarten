# PR #123: unabhängige Analyse der vier WebKit-Befunde

Analysierter Produkt-/Teststand: **`a69af2885ffbd00cc67db56d415460525c08124a`**. [CI 45047947650](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45047947650), [Job 137286545964](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45047947650/job/137286545964), WebKit Desktop. **Diagnosebericht, kein Produkt- oder Testfix und keine Mergefreigabe.**

## Ergebnis je Befund

| Befund | Einordnung und Beleg | Korrektur / Restrisiko |
| --- | --- | --- |
| Reduced Motion, vier Labels nach 4 s | **Originalursache nicht abschließend geklärt.** Ein begrenzter Main-Thread-Stillstand reproduziert exakt die fehlgeschlagene 4-s-Abfrage, mit nachfolgend erfüllten Promises und korrektem Cleanup. Ein dauerhaftes Schild wird damit nicht nachgewiesen. Die ursprünglichen CI-Traces enthalten keine Animations-/Promise-Telemetrie. | Kein spekulativer Fix; Vertrag der zuverlässigen Entfernung bleibt verbindlich. Ausstehende versus erfüllte Promises im ursprünglichen Fehlerfenster lassen sich nicht nachträglich bestimmen. |
| Gemeinsame Regeln / Navigation | **Kumuliertes Testbudget und Ausführungsverzögerung belegt**, kein abweichender Regelzustand. Erstversuch: bereits 15,19 s für Regeln/Bilder, erster HTML-Vergleich besteht bei 24,52 s; Fortsetzen endet erst bei 32,10 s. Retry: Stundenwechsel, abschließende HTML-Gleichheit, keine verschachtelten Koordinaten und keine Seitenfehler bestehen noch bei 35,89–36,18 s, nach dem Budget. | Keine Änderung. Konkreter Hostengpass nicht gemessen; keine fachliche Regelregression nachgewiesen. |
| Land-Hover | **Langsame native Interaktionen/Actionability**, keine verletzte Hover- oder Sperrbedingung beobachtet. Beide Hover-Konturen und 3-px-Breite stimmen; Land bleibt für Notizen und Route gesperrt. Im Erstversuch dauert der letzte Radar-Ursprungsklick 6,23 s und endet erst bei 32,31 s; die folgende Ursprungsassertion besteht anschließend. Im Retry bestehen alle Assertions innerhalb des Budgets. | Keine Änderung. Keine Ursache allein aus dem bestandenen Retry abgeleitet. Der konkrete Grund der langsamen Zustellung ist offen. |
| Lange Schilder / Neuzeichnung | **Budgetüberschreitung durch gebündelte visuelle Nachweise.** Overlay- und Animationsidentität, unveränderte Startzeiten, Textbreite und expliziter Cleanup bestehen in beiden Versuchen. Vier Screenshots benötigen zusammen rund 17,85 / 17,60 s; die letzte Aufnahme endet erst bei 31,63 / 30,53 s. | Keine Änderung. Cleanup wird hier nach dem vom Test ausdrücklich ausgelösten `finish()` geprüft; das ersetzt keinen Nachweis natürlicher Reduced-Motion-Fertigstellung. |

Die vier Tests wurden zunächst **unverändert, einzeln, in getrennten Playwright-Aufrufen und ohne Retries** auf WebKit Desktop ausgeführt: **4/4 bestanden**. Das ist ein Reproduktionsversuch und kein Ursachenbeweis. Weitere **16/16** unveränderte Startfeld-/Regelquellenfälle bestehen auf Chromium/WebKit, jeweils Desktop/Mobil, ebenfalls ohne Retries.

## Hauptbefund: Reduced Motion

### Was der ursprüngliche CI tatsächlich belegt

- `emulateMedia({reducedMotion:'reduce'})` wird vor dem Laden erfolgreich ausgeführt. Die anfängliche Papier-Deckkraft ist 1, und die anfänglichen Schilder verschwinden nach der gewöhnlichen Neuzeichnung.
- Die manuelle Einblendung enthält die richtigen vier Namen. Anschließend bleibt die Anzahl während der 4-s-Abfrage bei vier, sowohl im Erstversuch als auch im Retry.
- Der CI speichert **keine** tatsächlichen Animationsdauern, `currentTime`-Werte, Promise-Zustände, `clear()`-Aufrufe oder Overlay-IDs dieser manuellen Einblendung. Diese Werte werden nicht aus dem Screenshot erraten.
- Fehlerbilder und Trace-Frames wurden für Erstversuch und Retry geprüft. Sie zeigen spätere beziehungsweise anders gerasterte Stände und sind keine zeitgleichen Messungen des Animations-/Promise-Zustands am Abfrageende. Beim bestandenen Hover-Retry wurde mangels Fehlerbild der letzte erhaltene Screencast-Frame geprüft.
- Der im selben CI bestandene **andere**, normale Animationstest protokolliert 4900-ms-Tracks und natürliche Fertigstellung nach 5848 ms Wandzeit, Cleanup 1 ms später. Das belegt mögliche verzögerte Zustellung in diesem Lauf, aber nicht die Ursache des Reduced-Motion-Fehlers.

### Beobachtende Instrumentierung und Kontrollen

[probe.mjs](probe.mjs) läuft gegen dieselben Produktbytes. Nur in der HTTP-Antwort werden Beobachtungsaufrufe für `show`, `mount`, `clear` und den bestehenden `Promise.all`-Callback ergänzt. Entfernen dieser Aufrufe ergibt bytegenau den Ausgangstext. Der `finished`-Getter gibt das **identische native Promise** zurück; seine tatsächliche Erfüllung/Ablehnung wird beobachtet. Die normale Instrumentierung setzt keine Animationszeiten, pausiert/beendet keine Animation und löst keinen zusätzlichen Cleanup aus. IDs stammen aus WeakMaps der tatsächlichen Overlay-/Animationsobjekte.

| Frage | Tatsächlicher Messbefund auf dem unveränderten Produkt |
| --- | --- |
| Reduced Motion aktiv? | Ja, bei Konfiguration beider Einblendungen `matchMedia(...).matches === true`; kein verdeckter Media-Wechsel. Dies wurde in den Messläufen direkt beobachtet, nicht nachträglich im ursprünglichen CI. |
| Dauer und Zustand der Animationen? | Manuell acht native Tracks, jeweils **3000 ms**, keine Verzögerung, eine Iteration, Playbackrate 1, konstante Deckkraft 1. |
| `finished` erfüllt, abgelehnt oder ausstehend? | Ohne Last alle acht erfüllt. Während der gezielten Blockade alle acht ausstehend, danach alle erfüllt. Ausschließlich der absichtliche Retrigger verwirft die alten acht mit `AbortError`; die neuen acht werden erfüllt. |
| Wird Cleanup aufgerufen? | Im Referenzfall bei rund 3,01 s. Im Lastgegenlauf nach Freigabe bei rund 4,70 s: `all-settled → clear-call → removed`, richtige Instanz, ohne neue Einblendung. |
| Falsche aktive Instanz / zusätzlicher Trigger? | Referenz und Last: genau initiale und manuelle Einblendung, manuelles Overlay ID 2 bleibt bis zu seinem Cleanup aktiv. Beim gezielten Retrigger wird ID 2 durch ID 3 ersetzt; der alte Callback entfernt ID 3 nicht. |
| Gewöhnliche Neuzeichnung startet erneut? | In der Live-Kontrolle bleiben Overlay-ID, native Track-IDs und Startzeiten beim Markieren und zweimaligen Illustrationswechsel identisch. `mount` erhält dasselbe Puzzle, kein zusätzliches `show`. DOM-Umhängen erzeugt MutationObserver-Einträge mit weiterhin verbundenem **demselben** Knoten; das wird nicht mit Cleanup verwechselt. |
| Animationszeit versus Playwright-Wartezeit? | Im ersten Lastgegenlauf läuft Wandzeit von 2501 auf 4701 ms weiter, während Dokument-Timeline und alle acht gelesenen Animationszeiten bei **2499 ms** stehenbleiben. Die 4-s-Abfrage scheitert. Danach springen die nativen Tracks auf `finished/currentTime=3000`; alle Promises und Cleanup folgen bei 4703 ms. |

**Gezielter Gegenlauf:** Einmalige, auf den Testtab begrenzte 2,2-s-Main-Thread-Blockade ab 2,5 s nach der manuellen Konfiguration. Dreimal ausgeführt: jedes Mal dieselbe fehlgeschlagene originale 4-s-Abfrage, danach natürliche Erfüllung aller Promises und vollständige Entfernung. Die Diagnose verfolgt nach einem Fehlschlag weiter; sie macht die ursprüngliche Assertion dadurch ausdrücklich **nicht grün**. Ein moderater Lastlauf (120 ms Arbeit alle 250 ms für sechs Sekunden) besteht und entfernt bei rund 3,01 s.

**Negativkontrolle:** Nur im ausdrücklich als `fault` markierten künstlichen Antworttext wird der Cleanup für die manuelle Instanz verhindert. Dann sind alle acht Promises nach 3 s erfüllt, aber vier Labels bleiben auch nach dem zusätzlichen 3-s-Diagnosefenster bestehen; kein passender `clear-call`. Die unveränderte 4-s-Assertion schlägt fehl. Die Instrumentierung unterscheidet somit verzögerte Ausführung von tatsächlich ausbleibendem Cleanup. Dieser absichtliche Fehler ist **nicht** in Produkt-/Testdateien enthalten.

**Beweisgrenze:** Der Lastgegenlauf beweist einen Mechanismus für das beobachtete Fehlerbild; er beweist keine bestimmte CPU-/GPU-Blockade des ursprünglichen CI. Periodisches Lesen von Zuständen kann selbst Timing beeinflussen; deshalb existieren unveränderter Einzeltest, passiver Beobachter und aktiv lesender Kontrolllauf getrennt. Der Versuch mit einem zusätzlichen leeren Vordergrundtab änderte lokal `document.visibilityState` nicht (`visible`); eine Hintergrundursache wird daraus nicht abgeleitet. Ein im Original-CI dauerhaft ausstehendes Promise bleibt mangels dortiger Telemetrie unentscheidbar. **Keine Friständerung und kein spekulativer Fix.**

## Entscheidungsvorlage für unabhängige Nachreview

1. **Startfeld-/Regelkorrektur isoliert fachlich abnahmefähig?** Nach den beobachteten fachlichen Zuständen und den separaten 16/16 Prüfungen ja: kein zweites Startschild, Mehrhexreferenzen erhalten, gemeinsame Regelquelle identisch. Auch der ursprüngliche verspätete Regel-Retry bestätigt alle fachlichen Endzustände. Das ist eine fachliche Einordnung, **keine Mergefreigabe** und kein grüner Gesamt-CI-Nachweis.
2. **Nachgewiesener blockierender Produktfehler?** Kein dauerhaft stehenbleibendes Schild oder anderer Produktvertragsbruch am echten Head nachgewiesen. Die künstliche Negativkontrolle zeigt, wie ein solcher Fehler aussehen würde und dass er abgelehnt wird. Die originale Reduced-Motion-Ursache bleibt offen; daraus folgt weder eine erwiesene Produktstörung noch deren Ausschluss. Ein realer Fall „native Promises erfüllt, richtige Instanz aktiv, Cleanup bleibt aus“ wäre ein Produktfehler und vor einem Merge zu beheben. Die rote Bezugs-CI bleibt unverändert rot.
3. **Separate Nacharbeit über [#121](https://github.com/roquas/Sams-Gezeitenkarten/issues/121)?** Begründet für die A2b-Animationstimeline, Promise-Zustellung und Cleanup-Stabilität, mit ausdrücklicher Aufnahme des Reduced-Motion-Vertrags. Hover-/Screenshot-/Navigationsbudgets können als eigenständige Teststrukturthemen verknüpft werden; sie sind nicht ohne Beleg dieselbe Ursache. Eine Zurückstellung setzt bewusste Risikoentscheidung der unabhängigen Nachreview voraus; #121 wird nicht als erledigt gewertet.

Keine Produkt- oder kanonischen Testdateien korrigiert; ausschließlich Diagnoseunterlagen ergänzt. Keine neuen Retries/Skips, keine gelockerten Lebensdauer-/Cleanup-Assertions. Engine, Solver, Generator, Rätseldaten, Redaktion, Gestaltung und B1-Zeitmessung unverändert. Kein Merge und keine eigenständige Mergefreigabe.

## Nachweise und Reproduktion

[CI-Zeitachsen und Screenshot-/Trace-Hashes](ci-evidence.json) · [Einzeltests, Abgrenzungsfälle und verdichtete Messdaten](results.json) · [Instrumentierung und kontrollierte Gegenläufe](probe.mjs).

Originalartefakt: ID **14764289847**, `webkit-chart-report-3`, SHA-256 **0909a9ddded72e931b36e2f44b3ba798cab9dfa85be5227b64225db381e35eb0**. Alle acht Traces (einschließlich bestandenen Hover-Retrys) geprüft. Die vollständigen Rohdaten bleiben lokal unter `.dev/pr123-cause/`; die dokumentierten Szenarien erzeugen sie erneut.

Unveränderte vier Fälle **einzeln** auf WebKit Desktop mit den regulären Geräteeinstellungen und `--retries=0` ausführen: `reduced motion is immediate`, `selection and game use identical`, `land receives the same mouse` und `redraws preserve animation identity`. Für die Messung wurde pro Fall ein eigener Runner auf Port 4201 gestartet; Standardfristen und Desktop-DPR 2 blieben bestehen.

Bei laufendem lokalen Server (`python3 scripts/dev-server.py --port 4201`), aus dem Repository-Wurzelverzeichnis:

```sh
DIAG_MODES=passive,sampled,moderate,busy,redraw,retrigger,background,fault node docs/verification/PR123-webkit-causes/probe.mjs
```

`DIAG_BASE_URL` und `DIAG_OUT` wählen Server und Ausgabeordner. Das Skript verweigert abweichende Controller-/Demo-Bytes gegenüber dem fixierten Head. `busy` und `fault` sollen die originale Assertion rot erzeugen; sie sind Gegenbeweise, keine zusätzlichen bestandenen Produktregressionstests. Der alleinige Bericht begründet keine künstliche Produkt-/Teständerung oder manuell wiederholte CI.
