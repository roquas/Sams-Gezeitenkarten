# PR #117: Ersetzung und Abschluss überlappender Ortsnamen-Animationen

Untersucht: PR-Head `627d0c76564eb6245e34b206c209b509cacb4bfd`,
[Gesamt-CI 44781493920](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44781493920),
Job `webkit (3)` / `136445046947`. Der Lauf ist **rot: 12/13 Jobs erfolgreich**.
Der erste Lifecycle-Fix und der deterministische Phasentest bestehen dort;
ausschließlich der bisher unveränderte Ersetzungstest scheitert auf Desktop,
sowohl im Erstversuch als auch beim Retry.

## Original-Traces

Der Fehler entsteht an der lokalen Entfernungsassertion, nicht am unveränderten
60-s-Gesamtbudget dieses WebKit-Falls. Die Original-Traces enthalten weder
`currentTime`, `startTime`, `playState`, `pending` noch Promise-Ergebnisse.
Aus drei vorhandenen DOM-Namen lässt sich deshalb keine festhängende Animation
oder verwaiste Vorgängeranimation ableiten.

| Versuch | Letzter Klick beendet, Tracezeit ms | Entfernungsassertion beginnt | Assertion scheitert | Wandzeit seit Klick |
| --- | ---: | ---: | ---: | ---: |
| Erstversuch | 391223,745 | 394677,175 | 398181,729 | 6957,984 ms |
| Retry | 421933,600 | 425389,218 | 428892,325 | 6958,725 ms |

Der alte Test wartet 2200 ms vor der Ersetzungsfolge und 3400 ms nach dem letzten
Klick. Anschließend erwartet er innerhalb weiterer 3500 ms null Namen. Er setzt
so Klick-Rückkehr und Wandzeit mit fortschreitender Animationszeit sowie bereits
abgearbeitetem nativen Abschluss gleich. Keiner dieser beiden Zeitpunkte wird
im ursprünglichen Test tatsächlich erfasst.

## Native Kontrollproben auf unverändertem Anwendungscode

Alle Proben verwenden die bestehenden Linux-WebKit-Geräteprofile, einen Worker,
native Klicks und unveränderte Keyframes, Dauer und Playback-Rate. Sie rufen
weder `pause()`, `play()`, `finish()`, `cancel()` noch einen Seek auf. Sie geben
dieselben nativen Animationsobjekte an den Controller zurück und beobachten
das bei Erzeugung gelesene `finished`-Promise. Ein nach `cancel()` erneut gelesenes
`finished`-Promise wäre ein anderer Zustand und kein Beleg für den ursprünglich
beobachteten Abschluss.

1. [Originaltest und Zustandsprobe, Lauf 44794080490](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44794080490):
   Der eingefrorene Originaltest scheitert erneut auf Desktop; Mobil besteht.
   Die Probe erfasst sieben `AbortError`-Abbrüche älterer Gruppen und einen
   natürlichen Abschluss der letzten Gruppe, auf beiden Profilen. Keine
   unbehandelten Rejections; danach null Gruppen, Namen und Kartenanimationen.
   Die letzte Desktop-Animation beginnt ausstehend mit `currentTime: 0`,
   `startTime: null`, `playState: running`, `pending: true`. `ready` wird bei
   +357 ms erfasst. `finished` folgt bei +5982 ms, mit `currentTime: 5400`,
   `playState: finished`, `pending: false`, Opazität 0. Die UI erreicht zuvor
   die sichtbare Haltephase und partielle Ausblendung.
2. [Kontrolle ohne Stil-, Layout- und `getAnimations()`-Abfragen während des Ablaufs, Lauf 44794835582](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44794835582):
   Beide Profile schließen ebenfalls regulär ab. Auf Desktop sind fünf ältere
   Animationen abgebrochen, zwei wegen langsamer nativer Eingaben bereits vor
   dem nächsten Auslöser natürlich beendet. Die letzte Animation ist bei
   Klick-Rückkehr noch `pending`, `ready` folgt bei +505 ms, `finished` bei
   +6112 ms mit tatsächlicher Endzeit 5400 ms. Keine verwaisten Animationen oder
   unbehandelten Rejections. Mobil: sieben Abbrüche und natürlicher letzter
   Abschluss bei +5428 ms.
