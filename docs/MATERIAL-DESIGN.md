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
  Endbeschläge mit unverzerrtem Profil; der Mittelteil wird separat wiederholt.
- `brass-strip.webp`: wiederholbarer Metall-Mittelteil mit runden Nieten.
- `brass-bezel.webp`: transparenter achteckiger Button-Beschlag mit Relief.
- `tool-atlas.webp`: neun zusammengehörige Werkzeugbilder; aktives Werkzeug
  bleibt über DOM-Zustände, Tastatur und aria-pressed erkennbar.
- `ship-wheel.webp`: dekoratives Steuerrad der oberen Fassung.
- `paper-grain.webp`: Papieroberfläche aus einem unbeschrifteten Bereich des
  erzeugten Buches, für die Leisten und den Seitenhintergrund.
- `open-bordbook.webp`: leeres Papierbuch; Hinweise werden weiterhin als Text
  darüber gerendert, nicht in das Bild eingebrannt.

Die exakten Stundenkanten bleiben kleine zustandsabhängige SVG-Overlays;
sie sind funktionale Geometrie und ersetzen kein Raster-Werkzeugbild.

## Tatsächliche Browservergleiche

1. Oberer Rahmen: Actions 38289476186, 28 Unit- und 59 Browserprüfungen.
   Die Screenshots zeigten kachelnde Papierflächen, oval gestreckte Schrauben
   und starke Einfärbung leerer Hexfelder. Korrigiert: durchgehende Papierfläche,
   wiederholter Metall-Mittelteil mit separaten Endbeschlägen, transparente
   ungefüllte Spielfelder und ruhigere, weiterhin erkennbare Stundenkanten.
2. Gesamte Fassung: Actions 38291023432, 28 Unit- und 63 Browserprüfungen.
   Metallleiste, zweiter Instrumentenrand und Buch wurden im echten Chromium
   gerendert und gegen die Vorlage geprüft. Die mobile Textspalte lag zu nahe
   am Lederdeckel; der Status war am dunklen Falz zu schwach. Korrektur: mehr
   Innenabstand und kontrastierende Statusfläche. Alle sieben Hinweise werden
   zusätzlich auf Überlappung mit der Buchnavigation geprüft.

Alle Screenshots stammen aus Playwright/Chromium. Generierte Bilder wurden nur
als UI-Assets eingesetzt; die Vergleichsbilder sind keine Konzeptillustrationen.
Desktop und Pixel-7-Emulation, Breiten 320, 390, 620, 768, 1280 und 1440 CSS-Pixel.
Die originalen Aquarellgrafiken und Prototyp 3.6 bleiben per Prüfsumme geschützt.
Keine Änderung an Engine, Rätseldefinition, Hinweisinhalten oder Speicherung.

## Bewusste Abweichungen und Grenzen

- Die Referenz hat vier obere Werkzeuge, das Spiel sieben vorhandene Funktionen.
  Sie bleiben erhalten; auf schmalen Displays verteilt sich die Leiste auf Reihen.
- Eine exakte Nachbildung der Karte selbst würde andere Illustrationen,
  Motivpositionen und eine andere Hexgeometrie erfordern. Diese bleiben erhalten.
- Die feinen nautischen Ritzzeichnungen der Referenz und ihre individuelle
  handgemalte Lichtführung sind nicht pixelgenau reproduziert. Die Raster-Assets
  besitzen einen gemeinsamen Materialcharakter, sind aber eigene Ableitungen.
- Das Konzeptbild zeigt kein Bordbuch. Leder, Papierlagen und Falz sind eine
  Ergänzung in derselben Designsprache. Mobil wird nur die rechte Seite gezeigt.
- Die Blätteranimation ist eine kurze perspektivische Papierbewegung, keine
  vollständige physikalische Simulation der einzelnen Buchblätter.
- Browserprüfung in GitHub Actions, kein lokaler Chromium verfügbar. Safari und
  echte iPhone-Hardware sind nicht geprüft. Keine externen Fonts oder Laufzeit-
  Bibliotheken; die Serifentypografie verwendet Georgia beziehungsweise den
  Serif-Fallback des Systems.

3. Zusatzprüfung: feste Seitenproportion und Mindesthöhe des Buchs erzeugten
   bei 620 CSS-Pixeln eine überbreite Darstellung. Das Buch ist nun auf die
   Kartenbreite begrenzt und wächst bei längeren Hinweisen in der Höhe; Titel
   und Metadaten bleiben auf der linken Desktop-Seite untereinander.

4. Abschließende Sichtprüfung: eine zu breite CSS-Regel für die Statusfläche
   übermalte die Rasterbilder der Buchpfeile. Sie wurde auf `#clueDone` begrenzt;
   eine Browserprüfung schützt jetzt die tatsächliche Rasterbindung aller Icons.
   Die mobile Seitennummer liegt zusätzlich weiter innerhalb der Papierfläche.

## Gesicherter Abschlussstand

Alle fünf Umsetzungsschritte wurden vor dem Verbindungsabbruch auf dem Feature-Branch
gesichert. Letzter UI-Commit: `419dc4fc597456bca4348abf4cda83c24c4942e7`.
[Actions 38293689634](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38293689634):
28 Unit-Tests und 65 Browser-Tests bestanden, 3 erwartete projektabhängige Skips.
Geprüft werden unter anderem Stundenwahl, Undo, Werkzeuge, Routenprüfung,
Hinweisnavigation, Tastatur, Touchflächen und Reduced Motion.

Die folgenden unveränderten Chromium-Screenshots stammen aus genau diesem Lauf.
Der abschließende Dokumentationscommit ändert keine Browserdarstellung.

- [Desktop, 1440 CSS-Pixel](screenshots/desktop-materials.jpg)
- [Smartphone, 390 CSS-Pixel, Pixel-7-Emulation](screenshots/mobile-materials.jpg)
- [Obere Werkzeugleiste](screenshots/upper-materials.jpg)
- [Bordbuch](screenshots/bordbook-materials.jpg)

Der neue Pull Request baut auf dem noch offenen PR #25 auf; Zielbranch ist deshalb
`feature/aquarell-messing-bordbuch`. Beide Pull Requests bleiben ungemergt.
