# A3: K-final in der Karten-UI

## Referenz und Ausgangsstand

Implementierungsbasis: `602c597a4fc434d018afceb21c8029cfd5eefbae` (aktuelles `main` beim Arbeitsbeginn).
Historischer Vergleich: `cb559f31ec7a0bf739688ce6c128d18ee61c3477`.

Die vom Nutzer separat hochgeladene **A3-Routenvergleich.html** ist die vollständige
Referenz aus Iteration 4, mit dem eingebetteten Stand „14. November 2026“.
SHA-256: `fd4ae18d8650e5ec73a1098b533958f31da1ee4ca9c6ed8ef6954d2f4b1dca7a`.
Die ursprünglichen Mac-Pfade waren hier nicht verfügbar; das Gesamt-ZIP überschritt
das Transferlimit. Die HTML-Datei allein enthält alle elf Bilder, die drei
Szenen, SVG-Geometrien und den ausführbaren Vergleichsrenderer. Im Browser mit
blockierten HTTP-/HTTPS-Anfragen geprüft: **keine externen Anfragen, keine
JavaScript-Fehler**. Die alten Hinweise zur offenen Freigabe und zur isolierten
Vorschau im HTML beschreiben den damaligen Studienstand; maßgeblich für die
Implementierung ist der aktuelle Nutzerauftrag.

Gegenüber `cb559f3` besitzt der aktuelle Kartenrenderer bereits die korrekte
Radarentfernung zur vollständigen Ortsfläche. Diese aktuelle Architektur und
Semantik bleiben erhalten; der historische Renderer wurde nicht zurückgesetzt.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `src/ui/route-ink.mjs` | Getrennte Funktionen für Band, Keile und Vektorzahlen; reine Geometriefunktionen |
| `src/ui/map.mjs` | Integration und lokale Trennung von Hexoberflächen und interaktiven Spielinformationen |
| `tests/integration/route-ink.test.mjs` | Exakter Pfadvergleich mit der Originalstudie, Fahrtrichtung und Zielhexposition |
| `tests/fixtures/ui/k-final-reference.json` | Direkt aus dem Originalrenderer berechnete Pfad-Hashes und Zahlenpositionen |
| `tests/fixtures/ui/k-final-scenes.json` | Originalrouten und rekonstruierte Seitenzeichen aus den eingebetteten Vorschau-SVGs, ausschließlich für UI-Tests |
| `tests/browser/k-final-route.spec.mjs` | Stundenwechsel, Ebenen, Eingabe, Undo, Wiederherstellung und Screenshot-Matrix |
| `tests/integration/ui-ink-status.mjs` | Bestehende Prüfungen an den neuen visuellen Vertrag angepasst; Radar-/Eingabetests beibehalten |
| `scripts/verify-a3-route-reference.mjs` | Optionaler Rastervergleich gegen die Original-HTML-Datei |
| `docs/verification/A3-k-final/` | Prüfbericht, Rastervergleich und Vergleichsbilder |

## Übernommene Gestaltung

- B+-Bandbreite **22 SVG-Einheiten**, Variation **2,2**, exakt dieselben
  deterministischen Wellen, 40 Abtastschritte je Abschnitt und dieselbe leichte
  quadratische Krümmung (Kontrollpunkt um 2,3 Einheiten versetzt).
- Grundfarbe **#694934**, gemeinsame Gruppen-Deckkraft **0,68**. Keine
  stundenabhängige Farbe, keine technische Außenkontur. Die trockenen,
  feinen Pinselspuren sind unverändert aus der Referenz übernommen. Die
  Gesamtroute ist nicht gestrichelt; ausschließlich diese Materialspuren
  enthalten die in der Studie vorgesehenen unterbrochenen Haarlinien.
- Deckende Bandteile und Verbindungskappen werden vor der gemeinsamen
  Transparenzverrechnung zusammengesetzt. Innere Kappenradius **10,45**,
  äußere Kappenradius **10,12**. Überlappende Bandteile addieren keine
  Transparenz; die Originaltextur liegt innerhalb derselben Gruppe.
