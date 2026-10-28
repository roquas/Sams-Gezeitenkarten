# F04b PR3: lokale Kartenbatches (Format 1)

Der ausdrücklich gewählte Modus `catalog-compliant` ergänzt einen separaten
[Zielzahlvertrag in Format 2](CATALOG-COMPLIANT-GENERATION.md). Der hier
beschriebene versuchszählende Format-1-Vertrag bleibt erhalten.

`scripts/generate-map-batch.mjs` führt eine feste Anzahl Aufrufe des bestehenden
`generateMap` aus. Jede zurückgegebene Karte erhält separat `assignAssets`.
Geografische Gültigkeit, grafische Abdeckung, spätere Rätselqualität und visuelle
Abnahme bleiben getrennt. Es gibt keine Veröffentlichung oder Spielanbindung.

## Voraussetzungen und Aufruf

Node 22+, Git und die Quellhistorie des ausdrücklich gewählten freigegebenen
Katalog-Releases. Lauf und Replay verwenden `loadReleasedAssetCatalog` und
benötigen kein Netzwerk, Python, Pillow oder Arbeitskopien der Katalogbilder.
Die Dateien unter `src/` und `scripts/` im **Programmcheckout** müssen sauber
und eingecheckt sein, einschließlich neuer Dateien. Der Programmcommit wird
aufgezeichnet. Änderungen nur an anderen Dateien sind keine Codeänderung;
ein anderer HEAD wird beim Replay trotzdem ausdrücklich abgewiesen.

Beispiel aus einem eingecheckten Programmstand, Ausgabe außerhalb des Repositorys:

```sh
node scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 \
  --count 1000 --seed-start 0 \
  --out /tmp/gezeitenkarten-batch
```

Pflicht: `--release`, `--background`, `--count`, `--seed-start`, `--out`.
Optional:

| Option | Verhalten |
| --- | --- |
| `--assignment-seed-start N` | Eigene Seedfolge für Bilder; Default ist `--seed-start` |
| `--mode free` | Default, ohne Katalogprofil |
| `--mode catalog-informed` | Explizites geografisches Profil aus dem Release |
| `--preference-percent N` | 0–100, Default 75; nur im Profilmodus |
| `--config PATH` | JSON mit vorhandenen Generatoroptionen; vollständig normalisiert gespeichert |
| `--repository PATH` | Git-Datenrepository für den Release; Default ist das Repository des Skripts, unabhängig vom Arbeitsverzeichnis |

`--out` muss ein neues Verzeichnis mit existierendem Elternverzeichnis sein.
Unbekannte/doppelte Optionen, `latest`, fremde Kontext-/Provenienzobjekte,
ungültige Konfigurationen und nicht produktiv ausgewählte Hintergründe werden
abgewiesen. Es gibt keine implizite Katalogauswahl oder neue Freigabe.

`count` ist eine positive sichere Ganzzahl. Beide Startseeds sind uint32 inklusive
0 und 4294967295. Für den nullbasierten Index `i` gilt die versionierte Folge
`sequential-uint32-1`: Geografieseed = `seedStart+i`, Bildseed =
`assignmentSeedStart+i`. Beide Folgen müssen vollständig in uint32 passen;
Überläufe werden vor der ersten Generierung abgewiesen. Die bestehenden getrennten
Zufallsdomänen werden unverändert verwendet.

Ein Batchversuch ist **ein Generatoraufruf**. Dessen `maxMapAttempts` und
`maxPlacementAttempts` bleiben eigenständige innere Budgets. Der Lauf zählt
weder bis zu einer gewünschten Zahl verschiedener Karten noch bis zu einer
gewünschten Zahl vollständig bebilderter Karten weiter. Dubletten und Lücken
bleiben gespeichert. Standardmäßig gelten die bisherigen Generatordefaults:
keine Routenfilter und keine Routensuche.

## Dateien und interne Übergabe

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | `batchFormatVersion:1`, Seedfolgenversion, normalisierte Optionen, vollständiges Profil oder null, Algorithmusversionen, Programmcommit/Node-Version und getrennte Releaseprovenienz |
| `candidates.jsonl` | Eine kompakte JSON-Zeile je verarbeitetem Index, in Indexreihenfolge |
| `summary.json` | Nur nach vollständigem Lauf: `status:completed`, angefragte/verarbeitete Anzahl und getrennte geografische/Zuordnungszähler |

Eine Kandidatenzeile hat folgende Struktur:

```js
{
  index, generationSeed, assignmentSeed,
  mapFingerprint, // bestehender Kartenfingerprint oder null
  generation,     // vollständiges {status,map,analysis,diagnostics}
  assignment     // vollständiges bestehendes Zuordnungsergebnis oder null
  // nur bei unerwartetem Dienstfehler zusätzlich:
  // error: {phase:'generation'|'assignment',code,message}
}
```

