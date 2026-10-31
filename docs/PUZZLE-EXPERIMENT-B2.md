# B2: experimentelle Rätselkandidaten

B2 liest einen abgeschlossenen [B1-Routenlauf](ROUTE-EXPERIMENT-B1.md).
Es erzeugt private, vollständig gespeicherte Sechsschritt-Rätselkandidaten.
Produktive Rätselschemas, Engine, Solver, Karten, Assets und GUI bleiben unverändert.
Es gibt keine Schwierigkeitswertung, geografische Vorauswahl oder Veröffentlichung.

## Durchlauf und Verantwortlichkeiten

1. `puzzle-experiment.mjs` liest alle B1-Dateien und zusätzlich den ursprünglichen
   Quellbatch (`--batch`). Dessen vier Dateihashes müssen exakt den B1-Eingabehashes
   entsprechen. Der vorhandene `readContactBatch()` prüft Manifest, Releaseherkunft,
   Seedplan, beide vollständigen Datenströme und sämtliche Motivbelegungen,
   einschließlich unselektierter Karten. B1-Quellmanifest/-Zusammenfassung sowie
   Karten, Ursprungsindizes, Seeds und Belegungen müssen mit diesem geprüften
   Bestand übereinstimmen. Anschließend werden Identitäten und B1-Routenanalyse
   mit dem ursprünglichen Budget reproduziert. Unvollständige B1-Zählungen bleiben
   zulässig; sie sind keine Nullroutenbeweise. Jede Prüfung erfolgt vor der Suche
   und vor der Reservierung des Ausgabeverzeichnisses.
2. Für jeden B1-Start enumeriert `puzzle-route-solver.mjs` die legalen Routen mit
   dem bestehenden `createRules().routes()`. Nur eine **vollständige** Enumeration
   darf Eindeutigkeit beweisen. Nachgewiesene B1-Nullfälle benötigen keinen neuen
   Durchlauf. Bei erschöpftem Budget wird der Start als `unknown` gespeichert.
3. `selectTargetRoute()` aus B1 holt die expliziten Routenindizes in Engine-Reihenfolge.
   Alle Starts und alle angegebenen Indizes werden unverändert untersucht. Diese
   Auswahl ist reproduzierbar, aber keine gleichverteilte Stichprobe der Routen.
4. `puzzle-clues.mjs` erzeugt ausschließlich gültige, wahre Parameterkombinationen
   der sechs bestehenden Hinweisarten. Wertebereiche und Enumerationen kommen
   aus `logicSchema`; Wahrheit entscheidet allein `createRules().matches()`.
   Sechs Parameterströme wechseln sich ab, damit ein kleines Produktionsbudget
   nicht zuerst eine große Hinweisfamilie vollständig verbraucht.
5. `puzzle-candidate-search.mjs` kombiniert Hinweise mithilfe des Solveradapters.
   Die Suchfunktion ist ein austauschbarer Funktionsparameter, kein Pluginframework.
   Eine andere Strategie muss eine eigene Kennung und entsprechend versionierte
   Experimentparameter erhalten. Der Solver erzeugt keine Hinweise.
6. Die Experimentkoordination schreibt vollständige Erfolge und aggregierte
   Diagnosen erfolgloser Suchschritte. Ein unerwarteter Fehler bricht den Lauf ab;
   ohne `summary.json` ist ein Ergebnisverzeichnis nicht abgeschlossen.

## Ausgangsstrategie `random-incremental-1`

Jeder Neustart mischt den ganzen wahren Hinweispool per Fisher–Yates. Verwendet
werden die vorhandenen Mulberry32-/FNV-Zufallsströme. Ein Hinweis wird nur dann
beibehalten, wenn seine Solverprüfung die aktuelle Zahl verbleibender Routen
verkleinert. Bei genau einer Route beginnt die Reduktion. Es werden keine
Hinweise nach vermeintlicher Stärke oder redaktioneller Qualität sortiert.

