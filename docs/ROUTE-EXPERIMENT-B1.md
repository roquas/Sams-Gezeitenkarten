# B1: privater Routen- und Experimentierlauf

B1 liest einen **bereits abgeschlossenen, ungefilterten Kartenbatch im Format 3**.
Es untersucht ausschließlich sechs Etappen ab **jeder Zelle jedes befahrbaren
Objekts**. Freies Wasser wird nicht zum Start. Leere Karten, Dubletten, fehlende
Starts, nachgewiesene Routenlosigkeit und unvollständige Zählungen bleiben erhalten.
Keine Ersetzung, Kartengenerierung, Hinweissuche oder Qualitätsbewertung im Lauf.

## CLI

Node 22+, Git und die vollständige Releasehistorie werden benötigt. Programmdateien
unter `src/` und `scripts/` müssen sauber und committed sein. Der Eingabebatch wird
nicht verändert; das neue Ausgabeverzeichnis muss außerhalb davon liegen.

```sh
node scripts/run-route-experiment.mjs \
  --batch /tmp/vorhandener-kartenbatch \
  --accepted-indices all \
  --max-nodes-per-start 100000 \
  --out /tmp/b1-routen
```

Alle vier Optionen sind verpflichtend. Statt `all` ist eine explizite, nullbasierte
Liste wie `0,8,3` möglich; deren Reihenfolge bleibt erhalten. Indizes beziehen sich
auf `accepted.jsonl`, nicht auf ursprüngliche Generatorversuche. Doppelte oder
ungültige Indizes sind Fehler. `all` erlaubt auch einen abgeschlossenen Batch ohne
akzeptierte Karten und liefert dann einen leeren Ergebnisstrom.

Optional: `--repository <Releasecheckout>`. Dieser bestimmt nur den gepinnten
Katalogzugriff; der Programmstand bleibt der ausgeführte Checkout. Es gibt weder
einen `--steps`- noch einen Strategieparameter in B1. Das explizite Knotenbudget
gilt **je Start**, erlaubt 1–1.000.000 und wird nicht automatisch erhöht.

`readContactBatch()` prüft beide vollständigen Eingabeströme, Zusammenfassung,
Kartenfingerprints, konkrete Motivbelegung und Releaseherkunft, auch bei einer
kleinen Auswahl. Der Leser erhält dafür den zusätzlichen expliziten Wert `all`;
die vorhandene Kontaktübersichts-CLI und deren Listenauswahl bleiben unverändert.
Quellbatches mit `filters.routeSteps` oder `minLargestComponent > 0` werden vor der
Ausgabe abgewiesen: Sie hätten bereits eine Eignungsauswahl vorgenommen. B1
generiert deshalb keinen anderen Batch. Die normalen Katalog-, Packungs- und
Befahrbarkeitsregeln bleiben bestehende Herkunftsbedingungen, keine Kartengüte.

## Privates Experimentformat 1

Die Dateien sind interne Messdaten, keine öffentlichen Rätseldokumente:

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | Formatversion, Experiment-ID, Strategie `all-starts-six-steps-1`, Routenreihenfolge, Regelversion, feste sechs Etappen, Budget je Start, Programmcommit/Node-Version, Eingabedateihashes, explizite Ergebnisindizes sowie vollständiges Eingabemanifest und dessen Zusammenfassung |
| `maps.jsonl` | Genau eine Zeile je ausgewähltem Kartenergebnis: Versuchs-ID, ursprüngliche Indizes/Seeds, Kartenfingerprint, unveränderte Karte und Motivplatzierungen, geografische Analyse, aggregierte Routenzählung und alle Startversuche |
| `summary.json` | Summen über alle ausgewählten Karten und Starts, Statusverteilungen, Routenzahl-Untergrenze, Exaktheit, unvollständige Karten/Starts, besuchte Knoten und gesamtes nominelles Knotenbudget |

Jeder Startversuch enthält `trialId`, `cell`, `routeCountLowerBound`, `countExact`,
`status`, gegebenenfalls `reason`, die vorhandenen `search`-Zähler und `routeSource`.
Die Kartenzeile enthält zusätzlich unter anderem `eligibleStarts`, `unknownStarts`
und die entsprechenden aggregierten Zähler aus `analyzeMap()`.

### Status und Exaktheit

- `no-start`: kein zulässiger Start, exakte Routenzahl null; nur Kartenstatus.
- `no-route`: vollständige Suche oder vorhandener Komponentengrößenbeweis ergibt
  null Routen. Der Komponentengrößenbeweis benötigt keine Suchknoten.
- `unknown`: noch keine Route gefunden und Suchbudget erschöpft; null ist **nur
  eine Untergrenze**, kein Nachweis der Routenlosigkeit.
- `route-found`: mindestens eine Route gefunden. Auch hier kann das Budget vor
  Ende erschöpft sein; deshalb immer `countExact` und `search.completed` beachten.

Eine Zahl ist nur bei `countExact:true` exakt. Karten- und Gesamtsummen addieren
die Startzählungen; sie zählen Routen mit ihrem jeweiligen Start. Es werden keine
geometrisch gleichen Karten oder ähnlichen Routen dedupliziert.

