# Sichtungsnachweis: geografische Rasterüberlagerung

Arbeitsbasis: `4283c46` (main nach PR #90). Batchprogramm:
`5b041bf57d9622c5647abdf271700eaa60cf061e`.
Konfiguration, Releaseprovenienz, Ergebnis-/Versuchsindizes, Seeds, Fingerprints,
gespeicherte Objektzellen, konkrete Motivbelegungen und Ausgabehashes stehen in
[geographic-grid.json](geographic-grid.json).

Die neue lokale Kontaktübersicht enthält **24 kataloggerechte, vollständig
bebilderte Karten**, ausgewählt über Ergebnisindizes 0 bis 95. Der kleine
reproduzierbare Format-3-Batch erreicht 96 akzeptierte Karten aus 125 Versuchen.
Die Auswahl umfasst:

- eine vollständig leere Karte und Belegungen von 0 bis 11 Zellen;
- alle acht im Batch vertretenen Mehrhexmotive mit unterschiedlichen Formen;
- belegte Zellen an sämtlichen 25 Positionen, einschließlich aller Ränder,
  Ecken und beider Reihenparitäten;
- Wasser sowie befahrbare und unbefahrbare Objekte.

Die Browserprüfung gleicht alle 600 Hexkategorien der Übersicht mit den
gespeicherten Objektzellen und ihrer Befahrbarkeit ab. Jede Karte hat genau
25 verschiedene Hexkonturen. Alle Bildverwendungen dekodieren; keine
Bildfehler, JavaScriptfehler oder HTTP-/HTTPS-Anfragen. Ein-/Ausschalten ergibt
pixelgleiche normale Kartenbilder. Die normalen SVG-Inhalte aller 24 Karten
sind nach Entfernung der zusätzlichen Diagnosegruppe bytegleich zum Renderer
auf `4283c46`; die vorhandenen Ebenen werden nicht verändert.

Praktische Chromium-Sichtung unter `file://`, Desktop 1560 × 1750 und
Pixel 7 mit 412 × 839 CSS-Pixeln:

- [Raster eingeschaltet, Desktop](geographic-grid-enabled-desktop.jpg)
- [Raster ausgeschaltet, Desktop](geographic-grid-disabled-desktop.jpg)
- [Raster eingeschaltet, Mobil](geographic-grid-enabled-mobile.jpg)

Die Aufnahmen zeigen Ausschnitte der einzelnen kompakten Übersicht. Die vollständige
HTML-Ausgabe mit ihren 20 unveränderten, geteilten Bildressourcen bleibt lokal unter
`/workspace/geographic-grid-review/contact-sheet/index.html` verfügbar. Zum Weitergeben
gehören `index.html` und der Ordner `resources/` zusammen.

## Reproduktion

Im Checkout dieses PRs ausführen; jedes Ausgabeverzeichnis muss neu sein.
Die Aufrufe reproduzieren Auswahl, Karten und Zuordnungen. Die gespeicherten
Ausgabehashes beziehen sich auf den oben genannten Batchprogrammcommit.
Ein späterer Programmcommit steht als andere Provenienz im HTML-Kopf,
auch wenn Karten und Zuordnungen gleich bleiben.

```sh
node --input-type=module -e "import fs from 'node:fs'; const evidence=JSON.parse(fs.readFileSync('docs/reviews/contact-sheet/geographic-grid.json')); fs.writeFileSync('/tmp/gk-grid-config.json',JSON.stringify(evidence.config));"
node scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 --target-count 96 --max-attempts 300 \
  --seed-start 0 --config /tmp/gk-grid-config.json --out /tmp/gk-grid-batch
node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gk-grid-batch \
  --accepted-indices 0,1,2,4,8,12,13,15,19,21,25,29,33,37,41,45,50,54,58,62,66,70,74,95 \
  --out /tmp/gk-grid-contact-sheet
```

## Automatisierte Prüfung

```sh
npm run test:unit
npm run test:content
npm run test:puzzles
npx playwright test tests/browser/contact-sheet.spec.mjs --workers=1
npx playwright test --config playwright.webkit.config.mjs tests/browser/contact-sheet.spec.mjs --workers=1
git diff --check
```

Ergebnis: **201 Unit-/Contract-/Integrationstests, 20 Contenttests und die
Rätselvalidierung bestanden**, ebenso alle 16 Browserprüfungen und
`git diff --check`. Die sechs neuen Geografiefälle und die vorhandenen
Geometrie-, Generatorvektor-, Identitäts-, Batch- und Releaseregressionen sind
in der vollständigen Unit-Suite enthalten.

Die Browsermatrix besteht aus acht Chromium- und acht WebKit-Prüfungen, jeweils
Desktop und Mobil. Sie prüft Standardzustand, alle Karten beim Ein-/Ausschalten,
Konturtypen und Legende, unveränderte Positionen und Größen, pixelgleiche
Normalansicht und unveränderte SVG-/Bildknoten einschließlich ihrer Attribute.
Auch zusätzliche lokale Ressourcenanfragen beim Umschalten sind ausgeschlossen.
Die Aufnahme während der Größenprüfung beschränkt sich bewusst auf den
Viewport: Chromium verändert beim Ganzseiten-Screenshot vorübergehend
Viewport/Textmetriken; das ist keine Wirkung des Rasterschalters.

WebKit lief mit lokal bereitgestellten Debian-Bibliotheken. Da dessen
Hostprüfung dynamisch geladene Bibliotheken nur im systemweiten `ldconfig`-Cache
sucht, wurde sie für diesen lokalen Test mit
`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` übersprungen. Die Bibliotheken
waren tatsächlich verfügbar; sämtliche WebKit-Browsertests wurden ausgeführt.
Die bestehenden CI-Jobs installieren sie regulär mit `--with-deps`.

Der frühere 1.000-Karten-Batch lag nicht als Batchdateien vor; die optionale
60-Karten-Stichprobe wurde deshalb nicht rekonstruiert. Der kleine Batch genügt
für die geografische Sichtprüfung. Diese Stichprobe ist keine Aussage über
Rätseltauglichkeit oder Schwierigkeitsgrad. Auch eine leere Karte wird allein
wegen ihrer Belegung nicht als ungeeignet bewertet.
