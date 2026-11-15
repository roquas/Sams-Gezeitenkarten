# H1 – Verständlichere countDistanceToPlace-Hinweise

Stand: 14. November 2026. Basis: `main` bei
`64450215f8ea49e4d3f079e14ecf1358547d36af`; eigener Branch
`fix/h1-count-distance-wording`.

## Architektur und Überschneidungen

Vor der Implementierung wurden `main` aktualisiert und offene PRs sowohl über
GitHub-Suche als auch über die REST-Liste geprüft. Offen war ausschließlich
[PR #38](https://github.com/roquas/Sams-Gezeitenkarten/pull/38).
Dessen Dateiliste überschneidet sich mit keiner Datei dieser Änderung.
Es wurde kein fremder Branch übernommen. Die inzwischen gemergten Generator-
und Deduktionsänderungen bleiben auf dem Stand des aktuellen `main`.

`scripts/lib/clue-text.mjs::technicalClueText()` ist der zentrale technische
Formatter. `buildPlaytest()` in `scripts/lib/b2-playtest.mjs` verwendet ihn für
S01, S02 und BC und schreibt die Ergebnisse in `presentation.clueTexts` der
abgeleiteten öffentlichen Exporte. Der reguläre Loader ruft `compilePuzzle()`
auf; dieser reicht die Texte unverändert an das Spiel und dessen Bordbuch weiter.
Beide Bordbuchansichten verwenden dieselben kompilierten Texte.

Die privaten historischen Kandidaten enthalten `logic` und `solution`, aber
keine gespeicherten Präsentationstexte. Sie profitieren vollständig beim nächsten
normalen Export. Bereits vorhandene `.dev`-Exporte sind abgeleitete Dateien und
müssen wie üblich neu exportiert werden:

```sh
npm run export:b2
npm run export:b2 -- --stock S02
npm run export:b2 -- --stock BC
```

Abweichung: Der allgemeine Loader akzeptiert auch fest redigierte
`presentation.clueTexts`. Er erzeugt sie nicht zur Laufzeit neu. Die vorhandenen
redigierten Rätsel einschließlich der positiven Referenzen enthalten keine
`countDistanceToPlace`-Hinweise; dort ist keine Anpassung nötig. Es gibt deshalb
keinen zweiten Formatter und keine Änderung des Loaders oder gespeicherter
Rätseldefinitionen.

Die technische Ortsbezeichnung lautet bisher `Ort <id> (Zellen)`. Der Formatter
kennt keine flektierten Erzähl-Ortsnamen wie „Nordinsel“. Diese Bezeichnung und
alle Koordinaten bleiben erhalten; `auf dem Ort`, `neben dem Ort` und
`von dem Ort … entfernt` verwenden durchgehend den passenden Dativ. Es werden
keine Artikel aus frei benannten Inseln erraten.

## Formatierung

Die bestehenden Präsentationsformen und ihre Statistiken bleiben unverändert.
Einzelstunden haben sprachlich Vorrang: ein Treffer ohne Zählzusatz, null Treffer
mit „nicht“. Bei längeren inklusiven Intervallen folgen null Treffer mit „nie“,
Treffer in jeder Stunde mit „in jeder Stunde“, sonst exakte Zählwörter wie
„genau einmal“ und „genau zweimal“. Beide Zeitgrenzen bleiben sichtbar.
Abstand 0 ergibt „auf“, Abstand 1 „neben“, größere Abstände
„genau N Hexfelder … entfernt“. Stunde 0 bleibt zulässig und sichtbar.
Die bestehende Validierung lehnt ungültige Zählungen und Intervalle weiterhin ab.

## Tatsächliche Textbeispiele

Die Beispiele wurden aus den Exporten von `6445021` und dem geänderten Formatter
gelesen; sie sind keine neu erstellten Rätsel.

### B2-S01-M000-A3-R00-V01 · H1

Vorher: In den Stunden 1 bis 4 (beide einschließlich) beträgt der Hexabstand zu Ort geo-03 (E4) in genau 1 Stunden genau 6.

Nachher: Von Stunde 1 bis Stunde 4 war das Schiff genau einmal genau 6 Hexfelder von dem Ort geo-03 (E4) entfernt.

### B2-S01-M000-A3-R00-V01 · H2

Vorher: In den Stunden 5 bis 6 (beide einschließlich) beträgt der Hexabstand zu Ort geo-04 (D3) in genau 2 Stunden genau 2.

Nachher: Von Stunde 5 bis Stunde 6 war das Schiff in jeder Stunde genau 2 Hexfelder von dem Ort geo-04 (D3) entfernt.

### B2-S02-M000-A1-R00-V01 · H1

Vorher: In den Stunden 0 bis 1 (beide einschließlich) beträgt der Hexabstand zu Ort geo-03 (A5) niemals genau 3.

Nachher: Von Stunde 0 bis Stunde 1 war das Schiff nie genau 3 Hexfelder von dem Ort geo-03 (A5) entfernt.

### B2-S02-M000-A1-R00-V02 · H2

Vorher: In Stunde 6 beträgt der Hexabstand zu Ort geo-02 (C1, D1) genau 1.

Nachher: In Stunde 6 war das Schiff neben dem Ort geo-02 (C1, D1).

### B2-BC-T01-M017-A4-R00 · H1

Vorher: In den Stunden 0 bis 5 (beide einschließlich) beträgt der Hexabstand zu Ort geo-03 (A4) in genau 1 Stunden genau 1.

Nachher: Von Stunde 0 bis Stunde 5 war das Schiff genau einmal neben dem Ort geo-03 (A4).

## Nachweis unveränderter Bedeutung

Alle 199 öffentlichen Rätsel wurden vor und nach der Änderung exportiert und
feldweise verglichen. Nach Wiederherstellung ausschließlich der alten
`countDistanceToPlace`-Präsentationstexte sind sämtliche DTOs identisch;
alle drei Manifeste sind bereits byteidentisch. Kein anderes Exportfeld ändert
sich. Die neuen Gesamtexporthashes in den Vertragstests wurden erst nach diesem
Vergleich übernommen; der historische S01-Hash bleibt zusätzlich erhalten.

| Bestand | Rätsel | Geänderte Zähltexte | Davon mit Stunde 0 | Davon zu Mehrhexobjekten | Legale Routen über alle Varianten |
| --- | ---: | ---: | ---: | ---: | ---: |
| S01 | 95 | 306 | 64 | 29 | 134959 |
| S02 | 96 | 283 | 57 | 64 | 102074 |
| BC | 8 | 32 | 6 | 8 | 13482 |

Der neue Integrationstest führt jeden Export durch den echten Spielloader.
Er vergleicht die vollständigen Logikdaten und jeden Hinweis auf jeder legalen
Route mit dem historischen Original: insgesamt **1006881 identische
Wahrheitswertvergleiche**. Die vollständige Lösungsmenge jedes Rätsels besteht
weiter aus genau seiner unveränderten gespeicherten Zielroute. Die bestehenden
Bindungs-, Fingerprint- und unabhängigen Beweistests laufen zusätzlich.
Ein eigener Mehrhexfall prüft ausdrücklich Abstand 0 auf der zweiten Objektzelle
und Abstand 1 zur nächsten Objektzelle, einschließlich Stunde 0.

## Geänderte Dateien

- `scripts/lib/clue-text.mjs`: einzige Produktionsänderung; gemeinsame Ausgabe
  aller vier bestehenden Zähl-Präsentationsformen.
- `tests/engine/clue-presentation.test.mjs`: Priorität, Negation, Teilzählungen,
  alle Abstandsfälle, Stunde 0, Mehrhexbezug und bestehende Validierung.
- `tests/integration/count-clue-text.test.mjs`: alle drei realen Bestände durch
  den Spielloader, unveränderte Prädikate und vollständige Lösungsmengen.
- `tests/browser/count-clue-text.spec.mjs`: feste reale Vorlagen in sichtbarer
  Bordbuchseite und Gesamtliste, inklusive Koordinaten und mobiler Breite.
- Bestehende B2-Browser-/Vertragstests und S01-Exportreferenz samt README:
  Erwartungen an die beabsichtigten Textänderungen angepasst.
- Dieser Prüfbericht: Architektur, Vorher/Nachher und Nachweise.

Keine Änderungen an Schema, Engine, Solver, Generator, Kandidaten, Profilen,
Rätseldaten, Identitäten, Persistenz, Undo, Radar oder Kartenrenderer.
H2 (Ausschluss von Stunde 0 bei neuen Mehrstundenhinweisen) ist nicht enthalten.

## Ausgeführte Prüfungen

- `node --test tests/engine/clue-presentation.test.mjs tests/integration/count-clue-text.test.mjs`:
  29 bestanden.
- `npm run test:unit`: 351 bestanden, keine Fehler oder Skips; vollständige
  Engine-, Vertrags- und Integrationssuite einschließlich bestehender
  B2-/S02-/BC-Beweise, Generator- und Deduktionsregressionen.
- `npm run test:content`: 20 bestanden.
- `npm run test:puzzles`: vorhandenes Demo unverändert eindeutig, 24 legale
  Routen und dieselbe einzige Lösung.
- Folgender Browserlauf: 36 bestanden, je 18 auf Chromium Desktop und Pixel 7;
  keine Fehler, Wiederholungen oder Skips. Sieben feste reale Zähltexte werden
  jeweils in beiden Bordbuchansichten geprüft. Bestehende Tests decken außerdem
  alle S02-Präsentationsformen, alle acht BC-Varianten, Lösungskontrolle,
  Zustandsisolation, Undo und Radar ab.

```sh
npx playwright test tests/browser/count-clue-text.spec.mjs \
  tests/browser/b2-playtest.spec.mjs tests/browser/b2-s02.spec.mjs \
  tests/browser/b2-bc.spec.mjs
```

Die Browser wurden für diesen Lauf mit
`PLAYWRIGHT_BROWSERS_PATH=/tmp/h1-playwright` installiert und verwendet.
`git diff --check` ist ohne Befund.
