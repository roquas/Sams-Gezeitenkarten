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
| `publicationFingerprint(entry,snapshot)` | Regel-/Daten-/Schemaversion, Instanz, Variante, Revision, öffentlicher Quellpfad/-hash, öffentliche Ressourcenbasis und vollständiges sortiertes öffentliches Auslieferungsinventar | Keine ausgelieferten Bytes werden bewusst ausgeschlossen |

Ein Kartenfingerprint braucht **nur die Karte**. Er erzeugt keine künstliche
Instanz/Zielroute und validiert keine Assets. Die logischen Identitäten benötigen
eine gültige Logik und eine explizite legale, hinweiskonforme interne Zielroute;
sie lesen keine Darstellung oder Inhaltsdateien.

Objektreihenfolge und Zellreihenfolge sind bedeutungslos. Objekt-IDs und
Befahrbarkeit sind bedeutungstragend. Doppelte Hinweise bleiben als Multimenge
erhalten. Assettausch, Platzierung, Namen, Texte und Inhaltsrevision verändern
keine logischen Identitäten. Änderungen solcher ausgelieferten Bytes verändern
dagegen die Veröffentlichungsidentität über den öffentlichen Quellhash bzw. Auslieferungsinventar.

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

Ein Snapshot besitzt `snapshotId`, `commit`, `files:[{path,sha256,publicPath?}]`,
`fingerprint` sowie optional `assetCatalog`, `resourceBase` und `publicResourceBase`.
`path` ist der interne Speicherpfad am Herkunftscommit. `publicPath` ist der
Dateipfad innerhalb der öffentlichen Auslieferung; ohne Angabe entspricht er
`path`. Beide Pfadmengen sind eindeutig, relativ und frei von `.`/`..`-Segmenten.

`assetCatalog` bezeichnet die interne Katalogdatei im Inventar. `resourceBase`
ist das interne Ressourcenverzeichnis relativ zur Snapshotwurzel (Standard `.`).
Asset-/Hintergrundreferenzen im Katalog werden wie im Paketloader relativ zu
dieser Basis aufgelöst. `publicResourceBase` bezeichnet das entsprechende
öffentliche Verzeichnis (Standard `.`). Für jede Referenz muss der aufgelöste
interne Inventareintrag genau den passenden öffentlichen Pfad besitzen. Alle
Bildbytes müssen im Inventar stehen und ihren SHA-256 sowie die Freigabehashes
erfüllen. Paket- und Snapshotadapter verwenden denselben relativen Pfadauflöser;
URL-Präfixe wie `/arbitrary/deep/site/` ergänzt ausschließlich der Host/Browser.

Beispiel: `resourceBase:"storage/resources/"`,
`publicResourceBase:"resources/"`, Katalogreferenz `assets/test/island.png`:
`files` pinnt `{path:"storage/resources/assets/test/island.png",
publicPath:"resources/assets/test/island.png",sha256:…}`. Eine separate öffentliche
Paketmanifestdatei enthält die dazu passende öffentliche `resourceBase`; das interne
Paketmanifest zur Quellauflösung ist keine ausgelieferte Datei.

Der Snapshotfingerprint umfasst Herkunftscommit, internes Inventar einschließlich
Zuordnung sowie Katalogpfad und beide Ressourcenbasen. Er dokumentiert somit auch
interne Umzüge. Ein Aufrufer liefert `readBytes(path,commit)`. Jeder Zugriff wird
mit gepinnten Bytes geprüft, niemals mit dem heutigen Katalog.

Die **einzige** Veröffentlichungsfingerprintfunktion normalisiert dieses Inventar
zu sortierten `{path:publicPath??path,sha256}`-Einträgen; öffentlicher Quell- und
Katalogpfad werden durch dieselbe Zuordnung ersetzt. Hinzu kommen die normalisierte
öffentliche Ressourcenbasis und die bereits definierten Veröffentlichungsfelder.
Interne `resourceBase`, interne Pfade, Snapshot-ID/-fingerprint, Herkunftscommit und
private Provenienz gehören nicht in diese Präimage. Bei unverändertem öffentlichen
DTO, Katalog, Assetreferenzen, Lieferpfaden und Assetbytes bleibt daher derselbe
Veröffentlichungsfingerprint und die zugeordnete `publicationId` erhalten. Eine
Änderung ausgelieferter Referenzen, Pfade oder Bytes ändert ihn. Auch öffentliche
Manifestdateien gehören ins Auslieferungsinventar und werden vollständig gepinnt.

Dies präzisiert den v2-Vertrag innerhalb des noch unveröffentlichten PRs: Es gibt
keine zweite Hashlogik und keine registrierte Veröffentlichung zu migrieren.
Die festen Snapshot-/Veröffentlichungsvektoren sind entsprechend aktualisiert.
Akzeptierte Snapshot- und Publikationsdatensätze bleiben trotzdem unveränderlich;
ein interner Umzug erlaubt keine nachträgliche Änderung ihrer Archivhistorie.

Veröffentlichungen binden die vier IDs, Regelversion, Revision, Schema-/Datenversion,
interne `source` und öffentliche `publicSource` (je Pfad und Hash), Snapshot und Fingerprints.
Die interne Definition wird separat am Snapshot-Commit gelesen und gehasht; sie
darf nicht im ausgelieferten Dateiinventar stehen. Der öffentliche DTO muss exakt
der Projektion dieser internen Definition entsprechen. Private Provenienz/Seeds
ändern bei unveränderter Auslieferung keine Veröffentlichungsidentität. Auch
der reine Herkunftscommit ist kein ausgelieferter Inhalt: Er gehört zum gepinnten
Snapshot, nicht zum Veröffentlichungsfingerprint. IDs und Fingerprints werden bijektiv
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
