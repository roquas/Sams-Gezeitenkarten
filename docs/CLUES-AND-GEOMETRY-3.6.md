# Vollständige Hinweise und Koordinaten – Referenz 3.6

Diese Spezifikation ist aus dem HTML-Quellcode des unveränderten Originalarchivs rekonstruiert. Die implementierten Referenzprädikate stehen in [reference-rules.mjs](../tests/reference/reference-rules.mjs), die Regressionstests in [reference-rules.test.mjs](../tests/reference/reference-rules.test.mjs).

## Koordinaten

- `A1` bis `E5`: Spalten `q=0..4`, Reihen `r=0..4`.
- Axiale Koordinaten: `Q=q-floor(r/2)`, `R=r`.
- Hexdistanz: `max(abs(Q1-Q2), abs(R1-R2), abs((Q1+R1)-(Q2+R2)))`.
- Nachbarn haben Distanz 1; Hindernisse beeinflussen diese Distanz **nicht**.
- SVG-Mittelpunkte: `x=60+82q+41(r mod 2)`, `y=56+68r`.
- Richtungszyklus im Uhrzeigersinn: Ost, Südost, Südwest, West, Nordwest, Nordost.
- In axialen Koordinaten: O `(+1,0)`, SO `(0,+1)`, SW `(-1,+1)`, W `(-1,0)`, NW `(0,-1)`, NO `(+1,-1)`.
- 60° links bedeutet im obigen Zyklus eine Position rückwärts.

## Sieben Hinweise – Originalformulierung und exakte Prüfbedeutung

| Nr. | Inhalt der Originalformulierung (fachlicher Kern) | Prädikat |
|---|---|---|
| I | „In der ersten Stunde hielten wir Kurs nach Nordosten.“ | Richtung Position 0 → 1 = NO |
| II | „In der zweiten Stunde drehten wir den Kurs um genau 60° nach links.“ | Richtung 1 → 2 = Richtung 0 → 1 um 60° gegen Uhrzeigersinn |
| III | „Nach Stunde 4 lag unser Boot direkt an der Küste von Tesoro“ | Position 4 ist befahrbarer Hexnachbar von B3 oder C3 |
| IV | „In der sechsten Stunde fuhren wir nach Westen.“ | Richtung Position 5 → 6 = W |
| V | „Nach Stunde 5 waren wir genau ein Hexfeld vom Leuchtturm bei Gamma/Cyan entfernt.“ | Hexdistanz(Position 5, C1) = 1 |
| VI | „Zwischen unseren Positionen nach Stunde 1 und Stunde 3 lagen genau zwei Hexfelder Luftlinie.“ | Hexdistanz(Position 1, Position 3) = 2 |
| VII | „Zwischen Stunde 3 und Stunde 6 waren wir insgesamt zweimal direkt an der Küste von Tesoro.“ | Genau 2 der Positionen 3, 4, 5, 6 sind Tesoro-Küstenfelder |

Erzählerische Zusätze der Originalhinweise bleiben im archivierten HTML maßgeblich. Das Referenzmodul ist ein **unabhängiger Testprüfer**, keine Änderung der bisherigen Spielimplementierung.

## Befunde der erneuten Testausführung

Am 12.10.2026 wurden mit `node --test reference-rules.test.mjs` sieben Tests ausgeführt und bestanden. Die Enumeration lieferte 519 gültige Routen, eine einzige Route erfüllt alle sieben Hinweise, und das Weglassen von sechs einzelnen Hinweisen lässt jeweils mehrere Lösungen zu. Das ist **kein** Browser- oder UI-Test.

## Noch nicht spezifiziert

Vollständige UI-Zustandsübergänge (einschließlich Drag, Undo, Speicherung, Rückmeldungen) und Darstellung auf mobilen Geräten. Diese Teile sind weiterhin nur im archivierten Prototyp implementiert und benötigen eigene Abnahme.
