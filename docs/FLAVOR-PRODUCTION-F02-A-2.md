# F02-A/2: öffentlicher Produktionsauftrag und nachvollziehbare F01-Drafts

Basis: `main` `4078f86f526d0c72b367cb832ff1dafd8a8590c3` einschließlich PR #129.
Die Umsetzung erfolgt in einer separaten Kopie; lokale UI-Arbeiten bleiben erhalten.
Keine Geschichten, Modellaufrufe, neue Namen/Karten, Freigaben oder Veröffentlichungen.

## Vertrag und Informationsgrenze

`scripts/lib/flavor-production.mjs` definiert die ausführbaren strikten Schemas
für Auftrag, Antwort, redaktionelle Angaben, vorab festgelegte Varianten/Revisionen
und Metadaten. Bestehende F01-/Rätsel-Feldschemas werden eingebunden; es gibt keine
zweite Definition mathematischer Hinweise. `sourceHash` bleibt der F01-Hash.
Weltpaket, redaktioneller Kontext, konkrete Produktionsanweisung, Regeln,
Ergebnisformat und Referenzpräsentation werden zusätzlich durch den Auftrag gebunden.

Drei Identitäten bleiben getrennt: Bildkarte (`cardRef`), Rätsel (`puzzleId` /
F01-Request) und Geschichte (`flavorVariantId`). Die mathematische `variantId`
bleibt unverändert in der lokalen Herkunftsbindung. Im öffentlichen Auftrag
stehen Fall, Karte, F01-Quelle und Auftragsposition; interne Archividentitäten und
Quelldigests werden ausschließlich lokal gespeichert.

Die Produktionsprojektion verwendet die tiefe Positivliste von
`projectPublicPuzzle`. Sie übernimmt Geometrie/Befahrbarkeit, Start, Etappen,
öffentliche strukturierte Hinweise, gespeicherte Namen und konkrete Assets.
Alte Einleitungen, Hilfen, Ergebnis-/Auflösungstexte, Metadaten, kompilierte
`solution`/`analysis` und Diagnosedatensätze werden nicht als Eingaben verwendet.
Die neutrale Präsentation verwendet `technicalClueText`; sie behauptet keine
historisch vorhandene vollständige Präsentation. Die technischen Texte sind
Referenzen, keine kontrolliert zertifizierte Sprachprüfung.

Der Adapter lädt die **vorhandenen** Karten und Quelllinks aus der Kartenbibliothek
und prüft Integrität, Releasebindung und die ursprüngliche Motivzuordnung.
Er führt keinen Kartenimport, keine Namensvergabe oder Generierung aus. Die
bestehende Migration und der Beta-Builder validieren die historischen S04-C-Fälle;
ein neuer B1-/B2-Produktionsnachweis wird nicht behauptet.

Eine Karte braucht mindestens ein befahrbares Ein-Hex-Objekt. Dies speichert
keinen Kartenstart und beschränkt nicht die Engine: Rätsel dürfen weiterhin auf
einem Mehrfeldobjekt starten. Distanzbezüge gelten der **gesamten Objektfläche**,
während das Startfeld eine einzelne Zelle bleibt.

F01-Requests und ihre Quellhashes bleiben Version 1. Neue F01-Drafts,
Checkpoints und kontrollierte Prüfungen verwenden Version 2. Sämtliche Namen
bleiben erhalten, auch der Name des starttragenden Objekts. Der Startort darf
und soll wie jeder andere Ort namentlich referenziert werden. Seine Startfunktion
hat keinen Einfluss auf den Namen. Eine Präsentationsprojektion erhält diese
vollständige Zuordnung, statt einen ausgelassenen Startnamen wiederherzustellen.

Historische Aufträge, v1-Records und Antworten bleiben unverändert lesbar.
`validateStoredProductionRecords` prüft akzeptierte Snapshots mit ihrer tatsächlich
gespeicherten Wire-Version; neue Imports erzeugen ausschließlich vollständige
v2-Drafts. Alte Vorlagen/Prompts werden nicht als aktuelle Anweisungen verwendet.

## Welt-/Stilpaket und unveränderte Quellen

`content/flavor/world-style-v1/` ist ein gemeinsam versioniertes Paket
`sams-gezeitenkarten-carribera-world-style` / `1.0.0`. Sein striktes Manifest bindet
`world.md`, `style.md`, `production.md` über tatsächliche SHA-256-Dateihashes.
Der Hash der exakten Manifestbytes identifiziert den gesamten Paketstand. Keine
unabhängigen Inhaltsversionen, Ontologie oder automatische Kanonerweiterung.
Alle U001–U015 und Kategorien A/B/U/I/N sind erhalten.

