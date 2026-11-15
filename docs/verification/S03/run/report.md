# S03 v1 – technischer Pilotbericht (enthält Diagnoseinformationen)

Experiment: `gk-s03-run-sha256:7029ae823102e6f9d2bc07a063d2d61a59f45021cf6f13ed642e30059e2dae55`. Status: completed.

20 Zielversuche; 80 reduzierte Sätze; 80 unterschiedliche gültige Rohkandidaten.
24 Diagnosen mit 705 Teilmengenzuständen; 5 Finalisten unabhängig geprüft; 4 ausgewählt.

## Ablehnungen und Kosten

Kandidatenfilter: `{"LOCAL_REMAINDER":19,"CLUE_COUNT":8,"DIAGNOSIS_BUDGET_EXHAUSTED":48}`.

Suchabbrüche/Wiederholungen: `{"NO_PROGRESS":3411,"LOCAL_REMAINDER":19,"CLUE_COUNT":8,"RESTART_BUDGET_EXHAUSTED":20,"DIAGNOSIS_BUDGET_EXHAUSTED":48}`.

Suchkosten: `{"restarts":80,"solverChecks":5343,"matchEvaluations":3759673,"routeFilterEvaluations":9838193}`.

Jeder Zielversuch einschließlich Vorfilter und Topologie steht in attempts.jsonl. Alle unterschiedlichen Rohkandidaten und Entscheidungen stehen in raw.jsonl. Wiederholte reduzierte Sätze werden in Suchzählern erfasst. Laufzeit, Speicher und einzelne Diagnosekosten: observations.json.

## Auswahl und Vielfalt

| Kennung | Hinweise |
| --- | ---: |
| B2-S03-M001-A3-R751-V01 | 6 |
| B2-S03-M002-A1-R532-V03 | 3 |
| B2-S03-M003-A5-R436-V02 | 5 |
| B2-S03-M004-A1-R347-V03 | 4 |

4 Karten, 4 unterschiedliche Verlaufssignaturen.

Die einzelnen Signale, Merkmalszuwächse und nicht ausgewählten Finalisten stehen in summary.json. Lokale Beweise sind in gehashten evidence/*.states.jsonl gespeichert; exakte Mengen sind keine lokalen Begründungen. Unbekannte Teilmengen bleiben ausdrücklich unbekannt.

## Nicht nachgewiesen

- Only 4 of up to ten selected
- Human enjoyment, difficulty and series variety remain untested.

Die Baseline-/Dominanzfilter vermeiden bestimmte extreme Vorfestlegungen; sie beweisen keinen höheren Spielspaß. Höhere Routenkorrelationen, menschliche Entdeckbarkeit und tatsächliche Abwechslung bleiben offen. Keine nachträgliche Lockerung und keine zusätzliche Generierung.
