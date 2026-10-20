# Stabile Identitäten und Veröffentlichungsarchiv v1 (F02)

Bezug: [#21](https://github.com/roquas/Sams-Gezeitenkarten/issues/21),
auf main `66b3a569c5c0e2c0798b0eb9c83f3c37f840111d` nach F01/#66.
Der [Regelvertrag](RULESET-GEZEITENKARTEN-1.md) bleibt unverändert.
Das interne [Manifest](../archive/publications-v1.json) ergänzt den bestehenden
[Browserkatalog](../puzzles/manifest.json). Es wird weder vom Loader importiert
noch ins Deployment-ZIP aufgenommen. Die vier Rätseldokumente bleiben bytegleich.

## Bestand und kleinste Erweiterung

Schema 1 trennt bereits `logic`, `presentation` und optionale `solution`.
Unbekannte Felder werden abgewiesen. Der Loader löst bisherige IDs über den
Katalog auf, `validatePuzzle` prüft Referenzen und Sollrouten, `compilePuzzle`
zusätzlich Eindeutigkeit. Die bestehenden Versions-/Hashregressionen bleiben erhalten.
Deshalb gibt es keine neuen Felder in Rätseldateien, keinen zweiten Kartendatensatz
und keinen neuen Browserladeweg. Das Archiv referenziert dieselben Dokumente.

Der verfügbare Architekturbericht vom 19.10.2026 empfiehlt ein separates internes
Archiv, feste Legacyzuordnungen und getrennte öffentliche IDs/Inhaltsprüfsummen.
Seine vorläufige Einbeziehung von Darstellung/Ortsnamen in die Instanz wird durch
den präziseren F02-Auftrag ersetzt: Darstellung gehört zur Veröffentlichung.
#38 und #65 sind unabhängig und werden hier nicht verändert oder integriert.

## Vier Ebenen

| Ebene | Kanonischer Inhalt | Ausgeschlossen |
| --- | --- | --- |
| `mapStructureId` | `geometry: even-row-offset-pointy-v1`, Rastermaße, gesperrte Zellen, lokale Orts-IDs mit Art und Zellmenge | Start, Route, Hinweise, Namen, Asset-Footprints, Layout |
| `instanceId` | Karten-Fingerprint, Regelversion, Start, Etappen, geordnete interne Zielroute | Darstellung, Hinweiswahl, Generator und Herkunft |
| `variantId` | Instanz-Fingerprint und strukturierter Basis-Hinweissatz | Hinweis-IDs/-reihenfolge, Formulierungen, zusätzliche Hilfen, Datum/Paket |
| `publicationId` | feste Referenzen auf obige IDs, Regelversion, Veröffentlichungsrevision, Datei-/Datenversion, Quelldatei und Darstellungssnapshot | Paket-/Dailyzuordnung |

Die Geometriekennung benennt die exakte axiale Umrechnung, Nachbarschaft und
Richtungsorientierung aus F01. Andere Raster sind in Schema 1 weiterhin ungültig.
Orts-IDs sind lokale logische Referenzen; eine Umbenennung erzeugt eine andere
Kartenstruktur. Grafik- und Asset-IDs sind davon unabhängig. Eine neue Regelversion
ändert mindestens Instanz und Variante; dieselbe abstrakte Geografie kann dieselbe
Kartenstruktur behalten. Neue Geometriebedeutung erfordert eine neue Geometriekennung.

## Öffentliche IDs und interne Fingerprints

Öffentliche IDs sind **gespeicherte Registryzuordnungen**, keine bei jedem Laden neu
berechneten Hashes. Präfixe: `map-`, `inst-`, `var-`, `pub-`.
Die vier historischen Zuordnungen sind unten verbindlich festgelegt. Ihre Suffixe
erinnern an Legacy-IDs, sind aber anschließend opake, unveränderliche Werte:
Dateien verschieben oder umbenennen ändert sie nicht.

Die Inhaltsidentität wird separat deterministisch berechnet. Vor Registrierung
weiterer Inhalte muss `resolveContentId` den Fingerprint im akzeptierten Archiv
nachschlagen: bekannte Inhalte verwenden die vorhandene ID. Für unbekannte Inhalte
wird eine neue, ausdrücklich gewählte ID einmalig registriert. F02 implementiert
keinen ID-Vergabedienst. `validateArchive` fordert je Ebene eine eindeutige
ID↔Fingerprint-Zuordnung; mehrere Veröffentlichungen dürfen dieselbe Zuordnung nutzen.
Die Reihenfolge der Registrierung spielt für Inhaltsidentitäten und Lookups keine Rolle.

Format eines internen Fingerprints:

```text
gk-<domain>-v1-sha256:<64 Kleinbuchstaben-Hexzeichen>
SHA-256(UTF-8("gezeitenkarten-content/v1/" + domain + NUL + canonicalJson(content)))
```

Domänen sind `map`, `instance`, `variant`, `snapshot`, `publication`.
Referenzen in kanonischen Inhalten verwenden den vollständigen Fingerprint samt
Domänen-/Versionskennung. Identitätsberechnung enthält weder Generatorversion,
Seed, Uhrzeit, Laufzeitumgebung noch Quellpfad. Veröffentlichung und Snapshot
binden dagegen ausdrücklich konkrete Archivpfade und Versionen.
SHA-256 bietet kryptografische Kollisionsresistenz, keine mathematische Kollisionsfreiheit.

Die v1-Kanonisierung ist eingefroren. Eine spätere Implementierung muss dieselben
Testvektoren erfüllen; eine bewusste semantische Änderung benötigt v2 plus explizite
Zuordnung alter/neuer Fingerprints zu bestehenden IDs. Öffentliche IDs werden dabei
niemals aus einem neuen Hash automatisch ersetzt. Der v1-Validator akzeptiert nur
v1; eine solche Migration ist nicht implementiert.

## Kanonisierung v1

`canonicalJson` akzeptiert reine JSON-Werte, sichere Ganzzahlen (−0 wird 0),
Strings, Booleans, null, Arrays und einfache Objekte. Keine Fließkommazahlen,
undefined, lückenhaften Arrays oder besonderen Objektprototypen.
Objektschlüssel werden lexikografisch nach UTF-16-Codeeinheiten sortiert; keine
Locale-Sortierung. Schlüssel und Strings werden mit ECMAScript `JSON.stringify`
escaped, ohne Unicode-Normalisierung oder Leerraum; Hashbytes sind UTF-8.
JSON-Objektschlüssel dürfen nicht doppelt vorkommen; Archivdateien werden als
gewöhnliches JSON aus versionierten Repositorydateien gelesen.

Vor dieser allgemeinen Serialisierung werden die logischen Projektionen gebildet:

- `blocked` und jede `places[id].cells` werden als Mengen lexikografisch sortiert.
  Duplikate sind bereits durch das vorhandene Schema ungültig.
- Die Ortsdictionary-Schlüssel werden wie alle Objektschlüssel sortiert.
- Die Zielroute bleibt vollständig geordnet, einschließlich Startposition.
- Von jedem Basishinweis wird ausschließlich `id` entfernt. `type` und **alle**
  typabhängigen Schemafelder bleiben erhalten. Unbekannte Felder werden abgewiesen.
- Hinweise werden nach ihrer kanonischen JSON-Repräsentation sortiert.
  Die Liste ist eine **Multimenge**: zwei gleiche Bedingungen unter verschiedenen
  Hinweis-IDs bleiben zweimal enthalten. Hinzufügen/Entfernen eines Basisvorkommens
  ändert die Variante, auch wenn es redundant ist. Dies kürzt historische Hinweise nicht.
- Stundenpaare bleiben geordnet: Intervallgrenzen sind keine Mengen. Keine
  algebraische Vereinfachung gleichwertiger Prädikate, keine Lösungsmenge als Hash.
  Beispielsweise werden unterschiedliche strukturierte Formulierungen eines
  geometrisch äquivalenten Hinweises weiterhin unterschieden.
- `presentation` einschließlich `hints`, Ergebnis-/Herkunftstexte, Dokument-ID und
  Datei-/Datenversion werden für die drei logischen Fingerprints nicht gelesen.
  Zusätzliche zukünftige strukturierte Hilfen müssen außerhalb von `logic.clues`
  bleiben; F02 führt dafür kein neues Datenfeld ein.

`logicalFingerprints` verwendet das bestehende Schema und den bestehenden
Referenz-/Routenvalidator; eine explizite `solution` ist für die interne Instanz
erforderlich. Es berechnet keine zweite Lösung und fordert keine Irredundanz.
Ein anderer syntaktisch gültiger Regelname kann zur Domänentrennungsprüfung
gehasht werden; das bestätigt dessen Semantik **nicht**. Veröffentlichungen
akzeptiert dieses Archiv ausschließlich für `gezeitenkarten-1`.

## Manifestformat und Beispiel

`archiveSchemaVersion: 1` und `canonicalizationVersion: 1` gehören zum Archiv,
nicht zum Puzzle-v1-Schema. Die ausführbare, strikte Schemaquelle ist
`archiveSchema` in [publication-archive.mjs](../scripts/lib/publication-archive.mjs).
Sie nutzt den vorhandenen kleinen Schemaevaluator; keine zusätzliche Schema-Kopie
und keine neue Bibliothek. Der Validator prüft darüber hinaus Referenzen,
Byteprüfsummen, Fingerprints, Versionskonsistenz und ID-Bindungen.

Eine tatsächliche Veröffentlichung aus dem Manifest (vollständiger Eintrag):

```json
{
  "publicationId": "pub-historical-reference-3.6-r1",
  "mapStructureId": "map-historical-reference-3.6",
  "instanceId": "inst-historical-reference-3.6",
  "variantId": "var-historical-reference-3.6",
  "rulesVersion": "gezeitenkarten-1",
  "revision": 1,
  "schemaVersion": 1,
  "dataVersion": 1,
  "source": {
    "path": "puzzles/reference-3.6.json",
    "sha256": "18a4cf44653bd577e0cac9d7bdb504551df11411e875fbd925edd7ac52e12b65"
  },
  "snapshotId": "snapshot-historical-main-f01",
  "fingerprints": {
    "mapStructure": "gk-map-v1-sha256:6c0ac809965ebb399e1781722c543c1eecfb0d62132918584aa678b1d4eeacfd",
    "instance": "gk-instance-v1-sha256:d4e0b61e63274c59ca084fdc2b68d923ae4f64d0240da1aab5818dbc92a5e3b7",
    "variant": "gk-variant-v1-sha256:8bc5929c67927599dfb76cd7c70149e0d6f4f52aa2d81f2a32063218c137a85d",
    "publication": "gk-publication-v1-sha256:ff2bf67a19deb68fdf3473abbca836f84241c780876220d1d6a9c49aa70dc383"
  }
}
```

Daneben enthält das Manifest `legacyAliases` mit
`{id,schemaVersion,dataVersion,publicationId}` und `snapshots` mit
`{snapshotId,commit,files:[{path,sha256}],fingerprint}`.
Der gemeinsame Snapshot referenziert den vollständigen F01-Git-Commit und alle
54 Quelldateien der statischen Auslieferung: sämtliche vier Rätsel, Katalog,
Assets, CSS, Module und HTML. Damit werden nicht nur Assetnamen, sondern auch
deren Bytes, Text-/Overlayparameter und die tatsächlich verwendete Darstellung
eingefroren. Das damalige Paketierungsskript und der Regelvertrag liegen ebenfalls
im referenzierten Git-Stand. Kein erneutes Generieren eines Rätsels ist notwendig.

Snapshot-Fingerprints umfassen Commit und die nach Pfad sortierte Dateiliste mit
Rohbyte-SHA-256. Veröffentlichungs-Fingerprints umfassen Regelkennung, Instanz- und
Varianten-Fingerprint, Revision, Schema-/Datenversion, `source` und Snapshot-Fingerprint.
Die öffentlichen IDs selbst gehen nicht in Inhalts-Fingerprints ein.

## Historische Zuordnung

| Bisherige ID | Kartenstruktur | Instanz | Variante | Veröffentlichung |
| --- | --- | --- | --- | --- |
| `reference-3.6` | `map-historical-reference-3.6` | `inst-historical-reference-3.6` | `var-historical-reference-3.6` | `pub-historical-reference-3.6-r1` |
| `test-navigation` | `map-historical-test-navigation` | `inst-historical-test-navigation` | `var-historical-test-navigation` | `pub-historical-test-navigation-r1` |
| `quittung-nombreo` | `map-historical-quittung-nombreo` | `inst-historical-quittung-nombreo` | `var-historical-quittung-nombreo` | `pub-historical-quittung-nombreo-r1` |
| `ankerbuch-tesoro` | `map-historical-ankerbuch-tesoro` | `inst-historical-ankerbuch-tesoro` | `var-historical-ankerbuch-tesoro` | `pub-historical-ankerbuch-tesoro-r1` |

Alle haben Schema-/Datenversion 1, Regelkennung `gezeitenkarten-1`, Revision 1 und
denselben Snapshot. `resolveLegacy` löst das vollständige bisherige Versionstripel
auf; Defaultargumente sind 1/1. Unbekannte Versionen werden nicht auf „latest“ umgebogen.
Der Browser behält seinen bisherigen Loader und seine bisherigen IDs.

## Unveränderlichkeit, Revisionen und spätere Migrationen

Eine akzeptierte Veröffentlichung, ihr Snapshot und ihre Legacyalias-Zuordnung
werden niemals überschrieben oder entfernt. `validateArchive(next,{readBytes,previous})`
prüft diesen Vertrag gegen ein vertrauenswürdiges vorheriges Manifest. Die Tests
verankern alle historischen Einträge einschließlich Snapshot durch einen festen
Golden-Hash; zukünftige Einträge dürfen hinzugefügt werden. Ein selbstkonsistent
neu berechneter Hash allein erlaubt keine Änderung einer akzeptierten ID.
Gitreview und der bisher akzeptierte Archivstand bleiben die Vertrauenswurzel.

Jede Änderung tatsächlich ausgelieferter Texte, Hinweise zur Hilfe, Overlays,
Assets, Renderer oder Quelldateibytes benötigt eine **neue publicationId**, einen
neuen Snapshot und eine höhere `revision` für dieselbe Variante. Auch eine reine
JSON-Umformatierung ist für eine bytegenaue Veröffentlichung eine neue Fassung.
Pro Variante ist jede positive Revisionsnummer einmalig; Lücken sind erlaubt.
Eine Darstellungskorrektur behält alle logischen IDs. Ein anderer Basishinweissatz
ändert die Variante, ein anderer Start/die Route/die Regeln mindestens die Instanz.
Neue Varianten beginnen ihre eigene Revisionsfolge.

Dieselbe Veröffentlichung kann beliebig oft in Paketen oder an Tagesdaten
referenziert werden. Wiederverwendung erzeugt keine neue ID. Solche Zuordnungen
sind hier bewusst nicht modelliert. Erneute Generierung identischen Inhalts wird
über den Fingerprint erkannt; Generatorprovenienz darf getrennt ergänzt werden.

Spätere Erfolge sollten mindestens ursprüngliche `variantId` und `publicationId`
behalten. Eine spätere Wertung muss zusätzlich Hilfenutzung und eigene
Wertungsregelversion berücksichtigen. Darstellungskorrekturen können denselben
Variantenerfolg weiterverwenden, während der tatsächlich gespielte Veröffentlichungsstand
erhalten bleibt. Andere Varianten/Regeln erhalten keine stillschweigende
Erfolgsübernahme. Eine konkrete Migrationsentscheidung erfolgt später ausdrücklich.
Bestehende LocalStorage-Schlüssel werden durch F02 weder gelesen noch migriert.

## Prüfung und Rekonstruktion

```sh
node scripts/validate-archive.mjs
npm run test:unit
npm run test:puzzles
python3 tests/test_package.py
sh scripts/package.sh
```

Die Archiv-CLI liest die Bytes direkt mit `git show <commit>:<path>` und prüft
sämtliche Snapshotdateien. Fehlende Gitobjekte sind ein Fehler; es gibt keinen
Fallback auf heutige Dateien. Dafür benötigt der Unit-CI-Checkout nun die
Git-Historie. Die internen Tests benutzen denselben gepinnten Gitstand.
Die historische Zuordnung sowie heutige Rohbytes der vier Rätsel sind zusätzlich
unabhängig von Änderungen am übrigen aktuellen Renderer eingefroren.

Zur Rekonstruktion in einem separaten Verzeichnis den Snapshot-Commit mit
`git archive` exportieren, dort `python3 scripts/package.py` ausführen und die
Quelldateien gegen `snapshots[].files` prüfen. Das bestehende Skript erzeugt
deterministisch das ZIP und benennt Laufzeitmodule `.mjs` nach `.js` um.
Eine vollständig bytegleiche ZIP-Rekonstruktion benötigt auch die kompatible
Python-/zlib-Werkzeugkette; die gespeicherten Quelldateihashes sind davon unabhängig.
Gitobjekte samt Binärassets müssen dauerhaft gesichert bleiben. Git allein ist
kein externes Backup und garantiert keine unveränderte Darstellung in zukünftigen Browsern.

## Grenzen und F03

Dieses Node-Werkzeug und das Archiv sind interne Autoren-/Repositorydaten, keine
öffentliche Schnittstelle. Das Manifest enthält keine ausgeschriebene Sollroute
oder Generatorseeds, wohl aber interne Fingerprints und Verweise auf die heutigen
Quelldokumente. Hashes sind kein Geheimhaltungsmechanismus für kleine Suchräume.
Das bisherige statische Spiel liefert weiterhin die vorhandenen JSON-Dateien mit
Sollrouten und Solver aus. Es wird kein neuer Spoilerschutz behauptet.
Der Repositoryroot als Entwicklungs-Webroot macht interne Dateien technisch
abrufbar; der produktive Webroot soll das bestehende Deployment-ZIP verwenden.

F03 muss öffentliche Projektion und interne Lösungsdaten tatsächlich trennen,
historische Validatoren bei neuen Schemas/Regelversionen dispatchen und bei Bedarf
ein eigenständiges, gesichertes Archivspeichermedium vorsehen. Ein automatischer
Registrierungs-/Veröffentlichungsprozess muss vor Annahme neuer Snapshots außerdem
die vollständige Laufzeit-Abhängigkeitsliste mit dem Paketierer abgleichen; F02
prüft diese Vollständigkeit für den vorhandenen 54-Dateien-Snapshot.
Irredundanzgate, Qualitätsprüfung, Generator, Hilfedatenmodell, Datenbank und
Spielstandmigrationen bleiben spätere Arbeit. Die historischen Hinweissätze sind
weiterhin von der neuen Irredundanzanforderung ausgenommen.
