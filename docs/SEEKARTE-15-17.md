# Grafische Ausbaustufe: Issues 15–17

Basis: `feature/aquarell-seekarte`, Commit `1f4d1a5` vom 12.10.2026,
direkter Nachfolger von main `f0b8786`. Umsetzung auf
`feature/aquarell-messing-bordbuch`; main wird nicht direkt verändert.

Die vier eingecheckten Aquarelldateien bleiben byte-identisch. Nach ausdrücklicher
Freigabe werden Insel- und Schiffmotive mehrfach verwendet. Riff, Klippen und
Sandbank verwenden vorläufig das Inselmotiv; der zusätzliche Krabben-Akzent teilt
das Motiv seiner Sandbank. Keine alten Illustrationen werden geladen.
Diese vorläufige Zuordnung liegt ausschließlich in `src/ui/chart-art.mjs`;
spätere Grafikreferenzen der Rätsel sind nicht Teil dieser Änderung.

Der breitere Rand verwendet neun Ausschnitte derselben Aquarell-Pergamentgrafik.
Hexmittelpunkte und Trefferpolygone bleiben unverändert. Ortsringe folgen einer
um 45° geneigten Ebene, der Start erhält einen dünnen elliptischen Ring ohne
gefülltes Schild. Der archivierte Prototyp und seine Grafiken bleiben unverändert.

Gestaltung: schmale Messingschienen auf Pergament und aktive Zustände in dunklem
Petrol. Das Bordbuch ist das einzelne Hinweis-Karussell direkt unter der Karte;
die separate Hilfe bleibt erhalten. Regeln, Hinweise und Speicherformat bleiben
unverändert.

## Bedienung und Module

- `chart-art.mjs`: ausschließlich Aquarellreferenzen und Pergamentausschnitte.
- `toolbar.mjs`: stabile Stundenbuttons, Symbolleiste, zugängliche Zustände,
  Icon-Kante für die aktuelle Stunde und Aktivierung der Routenprüfung.
- `bordbook.mjs`: genau ein Hinweis, zyklische Navigation, Abhaken in beiden
  Ansichten, Tastatur, Wischgesten und optionale Animation.
- `chart-frame.css`: schmale Messingschienen, dunkles Petrol, Desktop-Doppelseite
  und mobile Einzelseite. Touchflächen mindestens 44 × 44 CSS-Pixel.

Die Routenprüfung wird nach sechs geometrisch gültigen Etappen freigegeben.
Dabei wird nicht vorab geprüft, ob Hinweise erfüllt sind: Eine falsche, aber
legal gezeichnete Route kann wie bisher zur Prüfung eingereicht werden.
Undo, Anzeigen, bezahlte Denkanstöße, Speicherformat und Hinweisreihenfolge
behalten ihre bestehende Semantik. Fokus bleibt bei Stundenwahl, wiederholter
Tastaturmarkierung und Abhaken erhalten. Reduzierte Bewegung deaktiviert die
kurze Text-Umblätteranimation; vertikale Wischgesten scrollen weiterhin.

## Tests und Grenzen

Unit-Tests schützen die Originaldateien sowie die vier Aquarellgrafiken mittels
Git-Prüfsummen und prüfen Regeln, Eindeutigkeit, Speicherung, Undo, Stundenkanten,
Routenbereitschaft und Hinweisnavigation. Playwright prüft Desktop-Chromium und
Pixel-7-Emulation, dazu Ansichten mit 320, 390, 768 und 1280 CSS-Pixel Breite.
Geprüft werden Markieren, Ziehgesten, Radieren, Werkzeugwechsel, Stundenwahl,
Anzeigeoptionen, Routenprüfung, Rückschritt, Undo, Kosten, Reset, Speicherung,
Bordbuch-Pfeile, Wischen, Abhaken, Tastatur, reduzierte Bewegung, Bildladen und
JavaScript-Fehler. Screenshots werden als Actions-Artefakte erstellt.

Lokale Unit-Tests laufen. Lokaler Chromium-Download scheitert in der
Ausführungsumgebung an einem unvollständigen Download; die Browserprüfungen laufen
in GitHub Actions. Dies ist keine Aussage über Safari oder echte iPhones;
eine ergänzende Sichtprüfung auf dem Mac bleibt sinnvoll.

Der Aquarell-Basiscommit hatte eine Mac-Metadatendatei des Archivs entfernt,
ohne den Archivtest anzupassen. Sie wurde mit dem ursprünglichen Blob
wiederhergestellt. Dadurch ist `prototypes/3.6/` auch gegenüber main unverändert;
der Archivtest wurde nicht abgeschwächt.
