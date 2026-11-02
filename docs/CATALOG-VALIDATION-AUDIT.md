# Zuständigkeiten der Geometrie- und Katalogprüfung

Bestandsaufnahme für die Korrektur von PR #98, 02.11.2026. Bestehende Verträge
werden hier eingeordnet; dieser PR ändert keine historischen Evidenzen,
Pixelvalidatoren, Generatoren oder produktiven Geometriefunktionen.

| Ebene | Maßgebliche Funktionen | Bestehende Sicherung |
|---|---|---|
| Geometrie und Rendering | [`imageContract`, `placementContract`, `assetRectangle`](../src/assets/geometry.mjs#L42), [`hexCenter`, `hexVertices`](../src/ui/place-labels.mjs#L4), `HEXES` und `CHART_CENTER` in `src/ui/chart-geometry.mjs`, `drawAssetPlacements` in `src/ui/asset-layer.mjs` | `tests/contracts/graphic-geometry.test.mjs`, `chart-asset-contract.test.mjs`, `catalog-position-independence.test.mjs`; nachgelagerte Browser-/Frameprüfungen |
| Assetvalidierung | `geometryErrors` in `src/assets/geometry.mjs`, `validateLibrary` in `src/assets/library.mjs`, `validateAssetBytes` in `scripts/validate-assets.mjs`, [`PixelFootprint.contains`](../scripts/check-library-images.py#L52) und [`check_image`](../scripts/check-library-images.py#L73) | `tests/contracts/assets.test.mjs`, `tests/test_library_images.py`, technische Masken in `docs/asset-templates/` |
| Katalogvalidierung | `describeSnapshot` / `validateTechnical` in `scripts/lib/catalog-release-format.mjs`, `verifyDocuments` / `loadCatalogReleaseCandidate` in `scripts/lib/catalog-release.mjs` | `tests/contracts/catalog-release.test.mjs`, `released-asset-catalog.test.mjs`, `catalog-proof.test.mjs` |
| Konkrete Karten und Zuordnung | `generateMap` in `src/generation/maps.mjs`, `placedCells` in `src/assets/geometry.mjs`, `validatePlacements` / `withPlacementValidator` in `src/assets/library.mjs`, `assignAssets` / `createCatalogProfile` in `src/assets/assignment.mjs` | `tests/contracts/assignment.test.mjs`, `asset-catalog-adapter.test.mjs`, `tests/engine/catalog-generation.test.mjs`, bestehende Generator-/Maptests |

## Hexgleichheit ist bereits ein übergeordneter Vertrag

[`placementContract`](../src/assets/geometry.mjs#L53) prüft über `assetRectangle`
nur, ob die belegten Zellen auf der konkreten Karte existieren, und liefert danach
**denselben** `imageContract(asset.geometry.cells)`. `boardGraphicCell` liefert die
volle Grafikzelle des unendlichen Gitters; es gibt keine andere Rand-Pixelmaske.
Die Kartenbegrenzung schränkt damit Platzierungen ein, nicht lokale Assetgrafiken.

`graphic-geometry.test.mjs`, insbesondere der Test ab [Zeile 78](../tests/contracts/graphic-geometry.test.mjs#L78),
sichert lokale Vertragsgleichheit und korrekte Translationen aller passenden
aktuellen Bibliotheksformen. Die Tests zu Voronoi-Bisektoren, konkaven Formen und
Löchern sichern die Flächen selbst; diese Prüfungen gehören zur Geometrieschicht.

`chart-asset-contract.test.mjs` ab [Zeile 13](../tests/contracts/chart-asset-contract.test.mjs#L13)
prüft Kartenmittelpunkt, symmetrische Ränder, unveränderte Zentren/Polygone,
Nachbarschaft und einheitlichen Bildmaßstab. `scripts/check-chart-assets.py`,
`scripts/lib/frame_footprint.py` und `tests/test_frame_footprint.py` prüfen
Pergamenttransparenz gegen vollständige Grafikzellen einschließlich Alpha-1-
Randpixeln. Das ist eine Rahmen-/Darstellungsprüfung, keine Motivzulässigkeit.

Der historische Nachweis in `catalog-position-independence.test.mjs` ab
[Zeile 37](../tests/contracts/catalog-position-independence.test.mjs#L37) kontrolliert
alle passenden Translationen des archivierten Katalogs und prüft seine Bildbytes
anschließend einmal lokal. Er schützt ausdrücklich archivierte Evidenz.

## Redundanz und Alt-Schnittstellen

- [`tests/test_library_images.py`, `test_all_illustrations_fit_every_valid_board_position`](../tests/test_library_images.py#L151)
  erzeugt pro Illustration alle Kartenanker und übergibt jeden lokalen
  `placementContract` an `check_image`. Dieser prüft ab
  [Zeile 87](../scripts/check-library-images.py#L87) jeden sichtbaren Pixel gegen
  die Grundmaske **und alle übergebenen Masken**. Unter dem heutigen Vertrag sind
  diese Masken gleich. Diese Wiederholung ist als laufende Einzelassetprüfung
  redundant und erklärt einen erheblichen Teil der Testlaufzeit.
- [`prepareAssetCatalog`](../scripts/lib/asset-catalog.mjs#L15) und
  `scripts/verify-asset-positions.py::verify` benutzen dieselbe ältere Schnittstelle.
  Sie kann getrennte `anchors` / `rejected` zurückgeben. `assignAssets` verarbeitet
  diese Evidenz noch über `PIXEL_POSITION_REJECTED`. Die Schnittstelle kann somit
  positionsbezogene Ablehnungen ausdrücken; bei durchgehend aktuellem Vertrag
  entstehen daraus keine unterschiedlichen lokalen Pixelzulässigkeiten.
  `asset-catalog-adapter.test.mjs` sichert volle Randspitzen und weist die alte
  Version `asset-placement-pixels-1` ausdrücklich zurück.
- Der aktuelle Release-Bau in [`scripts/check-catalog-release.mjs`](../scripts/check-catalog-release.mjs#L33)
  macht es bereits anders: einmalige lokale Bildprüfung durch
  `check-catalog-release-images.py`, danach Gleichheit aller Transformationsverträge.
  Die Ankerlisten bleiben Platzierungsevidenz. `loadReleasedAssetCatalog` in
  `scripts/lib/released-asset-catalog.mjs` übernimmt diese verifizierten Listen,
  ohne die Pixel noch einmal zu prüfen.
- `catalog-release-v1.mjs` ist eine absichtlich eingefrorene historische
  Vertragsimplementierung. Ihre parallele Existenz schützt alte Releases vor
  späteren Laufzeitänderungen; sie sollte nicht beiläufig mit dem aktuellen
  Geometriemodul zusammengeführt werden.

Damit besteht kein grundlegender Konflikt, der eine relative Fahne verhindert.
Es bestehen jedoch ältere Prüfoberflächen mit einer zu breiten Bedeutung von
„Positionsgültigkeit“ und mehrfacher gleicher Pixelarbeit. PR #98 liest diese
Daten weiterhin zur bestehenden Kandidatenverifikation, interpretiert sie aber
nicht mehr als Einzelassetprüfung und exportiert keine Ankerdaten.

## Kopplung und abgegrenzte Empfehlungen

1. **Schnelle Regression beibehalten:** Lokale Flächen-/Pixelgrenzfälle,
   Metadaten, Auswahlvollständigkeit, Transformationen, Frameverträge und
   Zuordnungsregeln weiter bei jedem Commit prüfen. Die vorhandene CI in
   `.github/workflows/tests.yml` führt diese Aufgaben unverändert auf PRs aus;
   es werden keine Schutzprüfungen entfernt oder per Pfadfilter versteckt.
2. **Separater Folgeauftrag:** Im veränderlichen Arbeitsbibliotheks-Adapter und
   obigem Python-Integrationstest lokale Pixelprüfung einmal je Bild ausführen
   und die Translationseigenschaft getrennt nachweisen, wie im Release-Bau.
   Ein unabhängiger Vergleich muss gleiche Ergebnisse für gültige und fehlerhafte
   Bilder, Randspitzen, konkave Formen und alle passenden Anker belegen.
   Evidenzformat und Versionsgrenzen dabei ausdrücklich behandeln.
3. **Historie erhalten:** Archivierte Dokumente, V1-Semantik, Hashbindungen und
   deren Regression nicht verkürzen. Änderungen an der laufenden Prüfung dürfen
   keine nachträgliche Umdeutung alter Freigaben erzeugen.
4. **Testzuständigkeiten präzisieren:** Wiederholte Gleichheitsnachweise zwischen
   Bibliotheks-, Release- und Renderingtests später gezielt bündeln. Direkte
   Modulimporte, Referenzmasken, Frame-JSON und Quellhashbindungen koppeln die
   jetzigen Tests bereits an die jeweiligen Verträge. Sie sind fachlich sinnvoll;
   eine strukturelle Neuordnung ist für die Fahne nicht erforderlich.
