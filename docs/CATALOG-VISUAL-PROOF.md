# Vollständige Katalog-Korrekturfahne

Die Fahne ist ein offline nutzbares Prüfartefakt eines technisch verifizierten
Katalogkandidaten. Sie erteilt keine künstlerische oder formale Katalogfreigabe.
Manuelle Sichtprüfung und formale Freigabe bleiben eigene, ausstehende Schritte.

## Erzeugen

Voraussetzungen: Git, Node.js, Python 3 mit Pillow und NumPy, wie beim bestehenden
Kandidatenbau. Der Export selbst benötigt Pillow nur zum Dekodieren der Bilder.
Der Ausgabeordner muss neu sein; sein Elternordner muss bereits existieren.

```sh
mkdir -p .dev/catalog-visual-proof-511dfcf
node scripts/catalog-release.mjs build \
  --source 511dfcf743a6e8c4f0c36b3354dcf36d1afe865e \
  --out .dev/catalog-visual-proof-511dfcf/candidate
node scripts/catalog-release.mjs verify \
  --candidate .dev/catalog-visual-proof-511dfcf/candidate
node scripts/render-catalog-proof.mjs \
  --candidate .dev/catalog-visual-proof-511dfcf/candidate \
  --out .dev/catalog-visual-proof-511dfcf/proof \
  --background sea-blue-01 --expected-count 33
```

`--repository` unterstützt einen anderen Git-Datenbestand. Der Hintergrund kann
bei genau einem Kandidatenhintergrund entfallen. `--expected-count` ist eine
optionale Erwartungsprüfung: Abweichungen erscheinen sichtbar in HTML und JSON,
ohne die tatsächliche Auswahl einzuschränken.

`proof/index.html` direkt im Browser öffnen. Zum Weitergeben den **gesamten**
Ordner `proof/` mit `resources/` kopieren oder entpacken. Es gibt keine externen
Schriftarten, Netzwerkabrufe, Module oder Fetch-Aufrufe. JavaScript ist für
Detailnavigation, Positionswahl und Overlays erforderlich. Die Übersicht enthält
statische SVG-Vorschaubilder aller ausgewählten Motive.

## Bedienung und Geometrie

Eine Kachel öffnet die Detailprüfung. Vorheriges/nächstes Motiv und die Rückkehr
zur Übersicht erhalten den Vergleichskontext. Spielhexgrenzen (gelb) und erlaubte
Grafikflächen (türkis) lassen sich unabhängig schalten; „Normalansicht“ blendet
beide aus. Die Positionswahl nennt Anker, belegte Zellen, Zeilenparität und
Rand-/Innenlage. „Gesamte Karte“ wechselt nur den SVG-Viewport; die vergrößerte
Standardansicht zeigt das vollständige Assetrechteck mit Umgebung.

Wiederverwendete Komponenten:

- `loadCatalogReleaseCandidate`: neuer, ausschließlich lesender Zugriff auf
  dieselbe strenge Dokument-/Git-Verifikation wie `catalog-release verify`.
  Die tatsächliche `selection.json`, Bibliothek und Ressourcen werden aus dem
  verifizierten Snapshot übernommen, ohne Arbeitsverzeichnis-Fallback.
- `reviewPositions`: unveränderte deterministische Auswahl des ersten Ankers je
  vorhandener Kombination aus Zeilenparität und Rand-/Innenlage. Keine künstlichen
  Positionen. Ausrichtungen gehören zu den festen Assetdefinitionen.
- `drawAssetPlacements` / `assetRectangle`: dieselbe Bildplatzierung wie im Spiel.
- `drawAssetReviewLayers`: aus der bisherigen Einzelprüfung extrahierte gemeinsame
  Overlays. Spielgrenzen stammen direkt aus `HEXES[].polygon`; Grafikflächen aus
  `placementContract`, mit derselben Translation wie zuvor. Keine Rundung und
  keine Rand-Sonderregeln. Die Einzelprüfung nutzt nun denselben Baustein.
- `elementFactory` / `decodeContactImages`: vorhandene statische SVG-Serialisierung
  und Bilddekodierung der Karten-Kontaktübersicht.

