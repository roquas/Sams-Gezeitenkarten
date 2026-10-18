# Grafikasset-Bibliothek (#45)

Erster Integrationsstand auf `main` nach PR #63 (`1f968b0`). Grundlage sind die vollständige Spezifikation von [Issue #45](https://github.com/roquas/Sams-Gezeitenkarten/issues/45) und der Kommentar zur **lokalen** Hexbegrenzung vom 15.10.2026. Der alte Branch `feature/asset-library-45` wurde geprüft, nicht gemergt. Sein Vorschlagskatalog bleibt unverändert in `assets/catalog/asset-proposals.json`; Zusammenhangsprüfung, axiale Koordinaten, unabhängige Befahrbarkeit und ausstehende Freigaben wurden übernommen. Die alte Prüfung auf exakt 18 Vorschläge ist keine Laufzeitbeschränkung.

## Architektur und Datenfluss

1. `assets/catalog/library.json`: erweiterbarer JSON-Katalog konkreter Dateien, stabiler IDs, Bildmaße, Geometrien und Herkunft. Keine Programmanpassung für neue Motive.
2. `src/assets/library.mjs`: Metadaten-, Referenz- und Platzierungsprüfung. Grafikklassifikation `family/type` bestimmt keine Spielregeln. Ein geografisches Asset hat einheitlich `passable: true|false`. Dekoration hat kein `passable` und keine logische Ortszuordnung.
3. `src/assets/geometry.mjs`: tatsächliche Hexzellen, fester Bildvertrag, Umrechnung lokaler axialer Offsets und Zentrierung.
4. `presentation.assetPlacements`: Instanz-ID, Asset-ID, Ankerfeld und optional logische Orts-ID. Kein Dateiname, keine Größe, kein `dx/dy`, keine Rotation oder Spiegelung.
5. `src/ui/asset-layer.mjs`: gemeinsamer Renderer für Spielkarte und Entwicklungsansicht, auf derselben Objektebene wie die historischen Motive. Reihenfolge: Meer → Objekte → Rahmen/Ortsnamen → Koordinaten/Hexlinien → Radar, Notizen und Stundenzeichen/Route. Kein Bild fängt Zeigereingaben ab. Die statische Kartenablage aus PR #63 bleibt erhalten.

Der Puzzleloader lädt den JSON-Katalog erst, wenn ein Rätsel neue Platzierungen verwendet. `validatePuzzle` überprüft deren Übereinstimmung mit der bestehenden `logic.blocked` und der Ortszugehörigkeit. Es erzeugt oder verändert keine Landfelder. Ein Ort darf mehrere getrennte Assets enthalten. Bestehende JSON-Rätsel, `dataVersion`, Speicherstände, Lösungen und Solver bleiben unverändert; das v1-Schema erhält ausschließlich optionale Präsentationsfelder.

Der Katalog enthält vier **schematische technische Platzhalter**, zwölf `pending`-Kombinationen und drei schon vorhandene Meerhintergründe. Keine neue Illustration wurde erzeugt oder künstlerisch freigegeben. Die Meer-/Rahmendateien aus #49 sind unverändert.

## Formate, Maße und Koordinaten

Statische **PNG oder WebP mit explizitem Alpha-Kanal**, keine Animation. Bilder werden mit **4 Pixeln pro SVG-Einheit** geliefert. Andere Auflösungen, EXIF-Drehungen und nachträgliches Skalieren eines einzelnen Motivs gehören nicht zum Vertrag. Die ganze Karte bleibt gleichmäßig responsiv skaliert.

`geometry.cells` enthält 1–25 eindeutige ganzzahlige axiale Paare `[q,r]`, einschließlich `[0,0]`. Sie müssen über Hexkanten zusammenhängen. Positive Richtungen sind `[1,0]` Ost und `[0,1]` Südost. Die vorhandene Kartenmatrix verwendet die tatsächliche Projektion:

```text
x = 82*q + 41*r
y = 68*r
Hexradius = 36 SVG-Einheiten, Spitzen bei 30°, 90°, …
```