Das ursprüngliche Übergabepaket ist unter `content/flavor/handoff-20261124/`
unverändert entpackt archiviert, einschließlich ursprünglicher Recherche und
Übergabemanifest. Archiv-SHA-256:
`ec1cc06550f1790113efc135235b827942f1a3e5af3cf2f8e1ea5cf6c7a3069d`.
Die Recherche bleibt bytegleich mit SHA-256
`317602fe3759ec6fc55a32c65d85d13d4318d4b65af36871774089152664f7be`.
Es werden keine synchronen Dateien unter `sources/` geändert.

**Integrationsanpassungen:** Das neue Produktionsmanifest ersetzt die ungeprüften
technischen Übergabefelder durch einen ausführbar validierten Repositoryvertrag.
In der produktiven `world.md` sind relative Quellenlinks auf das lokale Archiv
umgestellt; „beigefügt“ wird zu „archiviert“, und ein Integrationshinweis erklärt
die Grenze der Quellenverweise. Deshalb wird für diese Datei ausdrücklich keine
Bytegleichheit behauptet. `style.md` und `production.md` sind bytegleich. Die
neuen Integrationshashes stehen im neuen Manifest. Die historischen Aussagen
„keine Implementierung“ in den archivierten Unterlagen beschreiben die damalige
Übergabe; der aktuelle Implementierungsauftrag hat Vorrang.

Nur die vier produktiven Paketdateien gelangen in den öffentlichen Auftrag.
Quellen-/Chat-/Übergabeverweise bleiben als Herkunft lesbar, sind aber keine
zusätzlich nachzuladenden Produktionseingaben. Die ursprüngliche Recherche wird
nicht zum Prompt umetikettiert. Neue Episodenerfindungen bleiben lokal zur Episode
und erhalten keine automatische Aufnahme in das Weltpaket.

## Export, Sichtbarkeit und Determinismus

Die aktuelle Promptrevision ist `flavor-production-2`; der
Produktionsumschlag bleibt Version 1. `flavor-production-package.mjs` verbindet F01, Kartenbibliothek und bestehende
Release-/Renderkomponenten. `renderSavedMapSvg` ist die kleine gemeinsame
Kartenansicht unterhalb von `renderContactSvg`; `drawAssetPlacements`,
`createChartBaseLayers` und die bestehenden Hexpolygone bleiben zuständig.
Es werden keine erfundenen akzeptierten Batchzeilen an den Renderer übergeben.

Der öffentliche Ordner enthält:

- `order.json`: feste Reihenfolge, unveränderliche Requests und vollständige
  öffentliche Karten, redaktionelles Ziel, optionale Impulse/Themen und Kontext;
- `prompt.md`, `rules.md`, `response.schema.json`, `response-template.json`;
- `world/`: exakter produktiver Paketstand;
- `maps/P01.svg` bis `P04.svg`, `index.html` mit Objekt-/Namentabellen und
  öffentlicher Startzuordnung sowie nur die benötigten geprüften Bildressourcen;
- `README.txt` und `inventory.json` mit Datei-SHA-256 und Byteanzahl.

Die Ansichten sind statisch, ohne Route, Lösungsmarkierungen, Spielanwendung,
JavaScript oder externe Bildressourcen. SVGs referenzieren deduplizierte lokale
PNG/WebP-Dateien. `index.html` zeigt die SVGs als `object` an, sodass deren lokale
Bildressourcen auch unter `file://` geladen werden. Alle Zellen tragen ihre
technischen Koordinaten; die Tabelle erklärt Objektfläche, Namen, Anker und
Befahrbarkeit. Die Regeln erläutern alle sechs Hinweistypen, Stunde 0,
Nachbarschritte, Wiederbesuchsverbot, Drehrichtung, geometrischen Mindestabstand
zur ganzen Objektfläche und inklusive Zählintervalle. Keine orthogonale
Rechercheentfernung wird übernommen.

