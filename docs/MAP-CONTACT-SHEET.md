# Grafische Kontaktübersicht aus einem Kartenbatch

Die lokale Diagnoseansicht stellt eine **explizite Auswahl** gespeicherter Karten
mit den im Batch referenzierten freigegebenen Grafiken dar. Sie erzeugt keine
Geografie, Rätsel, Hinweise, Routen oder Bewertung und verändert keine Identität.

Voraussetzungen zur Erzeugung: Node 22+, Git mit vollständiger Releasehistorie,
Python 3 mit Pillow (`python3 -m pip install Pillow`). NumPy, Browserinstallation
und Server sind für diesen Aufruf nicht erforderlich.

```sh
node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gezeitenkarten-batch \
  --indices 0,1,2,3,4,5,6,7,8,9,10,11 \
  --out /tmp/gezeitenkarten-kontakt
```

Danach `/tmp/gezeitenkarten-kontakt/index.html` direkt im Browser öffnen.
Das neue Ausgabeverzeichnis darf noch nicht existieren. Es enthält die HTML-Datei
und `resources/` mit unveränderten Bildbytes. Zum Weitergeben **das gesamte
Verzeichnis** kopieren oder zippen. Der Browser benötigt keinen Server und kein
Netzwerk. Ein kleines klassisches Inline-Skript prüft ausschließlich das Laden
und Dekodieren der Bilder; fehlen Dateien nach dem Export, nennt ein sichtbarer
roter Fehlertext ihre ursprünglichen Releasepfade. Die SVG-Karten selbst sind
statisch und bleiben auch ohne JavaScript sichtbar.

Die Indizes sind nullbasiert, eindeutig und durch Kommas getrennt. Ihre Reihenfolge
bestimmt die Reihenfolge der Karten; Bereiche oder automatische Auswahl werden
nicht unterstützt. Als Ausgangspunkt sind 12–24 Karten sinnvoll. Die Darstellung
verwendet je nach Fensterbreite mehrere Spalten mit etwa 560 oder mehr Pixeln
Kartenbreite; Browserzoom vergrößert Details. Auf kleinen Bildschirmen wird eine
Spalte angezeigt.

Jede Karte zeigt Seed, Zuordnungsseed, Kandidatenindex, unveränderten
Kartenfingerprint, Zuordnungsstatus und illustrierte/nicht illustrierte Objektzahl.
`complete`, `partial` und `none` werden gleichberechtigt ausgegeben. Nicht
illustrierte Objekte tragen **magentafarbene gestrichelte tatsächliche
Hexkonturen mit ×**. Jeder Hex gehört weiter zu genau dem gespeicherten Objekt;
die Platzhalter verändern weder Geografie noch Zuordnung und sind keine Motive.
Ausgewählte Versuche ohne Karte (`exhausted`/`inconclusive`) führen zu einer
konkreten Fehlermeldung mit Index, statt still ausgelassen zu werden.

## Datenprüfung und Rendering

- Es werden abgeschlossene Batches im [Batchformat 1](MAP-BATCH-F04B.md) erwartet:
  `manifest.json`, `candidates.jsonl`, `summary.json`.
- Das Manifest wird mit demselben Vertragsprüfer wie beim Batch-Replay gelesen:
  Format, Seedfolge, normalisierte Optionen und unterstützte Algorithmusversionen.
  Die Kontaktansicht darf auf einem späteren Programmcommit laufen; der
  gespeicherte Commit wird angezeigt. Das strenge Replay verlangt unverändert
  den exakten ursprünglichen Programmcommit.
- Der Release-Adapter prüft Freigabe, Inventar, Hashes, Hintergrundauswahl und
  stabile Provenienz. Das Katalogprofil wird daraus verglichen. Ein späterer
  Archivcommit mit unverändertem Release ist zulässig.
- Alle JSONL-Zeilen werden gestreamt und auf Anzahl, Reihenfolge, Seedfolge,
  Generatorkontext, gültige Karte und Kartenfingerprint geprüft. Die Statussummen
  müssen zur abgeschlossenen Zusammenfassung passen. Für die ausgewählten Karten
  wird zusätzlich die gesamte gespeicherte Zuordnung mit dem bestehenden
  Zuordnungsdienst und dem freigegebenen Kontext verglichen. Gerendert werden
  anschließend die **gespeicherten** Platzierungen. Es erfolgt keine
  Neugenerierung von Karten oder vollständige Prüfung der Analysemetriken;
  dafür bleibt das strenge Einzel-Replay zuständig.