Das Ankerfeld wird mit der Engine-Funktion `axial` umgerechnet. Dadurch bleibt dieselbe Ausrichtung auch beim Wechsel zwischen geraden und ungeraden Kartenzeilen erhalten. Hexfelder sind einzelne Bewegungsfelder; ein Mehrhexasset fasst sie nicht zu einem Spielzug zusammen.

Der Bildmittelpunkt liegt auf dem arithmetischen Mittel **aller belegten Hexzentren**. Der feste symmetrische Bildrahmen entsteht aus den tatsächlichen Hexpolygonen um diesen Mittelpunkt, aufgerundet auf gerade SVG-Maße, plus vier Einheiten transparenter Rand je Seite. Eine Bounding-Box bestimmt nur die Bilddatei, niemals die belegten Felder. Die Grafik muss innerhalb der **Vereinigung ihrer konkreten Hexpolygone** liegen, einschließlich Innenpositionen. Die bestehende Karte hat Wasserabstände zwischen den Hexpolygonen; diese bleiben transparent. Verbindungen über die Lücken oder Aussparungen sind nicht zulässig.

| Axiale Geometrie | Anzeige in SVG-Einheiten | Datei in Pixeln |
| --- | --- | --- |
| `[[0,0]]` | 72 × 80 | **288 × 320** |
| `[[0,0],[1,0]]` | 154 × 80 | **616 × 320** |
| `[[0,0],[0,1]]` | 112 × 148 | **448 × 592** |
| `[[0,0],[1,0],[0,1]]` | 154 × 172 | **616 × 688** |
| `[[0,0],[1,0],[2,0]]` | 236 × 80 | **944 × 320** |

Andere Formen erhalten ihre Maße ohne Architekturänderung durch:

```sh
node --input-type=module -e "import {imageContract} from './src/assets/geometry.mjs'; console.log(imageContract([[0,0],[1,0]]));"
```

Ein Motiv darf innerhalb der Datei asymmetrisch komponiert sein, etwa ein Leuchtturm mit mehr offenem Wasser darunter. Seine Leinwand wird trotzdem geometrisch zentriert. **Alle sichtbaren Pixel** müssen im lokalen Footprint bleiben, auch kaum sichtbare Schatten/Wellen. Es gibt weder ein automatisches Wegschneiden ungeeigneter Bilder noch ein Hineinquetschen durch Verzerrung. Die Pixelprüfung prüft alle vier Ecken jedes Pixels mit Alpha > 0.

## Visuelle Freigabe und Hintergrundwelten

Die Hintergrundliste besitzt unabhängige IDs und Familien. `candidateFamilies` schlägt Prüfungen vor; eine neue Variante derselben Familie ist **nicht** automatisch freigegeben. Unter `reviews` stehen Asset-/Hintergrundkombinationen mit `pending`, `approved` oder `rejected`. Fehlende Kombinationen gelten als `pending`. Eine ausdrücklich geprüfte universelle Freigabe verwendet `backgroundId: "*"`; eine konkrete Ablehnung oder ausstehende Prüfung hat Vorrang.

`approved` verlangt Prüfer, Datum, Notiz und SHA-256 der Bilddateien. Änderungen an Asset oder konkretem Hintergrund machen die Freigabe im Dateivalidator ungültig. Bei universeller Freigabe wird das Asset gehasht; der Prüfer verantwortet die ausdrückliche universelle Aussage. Transparenz, bestandene Pixelprüfung und ein Test-Screenshot setzen **keinen** Freigabestatus.

Die Entwicklungsansicht zeigt auch unbestätigte Kombinationen. Veröffentlichte Rätsel akzeptieren ausschließlich `stage: "illustration"` mit bestätigter Freigabe. Der erste Integrationsstand unterstützt für neue **Spielkarten** nur `assetBackground: "sea-blue-01"`, da dies das tatsächlich gerenderte Meer in beiden verbindlichen Rahmenvarianten ist. Historische `?frame=`-Experimente werden bei neuen Platzierungen auf `final` begrenzt. Andere Hintergrundwelten sind im Katalog und in der Entwicklungsansicht prüfbar; ihr Produkt-Einbau bleibt eine getrennte Aufgabe.

