# Seekarten-Basisassets – geometrische Übergabe, Vertrag v4

**Stand:** 15.10.2026 · **Branch:** `experiment/parchment-frame` · [PR #48](https://github.com/roquas/Sams-Gezeitenkarten/pull/48) · [Issue #49](https://github.com/roquas/Sams-Gezeitenkarten/issues/49)

**Phase 1, technische Schablone.** Noch keine finalen Rastergrafiken ins Spiel integriert; kein Merge. Vorgänger-Vertrag v2: Commit `a0eebde2e8cfe074fcb1da059a035c1118caaf6f`. Das v3-Update behebt die konzeptionelle Kopplung an Objekte des Referenzrätsels und entfernt künstliche Eckbereiche. **Verbindliche Nutzerentscheidung vom 16.10.2026:** Kein äußerer Alpha-Übergang. Alle vier Bildkanten des Rahmens bleiben vollständig opak. Zwei Rahmenvarianten sind vorgesehen (reich illustriert und ruhig).

## Wesentliche Entscheidungen (15.10.)

1. **Rahmengeometrie ist unabhängig vom Rätsel.** Die bisher sieben `objects`-Rechtecke aus `referencePuzzle.overlays` sind vollständig aus Schablone, Spielschutz, Transparenzregion und `contract.json` entfernt. `src/ui/chart-asset-contract.mjs` importiert nicht mehr `referencePuzzle` oder `chartOverlays`. Ein Leuchtturm, eine Klippe oder ein Schiff darf die generische Pergamentkante nicht formen.
2. **Einzelgrafiken müssen in ihren eigenen Hex-Footprint passen.** Das ist eine Vorgabe für die spätere Grafikbibliothek [#45](https://github.com/roquas/Sams-Gezeitenkarten/issues/45), nicht für die Rahmengeometrie. Ein sehr hoher Leuchtturm darf auch in einer **inneren** Kartenzeile nicht ungewollt in das darüber liegende Hex ragen. Bei explizit mehrfeldrigen Illustrationen zählt die deklarierte zusammenhängende Mehrhex-Fläche. Die aktuelle Rätseldarstellung wird in PR #48 hierfür nicht umgebaut; konkrete Sprite-Abmessungen und Asset-Validierung folgen in #45.
3. **Keine „freien Eckbereiche“.** Vier violette, algorithmische Kandidatenflächen und `illustrationZones` / `freeIllustration` sind vollständig entfernt. Maritime Deko kann künstlerisch innerhalb des ansonsten erlaubten Pergamentbereichs platziert werden. Harte Koordinaten-Schutzflächen gelten weiterhin.
4. **Lesbarer JSON-Vertrag.** `docs/seekarte-template/contract.json` ist jetzt nach **`format`**, **`geometry`**, **`zones`**, **`rendering`** und **`assetPolicy`** gegliedert. Zonen haben explizite `type`- und `purpose`-Felder. Koordinatenpaare stehen auf je einer Zeile, nicht auf vier. Volle Fließkommapräzision bleibt erhalten. Datei entsteht ausschließlich aus `chartContract()`; nicht parallel von Hand pflegen.

## Unveränderte Grundgeometrie

- **Alle drei Zielgrafiken:** exakt **2252 × 1892 px**, WebP, gemeinsame SVG-ViewBox `-37 -44.5 563 473`, **4 Bildpixel je SVG-Einheit**.
- **Dateinamen:** `assets/seekarte/sea-blue-01.webp` (vollständig deckendes, objektfreies Meer), `assets/seekarte/frame-parchment-01.webp` (**ruhiger Rahmen ohne Illustration**) und `assets/seekarte/frame-parchment-02.webp` (**illustrierter Rahmen, vorgesehen als späterer Default**).
- **Kartenmitte:** `(244,5; 192)`; über die *äußere* Hexausdehnung `[28,823085…; 20; 460,176915…; 364]` gemessen. Die zuvor vorhandene Verschiebung gegenüber der alten ViewBox betrug 7 Einheiten nach rechts und 0,5 nach oben. **Keine Hexzentren, Kanten oder Trefferflächen verschoben.**
- Hexradius 36; `x=60+82*q+41*(r%2)`, `y=56+68*r`, Punkte bei Winkeln `30°+60°*i`. 25 Felder, insgesamt 150 Ecken.
- Zeilenhülle `rowEnvelope` ist **nicht konvex**: Wechselnde linke/rechte Einbuchtungen und diagonale Enden bleiben erhalten; Wasserabstände zwischen den Hexen bleiben im Spielschutz enthalten.
- Die Präsentationsgeometrie liegt in `src/ui/chart-geometry.mjs`. Die eigentliche Engine, Rätsellogik, Nachbarschaften, markierbaren Hexfelder und Markierungen werden nicht verändert.

### Spiel-/Alpha-Zonen im Vertrag

| JSON-Pfad | Bedeutung | Vorgabe |
|---|---|---|
| `zones.gameplay` | Nicht konvexe Zeilenhülle + 8 SVG-Einheiten | Spiel-/Stundenmarkierungen nicht verdecken |
| `zones.transparent` | Zeilenhülle + 10 | **Alpha des Rahmens 0** |
| `zones.innerEdge` | Differenz (Zeilenhülle + 14) minus (Zeilenhülle + 10) | **Bisheriger technischer Korridor**, wird nach künstlerischer Lieferung geprüft |
| `zones.opaque` | Bisheriger deckender Pergamentstreifen, abzüglich innerer Kante | **Nur noch grafische Orientierung**, keine harte Abnahmebedingung; größere organische Buchten bleiben zulässig |
| `zones.outerEdge` | Alle vier äußersten Pixelreihen/-spalten | **Alpha 255 verbindlich**; kein äußerer Transparenzverlauf |
| `zones.headings` | 20 Koordinatenbeschriftungen, harte und weiche Rechtecke | Rot = ruhiges deckendes Papier, Gelb = weicher Sicherheitsabstand |

**Wichtig:** Die farbige Schablone ist eine **technische Hilfe**, kein fertiges Bild. Insbesondere ist **Rot kein Transparenzgebot**, sondern genau das Gegenteil: Hier muss der Koordinatentext gut lesbar auf ruhigem, deckendem Pergament liegen. Die Pflichttransparenz zeigt die **hellblaue** Fläche. Die orange Fläche ist im bisherigen Modell die innere Küsten-Übergangszone, **nicht** der Platz für Insel-Overlays. Die gestrichelte Kontur zeigt den geometrischen Spielschutz.

Die Pflichttransparenz hängt **nur** vom Spielraster ab, nicht von zufällig im Referenzrätsel vorkommenden Leuchttürmen oder Inseln. Dekorationen dürfen keine harten Text-/Plättchenzonen verletzen.

### Koordinaten und Beschriftungszonen

- Fünf Spaltenköpfe oben bei `y=-12`, unten bei `y=396`; fünf Zeilenköpfe links bei `x=-2`, rechts bei `x=491`.
- Die Koordinaten liegen aus den tatsächlichen Hexzentren abgeleitet symmetrisch um die Kartenmitte.
- Jeder Text hat eine harte Zone (`hard`, rot), das vollständige Beschriftungsplättchen liegt in `bounds`, und `safe` erweitert dessen Bounding-Box um vier SVG-Einheiten (gelb).
- Zusätzliche Deko darf außerhalb der harten Zone die weiche Zone teilweise überlagern, jedoch nicht die Lesbarkeit beeinträchtigen. Alle Plättchen selbst müssen auf deckendem Pergament liegen.
- Messungen der SVG-`getBBox()`-Werte liegen in `docs/seekarte-template/measurements.json`.

## Äußerer Bildrand und Meeresunterlage – entschieden am 16.10.2026

Beide Rahmenvarianten bleiben **bis einschließlich aller vier äußeren Pixelkanten vollständig opak (Alpha 255)**. Kein äußerer Alpha-Übergang, keine Sonderfläche in CSS mit angeglichenem Beige. Der Rahmen selbst verdeckt das Meer an den äußeren Bildrändern.

Die bisherige `outerEdge`-Transparenzregel des v3-Vertrags war daher falsch und wurde in **v4** ersetzt. Der Prüfer kontrolliert jetzt den opaken äußeren Pixelrand bei beiden Rahmenvarianten. Die bisherige feste Papierzone außerhalb des schmalen orangefarbenen inneren Korridors ist dagegen **keine harte Alpha-Grenze mehr**: Die Küste darf organisch ins Papier zurückweichen und weiteres Meer freigeben. Dies muss vor Integration mit dem tatsächlichen `seaClip` und mit dem Bild an der gesamten inneren Küste abgeglichen werden.

Die zwingend transparente Innenfläche (`zones.transparent`) sowie die 20 deckend zu haltenden Beschriftungsplättchen sind **weiterhin harte technische Vorgaben**. Über die künstlerische Qualität entscheidet die visuelle Freigabe, nicht allein der Prüfer.

Für beide fertigen Rahmenbilder gelten exakt **2252 × 1892 Pixel**, WebP mit Alphakanal und identische Spielgeometrie. Die ruhige Rahmenvariante darf ausschließlich gestalterisch anders sein; Spiel- und Beschriftungszonen müssen deckungsgleich sicher bleiben. Die Umschalt-Funktion ist **nicht Gegenstand der bloßen Bereitstellung der Bilddateien**.

## Alpha-Normalisierung nach der Photoshop-Korrektur

Die neuen Bilddaten zeigen die gleiche Grundmaske in zwei Varianten. Beim ersten Check betrafen kleine WebP-/Layer-Artefakte nur **23 Alpha-Restpixel (1–24)** im zwingend transparenten Meerbereich pro Rahmen sowie **ca. 4.300–4.500 äußere Randpixel (238–254)**. Unter mehreren Koordinatenplättchen liegt dagegen **erhebliche Transparenz bis Alpha 0**: Das ist kein Artefakt, sondern in Photoshop durch Verschieben/Verzerren/Reparieren zu korrigieren.

**Nach** dieser manuellen Korrektur kann `scripts/normalize-chart-alpha.py` die restlichen Exportartefakte gezielt normalisieren. Es greift ausschließlich auf die harten Pflichtzonen aus `contract.json` zu:
- Nur Alpha **1–24** in der zwingend transparenten Öffnung wird **0**.
- Nur Alpha **238–254** entlang des äußersten Bildrandes wird **255**.
- In Beschriftungsplättchen dürfen nur Alpha **238–254** zu **255** werden. Wenn dort echte Transparenz (Alpha unter 238) bleibt, **bricht das Skript ab**, anstatt fehlendes Papier zu erfinden.
- Alle anderen Pixel und die gezeichnete Küstenlinie bleiben unverändert. Es wird lossless WebP exportiert, damit das sichtbare RGB-Bild keine weitere verlustbehaftete Kodierung erhält. Die Ausgabedatei kann dadurch größer werden.
- Es gibt keinen stillen Push: Der Script-Aufruf ist zunächst eine Vorschau und überschreibt erst mit `--apply`, **nachdem beide Varianten überprüft wurden**. Die beiden Quelldateien können bei Bedarf vorab über Git gesichert werden.

```sh
# Falls Pillow und NumPy noch nicht installiert sind, in einer virtuellen Umgebung:
python3 -m venv .venv
.venv/bin/python -m pip install Pillow numpy

# Zuerst nur Bericht, ohne Dateiänderungen:
.venv/bin/python scripts/normalize-chart-alpha.py

# Nach erfolgreich gemeldeter Prüfung beide Rahmen gezielt korrigieren:
.venv/bin/python scripts/normalize-chart-alpha.py --apply

# Anschließend strikte Abnahme und eigener Commit:
.venv/bin/python scripts/check-chart-assets.py
git diff --stat
```

Hinweis: `git diff --stat` zeigt bei binären WebP-Dateien nicht die tatsächlich veränderten Pixel. Deshalb prüft der Normalizer seine neue Ausgabe selbst wieder auf identische Alpha- und sichtbare Farbwerte.

**Vorschau-Modi:** `?frame=quiet` = Rahmen **01** ohne Illustrationen; `?frame=final` = Rahmen **02** mit Illustrationen. Der normale Spiel-Default bleibt zunächst beim Prototyp, bis die neuen Bilder visuell freigegeben und abschließend integriert sind. Ein späterer zusätzlicher UI-Umschalter ist nicht Teil der jetzigen technischen Reparatur.

## Dateien

- [`template.svg`](seekarte-template/template.svg) – **aktuelle v4-Schablone**, keine violetten Ecken, keine referenzrätselabhängigen Rechtecke; direkt auch in Photoshop importierbar.
- [`contract.json`](seekarte-template/contract.json) – autoritativer, gruppierter v3-Geometrievertrag.
- [`frame-mask.svg`](seekarte-template/frame-mask.svg) – technische Alpha-Referenz für die vorläufige Pergamentgeometrie.
- `template.png` (alte v2-Rasterisierung) wurde bewusst **aus dem Branch entfernt**, damit niemand die falsche Schablone verwendet. `template.svg` ist die verbindliche Vorlage; mit `node scripts/measure-chart-template.mjs` lässt sich daraus wieder eine korrekte PNG in 2252 × 1892 px erzeugen.
- [`measurements.json`](seekarte-template/measurements.json) – ältere Browsermessungen für unveränderte Koordinaten und Viewports; keine gültige v3-Bildfreigabe.
- [KI-Herstellungsworkflow](SEEKARTEN-RAHMEN-BILD-KI-WORKFLOW.md) – freigegebene gestalterische Referenz und Prompt-Lehren.

## Tests und Reproduktion

```sh
npm ci
npx playwright install chromium
node scripts/build-chart-template.mjs
node scripts/measure-chart-template.mjs
npm run test:all
python3 scripts/check-chart-assets.py
```

`build-chart-template.mjs` erzeugt JSON, SVG-Schablone und SVG-Maske erneut aus demselben v4-Code. `measure-chart-template.mjs` rastert `template.svg` nach `template.png` mit exakt **2252 × 1892 Pixeln** und erstellt Ansichten für 320/390/768/1440/2560 CSS-px, DPR 2.

Unit- und Browsertests prüfen die Polygon- und Textzonen, alte Hexzentren, Masken-Vertrag, Interaktion und gleiche Bildskalierung. Der PNG-Export und die Screenshots müssen nach dem v3-Update noch regeneriert werden; sie sind **keine** künstlerische Freigabe. Der Asset-Validator liefert erwartungsgemäß `pending`, bis echte freigegebene Produktionsbilder vorliegen. Der äußere Alphatest wurde an den opaken Bildrand angepasst; andere tatsächliche Bild-/Meerpassungen müssen nach Lieferung geprüft werden.

**Kein Merge und keine Aktivierung der finalen Grafiken ohne ausdrückliche Freigabe.**
