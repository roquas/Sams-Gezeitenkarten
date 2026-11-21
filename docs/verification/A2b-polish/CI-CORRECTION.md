# PR #118: gezielte CI-Nachkorrektur

Untersuchter Ausgangs-Head: `bd6a1082e61ade2b40aa25a2bd952a6dec591c93`.
[Original-CI #477](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44800675533).

## Veraltete Rechteckannahme

`tests/browser/chart-ux.spec.mjs` fragte in der Lesbarkeitsprüfung ein `rect`
innerhalb jedes temporären Labels ab. Seit der organischen SVG-Form gibt es
hier Pfade; `querySelector('rect')` liefert `null`. Die ursprünglichen Logs
bestätigen denselben TypeError in beiden Chromium- und beiden WebKit-Profilen.

Der Test liest jetzt `data-label-width` und zieht den tatsächlich verwendeten
Textinnenabstand von insgesamt 16 SVG-Einheiten ab. Er prüft ausdrücklich eine
endliche positive verfügbare Breite und `getComputedTextLength() <= available +
0.1` (Subpixel-Toleranz in SVG-Einheiten). Pointer-Durchleitung, Mindestschriftgröße,
Koordinatenbegrenzung und anschließende Kartenbedienung bleiben geprüft.

Für jede der zwei Fensterbreiten (390/1440 px) wird die Anzeige frisch ausgelöst
und auf zwei Labels geprüft. Dadurch kann das reguläre 4,9-s-Ende zwischen den
Viewportwechseln keine leere, nur scheinbar erfolgreiche Lesbarkeitsprüfung
verursachen.

Gezielte Suche in `tests/` nach `rect`-Selektoren, Labelbreiten und alten
Pergamentmaßen: keine weitere Rechteckannahme für temporäre Pergamente.
`getBoundingClientRect()` für Layout und Rechteckverträge für Bilddateien sind
unabhängig davon und bleiben unverändert.

Lokale Wiederholung (macOS, Playwright 1.64.0):

- Chromium Desktop/Pixel 7, je drei Durchläufe: **6/6 bestanden**.
- WebKit Desktop/iPhone 13, je drei Durchläufe: **6/6 bestanden**.

```sh
node node_modules/@playwright/test/cli.js test tests/browser/chart-ux.spec.mjs --grep 'chart labels sit' --workers=1 --repeat-each=3
node node_modules/@playwright/test/cli.js test --config=playwright.webkit.config.mjs tests/browser/chart-ux.spec.mjs --grep 'chart labels sit' --repeat-each=3
```

## Getrennte Prüfung weiterer CI-Fehler

Die Original-CI enthält zusätzlich zwei eigenständige Befunde:

1. WebKit Desktop, natürlicher Animationsabschluss: die MutationObserver-Messung
   liefert 6001 ms beziehungsweise 5777 ms; erwartet wurden weniger als 5400 ms.
   Der Test erreicht die Assertion regulär. Das ist **kein** Überlauf des
   30-s-Testbudgets und wird nicht durch dessen Erhöhung behoben.
2. Mobile Chromium, langer Name nach normalen Redraws und Motiv-/Rahmenwechsel:
   die Breitenassertion schlägt in beiden Versuchen fehl. Der ursprüngliche
   boolesche Rückgabewert enthält keine konkreten Breitenmesswerte. Die
   Identitäts- und Startzeitprüfungen der Animationen unmittelbar davor bestehen.

Die Tests protokollieren diese Fälle jetzt unabhängig: gemessene/verfügbare
Schriftbreite, Schriftgröße und Skalierung sowie für sämtliche Animations-Tracks
Dauer, Startzeit, Bereitschaft, Abschluss, Dokumentzeit und Beobachtungszeit.
Alle bisherigen Assertions und Fristen bleiben dabei unverändert. Die lokale
Wiederholung dieser instrumentierten Fälle besteht in beiden Browserfamilien
jeweils **4/4**; der zusätzliche lokale WebKit-JSON-Lauf ebenfalls **4/4**.
Die vollständige [Linux-CI #478](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44804020783)
prüft den Diagnose-Head `ef769f6185e01505ebf301b19f50ab511696a99d`.
Der ursprüngliche `rect`-Fehler tritt dort in keinem der Chromium-Profile mehr auf;
der betroffene WebKit-Mobile-Shard besteht vollständig. Der natürliche
WebKit-Abschlusstest besteht ebenfalls mit unveränderter Obergrenze (5400 ms),
unveränderten 4900-ms-Tracks und unverändertem Gesamtbudget. Der erste Befund ist
somit in diesem Linux-Lauf nicht reproduziert; es ist kein Anwendungsfehler
nachgewiesen. Die Zeitdiagnostik bleibt für eine künftige Wiederholung erhalten.
Die gesicherten Linux-Messungen aus `webkit-timings-3` (Artefakt 14663950775)
zeigen acht Tracks mit 4900 ms Dauer, gemeinsamem Start und unveränderter
Startzeit beim Bereitschaftsabschluss. Alle melden `currentTime: 4900` und
`playState: finished`; ihre Abschlussbeobachtung erfolgt nach 5163 ms, die
Entfernung nach 5164 ms. Die Prüfung besteht im ersten Versuch. Das unterscheidet
normale Animationsparameter und Abschlusszustände von der späteren Zustellung
im Hauptthread, ohne den früheren 6001-ms-Ausreißer nachträglich für bestanden
zu erklären.

Mobile Chromium liefert nun in beiden Versuchen den konkreten Messwert:

| Messung | SVG-Einheiten |
| --- | ---: |
| Tatsächliche Pergamentbreite | 547 |
| Anpassungsziel nach 16 Einheiten Textinnenabstand | 531 |
| Gemessene Schriftbreite | 531,1393432617188 |
| Schriftgröße nach Anpassung | 14,380575341755893 |

Der Text liegt vollständig innerhalb des Pergaments. Der Restfehler am
Anpassungsziel beträgt nur 0,1394 SVG-Einheiten (ca. 0,096 CSS-Pixel bei der
gemessenen Skalierung 0,685584). Die alte Toleranz von 0,1 SVG-Einheiten verfehlt
diesen Rundungsrest um ca. 0,027 CSS-Pixel. Der Test erhält gezielt eine Toleranz
von 0,5 SVG-Einheiten: weniger als 0,35 CSS-Pixel im geprüften Mobilprofil und
weiterhin mindestens 15,5 Einheiten gesamter Textinnenabstand. Schriftverkleinerung,
vollständiger Text, Pfadform und Animationsidentität bleiben unverändert geprüft.
Kein Anwendungscode und keine Zeitfrist werden dafür geändert.

Original-Traces: Artefakte `playwright-report` (14662265403, SHA-256
`579537ab5309e055c463bd6bf18a93b99b44e0a65f828b213858d8f543e32f95`)
und `webkit-chart-report-3` (14662081812, SHA-256
`9b487a9c23dee7f91950305ac7c3a2364bd59c9e66c40a4f5fa7c65ae3ea5815`).

## Finaler Umfang und vollständige CI

Die Nachkorrektur ändert ausschließlich die beiden Browser-Testdateien und
Dokumentation. Die finale Wiederholung umfasst Lesbarkeit, natürlichen Abschluss
und Redraws in allen vier Geräte-/Browserprofilen: Chromium **6/6**, WebKit
**6/6 bestanden**. Zusätzlich besteht die explizite Nichtleer-/Positivbreitenprüfung
mit jeweils **2/2** in beiden Browserfamilien. Der neue exakte Review-Head
und der für ihn erneut gestartete vollständige CI-Lauf stehen im PR.

## CI #479: Animationsdauer und Abschlusszustellung getrennt prüfen

Ausgangspunkt: `27c69f594d93cbe60a740b1bb5169a4d8ab712a9`.
[CI #479](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44806070842),
[WebKit-Shard 3 / Job 136530292746](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44806070842/job/136530292746).
Alle übrigen zwölf Jobs bestanden, einschließlich Chromium und Deployment.

Die diagnostischen Messungen zeigen in beiden Versuchen acht regulär beendete
Tracks mit exakt 4900 ms Dauer, gemeinsamem unverändertem Start und
`currentTime: 4900`, `playState: finished`. Die alte Assertion setzte dennoch
Animationsdauer und reale Callback-/Observer-Zustellung gleich:

| Versuch | Beobachtete Entfernung | Abweichung vom nominellen 4900-ms-Ende | Entfernung nach letzter zugestellter Track-Fertigmeldung |
| --- | ---: | ---: | ---: |
| Erster | 5797 ms | 897 ms | 0 ms |
| Retry | 5757 ms | 857 ms | 0 ms |

Damit ist in diesen Messungen kein dauerhaftes Overlay nach zugestelltem
Animationsabschluss belegt. Der zuvor erfolgreiche Linux-Lauf #478 hatte
5164 ms beobachtet; #477 bis zu 6001 ms. Ein einzelner erfolgreicher Lauf
rechtfertigte die feste 5400-ms-Wanduhrgrenze folglich nicht.

### Korrigierter Prüfvertrag

- Die Phasenprüfung bleibt unverändert streng: 0/200/400/900/1900/2900/3900/4899 ms,
  unabhängige Papier-/Schriftdeckkräfte, acht Tracks, gemeinsame endliche
  Startzeit und exakt 4900 ms Dauer. Acht Tracks sind jetzt ausdrücklich geprüft,
  damit leere Animationslisten nicht scheinbar bestehen können.
- Der natürliche Lauf verwendet weder Seek, `finish()`, `cancel()` noch
  geänderte Animationsparameter. Alle acht Tracks müssen regulär erfüllen:
  Dauer und Endzeit 4900 ms, keine Start-/Endverzögerung, eine Iteration,
  Wiedergabefaktor 1, unveränderte gemeinsame Startzeiten, Endposition 4900 ms,
  Zustand `finished`, keine abgelehnten Bereitschafts-/Abschlusspromises.
- Nur die reale Abschlussbeobachtung erhält **4900 + 3000 = 7900 ms**. Der
  zusätzliche Zustellungsspielraum von 3000 ms deckt die bisher größte gemessene
  Abweichung von 1101 ms mit knapp 1900 ms Reserve. Er verändert keine
  Animationsdauer und kein globales oder individuelles Test-Gesamtbudget.
- Zusätzlich läuft nach dem letzten zugestellten Track ein separates
  **1000-ms-Aufräumfenster**. Ein fertiger Track allein reicht nicht zum Bestehen:
  die konkrete SVG-Gruppe muss entfernt sein; keine Labels, Overlay-Gruppen,
  SVG-Animationen oder verbundenen Track-Ziele dürfen zurückbleiben. In den
  beobachteten natürlichen Läufen benötigt dieser Schritt 0–1 ms.
- Entfernung vor dem fachlichen Ende wird weiterhin ausgeschlossen: die
  Dokumentzeit bei Entfernung muss mindestens `gemeinsame Startzeit + 4900`
  erreichen. Bei jeder Beobachtungsauflösung werden Testtimer und Observer
  entfernt; beide Promise-Ausgänge sind behandelt.

`tests/helpers/place-reference-completion.mjs` enthält ausschließlich diesen
Browser-Testbeobachter. Anwendungscode, Animationscontroller, Browserprofile,
DPR, Trace-Einstellungen, fachliche Phasen und die übrigen Lebenszyklustests
bleiben unverändert.

### Nachweise

[Gesicherte CI-Messungen, lokale Wiederholungen und Kontrollproben](ci-479-natural-completion.json).

- WebKit Desktop (DPR 2) und Mobil, Phasen plus natürlicher Abschluss je dreimal:
  **12/12 bestanden**, keine Skips oder Retries. Natürliche Entfernung nach
  4904–5043 ms; Aufräumen nach letztem Track in 0–1 ms.
- Chromium Desktop/Mobil, dieselben zwei Tests: **4/4 bestanden**.
- Gezielte WebKit-Kontrollprobe mit 1400 ms blockiertem Hauptthread nahe dem
  Animationsende: reguläre 4900-ms-Tracks, Abschlusszustellung/Entfernung nach
  **6095 ms**, neues Beobachtungsfenster bestanden, kein Overlay zurückgeblieben.
  Die frühere 5400-ms-Wanduhrassertion hätte diesen Fall fälschlich verworfen.
- Unabhängige Negativkontrolle: ausschließlich das Entfernen der neuen
  Vier-Label-Gruppe wird testweise unterdrückt. Alle acht Tracks enden regulär;
  der Beobachter meldet trotzdem **`cleanup-timeout`** nach 5924 ms, letzte
  Track-Fertigmeldung bei 4923 ms, eine Gruppe/vier Labels/acht gefüllte
  Animationen bleiben erhalten. Das erkennt einen echten Aufräumfehler auch
  innerhalb des großzügigeren Gesamtbeobachtungsfensters. Dieser Eingriff findet
  ausschließlich in der lokalen Kontrollprobe statt, nicht im Anwendungscode
  oder im natürlichen Regressionstest.

```sh
node node_modules/@playwright/test/cli.js test --config=playwright.webkit.config.mjs tests/browser/place-references.spec.mjs --grep 'independent paper|natural 4.9-second' --repeat-each=3
node node_modules/@playwright/test/cli.js test tests/browser/place-references.spec.mjs --grep 'independent paper|natural 4.9-second' --workers=1
```

Der neue exakte Review-Head und die erneut gestartete vollständige CI stehen
im PR. Die Nachkorrektur für #479 umfasst nur Tests und deren Nachweise.
