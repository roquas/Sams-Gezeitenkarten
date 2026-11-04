# B2-S02: Zusammensetzung gespeicherter Hinweise

Experiment: `gk-b2-run-sha256:4dcf2dcba4af6c718cf5ab5900733d08fa8fe911ed3fd849db2a34679eb9d883`. 96 Kandidaten, **340 gespeicherte Hinweise**.

Grundlage: vollständiger Kandidatenstrom, SHA-256 `84d5b224121047521e6e1b9d7c100270807beaed8482f8d3d72dc4457a3e06e1`; Manifest SHA-256 `9f9a3d17b956e153174e801d56dcb03e3b384c3f1e16957cc9f8fda44b180a3c`.

Generierung: Commit `d30c6683e8ba74e72ea1e9aae6e3aaa99295f207`, Node `v24.19.0`. Die exakten Quellhashes der Auswertung stehen in `clue-report.json` unter `analysis.implementation`.

Jedes Vorkommen in einem gespeicherten Kandidaten zählt einmal. Identische Hinweise in verschiedenen Kandidaten zählen jeweils erneut. Wahre Hinweispools und verworfene Suchergänzungen gehören nicht zu dieser Population. Prozentwerte beziehen sich auf alle 340 Hinweise und sind auf zwei Nachkommastellen gerundet.

## Logische Hinweistypen

| Engine-Kennung | Anzahl | Anteil (%) |
| --- | --- | --- |
| `countDistanceToPlace` | 283 | 83.24 |
| `direction` | 8 | 2.35 |
| `distanceBetweenHours` | 15 | 4.41 |
| `distanceToPlace` | 26 | 7.65 |
| `position` | 1 | 0.29 |
| `turn` | 7 | 2.06 |

## Darstellungsformen

| Darstellungskennung | Anzahl | Anteil (%) |
| --- | --- | --- |
| `CountDistanceNever` | 56 | 16.47 |
| `HasDistanceAt` | 27 | 7.94 |
| `NotDistanceAt` | 14 | 4.12 |
| `countDistanceToPlace` | 186 | 54.71 |
| `direction` | 8 | 2.35 |
| `distanceBetweenHours` | 15 | 4.41 |
| `distanceToPlace` | 26 | 7.65 |
| `position` | 1 | 0.29 |
| `turn` | 7 | 2.06 |

## Logischer Typ × Darstellungsform

| Logischer Typ | `CountDistanceNever` | `HasDistanceAt` | `NotDistanceAt` | `countDistanceToPlace` | `direction` | `distanceBetweenHours` | `distanceToPlace` | `position` | `turn` | Summe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `countDistanceToPlace` | 56 | 27 | 14 | 186 | 0 | 0 | 0 | 0 | 0 | 283 |
| `direction` | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 8 |
| `distanceBetweenHours` | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 15 |
| `distanceToPlace` | 0 | 0 | 0 | 0 | 0 | 0 | 26 | 0 | 0 | 26 |
| `position` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| `turn` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 7 |
| Summe | 56 | 27 | 14 | 186 | 8 | 15 | 26 | 1 | 7 | 340 |

Alle Zeilensummen stimmen mit den logischen Häufigkeiten, alle Spaltensummen mit den Formhäufigkeiten überein. Beide Randverteilungen und die Kreuztabelle summieren sich auf **340**. Rundungen der Prozentwerte sind keine zusätzlichen Zählungen.

## Bindung der Darstellung und Nachvollziehbarkeit

Der logische Typ und seine Parameter sind pro Hinweis gespeichert. Die Form wird durch die unveränderte Funktion `cluePresentationForm()` eindeutig und deterministisch abgeleitet; `technicalClueText()` verwendet beim Export dieselbe Ableitung. Es gibt keine zusätzliche Auswahl alternativer Formen beim Export.

Für `countDistanceToPlace` gilt: Einzelstunde mit Anzahl 0 → `NotDistanceAt`, Einzelstunde mit Anzahl 1 → `HasDistanceAt`, sonst Anzahl 0 → `CountDistanceNever`, sonst → `countDistanceToPlace`. Einzelstunden haben Vorrang. Andere logische Typen behalten ihre Kennung als Form.

`properties.cluePresentationForms` speichert nur die verschiedenen vorkommenden Formen eines Kandidaten; diese Liste ist keine Häufigkeitsverteilung. `occurrences` im JSON weist jedes gezählte Vorkommen mit Testname, Hinweis-ID, logischem Typ und abgeleiteter Form nach. Es werden keine zusätzlichen möglichen Formulierungen unterstellt.

Die Auswertung beschreibt ausschließlich Zusammensetzung. Sie enthält keine Qualitätsmetrik, Bewertung, Suchgewichtung oder Auswahl.