Die ausgewählten Hinweise werden in einer weiteren zufälligen Reihenfolge
**einzeln** zur Entfernung geprüft. Nach jeder Entfernung gilt der verringerte
Satz für die nächste Prüfung. Ein bereits notwendiger Hinweis kann durch weitere
Entfernungen nicht redundant werden. Abschließend werden sämtliche Auslassungen
erneut nachgewiesen. Andere Neustarts verwenden andere Aufbau- und Löschreihenfolgen.
Ein Erfolg beendet die Suche nicht; erst ein explizites Budget beendet sie.
Die Ausnahme ist eine bereits ohne Hinweise einzigartige Route: Nur der leere
Hinweissatz kann dann irredundant sein, und diese Suche ist vollständig.

Die bestehenden Instanz- und Variantenfingerprints bleiben unverändert. Zusätzlich
erhält jeder Kandidat einen privaten `effectKey` (`gk-b2-effects-v1-sha256`). Er bindet
Kartenfingerprint, Start, Regelfassung, sechs Etappen, Routenreihenfolge und den Hash
der **vollständig** enumerierten Routen. Für jeden einzelnen Hinweis wird sein
0/1-Treffervektor über genau diese Routen gehasht; die sortierte Menge dieser
Einzelhinweiswirkungen bildet den Kombinationsteil des Schlüssels. Hinweisreihenfolge,
IDs und unterschiedliche Parameter mit gleicher Wirkung erzeugen keine neue
Wirkungsvariante. Es wird ausdrücklich **nicht** die gemeinsame Lösungsmenge des
gesamten Satzes als Schlüssel verwendet.

Gleiche Parameterfingerprints oder gleiche Wirkungsschlüssel innerhalb eines
Zielversuchs werden verworfen. Die bereits erzeugte erste Repräsentation bleibt
erhalten. Das kostet keine zusätzlichen Solverprüfungen oder Prädikataufrufe:
Der Schlüssel verwendet die vollständigen vorhandenen Treffervektoren. Es gibt
keine weiteren Neustarts zum Ersatz verworfener Äquivalente. Identische Inhalte an
verschiedenen B1-Beobachtungen behalten ihre Herkunft; `uniqueCandidateCount`
zählt die global verschiedenen Wirkungsschlüssel, `candidateCount` die gespeicherten
Beobachtungen nach Deduplikation innerhalb der Zielversuche.

## Solverwiederverwendung und Nachweise

Eine Workspace enthält genau die vollständig enumerierten Routen eines Starts.
Pro Zielroute werden Treffervektoren für tatsächlich benutzte Hinweise bei Bedarf
mit dem bestehenden Prädikat berechnet. Weitere Kombinationen schneiden diese
Vektoren; ihr exakter Zähler und gegebenenfalls die einzigartige Route werden
nach kanonisch sortierten Hinweisindizes zwischengespeichert. Keine weitere
Routenenumeration je Kombination, keine eigene Hinweissemantik, kein globaler Cache.
Gespeichert werden Zähler statt vollständiger Trefferlisten jeder Kombination.

Jeder erfolgreiche Kandidat enthält genau eine Lösung, Übereinstimmung mit der
Zielroute und einen exakten Lösungszähler für jede einzelne Hinweisauslassung.
Jede Auslassung muss mindestens zwei Lösungen haben. Das gilt auch bei einem
späteren Budgetabbruch: Ein Kandidat wird erst nach allen Nachweisen und Messungen
gespeichert. Die unabhängige Kontrolle verwendet den bisherigen Solver:

```sh
node scripts/verify-puzzle-experiment.mjs /tmp/b2/candidates.jsonl
node scripts/benchmark-puzzle-solver.mjs /tmp/b2/candidates.jsonl 24
```

Der Benchmark vergleicht exakte Lösungszähler gleicher Kombinationen und misst
den bisherigen Solver gegen den Adapter einschließlich Workspaceaufbau. Er ist
eine Messung ohne Geschwindigkeits-Schwellenwert. Routen werden zwischen Zielrouten
eines Starts wiederverwendet, die Hinweisvektoren zwischen Zielrouten zunächst nicht.

## Explizite Budgets und CLI