Zur Abnahme: Original-Hexgröße, mehrere Kartenpositionen, Desktop, iPhone und iPad sowie DPR 1/2 prüfen. Wasserkante, Licht, Transparenz, Perspektive, visuelle Befahrbarkeit und Namenslesbarkeit prüfen. Screenshots und Entscheidung im zugehörigen Issue/PR dokumentieren, dann erst Revieweintrag ändern.

## Vollständiges Beispiel: neues befahrbares Leuchtfeuer

Dieses Beispiel beschreibt die spätere Produktion. Die genannte Datei existiert bewusst noch nicht; keinen Pfad als verfügbar registrieren, bevor die Datei geliefert ist.

1. `assets/library/needle-beacon-v1.png` als transparentes **288 × 320** PNG liefern. Schmale Felsnadel und Leuchtfeuer bleiben vollständig im Einzelhex; erkennbarer offener Wasserraum. Herkunft und Nutzungsrechte dokumentieren.
2. Diesen Eintrag an `assets` in `assets/catalog/library.json` anhängen:

```json
{
  "id": "navigation.lighthouse.needle.v1",
  "family": "navigation",
  "type": "lighthouse",
  "role": "geographic",
  "passable": true,
  "stage": "illustration",
  "geometry": {"cells": [[0, 0]]},
  "image": {"path": "assets/library/needle-beacon-v1.png", "width": 288, "height": 320},
  "provenance": {"source": "Hier tatsächlichen Urheber/Produktionsbeleg eintragen", "rights": "Hier tatsächliche Nutzungsrechte eintragen"},
  "candidateFamilies": ["blue-sea"]
}
```

3. Unter `reviews` zunächst ergänzen:

```json
{
  "assetId": "navigation.lighthouse.needle.v1",
  "backgroundId": "sea-blue-01",
  "status": "pending",
  "notes": "Visuelle Prüfung ausstehend."
}
```

4. Entwicklungsserver starten und `/dev/asset-library.html` öffnen. Im Menü **Asset zur Einzelprüfung** das neue Asset wählen. Es erscheint automatisch an Rand- und Innenpositionen. Meereshintergründe wechseln, Hexgrenzen ein-/ausblenden. Kein Code muss angepasst werden.
5. `npm run test:assets` ausführen. Nach menschlicher Abnahme den Revieweintrag auf `approved` setzen, tatsächlichen `reviewer`, `date`, `notes`, `assetSha256` und `backgroundSha256` ergänzen. Die Hashes liefert:

```sh
sha256sum assets/library/needle-beacon-v1.png assets/seekarte/sea-blue-01.webp
```

6. Im Zielrätsel unter `presentation` ergänzen, etwa am bisherigen befahrbaren Leuchtturm `C1` des Referenzrätsels:

```json
"assetBackground": "sea-blue-01",
"assetPlacements": [
  {"id": "north-beacon", "assetId": "navigation.lighthouse.needle.v1", "anchor": "C1", "placeId": "lighthouse"}
]
```

Den dadurch ersetzten alten Leuchtturm-Eintrag aus `presentation.overlays` entfernen, um keine Doppelgrafik zu erzeugen. `logic`, Ortsname, Hinweise, `solution` und Befahrbarkeit unverändert lassen. Verschiedene Assetinstanzen können dieselbe `placeId` besitzen, wenn ihre Zellen zu diesem Ort gehören. Dekoration verwendet keine `placeId` und kein `passable`.

7. `npm run test:unit`, `npm run test:puzzles`, `npm run test:assets`, Browser-/Deploymentprüfungen und `python3 tests/test_package.py` ausführen. `sh scripts/package.sh` erstellt das eigenständige ZIP mit Katalog, Bildern und umgeschriebenen `.js`-Modulen. Die Entwicklungsansicht wird nicht ausgeliefert und ist in der normalen Spieloberfläche nicht verlinkt.