Der Export verweigert abweichende Geometrie-/Renderer-Quellhashes zwischen
Programm und Kandidat. Die zulässigen Anker werden mit der verifizierten
Kandidatenevidenz verglichen. Das verhindert eine stillschweigende Interpretation
historischer Kandidaten durch andere aktuelle Spielverträge.

## Vollständigkeit und Fehler

`review-manifest.json` bindet Quellcommit, Kandidaten-ID, Manifest- und
Selektionshash, Hintergrund sowie die exakte geordnete Assetauswahl. Pro Motiv
stehen Status, Befahrbarkeit, Hex-/Ankeranzahl, tatsächliche Prüfpositionen und
fehlende Lageklassen. Ressourcen sind mit Herkunft und SHA-256 aufgeführt.

Ein Darstellungsfehler erzeugt eine ausdrücklich fehlerhafte Kachel und einen
Berichtseintrag. Die CLI liefert dann Exitcode 1; die Fahne bleibt als unvollständig
markiertes Diagnoseartefakt erhalten. Ungültige Kandidaten werden vor dem Export
abgewiesen. Beschädigte oder fehlende kopierte Bilddateien meldet auch die
HTML-Fahne beim Öffnen an allen betroffenen Motiven. Diese Browserdiagnose prüft
Dekodierbarkeit; die Dateihashes dokumentieren die Originalbytes beim Export.

## Konkretes Prüfartefakt vom 31.10.2026

- Festgelegter aktueller `main`: `511dfcf743a6e8c4f0c36b3354dcf36d1afe865e`
  (einschließlich des gemergten PR #97).
- Kandidat: `gk-catalog-release-v1-sha256-f9dbeb5e6be3664adcef72c1624615e7a016681cd4024ad0442fd54ec825497e`.
- Manifest-Hash: `1dbded7d0ba7f97b2cc126e62bf64d822dca0d6e46045cdc2d5bfa307b479a68`.
- Lokale HTML-Fahne: `.dev/catalog-visual-proof-511dfcf/proof/index.html`.
- Bericht: `.dev/catalog-visual-proof-511dfcf/proof/review-manifest.json`.
- 55 Bibliotheksassets; Auswahl für `sea-blue-01`: 33 geografische Motive,
  davon 24 unbefahrbar und 9 befahrbar; 674 zulässige Anker, 130 Prüfpositionen.
- Alle 33 Motive erfolgreich dargestellt; Vollständigkeitsprüfung bestanden.
- `land-coast.island.h4.long-sand.v1` hat für beide Paritäten keine Innenlage.
  Die übrigen Motive besitzen alle vier Lageklassen.

Kandidat und konkrete Ausgabe liegen ausschließlich unter dem ignorierten
Entwicklungsordner. Sie gehören weder zum Git-Quellbestand noch zum regulären
Deployment-ZIP. Die Befehle oben reproduzieren die Ausgabe mit denselben
Kandidatenbytes. Ein späterer Kandidatenbau kann bei anderen Werkzeugversionen
eine andere Kandidaten-ID erhalten; diese Versionen gehören zur bestehenden
Release-Identität.

## Automatische Prüfung

Neue Vertragstests: `node --test tests/contracts/catalog-proof.test.mjs`.
Offline-Browserprüfung: `npx playwright test tests/browser/catalog-proof.spec.mjs
--project=chromium`. Sie öffnet die erzeugte Datei über `file://`, prüft alle
Motive und Positionen, unabhängige Overlays, Navigation, Zoom und defekte/fehlende
Ressourcen. Ein Browser mit Zugriff auf lokale Dateien ist erforderlich.

Zusätzlich prüfen die bestehenden Asset-/Release-/Geometrieverträge und
`tests/test_package.py` die Integration. Der Verpackungstest legt private
Prüfdateien an und bestätigt, dass sie nicht ins Spielpaket gelangen.

Es wurde kein neuer Katalog freigegeben oder archiviert. Es wurden keine
Assetdefinitionen, Motivauswahlen, Spielengine-, Generator- oder Solverdateien
geändert.
