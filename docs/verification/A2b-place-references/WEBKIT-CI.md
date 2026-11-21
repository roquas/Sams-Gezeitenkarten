# PR #114: Nachprüfung der WebKit-CI

Untersuchter Anwendungsstand: `c2bbf8d0a617643cab546b7e1b9d22e7f8bd90f8`.
[CI-Lauf 44712458636](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44712458636),
Job `webkit (3)` / `136207301820`. Die übrigen Jobs bestanden, einschließlich
vollständiger Unit-, Chromium-, Asset- und Deployment-Prüfungen.

## Ursache anhand der Original-Traces

Die beiden Fehler sind Überschreitungen des **gesamten Testbudgets von 30 s**.
Die Trace-Aufzeichnung umfasst auch noch laufende Browseraktionen und den
Abbau nach Eintritt dieses Limits; deren spätere Zeitstempel bedeuten nicht,
dass die eigentliche Testfrist verlängert wurde.

| Fall | Beobachtung relativ zum Beginn der Before Hooks |
| --- | --- |
| Schnelle Auslöser, erster Versuch | Letzter manueller Klick kehrt bei 24,786 s zurück. Nach Haltezeit und Assertions beginnt die Entfernungskontrolle erst bei 28,820 s. Von ihrem vorgesehenen 3,5-s-Fenster bleiben vor dem Testlimit nur ca. 1,18 s. |
| Schnelle Auslöser, Retry | Die Kontrolle auf **null Labels besteht tatsächlich**. Im Browser ist sie bei ca. 30,72 s abgeschlossen; die Antwort erreicht den Testprozess bei ca. 31,45 s. Danach wird noch die Prüfung auf verwaiste Animationen angestoßen, obwohl das globale Budget bereits abgelaufen ist. Das Overlay hängt hier nachweislich nicht dauerhaft. |
| Undo, erster Versuch | Der letzte Undo-Klick beginnt bei 27,598 s. WebKit benötigt weitere Zeit für Sichtbarkeit/Stabilität, Scrollen und Hit-Test. Der Trace erreicht „performing click action“ erst bei 34,892 s; es gibt vor Ablauf des Testlimits keinen abgeschlossenen Klick. Die folgende Routenassertion erhält keine reguläre Ausführungszeit. |
| Undo, Retry | Undo stellt SVG-Route und gespeicherte Route `['A5','B5']` korrekt wieder her; Radar-Ursprung und leere Markierungen stimmen ebenfalls. Alle fachlichen Assertions sind bei ca. 29,47 s erfüllt – nur knapp innerhalb der alten Frist. |

Native WebKit-Klicks benötigen im CI hier häufig 1,5–3 s. Acht Trigger plus
Ladezeit und vollständige Animationsdauer beziehungsweise die lange Folge von
Kartenaktionen passen deshalb nicht zuverlässig in insgesamt 30 s.

Ausgewählte Originalaktionen und Zeitstempel sind in
[webkit-ci-timings.json](webkit-ci-timings.json) gesichert. Quelle: Artefakt
`webkit-chart-report-3`, ID `14617664964`, ZIP-SHA-256
`8f313ab07863d00785b97907ec7452db2163a37a880befdc861353c5e3880ee9`.
Die CI verwendete Linux/WebKit, Desktop mit DPR 2; die lokale Wiederholung
verwendet macOS/WebKit mit demselben Playwright-Geräteprofil.

## `animation.finished` und wiederholtes `cancel()`

