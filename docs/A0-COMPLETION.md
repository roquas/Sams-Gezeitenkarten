# A0 · Arbeitskatalog abgeschlossen

Auswahl vom 30.10.2026; technischer Abschluss am 31.10.2026. Basis: `cb559f31ec7a0bf739688ce6c128d18ee61c3477` (main nach PR #95).

Die ausdrücklich ausgewählten elf unbefahrbaren 2-Hex-Inseln aus Gestaltungslauf 5 sind mit ihren exakten finalen PNG-Bytes in den Arbeitskatalog integriert. Gefängnisinsel 02 (NO/SW) bleibt ausgeschlossen. Vier zuvor abgenommene unbefahrbare Einzelhexmotive und sechs verkleinerte/versetzte befahrbare Akzente bleiben bytegleich zu ihrer Auswahl. Keine weitere Grafikgenerierung oder Bildbearbeitung.

## Auswahl und aktueller Bestand

| Familie / Variante | Ausrichtung | Katalog-ID | Anker |
| --- | --- | --- | ---: |
| Nebelwald 01 | W/O | `land-coast.island.h2.mist-forest-01.v1` | 20 |
| Nebelwald 02 | NO/SW | `land-coast.island.h2.mist-forest-02.v1` | 18 |
| Nebelwald 03 | NW/SO | `land-coast.island.h2.mist-forest-03.v1` | 18 |
| Gefängnisinsel 01 | W/O | `land-coast.settlement.h2.prison-island-01.v1` | 20 |
| Gefängnisinsel 03 | NW/SO | `land-coast.settlement.h2.prison-island-03.v1` | 18 |
| Hüttensiedlung 01 | W/O | `land-coast.settlement.h2.hut-settlement-01.v1` | 20 |
| Hüttensiedlung 02 | NO/SW | `land-coast.settlement.h2.hut-settlement-02.v1` | 18 |
| Hüttensiedlung 03 | NW/SO | `land-coast.settlement.h2.hut-settlement-03.v1` | 18 |
| Aussichtsbucht 01 | W/O | `land-coast.island.h2.lookout-bay-01.v1` | 20 |
| Aussichtsbucht 02 | NO/SW | `land-coast.island.h2.lookout-bay-02.v1` | 18 |
| Aussichtsbucht 03 | NW/SO | `land-coast.island.h2.lookout-bay-03.v1` | 18 |

Nebelwald, Hüttensiedlung und Aussichtsbucht haben je drei Varianten; Gefängnisinsel hat 01 und 03. Die Orientierung steckt in der unveränderten axialen `geometry.cells`-Form. Alle elf sind `geographic`, `passable:false`, `stage:illustration`, `production:enabled`, Familie `land-coast`; Gefängnis und Hütten verwenden `semanticClass:settlement`, Wald und Aussichtsbucht `island`. Die Nummern 01–03 bleiben die Sichtungsnummern.

Arbeitsbestand: **55 Assets, 34 exakte Bild-/Hintergrund-Kunstfreigaben, 33 vorgesehene geografische Motive** auf `sea-blue-01` (24 unbefahrbar, neun befahrbar). Die freigegebene Schaumströmung bleibt zurückgestellt. Die elf Neuzugänge ergänzen 206 Anker; zusammen mit vier neuen Einzelhexen ergeben sich 674 vorgesehene Motiv-Anker-Kombinationen. Einschließlich historischer, zurückgestellter und technischer Einträge bestehen 1.153 geometrisch passende Katalogplatzierungen.

Die vier Einzelhexmotive sind Palmeninsel, geschlossenes Atoll, Cyan/magenta-Leuchtturminsel und Restaurantinsel. Die sechs Akzente sind Fässer, Boje, Ruderboot, Kiste, Flaschenpost und Treibholz/Seetang. [Vorherige Auswahl und exakte Hashes](reviews/a0-completion-2026-10-30/prior-approval-manifest.json) bleiben maßgeblich; das A0-Abschlussgate prüft diese zehn Bytes und ihre Freigabebindungen erneut.

[Auswahlbeleg Lauf 5 mit Quell-/Exporthashes und ausgeschlossener Variante](reviews/a0-completion-2026-10-30/approval-manifest.json). Die Nutzerfreigabe gilt ausschließlich für die exakt gesichteten Exporte auf `sea-blue-01` (Meerhash `e33cf0d09477e93588cfc209bb0ab9b224d7624139d707fede23a390b14f2582`). Die zwei anderen Hintergründe bleiben pending. Die Rohquellen, Versuche und bisherigen Kontakte bleiben in der vorhandenen lokalen Lieferung `output/a0-round5-2026-10-30/` erhalten; sie sind kein zusätzlicher Laufzeitbestand.

## Beschreibende Benennung

Katalogauswahl und Inventar zeigen jetzt **Motiv · Befahrbarkeit · Hexzahl · Familie**, beispielsweise „Nebelwald 02 · unbefahrbar · 2 Hex · Land/Küste“. Die Angaben kommen aus den gegenwärtigen Metadaten; Produktionsstatus und technische ID werden separat angezeigt. Die neuen Motivnamen sind in der vorhandenen redaktionellen Namensfunktion hinterlegt.

Bestehende IDs, Dateipfade und die separate Spiel-Ortsbenennung werden erhalten. `accent` in bestehenden IDs beschreibt keine abgeleitete Befahrbarkeit; maßgeblich sind `role`, `passable` und die tatsächliche Geometrie. Es entsteht kein Alias-/Migrationssystem und kein neuer Assettyp. Die historischen PR-65-Berichte tragen einen aktuellen Verweis, ihre damaligen Bestandszahlen bleiben historische Belege.

## Unveränderte Prüfregeln und Releasekette

„Hex ist gleich Hex“ gilt unverändert: vollständige Voronoi-Grafikflächen, vollständige Pixelquadrate bei jedem Alpha > 0 (einschließlich Alpha 1), bestehende numerische Toleranz, reine Translation in fester Orientierung. Alle geometrisch passenden Anker werden geprüft, einschließlich beider Zeilenparitäten sowie erreichbarer Rand-/Ecklagen. Kein neuer Flächenfilter, keine neue Mindestgröße, kein Wasserabstand, keine Rotation oder positionsabhängige Verkleinerung. Die Authoring-Skalen aus Lauf 5 sind Provenienz und keine Bestehensregeln.

Geometrie, Renderer, Bildprüfer, fachliche Bibliotheksprüfung, Release-V1-Auswertung, Releaseadapter und Diagnosewerkzeug bleiben bytegleich zur Basis. Bestehende Regressionen ändern ausschließlich ihre aktuellen Bestandszahlen: 847 → 1.153 Gesamtplatzierungen, 368 → 674 Anker in der isolierten Testkatalog-Fixtur und 19 → 34 aktuelle Kunstfreigaben. Der historische echte Release bleibt bei **40 Assets, 18 Motiven, 368 Ankern und 154 Profilplatzierungen**; seine Tests und Referenzberichte werden nicht angepasst.

PR #81 (Release), #82 (archivierte Freigabe), #83 (Adapter) und #84 (Diagnose) sind zusammengeführt. Ihre realen Release-, Integritäts-, Git-only-, Alt-/Neu-, Positions- und Diagnose-Regressionen werden im vollständigen Unitgate tatsächlich ausgeführt. Nach PR #84 wurde die Diagnose auf main durch `7d95afc` bereits auf den konsolidierten Generierungsvertrag umgestellt. Daher werden zwei Nachweise getrennt geführt: aktuelle Ausgabe gegen den unveränderten Basis-main (nach Abtrennung der Provenienz) sowie historische PR-84-Ausgabe gegen `docs/verification/graphic-contract-A-catalog-sample.json`. Die alte Zweimodus-Referenz ist kein Bytevergleichsmaßstab für das heutige Berichtsformat. A0 ändert weder Format noch Messregeln.

Die Kunstfreigaben und `production:enabled` im Arbeitskatalog sind keine neue archivierte Releasefreigabe und keine produktive Veröffentlichung. Ein neuer Kandidat kann aus dem Integration-Commit technisch gebaut und verifiziert werden; `approve` wird für diesen Projektstand nicht ausgeführt. Eine neue reguläre Freigabe und ein Merge bleiben separate Entscheidungen.

## Prüfresultate und Freigabestatus

Abgeschlossen: **254/254 Unit-/Vertrags-/Integrationstests**, vollständiges Assetgate mit **55 Bildern und 25 Python-Regressionen** (14 Bild-, vier Rahmen-, fünf Export- und zwei Wasserprüfungen), **20/20 Inhaltstests**, **19/19 Pakettests**, **2/2 Browserprüfungen** (Chromium Desktop/Mobil), unverändert eindeutige Demo und beide Rahmenprüfungen. Archivprüfung und beide Diagnose-Bytevergleiche bestehen. [Maschinenlesbarer Prüfbeleg mit Werkzeugversionen, Loghashes und Umgebungsbefunden](reviews/a0-completion-2026-10-30/verification.json).

Der erste vollständige Unitlauf hatte 194 bestandene und 60 fehlgeschlagene Tests durch macOS-Pfadaliase für temporäre Verzeichnisse; dieselbe Suite besteht mit `TMPDIR=/private/tmp/a0-tests-2026-10-30` vollständig. Es wurde dafür kein Programmcode oder Prüfkriterium geändert. Der neue Browsertest wurde einmal von relativen auf die bereits vom Renderer verwendeten absoluten Bild-URLs korrigiert und danach erfolgreich wiederholt. Lokale Kandidaten-/Testfreigaben aus den bestehenden Regressionen liegen ausschließlich in isolierten temporären Repositories. Projektarchive und produktive Veröffentlichung werden nicht verändert.

Künstlerischer Status: die elf Motive sind durch die ausdrückliche Nutzerentscheidung abgenommen; Gefängnisinsel 02 ist nicht übernommen. Technischer Integrationsstatus: siehe Prüfbeleg. Keine unabhängige Review oder Mergefreigabe wird durch diese Dokumentation behauptet.

## Anschluss

[A4: wiederverwendbare Assetproduktionspipeline](BACKLOG-A4.md) ist ausschließlich als künftiger Backlogpunkt erfasst. A1–A3 bleiben bereits vergeben. Der nächste Arbeitsfokus ist die erste spielbare Testvariante.