Die Ergebnisse der bestehenden Dienste einschließlich Versuchslogs, normalisierter
Config/Profile und objektbezogener Diagnosen werden vollständig übernommen.
Release-/Batchdaten gelangen nicht in die Karte. Bei `exhausted`/`inconclusive`
bleiben Karte und Analyse entsprechend dem Generatorvertrag null; die Diagnosen
werden trotzdem gespeichert. Bei `partial`/`none` bleibt die Karte vollständig
erhalten. Auch vollständig belegte, leere, zerschnittene oder routenlose Karten
werden ohne ausdrücklich angeforderte Generatorfilter nicht aussortiert.

Batchdateien sind private Übergabedaten, keine Puzzle-, Paket-, Freigabe- oder
Veröffentlichungsschemas. Eine Referenz besteht aus diesem Manifest und dem Index;
es gibt keine neue globale Kandidaten-ID. `mapFingerprint` verwendet unverändert
Objekt-IDs und Befahrbarkeit; Rotation, Umbenennung und geometrische Ähnlichkeit
werden nicht zu einer neuen Dublettenklasse zusammengefasst.

Format 1 verwendet UTF-8, `JSON.stringify` und abschließenden Zeilenumbruch;
Manifest/Zusammenfassung sind mit zwei Leerzeichen eingerückt. Die eingeschränkte
bestehende Identitätskanonisierung wird nicht erweitert: Config und Analyse
enthalten zulässige Fließkommazahlen. Es gibt keinen neuen Batchdigest.

## Zusammenfassung und Analysegrenzen

`scripts/lib/map-batch.mjs` aggregiert ausschließlich `generation.analysis`,
Generator-/Zuordnungsdiagnosen und bestehende Fingerprints. Es ruft keine zweite
Analyse, Graphberechnung oder Routensuche auf.

- `geography`: Status, unterschiedliche/duplizierte Karten, leere Karten,
  innere Versuchsbudgets/-zahlen, Generatorgründe und Profilprüfaufwand.
- `geography.histograms`: Objektanzahl/-größen, Befahrbarkeiten, orientierte Formen
  nach Befahrbarkeit, belegte Zellen/freies Wasser und Anteile, Komponentenanzahl
  und Komponentengrößen, Küstenseiten, Objektrandzellen/-seiten sowie Anzahl
  isolierter Zellen, Sackgassen, Artikulationszellen und Startzellen.
- `geography.routes`: nur angefragte Etappen; Statushäufigkeiten,
  Routen-/Startuntergrenzen, Anzahl unvollständiger Zählungen, unbekannte Starts
  und besuchte Suchknoten. Die vollständigen Einzelbelege stehen in den Zeilen.
- `assignment`: `complete/partial/none`, gesonderte `nonemptyStatuses`, Objekt-/
  Abdeckungszahlen, fehlende Formen/Größen nach Befahrbarkeit, primäre Gründe,
  Assetverwendung/-klassen und Prüfaufwand.

Histogramschlüssel sind JSON-Zeichenketten. Bei Komponenten-/Objektgrößen zählt
ein Histogrammeintrag Komponenten/Objekte; bei Anzahlmetriken zählt er Karten.
Generatorgründe, primäre Zuordnungsgründe und die einzelnen Assetablehnungen in
den vollständigen Ergebnissen haben verschiedene Nenner und werden nicht vermischt.
Quoten lassen sich aus den expliziten Zählern ableiten. Leere Karten sind
vakuos `complete`; `nonemptyStatuses` verhindert die Verwechslung mit tatsächlich
bebilderten Karten. `landFraction` bezeichnet weiterhin den Objektfootprint,
einschließlich befahrbarer Objekte. Formsignaturen unterscheiden Orientierungen.

Routenuntergrenzen werden nicht als exakte Zahlen ausgegeben. `unknown` bleibt
unentschieden. Engstellen, Routenvielfalt und Bebilderbarkeit sind kein
Schwierigkeits- oder Rätselqualitätsscore. Es werden weder Starts/Zielrouten
ausgewählt noch Hinweise oder Rätseldefinitionen erzeugt.

Ausdrücklich konfigurierte Generatorfilter können intern gültige Karten verwerfen.
Der vorhandene Generator liefert dafür Versuchsmetriken, aber keine vollständigen
verworfenen Karten. PR3 baut keinen zweiten Kandidatengenerator. Für eine breite
Sammlung daher ungefiltert erzeugen und Analyseergebnisse später auswerten.

## Einzel-Replay

```sh
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/gezeitenkarten-batch --index 42 \
  --out /tmp/gezeitenkarten-kandidat-42.jsonl
```

Optional wählt `--repository PATH` das Release-Datenrepository. Die Ausgabe ist
eine neue einzelne JSONL-Zeile; vorhandene Dateien werden nicht überschrieben.
stdout meldet `status:matched`, Index und Kartenfingerprint.

