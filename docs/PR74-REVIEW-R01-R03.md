# PR #74: Korrekturen R01–R03

Ausgangspunkt: `5600631dd6f67f4925099165a900e59f7ec5eac0` auf
`feature/unified-puzzle-model`. Keine neue Architektur, keine F04b-Implementierung,
kein Merge nach `main`.

## R01: Ressourcenauflösung und öffentliche Identität

Ursache: `snapshotAssetLibrary()` interpretierte Katalogreferenzen unmittelbar als
Snapshotpfade. Die im Inhaltspaket ausdrücklich gesetzte Ressourcenbasis ging
verloren. Außerdem umfasste die Veröffentlichungspräimage interne Inventarpfade.

Korrektur: Paketloader, Dateivalidierung, Archivvalidator und Archivprojektor
verwenden denselben paketrelativen Pfadauflöser. Snapshots pinnen die interne
`resourceBase` und die öffentliche `publicResourceBase`. Inventareinträge können
mit `publicPath` einen abweichenden öffentlichen Lieferpfad ausdrücklich angeben.
Die Archivvalidierung verlangt eindeutige Lieferpfade, konsistente Zuordnung jeder
Katalogreferenz und unveränderte gepinnte Bytes. Der Projektor prüft diese bei
jeder Projektion erneut.

Die vorhandene `publicationFingerprint()` bleibt die einzige Hashfunktion für
Veröffentlichungen. Sie verwendet die öffentlichen Lieferpfade, Referenzen und
Bytehashes; interne Ressourcenpfade und private Provenienz bleiben ausgeschlossen.
Der Snapshotfingerprint bindet weiterhin die interne Auflösung und Herkunft.
Der präzisierte Vertrag und die Aktualisierung der festen Hashvektoren stehen in
[PUBLICATION-ARCHIVE-V2.md](PUBLICATION-ARCHIVE-V2.md).

Regressionen in `tests/contracts/archive-resources.test.mjs`:

- Reales temporäres Paket mit verschobener Ressourcenbasis: Paketlesen,
  Assetvalidierung, Kompilierung, vollständige Puzzle-/Bild-CLI-Prüfung,
  Archivvalidierung und Archivprojektion. Die isolierten PNG-/WebP-Bilder sind
  dekodierbar und erfüllen den Alpha-/Footprintvertrag.
- Laden desselben öffentlichen Lieferinventars unter einem tiefen URL-Unterpfad.
- Gleicher Veröffentlichungsfingerprint bei verschiedenen internen Ressourcenbasen.
- Andere öffentliche Assetreferenz oder andere Assetbytes ergeben einen anderen
  Veröffentlichungsfingerprint.
- Fehlende, manipulierte, nicht inventarisierte oder falsch zugeordnete Ressourcen
  sowie doppelte öffentliche Lieferpfade werden verständlich abgewiesen.
- Ein bereits erzeugter Projektor erkennt spätere Byteänderungen.
- Relative Verzeichnisse werden normalisiert, Root-Escapes/absolute URLs abgewiesen.

Grenze: Der Aufrufer liefert weiterhin den gepinnten Commit-Bytezugriff. Das Archiv
ist kein Hostingdienst. Öffentliche Paketmanifeste müssen zum öffentlichen
Lieferinventar gehören; interne Quellmanifeste ersetzen diese nicht. Das bestehende
Archiv ist leer, es gibt keine akzeptierten Veröffentlichungen zu migrieren.

## R02: Eigene Objektlabels

Ursache: Der Renderer konnte bei fehlenden Namen geerbte Eigenschaften wie
`Object.prototype.constructor` lesen und als Text ausgeben.

Korrektur: `drawMap()` verwendet `Object.hasOwn()`; andernfalls erscheint die
Zellliste. Die übrigen relevanten v2-Zugriffe wurden geprüft: Hinweistexte verlangen
bereits eigene Einträge im Validator, Schemaproperties und öffentliche Projektionen
prüfen eigene Eigenschaften, logische Objektzugriffe verwenden Objektlisten/Maps.
Kein weiterer nachgewiesener gleichartiger Fehler bei gültigen v2-Daten.

Regression: Der gemeinsame Browser-/ZIP-Modelltest erzeugt unbenannte Objekte mit
`constructor`, `toString` und `hasOwnProperty`, prüft alle Koordinatenlabels und
anschließend ausdrücklich gesetzte eigene Namen für dieselben drei IDs.