Node 22+, vollständige Releasehistorie, sauber committete Dateien unter `src/` und
`scripts/`. Alle Optionen sind verpflichtend. Keine Ausgabe darf bereits existieren
oder innerhalb des B1-Eingangs oder Quellbatches liegen. Es gibt keine impliziten
Wiederholungen. Alte B1-Experimente im Format 1 bleiben unverändert verwendbar,
benötigen jetzt aber ihren ursprünglichen Quellbatch für die Herkunftsprüfung.
B1 speichert nur dessen Hashes; ohne Quellbytes kann B2 sie nicht verifizieren.

```sh
node scripts/run-puzzle-experiment.mjs \
  --b1 /tmp/b1 --batch /tmp/original-kartenbatch --out /tmp/b2 --seed 42 --route-indices 0,25 \
  --max-nodes-per-start 100000 --max-clue-parameters 100000 \
  --max-restarts 6 --max-solver-checks 2000 \
  --max-match-evaluations 5000000 --max-route-filter-evaluations 20000000
```

| Option | Geltung | Zulässiger Bereich |
| --- | --- | --- |
| `seed` | Gesamtlauf, daraus getrennte Ziel- und Neustartströme | uint32, einschließlich 0 |
| `route-indices` | Explizite, nullbasierte Liste je B1-Start | 1–100 verschiedene sichere nichtnegative Ganzzahlen |
| `max-nodes-per-start` | Vollständige Enumeration je Start; **zusätzlich dasselbe Budget je B1-Zielabruf** | 1–1.000.000 |
| `max-clue-parameters` | Untersuchte Parameterkombinationen je Zielroute, auch unwahre | 1–200.000 |
| `max-restarts` | Gemischte Aufbausuchen je Zielroute | 1–10.000 |
| `max-solver-checks` | Noch nicht gespeicherte Kombinationen einschließlich Nachweisen und Einzelhinweismessung je Zielroute | 1–100.000 |
| `max-match-evaluations` | Engine-Prädikataufrufe für Treffervektoren je Zielroute | 1–100.000.000 |
| `max-route-filter-evaluations` | Gelesene Vektorwerte beim Kombinieren je Zielroute | 1–100.000.000 |

Die Anzahl wahrer Hinweise ist zusätzlich durch den endlichen Parameterraum
begrenzt. Bereits geprüfte Kombinationen verbrauchen kein weiteres Solverbudget.
Die Einzelhinweismessung liest höchstens sechs Positionen je passender Route und
betroffenem Hinweis; diese Positionsvergleiche sind keine Prädikataufrufe.
Die Eingangsprüfung reproduziert B1 mit dessen eigenem, im Manifest aufgezeichneten
Budget. Sie wird getrennt von den neuen B2-Suchzählern gemessen.

## Privates Experimentformat `puzzleExperimentFormatVersion: 2`

Format 2 ergänzt den Wirkungsschlüssel und die Bindung an den vollständig
geprüften Quellbatch. Die Suchstrategie bleibt `random-incremental-1`, die
Suchbudgets bleiben unverändert. B1-, Batch-, Release- und produktive Rätselverträge
werden nicht geändert. Bibliotheksleser und CLI sind wegen des vorhandenen
asynchronen Batchlesers ebenfalls asynchron (`await readB1Experiment(...)`,
`await runPuzzleExperiment(...)`).

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | Strategie, feste sechs Etappen, Routenindizes/-reihenfolge, Seed, sämtliche Budgets, Programmcommit/Node, B1-ID, drei B1-Dateihashes, vier geprüfte Quellbatchdateihashes und unverändertes B1-Manifest |
| `attempts.jsonl` | Eine Beobachtung je B1-Karte, alle Starts, vollständige/unvollständige Enumeration, jeder Zielabruf, Zielroute und Instanz-ID, abgeleiteter Seed, Versuch-ID, Suchzähler, aggregierte Gründe und erfolgreiche Varianten-IDs |
| `candidates.jsonl` | Ein vollständiger privater Kandidat je Erfolg: Logikdefinition und Lösung, unveränderte logische Fingerprints, zusätzlicher Wirkungsschlüssel, geprüfte Herkunft/Motivbelegung, Strategie/Seed/Budgets, Eindeutigkeits-/Irredundanznachweise und redaktionelle Messwerte |
| `summary.json` | Karten/Starts/Zielrouten, Kandidaten und global verschiedene Varianten, Varianten je Zielversuch, Hinweisarten, aggregierte Eigenschaften/Gründe, Suchaufwand und Unvollständigkeit |
| `timings.json` | Gemessene Millisekunden für Eingangsprüfung, Enumeration, Zielabrufe, Hinweisproduktion, Suche und Gesamtlauf |

