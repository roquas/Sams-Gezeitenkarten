# Nautische Materialgestaltung nach Konzeptbild

## Grundlage

Grafische Basis: PR #25, Commit `715b33f`. Neuer Branch:
`feature/nautical-ui-materials`. PR #25 und main werden nicht verändert.
Verbindliche Referenz: das vom Nutzer am 12.10.2026 angehängte Konzeptbild.

## Analyse der Vorlage

Die Fassung verwendet breite Pergamentflächen, aber schmale horizontale
Messingprofile (ungefähr 1,5–2 % der Kartenbreite). Dunkle Ränder und feine
goldene Lichtkanten geben dem Metall Tiefe. Rund beschlagene Enden stehen
leicht über; kleine Nieten unterbrechen die langen Profile. Das Licht kommt
von oben links. Aktive Buttons sind gefasst, die Stunden liegen in einer
zusammenhängenden Vertiefung. Serifenziffern und kräftige Silhouetten sind
wichtiger als viele kleine Ornamente. Die Karte dominiert die Komposition.

Die vorhandenen sieben Werkzeuge bleiben erhalten; die vier Icons der Vorlage
werden nicht als neue Funktionen übernommen. Smartphone: eigene Werkzeugreihe
unter der Stundenwahl, damit alle Trefferflächen mindestens 44 Pixel bleiben.
Petrol-Aktivzustände ersetzen die gelbe Aktivfüllung der Vorlage entsprechend
der bestehenden Produktentscheidung.

## Raster-Assets

Erzeugt mit dem eingebauten Imagegen-Werkzeug, das Konzeptbild als Stilreferenz.
Exakte Prompts: `UI-ASSET-PROMPTS.json`. Keine Seekartenillustration wurde erzeugt,
ersetzt oder geändert. Die generierten Quellen wurden für den Browser als WebP
verpackt: transparente Außenränder begrenzt, Icon-Sprite und Steuerrad auf ihre
Darstellungsgröße optimiert. Die Quellen bleiben unverändert; die exportierten
Assets liegen in `assets/ui/`.

- `brass-rail.webp`: dunkles Metallprofil, Glanzrillen, Endbeschläge und Nieten;
  neunfach skalierbare Rahmendarstellung über CSS border-image.
- `tool-atlas.webp`: neun zusammengehörige Werkzeugbilder; aktives Werkzeug
  bleibt über DOM-Zustände, Tastatur und aria-pressed erkennbar.
- `ship-wheel.webp`: dekoratives Steuerrad der oberen Fassung.
- `paper-grain.webp`: Papieroberfläche aus einem unbeschrifteten Bereich des
  erzeugten Buches, für die Leisten und den Seitenhintergrund.
- `open-bordbook.webp`: leeres Papierbuch; Hinweise werden weiterhin als Text
  darüber gerendert, nicht in das Bild eingebrannt.

Die exakten Stundenkanten bleiben kleine zustandsabhängige SVG-Overlays;
sie sind funktionale Geometrie und ersetzen kein Raster-Werkzeugbild.
