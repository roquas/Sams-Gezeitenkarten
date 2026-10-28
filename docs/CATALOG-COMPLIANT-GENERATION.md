# PR B: kataloggerechte Kartengenerierung und Zielzahlbatch

`catalog-compliant` ist ein ausdrücklich gewählter Modus neben dem unveränderten
freien und kataloginformierten Generator. Er erzeugt geografische Karten aus
den Formen und Befahrbarkeiten des gewählten freigegebenen Katalogs. Der
Zielzahlbatch akzeptiert ausschließlich Karten mit vollständiger konkreter
Assetzuordnung unter den Wiederverwendungsregeln.

## Aufruf

Voraussetzungen wie beim [bisherigen Batch](MAP-BATCH-F04B.md): Node 22+, Git,
Quellhistorie des expliziten Releases sowie sauber eingecheckte Programmdateien
unter `src/` und `scripts/`. Generierung und Replay benötigen weder Python noch
Arbeitsbilder oder Netzwerk. Das Ausgabeverzeichnis muss neu sein.

```sh
node scripts/generate-map-batch.mjs run \
  --mode catalog-compliant \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 \
  --target-count 1000 --max-attempts 5000 --seed-start 0 \
  --out /tmp/gezeitenkarten-kataloggerecht
```

`--target-count` und `--max-attempts` sind positive sichere Ganzzahlen und in
diesem Modus Pflicht. Auch ein Budget kleiner als die Zielzahl ist zulässig;
der Lauf meldet dann ausdrücklich den unerreichten Zielstatus.
`--count` und `--preference-percent` werden in diesem Modus abgewiesen. Die
vorhandenen Optionen `--assignment-seed-start`, `--config` und `--repository`
gelten weiterhin. `free` und `catalog-informed` verwenden weiterhin `--count`
und Format 1; ihre Zahl zählt Generatoraufrufe einschließlich ungeeigneter
Ergebnisse, ihre bisherigen Zufallsfolgen bleiben unverändert.

## Gemeinsame Dienste und harte Annahmebedingung

```js
const {catalog} = loadReleasedAssetCatalog({repositoryRoot, releaseId, backgroundId});
const catalogProfile = createCatalogProfile(catalog, {mode: 'catalog-compliant'});
const generation = generateMap({seed: 42, config, mode: 'catalog-compliant', catalogProfile});
if (generation.map) {
  const assignment = assignAssets({map: generation.map, seed: 81, catalog,
    reusePolicy: 'catalog-compliant'});
  // Erst assignment.status === 'complete' erfüllt die Annahmebedingung.
}
```

Der vorhandene Releaseadapter liefert Auswahl und gespeicherte Anker; es gibt
keine neue Bildprüfung oder Freigabe. Das geografische Profil
`catalog-capacities-1` enthält deduplizierte Platzierungen und je orientierter
Form/Befahrbarkeit die Zahl passender konkreter Motive. Es enthält weder
Asset-IDs noch Darstellungseigenschaften. Diese Zahlen werden aus den
verifizierten geografischen Assets abgeleitet, ohne feste Produktionslisten.

Der bestehende Kandidatenbauer in `src/generation/maps.mjs` wählt die
Objektanzahl im konfigurierten Bereich und zieht die Befahrbarkeit unabhängig
je Objekt mit `passableProbability`. Danach wählt er nur verfügbare, erlaubte
Größen und ihre unverändert orientierten Platzierungen. Größen werden gleich
gewichtet; zusätzliche Bilder derselben Form geben einer Platzierung keine
zusätzlichen Stimmen. Unbefahrbare Formkapazitäten werden schon hier reserviert.
Alle belegten Zellen und ihre direkten Nachbarn sperren die Platzierung
**anderer** Objekte. Innere Kanten einer Mehrhexform bleiben erlaubt.

`validateMap(map, {separateObjects:true})` prüft diesen zusätzlichen Abstand
mit der bestehenden Hexnachbarschaft. Ohne Option gilt unverändert der freie
Kartenvertrag. Rand und Ecken erhalten keinen Wasserabstand; alle passenden
Profilpositionen bleiben verfügbar. Der [Grafikvertrag aus PR A](CATALOG-POSITION-INDEPENDENCE.md)
wird nicht verändert. Es gibt keine Rotation, Spiegelung oder Bildanpassung.

