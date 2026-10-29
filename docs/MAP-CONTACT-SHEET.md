# Grafische Kontaktübersicht

Die lokale CLI zeigt ausdrücklich ausgewählte, akzeptierte Karten aus einem
regulär abgeschlossenen Zielzahlbatch im aktuellen Format 3. Die Karten müssen
vollständig bebildert sein. Auch ein Batch mit `target-unreached` kann seine
tatsächlich akzeptierten Ergebnisse zeigen.

```sh
node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gezeitenkarten-batch \
  --accepted-indices 0,1,2,500,999 \
  --out /tmp/gezeitenkarten-kontakt
```

Batcherzeugung und Replay: [Generatorvertrag](CATALOG-COMPLIANT-GENERATION.md).
`--batch`, `--accepted-indices` und `--out` sind Pflicht; `--repository` wählt
optional den Katalogcheckout. Das Ausgabeverzeichnis muss neu sein.
Ergebnisindizes sind eindeutige, nullbasierte Zeilenpositionen in `accepted.jsonl`;
die explizit angegebene Reihenfolge bleibt erhalten. Es gibt keine alternative
Auswahl nach Versuchsindizes. Die entfernte CLI-Option `--indices` wird abgewiesen. Die Rückgabe `indices`
enthält weiterhin die ursprünglichen Versuchsindizes als Metadaten.

## Darstellung

`index.html` direkt im Browser öffnen und das zugehörige `resources/`-Verzeichnis
mitgeben. Es ist kein Server nötig. Karten sind statische SVGs mit den tatsächlich
freigegebenen Meer-, Rahmen- und Motivgrafiken. Die kleine lokale Bildfehleranzeige
meldet nachträglich fehlende oder beschädigte Ressourcen. Sie ersetzt keine Bilder.

Jede Karte zeigt:

- Ergebnisindex und ursprünglichen Versuchsindex (beide nullbasiert);
- Generierungs- und Zuordnungsseed, Kartenfingerprint und Zahl innerer Versuche;
- vollständige Motivbelegung mit konkreten Asset-IDs und gespeicherten Ankern;
- im Kopf: Zielstatus und Versuchszahlen, Release-ID, Hintergrund, Programmcommit.

Die gemeinsamen `createChartBaseLayers` und `drawAssetPlacements` erhalten
SVG-Geometrie, Anker, Rechtecke, Ausrichtung und Komposition. Grafikbytes stammen
ausschließlich aus dem geprüften Release und werden hashbenannt unverändert
kopiert und dedupliziert. Keine Rotation, Spiegelung, Neubemalung oder Platzhalter.

## Geografische Rasterüberlagerung

Der globale Schalter **„Hexraster anzeigen“** oberhalb der Karten ist beim Öffnen
ausgeschaltet. Er blendet auf allen ausgewählten Karten gleichzeitig die 25
inneren Hexkonturen ein oder aus. Er funktioniert per Maus, Touch und Tastatur.
Die kleine Legende bleibt sichtbar; die Karten verschieben sich beim Umschalten
nicht. Es werden keine Karten neu erzeugt oder Ressourcen nachgeladen.

| Kategorie | Kontur |
|---|---|
| Freies Wasserfeld | Blau, durchgezogen |
| Befahrbares Objekt | Orange, durchgezogen |
| Unbefahrbares Objekt | Dunkelrot, gestrichelt |

Die Konturen haben keine Füllung und sind halbtransparent. Jedes Hex gehört
genau einer Kategorie an. Mehrhexobjekte zeigen alle gespeicherten Einzelzellen;
ausgelassene Zellen bleiben Wasser. Es gibt keine zusätzlichen Symbole,
Beschriftungen oder gemeinsamen Objektumrisse.

Beim Export wird die Kategorie ausschließlich aus `row.generation.map.objects`,
`object.cells` und `object.passable` abgelesen. Alle unbelegten Zellen sind Wasser.
Die Polygone stammen direkt aus `HEXES[].polygon` in
`src/ui/chart-geometry.mjs` (gemeinsame `hexCenter`-/`hexVertices`-Geometrie).
Sie liegen als zusätzliche SVG-Gruppe nach Illustrationen und Rahmen in derselben
ViewBox, ohne eigene Transformation und mit `pointer-events="none"`.
Die größeren grafischen Motivflächen sind keine geografischen Hexkonturen.
Bilddateien, Assetnamen und transparente Pixel bestimmen keine Kategorien.
Der Browser schaltet ausschließlich die Sichtbarkeit der fertig exportierten
Gruppe um; dafür genügt lokales JavaScript, auch unter `file://`.

**Die Rasterüberlagerung visualisiert Geografie und Befahrbarkeit. Sie bewertet
keine Rätseltauglichkeit.** Eine dicht belegte Karte ist nicht automatisch ein
gutes oder schlechtes Rätsel; eine leere Karte ist nicht automatisch ungeeignet.
Solche Bewertungen gehören in eine spätere Analysephase. Illustrationen dürfen
über eine innere Hexkontur hinausreichen; die Kontur zeigt die gespeicherte
Zellbelegung, keine Pixelmaske der Illustration.

## Strenge Datenprüfung

Beide JSONL-Ströme werden gemeinsam gestreamt. Nur ausgewählte Karten bleiben
für die Ausgabe gespeichert. Geprüft werden Manifest/Format/Versionen, Profil,
stabile Releaseprovenienz, Seedfolge, Reihenfolge, vollständige akzeptierte
Teilfolge, Fingerprints, geografische Gültigkeit und Objektabstand, sämtliche
gespeicherten konkreten Zuordnungen samt globaler Wiederverwendungsregel,
Annahmeentscheidungen, Verwerfungsgründe und aggregierte Zusammenfassungen.

Ein Ergebnisindex wird niemals als Versuchsindex interpretiert. Beispielsweise
kann Ergebnis 0 zu Versuch 1 gehören. Eine unvollständige Belegung wird nur in
den Versuchsdiagnosen als Verwerfung toleriert und nicht gerendert. Auch direkte
SVG-Aufrufe verweigern unvollständige Ergebnisse. Fehler reservieren kein
Ausgabeverzeichnis; vorhandene Ausgaben werden nicht überschrieben.

Node 22+, Git mit Quellhistorie und Python 3 mit Pillow sind erforderlich.
Pillow dekodiert Bilder, ohne Freigaben neu zu bewerten oder Pixel zu verändern.
Die Streamprüfung ist linear zur Batchgröße. Geografie und Routenmetriken werden
nicht neu generiert; für vollständige Reproduktion dient das strenge Replay.

Tests: `tests/contracts/contact-geographic-grid.test.mjs`,
`tests/contracts/map-contact-sheet.test.mjs`,
`tests/contracts/target-contact-sheet.test.mjs` und
`tests/browser/contact-sheet.spec.mjs`. Der aktuelle
[Sichtungs- und Batchnachweis](verification/generation-consolidation.md) enthält
die Browserprüfung und ausgewählte Karten des neuen 1.000-Ergebnis-Batches.