- Meer, Rahmen und geografische Motive stammen ausschließlich aus den vom
  Adapter erfassten Git-Ressourcen. Der Adapter stellt zusätzlich den zum
  gewählten Hintergrund gehörenden archivierten Kartenvertrag bereit.
  `--repository /pfad/zum/repository` kann ein separates Datenrepository wählen.
  Arbeitsassets werden auch bei fehlenden Bildern niemals ersatzweise gelesen.
- Die Kontaktansicht prüft die archivierten SVG-Grenzen gegen die gemeinsamen
  `CHART_BOUNDS`/`CHART_VIEWBOX`. `createChartBaseLayers` und
  `drawAssetPlacements` erzeugen die SVG-Ebenen. Anker, Bildrechtecke,
  Seitenverhältnis, transparente Bildbereiche und `plus-lighter`-Komposition
  bleiben in den bestehenden Renderern. Ein kleiner XML-Ausgabeknoten ersetzt
  nur die DOM-Erstellung; es gibt keine zweite Platzierungsgeometrie.
- Bilder werden vor dem Schreiben mit Pillow dekodiert. Das ist eine reine
  Lesbarkeitsprüfung: keine Pixel-/Alpha-/Footprintprüfung, keine Freigabe und
  keine Änderung der Bilddaten. Fehler brechen vor Erstellung der Ausgabe ab.
- Bilder werden nach Inhaltsdigest benannt und gemeinsam referenziert. Dadurch
  wird etwa der vollformatige Rahmen nur einmal gespeichert. Gleiche Eingaben
  ergeben bytegleiche HTML- und Ressourcendateien; Zeitstempel und absolute
  Arbeitsverzeichnisse gelangen nicht in die Ausgabe.

## Reproduzierbares Beispiel mit zwölf echten Karten

Der freigegebene technische Referenzrelease aus PR #82 ist unverändert die Quelle.
Der folgende Batch enthält mit den aktuellen Generatorversionen alle drei
Zuordnungsstände: Index 9 ist `none`, Index 10 `complete`; die übrigen gewählten
Indizes sind `partial`.

```sh
node scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 --mode catalog-informed \
  --count 24 --seed-start 0 --out /tmp/gezeitenkarten-batch

node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gezeitenkarten-batch \
  --indices 0,1,2,3,4,5,6,7,8,9,10,11 \
  --out /tmp/gezeitenkarten-kontakt
```

Der Batchgenerator verlangt wie bisher saubere, committete Programmdateien.
Die erste praktische Sichtung wurde mit dem Batchprogrammcommit
`e671d1875813740aecc993437783e65c345c9926` (main nach PR #85) erzeugt.
Dessen 24 Karten sind verschieden; die Auswahl enthält 10 `partial`, 1 `none`
und 1 `complete`. HTML plus 18 referenzierte Bildressourcen belegen rund 11 MiB.
Die [gespeicherte Browseraufnahme](reviews/contact-sheet/overview.jpg) und
[Beispieldaten zur Sichtung](reviews/contact-sheet/sample.json) sind im Repository.
Im Chromium-Browser wurden die 12 Karten mit allen 53 Bildverwendungen über
`file://` geöffnet; die Sichtprüfung zeigte die erwarteten Meer-/Rahmenebenen,
unveränderte Anker und deutlich technische Platzhalter.

## Tests

```sh
node --test tests/contracts/map-contact-sheet.test.mjs
npx playwright test tests/browser/contact-sheet.spec.mjs
npm run test:unit
```

Die Vertragstests verwenden einen echten reproduzierbaren Batch vom PR-85-Stand
und den bestehenden freigegebenen Release. Sie prüfen Auswahl, Datenkorruption,
Releasegrenzen, alle Bebilderungsstände, Bildfehler, SVG-Rechtecke/Hexkonturen und
Bytegleichheit. Die Browsertests öffnen die Ausgabe direkt per `file://`, prüfen
Dekodierung, Ebenen und Überlauf auf Desktop/Mobil und simulieren eine nach dem
Export gelöschte Bildressource. Sie benötigen Pillow zusätzlich zur üblichen
Playwright-Installation.
