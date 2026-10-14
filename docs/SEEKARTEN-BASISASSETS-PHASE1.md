# Seekarten-Basisassets – überarbeitete Phase 1, Vertrag v2

Stand: 14.10.2026, PR #48, Branch `experiment/parchment-frame`, Issue #49.
Dieser Vertrag ersetzt v1 (`fa5e706`); alte Schablonen bleiben über Git abrufbar.
**Stopp nach Phase 1. Keine Integration endgültiger Bilder, kein Merge.**

## Zentrierung: Befund und Korrektur

Alle 25 vollständigen Hexpolygone stammen unverändert aus `hexCenter` und
`hexVertices` in `src/ui/place-labels.mjs`. Radius 36; Zentren
`x=60+82*q+41*(r%2)`, `y=56+68*r`; Eckwinkel `30°+60°*i`.
Die Polygone sind getrennt durch Wasserabstände: Ihre exakte Flächenvereinigung
ist daher eine Mehrfachfläche, nicht ein einziges gefülltes Polygon.
Der JSON-Vertrag enthält alle 150 Eckpunkte und sämtliche Zentren ausdrücklich.

| Größe | SVG-Einheiten |
|---|---|
| Gesamtausdehnung der Hexe | x 28,823085… bis 460,176915…; y 20 bis 364 |
| Mitte dieser Ausdehnung | **244,5 / 192** |
| Flächenschwerpunkt der 25 gleich großen Hexe | 240,4 / 192 |
| Bisherige ViewBox-Mitte | 237,5 / 192,5 |
| Tatsächlicher Versatz gegenüber ViewBox | **7 nach rechts, 0,5 nach oben** |
| Neue ViewBox | **`-37 -44.5 563 473`** |
| Neuer Abstand Hexausdehnung zu beiden Seiten | 65,823085… |
| Neuer Abstand nach oben/unten | 64,5 |

Wir zentrieren die **äußere Ausdehnung**, nicht den Flächenschwerpunkt. Die drei
unversetzten und zwei versetzten Reihen erzeugen weiterhin eine natürliche
optische Asymmetrie. Auch Bildmotive und unregelmäßiges Papier beeinflussen den
optischen Schwerpunkt; dieser ist ohne finale Grafik nicht messbar festgelegt.

Die ViewBox wandert um `(7;-0,5)` um das vollständig unveränderte Spielsystem.
Es gibt keine CSS-Verschiebung und keine auseinanderlaufende Trefferfläche.
`chart-geometry.mjs` bündelt die daraus abgeleitete Präsentationsgeometrie.
Map-Hintergrund, Rasterrahmen und vorbereiteter finaler Renderer beziehen ihre
Bounds daraus. Inseln, Schiffe, Ortslabels, Ringe, Route, Entfernungszahlen,
Stundenmarkierungen und Trefferpolygone nutzen weiterhin dieselben alten
Hexzentren. Sie benötigen deshalb **keine zusätzliche Transformation**.

Die historischen Bildprofil-Anker werden für aktuelle Beschriftungen abgelöst:
oben y=-12, unten y=396; links x=-2, rechts x=491. Beide Achsenpaare sind
symmetrisch um 244,5/192. Spalten-x bleiben 60/142/224/306/388, Zeilen-y
56/124/192/260/328. Die Spalten laufen bewusst durch die tatsächlichen ersten
und letzten Hexreihen; eine künstliche Verschiebung um 20,5 würde sie vom Raster
lösen. Alte Profile und Nine-Slice bleiben nur als historischer Vergleichscode
vorhanden. Phase 2 wird sie aus der aktiven Darstellung entfernen.

## Nicht rechteckige Schutzhülle

`rowEnvelope` verbindet die Außenkanten der fünf Zeilenhüllen. Zwischen benachbarten
Hexen bleiben die Wasserabstände geschützt; die linken und rechten Einbuchtungen
versetzter Reihen bleiben erhalten. Es ist **keine konvexe Gesamthülle**.
Die Spitzen der vier äußeren Hexe erzeugen abgeschrägte Ecken, insbesondere
oben links und unten rechts. Beispiele `(35;15)` und `(450;360)` liegen außerhalb
der garantierten Transparenz, obwohl sie von der alten Rechteckkonzeption
weitgehend ausgeschlossen wurden.

Drei verschachtelte Flächenvereinigungen sind ausdrücklich getrennt:

| Fläche | Konstruktion | Bedeutung |
|---|---|---|
| Spielschutz | Zeilenhülle mit 8 Einheiten Miter-Offset; Objekt-Rechtecke +1 | Kein dekorativer Eingriff |
| Garantierte Transparenz | Zeilenhülle +10; Objekt-Rechtecke +2 | Rahmen-Alpha exakt 0; Wasser bleibt zwischen Hex und Papier sichtbar |
| Äußere Grenze des Innenkorridors | Zeilenhülle +14; Objekt-Rechtecke +6 | Jenseits davon Papier deckend |
| Innenkantenkorridor | äußere Grenze **minus** garantierte Transparenz | Freie organische Kante, Alpha 0…255 |

