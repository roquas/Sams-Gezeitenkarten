# WebKit CI: unabhängige Untersuchung

Stand: 23.10.2026. Diese Untersuchung betrifft Browser-/Touch-/Scroll-/Klicktests.
PR #75 und die Generator-, Asset- und Puzzleverträge bleiben unverändert.

## Gesicherte Ausgangslage

- Aktueller `main`: `b53e25bb2434c2db4b7f227d220366701556998c` (Merge #74),
  über `git ls-remote` geprüft.
- PR #75: offen, nicht gemergt, Head
  `ac8bdaa77d7ea5e9f55c6fb23175a10c595fcebb`, Merge-Ref
  `f2ab292315ffae8d3d050e4493fd869b266061f0`.
- Main-Lauf [39925145855](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39925145855):
  abgeschlossen, 9/10 Jobs erfolgreich; WebKit-Shard 2 fehlgeschlagen.
- PR-Lauf [39933197203](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39933197203):
  abgeschlossen, 8/10 Jobs erfolgreich; WebKit-Shards 1 und 2 fehlgeschlagen.
- Originallogs der Jobs `120319567091`, `120346280146`, `120346280182`
  vollständig bezogen, relevante Abschnitte ausgewertet und lokal außerhalb
  des Repositorys gesichert.
  WebKit-JSON-Berichte von main/Shards 1 und 2 sowie PR/Shard 1 gelesen;
  PR/Shard-1-HTML-Bericht einschließlich Retry-Trace und Fehlerscreenshot gelesen.

## Versionen und Ausführung

CI: Playwright **1.64.0**, WebKit **27.2 / Revision 2370**,
`webkit-ubuntu-26.04.zip`; GitHub-hosted `ubuntu-latest`, tatsächlich
Ubuntu **26.04.1 LTS**, Runner-Image `20261012.163.1`, Runner `2.338.0`,
Node **22.23.3**, npm **10.9.9**. Installation:
`npm ci --no-audit --no-fund`, `npx playwright install --with-deps webkit`.

Sechs Shards, `fullyParallel:true`, **ein Worker je Shard**, Desktop Safari
DPR 2 und iPhone 13 DPR 1. Unter CI ein Retry und `failOnFlakyTests:true`.
Unveränderte Playwright-Defaults: 30 s Testbudget, 5 s Assertionbudget;
Webserverstart 20 s. Ein grüner Retry macht einen Job mit Flake weiter rot.
Jeder Test bekommt einen frischen Browserkontext; ein Worker kann den Browser
zwischen erfolgreichen Tests weiterverwenden. Nach Fehlern wird er neu gestartet.

Lokale Gegenproben: Debian 13.6, Node 24.19.0, derselbe Playwright-/WebKit-Build
mit Debian-Browserpaket, Software-Rendering, CPU-Limit zwei Kerne, 8 GiB RAM.
Fehlende Debian-Bibliotheken wurden nur temporär in den lokalen Browsercache
extrahiert. `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` umgeht dessen
ldconfig-Vorprüfung; Browser und Tests laufen tatsächlich. Das ist keine
identische Reproduktion des Ubuntu-Runners.

## Ursprüngliche Fehler, UTC-Zeitstempel

Die Zeilen beziehen sich auf die oben genannten unveränderten Commits.

| Lauf / Job | Test | Beobachtung |
| --- | --- | --- |
| main / Shard 2 | `tests/integration/chart-scroll.mjs:79`, `chart touch input 820px`, water | 08:39:20.668: nach 5 s `scrollTop=11`, erwartet >20; Retry bestanden |
| main / Shard 2 | dieselbe Zeile, land | 08:40:12.045: `scrollTop=18`; Retry bestanden |
| main / Shard 2 | `chart-scroll.mjs:90`, waiting radar | 08:41:11.007: `scrollTop=4`; Retry bestanden |
| main / Shard 2 | `chart-scroll.mjs:104`, native tap/horizontal drawing/one-step undo | 08:42:32.698: Erstlauf und Retry überschreiten 30 s; keine genauere hängende Aktion im Log |
| PR #75 / Shard 2 | `chart-scroll.mjs:79`, water | 09:48:01.163: `scrollTop=15`; Retry bestanden |
| PR #75 / Shard 2 | `chart-scroll.mjs:90`, waiting radar | 09:48:01.164: `scrollTop=16`; Retry bestanden |
| PR #75 / Shard 1 | `tests/browser/chart-ux.spec.mjs:4`, coordinate notation | 09:57:13.181: `#toggleDistances.click()` (Zeile 8) überschreitet 30-s-Testbudget, wartet auf visible/enabled/stable; Retry bestanden |

Shard-1-JSON: Erstlaufbeginn 09:56:14.467 UTC, gemeldete Dauer 32.733 s;
Retrybeginn 09:56:54.316 UTC, Dauer 17.773 s. Die Dauer enthält Fixture-/Abbauarbeit
und darf nicht als Dauer eines einzelnen Klicks gelesen werden. Auf main war
derselbe erste Shard-1-Test mit 20.807 s erfolgreich.

Im erfolgreichen PR-Retry: beforeEach rund 5.3 s (Navigation, Speicher löschen,
Reload, 25 Zellen), Abstandsklick 1.58 s, C1-Klick 6.60 s. Der Fehlerscreenshot
zeigt keine erkennbare modale Überlagerung; der Abstandsschalter befindet sich
unterhalb des sichtbaren Kartenausschnitts. Der Fehlerlog erreicht weder
Scroll-Into-View noch Hit-Test noch die Klickausführung. Damit sind eine
Überlagerung, ein instabiles Rechteck oder ein ausgeführter Klick mit verlorener
Zustandsänderung **nicht bewiesen**. Ein erfolgreicher Retry-Trace erklärt den
fehlgeschlagenen Erstlauf nicht.

## Nachgewiesene Diagnoselücke und gezielte Korrektur

`playwright.webkit.config.mjs` schreibt nach `webkit-test-results`. Der Workflow
verwendete in beiden WebKit-Uploadschritten `test-results`, den Chromium-Ordner.
Der PR-Shard-1-Report enthält daher nur den HTML-Report und dessen eingebettete
Kopien, keine direkt hochgeladenen WebKit-Fehlerordner. Außerdem zeichnet
`on-first-retry` den fehlgeschlagenen Erstlauf überhaupt nicht auf.

Die Korrektur verwendet den tatsächlichen WebKit-Ausgabeordner und den in
Playwright 1.64 vorhandenen Modus `retain-on-failure-and-retries`. Er behält
fehlgeschlagene Erstläufe und alle Retries, auch erfolgreiche, zum Vergleich.
Erfolgreiche Erstläufe werden verworfen; die vorhandene Dreitagesaufbewahrung
bleibt bestehen. Das ergänzt dauerhaft brauchbare, begrenzte Diagnoseartefakte.
Es behauptet keine Behebung der ursprünglichen Browserflakes.

## Einordnung der Ursachen

**Nachgewiesen:** die obige Artefakt-/Trace-Lücke; Scrollflakes und ein Touch-Timeout
existieren bereits ohne F04b auf main. Die Scrolltests messen bei schmalen
Viewports `#gameSurface.scrollTop`, ab 881 px den Dokument-Scroll. Sie fokussieren
die Zelle, prüfen Treffer und verfügbare Scrollstrecke, senden in WebKit
synthetische Pointer-Ereignisse und getrennt eine native PageDown-Eingabe.
Nur Chromium bietet hier einen nativen Touch-Drag über CDP. Ein physischer
iOS-Finger-Swipe ist damit nicht nachgewiesen.

**Noch ungesichert:** ob die PageDown-Taste zu lange gehalten wird, ob langsame
Compositor-/rAF-Fortschritte bei DPR 2 die Assertions und Actionability-Prüfung
verzögern, ob kalter Browserstart oder Testreihenfolge entscheidend sind.
Die UI-Initialisierung lädt DTO/Katalog asynchron; die untersuchten Tests warten
bereits auf echte Kartenzellen. Die Abstandshandler werden vor dem ersten
Map-Render installiert. Ein fehlender Handler ist damit nicht durch bloßes
`page.goto()`-Timing zu erklären. Die Distance-Semantik ist unabhängig von
Markierungswerkzeug und Undo; sie wird nicht geändert.

## Verhältnis zu PR #75

Der vollständige Diff umfasst zwölf Dateien: Dokumentation, ein Stichprobenskript,
reine Generatormodule und Engine-Tests. UI, Browser-/Integrationstests,
Playwright-Konfiguration und Workflows sind bytegleich. Der Anwendungsimportpfad
lädt die neuen Generatormodule nicht, und die Browserjobs führen die neuen
Engine-Tests nicht aus. Es gibt keinen belegten technischen Wirkungspfad zu den
beobachteten Browserfehlern. Der neue Shard-1-Fehler allein beweist keinen
Zusammenhang. Seine Unabhängigkeit ist ohne eigene Reproduktion auf main noch
nicht abschließend experimentell belegt.

## Reproduktion und Gegenproben

Alle Diagnosemutationen wurden in temporär erzeugten Testkopien bzw. frischen
Browserkontexten außerhalb des Repositorys vorgenommen und werden nicht ausgeliefert.
Die Ausgangstests waren unverändert; zusätzlich aktiviertes Tracing kann ihr Timing
beeinflussen. Fehlgeschlagene Browserstarts während der Bibliothekseinrichtung
zählen nicht als ausgeführte Tests oder Produktfehler.

| Gegenprobe | Ergebnis |
| --- | --- |
| Desktop-WebKit: Abstandsklick und alle sechs 820px-Scroll-/Touch-/Undo-Fälle, `--retries=0 --repeat-each=3 --trace=retain-on-failure` | **21 bestanden**, 5.4 min, ein Worker; kein ursprünglicher Fehler reproduziert |
| Native PageDown gehalten, vier frische DPR-2-Kontexte bei 820×900, Fokus D3 | Alle vier erreichen `scrollTop=643` und `scrollend` **vor** dem Loslassen; erste Frames 11/38/46/36 px, Abschluss nach 1535/1468/1502/1789 ms |
| Native PageDown sofort losgelassen, vier frische DPR-2-Kontexte | Nach 1.5 s zunächst 34/35/39/643 px; drei ohne beobachtetes `scrollend`. Das ist nur ein Zwischenstand, kein Nachweis dauerhaft blockierten Scrollens |
| Negativkontrolle: `keydown(PageDown).preventDefault()` in der unveränderten Wasser-Scrollprüfung | Erwartet fehlgeschlagen bei **0 statt >20 px**; Treffer-/Pointer-Vorbedingungen bestanden |
| Negativkontrolle: nur Abstandsklick in Capture-Phase per `stopImmediatePropagation()` unterdrückt | Erwartet fehlgeschlagen an fehlendem `#distanceStatus [data-coordinate="C1"]`; ein bloß erfolgreicher `locator.click()` reicht dem bestehenden Test nicht |
| Künstlicher Flake: Erstlauf absichtlich fehlgeschlagen, Retry erfolgreich; tatsächliche neue CI-Trace-Konfiguration | **Exit 1**, als flaky gewertet; Erstlauf-Screenshot und **beide `trace.zip` vorhanden**. `failOnFlakyTests` bleibt wirksam |
| `npm run test:unit` / `npm run test:content` / `npm run test:puzzles` | **85 / 20 bestanden**; Demo eindeutig, keine redundanten Hinweise |

Gezielter Ausgangslauf (übliche Browserumgebungsvariablen wie oben):

```sh
CI=1 npx playwright test --config playwright.webkit.config.mjs \
  --project webkit-desktop \
  --grep 'chart touch input 820px|coordinate notation is shared' \
  --retries=0 --repeat-each=3 --trace=retain-on-failure
```

Die gehaltene-Taste-Hypothese wurde damit lokal **nicht bestätigt**. Die beobachteten
Frameabstände machen Rendering-/Scheduler-Verzögerungen plausibel, beweisen aber
weder den Auslöser des ursprünglichen 5-s-Fehlers noch des 30-s-Klicktimeouts.
Sofortiges Loslassen ist angesichts der Zwischenstände keine begründete Korrektur.
Keine Scroll-Assertion wird abgeschwächt oder durch programmgesteuertes Scrollen
ersetzt. Keine App-/Testaufbaukorrektur wird aus bloßer Plausibilität abgeleitet.

Zusätzlich werden die vollständigen betroffenen Shards 1 und 2 mit einem Worker,
beiden echten Projekten, CI-Retry-/Flake-Regeln und neuer Trace-Konfiguration geprüft.
Nur Serverport, Reporter und lokaler Ausgabeordner sind in einer temporären
Konfiguration umgelegt. Die abschließenden Ergebnisse und der aktuelle CI-Status
stehen in [PR #76](https://github.com/roquas/Sams-Gezeitenkarten/pull/76).

## Grenzen und nächste Experimente

Wiederholt grüne lokale Tests beweisen keine Flakefreiheit. Der Shard-1-Timeout
wurde auf main noch nicht reproduziert; fehlgeschlagene Erstläufe der alten CI
haben keine Traces. Der große main-HTML-Report (68 MB) überschreitet außerdem das
32-MiB-Transferlimit der lokalen Dateischnittstelle; Logs/JSON sind ausgewertet.

1. Den nächsten **fehlgeschlagenen Erstlauf** aus den jetzt korrekt hochgeladenen
   `webkit-test-results` untersuchen; Actionability-Log, rAF-/Inputzeitpunkte,
   Scrollzustand, Layout und eventuelle Trefferblocker mit dem Retry vergleichen.
2. Bei erneutem Abstandstimeout zunächst denselben Test auf main in frischen
   Workern und in Shard-Reihenfolge ausführen. Ein kleiner, temporärer rAF-/Rect-
   Monitor soll stabile Geometrie von ausbleibenden Frames unterscheiden;
   zusätzlich einen unbeobachteten Kontrolllauf behalten.
3. Kalten/warmen Browser, DPR 2/1 und einen/zwei Worker kontrolliert vergleichen.
   Eine geringere Pixeldichte oder ein Warm-up ist hier **noch keine freigegebene
   Korrektur** und wird nicht in die bestehenden Fälle eingebaut.
4. Den PageDown-Ablauf mit vollständig verarbeitetem down/up-Paar gegen die
   gehaltene Variante vergleichen, einschließlich `scrollend` und unveränderter
   Bewegung im richtigen Container. Physische iOS-Swipes separat am Gerät prüfen.

Tracing fügt Aufwand hinzu und kann Renderingflakes sowohl sichtbar machen als
auch zeitlich verändern. Gespeichert werden nur Fehler und Retries, für drei Tage;
die Laufzeiten müssen bei der weiteren Untersuchung mit betrachtet werden.
Dieser PR behebt die nachgewiesene **Diagnoselücke**, nicht nachweislich die
ursprüngliche Browserinstabilität. Er bleibt deshalb ein Diagnose-Draft.

PR #75 nicht wegen dieser Daten als fachlich fehlerhaft einstufen und nicht in
diesem Branch verändern. Vor einem Merge die Browserfehler unabhängig klären und
den finalen Stand erneut mit allen CI-Prüfungen bewerten; ein erfolgreicher Retry
allein genügt bei aktivem `failOnFlakyTests` nicht.
