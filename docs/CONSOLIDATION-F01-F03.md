# Konsolidierung F01–F03

Ausgangspunkt: main `16cabf8`, einschließlich PR #65. Auftrag: ein neues
konsistentes Modell vor der ersten echten Veröffentlichung. Kein Merge,
kein externes Deployment, keine Veröffentlichung und keine Spielstandmigration.

## Bestandsaufnahme und bewusster Vertragsbruch

F01 dokumentierte `gezeitenkarten-1`: `blocked`, `places.kind`, existenzielle
Ortsdistanz und redundante Nachbarschaftsoperatoren. F02 band vier historische
Dokumente an Hashes/Legacy-Aliasse und gepinnte Kataloge. F03 verwendete künstliche
Textplatzhalter für Logikvalidierung; der öffentliche DTO-Pfad war noch kein
Browserpfad. PR #65 brachte moderne Assetfootprints, aber parallel zu Legacy-
Overlays und einem rätselspezifischen Motivregister.

Die alte ARCHITECTURE.md bezeichnete native Module und Tests noch als offen,
obwohl main beides längst nutzte. Der alte F01-Vertrag verlangte historische
Kompatibilität. Ältere UI-Texte beschrieben orange Ringe trotz der bereits in
PR #65 beschlossenen Entfernung. Auch die früheren Kompatibilitätsforderungen in Issues #18/#46 und deren
Zurückstellung von Schema 2 werden durch den ausdrücklichen neuen Auftrag ersetzt.
Diese Aussagen sind überholt; die neuen
Verträge ersetzen sie ausdrücklich. Offene Issues #18/#19/#21/#23/#45/#46 und
die Ideen #68/#70/#71/#72 wurden gelesen; temporäre Labels, Explore-Zoom,
Legende und weitere Flavor-Produktion bleiben außerhalb dieses Auftrags.

## Ergebnis und entfernte Wege

- Ein abstraktes `logic.map` mit `objects:[{id,cells,passable}]`; keine zweite
  Sperrfeldliste oder Objektklassen in der Karte.
- Schema 2, `gezeitenkarten-2`, Mindestdistanz und `countDistanceToPlace`.
- Direkter Kartenfingerprint, neue Hashdomäne und vier Identitätsebenen.
- Reine Logikvalidierung ohne Darstellung/Assets, gemeinsame Solverprädikate,
  explizite Dokument-/Katalogvalidierung und öffentliche Projektion im Browser.
- Assetkatalog 2 mit semantischem Vokabular 1 und exakter Objektzuordnung.
- Austauschbare Quellen, beliebige Kataloggrößen, leerer Katalog als gültiger Fall.
- Ein kontrolliertes öffentliches Demopaket; interne Zielroute nur im Testfixture.

Entfernt: reguläre Dateien/Module für `reference-3.6`, `test-navigation`,
`quittung-nombreo`, `ankerbuch-tesoro`; `content/reference-3.6.mjs`;
`logic.blocked`, `places.kind`, alte Text-/Overlaystruktur; `MOTIFS`,
`BACKGROUNDS`, `LEGACY_ASSETS`, `legacyOverlay`, `chartOverlays`; alte
`coast`-/Nachbarschaftsoperatoren; v1-Schema/Archiv/Aliasse; Speicherfallback für
den Referenzfall; F03-Textplatzhalter und Offline-Kompatibilitätsfassaden.
Die alten Rahmenexperimente `legacy`, `raster`, `modular` und ihre Slices entfallen;
die beiden garantierten Rahmen `final`/`quiet` bleiben erhalten.
Historische Originale unter `prototypes/3.6/`, Bildbytes und künstlerische
Freigaben bleiben als Entwicklungsquellen erhalten.

## Vier Testebenen und Regressionstransfer

| Ebene | Ort | Inhalt |
| --- | --- | --- |
| Engine | `tests/engine/` | Hexgeometrie, Routen, beide Befahrbarkeiten, Mindestdistanz/0, Zählintervalle, Solver, Irredundanz, feste Identitätsvektoren |
| Datenverträge | `tests/contracts/` | Schemas, Versionen, Zellmengen, Footprints, Assetsemantik/-freigabe, explizite Quellen, öffentliche Projektion, Snapshot-/Archivintegrität, Grafikgeometrie |
| Inhaltspakete | `tests/content/`, Asset-/Puzzle-CLIs, Python-Bildtests | Tatsächlich vorhandene Referenzen, Dateien, Hashes, Freigaben und kuratierte künstlerische Einzelregressionen; keine Engine-Bestandszahlen |
| Integration | `tests/integration/`, `tests/browser/`, `tests/deployment/`, `tests/test_package.py` | Garantierte Probefahrt, Browserinteraktion, Mehrfeldobjekte, Start/Labels, Umschalten/Speicherung, leere/fehlende Quellen, beschädigte Bilder, Zustand/Undo/Radar/Persistenz, tatsächliches ZIP mit `.js` und Unterverzeichnis-Hosting |

Gezielte Überführung der alten Tests:

