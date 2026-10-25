# Technische Grafikschablonen

Verbindliche Regel vom 18.10.2026: lückenlose Voronoi-Grafikzellen des tatsächlichen Zentrenrasters (82/41/68), statt der sichtbaren Spiel-Hexpolygone. Alle sichtbaren Quellpixel bleiben hart auf die Grafikfläche begrenzt. Keine endgültigen Illustrationen.

| Form | PNG-Maske | Maß in Pixeln | Vektorgeometrie / Bildvertrag |
| --- | --- | --- | --- |
| Einzelhex | [single.png](single.png) | 360 × 408 | [single.json](single.json) |
| Zweier Ost | [double-east.png](double-east.png) | 688 × 408 | [double-east.json](double-east.json) |
| Zweier diagonal | [double-diagonal.png](double-diagonal.png) | 528 × 680 | [double-diagonal.json](double-diagonal.json) |
| Asymmetrische Dreierform | [triple-asymmetric.png](triple-asymmetric.png) | 912 × 768 | [triple-asymmetric.json](triple-asymmetric.json) |

PNG unverändert als Ebenenmaske bei 100 % verwenden. Weiß (Alpha 255) erlaubt ein vollständiges Pixel; Alpha 0 muss transparent bleiben. Die Maske nicht weichzeichnen, skalieren oder an den alten Spielhexen ausrichten. Auch Schatten, Brandung und Alpha-1-Pixel müssen passen. Einzelne quadratische Pixel können schräge Außenkanten nicht beliebig genau ausfüllen; die konservative Maske enthält exakt alle vollständig zulässigen Pixel. Sie ist kein Nachweis künstlerischer Freigabe.

JSON-Koordinaten sind SVG-Einheiten relativ zum arithmetischen Mittelpunkt der belegten Zentren. Umrechnung: `px = 4*(x + width/2)`, `py = 4*(y + height/2)`. Die komplette Leinwand wird auf diesem Mittelpunkt platziert, nicht anhand sichtbarer Motive oder der Mittelpunktlage ihrer Bounding-Box.

Die Masken gelten unverändert an jeder geometrisch passenden Kartenposition, einschließlich aller Randfelder und beider Zeilenparitäten. `placementContract(asset, anchor)` prüft die vollständige relative Hexform auf Kartenpassung und liefert dieselbe lokale Fläche wie `imageContract`. Spielschutzfläche und Pergamentrahmen beschränken diese Fläche nicht. Galerie und Export verwenden denselben Vertrag; der Renderer beschneidet nichts.

> Jede geografische Illustration ist an jeder Position verwendbar, an der ihre vollständige relative Hexform ohne Rotation oder Spiegelung auf die Karte passt. Die zulässige lokale Grafikfläche bleibt dabei unverändert.

Reproduktion aus dem Repository-Hauptverzeichnis (Node.js, Python, Pillow):

```sh
python3 scripts/build-asset-templates.py
python3 tests/test_library_images.py
```

Der Generator verwendet `src/assets/geometry.mjs` und den vollständigen Pixelflächenprüfer aus `scripts/check-library-images.py`. Er ist deterministisch. Für andere zusammenhängende Formen `imageContract(cells)` verwenden; Zellvereinigungen behalten Konkavitäten und Aussparungen bei. Details und Randregel: [Assetbibliothek](../ASSET-LIBRARY-45.md).
