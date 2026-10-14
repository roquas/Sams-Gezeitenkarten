# Assetbibliothek – technischer Entwurf (#45)

Dieser Branch ist **unabhängig von PR #48**. Die Datei `assets/catalog/asset-proposals.json` ist ein **Vorschlagskatalog**, keine Liste bereits vorhandener oder freigegebener Grafiken. Sie wird derzeit **nicht** von der Spieloberfläche geladen.

## Abgrenzung

- Keine Änderungen an Rätseldaten, Solver, Hexbewegung oder UI.
- Keine Dateipfade für noch nicht existierende Grafiken vortäuschen.
- Jede regelrelevante Assetdefinition hat eine einheitliche Befahrbarkeit. Dekoration hat **kein** `passable`-Feld.
- `geometry.cells` sind axiale Offsets zum Ankerfeld, zusammenhängend über Kanten; ein benannter Ort darf aus mehreren Instanzen bestehen.
- Keine Rotation, Spiegelung oder frei einstellbare Einzelasset-Skalierung.
- Die Assetgrafik wird am Mittelwert der Hexzentren positioniert; optische Asymmetrie gehört in die Bilddatei.
- Kompatibilität zu `sea-blue-01` ist **pending**, bis die beiden Basisgrafiken aus #49/PR #48 visuell freigegeben sind.
- Der Entwurf enthält 18 Motive, davon 6 priorisierte Piloten.

## Nächste Schritte

1. Katalogformat validieren (eindeutige IDs, Hexzusammenhang, Metadaten).
2. Die sechs Pilotmotive maßhaltig und im abgestimmten Aquarellstil erzeugen.
3. Nach Freigabe der Basisgrafiken jedes Motiv auf der echten 5×5-Karte prüfen.
4. Erst nach Bildabnahme Dateipfade und Hintergrundfreigaben eintragen.
5. Danach schrittweise Runtime-Loader, Legacy-Migration und Tests entwickeln.

## Verwandte Arbeiten

- [Issue #45](https://github.com/roquas/Sams-Gezeitenkarten/issues/45) – Bibliothek und Datenmodell
- [Issue #49](https://github.com/roquas/Sams-Gezeitenkarten/issues/49) – freizugebende Meer-/Rahmen-Basisassets
- [PR #48](https://github.com/roquas/Sams-Gezeitenkarten/pull/48) – technische Rahmentrennung

**Nicht mergen**, bis die tatsächlichen Bildassets und Tests abgenommen sind.