Offset bedeutet parallele Außenverschiebung der Kanten mit Schnitt der
Nachbargeraden. Alle resultierenden Punkte sind im JSON enthalten; niemand muss
die Konstruktion nachzeichnen oder abschätzen. Teilflächen werden **vereinigt**,
nicht mit even-odd gegeneinander ausgeschnitten. Die sieben vorhandenen
Objekt-Rechtecke sind bewusst konservativ, einschließlich transparenter Bildränder.
Das bewahrt vorhandene Inseln/Schiffe vollständig ohne Bearbeitung der Bibliothek.

8 Einheiten Spielschutz berücksichtigen die Stundenkreise: Abstand 28, Radius 9,2,
halbe maximale Strichstärke 0,75; sie ragen seitlich 6,773… über die Hexkante.
Tests prüfen alle sechs Markierungen an allen 25 Hexen. Ortsplättchen bleiben
in ihren vorhandenen Land-Clips; Routen, Entfernungszahlen und übrige Markierungen
bleiben SVG oberhalb des Rahmens. CSS-Fokusumrandungen und dekorative
Koordinaten-Hilfslinien dürfen über Papier laufen und werden nicht abgeschnitten.

## Harte, weiche und freie Zonen

Alle 20 Gruppen und ihre Texte werden im Browser mit `getBBox()` gemessen.
`measurements.json` enthält Messungen bei 320/390/768/1440/2560 und DPR 2.
Die konservativen Hüllen schließen Schriften, Pfade, vorhandene Unterlagen und
Strichstärken ein; Browser-Tests prüfen die tatsächlichen Ausdehnungen dagegen.

- **Harte Textsperre (rot):** Spalten relativ zum Anker x±11, y−11…+12;
  Zeilen x±12, y−9…+11. Keine wichtige Illustration, Risse oder Transparenz.
  Ruhiges, helles Papier erhält den Schriftkontrast.
- **Plättchenhülle:** Spalten x±14/y−12…+13, Zeilen x/y±14. Das gesamte
  Plättchen liegt auf deckendem Papier. Dekor kann seinen Rand überlagern,
  solange es außerhalb der harten Textsperre bleibt.
- **Weiche Sicherheit (gelb):** Plättchenhülle plus vier Einheiten auf jeder
  Seite, abzüglich harter Textsperre. Kein pauschales Illustrationsverbot.
- **Freie Illustrationsfläche:** deckende Papierfläche abzüglich harter
  Textsperren. Die vier bevorzugten Eckbereiche sind violett dargestellt.

Die JSON-Illustrationszonen sind exakt definierte Mengendifferenzen:
`candidate minus union(subtractUnion)`. Alle Polygonpunkte sind enthalten.
Das Kandidatenrechteck allein ist **keine** Freigabe: Die abzuziehenden Spiel-,
Kanten- und Textflächen sind zwingend zu beachten. Außerhalb der vier bevorzugten
Ecken definiert `freeIllustration` auch übrige nutzbare Papierflächen.

## Freigegebene Eckmotive

| Ecke | Vorgabe |
|---|---|
| NW | sechstrahlige Hexkompassrose, N/NO/SO/S/SW/NW |
| NE | kleine Insel- und Küstenzeichnungen |
| SW | Papagei am Steuerrad mit Sextant |
| SE | angeschnittener Holztisch, halb ausgekippter Leder-Münzbeutel, Bierhumpen, schlichte gebrauchte Holzflöte |

**Papagei:** Gesicht, Körper und Sextant als zusammenhängende wichtige Silhouette
vollständig in der verbleibenden SW-Zone halten. Nicht automatisch freistellen,
wenn dies einen dieser Bestandteile abschneiden würde. Dann das Motiv grafisch
verschieben/verkleinern, ohne Spielgeometrie zu verändern. Beim Bierhumpen und den
Küstenzeichnungen ist Randüberlagerung weicher Plättchenzonen zulässig.

Die freigegebene illustrierte Rahmenfassung wurde in diesem Auftrag nicht als
Bilddatei bereitgestellt. Daher ist ihre konkrete Passform, insbesondere die
Papageiensilhouette, **noch nicht geprüft**. Die Schablone definiert die technisch
verfügbaren Flächen, behauptet aber keine Abnahme einer nicht vorliegenden Grafik.

## Verbindliche Bilddateien und Freistellung

**Beide Bilder bleiben exakt 2252 × 1892 px (563:473), WebP.**
Vier Bildpixel pro SVG-Einheit; keine neuen Proportionen oder Hochskalierung nötig.

```text
px = (svgX + 37) * 4
py = (svgY + 44.5) * 4
svgX = px / 4 - 37
svgY = py / 4 - 44.5
```

Geometrische Pixelpositionen sind kontinuierlich; Alphaprüfung erfolgt am
Pixelzentrum `(col+0,5; row+0,5)`. Alle Polygone schließen sich implizit.

