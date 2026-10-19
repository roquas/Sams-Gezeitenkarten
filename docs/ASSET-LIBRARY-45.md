# Grafikasset-Bibliothek (#45)

Erster Integrationsstand auf `main` nach PR #63 (`1f968b0`). Grundlage sind die vollständige Spezifikation von [Issue #45](https://github.com/roquas/Sams-Gezeitenkarten/issues/45) und die verbindliche Grafikregel vom **18.10.2026**. Sie ersetzt die Präzisierung vom 15.10.2026 hinsichtlich der Polygongeometrie: Der Footprint besteht aus lückenlosen Grafikzellen, während sämtliche sichtbaren Pixel weiterhin hart begrenzt bleiben. Der alte Branch `feature/asset-library-45` wurde geprüft, nicht gemergt. Sein Vorschlagskatalog bleibt unverändert in `assets/catalog/asset-proposals.json`; Zusammenhangsprüfung, axiale Koordinaten, unabhängige Befahrbarkeit und ausstehende Freigaben wurden übernommen. Die alte Prüfung auf exakt 18 Vorschläge ist keine Laufzeitbeschränkung.

## Architektur und Datenfluss

1. `assets/catalog/library.json`: erweiterbarer JSON-Katalog konkreter Dateien, stabiler IDs, Bildmaße, Geometrien und Herkunft. Keine Programmanpassung für neue Motive.
2. `src/assets/library.mjs`: Metadaten-, Referenz- und Platzierungsprüfung. Grafikklassifikation `family/type` bestimmt keine Spielregeln. Ein geografisches Asset hat einheitlich `passable: true|false`. Dekoration hat kein `passable` und keine logische Ortszuordnung.
3. `src/assets/geometry.mjs`: tatsächliche Hexzellen, fester Bildvertrag, Umrechnung lokaler axialer Offsets und Zentrierung.
4. `presentation.assetPlacements`: Instanz-ID, Asset-ID, Ankerfeld und optional logische Orts-ID. Kein Dateiname, keine Größe, kein `dx/dy`, keine Rotation oder Spiegelung.
5. `src/ui/asset-layer.mjs`: gemeinsamer Renderer für Spielkarte und Entwicklungsansicht, auf derselben Objektebene wie die historischen Motive. Reihenfolge: Meer → Objekte → Rahmen/Ortsnamen → Koordinaten/Hexlinien → Radar, Notizen und Stundenzeichen/Route. Kein Bild fängt Zeigereingaben ab. Die statische Kartenablage aus PR #63 bleibt erhalten.

Der Puzzleloader lädt den JSON-Katalog erst, wenn ein Rätsel neue Platzierungen verwendet. `validatePuzzle` überprüft deren Übereinstimmung mit der bestehenden `logic.blocked` und der Ortszugehörigkeit. Es erzeugt oder verändert keine Landfelder. Ein Ort darf mehrere getrennte Assets enthalten. Bestehende JSON-Rätsel, `dataVersion`, Speicherstände, Lösungen und Solver bleiben unverändert; das v1-Schema erhält ausschließlich optionale Präsentationsfelder.

