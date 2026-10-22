# F02 – Identitäten und Archiv v2

Node-Modul: `scripts/lib/publication-archive.mjs`. Es unterstützt ausschließlich
das neue Modell. Das leere `archive/publications-v2.json` registriert keine
Veröffentlichung; die Probefahrt ist ein technisches Demo-/Testpaket.

## Identitätsebenen

| Ebene | Inhalt | Ausgeschlossen |
| --- | --- | --- |
| `mapFingerprint(map)` | Geometriekennung, Raster, Objekt-IDs, sortierte Zellmengen, Befahrbarkeit | Start, Etappen, Route, Hinweise und gesamte Darstellung |
| `logicalFingerprints(document).instance` | Kartenfingerprint, Regelversion, Startzelle, Etappen, explizite interne Zielroute | Hinweise und Darstellung |
| `.variant` | Instanzfingerprint und sortierte Multimenge strukturierter Hinweise | Redaktionelle Hinweis-IDs und Hinweisreihenfolge; Texte |
| `publicationFingerprint(entry,snapshot)` | Regel-/Daten-/Schemaversion, Instanz, Variante, Revision, öffentlicher Quellpfad/-hash und vollständiger Auslieferungs-Snapshotfingerprint | Keine ausgelieferten Bytes werden bewusst ausgeschlossen |

Ein Kartenfingerprint braucht **nur die Karte**. Er erzeugt keine künstliche
Instanz/Zielroute und validiert keine Assets. Die logischen Identitäten benötigen
eine gültige Logik und eine explizite legale, hinweiskonforme interne Zielroute;
sie lesen keine Darstellung oder Inhaltsdateien.

Objektreihenfolge und Zellreihenfolge sind bedeutungslos. Objekt-IDs und
Befahrbarkeit sind bedeutungstragend. Doppelte Hinweise bleiben als Multimenge
erhalten. Assettausch, Platzierung, Namen, Texte und Inhaltsrevision verändern
keine logischen Identitäten. Änderungen solcher ausgelieferten Bytes verändern
dagegen die Veröffentlichungsidentität über den öffentlichen Quell-/Snapshot-Hash.

## Kanonisierung und feste Vektoren

Kanonisches JSON sortiert Objektschlüssel lexikografisch, erhält Arrayreihenfolgen
und erlaubt nur JSON-Werte mit sicheren ganzen Zahlen. Semantische Mengen werden
vorher gezielt normalisiert. Hashpräimage:

`gezeitenkarten-content/v2/<domain>\0<canonicalJson>`

Ergebnis: `gk-<domain>-v2-sha256:<64 hex>`. Domains: map, instance, variant,
snapshot, publication. Der Vertrag verwendet ausdrücklich eine neue Hashdomäne.
Feste Snapshot-/Veröffentlichungsvektoren stehen in `tests/fixtures/model/archive-vectors.json`.
Feste Karten-/Instanz-/Variantenvektoren:
`tests/fixtures/model/identity-vectors.json`; Quellfixture:
`tests/fixtures/model/factories.mjs`. Die Tests sichern zusätzlich
Reihenfolgeinvarianz, Footprint-/Befahrbarkeitsänderung, Startänderung,
Hinweismultiplizität und Unabhängigkeit von Assetauswahl/Darstellung ab.

## Generisches Archiv

`archiveSchemaVersion:2`, `canonicalizationVersion:2`, `snapshots`, `publications`.
Beide Listen dürfen leer sein. Es gibt keine `legacyAliases` und keine alten
Fingerprints, die zur Laufzeit konserviert werden müssen.

Ein Snapshot besitzt `snapshotId`, `commit`, `files:[{path,sha256}]`, `fingerprint`
und optional `assetCatalog` als ausdrücklichen Pfad innerhalb seines Inventars.
Der Snapshotfingerprint umfasst Commit, sortiertes vollständiges Dateiinventar
und diesen optionalen Katalogpfad. Ein Aufrufer liefert `readBytes(path,commit)`.
Jeder Zugriff wird mit gepinnten Bytes geprüft, niemals mit dem heutigen Katalog.
Bild- und Hintergrundfreigaben werden gegen genau diese Snapshotdateien geprüft.

Veröffentlichungen binden die vier IDs, Regelversion, Revision, Schema-/Datenversion,
interne `source` und öffentliche `publicSource` (je Pfad und Hash), Snapshot und Fingerprints.
Die interne Definition wird separat am Snapshot-Commit gelesen und gehasht; sie
darf nicht im ausgelieferten Dateiinventar stehen. Der öffentliche DTO muss exakt
der Projektion dieser internen Definition entsprechen. Private Provenienz/Seeds
ändern bei unveränderter Auslieferung keine Veröffentlichungsidentität. IDs und Fingerprints werden bijektiv
gebunden; doppelte Revisionen oder widersprüchliche Bindungen sind Fehler.
Mit `previous` bleiben akzeptierte Veröffentlichungen/Snapshots unveränderlich;
neue Revisionen müssen über der bisher höchsten Revision der Variante liegen.
Das ist ein Offline-Integritätsvertrag, kein automatischer Veröffentlichungsdienst.

`createArchiveProjector` kopiert das Manifest, prüft es und überprüft Quellbytes
bei jeder Projektion erneut. Es übernimmt registrierte Identitäten sowie
`sourcePublicationId` als Herkunftsverweis und übergibt den gepinnten Assetkatalog
an die öffentliche Projektion. Es erstellt keine neue Veröffentlichung.

## Entfernte Schnittstellen

`resolveLegacy`, Archiv-v1-Manifeste, v1-Hashdomäne und die vier historischen
Veröffentlichungszuordnungen entfallen. `scripts/lib/puzzle-contract.mjs`,
`puzzle-analysis.mjs` und `public-puzzle.mjs` entfallen zugunsten der direkt
verwendbaren Module unter `src/engine/` und `src/puzzles/`. Es gibt keine
Kompatibilitätsfassaden.
