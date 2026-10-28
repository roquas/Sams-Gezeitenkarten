# Rätsel- und Inhaltspaketvertrag v2

Geltende Regeln: [gezeitenkarten-2](RULESET-GEZEITENKARTEN-2.md).
Die ausführbaren Schemas in `src/puzzles/schema.mjs` und
`src/assets/library.mjs` sind die Quelle der JSON-Schemas unter `puzzles/schema/`.
Schema 1, typisierte Ortslisten und Overlays werden nicht mehr angenommen.

## Dokument und öffentliche Auslieferung

Ein internes Dokument hat `schemaVersion:2`, `rulesVersion:"gezeitenkarten-2"`,
`dataVersion` als positive Inhaltsrevision, `id`, `logic` und `presentation`.
Optional sind `solution` (interne Zielroute), `metadata` und `resultTexts`.
Die Karte ist `logic.map`; Start, Etappen und strukturierte Hinweise stehen
außerhalb der abstrakten Karte. `dataVersion` registriert keine andere Regel-
oder Schemabedeutung; weitere positive Inhaltsrevisionen sind zulässig.

Darstellung:

- `title`, `intro`, `hints`: öffentliche Texte.
- `objectNames`: optionale Namen für bekannte Objekt-IDs. Keine Klassentabelle.
- `clueTexts`: genau ein öffentlicher Text je strukturierter Hinweis-ID.
- `background`: Referenz in einem ausdrücklich übergebenen Assetkatalog.
- `assetPlacements`: moderne Platzierungen; keine Größen, Rotationen oder Overlays.

Öffentliche Dokumente sind DTOs mit `projectionSchemaVersion:2`, `rulesVersion`,
`identity:{mapStructureId,instanceId,variantId,sourcePublicationId?}` und `puzzle`.
`projectPublicPuzzle` kopiert rekursiv nur erlaubte Felder. Zielroute, Seeds,
Generatorinformationen, interne Metadaten und Analysen werden nicht ausgeliefert.
`validatePublicPuzzle` weist solche Zusatzfelder strikt ab. Der Browser berechnet
seine Spielhilfen aus den öffentlichen Regeln; das ist Datenminimierung, kein
Schutz vor dem Rekonstruieren einer Lösung.

Das öffentliche DTO wird direkt geladen, validiert und an die UI gebunden.
Es gibt keine Übersetzung in alte `places`/`blocked`/`overlays`-Daten. Die UI-Sicht
ergänzt lediglich Texte und die unabhängig ermittelte Lösung an derselben Logik.

## Assetvertrag

Katalog: `schemaVersion:2`, `semanticVersion:1`, `backgrounds`, `assets`, `reviews`.
Jedes Asset besitzt eine explizite `semanticClass` aus dem versionierten Vokabular:
`island`, `lighthouse`, `buoy`, `wreck`, `settlement`, `atoll`, `archipelago`,
`algae`, `barrels`, `rowboat`, `crate`, `bottle`, `driftwood`, `decoration`.
Es wird niemals aus IDs oder Dateinamen geraten. Die einmalige redaktionelle
Katalogumstellung klassifiziert bestehende Motive ausdrücklich; Bildbytes und
bestehende künstlerische Freigaben wurden dabei nicht geändert.

`role:geographic` verlangt `passable:boolean`; `role:decoration` hat keine
Befahrbarkeit und verwendet `semanticClass:decoration`. Die Klasse bestimmt
keine Befahrbarkeit. Illustrationseignung wird durch `passable` und den
zusammenhängenden axialen Footprint `geometry.cells` beschrieben.

```json
{"id":"p1","assetId":"example.buoy","anchor":"C3","objectId":"o1"}
```