3. Eine zusätzliche passive Promise-Kontrolle verwendet die unveränderte
   ursprüngliche Aktions-/Assertionsfolge und **keine Abfrageschleife**:
   [Lauf 44795542466](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44795542466).
   Der erste Job wurde beim langsamen Ubuntu-Paketdownload nach zehn Minuten
   abgebrochen, bevor irgendein Browsertest lief. Ausschließlich dieser
   Infrastrukturjob wurde einmal wiederholt. **Im tatsächlich ausgeführten
   Desktop-Test tritt derselbe alte Fristfehler auf.** Die erste Zustandsaufnahme
   im Fehlerpfad meldet jedoch bereits `currentTime: null`, `startTime: null`,
   `playState: idle`, `pending: false`, keine verbundene Gruppe und **0 Namen,
   Gruppen und Kartenanimationen**. Das ursprüngliche `finished`-Promise ist
   ausdrücklich **schon vor Lesen dieser Zustandsgetter erfüllt**. Dessen
   Callback hatte bei +6409 ms die korrekte Endzeit 5400 ms erfasst. `ready`
   wurde erst bei +2468 ms mit `currentTime: 1742`, `startTime: 41145`,
   `playState: running`, `pending: false` protokolliert. Der Fehlerpfad erreicht
   seine erste Zustandsaufnahme bei +7390 ms. Die alte Assertion hat die bereits
   erfolgte natürliche Entfernung nicht rechtzeitig als Erfolg beobachtet.
   Fünf Vorgänger wurden abgebrochen; zwei waren bei den langsamen Eingaben
   bereits natürlich beendet. Mobil besteht ohne alten Fristfehler mit sieben
   Abbrüchen und letztem natürlichen Abschluss bei +5432 ms. Keine unbehandelten
   Rejections in beiden Profilen.

Die aktiveren Proben verändern die Terminierung nicht absichtlich, können aber
WebKit durch Abfragen und Protokollaufwand beeinflussen. Insbesondere ersetzen
ihre Werte nicht rückwirkend die fehlende Telemetrie der ursprünglichen beiden
Fehlversuche. Der intern verzögerte Play-/Rendering-/Promise-Zeitpunkt ist damit
nicht auf einen einzelnen WebKit-Implementierungsfehler eingegrenzt.

## Bewertung und Testkorrektur

Die passive Reproduktion zeigt einen **Testfehler**: Die alte Assertion kann
scheitern, obwohl der Controller die letzte Animation regulär beendet und
vollständig bereinigt hat. Eine nach Ablauf der Assertion ankommende
Zustandsabfrage darf dabei nicht mit dem Zeitpunkt ihres letzten Polls
verwechselt werden. Die feste Wandzeitannahme ist nicht der fachliche Vertrag.
Die beobachteten
nativen Animationen ersetzen und beenden sich korrekt; ein Defekt des
Anwendungscontrollers wurde nicht nachgewiesen. Deshalb bleibt Anwendungscode
unverändert. Die Testkorrektur verlangt weiterhin sämtliche Namen nach Ablauf
zu entfernen und macht zusätzlich Abbrüche, Neustart und tatsächliche
Bereinigung prüfbar:

- Die erste Animation muss tatsächlich mindestens 2200 ms ihrer eigenen
  Zeitleiste durchlaufen, bevor die bestehende native Ersetzungsfolge beginnt.
