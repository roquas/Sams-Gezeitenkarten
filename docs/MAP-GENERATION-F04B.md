# F04b / PR 1: abstrakte Karten

`src/generation/` erzeugt ausschließlich gültige v2-Karten. Geografische Vielfalt
hat Vorrang vor Routeneignung. Die Karte enthält unverändert nur `geometry`,
`grid` und `objects: [{id,cells,passable}]`. Formale Gültigkeit, geografische
Struktur, gemessene Routeneignung und spätere Rätselqualität sind getrennt.
Eine zerschnittene Karte, eine Karte ohne befahrbares Objekt oder ohne Route
ist gültig und wird ohne explizite Filter akzeptiert. Assets, Startauswahl,
Zielroute, Hinweise, Texte und Veröffentlichungen sind nicht Teil dieses Schritts.

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
