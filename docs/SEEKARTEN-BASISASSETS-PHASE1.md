# Issue #49 / PR #48 – verbindliche technische Grafikschablone

**Phase 1 abgeschlossen; Phase 2 wartet auf die gelieferten und visuell freigegebenen Bilder.**
Ausgangsstand: PR #48, Commit `935a346b278a6612260a2d6b2b6543d94ecc5cd9`.
Die Dateien `sea-blue-01.webp` und `frame-parchment-01.webp` sind nicht vorhanden.
Die bisherigen Prototypen sind **keine freigegebenen Ersatzdateien**.
Kein neues KI-Bild, keine Änderung der Spielansicht, Rätseldaten, Engine oder #45-Bibliothek.

Diese Spezifikation ersetzt für die endgültigen Assets die Empfehlung des ersten
Prototyps, Koordinaten mit SVG-Unterlagen über Wasser zu tragen. Alle Überschriften
müssen auf dem tatsächlichen Rahmen liegen. Die Unterlagen werden bei der
Vermessung konservativ mitgerechnet und ersetzen niemals das Pergament.

## Verbindliche Lieferung

| Eigenschaft | Beide Dateien |
|---|---|
| Pfad | `assets/seekarte/sea-blue-01.webp` / `assets/seekarte/frame-parchment-01.webp` |
| Abmessungen | **2252 × 1892 Pixel**, exakt; 4 Bildpixel je SVG-Einheit |
| Seitenverhältnis | **563:473**, keine Streckung, keine Randzugaben außerhalb dieses Formats |
| SVG-Zuordnung | **`viewBox="-44 -44 563 473"`**, Bild x=-44, y=-44, width=563, height=473 |
| Pixelumrechnung | **px = (SVG-x + 44) × 4; py = (SVG-y + 44) × 4** |
| Format | echtes WebP, sRGB; Rahmen RGBA mit verlustfrei erhaltener Alphaebene |
| Einbindung | jeweils ein `<image preserveAspectRatio="xMidYMid meet">`; keine Slices |
| Meer | gesamte Datei deckend; durchgängiges blau-petrolfarbenes Aquarellwasser |
| Rahmen | echte Transparenz innen und an der äußeren Schnittkante; keine Spielinformationen |

Das Meer enthält keine Inseln, Felsen, Schiffe, Landmarken, Schrift, Hexlinien,
Pergament oder Schatten. Der Rahmen enthält keine Koordinaten, Symbole mit
Spielbedeutung oder eingebackene Beschriftung. Die ruhigen Beschriftungszonen
bleiben hell; Risse, dunkle Flecken, Schlagschatten und Illustrationen sind dort
verboten. Natürlich unregelmäßige Kanten entstehen **innerhalb der unten
festgelegten Übergangskorridore**, nicht durch Vergrößern kleiner Randfragmente.

## Schablonen und ihre Verwendung

- [template.svg](seekarte-template/template.svg): maßhaltige Farb-/Geometrieschablone.
- [template.png](seekarte-template/template.png): dieselbe Schablone, 2252 × 1892 px.
- [frame-mask.svg](seekarte-template/frame-mask.svg): **technische Alpha-Referenz**,
  weiß = Rahmen, transparent = Öffnung/Außenbereich. Keine fertige Illustration.
- [contract.json](seekarte-template/contract.json): alle Maße, 20 Anker und
  individuelle Sicherheitsrechtecke, auch in Pixelkoordinaten.
- [measurements.json](seekarte-template/measurements.json): tatsächliche Browser-
  Bounding-Boxes von Schrift und Beschriftungshintergründen bei allen fünf Breiten.

**Farblegende:** Beige = zwingend deckendes Pergament; Blau = zwingend transparent;
Orange = zulässiger Verlauf der inneren Schnittkante; Grün = Beschriftungen samt
Sicherheitsabstand; violette Rechtecke = maximal erlaubte Eckillustrationen.
Rote Punkte sind die unveränderten Beschriftungsanker. Die Hexlinien sind nur
technische Referenz und dürfen nicht in eine der endgültigen Dateien übernommen werden.
Schablone als separate Führungsebene verwenden, vor dem Export ausblenden.
Die Alpha-Referenz darf als Maske dienen; die farbige Schablone nicht mit exportieren.

## Festgelegte Zonen

Alle Rechtecke sind `links / oben / rechts / unten`, keine Breite/Höhe.

