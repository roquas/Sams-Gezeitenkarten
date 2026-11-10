# B2 V2 – lösungsfreier Spieltest

Ein neues handentwickeltes Rätsel mit sechs Etappen und sechs Hinweisen.
Die bestehenden Bestände einschließlich der einfachen positiven Kontrollreferenz
bleiben erhalten. Diese Anleitung enthält keine Lösungspositionen oder
vorgegebenen Schlusskombinationen.

[Lösungsfreier technischer Prüfstand](verification/B2-positive-v2-validation.md).

## Start

Node 22+ und Python 3; für den ZIP-Export zusätzlich Pillow.

```sh
npm run dev:b2:positive-v2
```

[Rätsel öffnen](http://localhost:8000/?dev=b2&stock=POSITIVE-V2&puzzle=B2-POSITIVE-V2-01).
Bei bereits laufendem Server genügt `npm run export:b2 -- --stock POSITIVE-V2`.
Die vorhandenen Stundenmarkierungen, Undo, Speicherung und Routenprüfung stehen
zur Verfügung. Es gibt keine neuen Spielwerkzeuge oder eingeblendeten Lösungen.

## Zuerst spielen und beobachten

Vor dem Spielen keine Dateien aus `docs/verification/B2-positive-v2/private/`
öffnen. Ohne Lösungsweg und ohne vorgegebene Hinweisreihenfolge beginnen.
Beobachtungen möglichst während des Spielens knapp notieren, ohne damit einen
zusätzlichen Alternativen- oder Routenplaner einzuführen. Stillstände und
benötigte Hilfe ebenso festhalten wie erfolgreiche Schlüsse.

| Zeitpunkt/Reihenfolge | Tatsächlicher Teilschluss oder Stillstand | Genutzte Hinweise | Markierungen auf der Oberfläche | Im Kopf gehaltene Alternativen / benötigte Hilfe |
| --- | --- | --- | --- | --- |
| | | | | |
| | | | | |
| | | | | |

Nach dem Spiel festhalten: Was war der erste konkrete Fortschritt? Welche
Hinweise wurden zunächst zurückgestellt? Wann wurde der Zählhinweis verständlich?
Welche weitere Erkenntnis folgte daraus? Mussten vollständige Routen ausprobiert
oder gekoppelte Alternativen im Kopf behalten werden? Waren alle nötigen
Zwischenergebnisse auf der vorhandenen Oberfläche speicherbar?

Erst danach mit dem privaten Konstruktionsprotokoll und Begründungsgraphen
vergleichen. Ein abweichender erfolgreicher Weg ist ebenfalls zu dokumentieren.
Der menschliche Test und die Einstufung „mittelschwer“ stehen noch aus.

## Öffentliches lokales Paket

```sh
npm run package:b2:positive-v2
```

Ergebnis: `dist/B2-positive-v2-playtest.zip`. Enthalten sind die bisherigen
Laufzeitdateien und genau zwei öffentliche V2-Dateien. Private Definition,
gespeicherte Zielroute, Vertrag, Graphen und Konstruktionsdaten bleiben draußen.
Der Browser berechnet wie bisher die Lösung intern für die Prüfknöpfe.
Das Paket führt keinen Upload aus. Für statisches Hosting ausschließlich den
entpackten ZIP-Inhalt verwenden; alle Verzeichnisse benötigen Lesbarkeit und
Durchsuchbarkeit. Der Einstieg am gewählten Hostingpfad ist
`?dev=b2&stock=POSITIVE-V2&puzzle=B2-POSITIVE-V2-01`.

## Technische Prüfung nach dem Spiel

```sh
npm run report:b2:positive-v2 -- --check
node --test tests/contracts/b2-positive-v2.test.mjs
npx playwright test tests/browser/b2-positive-v2.spec.mjs
python3 tests/test_b2_positive_v2_package.py
```

Der Bericht prüft gespeicherte Nachweise bytegenau. `--write` ausschließlich bei
bewusster redaktioneller Änderung verwenden. Der Testprüfer aus PR #105 bleibt
unverändert. Der technische Befund ersetzt den menschlichen Test nicht.
