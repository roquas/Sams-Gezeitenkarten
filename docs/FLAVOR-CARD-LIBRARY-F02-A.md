# F02-A, Schritt 1: bebilderte und benannte Karten

Basis ist `main` / `1899b8b178efa8f8538ba6beb42b1f7707a7bf51` (PRs #124–126).
Vor Beginn war auf GitHub kein neuerer main-Commit vorhanden. Umsetzung in einer
separaten Kopie; vorhandene lokale UI-Arbeiten bleiben unangetastet. Während
der Arbeit kam `1ecb7c6624185782bead934c49593efe58a4b338` / PR #128 hinzu.
Dessen geprüfter Diff ändert ausschließlich Beta-Einladung und CSS; der PR wird
auf diesen neueren main-Stand aktualisiert.

Die Offline-Stufe liegt **nach vollständiger Assetzuordnung und vor der
Rätselausgestaltung**. Sie speichert eine fertige logische Karte mit Bildern und
Namen. Keine Episodentexte, Modellaufrufe, Schlüssel, neuen Laufzeitfelder oder
Freigaben. Engine, Solver, B1/B2-Verträge und CI-Auswahl bleiben unverändert.

## Identität

`illustrated-card.mjs` verwendet `canonicalJson` und `sha256` aus den vorhandenen
Hashhilfen, mit der neuen Domain `gezeitenkarten-illustrated-card/v1\0` und dem
Schlüssel `gk-illustrated-card-v1-sha256:…`. Bestehende v2-Domains werden nicht
erweitert oder umgedeutet. Eingaben der Identität:

- unveränderter bestehender `mapFingerprint` mit logischen Objekt-IDs;
- konkrete Hintergrund-ID und SHA-256 ihrer gepinnten Bildbytes;
- konkrete Asset-ID, Objekt-ID und Anker jeder Platzierung;
- für jedes tatsächlich verwendete Asset dessen Bildhash und ein Revisionshash
  aus Geometrie, Bildmaßen, Rolle und Befahrbarkeit.

Platzierungen und Ressourcen werden sortiert, technische Platzierungs-IDs
entfernt. Relative Ressourcenzellen werden ebenfalls sortiert: Ursprung zuerst,
danach axiale Zeile und Spalte. Ihre bloße Aufzählungsreihenfolge ist keine Revision. Die gespeicherte Karte sortiert Objekte/Zelllisten und vergibt lokale
Darstellungs-IDs `art-001` usw. Ressourcenpfade, Kataloggesamtchecksummen,
Releaseherkunft, Namen, Start, Route, Hinweise, Seeds, Versuch und Speicherort
sind keine Schlüsselbestandteile. Ein unbenutztes neues Katalogasset ändert den
Schlüssel nicht. Geänderte logische Objekt-IDs bleiben getrennt; es gibt keine
geometrische Gleichsetzung. Andere Bilder auf derselben Geografie sind andere
bebilderte Karten. Gleiche Bilder dürfen auf verschiedenen Karten anders heißen.

Die Funktion `describeIllustratedCard` erwartet das vertrauenswürdige Handle von
`loadReleasedAssetCatalog`; beliebiges JSON neben einer Release-ID ist kein
Freigabenachweis. Der Dateiadapter lädt Releases selbst. Die vorhandenen
Karten-/Platzierungsvalidatoren (`validateB2Places` mit `validatePlacements`) und
die archivierte Releaseauswahl einschließlich konkreter Anker bleiben zuständig.
Keine zweite Geometrie- oder Pixelprüfung.

## Offline-Dateiformat und Speicher

Explizites Zielverzeichnis mit `cards/<Schlüsselhash>.json` und
`links/<Hash aus Quellart und Quell-ID>.json`. Keine Datenbank und kein allgemeines
Speichersystem. Beide Formate haben `schemaVersion:1` und strikte ausführbare
Schemas in `illustrated-card.mjs` beziehungsweise `card-library.mjs`.

Ein Kartenartefakt enthält:

| Feld | Inhalt |
| --- | --- |
| `key`, `mapFingerprint` | neue Bildidentität und bestehende Geografieidentität |
| `map`, `background`, `assetPlacements` | vollständige Karte und konkrete Bebilderung |
| `resources` | ausschließlich verwendete Bild-/Revisionsbindungen |
| `naming` | Namen nach Objekt-ID, Zuordnungen, Vorrats-/Auswahlversion, vollständiger Vorratshash und verwendeter Vorratsausschnitt |
| `origin` | erster Quellbezug und geprüfte Releaseprovenienz |
| `integritySha256` | vollständiger übriger Inhalt, Domain `gezeitenkarten-named-card/v1\0` |

Der gespeicherte Vorratsausschnitt enthält verwendete Assetzuordnungen/Pools und
alle damals reservierten Weltortnamen. Er erlaubt die exakte Wiederholung der
Auswahl ohne den heutigen Vorrat. `supplySha256` identifiziert zusätzlich den
vollständigen ursprünglichen Vorrat; er ist Provenienz und kein Kartenschlüssel.
Jede Objektbenennung kann damit auch nach späteren Poolerweiterungen validiert
werden. Ein vorhandener Kartenstand gewinnt immer vor neuer Namensauswahl.

Der Begleitindex bindet Quellart/Quell-ID, ursprünglichen Datensatzhash,
Kartenschlüssel, vollständigen Kartenintegritätshash und die Releaseherkunft des
jeweiligen Anschlusses. Verschiedene Läufe können dieselbe Karte referenzieren,
ohne deren ersten Herkunftseintrag zu überschreiben. Dieselbe Quell-ID mit
anderen Bytes, anderer Karte oder widersprechender Releaseherkunft ist ein
Fehler. Historische B2-Datensätze ohne `candidateId` verwenden die vorhandene
Kombination aus `attemptId` und Variantenfingerprint. Der Datensatzhash verwendet
die vorhandene Herkunftskanonisierung, die auch Diagnosezahlen mit Nachkommastellen
verarbeitet; diese Zahlen gelangen nicht in die Kartenidentität.

Neue Dateien werden zunächst als `.pending-…` vollständig geschrieben und mit
`fsync` gesichert. Ein exklusiver atomarer Hardlink setzt den endgültigen Namen;
es gibt kein überschreibendes Rename. Ein konkurrierender Prozess liest und
validiert den Gewinner. Abgebrochene Staging-Dateien gelten nie als fertige Karten;
beschädigte endgültige Dateien werden abgewiesen und nicht automatisch ersetzt.
Ein Absturz zwischen Karte und Link kann eine gültige noch unreferenzierte Karte
hinterlassen; Wiederholung vervollständigt den Anschluss. Ein Link ohne gültige
Karte wird zurückgewiesen. Der Speicher verlangt ein lokales Dateisystem mit
Hardlink-Unterstützung. Symlinks an Karten-/Indexdateien werden abgewiesen.

Beim Lesen werden Struktur, vollständiger Integritätshash, Kartenidentität,
Ressourcen, Releaseprovenienz und reproduzierte Namensauswahl erneut geprüft.
Der behauptete Archivcommit muss das archivierte Releasemanifest enthalten.
Git-Historie und archivierter Release bleiben zum erneuten Ressourcencheck nötig;
die Bibliothek kopiert keine Bilddateien. Hashes sind Integritätsbindungen,
keine Signaturen gegen einen Angreifer, der Bibliothek und Vertrauensanker
vollständig ersetzen kann. Beim Lesen eines Links wird dessen gepinnter
Kartenintegritätshash zusätzlich verglichen.

## Namensvorrat und Unique-Orte

`content/card-names/de-v1.json`: `card-names-de-1`, Auswahl `card-name-rank-1`.
**23 Motivpools mit je 20 Namen**, ausdrücklich zugeordnet zu allen 33 Motiven
des aktuellen archivierten Releases. Grundlage sind `ASSET-INVENTORY-65.md`,
`A0-COMPLETION.md` und die Tesoro-Weltreferenz; jede Assetzuordnung führt ihre
Quelle. Bei der Boje wurde zusätzlich das konkrete Bild geprüft: grün/goldener
Körper, deshalb kein aus einer technischen ID erfundener roter Signalort.

Beispiele gemeinsamer Pools: die drei Nebelwälder, die Hüttenvarianten, die
Gefängnisvarianten, die Aussichtsbuchten; Palmeninsel und Palmenbuchten teilen
den Palmenpool. Geschlossenes Atoll und durchbrochenes Atoll bleiben unterschiedliche
Motivpools. Hütten, Gefängnis und Restaurant teilen trotz `settlement` keinen Pool.
Die technische `semanticClass` wird nicht zur Benennung ausgewertet.

Alle gewöhnlichen Namen sind neue Spielvorschläge, **kein Podcastkanon** und keine
historischen Behauptungen. Sie mischen geografische, funktionale und humorvolle
Bezeichnungen; alle sind 6–12 Zeichen lang. Deshalb gibt es in v1 keine längeren
Ausnahmen ohne Prüfung in realer Spiel-/Smartphonegröße. Technische Tests ersetzen
keine spätere redaktionelle oder visuelle Gesamtprüfung.

Die Auswahl sortiert Objekte nach ID und Namen pro Objekt/Pool nach einem
SHA-256-Rang aus Kartenschlüssel, Objekt-ID, Pool-ID und Name. Bereits vergebene
Namen werden kartenweit übersprungen, auch über verschiedene Pools und wiederholte
Assets hinweg. Vergleiche normalisieren NFKC und deutsche Kleinschreibung.
Fehlende Assetzuordnung, unbekannte Poolziele und erschöpfte Auswahl sind Fehler;
keine spontane Generierung oder Produktionsrückfrage. Überlappende Pools können
bei der festen Auswahlreihenfolge erschöpfen; es gibt keine nachträgliche
Umsortierung bereits vergebener Namen. Vorratsänderungen erhalten eine neue
Vorratsversion; bestehende Karten werden dabei niemals umbenannt.

`uniquePlaces` definiert feste Weltortkennung, Namen und Quelle. Das unveränderliche
`world-places-v1.json` schützt die bekannte Tesoro-Bindung auch gegen einen
widersprechenden Ersatzvorrat: Tesoro darf weder umbenannt noch einem gewöhnlichen
Pool zugeordnet werden. Die ausdrückliche
Assetzuordnung kann später weitere Illustrationen an dieselbe Kennung binden.
`land-coast.settlement.h4.tesoro.v4` → `world.tesoro` → **Tesoro**. Zwei Darstellungen
desselben Weltorts auf einer Karte sind ein Konflikt. Bekannte Weltortnamen sind
auch dann gegenüber gewöhnlichen Pools reserviert, wenn ihre Illustration auf
der Karte fehlt. Dies führt weder eine neue Assetklasse noch verbindliche
Entfernungen zwischen Weltorten ein.

## Verwendung und Anschluss

```sh
# Bestehenden akzeptierten Kartenbatch vollständig prüfen und übernehmen:
node scripts/card-library.mjs batch --batch /pfad/kartenbatch --library /pfad/bibliothek

# Vorhandene B2-Kandidaten mit unverändert strenger Herkunfts-/Beweisprüfung:
node scripts/card-library.mjs candidates --file /pfad/candidates.jsonl \
  --release RELEASE_ID --background sea-blue-01 --library /pfad/bibliothek \
  --origin-contract /pfad/candidate-origins.json \
  --expect-origin-contract-sha256 UNABHAENGIG_GEPINNTER_HASH

# Versionierte echte Anschlussfälle, ohne neue Rätselerzeugung:
node scripts/card-library.mjs community --library /pfad/bibliothek \
  --ids C-06,C-02,C-03,C-11

node scripts/card-library.mjs check --library /pfad/bibliothek --key KARTENSCHLUESSEL
```

`--supply FILE` erlaubt einen expliziten neuen Vorrat. Batch, Kandidaten und Check
unterstützen `--repository DIR` für die Git-/Releasequelle. Ohne unabhängig
gepinnten Herkunftsvertrag akzeptiert der B2-Adapter ausschließlich das bereits
vom bestehenden Verifier anerkannte historische Inventar. Batchimport verwendet
unverändert `readContactBatch`; Kandidatenimport verwendet `verifyCandidates`.
Es gibt keine neue B1/B2-Ergebnisversion oder Änderung ihrer Herkunftsverträge.

Programmatisch für neue vollständig bebilderte Karten:

```js
const library = openCardLibrary({directory, repositoryRoot, supply});
const {card, link, reused} = library.reuse(
  {map, background, assetPlacements}, {releaseId, backgroundId: background},
  {kind: 'illustrated-map', id: sourceId, sha256: independentlyPinnedSourceHash}
);
```

Der Aufrufer verantwortet die vertrauenswürdige Quell-ID/-Hashbindung. Die
Dateiadapter prüfen ihre jeweiligen Quellen **vor** Öffnen des Ziels. Der
Community-Adapter verwendet den vorhandenen, migrationsgebundenen Editorial-
Handoff und den unveränderten Beta-Builder; er behauptet keinen zusätzlichen
B2-Beweis für den historischen vollständigen Produktionslauf.

Die vier echten Karten und ihre Begleitlinks liegen unter
`content/card-library/f02a-v1/`. Sie lassen sich über dieselben allgemeinen
Schnittstellen lesen wie neue Karten. Originaldefinitionen, Zielrouten,
logische Fingerprints, Beta-Projektionen und `editorial.json` bleiben unverändert.

## Anschlusskonflikt für PR 2 und Grenzen

Der Community-Beta-Importer verlangt derzeit in einer redaktionellen Präsentation
Namen für **alle** Objekte. F01 entfernt dagegen aus seinem Draft den Namen des
starttragenden Objekts. Die Kartenbibliothek speichert alle Namen; die
Startausnahme ist erst je Rätsel anzuwenden. **PR 2 muss die Übergabe beider
Verträge ausdrücklich lösen**, ohne einen davon abzuschwächen. Hier wird weder
F01 noch der Beta-Importer geändert. Die Tests zeigen beide Anforderungen.

Eine fertige Karte bleibt unveränderlich. Spätere F02-B-Checkpoints enthalten
hingegen den fortlaufend reparierten Textstand; sie sind ein anderer Lebenszyklus.
Welt-/Stilpaket, Episodenerzeugung, freie Sprachinterpretation, Textreparatur,
redaktionelle Gesamtfreigabe, Betafreigabe, Veröffentlichung und Deployment
bleiben ausstehend. Neue F02-Dateien erhalten weiterhin das vollständige
CI-Profil; die unabhängige Optimierung wird nicht umgebaut.

## Prüfungen

Gezielt: `node --test tests/contracts/card-library.test.mjs tests/integration/card-import.test.mjs`.
Abgedeckt sind Reihenfolgen, technische IDs, unbenutzte Ressourcen,
Bild-/Anker-/Ressourcenrevisionen, Objekt-IDs, vollständige Platzierung,
Namensreproduktion, Poolerweiterungen, Motivzuordnung, Kollision/Erschöpfung,
Tesoro/Unique-Konflikte, vollständige Integrität, Quell-/Releasekonflikte,
Dateibeschädigung, unterbrochene Writes und zwei konkurrierende Prozesse.

Die echten Fälle ergänzen künstliche kleine Karten. Batch/B2-Anschluss verwendet
zusätzlich die vorhandenen archivierten B2-Beispiele; Varianten desselben
Zielversuchs zeigen auf denselben Kartenstand. Beta-Bytes werden vor/nachher
verglichen, `--release-check` muss weiterhin an ausstehender Flavor-Freigabe
scheitern. Ausgeführte vollständige Regressionen und Umgebungsdetails stehen
in der PR-Beschreibung.