Die vorhandene Zuordnungsengine entdeckt und validiert weiterhin sämtliche
konkreten Kandidaten. Mit `reusePolicy:catalog-compliant` löst sie anschließend
eine maximale bipartite Zuordnung über die gesamte Karte. Unbefahrbare Assets
haben Kapazität eins. Für befahrbare Assets maximiert dieselbe Zuordnung zunächst
die Zahl unterschiedlicher Motive; nur verbleibende Objekte verwenden ein
passendes, bisher möglichst selten verwendetes Motiv erneut. Seedabhängige
Gleichstandsentscheidungen bleiben deterministisch. Standardmäßig gilt weiter
`reusePolicy:unrestricted` mit der bisherigen Zuordnungsfolge.

Karte und Motivbelegung bleiben getrennte Objekte. Der Zuordnungsdienst kann
später erneut mit anderem Seed aufgerufen werden; alternative Belegungen oder
eine Suche nach Rätseln werden hier nicht implementiert.

## Budgets, Engpässe und Konfiguration

Ein äußerer Versuch ist ein Aufruf von `generateMap` und gegebenenfalls
`assignAssets`. Für nullbasierten **Versuchsindex** `i` gilt unverändert
`sequential-uint32-1`: Generierungsseed `seedStart+i`, Zuordnungsseed
`assignmentSeedStart+i`. Beide vollständigen Folgen bis `maxAttempts-1` müssen
in uint32 passen. Akzeptierte Ergebnisnummern ersetzen diese Indizes niemals.

`maxMapAttempts` bleibt das explizite innere Kandidatenbudget pro Generatoraufruf.
Damit werden höchstens `maxAttempts × maxMapAttempts` geografische Kandidaten
untersucht. Der Modus untersucht bei einem Platzierungsschritt alle passenden
Katalogpositionen; Wiederholungen desselben unveränderten Suchzustands bringen
nichts. Deshalb benötigt er einen Platzierungsversuch je Objekt und keinen
zufälligen Wachstumspfad aus dem freien Modus. Es gibt keine zusätzliche
unbegrenzte Platzierungs- oder Zuordnungsschleife.

Fehlt eine angeforderte Befahrbarkeit oder Größe, reicht die Motivkapazität
nicht oder ist kein Platz mit Abstand übrig, wird der innere Kandidat verworfen.
Objektanzahl, Befahrbarkeit und erlaubte Größen werden für diesen Kandidaten
nicht gelockert. Weitere innere Kandidaten ziehen erneut innerhalb derselben
Konfiguration. Die Verteilung akzeptierter Karten ist dadurch bedingt auf
Machbarkeit und entspricht keiner garantierten Gleichverteilung.

| Diagnose | Bedeutung |
| --- | --- |
| `CATALOG_PASSABILITY_UNAVAILABLE` | Für die gezogene Befahrbarkeit gibt es keine Profilplatzierung |
| `CATALOG_SIZE_UNAVAILABLE` | Keine erlaubte Größe passt in den restlichen Flächenhaushalt |
| `CATALOG_CAPACITY_EXHAUSTED` | Passende unbefahrbare Motive sind bereits reserviert |
| `OBJECT_SPACING_EXHAUSTED` | Keine verbleibende Formposition hält den Objektabstand ein |
| `GENERATION_EXHAUSTED` / `GENERATION_INCONCLUSIVE` | Generatoraufruf liefert innerhalb seines Budgets keine akzeptierte Karte |
| `ASSIGNMENT_INCOMPLETE` | Die gesamte Karte erhält keine vollständige konkrete Belegung |
| `ASSET_REUSE_EXHAUSTED` | Konkrete passende unbefahrbare Assets reichen für die gemeinsame Belegung nicht |

Vorhandene explizite Analysefilter und ihre Gründe gelten weiterhin.
Unerwartete Dienst-/Schreibfehler brechen den Lauf mit Fehler ab und erzeugen
keine abgeschlossene Zusammenfassung. Sie werden nicht als normale Kataloglücke
oder ungeeignete Ersatzkarte behandelt.