Die ersten vier Dateien sind bei denselben Eingangsbytes, Parametern und Programm-/
Node-Ständen bytegleich. Laufzeiten sind ausdrücklich **keine** Identitätsbestandteile.
Run-/Zielversuch-IDs sind domänengetrennte SHA-256 der kanonischen Parameter;
bestehende B1-, Karten-, Instanz- und Variantenidentitäten werden nicht verändert.
Hinweisproduktion umfasst die gültigen Stunde-0- und Selbstabstandsparameter;
tautologische Hinweise scheitern gewöhnlich am solvergestützten Fortschrittskriterium.

Die gespeicherte `definition` ist eine private Logikdefinition, die direkt mit
`checkIrredundancy()` geprüft werden kann. Sie ist kein veröffentlichbares Dokument
mit ausformulierten Hinweistexten und Präsentationsmetadaten.

## Ergebnisstatus und Diagnose

- `impossible`: bewiesener fehlender Start, vollständig nachgewiesene Routenlosigkeit
  oder ein nach vollständiger Enumeration fehlender **angeforderter Routenindex**.
  Letzteres sagt nichts über andere Routen dieser Karte aus.
- `unknown`: unvollständige Routenenumeration oder Zielauswahl; keine Eindeutigkeit.
- `not-found-within-budget`: kein vollständig geprüfter Kandidat gefunden, **kein**
  Unmöglichkeitsbeweis, auch bei einem zu kleinen Hinweispool.
- `candidates-found`: mindestens ein vollständig nachgewiesener Kandidat. Die
  weitere Suche ist normalerweise trotzdem budgetbedingt unvollständig.

`status: completed` bestätigt nur die Verarbeitung aller Eingaben. Zusätzlich
`searchIncomplete`, `incompleteStarts`, `incompleteTargets` und je Ziel
`search.incomplete` beachten. `exhaustive` betrifft ausschließlich die Kombinationensuche.
`NO_PROGRESS` zählt verworfene, wirkungslose Ergänzungen; `POOL_NOT_UNIQUE` einen
Neustart ohne eindeutigen Satz; `DUPLICATE_VARIANT` einen wiedergefundenen
Parameterfingerprint; `EQUIVALENT_CLUE_EFFECTS` einen anderen Parameterfingerprint
mit gleicher Kombination von Einzelhinweiswirkungen.
Budgetgründe benennen Produktion, Enumeration, Solver, Treffervektoren, Filter
oder Neustarts. Ein Budgetgrund kann auch nach erfolgreichen Kandidaten auftreten.

## Redaktionelle Messwerte

### Abgeleitete Hinweisformen und Ortsreferenzen

`cluePresentationForm()` in `scripts/lib/clue-presentation.mjs` leitet aus
`countDistanceToPlace` die Formen `NotDistanceAt` (Einzelstunde, Anzahl 0),
`HasDistanceAt` (Einzelstunde, Anzahl 1) und `CountDistanceNever` (mehrere Stunden,
Anzahl 0) ab. Einzelstunden haben Vorrang. Andere Fälle behalten ihren logischen
Typ. Die gemeinsame Ableitung wird für No-Flavor-Texte und Statistik verwendet;
sie verändert weder Prädikate noch Fingerprints, `effectKey` oder Deduplikation.

Neue Statistikfelder sind additiv, ohne Formatwechsel:

- `summary.clueTypes` zählt weiterhin jeden gespeicherten Kandidatenhinweis einmal;
  `summary.cluePresentationForms` zählt dieselben Hinweise nach Darstellungsform.
- `summary.cluePool.byType` / `.byPresentationForm` zählen die wahren Hinweise
  aller untersuchten Zielpools, jeweils einmal pro Zielversuch, auch ohne Erfolg.
  Bei erschöpftem Parameterbudget zählt nur der tatsächlich untersuchte Teilpool.
