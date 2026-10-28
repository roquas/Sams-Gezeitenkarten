# PR B: realistischer Batchnachweis

Ausgeführt am 28.10.2026 auf Programmcommit
`816594fd2318ce2e2a85f188bc73e0e219f1589f`, ausgehend von `main` nach PR #87
(`5c8e0bf5aab30aac04b00e9dcf0f2cc20517a20b`). Der vollständige maschinenlesbare
Messbericht mit Konfiguration, Versionen, Releaseprovenienz, Dateigrößen,
SHA-256 und aggregierten Analysen liegt in
[catalog-compliant-batch.json](catalog-compliant-batch.json).

## Konfiguration und Ergebnis

Explizites Release:
`gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1`,
Hintergrund `sea-blue-01`. Ziel 1.000, maximales äußeres Budget 5.000.
Generierungsseeds beginnen bei 0, Zuordnungsseeds bei 100.000.

Alle normalen Generatoroptionen bleiben auf ihren Defaults, mit genau einer
ausdrücklichen Abweichung: `maxMapAttempts:1`. Damit entspricht hier jeder
äußere Versuch genau einem geografischen Kandidaten; Verwerfungen bleiben im
Zielzahlvertrag direkt sichtbar. Kein Routenfilter und keine Routensuche.

| Kennzahl | Ergebnis |
| --- | ---: |
| Zielstatus | `target-reached` |
| Versuche / geografische Kandidaten | 1.403 |
| Akzeptierte vollständig belegte Karten | 1.000 |
| Verworfene Versuche | 403 |
| Annahmequote | 71,28 % |
| Verschiedene geografische Karten / Dubletten | 997 / 3 |
| Karten mit wiederholten Motiven | 0 |
| Verwendete unterschiedliche Motive über den Lauf | 18 |
| Unbefahrbares Asset maximal je Karte verwendet | 1 |
| Geografische Objekte insgesamt | 3.795 |
| Mittlere Objektzahl / freie Wasserhexes | 3,795 / 18,993 |
| Ein / zwei / drei befahrbare Komponenten | 931 / 68 / 1 Karten |
| Unerwartete Dienstfehler | 0 |

Alle 403 Verwerfungen stammen aus `OBJECT_SPACING_EXHAUSTED`: Für die gewählte
Objektfolge blieb in der begonnenen Packung kein Katalogplatz mit ausreichendem
Abstand. Jeder dieser Generatoraufrufe endet entsprechend auch mit
`GENERATION_EXHAUSTED`. Beide Codes beschreiben dieselben 403 Versuche und sind
keine 806 Verwerfungen. Es gab keine unvollständige Assetzuordnung nach
erfolgreicher geografischer Generierung und keine Regelaufweichung.

| Objektzahl pro Karte | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Karten | 228 | 238 | 224 | 170 | 101 | 39 |

| Objektgröße in Hexes | 1 | 2 | 3 | 4 |
| --- | ---: | ---: | ---: | ---: |
| Objekte | 2.642 | 405 | 437 | 311 |

Die lokal gemessene Laufzeit betrug rund 3,52 Sekunden mit Node 24.19.0.
Das ist eine einzelne Laufzeitbeobachtung dieser Umgebung, kein allgemeines
Leistungsversprechen. Die Messwerte bewerten keine Rätselschwierigkeit oder
visuelle Qualität.

## Zusätzliche Prüfung des realen Ergebnisses

Alle 1.000 akzeptierten Zeilen wurden mit den akzeptierten Zeilen aus
`candidates.jsonl` verglichen. Jede Karte wurde erneut mit dem bestehenden
Kartenvalidator einschließlich Objektabstand und dem bestehenden
Platzierungsvalidator geprüft. Der bestehende Kartenfingerprint wurde erneut
berechnet und die konkrete Zuordnung mit Originalseed erneut ausgeführt und
vollständig verglichen. Alle verwendeten Motive gehören zur Releaseauswahl.

Die Versuche **0**, **1** und **1402** wurden über die tatsächliche CLI erneut
abgespielt und stimmten exakt überein. Versuch 0 ist verworfen, Versuch 1 die
erste akzeptierte Karte; Versuch 1402 ist die tausendste akzeptierte Karte.
Die akzeptierte Ergebnisnummer wird also nicht als Seedindex verwendet.

## Reproduktion

Im sauberen Programmcheckout des oben angegebenen Commits:

```sh
cat > /tmp/pr-b-real-config.json <<'JSON'
{"maxMapAttempts":1}
JSON
node scripts/generate-map-batch.mjs run \
  --mode catalog-compliant \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 \
  --target-count 1000 --max-attempts 5000 \
  --seed-start 0 --assignment-seed-start 100000 \
  --config /tmp/pr-b-real-config.json --out /tmp/pr-b-reproduced-batch
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/pr-b-reproduced-batch --index 1402 \
  --out /tmp/pr-b-reproduced-1402.jsonl
```

Für bytegleiche Manifeste gehört auch dieselbe Node-Version zum Messstand.
Der spätere reine Dokumentationscommit ändert die Inhalte und Kartenidentitäten
nicht; gemäß bestehendem Replayvertrag muss trotzdem der aufgezeichnete
Programmcommit verwendet werden. Die vollständigen lokalen Ausgabedateien
bleiben außerhalb des Repositorys; ihre SHA-256 stehen im JSON-Bericht.

## Tests und Grenzen

- `npm run test:unit`: **185/185** bestanden, einschließlich vorhandener
  Generatorvektoren, 23 eingefrorener Zuordnungsfälle, Batch-/Replayregressionen,
  Release-/Positionsnachweis und neuer Katalog-/Zielzahlfälle.
- `npm run test:content` und `npm run test:puzzles`: bestanden; die vorhandene
  Demorätsellösung bleibt unverändert eindeutig.
- `node scripts/catalog-release.mjs check-archive --previous 5c8e0bf5aab30aac04b00e9dcf0f2cc20517a20b`:
  bestanden; bestehendes Release unverändert.
- `git diff --check`: bestanden.

Die Tests decken zusätzlich begrenzte/unzureichende Budgets, vollständig
unmögliche Kataloganforderungen, explizite leere Karten/Dubletten, notwendiges
Umlegen einer gemeinsamen Motivbelegung, befahrbare Wiederverwendung,
Replaymanipulationen und Laden ohne Arbeitsasset-Fallback ab.

Kein Browser-/Deploymentlauf: Der PR ändert keine Oberfläche oder Grafikbytes.
Die Packung bleibt begrenzt und zufallsabhängig. Kein vollständiger
Packbarkeitsbeweis, keine Einzigartigkeitsforderung, keine neuen Rätsel,
Illustrationen, Freigaben oder Veröffentlichung.