Ein geografisches Asset repräsentiert genau ein Objekt. Sein platzierter Footprint
muss dessen Zellmenge **vollständig und exakt** abdecken und dieselbe Befahrbarkeit
besitzen. Ein Objekt erhält höchstens eine Illustration. Dekoration hat keine
`objectId`, überlappt kein logisches Objekt und verändert keine Logik.
Alle Grafikfootprints sind untereinander exklusiv. Transformationen, Strecken und
Clipping sind keine Auswege bei inkompatiblen Assets.

Die allgemeine Logikvalidierung kann Objekte ohne Illustration ausdrücken;
bestehende veröffentlichte Rätsel behalten diesen Laufzeitvertrag.
Für neue verwendbare Karten verlangt der
[Generatorvertrag](CATALOG-COMPLIANT-GENERATION.md) vollständige konkrete
Illustrationsabdeckung vor der Batchannahme.

Produktionsplatzierungen verlangen `production:enabled`, `stage:illustration`
und eine konkrete Bild-/Hintergrundfreigabe. Offline-Paketprüfung validiert zudem
Dateien, exakte Approval-Hashes, Bilddekodierung, Alpha-Footprints und Kartenrand.
`development:true` ist allein für technische Galerien/Fixtures und hebt diese
Freigabepolitik, nicht die logische Footprint-/Befahrbarkeitsprüfung auf.

## Explizite Quellen und drei Inhaltsebenen

A. Garantierte UI-Basis: Geometrie, Meer `sea-blue-01`, beide Pergamentrahmen und
die von HTML/CSS/Modulen referenzierten Bedienressourcen. Diese gehören zum
Auslieferungsvertrag der UI.

B. Kontrollierte Fixtures: `tests/fixtures/model/`, die öffentliche technische
Probefahrt und kleine In-memory-Kataloge. Keine redaktionelle Veröffentlichung.

C. Austauschbare Inhaltspakete: Ein beliebig großer Katalog mit öffentlichen
Rätseln und einem optionalen Assetkatalog. Es gibt keine feste Puzzle-/Assetanzahl.

```json
{
  "schemaVersion": 2,
  "defaultId": "model-demo",
  "assetCatalog": "../assets/catalog/library.json",
  "resourceBase": "../",
  "puzzles": [{"id":"model-demo","title":"Die Probefahrt","path":"model-demo.json","kind":"demo"}]
}
```

Der Loader erhält `manifestUrl` und optional `fetcher`/`resourceValidator`.
Rätsel- und Katalogquellen sind relativ zum Manifest; Bildreferenzen relativ zu
`resourceBase`. Keine implizite Repository-URL und keine produktive Namensliste.
Die Anwendung gibt ihren lokalen Einstieg selbst an. `{schemaVersion:2,
defaultId:null,puzzles:[]}` ist gültig; die UI zeigt eine verständliche Leermeldung.
Nicht verfügbare Quellen und beschädigte verwendete Grafiken werden gemeldet.
Bilddekodierung läuft nach der Spielfeldinitialisierung: Eine langsame Grafik
blockiert weder die bedienbare Papierkarte noch gespeicherte Notizen.

Die statische Export-CLI ist ein lokaler Paketadapter: `--root` bezeichnet ein
vollständiges Paket mit `index.html` und `puzzles/manifest.json`. Sie verfolgt
lokale Abhängigkeiten, weist Pfade außerhalb dieses Pakets und Symlinks ab und
validiert vor dem atomaren Ersetzen des ZIPs. Kein Netzwerkdienst, Plugin-System
oder Repository-Split wird eingeführt.

## Aktuelle Beschriftung

Unbefahrbare Mehrfeldobjekte tragen Pergamentlabels; fehlt ein Name, erscheinen
Koordinaten. Einzelobjekte behalten das Pergament, ihre Hinweise können Koordinaten
verwenden. Befahrbare Objekte tragen weder permanentes Namensschild noch orange
Ortsringe. Der Start hat eine eigene Markierung. Freie Dekoration besitzt keine
Hinweisreferenz. Ein Ortsverzeichnis oder temporäre Labels sind spätere Arbeit.
