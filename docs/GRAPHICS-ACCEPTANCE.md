# Seekarte: Grafikabnahme (Arbeitsstand)

## Status
Dieser Zweig enthält unter `graphics-preview.html` einen isolierten visuellen Test der
Seekartenebenen. **Noch keine Integration in das spielbare 0.1.**
Der Kartenhintergrund und Pergamentrand sind austauschbare SVG-Prototypen.
Die drei platzierten Motive stammen noch aus `prototypes/3.6/assets/`.
Die separat erzeugten Aquarellgrafiken wurden aus einem RGB-Konzeptbogen
ausgeschnitten; ein transparenter Hintergrund musste algorithmisch geschätzt
werden. Die Cutouts sind daher **nicht** produktionsreif und wurden nicht
als vermeintlich saubere Originalgrafiken eingecheckt.

## Akzeptanzkriterien für echte Produktionsgrafiken
1. Meer ohne Hexraster, Texte, Ortsmarkierungen oder Spiegelachsen; als separate Ebene.
2. Pergamentrahmen getrennt schaltbar; verdeckt keine spielrelevanten Felder.
3. Orte als Einzeldateien mit geprüftem Alphakanal und ohne Schachbrett-/Weißsaum.
4. Tesoro gehört zu B3/C3; einfeldrige Motive bleiben auch auf dem Smartphone lesbar.
5. Einheitliche Aquarell-/Tuschepalette, Perspektive und Licht von links oben.
6. Beschriftungen bleiben im DOM/SVG, nicht im Bild; Orts- und Bildzuordnung über Daten.
7. Original 3.6 bleibt byte-identisch; 0.1-Engine, Spielzustand und Regeln unberührt.
8. Rechte und Herkunft jedes Motivs vor Veröffentlichung dokumentieren.

## Test
```sh
git fetch origin
git switch design/seekarte-0.2-preview
python3 -m http.server 8000
```
Dann `http://localhost:8000/graphics-preview.html` öffnen.
Die Kontrollkästchen schalten Raster, Orte und Rahmen separat.
`http://localhost:8000/` bleibt das unveränderte Spiel 0.1.

## Nächster Schritt
Freigestellte Aquarellmotive einzeln mit sauberem Alpha neu erzeugen oder
manuell retuschieren, Dateien im Branch unter `assets/seekarte/` ablegen und
erst dann die Datenzuordnung in `src/ui/map.mjs` umschalten.