Die geografischen Werte stammen unverändert aus `analyzeMap()`. Insbesondere
bezeichnet `landFraction` den Anteil **aller objektbelegten Zellen**, einschließlich
befahrbarer Objekte. `coastEdges` zählt Objekt-/Wassergrenzen. Beide sind weder
Schwierigkeitswerte noch ausschließlich Kennzahlen unbefahrbaren Landes.

`summary.json` wird erst nach Verarbeitung aller ausgewählten Karten atomar aus
`summary.pending` umbenannt. `status:completed` besagt, dass der Lauf alle Eingaben
bearbeitet hat; es besagt nicht, dass jede Routensuche vollständig war. Ein
unerwarteter Analysefehler wird als Fehlerzeile mit Ursache gespeichert und bricht
den Lauf ohne Abschlussdatei ab. Eingabe-, Release- und Auswahlfehler reservieren
kein Ausgabeverzeichnis. Vorhandene Ausgaben werden nie überschrieben.

### Identität und Reproduktion

`experimentId` ist ein privater, domänengetrennter SHA-256 über Format/Strategie,
Routenreihenfolge, Regelversion, sechs Etappen, Budget, Programmstand, die SHA-256
der vier Eingabedateien und die tatsächlich gewählten Ergebnisindizes. Bestehende
Kanonisierung und SHA-256-Helfer werden wiederverwendet. Verzeichnisnamen und
Uhrzeiten gehören nicht zur Identität; die fachlichen Dateien sind bei denselben
Bytes, Parametern, Programm- und Node-Ständen bytegleich.

Kartenversuche binden Experiment-ID, Ergebnisindex und bestehenden Kartenfingerprint;
Startversuche zusätzlich die Startzelle. Inhaltlich gleiche Karten an mehreren
Ergebnisindizes bleiben damit unterschiedliche Beobachtungen. Keine vorhandene
Karten-, Instanz-, Varianten- oder Veröffentlichungsidentität wird umdefiniert.

Die Eingabedateien werden vor und nach der vorhandenen Prüfung gehasht; eine
Änderung während des Einlesens bricht ab. B1 verwendet die eingelesenen Karten
und protokolliert auch innere/äußere Generatorbudgets aus dem Quellmanifest. Diese
Generatorversuche werden nicht mit den anschließenden Startversuchen vermischt.

## Anschluss für B2

Die Karte, alle Startzählungen und die geografischen Messdaten sind in der
Kartenzeile wiederverwendbar. B2 kann aus einer positiven Startzählung einen
Routenindex wählen und die konkrete Route mit separatem Budget abrufen:

```js
import {selectTargetRoute} from '../scripts/lib/route-experiment.mjs';

const target = selectTargetRoute(mapRecord.map, {
  start: mapRecord.starts[0].cell,
  routeIndex: 0,
  maxNodes: 100000
});
// Erst target.status === 'selected' liefert route und instanceFingerprint.
```

`routeIndex` ist nullbasiert in der vorhandenen `createRules().routes()`-Reihenfolge:
Rasterzellen zeilenweise A1…E1, A2…E2 usw., Tiefensuche der Engine. Der Adapter
implementiert keine eigene DFS. `engine-row-major-1` muss bei einer Änderung
dieser Reihenfolge versioniert werden; feste Testvektoren sichern sie ab.

Ergebnis `selected` enthält die Route, ihren Ortsverweis und den bestehenden
v2-Instanzfingerprint. `not-found` beweist nach vollständigem Durchlauf, dass der
Index außerhalb der Routenmenge liegt; `unknown` besagt Budgeterschöpfung.
Der Helfer verlangt eine gültige Sechsschrittlogik und einen zulässigen Start.
Er wird während B1 **nicht automatisch aufgerufen**.

Es werden weder alle Routen gespeichert noch globale Solvercaches eingeführt.
Ein späterer gezielter Abruf durchläuft den vorhandenen Generator erneut und
weist seinen Aufwand aus. B2 kann die zurückgegebene Route innerhalb seiner
Hinweissuche weiterverwenden. Mehrere Hinweiskombinationen binden dieselbe Instanz;
deren Variantenidentitäten kann weiterhin `logicalFingerprints()` bestimmen.

B2 ergänzt einen eigenen privaten Ergebnisstrom mit Strategiekennung,
Kandidatenbudget, erfolgreichen Kandidaten und aggregierten Fehlschlägen. Die
B1-Karten-/Startversuche und Zielinstanzen liefern dafür die Bezugsschlüssel.
Das produktive Rätselschema, Regeln und Solver bleiben unverändert. B1 führt
keine noch unbenutzten Strategieplugins, Hinweisdaten oder Schwierigkeitsfelder ein.

## Tests und Beispiellauf

```sh
node --test tests/contracts/route-experiment.test.mjs
npm run test:unit
npm run test:content
npm run test:puzzles
```

Der kleine Beispiellauf und seine genaue Reproduktion stehen in
[B1-example.md](verification/B1-example.md). Der dortige vorgelagerte Kartenbatch
wird einmal ausdrücklich mit dem bestehenden Generator erzeugt und abgeschlossen;
der eigentliche B1-Lauf liest ausschließlich diesen unveränderten Batch.
