# Eigenständiger Pergamentrahmen – Architekturprototyp

> Historischer Vergleich. Die verbindliche technische Vorbereitung für #49 steht
> in [SEEKARTEN-BASISASSETS-PHASE1.md](SEEKARTEN-BASISASSETS-PHASE1.md).
> Der schmale Rahmen hier erfüllt die neue Vorgabe „alle Koordinaten auf Pergament“ nicht.

Basis: `main` / `4d9913c68ec53e293ba4a7ace8da5880bb951181`. Ausschließlich Branch
`experiment/parchment-frame`. Neue Gestaltungsentscheidung, kein Regressionsfix
für #40. Die Bibliothekserweiterung aus #45 bleibt separat.

## Entscheidung

Für die feste 5×5-Karte empfehlen wir **ein zusammenhängendes Rasterbild mit
transparentem Innenbereich**, innerhalb desselben SVG-Koordinatensystems.
Der Branch zeigt diese Variante standardmäßig. `?frame=legacy` zeigt den bisherigen
Stand, `?frame=modular` die verbesserte Acht-Segment-Variante; `?frame=raster`
ist die explizite Adresse des Vorschlags. Keine Einstellung wird gespeichert.

| Variante | Ergebnis | Kosten / Risiko |
|---|---|---|
| Bestehendes Nine-Slice | breite, gestreckte Kanten; dunkler Rand | Wasser und Rahmen untrennbar; kleines eingebautes Motiv |
| Neues Rasterbild | schmal, durchgängige Textur, keine Schnittnähte | höhere Auflösung für große Retina-Anzeige erforderlich |
| Neue acht Segmente | im aktuellen Seitenverhältnis optisch nahezu gleich | acht Viewports statt eines Bildes; mögliche Nähte bei anderen Faktoren; kein Vorteil bei fester Geometrie |

Die modulare Vergleichsvariante verwendet denselben neuen transparenten Rahmen,
damit Material und Auflösung den Vergleich nicht verfälschen. Vier Ecken werden
gleichmäßig skaliert, vier Kanten nur in Längsrichtung angepasst; kein Mittelstück.
Quellschnitte: X `0/110/1259/1369`, Y `0/110/1039/1149` Pixel.
Eckenlänge im SVG: `110 × 563 / 1369 = 45,24`. Bei künftig variablen
Kartenformaten wäre diese Lösung erneut sinnvoll zu prüfen.

## Bestandsaufnahme

- `meer-pergament.webp`: **858 × 789 px**, 219.776 Byte, ohne Alpha.
  Enthält Wasser, Pergament und unten links ein kleines fest eingemaltes Motiv.
- Originalbild wird zunächst auf **475 × 385 SVG-Einheiten** abgebildet,
  mit `preserveAspectRatio="none"`: X-Faktor 0,554, Y-Faktor 0,488.
- Nine-Slice-Quellschnitte im virtuellen Bild: X `0/30/445/475`,
  Y `0/30/355/385`; entsprechend X `0/54,19/803,81/858`,
  Y `0/61,48/727,52/789` Originalpixel.
- Zielschnitte: X `-44/36/439/519`, Y `-44/30/355/429`.
  Die 30-Einheiten-Streifen werden auf **80 horizontal bzw. 74 vertikal**
  gedehnt (2,67× / 2,47×). Das Zentrum wird 403 × 325 Einheiten groß.
- Die Randstücke erhalten zusätzlich `mix-blend-mode:multiply` aus
  `materials.css`. Diese Regel greift bei den neuen Ebenen nicht.
  Der bestehende kleine Schatten am gesamten Karten-SVG bleibt unverändert.
- Feste ViewBox **`-44 -44 563 473`**. Hexradius 36, Zentren
  `60 + q×82 + (r%2)×41`, `56 + r×68`, unverändert.