- Genau ein K-Keil je Etappe, mit 48 Abtastschritten und geglätteten Seiten.
  Beginn bei **t=0,10**, Ende bei **t=0,90**; Breite von **21,12** auf **0,55**
  Einheiten verjüngt. Die leicht gerundete Spitze liegt zielwärts, bewusst
  vor dem Hexzentrum wie in der Referenz. Alle Keile werden auf die gemeinsame
  Bandfläche begrenzt; keine zusätzliche Pfeilspitze oder Routenabzweigung.
- Neutraler Keil **#452d21**, maximale Deckkraft **0,64**; ausschließlich der
  gewählte Keil **#a15f43**, maximale Deckkraft **0,84**. Auch die vier
  Verlaufsstützstellen und ihre Deckkraftfaktoren sind übernommen.
- Kleine Vektorziffern 1–6, Originalstriche, Papierhalo, Drehungen und
  ausgewählte Ziffer mit Faktor **1,18**, kräftigerem Strich und dezenter
  Unterstreichung. Keine neuen Fonts oder Grafikassets, keine Kreisplaketten.
  Startbeschriftung und Startellipse bleiben gesondert erhalten.

## Zeichenreihenfolge und Interaktion

Von unten nach oben:

1. Vorhandene Seekarte, Ortsmotive, Beschriftungen und Koordinatenlinien.
2. `route-ink`: gemeinsam verrechnetes Band, darüber die Richtungskeile.
3. Unverändertes `distance-overlay` mit Radarentfernungen.
4. `hex-surfaces`: bisherige transparente Notizflächen und Hexgitter.
5. Optionale `route-numbers`.
6. `cell-information`: bestehende `.cell`-Elemente mit transparenten
   Trefferpolygonen, Stundenkanten, zentralen Notizen und Seitenzeichen.
7. Bisherige Startellipse.

Diese lokale Aufteilung erlaubt die gewünschte Zahlenebene, ohne Spielzeichen
von ihren bisherigen Tastaturzielen und `.cell`-DOM-Verträgen zu lösen.
Hoverumrandung, Fokuswiederherstellung, Pointerbehandlung und Landprüfung
bleiben bei den bisherigen Zellen. Die dekorativen Ebenen sind
`pointer-events="none"` und `aria-hidden="true"`.

Stundenwechsel verändern keine Bandgeometrie und keinen Radarwert. Frühere und
spätere Etappen bleiben gleich sichtbar. Keine neue Vergangenheit-/Zukunftslogik;
**#56 wird nicht als vollständig erledigt behandelt**.

## Bewusste Abweichung und Grenzen

Die Studie probiert eine begrenzte Suche nach kollisionsärmeren Zahlenpositionen.
Gemäß Implementierungsauftrag wird diese Suche **nicht** übernommen: Zahlen
liegen deterministisch bei **t=0,72** auf dem ankommenden Segment, innerhalb des
Zielhexes zwischen Rand und Zentrum. Dichte Seitenzeichen dürfen sie überdecken;
Spielinformationen werden darüber gezeichnet. Der vorhandene gemeinsame
Zahlenschalter bleibt unverändert.

Die geometrischen Originalpfade lassen sich exakt vergleichen; die komplette
Spielansicht ist kein pixelidentischer Nachbau der historischen Screenshotbasis.
Aktuelle Radarsemantik, Startbeschriftung und vorhandene Karten-UI bleiben
maßgeblich. Die eingebetteten Referenzmarkierungen waren bereits laut Studie
visuell rekonstruierte Spielsituationen, kein ursprünglicher Spielstand.

Es gibt in der vorhandenen Anwendung **Undo, Zurücknehmen der letzten Etappe
und erneute Eingabe**, aber keinen eigenen Redo-Befehl. Diese Bedienung wird
geprüft und beibehalten; es wurde kein neuer Redo-Mechanismus eingeführt.

Engine, Solver, Generator, Hinweissemantik, produktive Rätseldaten,
Assetpipeline und Persistenzmodell sind unverändert. Neue Fixtures dienen
nur den UI-Tests.

## Validierung

- Geometrie: **4 Tests bestanden**; alle zwölf Band- und zwölf Keilpfade
  stimmen exakt mit dem Original überein.
- Browserregression: **150 Tests bestanden** (Desktop Chromium und Mobile
  Chromium), einschließlich bestehender Radar-, Persistenz-, Eingabe-,
  Routenlegalitäts-, Verifikations- und Undo-Prüfungen.