## Format 2, Reproduktion und objektive Kennzahlen

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | `batchFormatVersion:2`, Zielzahl/Budget, normalisierte Konfiguration, Seedfolge, vollständiges Kapazitätsprofil, Programmcommit und Releaseprovenienz |
| `candidates.jsonl` | Alle verarbeiteten Versuche, fortlaufend ab Index 0; vollständige Generation, Analyse, Zuordnung sowie `decision` und `rejectionReasons` |
| `accepted.jsonl` | Nur akzeptierte Kandidaten, jeweils dieselbe vollständige Zeile einschließlich des ursprünglichen Versuchsindex und beider Seeds |
| `summary.json` | Nach regulärem Ende atomar geschrieben: `target-reached` oder `target-unreached`, tatsächliche Versuche, Annahmen, Verwerfungen und aggregierte Ursachen |

Beide regulären Zielstatus liefern CLI-Exitcode 0; der maschinenlesbare
Zielstatus in `summary.json` unterscheidet Erfolg und Budgeterschöpfung.
Nicht vorhandene `summary.json` bedeutet weiterhin: Lauf nicht regulär beendet.
`rejectionCounts` zählt jeden Grund höchstens einmal pro verworfenem äußeren
Versuch. Mehrere Gründe können für denselben Versuch gelten. Innere
Verwerfungszahlen stehen separat in `attempted.geography.rejectionCounts`.

`attempted` und `accepted` aggregieren die bestehenden geografischen Analysen
und Zuordnungsdiagnosen getrennt: Objektgrößen, orientierte Formen,
Befahrbarkeiten, Wasser-/Landanteile, Komponenten, Randberührung, Motivverwendung,
unterschiedliche Karten und Dubletten. `accepted.repetitionHistogram` zählt
Karten nach der Zahl wiederholter Motivverwendungen. Es gibt keine zweite
Topologieanalyse und keinen Qualitätsscore. Dubletten sind erlaubt und bleiben
über den bestehenden `mapFingerprint` erkennbar. Explizit konfigurierte leere
Karten bleiben möglich und werden als solche gezählt.

```sh
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/gezeitenkarten-kataloggerecht --index 17 \
  --out /tmp/gezeitenkarten-versuch-17.jsonl
```

Replay verwendet stets den Versuchsindex in `candidates.jsonl`, auch für
verworfene Versuche. Es verlangt denselben aufgezeichneten Programmcommit,
saubere Programmdateien, übereinstimmende Profil-/Algorithmusversionen und
dieselben gebundenen Releasedaten. Das gesamte neu erzeugte Ergebnis,
einschließlich Annahmeentscheidung, muss mit der gespeicherten Zeile
übereinstimmen. Bereits vollständige Kandidaten bleiben nach Abbruch replaybar.

Neue Versionen sind `catalog-compliant-maps-1`, `catalog-capacities-1`,
`catalog-assignment-1` und die Annahmeregel `catalog-complete-1`.
Die bisherigen Generator-/Zuordnungsversionen, Releaseidentitäten,
Kartenfingerprints und Rätsel-/Publikationsidentitäten werden nicht geändert.
Format-1-Läufe werden weiterhin mit ihrem aufgezeichneten Programmstand
reproduziert. PR #86 bleibt separat; sein bisheriger Format-1-Kontaktbogen
erhält hier keine implizite Unterstützung für Format 2.

## Grenzen und Review

Die Platzierung ist ein begrenztes zufälliges Packverfahren, keine vollständige
Suche über alle möglichen Anordnungen. Ein unerreichtes Ziel beweist daher
nicht, dass keine weitere Karte existieren kann. Die gespeicherten Gründe
machen Kapazitäts-, Platzierungs- und Filterengpässe sichtbar.

Vollständige Bebilderbarkeit ist keine Aussage über Rätselschwierigkeit,
Storyqualität oder visuelle Abnahme einer konkreten Karte. Es entstehen keine
neuen Illustrationen, Katalogfreigaben, Startpunkte, Routen, Hinweise,
Spieloberflächen oder Veröffentlichungen.

Die automatisierten Nachweise liegen in
`tests/engine/catalog-compliant.test.mjs` und
`tests/contracts/target-map-batch.test.mjs`; bestehende Generator-, Zuordnungs-,
Batch-, Release- und Positionsprüfungen bleiben im Unitgate enthalten.
Der realistische Batchnachweis wird separat unter `docs/verification/` abgelegt.
