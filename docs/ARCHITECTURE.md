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

**Prinzipien:** Engine und Generator unabhängig vom DOM; UI liest definierte Falldaten; Text/Grafikänderungen erzwingen keine Regeländerung; Generatorfehler über reproduzierbare Seeds testbar. Für den ersten modularen Stand kein verpflichtendes Backend.

**Offen:** ES-Module vs. Buildschritt, Test- und CI-Werkzeuge, Persistenzmigration, Falldatenschema, Trennung regelrelevanter und erzählerischer Hinweise, Rechtehandling.