Auftragskennung: `flavor-order-` plus domainseparierter Hash des kanonischen
Auftrags ohne `orderId`. Die Eingabehashes binden Prompt, Regeln, Antwortschema
und ein sortiertes Inventar der Referenzansichten/benötigten Bilder/HTML. Diese
Dateien enthalten keine Auftragskennung; dadurch entsteht kein Hashzirkel.
Der Paketstand bindet die exakten Manifestbytes und die darin verzeichneten
Inhaltsdateien. Auftragspositionen enthalten sämtliche beauftragten öffentlichen
Daten und die Revisionsabsicht. Inventare hashen alle anderen Dateien, nie sich
selbst. Zeit, Zufall und absolute Arbeitsplatzpfade sind keine Auftragseingaben.
Es wird ein öffentlicher Ordner geliefert; ein ZIP-Format wird nicht eingeführt.

Identische bestehende Exporte werden vollständig geprüft und wiederverwendet.
Widersprechende Dateien werden nicht überschrieben. Laufzeitbeobachtungen stehen
nur in lokalen Import-/Auswahlbelegen. Geänderte Paketstände ändern niemals
bereits gespeicherte Aufträge.

## Antwort und Annahme

Antworten enthalten pro Position exakt die vorgegebenen Referenzen sowie entweder
`status:"complete"` mit Titel, Einleitungsabsätzen, einer **Liste** aus `{id,text}`
und kompakten Metadaten oder `status:"problem"` mit konkreter Problembeschreibung.
Die Liste macht doppelte Hinweis-IDs vor der Überführung in `clueTexts` sichtbar.
Positionen und Hinweise müssen vollständig und in der beauftragten Reihenfolge
vorliegen. Namen, Start, Logik, Assets, Requests, Manifeste, Hilfen, Prüfbelege,
Freigaben und selbst gewählte Revisionen sind keine zulässigen Antwortfelder.

Eine Problemmeldung ist strukturell zulässig, erzeugt aber keinen vollständigen
Draftbatch. Der Import prüft zuerst den **lokal gespeicherten Originalauftrag**,
alle Paketbytes und dessen lokale Karten-/Herkunftsbindung. Ein mitgelieferter
neuer Request, Hash oder Manifest kann diesen Vertrauensanker nicht ersetzen.
Erst danach wird die gesamte Antwort validiert; eine fehlerhafte letzte Position
verhindert die Annahme sämtlicher Positionen.

Texte werden über `createFlavorDraft` und `validateFlavorDraft` in reguläre
F01-Drafts übernommen, alle Hinweisbelege lokal als `{mode:"free"}` gesetzt und
mit `createFlavorCheckpoint` berechnet. Freie Texte bleiben **UNCERTAIN**.
Strukturelle Annahme ist weder Bedeutungsprüfung noch Veröffentlichungsfreigabe.
Es gibt keine freie Interpretation, automatische Reparatur oder F02-B-Pipeline.

## Lokale Ablage, Abbruch und Konkurrenz

`openProductionStore({directory})` verlangt einen ausdrücklichen lokalen Ordner:

| Ablage | Inhalt |
| --- | --- |
| `orders/<orderId>/public/` | Exakte vollständige exportierte Eingaben |
| `orders/<orderId>/binding.json` | Getrennte lokale Archiv-/Quell-/Kartenbindung |
| `imports/<runId>/` | Unveränderte Antwortbytes, Hash, Durchlaufbeleg und alle F01-Records |
| `selections/<laufende Nummer>/` | Ausdrückliche unveränderliche Auswahlereignisse |
| `complete.json` je lokalem Snapshot | Inventar des vollständigen übrigen Snapshots |

Alle Mutationen halten dieselbe exklusive `.write-lock`. Der gesamte neue
Bestand wird in einem Geschwisterverzeichnis `.pending-…` geschrieben, Dateien
und Verzeichnisse werden mit `fsync` gesichert und der vollständige Bestand
atomar umbenannt. Unter der Sperre wird ein bereits belegter Name niemals
ersetzt. Symlinkdateien/-snapshots werden zurückgewiesen. Dies verlangt ein
lokales Dateisystem mit atomarem Rename und Verzeichnis-fsync.

Abbruch vor dem Rename hinterlässt keinen sichtbaren gültigen Import; nach dem
Rename existiert der vollständige Bestand. `.pending-…` wird beim Lesen ignoriert,
ein endgültiger Bestand ohne gültiges `complete.json` zurückgewiesen. Bei einem
harten Prozessabbruch kann die Sperre stehen bleiben. Erst nach Prüfung, dass
kein Schreiber mehr läuft, darf ein Bedienender die Sperre und verwaistes Staging
manuell entfernen. Keine automatische Wiederaufnahme oder Lockübernahme.
Ein Laufzeitfehler beim abschließenden fsync kann nach erfolgtem Rename einen
vollständigen Bestand hinterlassen; Wiederholung prüft ihn idempotent.