- Jeder neue erfasste Trigger muss eine neue 5400-ms-Animation mit Zeit 0 erzeugen.
  Zu jeder beobachteten Zeit gibt es höchstens eine Gruppe mit höchstens drei
  Namen. Die letzte Gruppe muss mit drei Namen ihre eigene Zeit 3400 ms erreichen.
  Ältere Abschlüsse dürfen ihre Lebensdauer nicht verkürzen.
- Tatsächliche Überschneidungen und `AbortError`-Abbrüche werden verlangt.
  Eine ältere Animation darf auch regulär beendet sein, wenn ein langsamer
  nativer Klick ihren Nachfolger erst nach ihrem Ende auslöst.
- Die weiterhin **3500 ms** lange Entfernungsassertion beginnt beim beobachteten
  nativen Animationsende. Kein `waitForTimeout(3400)` ersetzt diesen Zustand.
  Zusätzlich prüft der Test die Differenz zwischen Endzustand und DOM-Entfernung
  anhand von Browser-Zeitstempeln. Protokolllatenz kann diese Frist nicht verdecken.
- Die letzte Animation muss ihr ursprüngliches `finished`-Promise erfüllen;
  ein Abbruch genügt nicht. Alle sieben erfassten Gruppen müssen entfernt sein,
  alle zugehörigen Animationsobjekte `idle` und nicht `pending`. Die Karte muss
  null Namen, Gruppen und Animationen enthalten. Keine unbehandelten Rejections.
- Zustandshistorie und alle terminalen Zustände werden als
  `rapid-place-lifecycle` bei Erfolg und Fehler gespeichert. Keine Zeitsteuerung
  der Animation im Ersetzungstest, keine erhöhten Sleeps oder Gesamtbudgets.

Die bestehenden separaten Tests für tatsächliche Einblendung, Haltephase und
Ausblendung bleiben erhalten. Keine Änderung an S04-B, Rätseldaten, Engine,
Layout, Produktionscontroller oder Workflow-Dateien in PR #117.

## Validierung

- Vollständige lokale Ortsreferenz-Suite unter macOS-WebKit Desktop/iPhone:
  **20 bestanden, 2 zur Eingabeart passende Skips**, ohne Retries.
- Vollständiger Chromium-Gegencheck Desktop/Mobil: **20 bestanden, 2 passende
  Skips**, ohne Retries.
- [Gezielte Linux-Vorprüfung 44796487047](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44796487047):
  **6/6 bestanden**, ohne Retries; beide Profile mit natürlichem Lifecycle,
  deterministischen Phasen und neuem Ersetzungstest. Je sechs Abbrüche und ein
  natürlicher Abschluss; letzte DOM-Entfernung 0 beziehungsweise 1 ms nach dem
  `finished`-Callback. Gemessen ab erstem beobachteten nativen Endzustand sind es
  259 beziehungsweise 1 ms. Die abschließend ergänzte explizite Assertion auf
  diese bereits erfassten Zeitdifferenzen wird zusätzlich lokal und in der
  vollständigen PR-CI geprüft.
- Abschließender gezielter WebKit-Lauf mit zusätzlicher Prüfung der im Browser
  gemessenen Endzustands-/Bereinigungsfrist: **2/2 bestanden**, ohne Retries.
- Derselbe endgültige Ersetzungsfall unter Chromium Desktop/Mobil: **2/2
  bestanden**, ohne Retries.
- Referenz-/Labelintegration **6/6**, JavaScript-Syntax und Diff-Prüfung bestanden.
- Neuer PR-Head und abschließendes Ergebnis der vollständigen Gesamt-CI stehen
  in PR #117. Ein erfolgreicher gezielter Lauf wird nicht als grüne Gesamt-CI
  ausgegeben.

[Rohmessungen, Originalfehler, Probequelltexte und Artefakt-Hashes](webkit-rapid-evidence.json).

```sh
npx playwright test --config playwright.webkit.config.mjs tests/browser/place-references.spec.mjs --retries=0 --trace=on
npx playwright test tests/browser/place-references.spec.mjs --workers=1 --retries=0 --trace=on
```
