# Rätseldesign – Arbeitsstand

## Bewährtes Muster

Prototypen 3.5 und 3.6 mischen Richtung, 60°-Abbiegen, Landmarkenabstand, Distanz zwischen Stundenpositionen, Küstenposition und Anzahl der Küstenkontakte. Gesucht ist ein **schrittweise nachvollziehbarer Lösungsweg**, nicht bloß mathematische Eindeutigkeit.

## Feedback zu 3.6

„Super Rätsel!“; allerdings sind zwei frühe Hinweise zu einfach und bestimmen die ersten beiden Schritte unmittelbar. Für kommende Fälle eher zu Beginn einschränkende Abstände, später einen Abbiegehinweis. **Dies ist eine Backlog-Idee, keine Änderung am aktuellen Fall.**

„An der Küste von Tesoro“ meint ein **Wasserfeld mit gemeinsamer Hexseite** zu einem Inselfeld; Eckberührung reicht nicht. Intervalle wie „Stunde 3 bis 6“ sollten ausdrücklich einschließlich gemeint und formuliert sein.

## Generatorentwurf (noch nicht implementiert)

Karte und gültige Routen bestimmen → Kandidatenhinweise erzeugen → auf exakt eine Lösung prüfen → Schwierigkeit und Qualität des schrittweisen Lösungswegs bewerten → Rätsel als Daten speichern.

**Mögliche Qualitätsmaße:** Anzahl verbleibender Routen nach Hinweisen, sofort erzwungene frühe Schritte, Hinweisarten, zeitliche Verteilung, Redundanz, verständliche Formulierung. Metriken und Grenzwerte sind noch offen.

Ein eindeutig lösbares Rätsel ist nicht automatisch ein gutes Rätsel; menschliche Spieltests bleiben notwendig.