| Bereich | SVG-Einheiten | Pixel der gelieferten Datei |
|---|---|---|
| Äußeres garantiert deckendes Rechteck | -30 / -32 / 512 / 425 | 56 / 48 / 2224 / 1876 |
| Davon ausgenommene innere Öffnung | 23 / 8 / 467 / 381 | 268 / 208 / 2044 / 1700 |
| Garantiert transparente Kartenöffnung | **26 / 10 / 465 / 378** | **280 / 216 / 2036 / 1688** |

**Deckend ist der Ring** aus äußerem Rechteck minus innerer Öffnung (Alpha 255).
Die garantierte Kartenöffnung ist vollständig transparent (Alpha **0**, keine
Restdeckkraft, auch nicht 1/255). Der schmale Zwischenring ist der einzige Bereich,
in dem die innere Kante einschließlich Antialiasing verlaufen darf:

| Innere Kante | Zulässiger SVG-Korridor | Pixel-Korridor |
|---|---|---|
| Links | x=23…26 | x=268…280 |
| Rechts | x=465…467 | x=2036…2044 |
| Oben | y=8…10 | y=208…216 |
| Unten | y=378…381 | y=1688…1700 |

Diese asymmetrische Öffnung ist beabsichtigt: Anker und versetzte Hexreihen sind
bereits asymmetrisch. Nicht symmetrisieren! Auch die Eckrundungen der inneren
Öffnung dürfen nicht in das garantiert transparente Rechteck hineinragen.
Die gesamte äußerste Pixelreihe/-spalte bleibt transparent. Die äußere Papierkante
darf außerhalb des garantierten äußeren Rechtecks natürlich auslaufen; innerhalb
dieses Rechtecks dürfen keine äußeren Einrisse die deckenden Bänder durchbrechen.

Die **garantiert nutzbaren durchgehenden Bandbreiten** sind links 53, rechts 45,
oben 40 und unten 44 SVG-Einheiten (212 / 180 / 160 / 176 Bildpixel). Damit wird
nicht einfach ein dünner Zierrahmen angefordert: Die Beschriftungsfläche bestimmt
die Mindestbreite. Die bisherige ViewBox reicht aus; **keine Erweiterung nötig**.

## Ableitung aus der vorhandenen SVG-Geometrie

`chart-art.mjs` bestimmt derzeit die Anker aus `PARCHMENT_PROFILES` und der alten
Nine-Slice-Projektion. Diese Anker werden unverändert übernommen. Die Schablone
friert ihre aktuellen Werte in `contract.json` ein; beim späteren Entfernen der
alten Projektionsfunktionen dürfen die Anker nicht neu aus einem anderen Randbild
abgeleitet werden.

Gemessen wurde `getBBox()` der gesamten Überschrift und separat ihres Textes,
nach `document.fonts.ready`, bei DPR 2. SVG-`getBBox()` enthält standardmäßig
keine Strichstärke. Deshalb verwendet der Vertrag größere feste Hüllrechtecke:
Spalten **x ±14, y -12…+13** (Plättchenpfad ±13, Strich 0,7; zusätzlich Reserve
für Schriftmetriken), Zeilen **x/y ±14** (einschließlich der bestehenden
Pergamentkreise; Tintenklecks samt Strich liegt darin). Hinzu kommen **4 SVG-
Einheiten Sicherheit auf jeder Seite**. Fontabweichungen werden im Browser gegen
diese Hülle geprüft, nicht durch Verschieben der Beschriftung kompensiert.

| Seite | Gemessene gesamte BBox (l/t/r/b, gerundet) | Vereinigung der konservativen Hüllen inklusive 4 Einheiten Sicherheit |
|---|---|---|
| Oben | 47 / -24,31 / 401 / 1,65 | 42 / -29,31 / 406 / 7,91 |
| Unten | 47 / 386,10 / 401 / 416,27 | 42 / 381,10 / 406 / 422,53 |
| Links | -18,14 / 42 / 18,72 / 342 | -22,14 / 38 / 22,72 / 346 |
| Rechts | 471,05 / 42 / 504,21 / 342 | 467,05 / 38 / 508,21 / 346 |

Die vier Sicherheitsbereiche liegen vollständig im deckenden Ring. Besonders
rechts begrenzen die festen Anker den zulässigen Kantenverlauf: weniger als die
vorgesehene Beschriftungsfläche ist nicht zulässig. Die innere Kante bekommt ihren
eigenen Korridor; sie darf die Sicherheitsflächen nicht für Risse ausnutzen.