- Responsive CSS setzt 563:473; die gesamte SVG-Karte skaliert gleichmäßig.
  Gemessen: 1440px Viewport → Karte 939,77 × 789,53 CSS-px;
  390px → 364 × 305,80; 320px → 294 × 247. Alle Varianten gleich groß.

## Ebenen und Austauschvertrag

Reihenfolge: neutrale Unterlage → Meer → Insel-/Objektbilder → transparenter
Rahmen → Ortsbeschriftungen → SVG-Koordinaten → Distanzanzeige → Hexflächen,
Markierungen und Route. Dekorative Ebenen sind `pointer-events:none` und
`aria-hidden`. Trefferflächen, Handler, Fokuswerte und Werkzeuglogik bleiben
unverändert. Auch bestehendes Verhalten gesperrter Hexes wird nicht korrigiert.

`src/ui/parchment-frame.mjs` enthält getrennte Referenzen `SEA_ASSET` und
`FRAME_ASSET`. Andere Rahmen dürfen dieselbe ViewBox und transparente sichere
Innenfläche verwenden; Austausch erfordert keine Änderung von Meer oder Rätsel.
Ein Rahmen muss an sämtlichen Hexflächen und Objektgrenzen transparent bleiben.
Koordinaten liegen stets darüber. Die seitlichen Farbmarkierungen erhalten eine
kleine SVG-Pergamentunterlage (Radius 14), da ihre **unveränderten** Positionen
teilweise über Wasser liegen. Farben, Text und Ankerpunkte bleiben erhalten.

Wasser wird unter dem Rand auf `x=-26,y=-26,w=527,h=437` begrenzt, damit es
nicht durch die transparente Außenkante hervortritt. Dieser Ausschnitt ist Teil
des Rahmenvertrags; bei einer anders geschnittenen Variante erneut prüfen.
Der Rasterrahmen nutzt `xMidYMid meet`, Wasser `xMidYMid slice`. Die Motive
verwenden weiterhin ihre bestehenden Zuordnungen, Größen und Versätze.

## Grafikherkunft und Grenzen

Beide neuen Bilder wurden mit dem eingebauten Imagegen-Werkzeug aus der
vorhandenen Seekarte als Referenz erzeugt, anschließend ausschließlich als WebP
kodiert (Qualität 92 für Rahmen, 90 für Meer). Originaldateien unverändert.
Keine manuelle Pixelretusche, keine neuen Inseln oder Landmarken.

| Neue Datei in `assets/seekarte/` | Auflösung | Größe |
|---|---|---|
| `pergament-rahmen-prototyp.webp` | 1369 × 1149, RGBA | 162.308 Byte |
| `meer-ohne-objekte-prototyp.webp` | 1368 × 1150, RGB | 159.550 Byte |

Das Meer ist eine **Neuinterpretation**, keine verlustfreie Zerlegung: das
eingemalte Motiv wurde nicht in eine neue Inseldatei überführt. Die Wassertextur
ist lebhafter als vorher; ihre endgültige gestalterische Freigabe steht aus.
Die vorhandenen Inselbilder wurden nicht geändert. Ihre sichtbaren Wassersäume
sind weiterhin vorhanden und bleiben ein Kompatibilitätsthema für #45.

