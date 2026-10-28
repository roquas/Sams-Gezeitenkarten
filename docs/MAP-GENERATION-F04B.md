> **Historischer Entwicklungsstand F04b / PR #77.** Die hier beschriebenen alten Generatorverträge sind entfernt. Aktueller einziger Weg: [Kataloggerechte Kartengenerierung](CATALOG-COMPLIANT-GENERATION.md). Reproduktion nur am jeweiligen ursprünglichen Gitcommit.

# F04b: abstrakte Karten und getrennte Assetzuordnung

[PR B: kataloggerechte Generierung](CATALOG-COMPLIANT-GENERATION.md) ergänzt
`catalog-compliant` mit Kapazitätsprofil, Objektabstand und vollständiger
Motivbelegung. Die folgenden freien/kataloginformierten Verträge bleiben bestehen.

PR 3 ergänzt die [lokale Batch-CLI mit vollständigen Kandidatendaten und
strengem Einzel-Replay](MAP-BATCH-F04B.md). Sie verwendet die hier dokumentierten
Generator-, Analyse- und Zuordnungsdienste unverändert; die feste Stichprobe
bleibt eine eigenständige Regression.

Phase B ergänzt [persistente, ausdrücklich freigegebene Katalog-Releases](CATALOG-RELEASES.md)
mit Git-Ressourcenbindung und bildprüfungsfreiem Loader. Die unten beschriebenen
Dienste bleiben unverändert. Phase C bindet sie über
`loadReleasedAssetCatalog` an freigegebene Stände an; der feste Diagnoseeinstieg
verlangt ausdrücklich Release-ID und Hintergrund. [Aufruf, Voraussetzungen,
Berichtsprovenienz und Reproduktion](CATALOG-RELEASES.md#phase-c-freigegebener-generierungskontext-und-diagnose).

`src/generation/` erzeugt ausschließlich gültige v2-Karten. Geografische Vielfalt
hat Vorrang vor Routeneignung. Die Karte enthält unverändert nur `geometry`,
`grid` und `objects: [{id,cells,passable}]`. Formale Gültigkeit, geografische
Struktur, gemessene Routeneignung und spätere Rätselqualität sind getrennt.
Eine zerschnittene Karte, eine Karte ohne befahrbares Objekt oder ohne Route
ist gültig und wird ohne explizite Filter akzeptiert. Assets, Startauswahl,
Zielroute, Hinweise, Texte und Veröffentlichungen sind nicht Teil der abstrakten
Generierung. PR 2 ergänzt die unten dokumentierte getrennte Assetzuordnung und
ein ausdrücklich gewähltes geografisches Katalogprofil.

## Schnittstellen und interner Ergebnisvertrag

```js
import {generateMap, normalizeConfig, GENERATOR_VERSION} from '../src/generation/maps.mjs';
import {analyzeMap, evaluateFilters} from '../src/generation/map-analysis.mjs';

const result = generateMap({seed: 42, config: {
  objectCount: {min: 2, max: 7}, objectSizes: [1, 2, 3, 4],
  passableProbability: 0.5,
  analysis: {steps: [2, 4], maxNodes: 10000},
  // filters: {routeSteps: [4], minLargestComponent: 8},
}});
// {status, map, analysis, diagnostics}
// Bei Erfolg: status === 'generated', map ist unverändertes v2.
// Bei erfolgloser Suche: map === null, analysis === null.
// diagnostics.attemptLog dokumentiert jeden Versuch, Metriken und Suchstatus.
if (result.map) {
  const independent = analyzeMap(result.map, {steps: [1, 6], maxNodes: 10000});
  const decision = evaluateFilters(independent, {routeSteps: [6]});
  // decision.status: accepted | rejected | unknown
}
```

Alle Funktionen sind synchron. Generator, Analyse und Zufallsquelle importieren
weder Browser/DOM, Dateisystem/Netzwerk noch Assets oder Rätselbestände.
`normalizeConfig` liefert eine neue kanonische Konfiguration; `GenerationError`
(Export aus `maps.mjs`) kennzeichnet ungültige Optionen mit `code: INVALID_CONFIG`.
`analyzeMap` validiert mit `validateMap`, verändert seine Eingabe nicht und braucht
keinen Seed oder Generatorzustand. Ungültige Karten werfen den bestehenden
`DefinitionError`. Fehlende Analyseetappen beim separaten `evaluateFilters`
werfen `INVALID_CONFIG`; der Generator ergänzt benötigte Etappen automatisch.

Das Ergebnis ist ein **interner Übergabevertrag**, kein öffentliches Puzzle-Schema.
Es erhält keine `instanceId`, `variantId` oder `publicationId`.

| Konfiguration | Default | Bedeutung / Grenze |
| --- | --- | --- |
| `objectCount` | `{min:2,max:7}` | Ganzzahl oder inklusiver Bereich, 0–25 |
| `objectSizes` | `[1,2,3,4]` | Eindeutige erlaubte Größen, 1–25; keine Gewichte |
| `passableProbability` | `0.5` | Unabhängige Bernoulli-Auswahl je Objekt, 0–1 |
| `maxMapAttempts` | `20` | Kandidatenbudget einschließlich Erstversuch, 1–1000 |
| `maxPlacementAttempts` | `20` | Wachstumsversuche je Objekt/Kandidat, 1–1000 |
| `analysis.steps` | `[]` | Explizite eindeutige Etappen aus 1–6; standardmäßig keine Routensuche |
| `analysis.maxNodes` | `10000` | Budget **je Start und Etappenzahl**, 1–1.000.000 |
| `filters.routeSteps` | `[]` | Je Etappenzahl mindestens ein Start mit nachgewiesener Route |
| `filters.minLargestComponent` | `0` | Mindestgröße einer befahrbaren Komponente, 0–25 |

Unbekannte Optionen, leere/duplizierte Größen, umgekehrte Bereiche, ungültige
Seeds/Budgets und unmögliche Flächenbudgets schlagen vor der Generierung fehl.
Jede angefragte Objektanzahl muss mit der kleinsten Größe in 25 Zellen passen;
die größte Größe muss mit der kleinsten positiven angefragten Objektanzahl
platzierbar sein. Die spätere Größenwahl reserviert für verbleibende Objekte
deren Mindestfläche. Geometrische Zufallsfehlschläge sind keine ungültige
Konfiguration und liefern stattdessen begrenzte Versuchsdiagnosen.

## Algorithmus, Version und Reproduktion

Generatorversion: **`abstract-maps-1`**. Reproduktion erfordert diese Version,
einen expliziten uint32-Seed (0–4294967295, einschließlich 0) und die normalisierte
Konfiguration. Keine Uhr, `Math.random`, Laufzeitfrist oder externe Datenquelle.
Änderungen der Kartenausgabefolge, Streamdomänen, Auswahl- oder Wiederholungsfolge
erfordern eine neue Generatorversion und aktualisierte dokumentierte Vektoren.
Tests pinnen Zufallsvektoren, eine vollständige Karte und begrenzte Fehlerfälle.

`createRandom(seed)` in `random.mjs` verwendet Mulberry32: uint32-Zustand startet
exakt beim Seed, wird vor jedem Mix um `0x6d2b79f5` erhöht und mit den im Modul
festgelegten `Math.imul`-/XOR-/Shift-Operationen gemischt. `uint32()` liefert
0–2³²−1; `integer(n)` berechnet `floor(uint32()/2³²*n)`. Das ist deterministisch,
mit einer kleinen endlichen Quantisierungsverzerrung, keine kryptografische Quelle.
Die ersten fünf uint32-Werte für Seed 0 sind
`1144304738, 1416247, 958946056, 627933444, 2007157716`.

`randomStream(seed, domain)` hasht die nichtleere ASCII-Domäne mit FNV-1a,
Initialzustand `0x811c9dc5 XOR seed`, Multiplikator `0x01000193`; dieser Hash
initialisiert Mulberry32. Generatorströme haben die Domänen
`abstract-maps-1/<Versuch ab 1>/layout`, `/passability` und `/placement`.
Sie teilen keinen veränderlichen Zustand. Eine spätere Illustrationsauswahl
benötigt eine eigene Domäne und verändert die abstrakte Karte nicht. Eine reine
Änderung des Analyseprofils verändert ohne Filter die Karte ebenfalls nicht.
Hashes sind endlich und versprechen keine mathematische Unabhängigkeit aller Seeds.

Pro Kandidat wird die Objektanzahl gleichmäßig aus dem inklusiven Bereich gewählt.
Die Objektgrößen werden in ID-Reihenfolge gleichmäßig aus den aktuell noch
flächenverträglichen Größen gewählt. Die Befahrbarkeit stammt aus dem separaten
Stream. Jedes Objekt beginnt auf einer zufälligen freien Zelle und wächst durch
Auswahl einer freien Randzelle der bisherigen Zellmenge. Bereits platzierte
Objekte bleiben während dieses Kandidaten bestehen. Misslingt das Wachstum,
beginnt das Objekt erneut, höchstens `maxPlacementAttempts`-mal. Misslingt der
Kandidat, beginnt der nächste mit neuen phasenspezifischen Streams. Keine
Reparatur nach Routeneignung. IDs `geo-01` usw. sind stabil innerhalb derselben
Reproduktion, keine globalen Inhaltsidentitäten.

Alle Zufallskandidaten sind vor Auswahl stabil sortiert (Zellen lexikografisch,
Größen numerisch); Mengeniteration und Locale beeinflussen die Auswahl nicht.
`validateMap` prüft jede erzeugte Karte. Leere Karten und vollständig belegte
Karten sind erlaubt. Die Generierung kann auch isolierte Wasserregionen erzeugen.

Bekannte Auswahlverzerrungen: Formen mit mehr Wachstumspfaden haben andere
Wahrscheinlichkeiten; Frontier-Auswahl und Kartenrand bevorzugen bestimmte
Konturen. Frühere Objekte verändern den Raum für spätere Objekte. Größenwahl mit
Flächenreservierung und Platzierungswiederholungen verändert Verteilungen.
Das Verfahren ist keine Gleichverteilung über Formen, Karten oder Rotationsklassen.
Aktivierte Eignungsfilter erzeugen zusätzlich eine bewusste Auswahlverzerrung.

## Analyse und Suchbudget

Die Analyse leitet Sperrzellen ausschließlich aus unbefahrbaren Objekten ab;
freies Wasser ist befahrbar. Komponenten entstehen per BFS über die vorhandene
Hexnachbarschaft. `regions` enthält stabile lokale IDs, sortierte Zellen, Größe
und Startkandidaten. Weitere Daten: `blockedComponents`, isolierte Einzelzellen,
Sackgassen (Grad 1) und Artikulationszellen (Entfernung erhöht Komponentenzahl).
Artikulationszellen sind topologische Engstellen, keine Bewertung der Rätselqualität.

`startCells` enthält **alle Zellen aller befahrbaren Objekte**, niemals freies
Wasser. `routes` enthält je angefragter Etappenzahl alle Startkandidaten und:

- `route-found`: mindestens eine legale Route nachgewiesen;
- `no-route`: vollständiger Negativnachweis;
- `unknown`: Budget erschöpft, noch keine Route nachgewiesen.

Ist die Komponente nicht größer als die Etappenzahl, ist eine einfache Route
unmöglich; diese notwendige Vorprüfung braucht keine Suchknoten. Ansonsten wird
ein temporärer Kontext `{map,start,steps,clues:[]}` mit `validateLogic` geprüft
und ausschließlich `createRules(...).routes(...)` konsumiert. Komponentengröße
allein beweist keine Route: ein vierzelliges Sternfixture hat trotz ausreichender
Fläche keine einfache Route mit drei Etappen. Es gibt keine zweite Routenengine.

Das Budget zählt die rekursiven Pfadbesuche der vorhandenen Engine, einschließlich
Wurzel und vollständiger Routen. Der erste Besuch jenseits des Budgets löst den
bestehenden Abbruch aus; er wird nicht als ausgeführter Besuch gezählt.
`nodesVisited <= maxNodes` je Start/Etappenzahl. Suche läuft bis zur vollständigen
Enumeration oder Budgeterschöpfung; auch nach einem Positivnachweis kann das
Budget erschöpfen. Dann gilt weiterhin `route-found`, aber `countExact:false`.
`routeCountLowerBound` ist immer nur die tatsächlich gezählte Anzahl;
`countExact:true` erlaubt ihre Interpretation als exakte Anzahl. Gesamtroutenzahlen
summieren über Starts; umgekehrte Routen mit anderem Start zählen separat.

`eligibleStarts` sind positiv bewiesene Starts; `unknownStarts` bleiben getrennt.
`eligibleStartCountLowerBound` wird nur bei `eligibleStartCountExact:true` zur
exakten Anzahl. Diese Vollständigkeit unterscheidet sich von der Vollständigkeit
der Routenzählung. Beispiel: eine Route wurde von jedem Start gefunden, die
Aufzählung weiterer Routen wurde aber abgebrochen. Kein Start und keine Route
werden endgültig ausgewählt oder als Zielroute gespeichert.

Worst-Case-Budget je gültigem Kandidat: höchstens 25 Starts × 6 explizit angefragte
Etappen × `maxNodes`; die Analyse nutzt keine Zeitgrenze. Hohe explizite Budgets
können entsprechend teuer sein. Standardmäßig gibt es gar keine Routensuche.

## Filter, Fehler und Diagnosen

Filter prüfen die unabhängige Analyse nach erfolgreicher formaler Validierung.
Der Generator vereinigt `analysis.steps` und `filters.routeSteps` für die Analyse.
Ein sicherer Filterfehlschlag wird `rejected`; eine ausschließlich unentschiedene
Bedingung bleibt `unknown`. In einer Konjunktion reicht ein bewiesener Fehlschlag
für die Ablehnung, auch wenn eine andere Bedingung unentschieden ist.

| Code | Bedeutung |
| --- | --- |
| `INVALID_CONFIG` | Fehler vor Kandidatenerzeugung; Exception |
| `PLACEMENT_EXHAUSTED` | Objektwachstum scheitert im Platzierungsbudget |
| `NO_ELIGIBLE_START` | Routenfilter angefragt, aber keine befahrbaren Objektzellen |
| `NO_ROUTE_FOR_STEPS` | Kein Start ermöglicht die Etappen; vollständiger Negativnachweis |
| `SEARCH_BUDGET_EXCEEDED` | Eine notwendige Filterentscheidung bleibt unbekannt |
| `COMPONENT_TOO_SMALL` | Explizite Mindestkomponentengröße nicht erreicht |

Nach erschöpftem Kandidatenbudget ist der Ergebnisstatus `exhausted`, wenn alle
Kandidaten sicher scheiterten, sonst `inconclusive`, wenn mindestens ein gültiger
Kandidat allein wegen unentschiedener Filter nicht akzeptiert werden konnte.
Es ist keine Behauptung, dass die Konfiguration prinzipiell ungeeignet sei.
`map:null` verhindert, dass unentschiedene Kandidaten versehentlich als akzeptiert
weiterverarbeitet werden.

`diagnostics` enthält Version, Seed, normalisierte Konfiguration, Anzahl der
Kandidaten- und Platzierungsversuche, sicher abgelehnte und unentschiedene Versuche,
Häufigkeiten der Gründe und `attemptLog`. Gültige Kandidaten protokollieren
Strukturmetriken und Routenstatus einschließlich Budgets/Vollständigkeit;
Platzierungsfehler die gescheiterte Objektnummer. Mehrere Gründe können denselben
Versuch betreffen; ihre Häufigkeit ist deshalb nicht die Anzahl der Ablehnungen.
All dies bleibt außerhalb des Kartenobjekts.

Metriken: Objektanzahl/-größen, beide Befahrbarkeiten, belegte Zellen und freies
Wasser, Land-/Wasseranteil, Anzahl/Größen beider Komponententypen, Randzellen und
Randseiten je Objekt sowie Küstenseiten zwischen Objekt und freiem Wasser.
„Land“ bezeichnet hier den geografischen **Objektfootprint**, auch bei befahrbaren
Objekten; es ist kein Synonym für gesperrte Zellen und keine neue Objektklasse.
Formsignaturen normalisieren axiale Koordinaten um ihre Minima. Sie sind
translationsinvariant, unterscheiden aber Rotation und Spiegelung ausdrücklich.
Es gibt keinen universellen Qualitätsscore.

## Reproduzierbare Vielfalt

`node scripts/sample-maps.mjs` erzeugt die kleine feste Stichprobe aus Seeds
0–127, einmal frei und einmal mit `routeSteps:[3], minLargestComponent:12`.
Profil: 3–8 Objekte, Größen 1–4, Befahrbarkeitswahrscheinlichkeit 0,25,
Analyse für drei Etappen mit 3000 Knoten je Start. Die vollständige maschinenlesbare
Stichprobe einschließlich Kartenbeispielen steht in
[`verification/F04b-map-sample.json`](verification/F04b-map-sample.json).

| Beobachtung | Frei | Gefiltert |
| --- | --- | --- |
| Akzeptierte / unterschiedliche Karten | 128 / 128 | 128 / 128 |
| Kandidatenversuche | 134 | 271 |
| Platzierungsversuche | 883 | 1694 |
| Objekte der Größen 1 / 2 / 3 / 4 | 173 / 167 / 178 / 161 | 178 / 152 / 149 / 125 |
| Verschiedene orientierte Formsignaturen | 56 | 49 |
| Karten mit 1 / 2 / 3 Komponenten | 56 / 34 / 23 | 87 / 34 / 7 |
| Karten mit 4 / 5 / 7 Komponenten | 11 / 3 / 1 | 0 / 0 / 0 |
| Drei Etappen nachgewiesen / nicht möglich | 91 / 37 | 128 / 0 |

Die Stichprobe zeigt den Einfluss einer ausdrücklichen Eignungsauswahl, keinen
Beweis perfekter Gleichverteilung oder zukünftiger Rätselqualität. Tests prüfen
nur grobe Degeneration, Reproduktion, Größen-/Formenvielfalt und beobachtbare
Verteilungsänderungen. Weitere 256 Seeds prüfen Kartenverträge, Disjunktheit und
Zusammenhang sowie Komponenten gegen eine unabhängige Offset-Nachbarschaft.

Beispiele im freien Stichprobenprofil: Seed 0 liefert acht Objekte und befahrbare
Regionen der Größen `[2,12,1]`, Seed 1 fünf Objekte und `[15]`, Seed 2 fünf
Objekte und `[1,12]`. Alle bleiben unabhängig von passenden Illustrationen gültig.

## Übergabe und bewusste Grenzen

PR 2 erhält `result.map` für Assetzuordnung und ein getrenntes Katalogprofil.
Nicht jeder geografische Footprint muss in einem heutigen Katalog bebilderbar
sein. Assetauswahl darf die Karte nicht stillschweigend umformen; sie braucht
einen eigenen Zufallsstrom und eigene Diagnosen. Die IDs erlauben Zuordnung ohne
Namen oder Assetfelder im Kartenmodell.

PR 3 kann Version, Seed, normalisierte Konfiguration und Versuchsdaten für eine
Batch-Ausführung verwenden; das Stichprobenskript ist keine Produktions-CLI.
F05/F06 können Regionen, bewiesene/ungeklärte Starts und Routenuntergrenzen
weiterverwenden. Endgültige Start-/Zielauswahl, Hinweise, Solverqualität,
Schwierigkeit und Veröffentlichung bleiben eigenständige Schritte.

Vorprüfung, vorhandene CI-Fehler und lokale Abnahme:
[`verification/F04b-validation.md`](verification/F04b-validation.md).

## PR 2: Schnittstellen und Verantwortlichkeiten

Geografische Vielfalt hat weiterhin Vorrang. `generateMap({seed,config})` bleibt
mit Version `abstract-maps-1` bytegleich reproduzierbar. Kein Katalog wird implizit
geladen. Fehlende Bilder ändern weder Karte noch Gültigkeit oder Generatorstatus.
Die folgenden Ergebnisse sind interne Übergabedaten, keine neuen Puzzle- oder
Veröffentlichungsverträge. Die Anwendung wird in PR 2 nicht daran angeschlossen.

```js
import {loadReleasedAssetCatalog} from '../scripts/lib/released-asset-catalog.mjs'; // nur Node
import {assignAssets,createCatalogProfile} from '../src/assets/assignment.mjs';

// releaseId und backgroundId werden ausdrücklich gewählt.
const {catalog,provenance} = loadReleasedAssetCatalog({repositoryRoot,releaseId,backgroundId});
const free = generateMap({seed:42});
const assignment = assignAssets({map:free.map,seed:42,catalog});
const profile = createCatalogProfile(catalog,{preferencePercent:75});
const informed = generateMap({seed:42,catalogProfile:profile});
const informedAssignment = assignAssets({map:informed.map,seed:42,catalog});
```

`assignAssets`, `createCatalogProfile` und die Generierung sind synchron, rein und
verändern ihre Eingaben nicht. Der Release-Adapter liest geprüfte Gitdaten ohne
Bilddekodierung; Provenienz wird außerhalb der reinen Datenverträge gehalten.
Das weiterhin verfügbare Entwicklungswerkzeug `prepareAssetCatalog` liefert
`{library,backgroundId,verification}`. Er benutzt `validateAssetFiles` und
`validateAssetBytes`, hält dann dieselben erfassten Bytes für Bildprüfung und
Reproduktionshash fest. `verify-asset-positions.py` verwendet unverändert
`check_image` / `PixelFootprint` aus dem vorhandenen Bildprüfer. Der Hintergrund
wird ebenfalls dekodiert. Die strenge lokale Alpha-/Pixelflächenprüfung und die Hashlogik bleiben erhalten. Seit der Grafikvertragskorrektur vom 24.10.2026 wird die geografische Fläche nicht mehr mit globalen Spielschutzflächen geschnitten.

Die Verifikation bindet mit `librarySnapshot` die exakten geprüften Metadaten,
mit `backgroundId` die konkrete Freigabe und mit Version
`asset-placement-pixels-2` die korrigierte Prüflogik (vollständige lokale Grafikzellen an allen geometrisch passenden Positionen). Ergebnisse der Version 1 müssen erneut vorbereitet werden; sie könnten noch alte Randankersperren enthalten. Die Digestdefinition bleibt gleich; der Versionswert darin ändert den Digest. Pro produktivem geografischem Asset
enthält sie `anchors` und gegebenenfalls lokale `error`- oder positionsbezogene
`rejected`-Diagnosen. Zuerst werden alle Positionen gemeinsam geprüft; bei einem
Fehler werden lokaler Fehler und einzelne unzulässige Anker unterschieden.
Veraltete Freigabehashes oder ein beschädigter Hintergrund brechen die
Vorbereitung ab. Ein lokal ungeeignetes Asset bleibt mit Fehlerdiagnose im
Prüfergebnis und wird ausgeschlossen.

Die reinen Dienste vertrauen ausdrücklich dem Adapterergebnis; es ist keine
kryptografisch signierte Bescheinigung für beliebige fremde Eingaben. Wer diese
Schnittstelle direkt aufruft, muss vertrauenswürdige Verifikationsdaten liefern.
Fehlende Verifikation erlaubt keine Zuordnung und ergibt ein leeres Profil.
Eine Metadatenänderung nach der Vorbereitung wird abgewiesen. Nach Änderungen
der Dateien muss neu vorbereitet werden; ein gespeichertes Prüfergebnis prüft
nicht von sich aus heutige Dateien. Der Release-Adapter sichert Freigabe und
Ressourcenbindung für den Diagnoseeinstieg; eine Batchpipeline bleibt nachgelagert.

## Exakte Zuordnung und Ergebnisstruktur

`assignAssets({map,seed,catalog})` validiert zuerst Karte und Katalog. Geografische
Assets werden nach ID sortiert; Objektzellen werden als mögliche Anker mit
`placedCells` getestet. Dessen bestehende Transformation ist
`axial(anchor)=[q,r]`, `row=r+dr`, `column=q+dq+floor(row/2)`. Damit wird die
Zeilenparität korrekt berücksichtigt. Nur exakte Mengenübereinstimmung ist
zulässig. Es gibt keine Rotation, Spiegelung, Skalierung, Footprint-Reparatur
oder Verschiebung innerhalb einer Zelle. Tests unterscheiden asymmetrische
Rotationen/Spiegelungen und Translationen ausdrücklich.

`validateLibrary` erzwingt `semanticVersion:1` und die bestehenden geografischen
`semanticClass`-Werte. Das v2-Objekt hat absichtlich keine Motivklasse; die
Zuordnung darf daher jede passende geografische Klasse verwenden und berichtet
die tatsächlich gewählte Klasse aus den Metadaten. Sie erfindet keine Beziehung
zwischen Dateiname, Bildfarbe, Objekt-ID, Befahrbarkeit und Motivklasse.
Befahrbarkeit wird unabhängig und exakt verglichen. Freigaben kommen aus
`productionEnabled`, der konkreten Hintergrundfreigabe und den Hashprüfungen.
Jeder Kandidat wird durch den gemeinsamen Platzierungsprüfkern geprüft; die
gesamte Zuordnung besteht abschließend unverändert `validatePlacements`.
Die Pixelprüfung jedes Ankers erfolgt vorher, niemals durch Renderer-Clipping.

> Jede geografische Illustration ist an jeder Position verwendbar, an der ihre vollständige relative Hexform ohne Rotation oder Spiegelung auf die Karte passt. Die zulässige lokale Grafikfläche bleibt dabei unverändert.

Die vorhandenen Ankerlisten und Schnittstellen bleiben erhalten. Phase C befüllt
sie aus dem freigegebenen Release. Für ein lokal gültiges Bild enthält dieser
alle geometrisch passenden Anker. `PIXEL_POSITION_REJECTED` bleibt als Diagnose
für unvollständige übergebene Verifikationen bestehen, ist aber keine geografische
Randregel. Rahmenverträglichkeit wurde universell und separat geprüft; der
Ladeweg übernimmt den archivierten Nachweis. Generator-, Zuordnungs- und
Zufallsstromversionen ändern sich durch die Integration nicht.

```js
{
  status: 'complete', // complete | partial | none
  placements: [{id:'art-01',assetId:'…',anchor:'B2',objectId:'geo-01'}],
  objects: [{objectId:'geo-01',size:1,shape:'0,0',passable:true,
    status:'assigned',candidateCount:9,assetId:'…',semanticClass:'lighthouse',
    rejections:{/* verworfene Kandidaten nach Code */}}],
  diagnostics: {assignmentVersion:'asset-assignment-1',seed:42,backgroundId:'sea-blue-01',
    catalogSha256:'…',objectCount:1,assignedCount:1,unassignedCount:0,
    rejectionCounts:{},assetTypes:{lighthouse:1},assetUsage:{'…':1},
    candidateChecks:18,anchorChecks:18}
}
```

`placements` ist der bestehende Platzierungsvertrag; es wird kein zweites
Renderingformat eingeführt. Die Karte bleibt separat und unverändert.
`complete` bedeutet, dass jedes Objekt ein zulässiges Bild besitzt (auch bei
einer leeren Karte); `partial` bedeutet mindestens eines, aber nicht alle;
`none` bedeutet kein zugeordnetes Objekt einer nichtleeren Karte. Für
fehlende Objekte enthält `objects` stattdessen `status:'unassigned', reason`.
Detailfehler des Pixel-/Platzierungsprüfers werden gegebenenfalls mitgeliefert.

| Code | Tatsächliche Ursache |
| --- | --- |
| `NO_GEOGRAPHIC_ASSETS` | Keine geografischen Einträge |
| `NO_EXACT_FOOTPRINT` | Kein Asset hat an einem Objektanker exakt diese Zellen |
| `PASSABILITY_MISMATCH` | Exakte Formen haben andere Befahrbarkeit |
| `PRODUCTION_DISABLED` | Passende Form/Befahrbarkeit, aber keine produktive Illustration |
| `BACKGROUND_NOT_APPROVED` | Keine Freigabe für diesen konkreten Hintergrund |
| `PIXEL_VERIFICATION_MISSING` | Kein vertrauenswürdiges Bildprüfergebnis |
| `IMAGE_CONTRACT_REJECTED` | Bild scheitert am lokalen bestehenden Vertrag |
| `PIXEL_POSITION_REJECTED` | Erforderlicher geometrischer Anker fehlt in den übergebenen Verifikationsdaten; keine zusätzliche Randbeschränkung |
| `PLACEMENT_CONTRACT_REJECTED` | Weiterer Fehler des bestehenden Platzierungsvalidators |

Die Prüfungen bilden diese Reihenfolge. Der am weitesten gelangte Kandidat
bestimmt den primären Fehlgrund; `rejections` zeigt zusätzlich die übrigen
Kandidatenablehnungen. `diagnostics.rejectionCounts` zählt primäre Gründe pro
unbebildertem Objekt, keine Generatorablehnungen. `candidateChecks` zählt
geografische Asset-/Objektpaare, `anchorChecks` die getesteten Übersetzungen.

Mehrere zulässige Assets werden gleichgewichtet aus stabiler Reihenfolge
ausgewählt. Der Katalog verbietet Wiederverwendung nicht: Die vorhandene
Eindeutigkeit betrifft Platzierungs-IDs und Objektvertretung, nicht Asset-IDs.
Daher darf dasselbe Bild mehrere disjunkte Objekte vertreten. Mehrfach vorhandene
Illustrationen beeinflussen die Bildauswahl, nicht die Formgewichtung im Profil.

## Optionaler kataloginformierter Modus

`createCatalogProfile` liefert `{version:'catalog-shapes-1',catalogSha256,
preferencePercent,placements:[{cells,passable}]}`. Die Einträge enthalten nur
tatsächlich geprüfte, im Brett positionierbare Footprints. Gleichartige
Platzierungen werden nach Zellen und Befahrbarkeit dedupliziert. Asset-IDs,
semantische Motivklassen und Bilddateien gelangen nicht in den Generator.
`normalizeCatalogProfile` validiert jede vorgeschlagene Geografie mit
`validateMap`, sortiert/dedupliziert und weist unbekannte Felder/Transformationen
ab. Interne Grenze: höchstens 10.000 Profileinträge.

Der Generator benutzt denselben Kandidatenaufbau, dieselbe Objektanzahl-, Größen-
und Befahrbarkeitsauswahl und dieselben begrenzten Wiederholungen wie PR 1.
Pro Platzierungsversuch bevorzugt er mit `preferencePercent` (Default 75) eine
noch freie Profilplatzierung **derselben bereits gewählten Größe und
Befahrbarkeit**. Die verfügbaren unterschiedlichen Zellmengen sind innerhalb
dieser Auswahl gleichgewichtet. Bei fehlendem Kandidaten oder der übrigen
Wahrscheinlichkeit verwendet er das vorhandene freie Wachstum. Auch bei 100
Prozent bleibt fehlende Katalogabdeckung ein Rückfall auf freies Wachstum.
Größen werden nicht auf Einzelfelder reduziert und Befahrbarkeiten nicht ersetzt.
Kein vorhandenes Objekt wird nachträglich geändert oder entfernt.

Formen mit mehr aktuell freien legalen Platzierungen erhalten dabei mehr
Auswahlmöglichkeiten; Randlage und zuvor platzierte Objekte verzerren die
Verteilung weiterhin. Abweichende Platzierungsfehlschläge können außerdem zu
einem anderen akzeptierten Kandidaten und damit zu anderen Größen-/Anzahlwerten
für denselben Seed führen. Es gibt keine Behauptung gleicher Verteilungen oder
einer Gleichverteilung über Formklassen.

Damit bleiben abstrakt erlaubte, im Katalog vorhandene und konkret am Anker
bebilderbare Formen getrennt. Kataloglücken schränken die freie Generierung
überhaupt nicht ein. Auch das Profil verspricht keine vollständige Zuordnung:
Befahrbare Mehrfeldobjekte, freie Wachstumszweige und gegenseitige Belegung
können weiterhin ohne Bild bleiben. Der Modus akzeptiert solche Karten.
Es gibt keine zusätzliche Routenoptimierung oder implizite Start-/Routenfilter.
Die aus PR 1 bekannten Filter bleiben ausschließlich ausdrücklich wählbar.

Version des zusätzlichen Modus: `catalog-informed-maps-1`. Neben den üblichen
Diagnosen enthält er das normalisierte `catalogProfile` und pro Kandidat
`catalog:{preferenceDraws,preferredPlacements,growthPlacements,catalogMisses,
footprintChecks}`. `footprintChecks` zählt überprüfte Profileinträge; deshalb
ist weniger Wachstum nicht automatisch weniger Gesamtaufwand. Vorbereitung
und spätere Assetauswahl sind eigene Kosten.

## Reproduktion und Identitäten in PR 2

- Freie Karten: unverändert `abstract-maps-1`, uint32-Seed, normalisierte Config.
- Profilkarten: zusätzlich `catalog-informed-maps-1` und das vollständige
  normalisierte Profil einschließlich `preferencePercent` und Katalogdigest.
- Bildauswahl: `asset-assignment-1`, eigener uint32-Seed, unveränderte Karte,
  gleicher Katalog, Hintergrund, Ressourcenbytes und Bildprüferversion.

Assetauswahl verwendet ausschließlich die Domäne
`asset-assignment-1/selection`. Der Profilmodus ergänzt je Kandidat die Domänen
`catalog-informed-maps-1/<Versuch>/preference` und `/footprint`. Layout,
Befahrbarkeit und freies Wachstum behalten ihre vorhandenen getrennten Streams.
Zusätzliche Bilder, Änderungen der Bildauswahl oder reine Analyseänderungen
konsumieren keinen geografischen Zufall im freien Modus. Ein leeres Profil oder
0 Prozent Präferenz reproduziert dessen Geometrie exakt. Änderungen der
Algorithmus-/Prüfsequenzen erfordern entsprechende Versionsanhebung.

`catalogSha256` ist ein technischer Digest über `canonicalJson({library,
backgroundId,resources,checkerVersion})`; `resources` listet sortierte Pfade und
SHA-256 der beteiligten geografischen Produktionsbilder und des Hintergrunds.
Beide Funktionen stammen aus `scripts/lib/publication-archive.mjs`. Es entsteht
keine parallele Hashimplementierung und keine neue Publikationsidentität.
Kartenbeispiele verwenden den bestehenden `mapFingerprint`. Ein Digest allein
ersetzt nicht die archivierten Katalog-/Bildbytes oder den Algorithmusstand.

## Vergleich, Kataloggrenzen und Übergabe an PR 3

Die abgelegten PR-1-/PR-2-Stichproben dokumentieren ihre historischen Versionen.
PR A hebt nur die Pixelprüfversion auf `asset-placement-pixels-2` an; dadurch
ändert sich der Katalogdigest trotz unveränderter Produktionskandidaten.
Der getrennte [Prüfnachweis zu PR A](verification/graphic-contract-A.md) und die
[neue Katalogstichprobe](verification/graphic-contract-A-catalog-sample.json)
trennen diesen Versionseffekt von geografischen Änderungen. Die ursprünglichen
Dateien und die unten beschriebene P2-Reproduktion bleiben erhalten.

`node scripts/sample-catalog-maps.mjs --release <ID> --background <ID>` gibt die
feste Vergleichsstichprobe als JSON auf stdout aus, ergänzt um separate Provenienz.
Die historischen Dateien `verification/F04b-catalog-sample.json` und
`verification/graphic-contract-A-catalog-sample.json` bleiben unverändert.
Parameter: Seeds 0–127, 3–8 Objekte, Größen 1–4,
Befahrbarkeitswahrscheinlichkeit 0,25, Präferenz 75 Prozent, keine Routenfilter
und keine Routensuche. Die freie Geometrie entspricht dem freien Profil der
PR-1-Stichprobe; deren gesonderte Routenanalyse wird hier nicht wiederholt.
Das Skript ist eine interne Messung, keine Produktions-Batch-CLI.

Der Bericht enthält vollständige Karten und Zuordnungen für Seeds 0/1/2 sowie
gegebenenfalls die erste vollständige Karte je Modus; zusätzlich einen klar
als Einfeldprofil ausgewiesenen vollständigen Zuordnungsfall. Gezählt werden
Abdeckung, Asset-IDs/-Klassen, Größen, orientierte Formen, Formen/Befahrbarkeit,
unbebilderte Größen/Formen und primäre Fehlgründe sowie sämtliche Kandidaten-,
Platzierungs-, Profilprüf- und Zuordnungsversuche. Histogramme und unterschiedliche
Karten/Formen machen Auswahlverzerrungen sichtbar; es gibt keinen Qualitätsscore.
Die konkreten Messergebnisse und Prüfbelege stehen im
[Abnahmebericht](verification/F04b-validation.md#pr-2-assetzuordnung-und-katalogprofil).

Aktueller Katalog: 18 produktive geografische Illustrationen auf `sea-blue-01`,
neun befahrbare Einfeldmotive, neun unbefahrbare Motive der Größen 1–4.
Befahrbare Mehrfeldillustrationen fehlen weiterhin. Viele Orientierungen und
größere abstrakte Objekte haben keine passende Illustration. Dekorationen,
technische Platzhalter, Entwürfe und historische/zurückgestellte Bilder sind
keine Ersatzformen. Diese Lücken sind kein Karten- oder Generatorfehler.

Phase B/C ergänzt den persistenten Freigabenachweis, gebundene archivierte
Ressourcen und das Laden freigegebener Stände ohne erneute Bilddekodierung.
PR 3 übernimmt darauf aufbauend die getrennten Karten-/Zuordnungsdaten,
Versionen, Seeds, normalisierte Config/Profile und Versuchsdiagnosen. Es muss
den freigegebenen Katalog-/Ressourcenstand pinnen. Neue Ressourcenbytes verlangen
einen neu geprüften Stand. Abdeckung ist eine eigene Produktionsentscheidung,
kein stiller Gültigkeitsfilter. Der bestehende Renderer kann später unmittelbar
`placements` verwenden. Endgültige Start-/Zielwahl, Hinweise, Schwierigkeit,
Produktions-Batches und Veröffentlichungsidentitäten bleiben spätere Schritte.

## P2-Korrektur: Validierung bei vielen Assetkandidaten

Der reviewte Head `a233965` rief pro passendem Asset-/Objektpaar den vollständigen
`validatePlacements`-Einstieg auf. Dieser prüfte jedes Mal erneut den gesamten
Katalog einschließlich Geometrien, Reviews und Referenzen. Die geografisch
korrekte Zuordnung skalierte deshalb bei vielen gleichartigen Bildern schlecht.

`src/assets/library.mjs` enthält jetzt einen einzigen privaten Platzierungs-
prüfkern `placementErrors`. Der öffentliche Einstieg `validatePlacements`
behält Signatur, Prüfungen, Fehlertexte/-reihenfolge und Kombinationsprüfungen.
Der neue **interne** Einstieg lautet:

```js
withPlacementValidator(library,map,backgroundId,validator => {
  const errors = validator.candidateErrors(placement);
  const approved = validator.compatibility(assetId);
  const enabled = validator.productionEnabled(assetId);
  // Kandidaten sind unabhängig; eine Kombination ist damit noch nicht geprüft.
}, {development:false});
```

Dieser synchrone Aufruf validiert Katalog und Karte, baut private Indizes für
Asset-/Objekt-IDs, konkrete/Wildcard-Reviews, Befahrbarkeits-/Freigabezugriffe,
Brettzellen und logisch belegte Zellen und verwendet sie für alle Kandidaten.
In `assignAssets` ersetzt er die bisherige Katalogeingangsprüfung. Die bisherige
formale Kartenprüfung am Diensteingang bleibt erhalten; geometrische Indizes
werden nur einmal je Scope aufgebaut. Die abschließende öffentliche
Gesamtvalidierung bleibt eine vollständige, unabhängige Prüfung.
Damit finden genau **zwei vollständige Katalogvalidierungen** je Zuordnung statt:
Scope-Eingang und Abschluss, unabhängig von der Kandidatenzahl.

Die Methoden und Indizes dürfen nicht für spätere Aufrufe gespeichert werden:
Eine eingefangene Methode wirft nach Rückkehr oder Fehler `Expired placement
validation scope`; ein Promise-Ergebnis wird abgewiesen. Katalog-/Kartenmetadaten
werden nur an den Scope-Grenzen serialisiert und verglichen. Bei Änderung wird
kein Ergebnis zurückgegeben (`Stale placement validation scope`). Die privaten
Indizes können weder übergeben noch verändert werden; es existiert kein
„bereits validiert“-Schalter und kein globaler Cache.

Der vorhandene `validateCatalogVerification`-Pfad prüft weiterhin Version,
Hintergrund, Digestformat und `librarySnapshot`. Verifikationseinträge werden
innerhalb eines Zuordnungsaufrufs bei Bedarf nach Asset-ID indiziert; bei mehreren
Einträgen gilt wie beim bisherigen `find` der erste. Pixelanker und lokale
Bildfehler bleiben unveränderte zusätzliche Tore vor dem Platzierungsprüfkern.
Ein fehlender oder fehlerhafter Nachweis wird durch die Optimierung nicht zu
einer Freigabe. Die generelle Vertrauensgrenze für Adapterdaten bleibt unverändert;
der freigegebene Diagnoseeinstieg stellt die Ressourcenbindung über Phase B/C her.

Auch `validateLibrary` benutzt für Referenzen nun ID-/Familienmengen, statt je
Review den gesamten Assetbestand zu durchsuchen. Bei festem 25-Zellen-Brett
bleiben die stabil geordneten `M × N` Asset-/Objektprüfungen erhalten; Katalog-
validierung und Indizes werden nur konstant oft aufgebaut. Schema-/Geometrie-
prüfungen, Metadatenvergleiche und Speichernutzung bleiben abhängig von der
Katalog-/Reviewgröße. Kleine Ankerlisten werden weiterhin direkt geprüft;
zusätzliche Footprint- oder Positionscaches waren für diesen Befund nicht nötig.

Kein Algorithmus-, Stream-, Versions- oder Diagnoseformatwechsel. Beide
Stichprobendateien bleiben verbindliche bytegleiche Regressionen. Der Benchmark
`node scripts/benchmark-asset-assignment.mjs [Checkout-Wurzel]` misst dieselbe
synthetische Zuordnung mit 28/128/512 Assets, 25 Einfeldobjekten und Seed 0,
ohne Datei-/Bildvorbereitung. Einzelne Laufzeiten sind keine CI-Grenzwerte;
ein Strukturtest sichert die konstante Zahl vollständiger Katalogprüfungen.
Messwerte, Reproduktion und Nachprüfung:
[Prüfbericht](verification/F04b-validation.md#p2-performancekorrektur-in-pr-77).
