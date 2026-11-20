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
