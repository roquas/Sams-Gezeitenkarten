# PR A: Positionsunabhängigkeit des freigegebenen Katalogs

## Ergebnis und Geltungsbereich

Der vorhandene freigegebene Katalog gewährleistet bereits: Jedes seiner 18
produktiven geografischen Motive kann unverändert an jeder geometrisch passenden
Position seiner deklarierten Hexform eingesetzt werden. Das umfasst beide
Zeilenparitäten und alle geometrisch erreichbaren Rand- und Eckpositionen.
Es gibt insgesamt **368 Motiv-Anker-Kombinationen**, ohne grafisch bedingte
Positionsausschlüsse oder zusätzlichen Wasserabstand zum Kartenrand.

| Gebundener Stand | Identität |
| --- | --- |
| Release | `gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1` |
| Katalog | `gk-catalog-content-v1-sha256-3f406882907a76f99b3c6f816dc664f28f55d1ba42f01baa5fc637dc0b742bd1` |
| Ressourcen-Quellcommit | `ccab5f41dae380525f7535de4470848a3ab4d214` |
| Produktionshintergrund | `sea-blue-01` |
| Grafikvertrag / Pixelprüfung | Rahmenvertrag 4 / `asset-placement-pixels-2` |

Die Aussage gilt für die ausdrücklich ausgewählte produktive Auswahl dieses
Releases. Die übrigen 22 archivierten Assets erhalten dadurch keine Freigabe.
Die Prüfung bezieht sich auf Bildbytes aus dem gebundenen Git-Snapshot,
nicht auf möglicherweise abweichende Arbeitsdateien.

## Warum der bestehende Vertrag ausreicht

Die erforderliche Geometriekorrektur liegt bereits seit Commit
`5cd74ac` vor und ist im Ressourcen-Quellcommit dieses Releases enthalten:

1. `src/assets/geometry.mjs` verwendet vollständige Voronoi-Zellen des
   unendlichen tatsächlichen Mittelpunktgitters. `boardGraphicCell` schneidet
   weder Rand- noch Eckhexes an der Spielmarkierungszone ab.
2. `placementContract` verlangt ausschließlich, dass die gesamte Hexform auf
   der Karte liegt, und liefert denselben lokalen Vertrag wie `imageContract`.
   Die Schwerpunktplatzierung durch `assetRectangle` verschiebt alle lokalen
   Polygone exakt auf die zugehörigen vollständigen Kartenzellen. Canvas und
   Bildmaß bleiben unverändert. Auch bei asymmetrischen Mehrhexformen entsteht
   keine Rotation, Spiegelung oder positionsabhängige Verkleinerung.
3. Die lokale Bildprüfung kontrolliert die vollständige Fläche jedes Quellpixel-
   quadrats mit Alpha größer null gegen die deklarierte Polygonvereinigung.
   Interne gemeinsame Kanten bleiben erlaubt; Löcher und äußere Überstände
   bleiben ausgeschlossen. Die Gleichheit der lokalen Verträge überträgt
   diesen Nachweis auf alle passenden Positionen, unabhängig von der
   Rasterphase der verschobenen Grafik.
4. Die Rahmenprüfung kontrolliert jedes Quellpixelquadrat, das eine der 25
   vollständigen Kartenzellen mit positiver Fläche schneidet. Beide Rahmen
   haben in allen **2.234.040** geprüften Quadraten Alpha null. Das ist eine
   universelle Eigenschaft des Rahmens und hängt nicht von der Motivwahl ab.
   Der vollständige Motivcanvas liegt bei jeder passenden Position innerhalb
   des SVG-ViewBox. Randmotive werden deshalb weder vom Rahmen noch vom
   Canvas abgeschnitten.
5. Der bestehende Renderer `src/ui/asset-layer.mjs` verwendet diese Rechtecke
   mit gleichem Maßstab in beiden Achsen. Die Platzierungsvalidierung prüft
   exakte Objektform, Befahrbarkeit und Freigabe; sie ergänzt keine grafischen
   Randfilter. Der Releaseadapter übernimmt sämtliche gespeicherten Anker.

Eine Form muss unverändert vollständig hineinpassen. Beispielsweise erreicht
`land-coast.island.h3.smuggler-cove.v1` in seiner festen Orientierung nur die
Ecken E1 und A5; A1 und E5 sind für diese Form geometrisch unmöglich. Das ist
keine grafische Positionssperre. Ein Einzelhexmotiv erreicht alle vier Ecken.

## Bestand und vollständige Positionszahlen

Die Auswahl enthält ein unbefahrbares Einzelhexmotiv, acht unbefahrbare
Mehrhexmotive und neun befahrbare Einzelhexmotive. Befahrbare Mehrhexmotive
und zusätzliche Dekoration gehören nicht zur produktiven Auswahl.