## Legacy-Migration und bewusste Ausnahmen

Alle acht bisherigen Präsentationsreferenzen sind über `src/assets/legacy.mjs` katalogisiert und durchlaufen den Adapter in `chartOverlays`. Die ursprüngliche Tabelle in `src/puzzles/assets.mjs` bleibt als v1-Dateinamenadapter erhalten. Kein bisheriges Bild wurde neu gezeichnet, zugeschnitten, verschoben oder als lokal normgerecht deklariert.

| Stabile Legacy-ID | Vorhandene Datei | Beibehaltener Sonderfall |
| --- | --- | --- |
| `legacy.insel-zweier-01` | `tesoro.png` | 148 × 112; bei drei Zellen weiterhin Overlaymaße 246 × 112 mit historischem Stretch |
| `legacy.insel-einzeln-01` | `tesoro.png` | 76 × 58 |
| `legacy.insel-einzeln-02` | `tesoro.png` | 64 × 49 |
| `legacy.riff-01` | `tesoro.png` | 54 × 41; grafischer Typ legt keine Befahrbarkeit fest |
| `legacy.segelboot-01` | `segelschiff.png` | 66 × 76, `dy = -6` |
| `legacy.segelboot-02` | `segelschiff.png` | 61 × 70, `dy = -5` |
| `legacy.leuchtturm-01` | `leuchtturm.png` | 75 × 81, `dy = -5`; bekannte unplausible große Basis am befahrbaren Ort bleibt |
| `legacy.krabbe-01` | keine zusätzliche Datei | historisch ausgelassen; zugehöriges Inselmotiv bleibt sichtbar |

Die vier veröffentlichten Rätsel verwenden diese Legacyregistrierungen ohne Datenänderung. **Noch keine bestehende Aquarellgrafik ist in den strengen lokalen Bildvertrag migriert.** Dies erfordert neue, separat abgenommene Illustrationen statt einer unsichtbar behaupteten Maßkonformität. Die vollständige Motivmigration ist daher eine klar begrenzte Folgeaufgabe. Die vier technischen PNGs demonstrieren den neuen Pfad vollständig und sind von veröffentlichten Platzierungen ausgeschlossen.

## Automatische Gates und erste Illustrationen

- IDs, bekannte Referenzen, sichere Dateipfade und Herkunft/Rechte; keine doppelten Geometriezellen, getrennten Komponenten oder fremden Transformationsfelder.
- Tatsächliches Dateiformat, Pixelmaße, Alpha, nichtleerer Inhalt und vollständige lokale Polygonbegrenzung.
- Unabhängige Befahrbarkeit, unveränderte Landfelder, Ortszugehörigkeit, mehrere getrennte Assets je Ort, Kartenrand und Zeilenparität.
- Hintergrund-/Freigabereferenzen, ausstehende/abgelehnte Freigaben, keine automatische Familienfreigabe und keine veralteten Freigabehashes.
- Alle bisherigen Unit-, Lösungs-, Browser-, WebKit- und Deploymenttests bleiben erhalten. Neue Browsertests verwenden auch abgefangene, ausdrücklich testinterne Freigabedaten; im echten Katalog ist nichts freigegeben.
- Deterministisches, vollständiges Deployment-ZIP; Entwicklungsgalerie ausgeschlossen.

Für die ersten **separat** zu erstellenden Bilder: Einzelhex-Insel **288 × 320**, Zweierinsel Ost **616 × 320**, schmaler befahrbarer Einzelhex-Leuchtturm **288 × 320** und eindeutig dekoratives Einzelhex-Motiv **288 × 320**. Andere Ausrichtungen benötigen eigene IDs und konkret dafür komponierte Dateien. Aquarell-/isometrische Stilreferenz aus #45/#49 erhalten; keine eingebackenen Ortsnamen. Vor der Registrierung den lokalen Footprint berücksichtigen; vor der Veröffentlichung die konkrete Kombination mit `sea-blue-01` künstlerisch abnehmen.