Die 25 Hexe haben Radius 36 und Zentren `60 + q×82 + (r%2)×41`, `56 + r×68`.
Gesamte Polygonhülle: x=28,823…460,177, y=20…364. Sie liegt vollständig in der
transparenten Öffnung. Bestehende Motive bleiben unverändert. Die PNG-Bildrechtecke
reichen teilweise über die sichtbare Illustration hinaus; beispielsweise die
Nordostinsel bis x=467. Ihre tatsächliche Alphaausdehnung endet bei ungefähr
x=464,40, innerhalb der transparenten Öffnung bis x=465. Der Leuchtturm beginnt
sichtbar bei ungefähr y=12,83, hinter der oberen freien Grenze y=10. In Phase 2
sind die tatsächlichen Bilder samt Wassersäumen erneut visuell zu prüfen.

### Eckillustrationen

Nur innerhalb dieser Rechtecke; keine weiteren Ausläufer oder Schatten außerhalb:

| Ecke | SVG-Rechteck l/t/r/b | Pixel-Rechteck l/t/r/b |
|---|---|---|
| Links oben | -26 / -28 / 36 / 1 | 72 / 64 / 320 / 180 |
| Rechts oben | 412 / -28 / 508 / 1 | 1824 / 64 / 2208 / 180 |
| Links unten | -26 / 387 / 36 / 421 | 72 / 1724 / 320 / 1860 |
| Rechts unten | 412 / 387 / 508 / 421 | 1824 / 1724 / 2208 / 1860 |

Keine Illustration ist erforderlich. Wenige feine Sepiastriche sind geeigneter
als große dekorative Motive. Die vier Zonen schneiden keine Koordinaten-Sicherheitsfläche.

## Responsive Auflösung und Lesbarkeit

| Viewport CSS-px | Tatsächliche Kartenfläche CSS-px | Breite in Gerätepx bei DPR 2 |
|---|---|---|
| 320 | 294 × 247 | 588 |
| 390 | 364 × 305,80 | 728 |
| 768 | 734 × 616,66 | 1468 |
| 1440 | 939,77 × 789,53 | 1879,53 |
| 2560 | 939,77 × 789,53 | 1879,53 |

Die vorhandene Layout-Maximalbreite begrenzt die Karte auch bei 2560px. 2252px
liefern bei der größten gemessenen Darstellung **2,396 Bildpixel pro CSS-Pixel**,
also etwa 20% Reserve über DPR 2. Größere künftige Kartenlayouts über 1126 CSS-px
benötigen neue Assets bzw. eine höhere gemeinsame Auflösungsstufe.

Auf 320px sind die unveränderten 17er-Spaltenzeichen nominell etwa 8,88 CSS-px,
die 10er-Zeilenzeichen etwa 5,22 CSS-px groß. Hohe Rasterauflösung verbessert die
Schriftgröße nicht: Die Schrift bleibt SVG. Vollständige Unterbringung und klare
Kontrastfläche sind technisch belegt; **komfortable Lesbarkeit auf einem echten
kleinen Display bleibt ein visueller Abnahmepunkt**. Keine Schriftvergrößerung,
Ankerverschiebung oder Zoom-Bedienung wurde nebenbei eingeführt.

## Vorbereitete Integration, noch nicht aktiviert

`src/ui/chart-asset-contract.mjs` enthält den Vertrag und `createChartBaseLayers`:
getrennte Meer-/Rahmengruppen, jeweils genau ein Rasterbild mit denselben
Abmessungen und `xMidYMid meet`. Beide Gruppen sind nicht interaktiv und für
Screenreader dekorativ. Meer wird lediglich unter der äußeren sicheren
Pergamentfläche rechteckig beschnitten; weder gestreckt noch gekachelt. So reicht
es bis zur gesamten inneren Kante, ohne außerhalb des Papiers sichtbar zu werden.

Vorgesehene Reihenfolge: neutrale Unterlage → Meer → Insel-/Objektbilder → Rahmen
→ Ortslabels → Koordinaten/Geometrie/Distanz/Markierungen/Route. Ein späterer
Rahmentausch muss denselben Vertrag erfüllen. Keine Datenmigration notwendig.

**Die Spielansicht nutzt bis zur Lieferung weiterhin den bisherigen PR-Prototyp.**
`?frame=legacy`/`?frame=modular` sind historische Vergleiche, keine final zulässigen
Renderer. Der neue Renderer ist nur in der technischen Testfixture eingebunden.
In Phase 2 werden die aktiven Vergleichswege und die Slice-Einbindung entfernt,
die festen Koordinatenanker erhalten und die freigegebenen Dateien aktiviert.
Kein stiller Fallback auf den Prototyp unter den endgültigen Dateinamen.

