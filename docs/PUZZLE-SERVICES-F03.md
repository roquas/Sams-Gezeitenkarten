# F03 – Validierung, Analyse und öffentliche Projektion

Basis: main nach F02/#67, `dc91712ac5b076b39b947e82840d1ea3c393784c`.
Bezug: [#21](https://github.com/roquas/Sams-Gezeitenkarten/issues/21).
[Regeln](RULESET-GEZEITENKARTEN-1.md) und
[Archiv-/Identitätsvertrag](PUBLICATION-ARCHIVE-V1.md) bleiben unverändert.

## Bestand und Entscheidung

`validatePuzzle` prüft schon heute das strikte v1-Schema, semantische Referenzen
und eine optionale Zielroute, ohne zu suchen. `createRules` besitzt Geometrie,
Routengenerator, Legalität und sämtliche Hinweisprädikate. `solvePuzzle` führt
eine vollständige Suche samt optionaler Diagnosen aus. `compilePuzzle` verbindet
Validierung und Solver zur bisherigen UI-Ansicht; der Browserloader nutzt diese
Verbindung weiterhin unverändert.

F03 ergänzt ausschließlich Offline-Module in `scripts/lib/`. Kein bisheriges
Laufzeitmodul wird geändert, kein neues Modul vom Browser importiert. Damit bleiben
Katalog, vier Rätseldokumente, Paketierung und Deployment-ZIP bytegleich.
Es gibt keine zweite Geometrie, Hinweissemantik oder Routensuche.

Der vorhandene Solver materialisiert alle Routen und kennt keinen Abbruch bei
zwei Lösungen. Eine Änderung seines ausgelieferten Moduls würde das ZIP verändern.
Deshalb reduziert der kurze Analysemodus den **vorhandenen** Generatorstrom aus
`createRules.routes()` mit **vorhandenen** `matches()`-Prädikaten. Er implementiert
keine eigene Suche und keinen zweiten Constraint-Solver. Der ausführliche Modus
ruft unverändert `solvePuzzle()` auf. Beide Wege werden gegen die unabhängigen
Archivprädikate und kleine bekannte Lösungsmengen geprüft.

## Schnittstellen und Versionszuordnung

| Funktion | Eingabe und Ergebnis |
| --- | --- |
| `validateDefinition(document,{rulesVersion})` | Striktes bestehendes v1-Dokument; Bericht über Struktur, Semantik und vorhandene/fehlende Zielroute. Keine Enumeration. |
| `validateLogicDefinition(definition,{rulesVersion})` | Liest ausschließlich `schemaVersion`, `dataVersion`, `logic`; dieselbe Karten-/Hinweisvalidierung ohne Darstellung oder Zielroutenprüfung. |
| `analyzeDefinition(definition,options)` | Explizite Solveranalyse; Darstellungs-/Archiv-/Generatorfelder werden nicht gelesen. Optionale `definition.solution` oder explizite `options.targetRoute` als Sollwert. |
| `checkIrredundancy(definition,options)` | Analyse mit einzeln ausgewerteten Weglassfällen und nachvollziehbarer Qualitätsdiagnose. Verändert keine Hinweise. |
| `projectPublicPuzzle(internal,{rulesVersion,identity})` | Positivlisten-Projektion in ein getrenntes öffentliches DTO. Keine Solverausführung. |
| `validatePublicPuzzle(dto)` | Striktes ausführbares `publicPuzzleSchema` plus bestehende semantische Validierung. |
| `createArchiveProjector(manifest,{readBytes})` | Node-Adapter zum einmal validierten F02-Archiv; `.project(publicationId)` prüft Originalbytes/Identität und erzeugt einen verknüpften Preview. |

`rulesVersion` ist bei den neuen Schnittstellen ausdrücklich erforderlich.
`requireContract` registriert zunächst genau `gezeitenkarten-1`, Puzzle-Schema 1
und Inhaltsrevision `dataVersion: 1`, den gesamten heutigen Bestand. Unbekannte
Regel-/Schema-/Datenversionen werden abgewiesen, niemals auf diesen Stand umgedeutet.
Eine widersprechende Regelkennung in einem angereicherten Eingabeobjekt wird
ebenfalls abgewiesen; der Aufrufkontext überschreibt sie nicht stillschweigend.
`dataVersion` bleibt eine Inhaltsrevision, keine neue Regelkennung: weitere
bekannte Inhaltsrevisionen müssen vor ihrer Annahme ausdrücklich registriert
werden. Keine hypothetische zweite Regelversion ist implementiert.
Der alte Loader und das alte Schema mit ihrem bisherigen Revisionsbereich bleiben
unverändert; die neue explizite Dispatchgrenze gilt nur für die F03-Dienste.
`projectionSchemaVersion: 1` versioniert unabhängig davon die neue DTO-Hülle.

`validateDefinition` wirft `DefinitionError` mit `phase` (`version`, `structure`,
`semantics`, `target`) und Fehlerliste. Wenn Karte und Ziel gleichzeitig ungültig
sind, hat die semantische Kartenprüfung Vorrang. Das ursprüngliche `PuzzleError`
der produktiven Anwendung wird nicht verändert. Eine fehlende Zielroute ist gültig.
Eine vorhandene Route muss schema-konform, vollständig legal und mit allen
Basishinweisen vereinbar sein. Gültigkeit beweist weder Existenz noch Eindeutigkeit.

Die reine Logikvalidierung adaptiert die Daten in ein vorübergehendes v1-Objekt
mit neutralen Textplatzhaltern für den bestehenden Validator. Diese Platzhalter
werden weder gespeichert noch projiziert. Das vermeidet duplizierte semantische
Prüfregeln und Abhängigkeit von echten Grafiken/Texten bei Generatoraufrufen.

## Analyse und Irredundanz

Optionen: `rulesVersion`, optional `targetRoute`, `maxNodes` (Default 250.000),
`detailed` (Default false) und `irredundancy` (Default false).
`checkIrredundancy` setzt die letzte Option ausdrücklich auf true.

Der Bericht enthält `status` (`unique`, `ambiguous`, `unsolvable`), `count`,
`countExact`, `uniqueSolution` (sonst null), Zielroutendiagnose, optionale
Weglassdiagnosen und Suchzähler. Der kurze Modus speichert keine Lösungslisten
oder vollständige Wahrheitstabelle; der ausführliche Modus liefert `solutions`.
Vorhandene Difficulty-Metriken des alten Solvers werden nicht als neue Bewertung
in diese Schnittstelle übernommen.

Im kurzen Modus gilt:

- Die Engine zählt Suchknoten mit ihrem vorhandenen Budget. Nach der zweiten
  vollständigen Lösung wird ihr Generator geschlossen: `ambiguous`, `count: 2`,
  `countExact: false` bedeutet **mindestens zwei**, keinen exakten Gesamtwert.
- Null oder eine Lösung werden erst nach erschöpftem Generator bewiesen. Bei
  Budgetfehler wird geworfen, kein Teilresultat als Qualitätsnachweis ausgegeben.
- Alle Einzelweglassprüfungen entstehen im **selben** Generatorlauf: Eine Route
  mit null verletzten Hinweisen zählt für den vollständigen Satz und alle
  Weglassfälle. Bei genau einer Verletzung zählt sie ausschließlich für das
  Weglassen dieses Hinweises. Bei mindestens zwei Verletzungen zählt sie für
  keinen Einzelweglassfall. Jeder Zähler sättigt bei zwei.
- Diese Auswertung entspricht für jeden Hinweis exakt dem vollständigen übrigen
  Hinweissatz. Sie entfernt niemals mehrere Hinweise und kürzt nichts automatisch.
- Sobald der vollständige Satz mehrdeutig ist, ist die Irredundanzbedingung
  gescheitert; die Ausgabe behauptet dann keine einzelnen Notwendigkeitsurteile.

`irredundant: true` verlangt gleichzeitig: genau eine Lösung, vorhandene gültige
Zielroute gleich dieser Lösung, und mindestens zwei Lösungen nach jedem einzelnen
Weglassen. Fehlende Zielroute (`target-required`), ungültige/widersprechende Route
(`target-invalid`/`target-mismatch`), kein eindeutiger Basissatz und redundante
Hinweise (`redundant-clue` mit `clueId`) werden getrennt diagnostiziert.
Die Analyse darf einen falschen internen Sollwert diagnostizieren; die strikte
Dokumentvalidierung würde denselben falschen Sollwert ablehnen.

`omissions[].necessary` ist nur beim eindeutig lösbaren Basissatz definiert.
Ein Wert zwei mit `countExact: false` bedeutet mindestens zwei Alternativen nach
Entfernung, nicht exakt zwei. Mit `detailed: true` liefert der bestehende Solver
exakte Weglasszahlen. Die historische Ausnahme bleibt erhalten: Eine negative
Qualitätsdiagnose verbietet weder Validierung noch Laden der vier Originalfälle.
Ein tatsächlicher Veröffentlichungsprozess mit verbindlichem Gate ist Folgearbeit.

### Unabhängige Fälle und Ergebnisse

| Fall | Erwartetes Ergebnis |
| --- | --- |
| Ein-Schritt-Fixture C3, Hinweis A: Osten, Ziel C3→D3 | Eindeutig, zielgleich, irredundant; ohne A sechs Nachbarn. |
| Dasselbe Fixture nur mit wahrer Startposition | Exakt sechs Lösungen; kurzer Modus stoppt nach zwei. |
| Ein Schritt mit Rückkehr zum Start gefordert | Null Lösungen wegen Wiederbesuchsverbot. Strukturell/semantisch gültiger Hinweis. |
| Zwei identische Osthinweise A/B | Beide einzeln redundant: nach jedem Weglassen eine Lösung. Ohne beide sechs Lösungen. |
| Historischer Referenzfall mit sieben Hinweisen | Eindeutig, aber I redundant. Keine Änderung des Originals. |
| Referenz-Teilmenge ohne I | Irredundant; Weglasszahlen für II–VII exakt **6, 4, 4, 2, 2, 2**. Verschiedene Hinweise geben verschiedene Alternativrouten frei. |

Die unabhängigen archivierten Geometrie-/Hinweisprädikate bestimmen die exakten
Alternativmengen des letzten Falls. Ein weiterer Test prüft die Monotonie: Wenn
ein einzelnes Weglassen mehrere Lösungen freigibt, kann gemeinsames Entfernen
zusätzlicher Hinweise die Eindeutigkeit nicht wiederherstellen.

Historische Diagnose: `reference-3.6` redundant I; `test-navigation` redundant
T1–T5; `quittung-nombreo` redundant H1/H2; `ankerbuch-tesoro` irredundant.
Alle vier bleiben gültig, eindeutig, unter ihren bisherigen IDs erreichbar und
mit den vorgesehenen Zielrouten identisch. Zusätzliche Hilfen oder alte
Analysedaten außerhalb von `logic.clues` beeinflussen die Basisbewertung nicht.

## Öffentliche Projektion und F02-Verknüpfung

Das DTO besitzt genau `projectionSchemaVersion`, `rulesVersion`, `identity` und
`puzzle`. `puzzle` enthält ausschließlich Schema-/Datenversion, bestehende ID,
Logik, Darstellung und gegebenenfalls `resultTexts.correct/incorrect`.
Die Positivliste reicht bis zu Raster-, Orts-, typabhängigen Hinweis- und
Overlayfeldern. Unbekannte zukünftige private Zusatzfelder werden nicht kopiert.
Das ausgewählte bekannte Datenmodell wird anschließend vollständig validiert.
Alle Objektschlüssel werden für deterministische Ausgabe sortiert; die fachlich
relevanten Arrayreihenfolgen und bestehenden redaktionellen Hinweis-IDs bleiben
erhalten. Die Ausgabe ist vom Eingabeobjekt vollständig abgetrennt.

Ausgeschlossen sind insbesondere `solution`, Analysen, Seeds, Generatorprovenienz,
Archivdaten, interne Fingerprints und das vorhandene `metadata`-Objekt. Dessen
Quellangabe benötigt die UI nicht. Karten- und Hinweistexte, Overlayreferenzen,
vorbereitete heutige `presentation.hints` und optionale Ergebnisformulierungen
bleiben erhalten. Geschützte zukünftige Hilfen dürfen nicht in diesen ausdrücklich
öffentlichen Textfeldern abgelegt werden. Eine Positivliste kann keine absichtlich
in Titel-/Hinweistexten veröffentlichten Geheimnisse erkennen.

Die vollständigen, unabhängig spezifizierten Beispiele liegen dauerhaft unter:

- [Interne Definition](../tests/fixtures/puzzle-services/internal-v1.json):
  enthält `solution: ["C3","D3"]` und interne Herkunft in `metadata.source`.
- [Abgeleitetes öffentliches DTO](../tests/fixtures/puzzle-services/public-v1.json):
  gleicher öffentlicher Spielinhalt, ohne Sollroute und Herkunft.

Aufruf für dieses technische, nicht veröffentlichte Fixture:

```js
const dto = projectPublicPuzzle(internal, {
  rulesVersion: 'gezeitenkarten-1',
  identity: {
    mapStructureId: 'map-f03-fixture',
    instanceId: 'inst-f03-fixture',
    variantId: 'var-f03-fixture'
  }
});
validatePublicPuzzle(dto);
```

Die direkte Projektionsfunktion verlangt IDs eines vertrauenswürdigen Autors oder
Registrierungsprozesses; ihre Syntaxprüfung allein attestiert keine Inhaltsbindung.
Für bestehende Veröffentlichungen leistet dies `createArchiveProjector`: Er
validiert einmal das F02-Manifest samt gepinnten Dateien. Bei jeder Projektion
prüft er nochmals die Quellbyte-Prüfsumme und logischen Fingerprints und übernimmt
die registrierten IDs. Änderungen am übergebenen Manifest nach Factory-Erzeugung
ändern dessen interne Kopie nicht.

`identity.sourcePublicationId` bezeichnet ausdrücklich die **Herkunft** eines
Offline-Previews, keine nachträglich geänderte historische Veröffentlichung.
Zusammen mit `instanceId`/`variantId` verweist es intern auf Originaldaten mit
Zielroute. Das DTO allein kann die interne Instanz nicht rekonstruieren:
`logicalFingerprints(dto.puzzle)` wird mangels interner Zielroute abgewiesen.
Weder öffentliche Projektion noch Preview erzeugen eine Veröffentlichungsrevision.
Eine tatsächliche spätere Auslieferung braucht ihren eigenen Veröffentlichungsstand.

Der Projektions-/DTO-Code enthält keine Node-Abhängigkeiten. Nur der separate
Archivadapter und die CLI verwenden Node. Importierbarkeit bedeutet noch keine
Browserintegration; das heutige Import-/Paketgraph bleibt vollständig unverändert.

### Datenminimierung ist kein Spoilerschutz

Die Projektion entfernt interne Lösungsdaten. Sie schützt die Lösung nicht vor
Rekonstruktion: Der heute ausgelieferte exakte Solver kann sie weiterhin aus den
öffentlichen Hinweisen berechnen. Ein Test demonstriert das ausdrücklich mit
`compilePuzzle(dto.puzzle)`. Produktionsdateien und clientseitige Prüfung werden
hier nicht umgestellt. Serverseitige Verifikation, Backend und Zugriffsregeln
für geschützte Hilfen sind spätere Schritte.

## Prüfung, Messung und Grenzen

```sh
node scripts/check-puzzle-services.mjs
node scripts/check-puzzle-services.mjs --benchmark
node scripts/validate-archive.mjs
npm run test:unit
npm run test:puzzles
python3 tests/test_package.py
sh scripts/package.sh
```

Die schreibfreie CLI prüft die historischen Fälle und archivgestützten Previews.
`--benchmark` misst je 100 Aufrufe nach zehn Warmups: kurzer Engine-Strom gegen
vollständigen vorhandenen Solver. Keine Rätsel werden generiert oder veröffentlicht.
Die gemessenen Ergebnisse und Bytevergleiche werden unter
[`verification/F03-local-results.json`](verification/F03-local-results.json)
festgehalten. Timingwerte sind Beobachtungen dieser Maschine, keine CI-Grenzwerte.

Für die mehrdeutige Referenzkarte besuchte der kurze Modus zwei statt 519 legale
Routen (neun Suchknoten). Beim eindeutigen Sechser-Satz mussten beide Wege alle
519 Routen untersuchen; der kurze Modus speichert dabei nur die eine Zielroute
und sechs gesättigte Weglasszähler. Er teilt einen Generatorlauf für sämtliche
Weglassfragen, statt pro Hinweis neu zu enumerieren.

Für häufige Generatoraufrufe sind `validateLogicDefinition`, `analyzeDefinition`
und `checkIrredundancy` ohne `detailed` vorgesehen. Validierung pro Aufruf schützt
gegen mutierbare Kandidateneingaben; es gibt keinen impliziten Objektidentitätscache.
Der Archivadapter prüft ein Archiv einmal pro Factory. `detailed: true` ist für
bewusst vollständige Diagnose gedacht und behält die Speicher-/Laufzeitkosten des
alten Solvers. Für eindeutige Fälle bietet die bestehende Engine noch keine
Hinweis-Präfixbeschneidung; große Suchräume können das Budget erschöpfen.
Es werden keine spekulativen Bitsets, Caches oder alternativen Suchalgorithmen eingeführt.

Die 20 neuen Regressionstests decken die getrennten Schnittstellen, unabhängige
Lösungs-/Weglassmengen, Abbruchgrenzen, unbekannte Versionen, Positivlisten,
deterministische Ausgabe, unveränderte F02-Identitäten und sichere Node-Grenzen ab.
Bestehende Archivtests sichern weiterhin alle historischen Rohbytes und die
Auslieferungsgrenze. Browser-/Deploymenttests prüfen unverändert die produktive App.

Lokale Abnahme: 120 Unit-/Referenztests (davon 20 neue), vier eindeutige
Puzzlevalidierungen, beide Archiv-/Service-CLIs, sieben Pakettests und zwölf
Chromium-Deploymentfälle auf Desktop/Smartphone am entpackten echten ZIP bestanden.
Die vier Originaldateien, der Browserkatalog, das F02-Manifest und dessen
Identitätsimplementierung sind bytegleich zur Ausgangsbasis. Dasselbe gilt für das
54-Dateien-Deployment-ZIP, SHA-256
`84e2d3c3fbde4db5bff06e7cd539dc3069638a75e4a4ce4bc67559c450dd45e0`.
Der GitHub-Actions-Endstatus wird am zugehörigen PR zum tatsächlich gepushten
Commit dokumentiert; dieser lokale Prüfbericht enthält keine vorweggenommene CI-Zusage.

## Offen für F04 und F05

F04 kann Kartenstrukturen, zulässige Starts und später den getrennten
Assetauswahlvertrag ergänzen; #65 wird hier weder integriert noch verändert.
F05 kann legale Zielrouten und wahre Hinweiskandidaten über die vorhandene Engine
ableiten und die neuen Prüfdienste verwenden. Deterministischer Zufall,
Generatorprovenienz, Qualitätsauswahl und tatsächliches Veröffentlichungsgate sind
noch nicht implementiert. Eine neue bekannte Datenrevision benötigt eine explizite
Registrierung; andere Schemata/Regelbedeutungen benötigen eigene validierte Adapter.
Historische Originale, Veröffentlichungsrevisionen und Spielstände werden nicht migriert.