Grenze: Keine neue Einschränkung gültiger Objekt-IDs; keine reservierten Namen.

## R03: Native Scrollabnahme

Die GitHub-Check-Annotationen des Ausgangsheads zeigen einen globalen
30-Sekunden-Timeout beim dritten Scrollversuch (Radar) bei 820px; der Retry
verbraucht dasselbe Budget bereits beim Bounding-Box-Zugriff. Andere 42 Tests
des Shards bestanden. Der Download der ursprünglichen CI-ZIP-Traces und Logs
ist an den umgeleiteten Azure-/Actions-Hosts durch die Netzwerk-Allowlist der
Arbeitsumgebung gesperrt. Die Annotationen sind zugänglich.

Lokale instrumentierte Gegenproben zeigen: PageDown beginnt abhängig vom
Renderingzustand mit wenigen Pixeln und erreicht später 643px. Der alte Test
fuhr bereits nach dem ersten Messwert über 20px fort und setzte die noch laufende
native Scrollanimation zurück. Er verband drei Gesten, mehrere Resets, Fokuswechsel
und einen Radar-Neurender in einem gemeinsamen 30-Sekunden-Budget. Ein erster
lokaler Lauf mit vollständigem `scrollend`-Warten reproduzierte den Timeout erst
beim dritten Versuch, obwohl Wasser- und Landscrollen vollständig funktioniert
hatten. Das ist ein Fehler der Testanordnung; die Gegenprobe belegt keine
grundsätzlich blockierte native Scrollfunktion.

Korrektur im gemeinsamen Test:

- Wasser, Land und wartender Radar werden in eigenständigen Fällen geprüft.
- Programmatisches Zurücksetzen wird vor der nächsten Trefferprüfung abgearbeitet.
- Trefferziel, tatsächlicher Scrollweg und Fokusinhaber werden ausdrücklich geprüft.
- WebKit: synthetische Pointerereignisse prüfen ausschließlich die Ereignisgrenze;
  anschließend prüft native PageDown-Eingabe die Scrollbedienbarkeit.
- Die native PageDown-Taste bleibt gedrückt, bis der Browser tatsächlich mehr als
  20px Scrollbewegung verarbeitet hat; `finally` gibt sie frei. Die ursprüngliche
  5s-Bewegungsassertion und das 30s-Fallbudget bleiben bestehen.
- Ein vollständiges `scrollend` ist keine zusätzliche Bestehensbedingung mehr:
  Die erste lokale Korrektur bestand, der CI-Lauf auf `03ce1a9` zeigte jedoch,
  dass dieses spätere Compositor-Ereignis bei 820px ausbleiben oder erst nach dem
  Prüfzeitfenster ankommen kann. Die geforderte native Bewegung bleibt zwingend.
- Erst **nach** dem gemessenen Bewegungsnachweis beendet der Treiber verbleibende
  native Animation/Inertia am erreichten Offset. Dadurch können die anschließenden
  Buch-/Tap-Prüfungen nicht mit einer vom Test selbst begonnenen Animation rennen.
  Es werden keine Scrollbewegungen für die Bestehensassertion per Skript erzeugt.
- Scrollmesswerte werden als JSON-Testattachment protokolliert.
- Dieselben vollständigen Scroll-/Touchfälle laufen auch gegen das tatsächlich
  entpackte ZIP unter `/gk/pr38/` (vier Browser-/Geräteprofile).

Die instrumentierten Messwerte stehen in
[verification/PR74-R01-R03-scroll-probe.json](verification/PR74-R01-R03-scroll-probe.json).
Die unveränderte Anwendung benötigt dafür keine neue Scrolllogik.

Grenze: Playwright WebKit bietet keinen nativen iOS-Touch-Drag. Die DOM-Pointer-
und PageDown-Prüfungen sind ausdrücklich getrennt; eine physische iOS-Wischgeste
bleibt eine Geräteabnahme. Mangels Zugriff auf die ursprünglichen CI-Traces wird
die exakte Herkunft des dort berichteten 12px-Zwischenwerts nicht behauptet.

Die vollständigen Prüfgruppen deckten zusätzliche vorhandene Testfehler auf.
Diese eng begrenzten Abnahmekorrekturen ergänzen die drei Findings; Anwendung,
Regeln, Grafiken und Timeouts werden dadurch nicht verändert:

- `materials.spec.mjs`: `.turning-leaf` verschwand zwischen `count()` und der
  Attributassertion. Beide Prüfungen erfolgen atomar. Die Entfernung wird nach
  der natürlichen Web-Animation-`finished`-Promise geprüft, statt eine feste
  2s-Wanduhrfrist auf softwaregerenderte Frames anzuwenden. Die Prüfung jedes
  vorhandenen Blatts auf `aria-hidden="true"` und die erforderliche Entfernung
  bleiben bestehen; die Animation wird nicht durch den Test beendet.
- `gui-final-review.spec.mjs`: Drei unabhängige Überschreib-/Löschfälle hatten
  ein gemeinsames 30s-Budget für zwölf Eingaben. Jeder Fall verwendet jetzt einen
  frischen Kontext mit derselben Maybe-Markierung und prüft den jeweiligen
  echten Eingabeweg sowie den erhaltenen Radarzustand separat.
- `layout-polish.spec.mjs`: Sieben Bilder mit mehreren Viewportwechseln standen
  unter einem gemeinsamen 30s-Budget. Desktop, Mobil und schmale Mobilansicht
  sind eigenständige Fälle; alle sieben Aufnahmen bleiben erhalten. Der jeweilige
  Viewport wird bereits vor der Navigation festgelegt.
- Die drei genannten Dateien laden ihren bereits frischen Playwright-Kontext
  einmal; das unnötige vorherige Laden/Löschen/Neuladen entfällt.
- `ui-ink-status.mjs`: `document.load` garantiert noch keinen abgeschlossenen
  asynchronen DTO-/Katalogloader. Vor gespeicherten Zustandsprüfungen wird die
  tatsächlich aufgebaute interaktive Karte abgewartet; die anschließenden
  Zustandsassertions bleiben bei ihren bisherigen Fristen. Dasselbe gilt nach
  Reload. Dies behebt die zwei von CI gemeldeten Start-Races bei 820px.

Der Lauf auf `03ce1a9` bestand lokal mit 270 Chromium-Fällen und in GitHub mit
vollständigem Browser-, Asset- und Deployment-Job. Drei WebKit-Shards meldeten
jedoch die oben ausgewerteten Fehler bzw. Flakes. Sie werden nicht als grüne
Gesamtabnahme ausgewiesen. Der unterbrochene lokale ZIP-Lauf dieses Zwischenstands
hatte 171 bestandene und zwei beim Abbruch unterbrochene Fälle; sein Nachfolger
prüft den überarbeiteten Stand vollständig.

## Geänderte Dateien gegenüber dem Review-Ausgangspunkt

Produktionscode:
`src/ui/map.mjs`, `scripts/lib/package-path.mjs`,
`scripts/lib/content-package.mjs`, `scripts/lib/publication-archive.mjs`,
`scripts/validate-assets.mjs`.

Regressionen:
`tests/contracts/archive-resources.test.mjs`,
`tests/fixtures/model/archive-vectors.json`,
`tests/integration/model-game.mjs`, `tests/integration/chart-scroll.mjs`,
`tests/deployment/chart-scroll.spec.mjs`, `tests/browser/materials.spec.mjs`,
`tests/browser/gui-final-review.spec.mjs`, `tests/browser/layout-polish.spec.mjs`,
`tests/integration/ui-ink-status.mjs`.

Vertrag und Nachweise:
`docs/PUBLICATION-ARCHIVE-V2.md`, `docs/PR74-REVIEW-R01-R03.md`,
`docs/verification/PR74-R01-R03-results.json`,
`docs/verification/PR74-R01-R03-scroll-probe.json`.

## Verifikation

Die gezielte lokale Abnahme und die schnellen vollständigen Prüfgruppen sind in
[verification/PR74-R01-R03-results.json](verification/PR74-R01-R03-results.json)
festgehalten. Die weitere vollständige Browser-, Asset- und ZIP-Abnahme sowie
der aktuelle GitHub-CI-Status stehen im [bestehenden PR #74](https://github.com/roquas/Sams-Gezeitenkarten/pull/74).
Lokale Läufe und GitHub-CI werden getrennt ausgewiesen; der frühere CI-Fehler wird
nicht als Ergebnis des korrigierten Heads dargestellt.