Jeder Auslöser erzeugt eine neue Animation. Der Controller liest deren aktuelles
`finished`-Promise unmittelbar und behandelt sowohl Erfüllung als auch Ablehnung.
Beim Abbruch wird das bisherige Promise mit `AbortError` abgelehnt; ein danach
neu erzeugtes beziehungsweise zurückgesetztes Promise darf nicht mit dem zuvor
beobachteten verwechselt werden. Dieses Verhalten entspricht dem
[Web-Animations-Vertrag](https://www.w3.org/TR/web-animations-1/#canceling-an-animation).
Der bestehende Vergleich mit der konkreten aktiven SVG-Gruppe verhindert zudem,
dass ein verspäteter Abschluss eine neuere Anzeige entfernt.

Zusätzliche Instrumentierung ausschließlich im Browser-Testkontext: Der Rückgabewert
von `Element.prototype.animate` wird beobachtet und sein `finished`-Promise sofort
abonniert. Anschließend wechseln zwölf **native Tastaturauslösungen** pro Durchlauf
zwischen Hinweisnavigation und „Orte zeigen“. Die letzte Animation läuft ohne
Seek, `finish()` oder verkürzte Dauer natürlich aus.

Ergebnis über je drei Desktop- und Mobil-Durchläufe:

- 102 erzeugte Animationen, davon 96 erwartete `AbortError`-Ablehnungen.
- Alle sechs zuletzt gestarteten Animationen regulär erfüllt.
- Letzte Abschlüsse nach 5,404–5,629 s bei unveränderter Dauer von 5,4 s.
- Keine unbehandelten Promise-Rejections, keine verbliebenen Gruppen oder
  aktiven Kartenanimationen.

[Aufgezeichnete Promise-Ergebnisse](webkit-promise-probe.json).
Die untersuchten Traces und diese Probe liefern keinen Nachweis eines Defekts
am Animationscontroller oder an der Undo-Zustandsverwaltung.

## Minimale Korrektur

Nur `tests/browser/place-references.spec.mjs` wird fachlich angepasst:

- Für genau die zwei langen Fälle wird **nur unter WebKit** das Gesamtbudget
  auf 60 s gesetzt. Es gibt keine globale Timeout-Erhöhung.
- Die 3,5-s-Entfernungsfrist, Anzahl der Auslöser, Haltezeit, nativen Klicks,
  Touch-/Tastaturaktionen und sämtliche bisherigen Assertions bleiben erhalten.
- Nach Route-zurück und Undo wird zusätzlich der gespeicherte Zustand abgefragt,
  bevor die bestehende SVG-Assertion erfolgt. Damit unterscheiden weitere Fehler
  unmittelbar einen nicht erfolgten Zustandswechsel von einer Darstellungsstörung.

Kein geänderter Anwendungscode, kein Ausweich-Timer, keine geänderte Animation
und keine Änderung des A2b-Bedienkonzepts.

## Wiederholung und vollständige CI

- Eingefrorene Originaltests: beide Fälle je dreimal in Desktop und Mobil,
  **12/12 bestanden**, keine Retries. Laufzeiten 6,620–28,433 s. Der CI-Fehler
  trat auf macOS nicht erneut auf; der alte 30-s-Rahmen wird aber auch lokal
  beinahe ausgeschöpft. [Einzelergebnisse](webkit-frozen-repetitions.json).
- Korrigierte Tests: dieselbe Wiederholungsmatrix, **12/12 bestanden**, keine
  Retries; 6,909–25,602 s. [Einzelergebnisse](webkit-fixed-repetitions.json).
- Promise-Stressprobe: sechs Durchläufe mit den oben dokumentierten 102
  Animationen; alle Abschluss- und Bereinigungsprüfungen bestanden.
- Zustands-/Referenz-Integration: **8/8 bestanden**.
- Zusätzlicher Chromium-Gegencheck: alle vier Desktop-/Mobil-Fälle bestanden.
  Ein Lauf scheiterte unter paralleler lokaler Last bereits beim Seitenstart,
  vor Erreichen der untersuchten Funktion; seine isolierte Wiederholung bestand
  ohne Teständerung.
- Diff-Prüfung der geänderten Testdatei: grün.

Reproduktionsbefehl für die korrigierten Fälle (unveränderte Geräteprofile):

```sh
npx playwright test --config=playwright.webkit.config.mjs tests/browser/place-references.spec.mjs --grep 'rapid manual|overlay passes' --repeat-each=3 --trace=on
```

Die vollständige CI wird durch den anschließenden Push des neuen Review-Heads
mit sämtlichen Jobs und allen sechs WebKit-Shards erneut gestartet. Lauf und
abschließendes Ergebnis stehen im PR und im Abschlussbericht.
