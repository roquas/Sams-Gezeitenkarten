# Assetbibliothek PR #65 – abschließende Konsolidierung

Stand: 20.10.2026. Künstlerische Produktion vorerst abgeschlossen. Ausschließlich Arbeitsbranch `feature/asset-library-integration`; kein Merge, keine Änderung an `main`, keine neuen oder geänderten Grafiken, keine Generatoränderung und keine Flavor-Implementierung.

## A. Inventar und Freigaben

Das [vollständige Inventar](ASSET-INVENTORY-65.md) enthält **alle 40 Katalogeinträge** mit Motivname, technischen Rollen, Hexzahl/Befahrbarkeit, Dateiverweisen, künstlerischem Status, Hashprüfung und produktiver Verwendbarkeit. Ergänzend dokumentiert es acht Legacy-Zuordnungen, drei Meeresdateien und 13 weitere Grafikdateien. Die [maschinenlesbare Übersicht](reviews/consolidation/full-inventory.json) enthält sämtliche vollständigen SHA-256-Werte und Hintergrundreviews.

| Gruppe | Anzahl | Künstlerischer Status | Produktiv auf sea-blue-01 |
|---|---:|---|---|
| Unbefahrbare Orte: wasserreiche Felsnadel, Palmenbuchten, Glutberg, Sandriffbogen, Südhafen, Schmugglerbucht, Langer Strand, Tempel der Gezeiten, Tesoro v4 | 9 | approved, exakte Bild-/Meer-Bindungen geprüft | Ja |
| Befahrbare Orte: Leuchtturm, zerbrochenes Atoll, Wrack, Fässer, Boje, Ruderboot, Kiste, Flaschenpost, Treibholz/Seetang | 9 | approved, exakte Bild-/Meer-Bindungen geprüft | Ja |
| Sanfte Schaumströmung v1 | 1 | approved bleibt erhalten | **Nein, zurückgestellt** |
| Seevögel/Delfine v2, fünf weitere Wasserillustrationen, Schildkröte | 8 | pending, keine Approval-Hashes | Nein, zurückgestellt |
| Frühere Seevögel/Delfine, Sandriffbogen-Entwurf, Krabbenzange v1/v2, Tesoro v1–v3 | 8 | pending, keine Approval-Hashes | Nein, historisch |
| Reduzierte Felsnadel | 1 | pending, keine bestätigte Freigabe | Nein, Entwurf |
| Technische Platzhalter | 4 | pending, keine künstlerische Freigabe | Nein |