| Bisherige Gruppe | Erhaltene Eigenschaft / neuer Nachweis |
| --- | --- |
| rules-contract, modular-puzzle, reference-rules | Alle 625 Zellpaare gegen unabhängige Offset-BFS; Richtungs-/Drehungsvektoren, Legalität, Land, Wiederbesuche, Budget, neue Mindestabstandsvectoren in `engine/rules` |
| puzzle-data, editorial-puzzles, puzzle-services | Strikte Schemas, Semantik-/Zielfehler, unabhängiger Solver, Mehrdeutigkeit, Irredundanz, einzelne redundante Duplikate, öffentliche Positivlisten in `contracts/model`, `engine/services`, `contracts/loader` |
| publication-archive, archive-asset-context | Feste v2-Identitäten und Metamorphien; generische In-memory-Snapshots, Quellenkorruption, Bindungen, eingefrorene Historie und expliziter gepinnter Katalog in `contracts/archive` |
| asset-library, asset-production | Künstliche kleine Kataloge für Freigaben, Hashfehler, Rollen, Footprints, Befahrbarkeit und Transformationen; variable Bestandsprüfung in `content/package` |
| game-state, distance-overlay, land-state-regression, toolbar, place-labels | Mit gezielter In-memory-Geometrie weitergeführt; keine produktiven Rätseldateien nötig |
| graphic-geometry, chart-asset-contract, bordbook, chart-ux | Mathematische Geometrie, Alpha-/Grafikzellen, sichere Labels, Koordinaten und Buchnavigation erhalten; alte Rahmen-Slice-Erwartungen entfernt |
| game-0.1, puzzle-selection, consolidation, land-hex-regression, place-labels, asset-library | Neuer gemeinsamer `integration/model-game` prüft Spielpfad, Land, öffentliche Daten, Einzel-/Mehrfeldillustrationen, Start/Labels, Katalogwechsel, getrennte Speicherung und Fehlerfälle |
| seekarte, chart-template, parchment-frame | Gemeinsame Modelltests plus erhaltene responsive Layout-, Material-, Koordinaten-, Tastatur-, Radar-, Pointer-, Scroll- und Resume-Suiten; beide aktuellen Rahmen getestet |
| flavor-/multihex-Prototypbrowserbilder | Kuratierte Eigenschaften in `tests/content` erhalten; technische Galerien auf neues Objektmodell umgestellt. Einzelasset-Screenshotarchive sind keine Engine-Abnahme. |
| archive-integrity, source-contract, stabilization | Ausschließliche Konservierung alter Prototypbytes/Fingerprints entfernt. Historisches HTML wird nicht mehr als reguläre Engine getestet. |
| test_package / Deployment-Baselines | Kleines isoliertes Paket statt vier historischer Fälle; beschädigte Dateien/Hashes/Alpha, Symlinks, private Felder, Solvergate und atomarer ZIP-Erhalt bleiben geprüft. Keine alten Git-Commits als Voraussetzung. |

Die alten „genau 18 produktive Orte“, „40 Katalogeinträge“ und „vier Rätsel“ sind
keine Testvoraussetzungen mehr. Einzelne kuratierte Bild-/Freigabenachweise bleiben
bewusste Inhaltstests. Browser-Hinweiszahlen/Startzellen beziehen sich nur auf das
garantierte Fixture; UI-Lesbarkeit und Interaktion werden weiter geprüft.

## Einschränkungen bis F04b und offene Entscheidungen

1. Geometrie bleibt 5×5, Route 1–6 Etappen; Objektzellen sind zusammenhängend
   und disjunkt. Andere Topologien brauchen einen späteren Vertragswechsel.
2. Genau ein Asset je dargestelltem Objekt; passende Footprints werden validiert,
   aber noch nicht automatisch ausgewählt. Die Probefahrt lässt den mehrfeldrigen
   befahrbaren Hafen bewusst unbebildert, da kein solches Asset freigegeben ist.
   Ein isoliertes Browserfixture prüft den bereits funktionierenden Rendererpfad.
3. Textreferenzen sind redaktionelle Texte. Der Validator kann keine falsche
   natürliche Formulierung beweisen oder Namen aus Prosa ableiten. Namen sind
   optional; die spätere Textgenerierung soll `semanticClass` nutzen.
4. Der Browser berechnet Lösungen/Hilfen clientseitig. Öffentliche Projektion
   entfernt interne Informationen, ist aber kein Spoilerschutz.
5. Der Offline-Archivadapter verlangt explizite Quellen und gepinnte Ressourcen;
   es gibt keine neuen realen Veröffentlichungen. Vergabe redaktioneller IDs,
   Generatorprovenienz, zusätzliche geschützte Hilfen und Backend bleiben offen.
6. Der statische Paketadapter exportiert ein lokales, vollständiges Paket.
   Remote-Paketprovisioning, getrennte Repositories und Netzwerkdienste sind noch
   nicht implementiert. Loader und Ressourcenkontext sind darauf vorbereitet.

Prüfergebnisse werden im PR am endgültigen Commit festgehalten. Lokale Ergebnisse
und CI werden getrennt ausgewiesen; eine erfolgreiche lokale Prüfung ist keine
vorweggenommene Aussage über GitHub Actions.

Die Archivprüfung trennt interne Definitionsbytes von `publicSource` und dem
ausgelieferten Inventar. Ein eigener Metamorphietest sichert ab, dass private
Provenienz bei gleicher öffentlicher Auslieferung die Veröffentlichungsidentität
nicht verändert; private Definitionen dürfen im Auslieferungsinventar nicht stehen.