Gleicher Durchlauf, gleiche exakte Antwortbytes und gleiche Bedienerangaben sind
idempotent. Andere Bytes unter belegtem Durchlauf sind ein Konflikt, auch bei
nur anderer JSON-Formatierung. Eine andere Durchlaufkennung gestattet keine
zweite Belegung derselben Flavor-Revision. Gleichzeitige Prozesse erhalten
entweder die Sperre oder einen verständlichen Sperr-/Revisionskonflikt.

Hashes sind Integritätsbindungen, keine Signaturen gegen den Austausch des
kompletten lokalen Vertrauensankers. Der vertrauenswürdige Store wird nicht vom
Produktionschat zurückgeliefert. Die gespeicherten Karten und ihre geprüfte
Releasehistorie bleiben zum erneuten Herkunftscheck erforderlich.

## Varianten, Revisionen, Auswahl und F02-B

Neue Geschichte: neue `flavorVariantId`, Draftrevision 1, kein Vorgänger.
Überarbeitung: gleiche Kennung, nächste F01-Draftrevision und vollständige gepinnte
Vorgängerreferenz mit `revisionHash`. Es gibt keinen zweiten Revisionszähler.
Auftragsspeicherung und Import prüfen den jüngsten gespeicherten Vorgänger;
eine zwischenzeitlich angenommene Revision macht alte Aufträge ungültig.
Revisionen derselben Geschichte behalten den unveränderten F01-Request.

Import setzt keine Auswahl. `selected(caseId)` gibt `selected:null` zurück,
solange keine ausdrückliche Auswahl erfolgt ist. Ein Auswahlvorgang bindet
Bedienenden, Begründung, genaue Revision, beobachteten Zeitpunkt und vorherigen
Auswahlhash. Ein erwarteter Vorgängerhash verhindert verlorene Auswahländerungen.
Frühere Fassungen und Auswahlen bleiben erhalten.

Jeder Record enthält gepinnten Request, Draft, berechneten Checkpoint, Auftrag,
Position, Karte, Variante, Vorgänger und erzählerische Metadaten. F01s einzelne
`inputHash` bleiben erhalten. `draftHash` bindet den vollständigen Draft;
`revisionHash` bindet zusätzlich Request, Herkunftsreferenzen, Checkpoint und
Metadaten. Materialisierung prüft beide Hashes und berechnet die Präsentation
mit allen Namen. `presentationHash` entspricht dem vorhandenen Beta-Hash aus
SHA-256 des kanonischen Präsentationsobjekts. Weitergehende Nachweise müssen an
diesen konkreten Inhalt gebunden werden. Neue Texte übernehmen keine Gesamtfreigabe.

Die exakte rohe Antwort und ihr Hash bleiben unverändert. `importedAt` und
Auswahlzeitpunkt sind technisch beobachtet. Modell und Produktionszeit sind
Bedienerangaben; unbekannte Werte bleiben `null`. Erzählmetadaten sind
`model-reported`. Manuelle Chatproduktion beobachtet weder versteckte
Systemparameter noch einen unvollständig übergebenen Chatverlauf unabhängig.
Ein behaupteter Modellname ist kein technisch beobachteter Ausführungsnachweis.

## Beta-Anschluss und spätere Oberfläche

`materializeFlavorRevision` ist eine reine Präsentationsprojektion: Titel,
Einleitung und Hinweisformulierungen aus dem Draft, vollständige Namen und
Assets aus der gepinnten Karte, unveränderte Logik und Rätselreferenz, keine
Hilfen oder Auflösungstexte.

`prepareBetaEditorial` liefert nur eine Kopie der redaktionellen Daten mit
bestehendem Status `draft`, `semanticReview:null` und ausdrücklich angegebener
neuer `dataVersion`. Diese muss größer sein als bisherige Version und Quelle.
Der Test baut die vier Fassungen mit `buildCommunityBeta({editorial})` im Speicher
und vergleicht die ursprünglichen logischen Identitäten, Assets und Exporte.
Es werden weder `editorial.json` noch Auswahl oder bestehende Beta-Dateien
automatisch geändert. Der vorhandene Freigabemechanismus bleibt unverändert.