Alle **19 Freigabepaare und alle 110 Review-Einträge** wurden unverändert bewahrt. Alle **59 vorhandenen Raster-/SVG-Dateien unter assets/** sind bytegleich zum letzten künstlerischen Stand `ad575f7`. Kein Hash wurde auf eine andere Bildversion übertragen. Keine aktuelle Freigabe erwies sich als veraltet; kein bestätigtes Motiv musste erneut zur Prüfung gestellt werden. [Prüfbeleg](reviews/consolidation/preservation-audit.json).

Der ausschließlich freigegebene Meeresuntergrund hat SHA-256 `e33cf0d09477e93588cfc209bb0ab9b224d7624139d707fede23a390b14f2582`. Auf beiden anderen Hintergründen bleiben sämtliche modernen Illustrationen ungefreigegeben.

„Produktiv: Ja“ bedeutet zulässig für spätere Karteninstanzen; bestehende Rätseldokumente wurden nicht auf neue Illustrationen umgestellt. Die expliziten Legacy-Ausnahmen bestehender Karten bleiben erhalten. Sie sind kein neuer Auswahlpfad für ungefreigegebene moderne Illustrationen und erhalten hier keine nachträgliche moderne Hashfreigabe.

## Produktive Verwendung und Galerie

Die künstlerische Freigabe entscheidet nicht allein über die aktuelle Verwendung. Das Katalogfeld `production` führt ausschließlich die Verwendungsentscheidung (`enabled`, `draft`, `historical`, `deferred`). Es ist **kein neuer technischer Assettyp**. Produktive Platzierungen benötigen eine Illustration, `enabled` und eine Freigabe für den konkreten Hintergrund. Fehlende Angaben werden abgewiesen. Pauschale Freigaben für `*`-Hintergründe sind nicht zulässig; sie können keine Freigabe auf neue Meeresdateien übertragen. Der bestehende Lader und die Veröffentlichungskontrolle prüfen diese Bedingungen. Die Schaumströmung bleibt damit künstlerisch approved und wird trotzdem zuverlässig aus produktiven Karten ausgeschlossen.

Befahrbarkeit bleibt unabhängig vom Grafiktyp. Ob ein befahrbarer Ort tatsächlich in einem Hinweis referenziert wird, entscheidet die Karteninstanz beziehungsweise der Rätselgenerator. Ein solcher Ort kann auch ohne logischen Ortsverweis platziert werden. Alle atmosphärischen Illustrationen bleiben gemäß [Issue #70](https://github.com/roquas/Sams-Gezeitenkarten/issues/70) zurückgestellt. Keine automatische oder zufällige Dekorationsplatzierung wurde ergänzt. Issue #68 und die nächste Generatorphase bleiben unberührt.

Die [bestehende Galerie](../dev/asset-library.html#minigrafiken) zeigt die Wasserentwürfe ausdrücklich als zurückgestelltes Archiv und eine vollständige Tabelle mit getrennter Kunstfreigabe und produktiver Verwendbarkeit. Entwicklungsansichten dürfen die Entwürfe weiterhin darstellen. Vier Browserkonfigurationen bestätigen jeweils 40 Einträge, 18 produktiv vorgesehene Orte und die approved, aber gesperrte Schaumströmung. [Browserbeleg](reviews/consolidation/browser-inventory-audit.json).

## B. Technische Prüfung

| Prüfung | Ergebnis |
|---|---|
| Katalogschema, vorhandene Dateien, exakte Approval-Hashes | 40 Assets, 3 Hintergründe, 19 gültige Freigabepaare |
| Unit-Regression einschließlich produktiver Sperre, aller legalen Anker, optionaler Ortsreferenzen und Lader | 112/112 bestanden |
| Bestehende Rätsel und unabhängiger Solver | 4/4 weiterhin eindeutig lösbar |
| Grafikvertrag: Meer, beide Rahmen, Alpha-Normalisierung und No-cache-Entwicklungsserver | bestanden; Serverprüfung mit erlaubtem lokalen Netzwerkzugriff wiederholt |
| Vollständige Alpha-/Pixelquadrat- und Geometrieprüfung aller Illustrationen an allen gültigen Brettpositionen | **13/13 Bildregressionen bestanden**, einschließlich aller legalen Brettpositionen und Pixelquadrate |
| Export-/Flächenregression und zusätzliche Wasserillustrationsregression | 5/5 und 2/2 bestanden |
| Galerie-Browsermatrix Chromium/WebKit, Desktop/Mobil | 40/40 bestanden; nach Verbesserung der Abstände der Statuszeilen zusätzlich 8/8 betroffene Fälle bestanden |
| Vollständiges Paket einschließlich Fehlerfixtures | 28/28 bestanden, einschließlich Erhalt eines vorherigen ZIPs bei abgewiesener Platzierung |
| Tatsächlich erzeugtes ZIP | 100 Dateien, alle 40 Katalogbilder bytegleich; korrekte Verwendungsentscheidungen, keine Entwicklungs-/Archivdateien |
| ZIP im Browser unter Unterpfad, Desktop/Smartphone/iPhone/iPad | 4/4 bestanden, einschließlich produktiver Sperre für approved-Schaumströmung |
| Früherer Chromium-Touch-Scroll-Ausreißer bei 820 px, gezielte lokale Wiederholung | bestanden; keine Änderung an Eingabe-/Spielcode |

[ZIP-Prüfbeleg](reviews/consolidation/package-audit.json). Der endgültige GitHub-Lauf nach dem Konsolidierungs-Push wird in der PR-Beschreibung mit Commit und Ergebnis verlinkt; laufende oder fehlgeschlagene Jobs werden nicht als bestanden gewertet.

## C. Offene Integrationspunkte

1. **Archivtest auf aktuellem main:** Nach Behebung der fehlenden Pillow-Abhängigkeit durch Commit `185f2b8` läuft die bisher verdeckte Prüfung tatsächlich und erwartet fälschlich, dass das heutige Paket exakt den Umfang der alten Veröffentlichung behält. Die hinzugefügten 40 Katalogbilder, der Katalog und fünf Laufzeitmodule müssen ausdrücklich als Erweiterung berücksichtigt werden. Das historische Inventar darf nicht verändert werden. Der [konkrete Integrationspatch](reviews/consolidation/publication-closure-integration.patch) erhält die exakte Paketprüfung als Vereinigung des eingefrorenen Altbestands und der registrierten neuen Bibliothek. Der Test und die Archivwerkzeuge existieren nur auf dem inzwischen weiterentwickelten `main`, nicht auf diesem PR-Branch. Der Patch wird daher zur unabhängigen Integration bereitgestellt, ohne einen Basis-Merge oder eine erzwungene Branch-Umschreibung vorzunehmen. Separate lokale Prüfung in einem temporären Verzeichnis mit dem Archivtest und den Archivwerkzeugen von `main` (`64cd600`), unveränderten historischen Belegen und der aktuellen Bibliothek: **21/21 Archivtests bestanden**. Der Patch verändert weder die Archivdaten noch die erwarteten Altdateien und erlaubt keine beliebigen zusätzlichen Dateien.
2. Der frühere Chromium-Lauf meldete einen beim Wiederholungsversuch bestandenen Touch-Scroll-Test als flaky (464 bestanden, drei übersprungen). Die CI behandelt flaky Tests ausdrücklich als Fehler. Der gezielte lokale Wiederholungstest besteht; entscheidend bleibt der vollständige neue CI-Lauf.

Die zurückgestellten künstlerischen Entscheidungen sind **keine Merge-Voraussetzung**, weil ihre produktive Verwendung gesperrt ist. Es gibt keine neue oder ungeklärte Freigabe eines vorgesehenen Produktionsassets.

## D. Merge-Einschätzung

**Bereit für eine unabhängige Integrationsreview; noch nicht zur unmittelbaren Zusammenführung freigegeben.** Vor einem Merge sind die auf aktuellem `main` ergänzte Archivtest-Erwartung mit der Assetbibliothek zu integrieren und die vollständigen GitHub-Prüfungen erfolgreich abzuschließen. Der Integrationspatch liegt konkret vor. Die Assetproduktion selbst ist abgeschlossen; die nächste Phase der abstrakten Basiskarten und des Rätselgenerators wurde nicht begonnen.
