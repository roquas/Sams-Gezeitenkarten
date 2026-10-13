# Sechs Layout-Feinabstimmungen auf dem bestehenden GUI-Branch

PR #30, Branch `feature/coordinates-chart-logbook`. Kein neuer Branch, kein Merge.

1. Labels zielen auf die Höhe der unteren seitlichen Hexecken (Radius/2 unter
   dem Flächenschwerpunkt). Die gesamte Schild-/Schattenfläche muss sicher in
   ihrer Insel- bzw. Starthexgeometrie bleiben; deshalb begrenzt der verfügbare
   Raum den Versatz. Tesoro: (183, 210), Klippen: leichte Absenkung, Start:
   deutlich tiefer innerhalb D4. Größen, Deckung, Typografie und Rostrot bleiben.
2. Die bestehenden geschwungenen Spaltenhilfen bleiben geometrisch unverändert.
   Breiter Lichtzug 9 / 19 %, dünne Tintenlinie 1,7 / 34 %: unter den Hexumrissen.
3. Gemeinsame Stunden-Gruppe mit kleiner Messing-Sanduhr über dem Kasten.
   Steuerrad und sichtbares „Stunde“ entfallen dort; Accessible Names bleiben.
   Neue transparente UI-Datei: `assets/ui/hourglass.webp`, erzeugt mit dem
   eingebauten Imagegen, Referenz `tool-atlas.webp`; exakter Prompt in
   `UI-ASSET-PROMPTS.json`. Keine neue Seekartengrafik.
4. Untere Leiste: Undo, Radar, Stundenmarkierungen, Routennummern, Route,
   Route eins zurück, Prüfen. Die beiden Routenbuttons behalten ihre DOM-Nodes,
   Tooltips und Aktionen; die Werkzeug-Delegation gilt für beide Leisten.
   Routennummern-Symbol: Auge ①···②. Bei 320–600 Pixeln oben genau zwei
   Buttonzeilen und unten zwei Zeilen, mindestens 44 Pixel Touchfläche.
   Bei engem Desktop-Splitlayout darf die obere Leiste ebenfalls zweizeilig sein.
5. Dasselbe Buch auf Desktop und Mobil: links schmale 12–14-%-Seite mit
   dekorativem Steuerrad, rechts Titel, Seitenstand und Hinweis. Beide Hälften
   des bestehenden Buchassets werden vollständig gerendert; die linke Hälfte
   wird perspektivisch schmaler dargestellt, nicht hart abgeschnitten.
   Blättern, Abhaken, Textur und Reduced Motion bleiben erhalten.
6. Rekonstruierte Route und Prüfergebnis stehen vor Werkzeuglegende und ihrem
   Sprunglink. Texte, Funktionen und Inhalte der Bereiche bleiben unverändert.

Prüfung: sämtliche Unit- und Browserprüfungen sowie zusätzliche Zeilenzählung,
Touchflächen, Tastatur-Routenwahl/-Rücknahme, beide Buchhälften, Titelposition,
Labelhöhe, Hint-Überlappung und Reihenfolge. Reale Browserbilder und Resultate
werden nach Sichtprüfung ergänzt. Safari-/iPhone-Hardware wurde nicht neu geprüft.

## Browservergleich und Korrekturen

Erste Sichtprüfung: Rechts lagen Seitennummer und lange Textzeilen zu nah am
Leder-/Papierstapelrand. Die rechte Inhaltszone und Navigation erhalten nun
mehr Innenabstand; die Seitennummer zusätzlich Abstand zur umgeschlagenen Ecke.
Undo und Radar behalten mobil runde 48-Pixel-Fassungen. Die drei Routenaktionen
bilden einen rechtsbündigen Block; der Nummernschalter ist mobil maximal 72 Pixel
breit und passt sich bei 320 Pixeln dem kleineren Gridfach an.

Die Zeilenzählung nutzt die Button-Mittelachsen. Eine erste Prüfung über die
Oberkanten zählte die unterschiedlich hohen Stunden-/Werkzeugbuttons auf einer
gemeinsamen Desktopreihe fälschlich doppelt. Die korrigierte Prüfung besteht
und prüft weiterhin genau zwei obere und zwei untere Buttonreihen auf Smartphones.

Lokale Unit-Tests: 35/35. Verifizierter Zwischenstand: 91 Browserprüfungen,
3 erwartete Skips. Der abschließende UI-Lauf besteht ebenfalls vollständig:
[PR-Actions 38394019736](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38394019736)
und Push-Actions 38394011945, UI-Commit `bd72c73`: 35 Unit- und 91 Browsertests
bestanden, 3 erwartete projektabhängige Skips. Keine fehlgeschlagenen Tests.

Aktuelle echte Chromium-Aufnahmen (keine Mockups):
- [Desktop](screenshots/layout-desktop.jpg)
- [Obere Leiste](screenshots/layout-upper.jpg)
- [Untere Leiste](screenshots/layout-lower.jpg)
- [Buchdetail](screenshots/layout-book.jpg)
- [Smartphone: obere zwei Reihen](screenshots/layout-mobile-upper.jpg)
- [Smartphone: Buch und Routenblock](screenshots/layout-mobile-book.jpg)
- [Schmales Smartphone, 320 Pixel](screenshots/layout-mobile-320.jpg)

Desktop 1440 × 1080, Mobil 390 × 844 und 320 × 780 CSS-Pixel in Pixel-7-Emulation.
Zusätzliche Tests bei 600/620/900 Pixeln. Bilder stammen aus dem UI-Lauf;
der Dokumentationscommit ergänzt ausschließlich Belegbilder und Erläuterungen.

