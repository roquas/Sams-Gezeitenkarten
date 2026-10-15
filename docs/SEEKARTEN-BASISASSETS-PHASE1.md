# Seekarten-Basisassets – geometrische Übergabe, Vertrag v3

**Stand:** 15.10.2026 · **Branch:** `experiment/parchment-frame` · [PR #48](https://github.com/roquas/Sams-Gezeitenkarten/pull/48) · [Issue #49](https://github.com/roquas/Sams-Gezeitenkarten/issues/49)

**Phase 1, technische Schablone.** Noch keine finalen Rastergrafiken ins Spiel integriert; kein Merge. Vorgänger-Vertrag v2: Commit `a0eebde2e8cfe074fcb1da059a035c1118caaf6f`. Das v3-Update behebt die konzeptionelle Kopplung an Objekte des Referenzrätsels und entfernt künstliche Eckbereiche. **Die äußere Beige-/Alpha-Breite ist noch nicht abschließend spezifiziert**; der Nutzer liefert sie nach Photoshop-Tests.

## Wesentliche Entscheidungen (15.10.)

1. **Rahmengeometrie ist unabhängig vom Rätsel.** Die bisher sieben `objects`-Rechtecke aus `referencePuzzle.overlays` sind vollständig aus Schablone, Spielschutz, Transparenzregion und `contract.json` entfernt. `src/ui/chart-asset-contract.mjs` importiert nicht mehr `referencePuzzle` oder `chartOverlays`. Ein Leuchtturm, eine Klippe oder ein Schiff darf die generische Pergamentkante nicht formen.
2. **Einzelgrafiken müssen in ihren eigenen Hex-Footprint passen.** Das ist eine Vorgabe für die spätere Grafikbibliothek [#45](https://github.com/roquas/Sams-Gezeitenkarten/issues/45), nicht für die Rahmengeometrie. Ein sehr hoher Leuchtturm darf auch in einer **inneren** Kartenzeile nicht ungewollt in das darüber liegende Hex ragen. Bei explizit mehrfeldrigen Illustrationen zählt die deklarierte zusammenhängende Mehrhex-Fläche. Die aktuelle Rätseldarstellung wird in PR #48 hierfür nicht umgebaut; konkrete Sprite-Abmessungen und Asset-Validierung folgen in #45.
3. **Keine „freien Eckbereiche“.** Vier violette, algorithmische Kandidatenflächen und `illustrationZones` / `freeIllustration` sind vollständig entfernt. Maritime Deko kann künstlerisch innerhalb des ansonsten erlaubten Pergamentbereichs platziert werden. Harte Koordinaten-Schutzflächen gelten weiterhin.
4. **Lesbarer JSON-Vertrag.** `docs/seekarte-template/contract.json` ist jetzt nach **`format`**, **`geometry`**, **`zones`**, **`rendering`** und **`assetPolicy`** gegliedert. Zonen haben explizite `type`- und `purpose`-Felder. Koordinatenpaare stehen auf je einer Zeile, nicht auf vier. Volle Fließkommapräzision bleibt erhalten. Datei entsteht ausschließlich aus `chartContract()`; nicht parallel von Hand pflegen.

## Unveränderte Grundgeometrie

- **Beide Zielgrafiken:** exakt **2252 × 1892 px**, WebP, gemeinsame SVG-ViewBox `-37 -44.5 563 473`, **4 Bildpixel je SVG-Einheit**.
- **Dateinamen:** `assets/seekarte/sea-blue-01.webp` und `assets/seekarte/frame-parchment-01.webp`.
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
| `zones.opaque` | Vorläufiger deckender Pergamentstreifen, abzüglich innerer Kante | **Vorläufiger** Validator; Beschriftungsbereiche müssen deckend bleiben |
| `zones.outerEdge` | Vorläufige äußere Alpha-Führung | **Noch keine endgültige Vorgabe**; siehe unten |
| `zones.headings` | 20 Koordinatenbeschriftungen, harte und weiche Rechtecke | Rot = ruhiges deckendes Papier, Gelb = weicher Sicherheitsabstand |

**Wichtig:** Die farbige Schablone ist eine **technische Hilfe**, kein fertiges Bild. Insbesondere ist **Rot kein Transparenzgebot**, sondern genau das Gegenteil: Hier muss der Koordinatentext gut lesbar auf ruhigem, deckendem Pergament liegen. Die Pflichttransparenz zeigt die **hellblaue** Fläche. Die orange Fläche ist im bisherigen Modell die innere Küsten-Übergangszone, **nicht** der Platz für Insel-Overlays. Die gestrichelte Kontur zeigt den geometrischen Spielschutz.

Die Pflichttransparenz hängt **nur** vom Spielraster ab, nicht von zufällig im Referenzrätsel vorkommenden Leuchttürmen oder Inseln. Dekorationen dürfen keine harten Text-/Plättchenzonen verletzen.

### Koordinaten und Beschriftungszonen

- Fünf Spaltenköpfe oben bei `y=-12`, unten bei `y=396`; fünf Zeilenköpfe links bei `x=-2`, rechts bei `x=491`.
- Die Koordinaten liegen aus den tatsächlichen Hexzentren abgeleitet symmetrisch um die Kartenmitte.
- Jeder Text hat eine harte Zone (`hard`, rot), das vollständige Beschriftungsplättchen liegt in `bounds`, und `safe` erweitert dessen Bounding-Box um vier SVG-Einheiten (gelb).
- Zusätzliche Deko darf außerhalb der harten Zone die weiche Zone teilweise überlagern, jedoch nicht die Lesbarkeit beeinträchtigen. Alle Plättchen selbst müssen auf deckendem Pergament liegen.
- Messungen der SVG-`getBBox()`-Werte liegen in `docs/seekarte-template/measurements.json`.

## Außenrand und Meeresunterlage – bewusst offen

Derzeitige `outerEdge`-, `opaqueOuter`- und `seaClip`-Werte stammen aus dem vorherigen **vorläufigen** technischen Entwurf. **Sie sind noch nicht die endgültige künstlerische Abnahme.**

Künftige Lösung nach den Photoshop-Tests:
- Pergament kann an den äußeren Kanten weich/teiltransparent in den umgebenden beigefarbenen Kartenuntergrund übergehen.
- **Dort darf kein Blau des Meeres durchscheinen.** Eine farblich passende CSS-/HTML-Unterlage liegt darunter; das Meer wird separat innen begrenzt.
- Die endgültige innere organische Küste muss im **zwingend transparenten** Bereich immer Alpha 0 respektieren, darf aber außerhalb davon weiter ins Pergament zurückweichen und zusätzliches Wasser freigeben.
- Die sinnvolle Breite des Beige-Untergrunds und die Clipping-/Korridorwerte werden **erst nach Lieferung der fertig montierten Grafik** festgelegt. Bis dahin alten Validator nicht als endgültige äußere Abnahmeregel missverstehen.

## Dateien

- [`template.svg`](seekarte-template/template.svg) – **aktuelle v3-Schablone**, keine violetten Ecken, keine referenzrätselabhängigen Rechtecke; direkt auch in Photoshop importierbar.
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

`build-chart-template.mjs` erzeugt JSON, SVG-Schablone und SVG-Maske erneut aus demselben v3-Code. `measure-chart-template.mjs` rastert `template.svg` nach `template.png` mit exakt **2252 × 1892 Pixeln** und erstellt Ansichten für 320/390/768/1440/2560 CSS-px, DPR 2.

Unit- und Browsertests prüfen die Polygon- und Textzonen, alte Hexzentren, Masken-Vertrag, Interaktion und gleiche Bildskalierung. Der PNG-Export und die Screenshots müssen nach dem v3-Update noch regeneriert werden; sie sind **keine** künstlerische Freigabe. Der Asset-Validator liefert erwartungsgemäß `pending`, bis echte freigegebene Produktionsbilder vorliegen. Er enthält noch **vorläufige** Außenkantenregeln und ist vor der finalen Abnahme anzupassen.

**Kein Merge und keine Aktivierung der finalen Grafiken ohne ausdrückliche Freigabe.**
