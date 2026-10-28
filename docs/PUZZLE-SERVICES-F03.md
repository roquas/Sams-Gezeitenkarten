# F03-Dienste für das einheitliche v2-Modell

Dieser Stand ersetzt die frühere F03-Implementierung mit v1-Textplatzhaltern.
[Regelvertrag](RULESET-GEZEITENKARTEN-2.md), [Daten-/Assetvertrag](PUZZLE-FORMAT.md).

| Funktion | Modul | Verantwortung |
| --- | --- | --- |
| `validateMap(map)` | `src/engine/validate.mjs` | Abstrakte Geometrie, IDs, disjunkte zusammenhängende Zellmengen. |
| `validateLogic(logic)` | gleiches Modul | Karte, Start, Etappen, Hinweisparameter und Referenzen. |
| `validateLogicDefinition(definition,options?)` | gleiches Modul | Regel-/Schemaversion plus reine Logik; liest keine Darstellung, Assets oder Zielroute. |
| `validateDefinition(document,{assetLibrary}?)` | `src/puzzles/validate.mjs` | Vollständiges Schema, Darstellung, optionale Assetzuordnung und optionale interne Zielroute; keine Enumeration. |
| `analyzeDefinition(definition,options?)` | `src/puzzles/analysis.mjs` | Solveranalyse ohne Inhaltsdateien oder Darstellung. |
| `checkIrredundancy(definition,options?)` | gleiches Modul | Einzelne Weglassfälle plus Ziel-/Qualitätsdiagnostik. |
| `projectPublicPuzzle(internal,{identity,assetLibrary}?)` | `src/puzzles/public.mjs` | Rekursive Positivliste, detached und deterministisch sortiert. |
| `validatePublicPuzzle(dto,{assetLibrary}?)` | gleiches Modul | Strikte öffentliche Struktur und Dokumentvalidierung. |
| `validatePlacements(placements,catalog,map,background,options?)` | `src/assets/library.mjs` | Kontextgebundene Grafik- und Befahrbarkeitsprüfung. |
| `createArchiveProjector(manifest,{readBytes})` | `scripts/lib/archive-projection.mjs` | Node-Adapter für gepinnte Veröffentlichungsbytes und Kataloge. |

`rulesVersion` steht verbindlich im Dokument; eine optionale Aufrufversion muss
übereinstimmen. Unbekannte Regeln/Schema-Versionen werden abgewiesen. `dataVersion`
ist eine positive Inhaltsrevision, keine hartcodierte Liste vorhandener Rätsel.
`DefinitionError` enthält `phase` und `errors`; Phasen sind `version`, `structure`,
`semantics`, `target` und `public-structure`. Semantikfehler haben Vorrang vor
Zielroutenfehlern. Es gibt keine künstlichen Rätsel zur Kartenvalidierung.

Reine Logik importiert ausschließlich Geometrie, Regeln und Schema. Kein Asset,
DOM, Dateisystem, Netzwerk oder Katalog wird benötigt. Die vollständige
Dokumentprüfung verlangt bei Platzierungen den expliziten Katalog. Ein vorhandener
Katalog prüft auch die Hintergrundreferenz. Ohne Platzierungen ist rein strukturelle
Dokumentprüfung möglich; die spielbare UI-Bindung benötigt stets einen passenden
Hintergrundkatalog. Dateibytes/Approval-Hashes prüft separat der Offline-Adapter.

Analyseoptionen: `rulesVersion?`, `targetRoute?` (sonst `definition.solution`),
`detailed:false`, `irredundancy:false`, `maxNodes:250000`. Der begrenzte Modus nutzt
die vorhandene Engine als Generatorstrom, der detaillierte `solvePuzzle`.
Weglasszähler sättigen im begrenzten Modus bei zwei. `countExact`, `search.completed`
und Zieldiagnosen verhindern falsche Qualitätsbehauptungen. Budgetüberschreitungen
werfen Fehler; `irredundant:true` verlangt Eindeutigkeit, Zielübereinstimmung und
notwendige Hinweise. Keine zweite Regelengine, kein neues Schwierigkeitsmodell.

Beispiele und feste Identitätsvektoren: `tests/fixtures/model/`. Die CLI
`node scripts/check-puzzle-services.mjs <internal-definition.json>` prüft eine
explizite strukturierte Definition. Sie hängt nicht von alten Rätselnamen ab.

Der [Generatorvertrag](CATALOG-COMPLIANT-GENERATION.md) sichert bereits vollständige
Assetzuordnung und Batchprovenienz. Offen: automatische Textgenerierung aus
`semanticClass`, Start-/Routenauswahl, menschliche Schwierigkeitskalibrierung und ein redaktioneller
Veröffentlichungsprozess. Diese Dienste veröffentlichen keine Rätsel.