- `starts[].targets[].cluePool` jeder Kartenzeile in `attempts.jsonl`
  enthält die beiden Histogramme sowie
  `parametersExamined` und `completed` für den einzelnen Zielversuch.
- `candidate.properties.cluePresentationForms` enthält die verschiedenen Formen
  innerhalb eines Kandidaten, parallel zu den bestehenden `clueTypes`.

Pools werden über Zielversuche summiert; Kandidaten über tatsächlich gespeicherte
Zeilen nach Wirkungsdeduplikation. Diese beiden Populationen werden nicht vermischt.
`clueStatistics(clues)` berechnet beide Histogramme auch aus historischen Zeilen
ohne neue Felder. Die S01-Auswertung ist ohne Dateischreibzugriff verfügbar:

```sh
npm run inspect:b2 -- --statistics
```

Sie ergibt 306 logische Zählhinweise: 210 normale, 57 `CountDistanceNever`,
23 `HasDistanceAt`, 16 `NotDistanceAt`. Die Summe aller Formen entspricht der
Summe aller logischen Hinweise, auch bei mehreren Formen im selben Kandidaten.

Die neue Positionsenumeration verwendet alle tatsächlichen `object.cells` in
deterministischer Rasterreihenfolge, einschließlich Mehrhexobjekten und
befahrbaren Motiven. Freie See und reine Dekorationen gehören nicht zum Parameterraum.
Distanzhinweise bleiben unverändert an `map.objects` gebunden, auch für Distanz 0.
Der B2-Eingangsleser prüft vor Ausgabereservierung mit `validatePlacements()` die
Katalog-/Motivverträge und zusätzlich vollständige Objektillustrationen im
bereits releasegeprüften Quellbestand. Allgemeine Validatoren bleiben unverändert.

Die Route darf weiterhin über freie See verlaufen. Historische S01-Definitionen,
Testnamen, Fingerprints und Wirkungsnachweise bleiben erhalten und spielbar;
nur ihre abgeleiteten Texte ändern sich. Historische P2-Suchergebnisse werden
mit einem eingefrorenen alten Pool geprüft, getrennt von der neuen Produktion.
Diese Änderung erzeugt keinen S02-Bestand und keinen neuen Katalogrelease.

Für **jeden Hinweis allein** werden alle legalen Routen auf Übereinstimmung geprüft.
`individualExactness[].hours` enthält ausschließlich Stunden **1 bis 6**, für die
sämtliche Treffer dieselbe Position haben. Stunde 0 ist immer durch den Start
festgelegt und wird nicht mitgezählt. Gezählt werden Hinweise mit mindestens einer
solchen Stunde, außerdem Exaktheit für Stunde 1 und Richtungshinweise für Stunde 1.
Ein Hinweis kann dabei andere als seine ausdrücklich genannten Stunden bestimmen.
Erst zusammen bestimmte Positionen werden nicht als individuelle Exaktheit gezählt.
Diese Eigenschaften und die Hinweisartenvielfalt führen zu keiner Ablehnung.

## Grenzen und nächste Iteration

Die Baseline ist begrenzt und heuristisch; sie enumeriert nicht alle minimalen
Hinweissätze und behauptet keine optimale Schwierigkeit oder Qualität. Große
Familien, insbesondere Zählhinweise, haben entsprechend ihrem Anteil am Pool mehr
Gelegenheiten. Die rohe Verteilung ist somit keine Empfehlung für redaktionelle
Gewichte. Unterschiedliche gültige Parameter behalten ihre bestehenden
Variantenfingerprints; B2 zählt sie bei gleicher Einzelhinweiswirkung gemeinsam.

Nächste Schritte: gespeicherte Beispiele spielen, beobachtete Kombinationen und
Budgetabbrüche vergleichen, dann weitere Strategien mit derselben Schnittstelle
und denselben Budgets messen. Erst bei gemessenem Bedarf Treffervektoren zwischen
Zielrouten eines Starts teilen oder Bitvektoren erproben. Kein größerer Solverumbau
ist für diesen ersten Durchlauf erforderlich.

[Reproduzierbarer Beispiellauf, Messwerte und vollständige Beispiele](verification/B2-example.md)
