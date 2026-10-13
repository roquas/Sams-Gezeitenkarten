# Abschließende grafische Korrekturen

Historischer Nachtrag; die aktuellen sechs Layout-Anpassungen stehen in
[LAYOUT-POLISH.md](LAYOUT-POLISH.md).

Nachtrag zu PR #30 auf `feature/coordinates-chart-logbook`. Keine Änderung an
Spielregeln, Befahrbarkeit, Koordinatensystem, Icons, Logbuch oder Bedienlogik.
Die vorhandenen Aquarell-/UI-Assets bleiben byte-identisch.

## Inselzentrum

Gesperrte Felder werden nach tatsächlicher Hexnachbarschaft zu einer Inselfläche
zusammengefasst. Da alle Hexe gleich groß sind, ergibt sich ihr Flächenschwerpunkt
als Mittel der Polygonzentren. Tesoro liegt jetzt bei (183, 192), mittig über B3/C3.
Klippen bleibt mittig auf E2. Darstellungsabstände zwischen zusammenhängenden
Landhexen zählen zur gemeinsamen Inselhülle; befahrbare Feldpolygone werden
separat mit einem Achsentrennungstest auf Überdeckung geprüft. Auch Schrift und
Schatten besitzen Sicherheitsabstand. Ein unsicherer Schwerpunkt wird nur bei
komplizierteren Flächen auf die nächstliegende sichere Landposition begrenzt.

Die abgenommene Gestaltung bleibt gleich: 13 SVG-Einheiten Schriftgröße vor
Schriftmaßanpassung, 18 Einheiten Schildhöhe, höchstens etwa 54 Einheiten Breite,
62 % Papierdeckung und 12 % Texturdeckung. Der Leuchtturm bleibt unbeschildert,
weil C1 befahrbar ist.

## Startlabel

„Start“ verwendet dieselbe Schildkomponente, Abmessungen, Papiertransparenz und
Serifenschrift. Nur die Schriftfarbe unterscheidet sich: Rostrot #8c3e2c. Die
Position wird aus dem unveränderten Starthex und der Bounding Box seiner
Bootillustration bestimmt, mit drei Einheiten Abstand oberhalb des Bildes.
Start bleibt D4; Markierungsring, Route und Eingaben bleiben unverändert.

## Sichtbarer Pergamentrand

Die sichtbaren Außenkanten und die Übergänge zum Wasser wurden im unveränderten
858 × 789-Pixel-Originalasset an den fünf Spalten- und fünf Zeilenachsen gemessen.
Die Profile stehen in `PARCHMENT_PROFILES`. Ihre Koordinaten werden durch dieselbe
stückweise Skalierung wie die neun vorhandenen Randsegmente projiziert.
Jedes Randzeichen liegt am Mittelwert seiner projizierten Außen-/Innenkante;
auf dem unregelmäßigen linken Rand hat deshalb nicht jede Zeile dieselbe x-Position.
Rahmenbreite und Karten-/Hexgeometrie bleiben unverändert.

## Hexlinien

Wasser: 1,05 Einheiten Breite und 56 % Deckung statt 0,8 / 34 %.
Gesperrte Felder: 1,25 Einheiten und 72 % Deckung in warmem Dunkelbraun.
Die drei Landfelder behalten vollständig transparente Flächen; keine neuen
Sperrsymbole oder massiven Füllungen. Die Linien bilden dieselben Originalpolygone.

## Prüfung

Unit-Tests schützen Inselmittelpunkt, Nichtüberdeckung befahrbarer Polygone,
Start-/Illustrationsabstand, tatsächliche Randmittelpunkte und unveränderte Assets.
Browserprüfungen kontrollieren reale Text-/Schildmaße, alle 20 Randzeichen,
Landumrisse und Startdarstellung bei 320, 390 und 1440 CSS-Pixeln. Sämtliche
vorhandenen Spieltests laufen zusätzlich.

[Verifizierter PR-Lauf 38361905917](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38361905917),
UI-Commit `34ded26`: 35 Unit- und 83 Chromium-Browsertests bestanden,
3 erwartete projektabhängige Skips. Push-Lauf 38361900001 ebenfalls grün.
Lokale Unit-Prüfung: 35/35. Keine fehlgeschlagenen Tests.

Aktuelle, unveränderte Browseraufnahmen:
- [Desktop](screenshots/final-desktop.jpg)
- [Desktop-Kartendetail](screenshots/final-chart-detail.jpg)
- [Smartphone, Pixel-7-Emulation, 390 × 844 CSS-Pixel](screenshots/final-mobile.jpg)

Keine neue Prüfung auf echter Safari-/iPhone-Hardware. Der anschließende
Dokumentationscommit ergänzt nur Bilder, Erläuterungen und einen Codekommentar.

