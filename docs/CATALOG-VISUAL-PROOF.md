# Relative Katalog-Korrekturfahne

Die Fahne zeigt jedes ausgewählte Motiv einmal gegen seine verbindliche relative
Belegungsform. Eine Übersichtskachel öffnet dieselbe Form vergrößert. Die gelben
inneren Hexflächen und die türkisfarbene zulässige Grafikfläche sind unabhängig
schaltbar. „Normalansicht“ blendet beide aus; Vor-/Zurücknavigation wechselt das
Motiv. Ankerzahlen, Kartenpositionen und Lageklassen gehören nicht zur Fahne.

Die Fahne ist ein Prüfartefakt. Technisch gültiger Kandidat, vollständig erzeugte
Fahne, manuelle Sichtprüfung und formale Katalogfreigabe bleiben getrennte Zustände.
Die beiden letzten Schritte werden durch den Export nicht durchgeführt.

## Verbindliche relative Geometrie

`imageContract(asset.geometry.cells)` in `src/assets/geometry.mjs` liefert bereits
Canvasmaße und Grafikpolygone relativ zum gemeinsamen Zellschwerpunkt. Die Grafik
wird unverändert auf `[-width/2, -height/2, width, height]` dargestellt.
`drawAssetPlacements` erwartet dagegen einen konkreten Kartenanker und ruft
`assetRectangle` auf. Die relative Fahne verwendet deshalb direkt die vorhandenen
Canvasmaße, ohne dafür eine künstliche Kartenplatzierung zu erzeugen. Seitenverhältnis
und isolierte Bildkomposition bleiben wie im bestehenden Renderer erhalten.

Eine fertige kombinierte relative Darstellung beider Overlayarten existierte
nicht. `relativeReviewGeometry` in `scripts/lib/catalog-proof.mjs` verwendet deshalb
unverändert die Grafikpolygone aus `imageContract`. Jedes dieser Polygone ist eine
Translation von `GRAPHIC_CELL`. Die Differenz ihrer jeweils ersten Eckpunkte ist
der relative Zellmittelpunkt. `hexVertices` aus `src/ui/place-labels.mjs` liefert
an diesem Mittelpunkt die tatsächliche innere Hexfläche des Spiels.

Es gibt keine zweite Gitterformel, Polygonannäherung, Koordinatenrundung,
Randbeschneidung oder zusätzliche Zulässigkeitsregel. Auch negative relative
Koordinaten und konkave Mehrhexformen bleiben erhalten. Der Meereshintergrund
ist ein zentrierter Texturausschnitt im bisherigen Maßstab. Er bestimmt keine
geometrische Gültigkeit. Ein Konflikt mit dem bestehenden Vertrag wurde nicht
festgestellt; Zuständigkeiten und offene Bereinigungen sind in
[CATALOG-VALIDATION-AUDIT.md](CATALOG-VALIDATION-AUDIT.md) dokumentiert.

## Export und Integrität

Voraussetzungen: Git, Node.js, Python 3 mit Pillow; für einen **neuen**
Kandidatenbau zusätzlich NumPy. Zum erneuten Export des vorhandenen Kandidaten
werden keine neuen Kandidatendokumente erzeugt.

```sh
mkdir -p .dev/catalog-relative-proof-511dfcf
node scripts/catalog-release.mjs verify \
  --candidate .dev/catalog-visual-proof-511dfcf/candidate
node scripts/render-catalog-proof.mjs \
  --candidate .dev/catalog-visual-proof-511dfcf/candidate \
  --out .dev/catalog-relative-proof-511dfcf/proof \
  --background sea-blue-01 --expected-count 33
```

Der Ausgabeordner muss neu sein; sein Elternordner muss existieren.
`--repository` erlaubt einen anderen Git-Datenbestand. Bei genau einem
Kandidatenhintergrund kann `--background` entfallen. `--expected-count` meldet
Abweichungen sichtbar, ohne die tatsächliche Auswahl zu verändern.

`loadCatalogReleaseCandidate` übernimmt die bestehende strenge Verifikation von
Dokumenten, Auswahl, Hashes und Git-Ressourcen. Die einzig verbindliche Auswahl
ist die tatsächliche verifizierte `selection.json`. Historische Ankerevidenz wird
weder geändert noch als Teil der relativen Einzelassetprüfung ausgewertet.
Der Quellhashvergleich der verwendeten Geometriefunktionen schützt gegen eine
unbemerkte Interpretation durch andere Programmverträge; er ist keine neue
Asset-Gültigkeitsregel.