- Unabhängiger Rastervergleich: **9 von 9 Szenen-/Stundenkombinationen mit
  0 abweichenden Pixeln** für Band und Keile, einschließlich Pinselspuren,
  Gradienten und Kappenverrechnung. Ergebnis:
  [route-pixel-comparison.json](route-pixel-comparison.json).
- **20 Reviewbilder** aufgenommen; Original-HTML ohne externe Zugriffe geprüft.
- Gesamte Unit-Suite: **368 Tests bestanden**, 0 Fehler, 0 übersprungen
  (`npm run test:unit`, Laufzeit 18 Minuten 25 Sekunden).

Der Referenzvergleich verwendet unabhängig vom Produktionsmodul aus dem
hochgeladenen Originalskript berechnete SHA-256-Werte für **alle zwölf Band-
und zwölf Keilpfade** der drei Szenen. Ein zusätzlicher Test prüft die
zielwärts gerichtete Kontur in allen sechs Fahrtrichtungen.

Reproduzierbare Browserprüfung:

```sh
npm run test:unit
npx playwright test tests/browser/k-final-route.spec.mjs \
  tests/browser/ui-ink-status.spec.mjs tests/browser/multihex-radar.spec.mjs \
  tests/browser/model.spec.mjs tests/browser/pointer-gesture.spec.mjs
```

Der zusätzliche Rastervergleich benötigt die Original-HTML und einen laufenden
Entwicklungsserver:

```sh
node scripts/verify-a3-route-reference.mjs /pfad/A3-Routenvergleich.html \
  http://127.0.0.1:4173/ docs/verification/A3-k-final/route-pixel-comparison.json
```

Die Tests nutzen die vorhandenen Desktop- und Pixel-7-Projekte und erzeugen
PNG-Anhänge unter `test-results/`. Die B2-Szenen werden mit dem bestehenden
Exporter vorbereitet, ohne produktive Rätseldaten zu ändern.

## Sichtprüfung

Die JPEGs in `screenshots/` sind direkt im Browser aufgenommene Kartenansichten;
keine generierten oder nachgezeichneten Montagen. Mobile Reviewbilder nutzen
390 Pixel Viewportbreite und CSS-Pixel für die Ausgabe. Die automatisierten
PNG-Anhänge behalten die projektseitige Pixeldichte.

| Motiv | Desktop | Mobil |
| --- | --- | --- |
| Gerade, Stunde 1 | [Bild](screenshots/desktop-straight-first.jpg) | [Bild](screenshots/mobile-straight-first.jpg) |
| Richtungswechsel, mittlere Stunde | [Bild](screenshots/desktop-turns-middle-radar.jpg) | [Bild](screenshots/mobile-turns-middle-radar.jpg) |
| Sechs Etappen, Stunde 1 | [Bild](screenshots/desktop-six-first.jpg) | [Bild](screenshots/mobile-six-first.jpg) |
| Referenzdichte, Stunde 3 | [Bild](screenshots/desktop-six-middle-reference.jpg) | [Bild](screenshots/mobile-six-middle-reference.jpg) |
| Maximale Markierungsdichte, Stunde 3 | [Bild](screenshots/desktop-six-middle-dense.jpg) | [Bild](screenshots/mobile-six-middle-dense.jpg) |
| Letzte Stunde, Zahlen aus | [Bild](screenshots/desktop-six-last-no-numbers.jpg) | [Bild](screenshots/mobile-six-last-no-numbers.jpg) |
| Letzte Stunde, Radar aus | [Bild](screenshots/desktop-six-last-no-radar.jpg) | [Bild](screenshots/mobile-six-last-no-radar.jpg) |
| Helles Papier, Radar aus | [Bild](screenshots/desktop-six-middle-paper.jpg) | [Bild](screenshots/mobile-six-middle-paper.jpg) |
| Vergrößerte Segmentanschlüsse | [Bild](screenshots/desktop-six-middle-zoom.jpg) | [Bild](screenshots/mobile-six-middle-zoom.jpg) |

Original aus der hochgeladenen HTML-Datei:
[Referenz, Stunde 3](screenshots/original-reference-hour3.jpg) ·
[Anschlussdetail](screenshots/original-reference-detail-hour3.jpg).

Der exakte PR-Head wird nach dem abschließenden Commit im PR-Bericht angegeben.
Kein Merge erfolgt im Rahmen dieser Arbeit.
