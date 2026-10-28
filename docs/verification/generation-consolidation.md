# Generatorarchitektur: Konsolidierungsnachweis

Arbeitsbasis: `dfe5865949cb817609c310c4897b83382dda735f` (aktueller `main` nach
PR #86 und #88). Beide Mergecommits wurden vor Änderungen als Vorfahren von
`origin/main` geprüft. Implementierung und realer Batch:
`7d95afc5032129e6b27e58ea28e2969367e596f5`. Es wird nichts gemergt oder veröffentlicht.

[Einziger aktueller Vertrag](../CATALOG-COMPLIANT-GENERATION.md) ·
[Maschinenlesbare Messdaten, Stichproben und Dateihashes](generation-consolidation.json) ·
[Desktopaufnahme](../reviews/contact-sheet/consolidated-desktop.jpg) ·
[Mobile Aufnahme](../reviews/contact-sheet/consolidated-mobile.jpg).

## Architekturentscheidung und entfernte Verträge

Die bisherige kataloggerechte Generierung ist jetzt der einzige Generatorweg.
`generateMap` verlangt ein Kapazitätsprofil und hat keinen Modusparameter.
Der Kandidatenbauer wählt ausschließlich passende verfügbare Katalogplatzierungen
mit Objektabstand. Wachstum, Präferenzwürfe und Rückfall auf freie Formen entfallen.
`assignAssets` hat keine Wiederverwendungspolitik als Option mehr: immer globale
Zuordnung, unbefahrbare Motive einmal, befahrbare zuerst möglichst verschieden.
Unvollständige Zuordnungen bleiben diagnostizierbar und werden verworfen.

Batch und Replay verwenden ausschließlich Zielzahl, explizites Budget und die
ursprünglichen Versuchsindizes. Der Batchdatensatz enthält immer Annahmeentscheidung
und Gründe. Die Diagnose nutzt denselben Datensatzbauer und dieselben Aggregate;
das rein freie Stichprobenskript entfällt. Die Kontaktübersicht hat nur noch
`--accepted-indices`, keinen Format-/Modusdispatch, keine magentafarbenen Platzhalter
und keinen regulären Renderweg für `partial`/`none`. Sie prüft alle konkreten
Zuordnungen und sämtliche zusammengefassten Metriken, auch bei unselektierten Zeilen.

**Format 3 ist wegen einer tatsächlichen Strukturänderung erforderlich.** Entfernt
werden die gespeicherten Felder `options.mode`, `options.preferencePercent`,
`versions.catalogGenerator`, `config.maxPlacementAttempts` und die wirkungslosen
Diagnosezähler `preferenceDraws`, `growthPlacements`, `catalogMisses`.
Der Objektplatzierungsversuch wählt direkt eine verfügbare Position; das alte
Wachstumsversuchsbudget hatte hier keine Wirkung. Der neue Generatorbezeichner
`catalog-compliant-maps-2` bezeichnet diesen kleineren Ergebnisvertrag.
Die Zufallsdomänen bleiben unverändert. Es gibt weder Migration noch Leser für
die alten Batchformate. Historische Dateien gehören zu ihren aufgezeichneten Commits.

Hexgeometrie, allgemeine geografische Validierung, deterministischer Zufall,
Formidentität, Releaseprüfung, Asset-/Grafikverträge, Fingerprints sowie veröffentlichte
Rätsel- und Laufzeitverträge bleiben erhalten. `src/engine/`, `src/puzzles/`,
`src/ui/`, `puzzles/`, `assets/` und `archive/` sind gegenüber der Arbeitsbasis unverändert.
Die Engine erhält keine allgemeine Abstands- oder Bebilderungspflicht.

## Realer Batch und unabhängiger Vergleich

| Kennzahl | Neuer Lauf |
| --- | ---: |
| Ziel / äußeres Versuchsbudget | 1.000 / 5.000 |
| Innere Versuche je Seed | explizit 1 |
| Tatsächliche Versuche | 1.403 |
| Akzeptiert / verworfen | 1.000 / 403 |
| Annahmequote | 71,2758 % |
| Vollständig belegte und geografisch gültige Ergebnisse | 1.000 |
| Unterschiedliche Fingerprints / Dubletten | 997 / 3 |
| Karten mit Motivwiederholung | 0 |
| Über den Lauf genutzte Motive | alle 18 |
| Mit dem Ausgangsstand vollständig verglichene Versuche | alle 1.403 |

Der gesamte gespeicherte Versuchsstrom wurde gegen den unveränderten
`catalog-compliant`-Datensatzbauer im separaten Checkout von `dfe5865` verglichen.
Für diesen einmaligen historischen Vergleich wurden ausschließlich der neue
Diagnosebezeichner und die ausdrücklich entfernten Diagnose-/Konfigurationsfelder
berücksichtigt. **Geografien, Analyseergebnisse, beide Seedfolgen, Fingerprints,
konkrete Belegungen, Annahmeentscheidungen und Verwerfungsgründe stimmen für alle
1.403 Versuche vollständig überein.** Es gibt keine Veränderung des Generierungsverhaltens.
Die Kennzahlen aus PR #88 ergeben sich erneut ohne Anpassung an diese Zielwerte.
Dieser Vergleichscode liegt nicht als produktiver Kompatibilitätspfad im Repository.

Alle 1.000 Ergebnisse wurden zusätzlich mit `validateMap(...,{separateObjects:true})`,
`validatePlacements`, erneutem Fingerprint und deterministischer kompletter
Assetzuordnung geprüft. Unbefahrbare Motive sind global je Karte einmalig.
Alle Ränder und alle vier Ecken werden genutzt. Sämtliche Verwerfungen betreffen
erschöpfte Objektplatzierungen unter dem Abstand; keine nachträglich unvollständige
Belegung wurde akzeptiert. CLI-Replays der Originalversuche 0 (verworfen), 1,
685 (Ergebnis 500) und 1402 (Ergebnis 999) stimmen bytegleich überein.

Die Kontaktübersicht zeigt 24 explizite Ergebnisindizes über den gesamten Lauf.
Ergebnis 0 gehört zu Versuch 1, Ergebnis 999 zu Versuch 1402. In Chromium 156 und
WebKit 27.2 wurden jeweils auf Desktop und Mobil alle **144 Bildverwendungen**
dekodiert und mit gespeicherten Belegungen, Ankern und exakten Grafikrechtecken
abgeglichen: keine Transformationen, Platzhalter, Bildfehler, Netzwerkanfragen,
Seitenfehler oder horizontaler Überlauf. Die Desktopaufnahme zeigt einen Ausschnitt;
die Prüfung umfasste alle 24 Karten.

## Reproduktion

Am aufgezeichneten Programmcommit arbeiten; spätere Test-/Nachweiscommits
ändern die Generierungsimplementierung nicht. Beispiel in einem neuen Checkout:

```sh
git checkout 7d95afc5032129e6b27e58ea28e2969367e596f5
printf '{"maxMapAttempts":1}\n' > /tmp/gk-config.json
node scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 --target-count 1000 --max-attempts 5000 \
  --seed-start 0 --assignment-seed-start 100000 \
  --config /tmp/gk-config.json --out /tmp/gk-batch
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/gk-batch --index 0 --out /tmp/gk-replay-0.jsonl
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/gk-batch --index 1402 --out /tmp/gk-replay-1402.jsonl
node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gk-batch \
  --accepted-indices 0,1,2,3,4,5,6,7,8,9,10,11,50,100,200,300,400,500,600,700,800,900,998,999 \
  --out /tmp/gk-kontakt
```

Dateihashes im JSON binden den vollständigen Batch und die Kontaktressourcen.
Die Stichprobe hält Geografie, konkrete Belegungen und SHA-256 der vollständigen
Originalzeilen fest; rohe Batchdateien werden nicht als zusätzliche Fixtures eingecheckt.
Für bytegleiche Provenienz und HTML ist derselbe Archivcommit maßgeblich;
spätere Archivcommits ändern ansonsten nur Provenienzfelder.

## Tests

Die bisherigen fachlichen Prüfungen wurden auf den einzigen Vertrag übertragen:
256 Seeds mit allen Größen/Befahrbarkeiten im synthetischen Katalog, globale
Zuordnungsengpässe, Umlegen von Zuordnungen, bevorzugte Vielfalt/Wiederverwendung,
Ränder/Ecken, strikte Profilprüfung, unabhängige Komponenten-/Routenergebnisse,
Suchbudgets und Filter, deterministische Wiederholungen, Zielzahl und erschöpfte
Budgets, Seed-/Indexzuordnung, Replay nach Abbruch, Programm-/Releaseidentität,
Schreibfehler sowie strenge Kontaktübersicht inklusive 1.000-Ergebnis-Strom.
Nur Tests der entfernten Betriebsalternativen wurden entfernt. 23 eingefrorene
Zuordnungsfälle stammen nun unabhängig aus dem bereits vorhandenen
`catalog-assignment-1` am Ausgangscommit; gemeinsame Platzierungs-/Fehlervektoren
bleiben erhalten.

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:unit` | 192 / 192 bestanden |
| `npm run test:content` | 20 / 20 bestanden |
| `npm run test:puzzles` | Probefahrt unverändert eindeutig |
| `npm run test:assets` | 40 Assets / 3 Hintergründe, 40 Bildverträge und 25 Python-Tests bestanden |
| `python3 tests/test_package.py` | 18 / 18 bestanden |
| `npm run test:browser` | 320 / 320 Chromium-Tests (Desktop und Mobil) bestanden |
| WebKit, `contact-sheet.spec.mjs` | 6 / 6 bestanden (Desktop und Mobil) |
| Reale 24-Karten-Sichtung | vier Browser-/Viewportkombinationen mit je 144 erfolgreich dekodierten Bildern |
| Alpha-Normalisierer-Selbsttest und `check-chart-assets.py` | bestanden, keine Pixeländerungen |
| Entwicklungsserver-Selbsttest | No-Cache-HTTP-Vertrag bestanden |
| Releasearchiv gegen `dfe5865` | ein bestehender Release unverändert gültig |
| Zusätzliche Abschlussprüfungen | 36 Batch-/Replay-/Kontakttests, 20 Generator-/Optionsprüfungen und 10 Releasekontexttests bestanden |
| `git diff --check` | bestanden |

Der erste vollständige WebKit-Anlauf unter gleichzeitiger CPU-Last wurde nach
zwei Zeitüberschreitungen in bestehenden nativen SVG-Klicktests beendet
(1 unterbrochen, 317 nicht ausgeführt). Der unveränderte Ausgangsstand `dfe5865`
reproduziert denselben Stabilitäts-/Klicktimeout in
`chart-ux.spec.mjs` / „distance phases announce selection, cancel and preserve notes“;
der erste Koordinatentest besteht dort knapp (28,6 Sekunden). Das betrifft die
bereits unveränderte Spieloberfläche bei DPR 2, nicht die Kontaktübersicht.
Ein separater vollständiger Wiederholungsanlauf mit einem Worker und einer Grenze
von fünf Fehlern läuft ohne konkurrierende Chromium-/Assetläufe; dessen Ergebnis
wird vor Abschluss ergänzt. Der vollständige Standard-WebKit-Lauf wird bis dahin
nicht als bestanden ausgegeben.

Lokal: Debian 13, zwei CPU-Kerne, Node 24.19.0, Python 3.12.14, Chromium 156,
WebKit 27.2. Fehlende WebKit-Systembibliotheken wurden ausschließlich lokal aus
Debianpaketen unter `/tmp` ergänzt und im Browsercache verlinkt. Da der systemweite
Linkercache diese lokalen Bibliotheken nicht kennt, wurde die Playwright-
Hostvorprüfung übersprungen; die tatsächlichen Binärabhängigkeiten lösen auf und
der Browser wurde vollständig gestartet. Keine Repository-/CI-Konfiguration oder
Oberflächenassertion wurde dafür geändert. Die getrennten Standardrunner nutzen
lokal unterschiedliche HTTP-Ports 4173/4174; die Testmatrix bleibt dieselbe.

## Gezielte Altlastensuche

Gesucht wurde in `src/`, `scripts/`, `tests/`, aktiver und historischer Dokumentation
sowie den JSON-Nachweisen nach `free`, `catalog-informed`, `catalogInformed`, alten
Modus-/Präferenzparametern, Formaten 1/2, `--indices`, Platzhaltern, Kompatibilitäts-
und Fallbackpfaden. Zusätzlich wurden alle tatsächlichen Aufrufer von
`generateMap`, `createCatalogProfile`, `assignAssets`, Batch, Replay und Kontaktübersicht geprüft.

| Verbleibende Referenzen | Bewertung |
| --- | --- |
| Generator-/Batch-/Diagnose-/Kontaktimplementierung | Keine historischen Modusparameter, Strategieverzweigungen, alten Batchleser oder Bildplatzhalter. Die eine aktuelle Formatkonstante und strikte Versionsprüfung bleiben erforderlich. |
| Negative Tests in `target-map-batch`, `map-batch`, `generation`, `target-contact-sheet`, `map-contact-sheet` | Alte/unerlaubte Optionen und gespeicherte Formate müssen ausdrücklich scheitern; keine Erfolgstests historischer Verträge. |
| `scripts/lib/catalog-release-v1.mjs`, `catalog-release-format.mjs`, `docs/CATALOG-RELEASES.md` | Format 1 bezeichnet freigegebene **Katalog-Releases**, nicht Batches. Unverändert erforderlicher Freigabevertrag. `object-free sea` bezeichnet einen Bildprüftext. |
| `src/assets/library.mjs` und Releaseadapter | Bild-/Hintergrundkompatibilität und Platzierungsvalidatoren bleiben fachliche Freigabeprüfung; kein Generierungsmodus. Fehlende Freigaben erhalten weiterhin keinen Fallback. |
| `src/ui/chart-asset-contract.mjs`, UI-/Koordinatentests | Schriftmetriken und Koordinatenersatztexte sind unabhängige Darstellungsthemen. |
| `tests/content/flavor-prototypes.test.mjs`, `assignment-cases` (`decoration-free`) | Freie dekorative Motive beziehungsweise freie Dekorationsplatzierung sind keine freien Generierungsstrategien. Bestehende Asset-/Rätselverträge bleiben unangetastet. |
| `docs/MAP-GENERATION-F04B.md`, `verification/F04b-*`, `verification/graphic-contract-A*`, `verification/catalog-compliant-batch.*`, `reviews/contact-sheet/catalog-compliant.*` | Ausdrücklich historische Nachweise. Markdown trägt einen Hinweis; JSON-Dateien sind im [Nachweisindex](README.md) eingeordnet. Keine aktive Dokumentation verfügbarer Alternativen. |
| `docs/CATALOG-COMPLIANT-GENERATION.md`, `MAP-BATCH-F04B.md`, `MAP-CONTACT-SHEET.md` | Nur Beschreibung der entfernten Felder, begründeter Versionsentscheidung und zurückgewiesenen Optionen. Alle aktuellen Beispiele verwenden den einzigen Weg. |
| Historische Publikations-/Konsolidierungs-, Grafik- und Reviewdokumente sowie Bildprompts | Andere Verträge oder historische Entscheidungen, ausdrücklich keine aktiven Generatorpfade. Identitäts- und veröffentlichte Rätselverträge werden erhalten. |

Die alten unvollständigen Beispielaufnahmen/-daten `reviews/contact-sheet/overview.jpg`
und `sample.json` wurden entfernt. Die erfolgreiche historische Format-2-Sichtung
bleibt als datierter Vergleich erhalten. `scripts/sample-maps.mjs` und seine reine
Vergleichssuite entfallen; gültige Analyse-/Filter-/Vielfaltsprüfungen wurden in
den aktuellen Generator- und Diagnosetests erhalten.

## Grenzen und Eignung für spätere Rätselgenerierung

Die Architektur ist als Grundlage geeignet: ein gültiger geografischer Kartenvertrag,
eine getrennte konkrete Motivbelegung, stabile Fingerprints, explizite Provenienz
und reproduzierbare Entscheidungen. Eine Rätselengine muss keinen historischen
Generierungsmodus kennen. Die gültigen Abstands-/Wiederverwendungsregeln liegen
im Generator beziehungsweise der Zuordnung, ohne alle allgemeinen Karten auf
diese Regeln festzulegen. Keine vorsorglichen Erweiterungsframeworks.

Begrenzte Packung beweist weder Unpackbarkeit noch Gleichverteilung oder
Einzigartigkeit. Menschliche Rätselqualität, Start-/Routenauswahl, Hinweiserzeugung
und redaktionelle Veröffentlichung bleiben offen. Die vollständige Streamprüfung
ist linear. Die Fingerprintmenge der Summenprüfung wächst mit der Zahl verschiedener
Karten; vollständige Kartendatensätze bleiben nur ausgewählt gespeichert.
Kontaktübersichten prüfen gespeicherte Analyseaggregate, berechnen
aber keine Geografie/Routensuche neu. Dafür steht Replay zur Verfügung.