| Motiv | Befahrbar | Hexes | Passende Anker |
| --- | --- | ---: | ---: |
| `land-coast.archipelago.h3.sand-reefs.v2` | nein | 3 | 14 |
| `land-coast.atoll.h1.broken-passages.v1` | ja | 1 | 25 |
| `land-coast.island.h1.basalt-spire-water.v1` | nein | 1 | 25 |
| `land-coast.island.h2.tropical-bays.v1` | nein | 2 | 20 |
| `land-coast.island.h3.massive-volcano.v1` | nein | 3 | 16 |
| `land-coast.island.h3.smuggler-cove.v1` | nein | 3 | 14 |
| `land-coast.island.h3.south-harbor.v1` | nein | 3 | 16 |
| `land-coast.island.h4.jungle-temple.v1` | nein | 4 | 14 |
| `land-coast.island.h4.long-sand.v1` | nein | 4 | 10 |
| `land-coast.settlement.h4.tesoro.v4` | nein | 4 | 14 |
| `navigation.lighthouse.h1.offcenter-beacon.v1` | ja | 1 | 25 |
| `navigation.wreck.h1.offcenter-sloop.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.barrels.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.bottle.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.buoy.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.crate.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.driftwood.v1` | ja | 1 | 25 |
| `sea-life.accent.h1.rowboat.v1` | ja | 1 | 25 |
| **Summe** | | | **368** |

## Reproduzierbarer Nachweis

```sh
node --test tests/contracts/catalog-position-independence.test.mjs
```

Voraussetzungen: Node 22+, vollständige Git-Quellhistorie, Python 3, Pillow und
NumPy. Der Test ist über `npm run test:unit` bereits in der CI enthalten.

Der erste Test enumeriert unabhängig von den archivierten Ankerlisten alle
18 × 25 Möglichkeiten über axiale Differenzen zu den 25 Brettzellen. Er
vergleicht die vollständigen erwarteten Ankerlisten mit Release und Adapter.
Eine fehlende zulässige Randposition kann dadurch nicht als Erfolg durchgehen.
Für jede passende Position prüft er den unveränderten lokalen Vertrag, die
Translation jedes Polygonvertex, Canvasgrenzen sowie die Zulässigkeit genau
dieses Motivs für sein Objekt. Nicht passende Positionen müssen scheitern.

Der zweite Test materialisiert ausschließlich verifizierte Releasebilder in
einem temporären Verzeichnis. Er prüft alle 18 tatsächlichen Motivbilder einmal
mit dem vorhandenen strikten lokalen Pixelprüfer und den vollständigen
Rahmenvertrag mit dem vorhandenen Rahmenprüfer für beide Rahmen. Es entstehen
weder neue Bildprüfer noch eine neue Freigabe. Die vorhandenen synthetischen
Regressionsprüfungen in `tests/test_library_images.py` und
`tests/test_frame_footprint.py` sichern insbesondere Alpha-1-Überstände,
schräge Pixelanschnitte und Randspitzen gegen zu schwache Prüfungen ab.

Ausgeführt am 28.10.2026 mit Node 24.19.0, Python 3.12.14, Pillow 12.3.0 und
NumPy 2.3.5:

| Prüfung | Ergebnis |
| --- | --- |
| Neuer Positionsnachweis sowie `graphic-geometry`, `chart-asset-contract`, `released-asset-catalog`, `catalog-generation` | 32/32 Node-Tests bestanden |
| Gezielte bestehende Pixelregressionen: Alpha-1-Überstand, vertikale und schräge Außenkante, interne Diagonale, Löcher, Randspitze, Format/Spiegelung | 7/7 bestanden |
| `python3 tests/test_frame_footprint.py` einschließlich Alpha-1-Mutation am Rahmen | 4/4 bestanden |
| `git diff --check` | bestanden |

Die Prozesssandbox blockierte zunächst lokale Unterprozesse (`spawnSync EPERM`)
und hielt die Eingabe der Bildprüfung an. Der oben berichtete Node-Lauf wurde
anschließend mit zugelassenen lokalen Unterprozessen vollständig ausgeführt.
Es wird kein vollständiger Unit-, Browser- oder Deploymentlauf behauptet.

## Releaseentscheidung und Grenze zu PR B

Eine neue Katalogfreigabe ist für diesen Nachweis **nicht erforderlich**.
Geometrie, Bildbytes, bestehende Anker, Freigaben und alle Identitäten bleiben
unverändert. Auch der eingefrorene V1-Loader wird nicht angepasst.

Die Positionsunabhängigkeit gewährleistet keine vollständige Bebilderbarkeit
beliebiger frei erzeugter Karten. Fehlende Formen/Befahrbarkeiten und begrenzte
Motivbestände sind davon unabhängige Gründe für unvollständige Zuordnungen.
Objektabstände, Wiederverwendungsregeln, vollständige konkrete Motivbelegung
und ein zielzahlorientierter Batchlauf gehören erst zu PR B nach Review von
PR A. Dieser Nachweis ändert weder den freien Generator noch den Batchmodus
und implementiert keine Rätselgenerierung oder Veröffentlichung.
