# A1 · Notizprüfung ohne prüfbare Markierungen (#51)

## Ausgangslage und parallele Arbeiten

Geprüft am 30.10.2026 auf `main` bei
`7d0c631cb6de2185169274ee6957d69705d070ca` (Merge von B2, PR #93).
Eigener Branch `fix/a1-note-check-noop`, keine Übernahme anderer Arbeitsstände.

- Offen: PR #94 (`feat/b2-playable-candidates`, `7e9309c`). Er verändert
  `src/ui/game.mjs` für Katalogwahl, Entwicklungseinstieg und Rätselwechsel;
  seine Änderungshunks betreffen nicht den Handler für `checkMarks`.
  `git apply --check` des A1-Produktivpatches gegen diese PR-Fassung ist erfolgreich.
- Ebenfalls offen: der ältere Architektur-PR #38
  (`feature/puzzle-schema-loader-solver`, `3ca2faa`, zuletzt aktualisiert am
  14.10.2026). Er ist keine Grundlage für A1.
- Remote-Branches auf bereits begonnene A1-/Notizprüfungsarbeit geprüft;
  kein entsprechender Branch vorhanden.

## Befund und Änderung

Der Handler speicherte bislang vor dem Zählen der Markierungen einen
History-Eintrag und erhöhte die Strafpunkte um fünf. Auch bei null geprüften
Feldern erschien anschließend eine Erfolgsmeldung.

Der vorhandene Algorithmus zählt weiterhin ausschließlich `yes` (✓) und
`no` (×), über alle Stunden hinweg. `maybe` (?) bleibt unbewertet.
Bei null geprüften Feldern erscheint jetzt die neutrale Mitteilung:
„Es gibt noch keine eindeutigen Markierungen zum Prüfen.“ Danach kehrt der
Handler vor Snapshot und Gebühr zurück.

Ab einer eindeutigen Markierung bleiben Auswertung, Meldung, fünf Strafpunkte
pro Aufruf und genau ein Undo-Eintrag unverändert. Das Verschieben des
Snapshots über die ausschließlich lesende Auswertung verändert seinen Inhalt
nicht. Undo erstattet Prüfgebühren; bezahlte Tipps bleiben erhalten.
Die normale Render-/Speicherroutine bleibt auch für die neutrale Mitteilung
erhalten. Hilfe-/Ergebnistext bleibt beim Wiederladen wie bisher flüchtig.

Keine Änderungen an History, Persistenzformat, Generator, Assetkatalog,
Kartenrenderer, Rätseldaten, Tippgebühren oder anderen Issues.

## Regressionen

`tests/browser/note-check.spec.mjs` prüft die tatsächlichen UI-Handler und den
gespeicherten Spielstand ohne Testzugang zum internen State:

- Leerer Spielstand und wiederholte kostenlose Prüfversuche, neutrale Meldung,
  korrekte Strafpunktanzeige und Wiederladen.
- Ausschließlich ? in mehreren Stunden; Undo entfernt sofort die letzte echte
  Notiz. Bereits bezahlte Tipps, gewählte Stunde/Werkzeug und Radar bleiben erhalten.
- Vorherige Routenbearbeitung bleibt nach mehreren leeren Prüfversuchen der
  nächste Undo-Schritt.
- Einzelne richtige/falsche ✓ und × sowie mehrere gemischte Markierungen über
  mehrere Stunden mit ignorierten ?. Bisherige Zählung/Meldung und je fünf
  Strafpunkte auch bei wiederholten echten Prüfungen bleiben erhalten.
- Ein Undo-Schritt je echter Prüfung, Erhalt späterer Tippkosten, anschließendes
  Undo der tatsächlichen Notiz und Persistenz der verbleibenden Strafpunkte.

Die drei Szenarien ohne eindeutige Markierung wurden zunächst mit unveränderter
Produktivdatei auf `main` in Chromium ausgeführt: **3 erwartete Fehler** wegen
der bisherigen Erfolgsmeldung bei null Markierungen.

## Validierung

- `npx playwright test tests/browser/note-check.spec.mjs tests/browser/model.spec.mjs`:
  **36 bestanden**, Chromium Desktop und Pixel-7-Profil; darunter alle 16 neuen
  A1-Prüfungen und 20 bestehende Spielregressionen.
- `npx playwright test tests/browser/note-check.spec.mjs --config playwright.webkit.config.mjs`:
  **16 bestanden**, WebKit Desktop und iPhone-13-Profil.
- `node --test tests/integration/*.test.mjs`: **21 bestanden**, darunter die
  vorhandenen Prüfungen für History, Tippkosten und Speicherung.
- `npm run test:content`: **20 bestanden**.
- `npm run test:puzzles`: **bestanden**, Probefahrt weiterhin eindeutig lösbar.
- `npm run test:unit`: **187 von 247 bestanden**, 60 lokale Pfadfehler.
  Alle **60 betroffenen Tests** anschließend gezielt mit unverändertem Code und
  kanonischem `TMPDIR=/private/tmp/a1-suite-tmp` wiederholt: **60 bestanden**,
  null Fehler/Skips. Somit alle 247 Tests erfolgreich abgedeckt, jedoch kein
  vollständig grüner einzelner Gesamtaufruf in der ursprünglichen Umgebung.
- `git diff --check`: **bestanden**.

Die Browserergebnisse stammen aus den abschließenden Läufen mit null Fehlern,
Retries oder Skips. Geräteprofile wurden emuliert; keine physische Apple-Hardware.

Lokale Umgebung: macOS, Node 22.23.3, Playwright 1.64.0, Python 3.9.2 mit
Pillow/numpy in einer separaten temporären Umgebung. Der erste Unit-Testversuch
ohne Pillow konnte die vorhandenen Bild-/Katalogfixtures nicht erstellen; dafür
wurden keine Repository-Abhängigkeiten oder Produktivdateien geändert.
Danach verursachten die unterschiedlichen macOS-Pfadnamen `/var/folders/…` und
`/private/var/folders/…` 60 Fehler: CLI-Einstiege wurden nicht ausgeführt,
Folgefixtures fehlten, und ein Verzeichnisvergleich unterschied dieselben Pfade.
Drei Kontrollfälle bestanden mit kanonischem `TMPDIR`, anschließend auch alle
60 betroffenen Tests in neun Dateien. Diese Wiederholung verwendete ausschließlich
die im Gesamtlauf fehlgeschlagenen Testnamen; alle anderen 187 hatten bestanden.
Im ersten Chromium-Durchlauf lag ein Spielstart außerhalb des standardmäßigen
5-Sekunden-Assertionlimits (noch keine Kartenfelder). Die neue Testdatei wartet
beim Start/Wiederladen gezielt bis zu 15 Sekunden auf die Karte; die fachlichen
Assertions behalten das normale Limit. Keine Retries oder Skips hinzugefügt.

Der PR ist zur separaten Review vorgesehen. Kein Auto-Merge.
