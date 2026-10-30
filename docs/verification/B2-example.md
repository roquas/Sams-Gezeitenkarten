# B2: reproduzierbarer Beispiellauf

[Strategie, Budgets und Format](../PUZZLE-EXPERIMENT-B2.md) ·
[Messdaten und Dateihashes](B2-example/measurements.json) ·
[Vollständige Kandidaten](B2-example/run/candidates.jsonl)

Programm: `f30cf2698600197b651e6919c2872322659b2710`, Node **v24.19.0**.
Die Ergebnisdateien und dieser Bericht wurden anschließend als reine Nachweise
ergänzt. Kein produktives Rätseldokument wurde geändert.

## Eingangsbestand

Verwendet werden die ersten vier Karten (Ergebnisindizes `0,1,2,3`) des bereits in
[B1 dokumentierten ungefilterten Beispieleingangs](B1-example.md). Da der originale
temporäre Rohbatch hier nicht vorlag, wurde er separat mit demselben Programm
`b7b72a7`, denselben Parametern und Seeds wiederhergestellt: zwölf akzeptierte Karten
aus 16 Versuchen, keine Eignungsfilter, keine Ersetzung aufgrund geografischer Güte.
Alle vier Dateihashes stimmen mit dem ursprünglichen B1-Beispiel überein.
Danach erzeugte der unveränderte B1-Mergestand `948b29e` einen abgeschlossenen Lauf
über diese feste Auswahl. Der [vollständige B1-Eingang](B2-example/b1/manifest.json)
ist zusammen mit `maps.jsonl` und `summary.json` hier gespeichert. B2 erzeugt selbst
keine Karten und verändert diesen Bestand nicht.

Die Auswahl enthält vier Karten, darunter eine Karte ohne Start, acht zulässige
Starts und **11.315 exakt gezählte Sechsschrittrouten**. B2 fordert je Start die
Indizes **0 und 25** in der vorhandenen Engine-Reihenfolge an. Das ist eine feste
Ordinalstichprobe, keine repräsentative Zufallsauswahl aller Routen.

## Ergebnis

| Messung | Ergebnis |
| --- | ---: |
| Untersuchte Karten / Starts / Zielrouten | 4 / 8 / 16 |
| Karten ohne zulässigen Start, vollständig erhalten | 1 |
| Vollständig gespeicherte und global verschiedene Kandidaten | **96** |
| Irredundante Varianten je Zielroute | **jeweils 6** |
| Wahre Hinweiskandidaten über alle Zielrouten | 17.312 |
| Untersuchte Hinweisparameter | 76.512 |
| Randomisierte Aufbausuchen | 96 |
| Solverprüfungen verschiedener Kombinationen | 5.529 |
| Wiederverwendete Kombinationsprüfungen | 301 |
| Prädikataufrufe für Treffervektoren | 5.151.269 |
| Gelesene Treffervektorwerte | 12.289.180 |
| B2-Enumerationsknoten / B1-Zielabrufknoten | 16.935 / 397 |

Alle Kandidaten wurden zusätzlich durch `checkIrredundancy({…}, {detailed:true})`
mit der bestehenden Engine geprüft: **96 eindeutig, Zielroute passend, irredundant**.
Die exakten Auslassungszähler stimmen mit den gespeicherten Nachweisen überein.
Eine zweite vollständige Ausführung erzeugte bytegleiche `manifest.json`,
`attempts.jsonl`, `candidates.jsonl` und `summary.json`. Die B1-Dateien blieben unverändert.

Die Suche erreichte bei allen 16 Zielrouten ihr Neustartbudget. Damit ist die
Kombinationssuche überall **budgetbedingt unvollständig**, obwohl sie erfolgreich
war. Es gab keine erschöpfte Routenenumeration und keine unvollständige
Hinweisproduktion. Der Vollständigkeitsstatus behauptet keine Enumeration aller
möglichen Kombinationen.

## Hinweisarten und redaktionelle Beobachtungen

Die 96 Sätze enthalten insgesamt 385 Hinweise, je Kandidat zwei bis acht:

| Hinweisart | Anzahl in erfolgreichen Kandidaten |
| --- | ---: |
| `countDistanceToPlace` | 308 |
| `distanceToPlace` | 20 |
| `position` | 17 |
| `turn` | 16 |
| `distanceBetweenHours` | 13 |
| `direction` | 11 |

53 Kandidaten verwenden nur eine Hinweisart; fünf verwenden vier Arten. Zählhinweise
stellen einen großen Teil des endlichen Pools und dominieren entsprechend die
gleichmäßig gemischten Hinweislisten. Das ist eine beobachtete Eigenschaft der
Baseline, kein Qualitätsurteil und keine Empfehlung, diese Verteilung festzuschreiben.

39 Hinweise sind für mindestens eine Stunde 1–6 individuell exakt. Vier Kandidaten
haben mehr als einen solchen Hinweis; 28 bestimmen Stunde 1 mit einem einzelnen
Hinweis, einer verwendet einen Richtungshinweis für Stunde 1. Diese Ergebnisse
wurden nicht redaktionell abgelehnt. Insbesondere bei einem Zählhinweis kann sich
individuelle Exaktheit auf eine aus dem Intervall ableitbare Stunde beziehen.

## Aufwand und erfolglose Schritte

Der gemessene Lauf benötigte **11.352 ms**: Eingangsprüfung 97 ms, Enumeration
105 ms, Zielabrufe 11 ms, Hinweisproduktion 1.231 ms und Suche 9.902 ms.
Die separat gespeicherten Zeitwerte sind Beobachtungen eines einzelnen Cloudlaufs;
gleichzeitig liefen bestehende Regressionstests. Sie sind kein stabiler Benchmark
und gehören nicht zur reproduzierbaren Experimentidentität.