Der Katalog enthält vier **schematische technische Platzhalter**, zwei alternative Felsnadel-Illustrationen, drei befahrbare Einzelhex-Illustrationen und drei vorhandene Meerhintergründe. Nach ausdrücklicher Nutzerentscheidung vom 19.10.2026 sind genau vier Kombinationen künstlerisch freigegeben (`approved`), alle ausschließlich auf `sea-blue-01`: wasserreiche Felsnadel (bevorzugt), Leuchtturm, aufgebrochenes Atoll und Wrack. Die wasserreduzierte Felsnadel bleibt als nicht bevorzugter Vergleich `pending`; ebenso alle ungeprüften Hintergründe und technischen Platzhalter. Das etwas felsige Atoll ist ausdrücklich unverändert akzeptiert. Die [Galerie mit Verwendungszuständen](PASSABLE-PROTOTYPES-65.md#drei-verwendungszustände-vergleichen) zeigt echte Pergament-Ortsnamen, Kartografenringe und Flavor mit dem unveränderten Produktionsrenderer. Keine neue produktive Platzierung. Die Meer-/Rahmendateien aus #49 sind unverändert.

## Formate, Maße und Koordinaten

Statische **PNG oder WebP mit explizitem Alpha-Kanal**, keine Animation. Bilder werden mit **4 Pixeln pro SVG-Einheit** geliefert. Andere Auflösungen, EXIF-Drehungen und nachträgliches Skalieren eines einzelnen Motivs gehören nicht zum Vertrag. Die ganze Karte bleibt gleichmäßig responsiv skaliert.

`geometry.cells` enthält 1–25 eindeutige ganzzahlige axiale Paare `[q,r]`, einschließlich `[0,0]`. Sie müssen über Hexkanten zusammenhängen. Positive Richtungen sind `[1,0]` Ost und `[0,1]` Südost. Die vorhandene Kartenmatrix verwendet die tatsächliche Projektion:

```text
x = 82*q + 41*r
y = 68*r
Sichtbares Spiel-Hex: Radius 36 SVG-Einheiten, Spitzen bei 30°, 90°, …
Grafik-Hex: Voronoi-Zelle des vollständigen, unendlichen Zentrenrasters
```

Das Ankerfeld wird mit der Engine-Funktion `axial` umgerechnet. Dadurch bleibt dieselbe Ausrichtung auch beim Wechsel zwischen geraden und ungeraden Kartenzeilen erhalten. Hexfelder sind einzelne Bewegungsfelder; ein Mehrhexasset fasst sie nicht zu einem Spielzug zusammen.

### Lückenlose Grafikzellen und Kartenrand

Die sichtbaren Spielpolygone bleiben unverändert: Hexlinien, Markierungen, Hinweise und Eingaben verwenden weiterhin Radius 36. Ihr horizontaler Abstand von etwa 19,65 SVG-Einheiten ist **keine** Grafikgrenze mehr.

Die Mittelsenkrechten zum vollständigen Zentrenraster ergeben die Voronoi-Zelle um `(0,0)`:

```text
|x| ≤ 41
±41*x ±68*y ≤ (41² + 68²)/2 = 3152,5
Ecken: (0, ±46,360294117647…), (±41, ±21,639705882353…)
Fläche: 82*68 = 5576 SVG-Quadrateinheiten
```

Die Zellen sind wegen der tatsächlichen Projektion **keine regelmäßigen Hexagone**. Jeder der sechs logischen Kantennachbarn teilt eine ganze Kante, auch bei wechselnder Zeilenparität. Ihre Innenflächen sind disjunkt. Mehrhexflächen sind Vereinigungen dieser Zellen; interne Kanten sind keine Pixelbarrieren. Konkavitäten und ausgelassene Zellen bleiben erhalten. Ein konvexer Rumpf oder ein gemeinsames Rechteck wäre falsch.

Der äußere Kartenbereich ist die Vereinigung der 25 Zellen aus dem **vollständigen Raster**, geschnitten mit der bereits vorhandenen geometrischen 8-Einheiten-Spielschutzzone `PROTECTION[0]`. Diese stammt aus `ROW_ENVELOPE`, also der festen Spielgeometrie, unabhängig von Pergamentalpha und Illustrationen. Dadurch werden Voronoi-Zellen am Rand nicht bis ins Unendliche erweitert und bestehende Sicherheitsabstände nicht aufgehoben. Beispielsweise läge die volle Spitze von A1 bei `y≈9,64`, die bestehende Schutzzone beginnt dort aber bei `y=12`. Diese Spitze ist an A1 als Bildinhalt unzulässig.

`boardGraphicCell` zerlegt die geschnittenen Randzellen in konvexe Fragmente mit disjunkten Innenflächen. `placementContract` liefert sie im lokalen Bildkoordinatensystem. Der Export prüft alle tatsächlich eingetragenen Platzierungen zusätzlich gegen diese Randgeometrie. Ein innen gültiges Bild kann am Kartenrand ungültig sein. Dafür muss die Illustration von Anfang an passend komponiert oder eine eigene Assetvariante erstellt werden; der Renderer beschneidet oder verschiebt nichts. Die Entwicklungsgalerie zeigt die tatsächlich erlaubte Fläche grün an.

Der Bildmittelpunkt liegt auf dem arithmetischen Mittel **aller belegten Hexzentren**. Der feste symmetrische Bildrahmen entsteht aus den Grafikzellen um diesen Mittelpunkt: je Achse `2*ceil(max(abs(Koordinate))+4)` SVG-Einheiten, also mindestens vier Einheiten transparenter Dateirand. Eine Bounding-Box bestimmt nur die Bilddatei, niemals die erlaubte Grafikfläche.

| Axiale Geometrie | Anzeige in SVG-Einheiten | Datei in Pixeln |
| --- | --- | --- |
| `[[0,0]]` | 90 × 102 | **360 × 408** |
| `[[0,0],[1,0]]` | 172 × 102 | **688 × 408** |
| `[[0,0],[0,1]]` | 132 × 170 | **528 × 680** |
| `[[0,0],[1,0],[1,1]]` | 228 × 192 | **912 × 768** |
| `[[0,0],[1,0],[2,0]]` | 254 × 102 | **1016 × 408** |

Die alten Produktionsmaße 288 × 320 beziehungsweise 616 × 320 sind damit ersetzt. Die vier technischen PNGs sind reproduzierbar mit `python3 scripts/build-asset-fixtures.py` angepasst; die Zweierform zeigt eine durchgehende technische Verbindung über die frühere Lücke.

Die asymmetrische Dreierform ist eine geknickte Kette `[[0,0],[1,0],[1,1]]` mit drei unterschiedlichen Zentrenabständen. Sie besitzt keine Spiegelachse; ihr arithmetischer Mittelpunkt weicht in beiden Achsen vom Mittelpunkt der geometrischen Bounding-Box ab.

### Reproduzierbare Zeichenschablonen

[docs/asset-templates](asset-templates/README.md) enthält für die ersten vier Formen jeweils eine transparente PNG-Maske mit den festen Bildmaßen und einen JSON-Vertrag mit den exakten Vektorpolygonen. Weiß/Alpha 255 bedeutet: Dieses vollständige Pixel darf bemalt werden. Alpha 0 muss transparent bleiben. Der Generator `python3 scripts/build-asset-templates.py` verwendet den Browservertrag und denselben Flächenprüfer wie der Export. Die Masken sind technische Hilfsmittel, keine Illustrationen. Randplatzierungen müssen zusätzlich den positionsabhängigen Vertrag erfüllen.

Andere Formen erhalten ihre Maße ohne Architekturänderung durch:

```sh
node --input-type=module -e "import {imageContract} from './src/assets/geometry.mjs'; console.log(imageContract([[0,0],[1,0]]));"
```

Ein Motiv darf innerhalb der Datei asymmetrisch komponiert sein, etwa ein Leuchtturm mit mehr offenem Wasser darunter. Seine Leinwand wird trotzdem geometrisch zentriert. **Alle sichtbaren Pixel** müssen im lokalen Footprint bleiben, auch kaum sichtbare Schatten/Wellen. Es gibt weder ein automatisches Wegschneiden ungeeigneter Bilder noch ein Hineinquetschen durch Verzerrung. Die Pixelprüfung behandelt jedes Pixel mit Alpha > 0 als vollständiges Quadrat von ¼ × ¼ SVG-Einheiten. Sie schneidet dieses Quadrat gegen die konvexen, innen disjunkten Fragmente und verlangt dessen vollständige Flächendeckung durch die Vereinigung. Damit sind interne Kanten übermalbar, aber selbst eingeschlossene kleine Aussparungen bleiben verboten. Vier Ecken oder nur der Mittelpunkt reichen nicht. Die numerische Toleranz von `1e-10` SVG-Flächeneinheiten kompensiert ausschließlich Gleitkommaarithmetik.

Gemeinsame Linien haben Fläche null. Ein Punkt exakt darauf gehört deterministisch zum lexikografisch kleinsten axialen Paar `[q,r]` (`graphicOwner`). Pixelquadrate dürfen solche Linien berühren; sie dürfen keine positive Fläche außerhalb ihres Asset-Footprints beanspruchen. Zwei verschiedene Assets dürfen auch als Dekoration keine gemeinsame logische Grafikzelle belegen. Zusammen mit der Flächenprüfung verhindert dies jede Überdeckung von Quellpixel-Flächen.

Responsive Bildfilter können benachbarte Quellpixel im selben **Bildschirm**pixel abtasten. Der gemeinsame Renderer summiert deshalb die vormultiplizierten Farb-/Alphabeiträge mit `mix-blend-mode: plus-lighter` in einer isolierten SVG-Gruppe und komponiert diese einmal über den Hintergrund. Das erhält die glatte Skalierung und vermeidet reihenfolgeabhängiges Übermalen an Zellgrenzen. Es verändert keine Bildmaße, Positionen oder Footprints. Browsertests vergleichen die gerenderten PNGs bei vertauschter Reihenfolge für horizontale und diagonale Nachbarn, gerade/ungerade Zeilen und Desktop/Mobil.

## Visuelle Freigabe und Hintergrundwelten

Die Hintergrundliste besitzt unabhängige IDs und Familien. `candidateFamilies` schlägt Prüfungen vor; eine neue Variante derselben Familie ist **nicht** automatisch freigegeben. Unter `reviews` stehen Asset-/Hintergrundkombinationen mit `pending`, `approved` oder `rejected`. Fehlende Kombinationen gelten als `pending`. Eine ausdrücklich geprüfte universelle Freigabe verwendet `backgroundId: "*"`; eine konkrete Ablehnung oder ausstehende Prüfung hat Vorrang.

`approved` verlangt Prüfer, Datum, Notiz und SHA-256 der Bilddateien. Änderungen an Asset oder konkretem Hintergrund machen die Freigabe im Dateivalidator ungültig. Bei universeller Freigabe wird das Asset gehasht; der Prüfer verantwortet die ausdrückliche universelle Aussage. Transparenz, bestandene Pixelprüfung und ein Test-Screenshot setzen **keinen** Freigabestatus.

Die Entwicklungsansicht zeigt auch unbestätigte Kombinationen. Veröffentlichte Rätsel akzeptieren ausschließlich `stage: "illustration"` mit bestätigter Freigabe. Der erste Integrationsstand unterstützt für neue **Spielkarten** nur `assetBackground: "sea-blue-01"`, wobei der Katalogpfad zwingend exakt `CHART_ASSET_SPEC.sea` (`assets/seekarte/sea-blue-01.webp`) entsprechen muss. Ein anderer Dateipfad unter unveränderter ID wird bereits vom gemeinsamen Validator abgelehnt, auch mit passenden Hashes. Dies ist das tatsächlich gerenderte Meer in beiden verbindlichen Rahmenvarianten. Historische `?frame=`-Experimente werden bei neuen Platzierungen auf `final` begrenzt. Andere Hintergrundwelten sind im Katalog und in der Entwicklungsansicht prüfbar; ihr Produkt-Einbau bleibt eine getrennte Aufgabe.

Zur Abnahme: Original-Hexgröße, mehrere Kartenpositionen, Desktop, iPhone und iPad sowie DPR 1/2 prüfen. Wasserkante, Licht, Transparenz, Perspektive, visuelle Befahrbarkeit und Namenslesbarkeit prüfen. Screenshots und Entscheidung im zugehörigen Issue/PR dokumentieren, dann erst Revieweintrag ändern.

## Vollständiges Beispiel: neues befahrbares Leuchtfeuer

Dieses Beispiel beschreibt die spätere Produktion. Die genannte Datei existiert bewusst noch nicht; keinen Pfad als verfügbar registrieren, bevor die Datei geliefert ist.

1. `assets/library/needle-beacon-v1.png` als transparentes **360 × 408** PNG liefern. Schmale Felsnadel und Leuchtfeuer bleiben vollständig im Einzelhex; erkennbarer offener Wasserraum. Herkunft und Nutzungsrechte dokumentieren.
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
  "image": {"path": "assets/library/needle-beacon-v1.png", "width": 360, "height": 408},
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

4. Entwicklungsserver starten und `/dev/asset-library.html` öffnen. Im Menü **Asset zur Einzelprüfung** das neue Asset wählen. Es erscheint deterministisch an Rand- und Innenpositionen für jede verfügbare gerade und ungerade Zeile (Zeilennummern ab 1). Unmögliche Kategorien werden ausgelassen; Anker, Parität und Lage stehen an jeder Ansicht. Meereshintergründe wechseln, Spiel-Hexgrenzen und grüne Grafikflächen getrennt ein-/ausblenden. Kein Code muss angepasst werden.
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

7. `npm run test:unit`, `npm run test:puzzles`, `npm run test:assets`, Browser-/Deploymentprüfungen und `python3 tests/test_package.py` ausführen. `sh scripts/package.sh` (oder direkt `python3 scripts/package.py`) verlangt Node.js, Python 3 und Pillow, erzwingt alle Freigabe-, Puzzle-/Solver- und Bildprüfungen und erstellt das eigenständige ZIP mit Katalog, Bildern und umgeschriebenen `.js`-Modulen. Die Entwicklungsansicht wird nicht ausgeliefert und ist in der normalen Spieloberfläche nicht verlinkt.

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

- IDs, bekannte Referenzen, sichere Dateipfade und Herkunft/Rechte; symbolische Dateien und symbolische Pfadkomponenten sind ausdrücklich nicht unterstützt, auch keine internen Aliase; keine doppelten Geometriezellen, getrennten Komponenten oder fremden Transformationsfelder.
- Tatsächliches Dateiformat, Pixelmaße, Alpha, nichtleerer Inhalt und vollständige lokale Polygonbegrenzung.
- Unabhängige Befahrbarkeit, unveränderte Landfelder, Ortszugehörigkeit, mehrere getrennte Assets je Ort, Kartenrand und Zeilenparität.
- Hintergrund-/Freigabereferenzen, ausstehende/abgelehnte Freigaben, keine automatische Familienfreigabe und keine veralteten Freigabehashes.
- Alle bisherigen Unit-, Lösungs-, Browser-, WebKit- und Deploymenttests bleiben erhalten. Neue Browsertests verwenden auch abgefangene, ausdrücklich testinterne Freigabedaten; der echte Katalog enthält genau vier ausdrücklich freigegebene Paare auf `sea-blue-01` (wasserreiche Felsnadel, Leuchtturm, aufgebrochenes Atoll, Wrack).
- Deterministisches, vollständiges Deployment-ZIP; Entwicklungsgalerie ausgeschlossen. Beide Exporteinstiege erzwingen dieselben JS-Validatoren und den Bildvalidator, einschließlich Dekodierung aller ausgelieferten PNG/WebP-Dateien. Kein paralleler Teilvalidator für Freigaben im Python-Exporter. Bei Fehler: verständliche Meldung, Fehlerstatus und unverändertes letztes ZIP.
- Die konkreten Regressionen und Prüfbefehle stehen im [Testplan](TESTPLAN.md#assetbibliothek-und-grafikzellen-18102026).

Für die ersten **separat** zu erstellenden Bilder: Einzelhex-Insel **360 × 408**, Zweierinsel Ost **688 × 408**, schmaler befahrbarer Einzelhex-Leuchtturm **360 × 408** und eindeutig dekoratives Einzelhex-Motiv **360 × 408**. Andere Ausrichtungen benötigen eigene IDs und konkret dafür komponierte Dateien. Die [Stilpräzisierung vom 19.10.2026](FELSNADEL-WATER-COMPARISON-65.md#präzisierter-visueller-stil) gilt: farbenfrohe, detailreiche, plastische Brettspiel-/Computerspielillustration mit Aquarellcharakter; benannte Orte klar erkennbar. Eigene türkisfarbene Küstenbereiche sind erlaubt, aber nicht verpflichtend. Keine allgemeine verbindliche Wasserregel ohne gesonderte Entscheidung. Isometrische Perspektive aus #45/#49 erhalten; keine eingebackenen Ortsnamen. Vor der Registrierung den lokalen Footprint berücksichtigen; vor der Veröffentlichung die konkrete Kombination mit `sea-blue-01` künstlerisch abnehmen.


## Verbleibende Folgearbeiten vor produktiven Illustrationen

- **B4 – Beschriftung getrennter Teilinseln:** Der bestehende Algorithmus beschriftet nur eine Komponente eines benannten Ortes. Vor produktiver Verwendung entsprechender Orte muss eine bewusste Gestaltung entschieden werden. Dieser PR verändert die Beschriftungslogik nicht und wiederholt den Ortsnamen nicht ungefragt auf jedem Teil.
- **B6 – Bildladefehler im Browser:** Eine eigene sichtbare Fehlerbehandlung des neuen Renderers für fehlende/beschädigte Bilder steht aus und muss vor produktivem Einsatz neuer Illustrationen umgesetzt werden. Der jetzt zwingende Exportcheck verhindert ungültige Quelldateien, ersetzt aber keine Behandlung späterer Hosting- oder Ladefehler.
- Weitere Illustrationen und deren menschliche Freigaben sowie die vollständige Legacy-Migration bleiben separate Arbeiten. Die wasserreiche Felsnadel ist ausschließlich auf `sea-blue-01` künstlerisch freigegeben; ihre Überlagerung mit echten Spielmarkierungen und Ortsnamen bleibt offen. Die geometrische Zulässigkeit allein beweist keine künstlerische Eignung.

## Befahrbare Prototypen vom 19.10.2026

Leuchtturm, aufgebrochenes Atoll und Segelschiffswrack sind als befahrbare Einzelhex-Illustrationen registriert und gemäß Nutzerentscheidung künstlerisch ausschließlich für `sea-blue-01` freigegeben (`approved`). Die vorhandenen PNGs und IDs bleiben erhalten, einschließlich des etwas felsigen Atolls. Überdeckung durch Spielmarkierungen ist akzeptiert.

Die Galerie zeigt neben dem Motivvergleich drei wählbare Verwendungszustände: benannter unbefahrbarer Ort mit bestehendem Pergament-Ortsnamen, benannter befahrbarer Ort mit orange/goldenem Kartografenring **ohne Pergamentschild**, Flavor ohne beide Kennzeichnungen. Das fehlende Pergamentschild auf befahrbaren benannten Orten ist **beabsichtigte UI-Regel, keine Rendererbeschränkung**. „Benannt vs. Flavor“ gehört zur Rätselplatzierung (`placeId`/`places`), nicht zum Asset. Die Assetbefahrbarkeit wird nicht umgeschrieben. Die unveränderte produktive `drawMap`-Logik zeichnet alle Ansichten auf dem echten Meer; keine neue Label-Architektur oder Spielmechanik. [Vergleich, Freigaben und Prüfbelege](PASSABLE-PROTOTYPES-65.md).