Der angeforderte Rahmen mit ungefähr 2252 × 1892 px wurde vom Generator nur in
1369 × 1149 geliefert. Auf dem gemessenen Desktop ergeben sich 1,46 Bildpixel
pro CSS-Pixel: gut für normale Displays, **keine volle 2×-Retina-Auflösung**.
Auf 390px Mobilbreite sind es 3,76 Bildpixel pro CSS-Pixel. Keine künstliche
Hochskalierung als Qualitätsbehauptung. Vor Produktion etwa 2252 × 1892 oder
größer neu exportieren/illustrieren und Alpha-/Überdeckungsprüfung wiederholen.
Feinste Alpha-Reste bis 1/255 im freien Innenbereich sind praktisch unsichtbar.
Keine zusätzliche Aussage über exklusive Rechte; bisherige Rechteklärung (#8)
bleibt bestehen. Diese Assets sind ausdrücklich zur Prototypabnahme gedacht.

## Visueller Vergleich

Screenshots mit Chromium 134, DPR 2, identischen Kartenzuständen:

| Breite | Vorher | Rastervorschlag | Modular |
|---|---|---|---|
| 1440 | [alt](screenshots/parchment-frame/legacy-1440.jpg) | [neu](screenshots/parchment-frame/raster-1440.jpg) | [modular](screenshots/parchment-frame/modular-1440.jpg) |
| 390 | [alt](screenshots/parchment-frame/legacy-390.jpg) | [neu](screenshots/parchment-frame/raster-390.jpg) | [modular](screenshots/parchment-frame/modular-390.jpg) |
| 320 | [alt](screenshots/parchment-frame/legacy-320.jpg) | [neu](screenshots/parchment-frame/raster-320.jpg) | [modular](screenshots/parchment-frame/modular-320.jpg) |

Gesamtansichten: [Desktop](screenshots/parchment-frame/page-1440.jpg),
[Mobil](screenshots/parchment-frame/page-390.jpg),
[320px](screenshots/parchment-frame/page-320.jpg).

Visuelle Bewertung: Der neue Rand ist erheblich schmaler, heller und weniger
vergrößert; keine erkennbaren Schnittnähte. Alle 25 Hexfelder, 20 Randmarkierungen
und Ortslabels bleiben sichtbar. Neue Seitenunterlagen verbessern den Kontrast,
wirken allerdings etwas stärker wie separate Plaketten: bewusster Abnahmepunkt.
Auf 320px bleiben die Koordinaten naturgemäß klein; ihre Größe wurde nicht verändert.
Kein Test auf physischem iPhone/Safari; Mobilansichten sind Browseremulationen.

## Prüfen und reproduzieren

```sh
npm ci
npx playwright install chromium
npm run test:unit
npx playwright test tests/browser/parchment-frame.spec.mjs
node scripts/capture-parchment-frame.mjs
python3 -m http.server 8000
```

Dann `http://localhost:8000/?frame=raster`, `?frame=legacy` oder `?frame=modular`.
Die Screenshotdateien werden durch das Skript reproduzierbar aktualisiert.
Optional kann lokal `FRAME_BROWSER_PATH` auf einen vorhandenen Chromium zeigen.

Gezielte Tests vergleichen alle 25 Polygongeometrien, IDs, Rollen, Fokuswerte
und 20 Koordinatenanker mit Legacy, prüfen echte Klicks, Ebenenreihenfolge,
Alpha an den Hexecken, isotrope Bildschirmtransformation, fehlende Ressourcen,
Browserfehler und Beschriftungsgrenzen bei 1440/390/320px.
40 vorhandene Unit-Tests einschließlich Archiv-/Asset-Hashes bestanden;
4 gezielte Browserfälle (Desktop und Mobil) bestanden. Vollständige Browser-
und CI-Ergebnisse werden im PR festgehalten.

Lokaler breiter Browserlauf: nicht vollständig abgeschlossen; daher keine
Behauptung eines grünen Gesamtlaufs. Gezielte Wiederholung ergab vier Fehler
(je zwei Browserprofile) in `chart-ux`/`place-labels` bei den bestehenden
Schriftgrößen-/Labelbedingungen. **Kontrolllauf mit unverändertem main-map.mjs
reproduziert dieselben vier Fehler**. Der Drag-Test bestand bei Wiederholung in
beiden Profilen. Keine Änderung der Beschriftungslogik oder Abschwächung der
bestehenden Tests zur Kaschierung. GitHub CI bleibt gesondertes Prüfgate.

Die vollständigen Eingabeprompts stehen in [PARCHMENT-FRAME-PROMPTS.md](PARCHMENT-FRAME-PROMPTS.md).