Die häufigsten Diagnosegründe waren:

- **3.324 `NO_PROGRESS`**: Ein ergänzter Hinweis entfernte keine weitere Route;
  diese Hinweise wurden nicht in den Satz übernommen.
- **16 `RESTART_BUDGET_EXHAUSTED`**: Nach jeweils sechs erfolgreichen Neustarts
  wurde nicht nach weiteren Kombinationen gesucht.
- **1 `NO_ELIGIBLE_START`**: Die leere Eingangskarte hat nachweislich keinen Start.

Im normalen Beispiel trat kein erfolgloser Zielversuch auf. Separat ist ein
[Kontrolllauf mit nur einem Enumerationsknoten je Start](B2-example/exhausted/summary.json)
gespeichert: acht `unknown`-Starts, null Zielrouten und null Kandidaten. Es wird
keine Routenlosigkeit behauptet. Tests sichern zusätzlich einen unzureichenden
Hinweispool, fehlende Zielindizes und jedes weitere Suchbudget ab.

Der Vergleich mit dem bisherigen Solver nutzt den ersten Start mit **1.760 Routen**:

| Gleiche Prüfungen, exakte Zähler geprüft | Bisheriger Solver | B2 einschließlich Workspace |
| --- | ---: | ---: |
| Sechs unterschiedliche erfolgreiche Hinweissätze | 300 ms | 81 ms |
| Dieselben sechs Sätze insgesamt 24-mal | 992 ms | 141 ms |

Die zweite Messung verwendet sechs neue und 18 gespeicherte Kombinationsprüfungen.
Beide B2-Messungen benötigen nur eine Enumeration und 29.920 Prädikataufrufe.
Das stützt die einfache lokale Wiederverwendung. Es begründet keinen größeren
Umbau des bisherigen Solvers; die Beispielmessungen sind keine allgemeine
Geschwindigkeitsgarantie.

## Konkrete Beispiele

Die folgenden Dateien enthalten jeweils die gesamte Logikdefinition mit Karte,
Start, Lösung, Hinweisparametern, Herkunft, Motivbelegung und allen Nachweisen:

1. [Drei Hinweise, ausschließlich kombinierte Schlussfolgerungen](B2-example/examples/01-combined-deductions.json):
   Start A3, Ziel `A3 → A2 → A1 → B1 → C1 → D1 → E1`. Zwei Zählhinweise und ein
   Abstandshinweis; kein einzelner Hinweis bestimmt eine Stunde individuell exakt.
2. [Andere irredundante Kombination derselben Zielroute](B2-example/examples/02-same-target-alternative.json):
   zwei Zählhinweise; einer bestimmt Stunde 1 individuell exakt. Die Variante bleibt
   als eigenständiges Rätsel erhalten.
3. [Kandidat mit Richtungshinweis für Stunde 1](B2-example/examples/03-direction-hour-one.json):
   Start A1, sechs Hinweise aus vier Arten. Die redaktionelle Abweichung wird
   gemessen und führt nicht zum Ausschluss.

Diese privaten Definitionen enthalten keine neu erfundenen Hinweistexte und sind
keine veröffentlichten Spielpakete.

## Reproduktion aus dem gespeicherten B1-Bestand

Im vollständigen Repositorycheckout mit Node v24.19.0; die temporären Zielpfade
dürfen noch nicht existieren. Der gepinnte Programmcheckout ist für dieselben IDs
notwendig. Ein aktueller sauberer Checkout erzeugt ausdrücklich andere Programmprovenienz.

```sh
git worktree add --detach /tmp/gk-b2-program f30cf2698600197b651e6919c2872322659b2710
node /tmp/gk-b2-program/scripts/run-puzzle-experiment.mjs \
  --b1 "$PWD/docs/verification/B2-example/b1" --out /tmp/gk-b2-reproduced \
  --seed 42 --route-indices 0,25 \
  --max-nodes-per-start 100000 --max-clue-parameters 100000 \
  --max-restarts 6 --max-solver-checks 2000 \
  --max-match-evaluations 5000000 --max-route-filter-evaluations 20000000
cmp docs/verification/B2-example/run/manifest.json /tmp/gk-b2-reproduced/manifest.json
cmp docs/verification/B2-example/run/attempts.jsonl /tmp/gk-b2-reproduced/attempts.jsonl
cmp docs/verification/B2-example/run/candidates.jsonl /tmp/gk-b2-reproduced/candidates.jsonl
cmp docs/verification/B2-example/run/summary.json /tmp/gk-b2-reproduced/summary.json
node scripts/verify-puzzle-experiment.mjs /tmp/gk-b2-reproduced/candidates.jsonl
node scripts/benchmark-puzzle-solver.mjs /tmp/gk-b2-reproduced/candidates.jsonl 6
node scripts/benchmark-puzzle-solver.mjs /tmp/gk-b2-reproduced/candidates.jsonl 24
```

Für den Kontrolllauf denselben Befehl mit neuem Ausgabeverzeichnis und
`--max-nodes-per-start 1` ausführen. Auch hier müssen die vier fachlichen Dateien
mit dem gespeicherten Verzeichnis `B2-example/exhausted` übereinstimmen.

Wer auch den B1-Eingang neu herstellen möchte, führt die separate Kartenbatch-
Vorbereitung aus [B1-example.md](B1-example.md) mit denselben Seeds aus und liest
ihn anschließend mit B1-Programmcommit `948b29e`, `--accepted-indices 0,1,2,3`
und `--max-nodes-per-start 100000`. Die gespeicherten B1-Dateihashes dokumentieren
den genauen Übergabestand. Die alte B1-Experimentdatei oder produktive Rätsel
werden dabei nicht überschrieben.
