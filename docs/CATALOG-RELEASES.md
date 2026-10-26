# Persistente Assetkatalog-Releases (Phase B, Format 1)

Ein Release bindet den vollständigen Bibliotheksbestand, technische Prüfergebnisse,
produktive Auswahl und eine ausdrücklich ausgeführte Freigabe. Git-Historie und
SHA-256 schützen gegen versehentliche Änderungen und inkonsistente Stände. Dies
ist keine absolute Unveränderlichkeit und kein Schutz gegen böswillige Administratoren.

## Ablage und Identitäten

`archive/catalog-releases/<release-id>/` enthält genau fünf JSON-Dateien:

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | Format, Identitäten, Quellcommit, Katalogpfad/Ressourcenbasis, Datei-SHA-256 |
| `inventory.json` | Alle referenzierten Bilder/Hintergründe, beide Rahmen, Katalog, Schema, deklarierte ausführbare Grafikverträge und Release-/Rahmenkonfiguration |
| `validation.json` | Einzelnachweise für alle Assets, Hintergründe, Rahmen und produktiven geografischen Anker; Implementierungs- und Werkzeugversionen |
| `selection.json` | Aus den eingefrorenen Metadaten abgeleitete produktive geografische Auswahl |
| `approval.json` | Explizite Entscheidung mit Release-ID, exaktem Manifesthash, Name und UTC-Zeitpunkt |

Bilddateien werden nicht kopiert. Alle Ressourcen werden aus `sourceCommit` gelesen.
Git verwendet identische Blobs über mehrere Releases hinweg erneut. Der Quellcommit
muss Vorfahr des Archivcommits sein und bleibt damit über die normale Historie erreichbar.

`catalogId` bindet das sortierte vollständige Ressourceninventar mit eigener
versionierter SHA-256-Domäne. `releaseId` bindet das Manifest ohne sein eigenes
ID-Feld, einschließlich der SHA-256 von Inventar, Prüfung und Auswahl. Die Freigabe
ist ein separater Nachweis; sie ändert die Release-ID nicht. Bestehender
`catalogSha256`, Karten- und Publikationsidentitäten bleiben unverändert.

Kandidaten enthalten genau die ersten vier Dateien. Ihre Identitäten enthalten
keine Zeitstempel oder temporären Pfade. JSON-Verträge und Rahmenberichte mit
Fließkommazahlen werden über Datei-Bytes gebunden, nicht mit dem eingeschränkten
vorhandenen JSON-Kanonisierer normalisiert.

## Voraussetzungen und gepinnte Prüfung

Node 22+, Git und verfügbare Quellhistorie sind erforderlich. Nur die Erstellung
benötigt zusätzlich Python 3 mit Pillow und NumPy. Die tatsächlich verwendeten
Versionen sowie die WebP-/zlib-Versionen stehen im Nachweis. Gleicher Quellcommit und gleiche Prüfumgebung
ergeben bytegleiche Kandidaten; andere Werkzeugversionen können die Release-ID ändern.

Der Quellcommit muss diese Phase-B-Infrastruktur einschließlich
`scripts/config/catalog-release-v1.json` enthalten. Ältere Commits ohne diesen
Prüfvertrag werden ausdrücklich abgewiesen. Es gibt keinen impliziten Rückfall auf
neuere Prüfer aus dem Arbeitsverzeichnis.

`build` materialisiert den inventarisierten Bestand und die JS-/Python-Dateien unter
`src/` und `scripts/` aus genau diesem Commit in einem temporären Verzeichnis.
Auch der dort gestartete Releaseprüfer, seine importierten Validatoren, Python-
Pixelprüfer und die Rahmengeometrie stammen aus diesem Snapshot. Der Nachweis
enthält die vollständige Liste dieser Implementierungsdateien mit SHA-256.
Dies ist bewusst eine konservative Abhängigkeitsmenge; Änderungen auch an nicht
aufgerufenen Skripten können die Releaseidentität verändern.

Die vorhandene lokale Bildprüfung wird für alle Assets verwendet. Für die
produktiven geografischen Assets wird zusätzlich für jeden geometrisch passenden
Anker bestätigt, dass `placementContract` exakt `imageContract` entspricht.
Die lokale Pixelprüfung und dieser Gleichheitsnachweis begründen gemeinsam die
vollständigen gespeicherten Ankerlisten (`local-contract-equality-1`). Es gibt
keine erneut eingeführten Randfilter und keine Änderung der bisherigen Adapter.

Die eingefrorene Rahmen-JSON-Datei muss mit dem ausführbaren Rahmenvertrag desselben
Snapshots übereinstimmen. Beide Rahmen werden mit dem vorhandenen vollständigen
Pixelquadratprüfer geprüft. Archivierte Alternativhintergründe müssen statische,
dekodierbare PNG-/WebP-Dateien sein; sie erhalten nicht den besonderen Maßvertrag
des produktiven Meeres.

