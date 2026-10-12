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