Jedes ausgewählte Motiv bekommt genau eine Kachel und einen Berichtseintrag.
Darstellungsfehler bleiben als Fehlerkacheln und Einträge sichtbar; die CLI liefert
bei unvollständiger Fahne Exitcode 1. Ungültige Kandidaten werden vor dem Export
abgewiesen. Der bestehende SVG-Serializer und Bilddekodierer der
Karten-Kontaktübersicht werden wiederverwendet.

`review-manifest.json` (Schema 2) bindet Quellcommit, Kandidaten-ID, Manifest- und
Selektionshash, Hintergrund, exakte Assetauswahl, relative axiale Belegungszellen,
Hexanzahl, Befahrbarkeit und Darstellungsstatus. Vollständigkeit und
Ressourcenintegrität sind getrennt ausgewiesen; jede kopierte Bildressource
enthält ihren Herkunftspfad und SHA-256. Konkrete Kartenanker oder Prüfpositionen
sind nicht enthalten.

`proof/index.html` direkt im Browser öffnen. Den gesamten Ordner mit `resources/`
kopieren oder das portable ZIP vollständig entpacken. JavaScript steuert nur
Motivnavigation, Overlays und Bildfehleranzeige; es gibt keine Netzwerkabrufe,
Fetch-Aufrufe, externen Schriften oder Laufzeitmodule. Fehlende oder beschädigte
kopierte Bilder werden beim Öffnen an den betroffenen Motiven gemeldet. Diese
Browserdiagnose prüft Dekodierbarkeit; die Berichtshashes belegen die Originalbytes
beim Export, nicht nachträgliche Änderungen an weiterhin dekodierbaren Bildern.

## Konkretes Prüfartefakt vom 02.11.2026

- Unveränderter Quellcommit: `511dfcf743a6e8c4f0c36b3354dcf36d1afe865e`.
- Unveränderter Kandidat: `gk-catalog-release-v1-sha256-f9dbeb5e6be3664adcef72c1624615e7a016681cd4024ad0442fd54ec825497e`.
- Manifest SHA-256: `1dbded7d0ba7f97b2cc126e62bf64d822dca0d6e46045cdc2d5bfa307b479a68`.
- HTML: `.dev/catalog-relative-proof-511dfcf/proof/index.html`.
- Bericht: `.dev/catalog-relative-proof-511dfcf/proof/review-manifest.json`.
- ZIP: `.dev/catalog-relative-proof-511dfcf/Katalog-Korrekturfahne-relativ-511dfcf.zip`.
- Hintergrund `sea-blue-01`; 33 ausgewählte Motive aus 55 Bibliotheksassets,
  davon 24 unbefahrbar und 9 befahrbar, jeweils eine relative Detaildarstellung.

Der ursprüngliche Kandidat liegt weiterhin im bisherigen Kandidatenordner.
Die neue Fahne, Ressourcen, JSON und ZIP bleiben im ignorierten Entwicklungsordner
und werden nicht produktiv ausgeliefert. Die frühere Fahne ist ein altes
Prüfartefakt und wird durch diese Ausgabe ersetzt.

## Regression

```sh
node --test tests/contracts/catalog-proof.test.mjs
npx playwright test tests/browser/catalog-proof.spec.mjs --project=chromium
npm run test:unit
npm run test:assets
python3 tests/test_package.py
python3 scripts/package.py
```

Die neuen Fahnentests prüfen Auswahlgleichheit, relative Belegungsformen,
maßgebliche Overlaygeometrie, vollständige Mehrhexformen, Befahrbarkeit,
Reproduzierbarkeit, unveränderte Kandidatenbytes, Ressourcenfehler und Offline-
Bedienung. Sie sichern keine Kartenpositionen mehr ab. Die vorhandene
Asset-Einzelansicht ist wieder unverändert gegenüber der PR-Ausgangsbasis;
der nur für die frühere Fahne extrahierte absolute Overlaybaustein entfällt.
Die bestehenden historischen Katalog-, Release- und Geometrietests sowie die
CI-Ausführung bleiben erhalten.