## Ablauf

Aus dem Repositorywurzelverzeichnis, mit Platzhaltern für explizite Werte:

```sh
node scripts/catalog-release.mjs build --source <COMMIT> --out <NEUES_KANDIDATENVERZEICHNIS>
node scripts/catalog-release.mjs verify --candidate <KANDIDATENVERZEICHNIS>
node scripts/catalog-release.mjs approve --candidate <KANDIDATENVERZEICHNIS> \
  --release-id <ID> --manifest-sha256 <HASH> --by <NAME>
```

`build` und `verify` erteilen keine Freigabe. `approve` prüft den Kandidaten erneut
ohne Bildanalyse und verlangt die bewusst angegebenen Identitäten. Erst dieses
Kommando erzeugt `approval.json` und übernimmt das vollständige Verzeichnis ins Archiv.
Der Name dokumentiert die Entscheidung; es gibt kein Rollen- oder Signatursystem.

Danach werden die fünf Dateien regulär eingecheckt. Das Freigabekommando erzeugt
weder Commit noch Push. Ein gewöhnlicher Commit, Merge oder CI-Lauf erzeugt keine
Freigabe. CI ruft niemals das produktive Freigabekommando auf; automatisierte Tests
verwenden ausschließlich isolierte Testrepositorys.

```sh
node scripts/catalog-release.mjs verify --release <ID>
node scripts/catalog-release.mjs check-archive --previous <VORHERIGER_HAUPTSTAND>
```

Der Release-Loader liest das Archiv aus einmalig aufgelöstem `HEAD`, nicht aus dem
Arbeitsverzeichnis. Noch nicht eingecheckte Freigaben sind deshalb nur als Dateien
vorhanden und werden vom produktiven Loader noch nicht gefunden.

## Ladevertrag

```js
import {loadCatalogRelease} from '../scripts/lib/catalog-release.mjs';
const release = loadCatalogRelease({repositoryRoot, releaseId});
const bytes = release.readResource('assets/library/example.png');
```

Der Loader prüft Manifest und Freigabebindung, sämtliche Ressourcenbytes aus Git,
Metadaten, Reviewhashes, Auswahl und jeden erwarteten technischen Einzelnachweis.
Unbekannte Versionen, fehlende Objekte, doppelte/unvollständige Ergebnisse oder
Abweichungen führen zum Fehler. Es gibt keine automatische Neuvalidierung,
Reparatur oder Verwendung aktueller Arbeitsdateien.

Der zurückgegebene Kontext ist tief eingefroren; Ressourcenzugriffe liefern Kopien
privat gehaltener verifizierter Bytes. Laden und Prüfen starten nur Git, niemals
Python/Pillow oder den Bildprüfer. Die Kosten sind proportional zu den gelesenen
Ressourcenbytes; Git-Zugriffe werden innerhalb einer Prüfung zwischengespeichert.

## Konfiguration, Abbrüche und Grenzen

Format 1 konfiguriert ausschließlich `sea-blue-01` als Produktionshintergrund.
Dies steht in der versionierten Konfigurationsdatei, nicht als feste Hintergrund-ID
im Loader. Kunstfreigaben und `productionEnabled` bleiben unverändert. Insbesondere
wird die zurückgestellte Schaumströmung nicht ausgewählt.

Bestehende Releaseverzeichnisse werden nie überschrieben. Gleichzeitige Freigaben
derselben ID werden über eine exklusiv angelegte Lockdatei serialisiert; ein
vollständiges Verzeichnis wird abschließend atomar umbenannt. Bei Prozessabbruch
können `.pending-*` oder `.ID.lock` zurückbleiben. Nach Prüfung, dass kein Vorgang
mehr läuft, dürfen ausschließlich diese temporären Dateien manuell entfernt
werden. Sie sind keine Releases und dürfen nicht eingecheckt werden. Teilstände
oder unerwartete Archivdateien werden von der CI abgewiesen.

Die CI vergleicht bestehende Archivdateien byte-/modusgenau mit dem vorherigen
Hauptstand und validiert alle neuen Releases. Ein absichtliches Überschreiben der
Git-Historie wird durch dieses Modell nicht abgesichert. Flache Klone müssen die
referenzierten Quellcommits bereitstellen; fehlende Git-Objekte werden gemeldet.

Phase C übernimmt erst die Anbindung an `assignAssets`/`createCatalogProfile` und
die spätere Ablösung der Ankerlisten. Batchgenerierung, Spieloberfläche und ein
eigenständiger Export sind nicht Bestandteil von Phase B. Fertige veröffentlichte
Rätsel benötigen keine Git-Historie.
