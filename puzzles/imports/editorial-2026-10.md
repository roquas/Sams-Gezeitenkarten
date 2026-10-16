# Gelieferte Originalentwürfe vom 13. Oktober 2026

Quelle: vom Nutzer bereitgestelltes `zwei-neue-gezeitenraetsel(1).zip` mit
`quittung-nombreo.json`, `ankerbuch-tesoro.json` und Integrations-README.
Die Geschichten sind neue fiktionale Inhalte, **keine belegten Podcast-Ereignisse**.
Sie ersetzen keine fehlenden historischen Archive aus
[Issue #34](https://github.com/roquas/Sams-Gezeitenkarten/issues/34).

## Eng begrenzte Schemaanpassung

Bei beiden Dateien ausschließlich `metadata.kind: "original"` in den bereits
veröffentlichten Schemawert `"editorial"` übersetzt (plus abschließender Zeilenumbruch).
Keine Änderungen an Geometrie, Befahrbarkeit, Hinweisen, Erzähltexten, Hilfen,
Sollroute, resultTexts oder Overlayparametern. Alle Asset-IDs verwenden die
bestehende Zuordnung zu den abgenommenen Aquarellmotiven. Riff und Wrack nutzen
somit wie bisher vorhandene Insel-/Schiffsmotive; es wurden keine neuen
Illustrationen behauptet oder erzeugt.

## Produktive, von der Sollroute unabhängige Prüfung

| Rätsel | Legale Routen | Lösungen | Übereinstimmung mit gelieferter Route |
| --- | ---: | ---: | --- |
| Die Quittung von Nombreo | 521 | 1 | vollständig |
| Das doppelte Ankerbuch | 209 | 1 | vollständig |

Diese Werte stimmen exakt mit dem unabhängigen Python-Enumerator des Liefer-README
überein. Der produktive JS-Solver erhält ausschließlich `logic`; danach vergleicht
der Compiler seine Lösung mit `solution`. Bei Quittung sind H1 und H2 jeweils
redundant gegenüber den übrigen Hinweisen; beide bleiben unverändert enthalten.
Beim Ankerbuch ist kein Hinweis redundant. Die redaktionellen Schwierigkeitswerte
sind übernommene Einschätzungen, kein Ersatz für menschliches Testspielen.

`resultTexts.correct` und `resultTexts.incorrect` werden validiert und geladen.
Die bestehende Ergebnisanzeige verwendet weiterhin neutrale Meldungen;
ihre spätere Gestaltung/Verwendung bleibt
[Issue #35](https://github.com/roquas/Sams-Gezeitenkarten/issues/35).
Die zwei neuen Einträge ergänzen Referenz und ausdrücklich gekennzeichneten
technischen Testfall. IDs, Datenversionen und Speicherstände der vorhandenen
Rätsel bleiben unverändert.
