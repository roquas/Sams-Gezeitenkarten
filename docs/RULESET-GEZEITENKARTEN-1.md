# Regelvertrag `gezeitenkarten-1`

Status: eingefrorene fachliche Semantik des modularen Spiels auf main
`1f968b03d6e48940acdf5209b6f844e7776bc163`, dokumentiert mit F01/I01.
Vorbereitung für [Generator-Issue #21](https://github.com/roquas/Sams-Gezeitenkarten/issues/21).

`gezeitenkarten-1` bezeichnet die Regeln, nicht die Generator-, Datei-, Asset- oder
Spielstandversion. Die Kennung ist zunächst dokumentarisch: F01 fügt kein Feld zum
Rätselschema hinzu und verändert weder Engine noch Loader oder Oberfläche.
Eine spätere andere Regelbedeutung braucht einen eigenen Vertrag und muss den
Zugriff auf historische Rätsel erhalten. Eine stillschweigende Umdeutung dieses
Vertrags ist ausgeschlossen.

## 1. Geltungsbereich und Quellen

Verbindlicher Ausgangspunkt sind die vorhandenen Module:

- [`hex.mjs`](../src/engine/hex.mjs): Koordinaten, Nachbarschaft, Distanz, Richtungen.
- [`puzzle.mjs`](../src/engine/puzzle.mjs): `createRules`, `legal`, `matches`, `coast`, `routes`.
- [`schema.mjs`](../src/puzzles/schema.mjs) und [`validate.mjs`](../src/puzzles/validate.mjs):
  akzeptierte Parameter, Referenzen und Veröffentlichung eindeutiger Fälle.
- [`solver.mjs`](../src/engine/solver.mjs): vollständige Suche und Diagnosemetriken.
- [Unabhängige Archivprädikate](../tests/reference/reference-rules.mjs) und
  [Referenzpräzisierung 3.6](CLUES-AND-GEOMETRY-3.6.md): Kontrolle des historischen Falls.

Die ältere [partielle Rekonstruktion](RULES-3.6.md) beschreibt den konkreten
Referenzfall, nicht feste Inselpositionen oder eine universelle Startposition.
Darstellungsgeometrie, Grafik-Footprints, Radar, Animationen, Markierungen und
Bedienabläufe sind keine zusätzlichen Bewegungs- oder Hinweisregeln dieses Vertrags.

## 2. Karte, Orte und legale Route

- Das bestehende Schema 1 erlaubt genau **5 × 5** Zellen `A1` bis `E5` und
  ganzzahlige `steps` von **1 bis 6**. Die vier historischen Fälle haben sechs Etappen.
- Bei nullbasiertem Spaltenindex `c` und Zeilenindex `r` lauten die axialen
  Koordinaten `q = c - floor(r/2)`, `r = r`. Beide Zeilenparitäten sind verbindlich.
- Hexdistanz ist `max(|dq|, |dr|, |dq + dr|)`. Dieselbe Zelle hat Abstand 0;
  Nachbarschaft bedeutet Abstand 1, also eine gemeinsame Hexseite.
  Hindernisse verlängern diese geometrische Distanz nicht.
- Der Richtungszyklus im Uhrzeigersinn ist `E, SE, SW, W, NW, NE` mit axialen
  Differenzen `(1,0), (0,1), (-1,1), (-1,0), (0,-1), (1,-1)`.
  Für nicht benachbarte Zellen liefert `direction` keine Richtung.
- Ausschließlich `logic.blocked` bestimmt gesperrte Zellen. Anzahl und Lage sind
  Rätseldaten. Start und alle betretenen Zellen müssen bekannt und befahrbar sein.
- Eine legale vollständige Route enthält genau `steps + 1` Positionen, beginnt
  bei `logic.start`, geht je Etappe zu einer benachbarten Zelle und besucht keine
  Zelle zweimal. Stunde 0 ist der Start, Stunde `h` die Position nach Etappe `h`.
- Ein Ort hat eine stabile lokale ID, eine nichtleere Menge verschiedener Zellen
  und einen vorhandenen `kind`. `island` muss vollständig gesperrt sein;
  `lighthouse`, `reef`, `wreck` und `landmark` müssen vollständig befahrbar sein.
  Namen und Grafiken bestimmen keine Befahrbarkeit. Orte dürfen mehrere Zellen
  umfassen; der aktuelle Logikvalidator fordert keinen Zusammenhang dieser Zellen.
- Ortsnachbarschaft ist ein **befahrbares** Feld mit gemeinsamer Seite zu
  mindestens einer Ortszelle. Das Prädikat gilt für alle vorhandenen Ortsarten;
  der technische Name `coast` schränkt es nicht auf Inseln ein.

## 3. Sieben Hinweistypen und Parametergrenzen

Jeder Hinweis besitzt eine eindeutige `id` und genau die zum Typ gehörenden
Parameter. Stunden, Distanzen und Anzahlen sind ganze Zahlen. Alle Orts-IDs müssen
existieren; Textreferenzen gehören separat zur Darstellung. Mindestens ein Hinweis
ist im veröffentlichten v1-Dokument erforderlich. Unbekannte Typen/Felder und
ungültige Parameter werden abgewiesen; die genauen ID-/Textformate stehen im
[vorhandenen Schema](../puzzles/schema/puzzle-v1.schema.json).

| Typ | Parameter | Unveränderte Bedeutung |
| --- | --- | --- |
| `position` | `hour: 0..steps`, `cell: A1..E5` | `route[hour]` ist genau `cell`. |
| `direction` | `hour: 1..steps`, eine der sechs Richtungen | Richtung von `route[hour-1]` nach `route[hour]`. |
| `turn` | `hour: 2..steps`, `degrees` aus `-180,-120,-60,0,60,120,180` | Richtungsänderung gegenüber der unmittelbar vorherigen Etappe; positiv rechts, negativ links; zyklischer Übergang zwischen `NE` und `E`; 0 bedeutet geradeaus. |
| `adjacentToPlace` | `hour: 0..steps`, `place` | Die Position ist befahrbar und Nachbar mindestens einer Ortszelle. |
| `distanceToPlace` | `hour: 0..steps`, `place`, `distance: 0..8` | Mindestens eine Ortszelle hat **exakt** diesen geometrischen Abstand zur Position. |
| `distanceBetweenHours` | `hours: [a,b]`, `0 <= a <= b <= steps`, `distance: 0..8` | Geometrischer Abstand zwischen den Positionen der beiden Stunden. |
| `countAdjacentToPlace` | `hours: [a,b]`, `0 <= a <= b <= steps`, `place`, `count: 0..min(7,b-a+1)` | Genau so viele Stundenpositionen im **inklusiven** Intervall sind Ortsnachbarn; jede Stunde zählt höchstens einmal. |

Die Schema-Obergrenze für Stunden bleibt 6; der semantische Validator begrenzt
jeden Hinweis zusätzlich auf die tatsächliche Routenlänge. Bei einer Etappe ist
deshalb kein `turn` möglich. Eine 180°-Drehung ist als Parameter zulässig, würde
aber eine sofortige Rückkehr zur vorherigen Zelle erfordern und ist mit einer
legalen Route ohne Wiederbesuch unvereinbar. Schema-Gültigkeit allein garantiert
keine erfüllbaren Hinweise oder eine eindeutige Aufgabe.

Stunde 0 ist für die entsprechenden Typen ausdrücklich erlaubt. Stundenpaare
enthalten genau zwei Werte und dürfen identisch sein: Selbstabstand ist dann 0;
ein Zählintervall `[h,h]` zählt genau diese eine Position. Bei `[a,b]` werden Start-
und Endgrenze mitgezählt. Mehrere angrenzende Zellen desselben Ortes führen nicht
zu mehreren Kontakten innerhalb einer Stunde. Ein Zählwert 0 ist zulässig.

### Existenzielle Ortsdistanz ausdrücklich erhalten

`distanceToPlace` verwendet `some`, **nicht** den Mindestabstand über alle Ortszellen.
Im historischen Referenzfall liegt Stunde 6 auf `A1`; zu Tesoro-Zellen `B3` und `C3`
bestehen die Abstände 2 und 3. Daher sind beide Aussagen wahr:

```json
[
  {"type":"distanceToPlace","hour":6,"place":"tesoro","distance":2},
  {"type":"distanceToPlace","hour":6,"place":"tesoro","distance":3}
]
```

Dies sind Prädikatsfragmente; vollständige Hinweise benötigen zusätzlich eine ID.
Ein Wechsel auf `min(...) === distance` würde die zweite Aussage fälschlich
ablehnen und wäre eine Regeländerung. Hinweise und ihre späteren Textvorlagen
müssen diese existenzielle Bedeutung erhalten. Bei einem befahrbaren Ort kann
Abstand 0 die Ortszelle selbst bezeichnen; Nachbarschaft verlangt dagegen Abstand 1.

## 4. Historischer Bestand und bestehende Prüfungen

Die vier Dokumente behalten ihre IDs, jeweils `schemaVersion: 1` und `dataVersion: 1`.
Karte, strukturierte Hinweise und Sollroute bleiben unverändert:

| ID | Legale Routen bei hinterlegtem Start | Lösungen | Eindeutige Route |
| --- | --- | --- | --- |
| `reference-3.6` | 519 | 1 | D4 → E3 → D2 → C2 → B2 → B1 → A1 |
| `test-navigation` | 400 | 1 | A5 → B5 → C5 → D5 → E5 → E4 → D4 |
| `quittung-nombreo` | 521 | 1 | A5 → B5 → B4 → C3 → D3 → D2 → E1 |
| `ankerbuch-tesoro` | 209 | 1 | E5 → E4 → E3 → D4 → D5 → C5 → B4 |

Die bestehenden SHA-256-Erwartungen über `JSON.stringify({logic, solution})` in
[`stabilization.test.mjs`](../tests/reference/stabilization.test.mjs) bleiben
unverändert. Sie sichern auch sämtliche strukturierten Hinweise und Kartendaten.
Dort werden nun zusätzlich Identitäten, Versionen und Manifestzuordnung geprüft.
Die bestehende Katalogprüfung in
[`puzzle-data.test.mjs`](../tests/reference/puzzle-data.test.mjs) gleicht die
tatsächlich berechnete einzige Route für jeden Fall mit der hinterlegten Route ab.
Archiv-, Referenz- und redaktionelle Tests bleiben erhalten.

F01 ergänzt keine zweite Spielengine. Die unabhängigen Archivprädikate werden für
alle 625 Geometriepaare und die Weglasszahlen eines Referenz-Hinweissatzes genutzt.
Die neue Regelvertragsdatei
[`rules-contract.test.mjs`](../tests/reference/rules-contract.test.mjs) ergänzt
gezielt fehlende Randprüfungen. Bereits vorhandene Tests für Wiederbesuche, Land,
unbekannte Typen, falsche Sollrouten, Mehrdeutigkeit und Suchbudgetfehler werden
weiterverwendet.

## 5. Verbindliche Anforderung an künftige generierte Basisrätsel

Ein **Basis-Hinweissatz** ist Bestandteil einer unveränderlichen Rätselvariante.
Vor jeder späteren Veröffentlichung muss nachgewiesen werden:

1. Der vollständige Satz hat **genau eine legale Lösung**.
2. Diese Lösung entspricht der festgelegten Zielroute, nicht nur irgendeiner Route.
3. Beim Entfernen **jedes einzelnen** Hinweises bleiben **mindestens zwei** legale
   Lösungen. Karte, Start, Etappen, Ortsdaten und alle übrigen Regeln bleiben dabei
   unverändert und werden vollständig berücksichtigt.

Dies ist **Irredundanz** oder Inklusionsminimalität. „Minimal“ bedeutet hier nicht,
dass es im gesamten möglichen Hinweisraum keinen anderen, kürzeren eindeutigen
Satz gäbe. Irredundanz ist notwendig, aber allein noch keine Rätselqualität.
Die vier historischen Rätsel unterliegen dieser neuen Produktentscheidung
**nicht rückwirkend**. Insbesondere bleibt der redundante Referenzhinweis `I`
unverändert; das Herausnehmen dieses Hinweises im Test ist nur eine In-memory-Probe.

### Eignung des bestehenden Solvers und noch fehlendes Veröffentlichungsgate

`solvePuzzle(logic)` ist DOM-unabhängig und ignoriert eine gespeicherte Sollroute.
Ein vollständiger Lauf liefert `status`, genaue `count`, `solutions` und standardmäßig
`metrics.withoutClue` mit der Lösungszahl nach Weglassen jedes Hinweises. Diese
Werte berücksichtigen dieselbe vollständige Karten-/Regellogik und reichen für die
obigen Prüfungen. Der Referenzteil ohne Hinweis `I` wird zusätzlich gegen die
unabhängigen Archivprädikate auf seine Weglasszahlen geprüft.

Voraussetzung ist eine validierte Definition und ein erfolgreich abgeschlossener
Suchlauf. Das Standardbudget beträgt 250.000 besuchte Suchknoten; ungültige Budgets
oder eine Überschreitung werfen einen Fehler und sind **kein** Eindeutigkeitsbeweis.
`redundantClueIds` allein ist kein Veröffentlichungskriterium: Erst müssen die
vollständige Eindeutigkeit und die Übereinstimmung mit der Zielroute feststehen.
Die Metrik nennt auch bei anderen Lösungszahlen Hinweise, deren Weglassen diese
Zahl nicht verändert. Bei `metrics:false` fehlen die Weglassmetriken.

Mehrere einzeln redundante Hinweise dürfen nicht blind gleichzeitig entfernt
werden: Zwei identische Richtungshinweise für eine Ein-Etappen-Route sind jeweils
redundant, doch ohne beide bleibt die Route mehrdeutig. Nach jeder Entfernung
erneut prüfen. Ein einmal vollständig irredundanter Satz erfüllt die Definition
unabhängig davon, ob eine andere Suchreihenfolge einen kürzeren Satz gefunden hätte.

F01 dokumentiert diese verpflichtende künftige Freigabeprüfung und testet die
Eignung der vorhandenen Diagnosen. **Ein Generator, ein neues Veröffentlichungs-
oder Irredundanzgate sowie optimierte Kandidaten-/Bitmaskenprüfungen werden hier
noch nicht implementiert.** `compilePuzzle()` fordert heute Eindeutigkeit und
prüft eine vorhandene Sollroute, aber noch keine Irredundanz.

## 6. Zusätzliche Hilfestellungen sind vom Basissatz getrennt

Eine zusätzliche Hilfe, beispielsweise eine ausdrücklich genannte Stundenposition,
darf logisch redundant sein. Sie wird künftig separat zum unveränderlichen
Basis-Hinweissatz verwaltet und bewertet, verändert dessen Identität nicht und
ist keine eigene Regeländerung. Der Basissatz bleibt Grundlage der Qualitätsprüfung.
Wird dagegen der Basissatz selbst verändert, ist das keine bloße Hilfedarstellung.

F01 ändert weder das bestehende `presentation.hints` noch die heutigen
Hilfefunktionen. Datenmodell, Freischaltung, Anzeige und spätere Wertung zusätzlicher
Hilfen bleiben für Folgeschritte offen; es entsteht kein neues Hilfesystem.

## 7. Grenzen der bestehenden Schwierigkeitsmetriken

Der vorläufige Solverwert ist `log2(legalRouteCount / solutionCount)`;
bei null Lösungen ist der Score `null`. Eindeutige Varianten derselben Karte mit
demselben Start und derselben Etappenzahl erhalten deshalb immer denselben Score.
Der Test vergleicht den historischen Siebener-Satz, seinen irredundanten
Sechser-Teil ohne `I` und sechs direkte Positionsangaben: alle eindeutig zur
gleichen Route, alle Score `log2(519)`, trotz anderer Hinweise und Redundanz.

Auch `forcedPositions` und `forcedEarlySteps` beruhen auf den bereits vollständig
gefilterten Lösungen. Bei Eindeutigkeit sind alle Positionen fest; das beweist
keinen einfachen Anfang und keinen menschlichen Deduktionsweg.

Weder legale Routenzahl noch Hinweiszahl, Eindeutigkeit, Irredundanz oder Laufzeit
des exakten Solvers allein begründen einen **menschlichen Schwierigkeitsgrad**.
Die Metriken bleiben vorläufige Enumerationsdiagnostik. Es werden keine neuen
Schwierigkeitsgrade, Deduktionsverfahren oder Qualitätsgrenzen eingeführt.
Erklärte Lösungsprofile und menschliche Spieltests sind spätere Arbeit.

## 8. Weiterarbeit und Prüfung

F02 kann auf diesem Regelvertrag und dem unveränderten historischen Bestand
aufbauen. Offen bleiben insbesondere stabile Instanz-/Variantenidentitäten,
ein separates Veröffentlichungsmanifest, die Zuordnung der Regelkennung zu
Veröffentlichungen und langfristig getrennte Schema-/Spielstandversionen.
Der spätere Generator benötigt das beschriebene verpflichtende Irredundanzgate,
getrennte Hilfedaten, reproduzierbare Auswahl und eine kalibrierte Qualitätsbewertung.
Diese Arbeiten sind weder Voraussetzung für den heutigen Loader noch Teil von F01.

Die zusätzlichen Tests laufen über den vorhandenen `npm run test:unit`-Glob in
GitHub Actions. Relevante Prüfebenen und bestehende Abdeckung:
[Testplan, Abschnitt F01](TESTPLAN.md#regelvertrag-gezeitenkarten-1-f01i01).
