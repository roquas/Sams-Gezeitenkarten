# Persistente Assetkatalog-Releases (Phase B, Format 1)

Ein Release bindet den vollständigen Bibliotheksbestand, technische Prüfergebnisse,
produktive Auswahl und eine ausdrücklich ausgeführte Freigabe. Git-Historie und
SHA-256 schützen gegen versehentliche Änderungen und inkonsistente Stände. Dies
ist keine absolute Unveränderlichkeit und kein Schutz gegen böswillige Administratoren.

## Erste reguläre Freigabe: initialer technischer Referenzstand

Die Freigabe durch **Projekt Sams-Gezeitenkarten** vom
`2026-10-26T23:58:35.532Z` ist der initiale technische Referenzstand für Phase C
und die anschließende Erprobung der vorhandenen Assets in generierten Seekarten.
Sie wurde mit der vorgesehenen CLI ausdrücklich ausgeführt und verwendet
ausschließlich die vorhandenen Kunstfreigaben und `productionEnabled`-Regeln.

| Nachweis | Wert |
| --- | --- |
| Quellcommit auf `main` einschließlich PR #81 | `ccab5f41dae380525f7535de4470848a3ab4d214` |
| Katalog-ID | `gk-catalog-content-v1-sha256-3f406882907a76f99b3c6f816dc664f28f55d1ba42f01baa5fc637dc0b742bd1` |
| Release-ID | `gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1` |
| Manifest-SHA-256 | `f541bfceb8a9ee6fb941b27bf559b11e23a6fb85455cdb34467ab18d3cba2f91` |
| Vollständiger Bestand | 40 Assets, 3 Hintergründe, beide Rahmen; 54 inventarisierte Ressourcendateien |
| Produktive Auswahl | 18 geografische Assets auf `sea-blue-01`, 368 geometrisch passende Anker |

Die fünf freigegebenen Dateien liegen unter
[`archive/catalog-releases/gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1/`](../archive/catalog-releases/gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1/).
Der Bestand enthält auch Entwürfe, historische und zurückgestellte Motive.
Die Produktionsauswahl bleibt unverändert; insbesondere bleibt die zurückgestellte
Schaumströmung ausgeschlossen. Grafikdateien und künstlerische Einzelentscheidungen
wurden nicht geändert.

Die gepinnten Prüfer bestätigen Schema, Referenzen, Kunstfreigabehashes,
Bildformate, Bildmaße, Alpha, nichtleere Bildinhalte, Orientierung und lokale
Pixelverträge für alle 40 Assets. Beide Rahmen bestehen jeweils den vollständigen
Prüfumfang von 2.234.040 Pixelquadraten ohne Alphaüberschneidung sowie die Prüfung
ihrer jeweils 20 Beschriftungszonen. Alle 368 produktiven Anker erfüllen die
Gleichheit von lokalem und platziertem Grafikvertrag. Die 54 Ressourcen wurden
zusätzlich direkt gegen die Bytes und SHA-256 aus dem Quellcommit geprüft;
die Auswahl stimmt mit der bestehenden `productionEnabled`-Auswertung überein.

Die im Nachweis gespeicherte Prüfumgebung ist Node 24.19.0, Python 3.12.14,
Pillow 12.3.0, NumPy 2.3.5, WebP 1.6.0 und zlib 1.3.1. Andere Werkzeugversionen
können bei einer Neuerstellung eine andere Release-ID ergeben; für die weitere
Verwendung gilt das archivierte Release mit den oben angegebenen Identitäten.
Die im Rahmenbericht benannten künstlerischen Sichtprüfgrenzen bleiben bestehen;
diese technische Referenzfreigabe erfindet keine neuen Kunstfreigaben.

Phase C und die automatische Rätselgenerierung sind nachgelagerte Arbeiten.

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

## Stabiler V1-Laufzeitvertrag

`scripts/lib/catalog-release-v1.mjs` hält ausschließlich die für historische V1-
Releases benötigte fachliche Auswertung fest: Metadatenschema und -konsistenz,
Reviewhashes, Produktionsauswahl, Bildmaße und axiale Translation im 5×5-Raster.
Das historische Bibliotheksschema bleibt gepinnte JSON-Daten; seine kanonische
SHA-256 kennzeichnet die unterstützte Definition. Es wird keine zweite vollständige
Schema-, Rendering-, Polygon- oder Platzierungsimplementierung angelegt.

Der Loader und der äußere Buildpfad importieren keine allgemeinen Geometrie-,
Bibliotheks- oder Archivfachmodule mehr, auch nicht transitiv über Hashhelfer.
SHA-256/Kanonisierung, Pfadauflösung und der allgemeine JSON-Schema-Prüfkern bleiben
gemeinsame, datengetriebene Hilfsfunktionen. Die bisherigen öffentlichen APIs dieser
Helfer bleiben erhalten. Änderungen an allgemeinen Spiel-/Assetverträgen dürfen die
V1-Auswertung nicht ändern; neue Fachverträge benötigen eine neue Version.

Wiederholt gemeldete Formate und Bildmaße derselben Bildbytes (gleicher SHA-256)
müssen übereinstimmen, auch unter verschiedenen Pfaden und einschließlich des
Meeres in Hintergrund- und Rahmenbericht. Für Rahmenvertrag 4
ist der geografische Prüfumfang bei festem Canvas, Maßstab und Raster exakt
2.234.040 Quellpixelquadrate je Rahmen. Der Loader kontrolliert diesen versionierten
Wert und die zugehörige Rasterdefinition. Er erzeugt dabei weder Pixelmasken noch
dekodiert er Bilddateien. Auch konsistent verkürzte oder neu gehashte widersprüchliche
Berichte werden abgewiesen.

Die Regression startet frische CLI-/Loaderprozesse aus einem tatsächlich veränderten
Laufzeitcheckout: Die allgemeine Translation liefert dort absichtlich nur ein
Außenfeld, weitere allgemeine Fachmodule werfen beim Import. Das unveränderte
historische Testrelease behält dennoch seine Identitäten, Auswahl und 368 Anker.
Auch der äußere Buildpfad wird aus dieser Installation gegen den historischen
Quellcommit geprüft. Sämtliche Testfreigaben bleiben in temporären Testrepositorys.

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