Die festen **Sam-/Robin-/Logbuchtexte** der jetzigen Oberfläche sind vor dem
vielfältigen Betatest eine gesonderte Integrationsaufgabe. Dieser PR führt keine
Erzählformumschaltung, Kalender-/Seriennavigation oder Serienplanung ein.

## CLI und Pilotübergabe

Voraussetzungen: vorhandene Git-/Releasehistorie, Node, Python 3 mit Pillow für
reine Bilddekodierung. Kein Pixel-Reapproval und kein Modellzugang erforderlich.

```sh
# Genau ein geprüfter Pilotauftrag; Wiederholung prüft und verwendet ihn wieder.
node scripts/flavor-production.mjs pilot \
  --store content/flavor/pilot-v1/local --out content/flavor/pilot-v1/public

# Anderer redaktioneller Auftrag auf gespeicherten Karten:
# spec: {caseIds:[...], intents:[{flavorVariantId,revision,predecessor}],
#        editorial:{goal,impulses:[],themes:[],context:null}}
node scripts/flavor-production.mjs export --store /pfad/store \
  --out /pfad/oeffentlich --spec /pfad/auftrag.json

# Exakte Ergebnisdatei zurücknehmen; ohne Modell-/Zeitangabe bleiben beide unbekannt.
node scripts/flavor-production.mjs import --store content/flavor/pilot-v1/local \
  --order flavor-order-85bb07ece126d1b5a2af6d98ea55ad5943f6f41f43a6245f835a16e71ba6b4df \
  --run pilot-1 --response /pfad/ergebnis.json

node scripts/flavor-production.mjs inspect --store /pfad/store --case C-06
node scripts/flavor-production.mjs select --store /pfad/store \
  --reference /pfad/revision.json --actor NAME --reason BEGRUENDUNG
# Weitere Auswahl: --expected-selection HASH des bisherigen Auswahlereignisses.

# Nur nach ausdrücklicher Auswahl, in eine neue Datei (keine bestehende ersetzen):
node scripts/flavor-production.mjs materialize --store /pfad/store --case C-06 \
  --data-version 2 --out /pfad/beta-redaktionsentwurf.json
```

**Nur `content/flavor/pilot-v1/public/`** vollständig in einen separaten
Produktionschat ohne Repository-/private Projektquellen übergeben. Dort gilt
`prompt.md` zusammen mit `order.json`, Regeln und Weltpaket. Die Antwort als
unveränderte UTF-8-JSON-Datei zurückgeben und in den ursprünglichen lokalen Store
importieren. Keine einzelnen Hinweise kopieren oder Texte hier produzieren.
Lokale Herkunft, Bibliothek und Store niemals an den Produktionschat übergeben.

| Position | Fall | Startname | Hinweise |
| --- | --- | --- | ---: |
| P01 | C-06 | Tangruh | 6 |
| P02 | C-02 | Gelbpunkt | 7 |
| P03 | C-03 | Treibkahn | 6 |
| P04 | C-11 | Nebellicht | 4 |

Vier Positionen, vier unterschiedliche geprüfte Kartenbindungen, alle 13
Objektnamen, insgesamt 23 Hinweise. Die exakte Zielanweisung steht in `order.json`.
Der erste reale Auftrag ist exportiert; keine reale Produktionsantwort ist
enthalten. Alle Importproben verwenden ausdrücklich markierte technische Texte.

## Regressionen und Nachweise

Neue Gruppen: `tests/contracts/flavor-production.test.mjs` und
`tests/integration/flavor-production.test.mjs`; technische Antwortfixture:
`tests/fixtures/flavor-production.mjs`. Sie prüfen echte Fälle, vollständige Namen,
strikte Positions-/Hinweisabdeckung, Referenzen und unerlaubte Ergebnisfelder,
verschachtelte private Daten samt byteidentischem Gesamtexport, Kartenwiederverwendung,
Mehrfeldstart, Paketversionen und -integrität, gesamte Batchannahme, Antwortbytes,
Idempotenz, Konflikte, Abbruch, Sperre, zwei konkurrierende Prozesse,
Varianten/Revisionen, Vorgänger, Auswahl und unveränderte Beta-Projektionen.

Die unveränderte CI wählt für alle neuen F02-Pfade das vollständige Profil.
Keine Allowlist, kein Browser-/Asset-/Archiv-/Reproduktionsgate wird reduziert.
Tatsächliche lokale und CI-Ergebnisse sowie die visuelle Prüfung stehen unter
`docs/verification/F02-A-2/` und in der PR-Beschreibung.
