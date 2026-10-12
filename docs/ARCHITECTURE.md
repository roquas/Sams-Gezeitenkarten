# Architekturentwurf – noch nicht beschlossen

**Ausgangspunkt:** Prototyp 3.6 ist statisches HTML/CSS/JS mit Grafikdateien; UI und Logik sind bislang eng gekoppelt. Ziel: schlank, Uberspace-kompatibel, ohne großes Framework.

```text
src/
  engine/        # Hexgeometrie, Routen, Hinweise, Prüfung
  generator/     # Kandidaten, Eindeutigkeit, Qualität
  ui/            # Karte und Bedienung
  persistence/   # Spielstände
content/         # Erzähltexte
puzzles/         # Versionierte Falldaten
assets/          # Grafiken (Rechte separat klären)
tests/           # Unit-, Generator-, Browser- und Regressionstests
docs/
index.html
```

**Falldaten statt globaler Konstanten:** Gesperrte Felder sind eine variable Menge pro Rätsel; der Referenzfall 3.6 besitzt drei. Engine-Tests sollen mindestens eine abweichende Sperrfeldkonfiguration prüfen. Kartengröße, Startfeld und Routenlänge bleiben vorerst als mögliche spätere Parametrisierungen offen.

**Prinzipien:** Engine und Generator unabhängig vom DOM; UI liest definierte Falldaten; Text/Grafikänderungen erzwingen keine Regeländerung; Generatorfehler über reproduzierbare Seeds testbar. Für den ersten modularen Stand kein verpflichtendes Backend.

**Offen:** ES-Module vs. Buildschritt, Test- und CI-Werkzeuge, Persistenzmigration, Falldatenschema, Trennung regelrelevanter und erzählerischer Hinweise, Rechtehandling.


## Architekturentscheidung: datengetriebene Rätsel (12.10.2026)

**Beschlossen:** Die Engine darf die konkrete Karte, die Anzahl gesperrter Felder, Ortsbezeichnungen, deren Positionen und grafische Overlays nicht fest einkodieren. Sie erhält diese aus einer versionierten Rätseldefinition. Vorhandene Assets sollen per stabiler Asset-ID referenzierbar sein; neue Assets können rätselspezifisch hinzugefügt werden. Der unveränderte Prototyp 3.6 bleibt Referenz, nicht Architekturvorgabe.

**Noch als Idee offen:** Hintergründe können durch eine explizite Datei oder durch eine Standard-Asset-ID (z. B. `sea.type2`) ausgewählt werden. Orte können auf Bibliotheksassets (`island.tesoro`, `lighthouse.3`) oder selten auf mitgelieferte Binärassets verweisen. Datenformat, Asset-Auflösung, Rechte-/Sicherheitsgrenzen und Fallbacks werden vor Umsetzung spezifiziert. Keine Pflicht zur Einbettung von Binärdaten in JSON.