## Automatische und visuelle Prüfung

```sh
node scripts/build-chart-template.mjs
node scripts/measure-chart-template.mjs
npm run test:unit
npx playwright test tests/browser/chart-template.spec.mjs
python3 scripts/check-chart-assets.py
```

Für Browserbefehle zuerst `npm ci` und `npx playwright install chromium`.
Der rein lesende Bildprüfer braucht Pillow und numpy (`python3 -m pip install pillow numpy`).
Er prüft echtes Dateiformat, exakte Abmessungen, Meer-Deckkraft, vorhandenes
Rahmenalpha, **alle Pixel** der freien Öffnung, der deckenden Papierbänder und
aller 20 Sicherheitsrechtecke sowie die transparenten äußersten Pixel.
Luminanz-Min/Max je Sicherheitszone wird für die visuelle Kontrastprüfung ausgegeben.
Status/Exitcodes: `pending`/2 bei fehlenden Dateien, `failed`/1 bei Verletzungen,
`passed`/0 bei technischer Passform. Kein `passed` ersetzt eine visuelle Freigabe.
Objektfreiheit, ruhige Textur, Risse und Eckillustrationen sind zusätzlich visuell
zu beurteilen; Alpha allein kann dunkle Bildinhalte nicht als störend erkennen.

Die neuen Browserprüfungen verwenden **eine technische weiße SVG-Maske und eine
flache Testwasserfläche**, keine finalen Grafiken. Sie belegen für alle fünf Breiten
und DPR 2: 20 vollständige BBoxes auf deckender Fläche einschließlich Sicherheit,
25 unveränderte Hexelemente, unveränderte Anker, Ebenen, nicht abgefangene Klicks,
Enter-Bedienung, isotrope Skalierung, keine Überläufe/Bildlade-/Browserfehler.
44 Unit-Tests und 10 gezielte Browserfälle lokal bestanden. Alte Tests bleiben
unverändert; vollständige Browser- und GitHub-Actions-Ergebnisse stehen im PR.

### Vergleichsbilder – ausdrücklich keine Grafikabnahme

| Breite | Bisheriger, geometrisch nicht geeigneter Prototyp | Technische Passformmaske |
|---|---|---|
| 320 | [aktuell](screenshots/seekarte-template/current-320.jpg) | [Schablone](screenshots/seekarte-template/template-320.jpg) |
| 390 | [aktuell](screenshots/seekarte-template/current-390.jpg) | [Schablone](screenshots/seekarte-template/template-390.jpg) |
| 768 | [aktuell](screenshots/seekarte-template/current-768.jpg) | [Schablone](screenshots/seekarte-template/template-768.jpg) |
| 1440 | [aktuell](screenshots/seekarte-template/current-1440.jpg) | [Schablone](screenshots/seekarte-template/template-1440.jpg) |
| 2560 | [aktuell](screenshots/seekarte-template/current-2560.jpg) | [Schablone](screenshots/seekarte-template/template-2560.jpg) |

Chromium 134, DPR 2. Keine Behauptung einer Prüfung auf physischem iPhone/Safari.

## Übergabe an die Grafikerstellung

Zwei getrennte WebP-Dateien **2252×1892** anhand der Schablone erstellen. Die
Führungsebenen nicht mit exportieren. Die hellen Beschriftungsflächen haben Vorrang
vor einer besonders schmalen Kante. Die fixen Anker dürfen nicht durch andere
Randproportionen kompensiert werden. Keine eingebauten Spielinformationen.
Danach Dateien visuell freigeben und im Branch bereitstellen. **Erst dann Phase 2.**
Bei technischem Scheitern: Fehlerbericht an die Grafikerstellung zurückgeben;
keine eigenmächtige Neubebilderung, kein Verzerren oder Beschneiden zum Kaschieren.

Lokaler vollständiger Browserlauf: **117 bestanden, 3 übersprungen, 4 Fehler**.
Die vier Fehler betreffen die bereits am unveränderten main reproduzierten
Schriftmetrikbedingungen in `chart-ux` und `place-labels` (je zwei Profile), nicht
die neuen Schablonentests. Die aktive Darstellung wurde in Phase 1 nicht verändert.
Der Bildprüfer wurde zusätzlich mit synthetischen Testdaten kontrolliert:
passende Alpha-/Formatdaten bestanden; ein einzelner Innenpixel mit Alpha 1 wurde
korrekt abgelehnt. Diese Testdaten wurden nicht als Grafikassets gespeichert.