Vor der Reproduktion werden das gespeicherte Batchformat, die Seedfolgenversion,
normalisierte Optionen, der **exakte Programmcommit**, saubere Programmdateien
und die relevanten Versionen geprüft: freier/profilinformierter Generator,
Zuordnung, Katalogprofil, Pixelprüfvertrag, Releaseadapter und Regelversion.
Abweichungen brechen ausdrücklich ab. Es gibt keinen Rückfall auf neueren Code
und kein automatisches Checkout. Auch ein späterer reiner Dokumentationscommit
erfordert den gespeicherten Programmcheckout. Node-Version wird als
Laufzeitprovenienz dokumentiert; Node 22+ ist Voraussetzung, die Patchversion
ist kein zusätzliches Replaygate.

Der Einstieg lädt den Release selbst erneut. Das aus dem freigegebenen Kontext
abgeleitete vollständige Profil und die stabile Releaseprovenienz müssen mit
dem Manifest übereinstimmen. Nur `archiveCommit` darf sich ändern: Er bezeichnet
den aktuellen Gitstand, aus dem dasselbe unveränderte Release gelesen wurde.
Programmcommit, Katalogquellcommit und Archivcommit sind verschiedene Angaben.

Anschließend wird die gesamte Kandidatenzeile verglichen, einschließlich Karte,
Analyse, Versuchsdiagnosen, Zuordnung, Seeds und Kartenfingerprint. Eine geänderte
Ergebnisdatei wird nicht durch bloßes Nachrechnen ihres Fingerprints akzeptiert.
Die gespeicherten Dateien sind kein signiertes Archiv gegen absichtliche
Manipulation; die bestehende Releaseprüfung bleibt die Freigabegrenze.

## Fehler, Betrieb und Grenzen

Ein vollständig verarbeiteter Lauf endet mit Exit 0, auch bei erwarteten
`exhausted`, `inconclusive`, `partial` oder `none`. Argument-, Versions-, Freigabe-,
Git-, Schreib- und unerwartete Dienstfehler ergeben Exit 1.

Setupfehler erzeugen kein Ausgabeverzeichnis. Nach Beginn bleiben Manifest und
bereits geschriebene Zeilen bei Fehlern erhalten. Ein unerwarteter Dienstfehler
wird als eigene Fehlerphase gespeichert; eine vorhandene Geografie bleibt dabei
erhalten. Der Lauf stoppt danach. Eine Exception ist niemals Zuordnungsstatus
`none`. Bei Schreibfehlern kann die letzte Zeile unvollständig sein.

Die Zusammenfassung entsteht erst nach allen Kandidaten über `summary.pending`
und abschließendes Umbenennen. Ohne `summary.json` ist der Lauf unvollständig.
Vollständige frühere Zeilen bleiben einzeln replaybar; defekte Zielzeilen werden
abgewiesen. Es gibt keine automatische Batchfortsetzung und kein Überschreiben.
Die Ausgabe ist keine transaktionale Datenbank oder Zusicherung gegen Stromausfall.

Der Lauf arbeitet sequenziell und hält eine Karte samt Ergebnis im Speicher.
Exakte Dublettenzählung benötigt zusätzlich Speicher proportional zur Anzahl
verschiedener Kartenfingerprints. Vollständige Diagnosen/Profile können große
Dateien erzeugen. Routenanalysen können mit den bestehenden expliziten Budgets
teuer sein. Es gibt keine Zeitgrenze, Workerverwaltung, Warteschlange oder neue
Cache-/Validierungsumgehung. Die bestehenden Zuordnungsprüfungen bleiben erhalten.

Die grafische Kontaktübersicht bleibt ein eigener Folge-PR: ausgewählte Indizes,
vorhandene Rendererbausteine und gepinnte Releasebilder, ohne künstlichen Start
oder Rätseldefinition. Rätselranking, Hinweisgenerierung und Veröffentlichung
sind ebenfalls nicht Bestandteil von PR3.

## Vertrags- und Regressionstests

```sh
node --test tests/contracts/map-batch.test.mjs
npm run test:unit
npm run test:content
npm run test:puzzles
node scripts/catalog-release.mjs check-archive --previous HEAD^
```

Die Batchtests vergleichen vollständige Diensteingaben/-ausgaben, beide Modi und
die vorhandene 128-Seed-Referenz. Sie prüfen Topologie-/Routenbelege, leere Karten,
Dubletten, unvollständige Bebilderung, begrenzte Fehlschläge, Seedgrenzen,
bytegleiche Wiederholung/Replay, Programm-/Versionsabweichungen, beschädigte
Ergebnisdaten, Schreibfehler und Gitdaten ohne Arbeitsressourcen. Teständerungen
und technische Testcommits bleiben in temporären Repositorys. Der bestehende
CI-Workflow erfasst die neue Vertragsdatei und behält alle Grafik-, Browser-,
WebKit-, Deployment- und Archivprüfungen bei.
