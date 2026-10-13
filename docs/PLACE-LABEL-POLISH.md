# Ortsbeschriftungen: Geometrie und Materialfeinschliff

Historischer erster Nachtrag zu PR #30. Den aktuellen Inselmittelpunkt und
die vier abschließenden Korrekturen dokumentiert [FINAL-GRAPHICS.md](FINAL-GRAPHICS.md).
In dieser ersten Fassung wurden ausschließlich Ortsbeschriftungen verändert.

- Schilder: höchstens etwa 54 SVG-Einheiten breit, 18 hoch statt zuvor
  66–122 × 24. Papierdeckung 62 % statt 97 %, deutlich schwächere Textur.
- Dunkle Serifenschrift mit feiner Papierlichtkante; reale SVG-Schriftmaße
  werden geprüft und bei Bedarf in den festen sicheren Schildrahmen eingepasst.
- Positionierung nutzt dieselben Zentren und Polygonpunkte wie die interaktiven
  Hexfelder. Keine pauschale CSS-Verschiebung.
- Nur gesperrte Felder des jeweiligen Orts werden berücksichtigt. Zusammenhängende
  Landkomponenten werden nach tatsächlicher Hexnachbarschaft ermittelt.
- Bei mehrteiligen Inseln wird ein gesperrtes Feld möglichst nahe dem gemeinsamen
  Schwerpunkt gewählt. Ein Schwerpunkt im Zwischenraum der gezeichneten Polygone
  ist ausdrücklich kein zulässiger Schildplatz. Tesoro liegt daher mittig auf B3,
  innerhalb seiner zusammenhängenden Landkomponente B3/C3. Klippen liegt auf E2.
- Schild, Schrift und Schatten sind auf das gewählte Landpolygon begrenzt und
  besitzen zusätzlichen geometrischen Innenabstand. Kein Übergriff auf Wasser
  oder Kartenrand; pointer-events bleiben deaktiviert.
- C1 ist befahrbar: Das Leuchtturm-Pergamentschild entfällt gemäß der neuen Vorgabe.
  Illustration, Spielregeln und Hinweistexte bleiben unverändert.

Zusätzliche Unit-Tests prüfen Landzuordnung, zusammenhängende Flächen, den
unzulässigen Zwischenraum und Nichtüberdeckung von Wasserfeldern. Browsertests
prüfen tatsächliche Bounding Boxes, Textmaße, Transparenz und Clipflächen bei
320, 390 und 1440 CSS-Pixeln. Die vollständigen bisherigen Tests laufen weiterhin.

[Verifizierter PR-Lauf 38322019467](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38322019467),
UI-Commit `c6d5fed`: 33 Unit- und 81 Chromium-Browsertests bestanden,
3 erwartete projektabhängige Skips. Lokale Unit-Prüfung ebenfalls 33/33.

Tatsächliche, unveränderte Browser-Screenshots:
- [Desktop](screenshots/labels-desktop.jpg)
- [Desktop-Kartendetail](screenshots/labels-chart-detail.jpg)
- [Smartphone, 390 × 844 CSS-Pixel](screenshots/labels-mobile.jpg)

Chromium-Desktop und Pixel-7-Emulation. Keine neue Prüfung auf echter Safari-/
iPhone-Hardware. Screenshot-/Dokumentationscommit ändert die Darstellung nicht.