- `assets/seekarte/sea-blue-01.webp`: RGB oder RGBA mit Alpha überall 255;
  durchgängiges neutrales blau-petrolfarbenes Aquarellmeer, keine Inseln, Objekte,
  Schrift, Raster, Pergament oder eingebauten Schatten.
- `assets/seekarte/frame-parchment-01.webp`: RGBA; garantierte Transparenz exakt 0;
  vorgeschriebenes Papier exakt 255. Zwischenkorridore erlauben alle Alphawerte.
  Außerhalb `outerEdge` (SVG `[-32,-39.5,521,423.5]`) vollständig transparent.
  Außenkante darf bis zur inneren Außenbegrenzung `[-27,-34.5,516,418.5]` variieren.
  Keine Spielinformationen oder Schablonenfarben einbrennen.
- Die technische `frame-mask.svg` wählt die **äußerste zulässige transparente
  Öffnung**. Sie ist eine Referenz, kein starrer Zwang zur gleichen Papierkante.
  Blindes Multiplizieren mit dieser Maske würde den gesamten Korridor entfernen;
  für eine organische Freistellung deshalb `transparent`/`innerEdgeCorridor`/
  `opaque` aus JSON auswerten. Semantische Motivprüfung bleibt erforderlich.
- SVG-Maske enthält denselben JSON-Vertrag als Metadaten. Ihre sichtbare weiße
  Fläche ist `opaque.outer minus union(opaque.subtractUnion)`. Tests vergleichen
  Metadaten und jede verwendete Pfadgeometrie mit dem Vertrag.
- Ein Bild je Ebene; identische Bounds, `preserveAspectRatio="xMidYMid meet"`.
  Meer wird unter dem deckenden Außenband abgeschnitten, Rahmen ist nicht
  interaktiv. SVG-Beschriftung und Bedienung liegen darüber.

Die größte gemessene Karte ist 939,766 CSS-px breit; 2252 px ergeben 2,396
Bildpixel pro CSS-pixel, ausreichend für DPR 2 mit rund 20 % Reserve.

| Viewport CSS-px | Kartenfläche CSS-px, DPR 2 |
|---|---|
| 320 | 294 × 247 |
| 390 | 364 × 305,797 |
| 768 | 734 × 616,656 |
| 1440 | 939,766 × 789,531 |
| 2560 | 939,766 × 789,531 |

Bei 320 CSS-px bleibt die bestehende Zeilenschrift physisch klein (etwa 5,22
CSS-px). Die Geometrieänderung verbessert die Zuordnung und Sicherheit, ersetzt
aber keine gesonderte typografische Mobil-Abnahme.

## Reproduktion und Tests

```sh
npm ci
npx playwright install chromium
node scripts/build-chart-template.mjs
node scripts/measure-chart-template.mjs
npm run test:unit
npm run test:browser
python3 scripts/check-chart-assets.py
```

Der Assetprüfer benötigt Pillow/numpy und liefert derzeit erwartungsgemäß Exit 2
(`pending`): Finale Dateien fehlen. Nach Lieferung prüft er Format, exakte Maße,
Alphawerte in den polygonalen Mengendifferenzen, Außenrand und Plättchenflächen.
Kontrast, Objektfreiheit und Motivbeschädigung bleiben visuelle Prüfpunkte.

46 Unit-Tests und der vollständige lokale Browserlauf bestehen: **121 bestanden,
3 bestehende Skip-Fälle**. Lokal Chromium 134, DPR 2 in den zehn neuen
Viewport-Fällen. Für den Gesamtlauf wurde Nimbus Roman als vorhandener
Times-kompatibler Georgia-Ersatz per lokalem Fontconfig gewählt. Der zunächst
verwendete DejaVu-Serif-Ersatz reproduzierte die vier schon in v1 bekannten
Schriftmetrikfehler; keine Testgrenze und keine Spielschrift wurde geändert.
Die gespeicherten Geometrie-Messbilder verwenden weiterhin den breiteren
DejaVu-Ersatz; auch dessen tatsächliche Text-BBoxes passen in alle neuen harten
Zonen. GitHub Actions läuft mit seiner regulären Fontumgebung; der Status zum
konkreten Commit wird im PR und Issue dokumentiert. Die geometrischen
Tests ersetzen alte Anker/ViewBox-Erwartungen durch die neue verbindliche
Geometrie; sonstige Assertions und Schriftgrößenanforderungen bleiben erhalten.
Alle 25 Trefferpolygone bleiben sichtbar; 22 Wasserfelder sind mit Maus und
Tastatur bedienbar. Die drei bisherigen Landfelder bleiben absichtlich inert:
„alle 25 anklickbar“ darf die ausdrücklich unveränderte Befahrbarkeit nicht ändern.

Aktuelle und technische Ansichten liegen für alle fünf Größen in
`docs/screenshots/seekarte-template/`. Der bisherige Stand ist im Elterncommit
`fa5e706` vergleichbar. Die Farb-Schablone ist `template.png`/`template.svg`.

Keine Änderungen an Engine, Solver, Nachbarschaften, Rätseln, Spielständen,
Inselzuordnungen oder Assetbibliothek #45. `main` bleibt unverändert.
