# B1: kleiner reproduzierbarer Beispiellauf

[Format und CLI](../ROUTE-EXPERIMENT-B1.md) · [Messdaten und Dateihashes](B1-example.json)

Gemessener B1-Programmcommit: `644cd74` (vollständige SHA in den Messdaten).
Node: **v24.19.0**. Die folgenden Nachweisdateien ändern keine Programmfunktion.
Die Eingabedaten wurden einmal mit dem bestehenden Generator am unveränderten
`main` nach PR #91 (`b7b72a7`) erzeugt und vor B1 vollständig abgeschlossen.
Ein vorhandener vollständiger Rohbatch war in der Arbeitsumgebung nicht abgelegt.

## Beobachtete Ergebnisse

| Messung | Budget 100.000 Knoten je Start | Budget 1 Knoten je Start |
| --- | ---: | ---: |
| Übernommene Karten | 12 | 12 |
| Zulässige Starts | 25 | 25 |
| Karten ohne Start | 3 | 3 |
| Karten mit nachgewiesenen Routen | 9 | 0 |
| Karten mit ungeklärtem Routenpotenzial | 0 | 9 |
| Routenzahl-Untergrenze | **41.607, exakt** | **0, nicht exakt** |
| Unvollständige Startzählungen | 0 | 25 |
| Besuchte Suchknoten | 61.957 | 25 |

Alle 25 Startpunkte besaßen im vollständigen Lauf mindestens eine Sechsschrittroute.
In dieser Stichprobe trat kein Start mit nachgewiesen null Routen auf; separate
Regressionstests prüfen sowohl den Komponentengrößenbeweis als auch vollständige
Enumeration ohne Route. Es werden keine geografischen Zusammenhänge aus dieser
kleinen Stichprobe abgeleitet und keine Rätselkandidaten erzeugt.

Der vorgelagerte Kartenbatch erreichte 12 Ergebnisse aus 16 äußeren Versuchen:
vier Packungsfehlschläge, ein innerer Versuch je Seed, keine Eignungsfilter.
Die drei leeren Karten sind gleiche Karteninhalte an verschiedenen Ergebnisindizes;
B1 behält sie als drei Beobachtungen. Der B1-Lauf erhöhte keine Budgets, ersetzte
keine Karte und änderte keine der vier Quelldateien.

Ein zweiter vollständiger B1-Lauf in einem anderen Ausgabeverzeichnis lieferte
**bytegleiche** `manifest.json`, `maps.jsonl` und `summary.json`. Die Messdatei
enthält deren SHA-256, die Eingangshashes, Einzelzählungen je Karte/Start und einen
tatsächlich abgerufenen Zielroutenfall für die B2-Schnittstelle.

## Exakte Reproduktion

Für dieselben Datei-/Versuchsidentitäten Node v24.19.0 und die aufgezeichneten
Programmcommits verwenden. Andere Programm-/Node-Stände werden ausdrücklich als
andere Provenienz erfasst. Ein aktueller Lauf kann direkt mit dem aktuellen
sauberen Featurecheckout ausgeführt werden.

Die temporären Verzeichnisse dürfen noch nicht existieren. Die erste Hälfte ist
eine **ausdrückliche separate Vorbereitung** des Beispieleingangs, kein Teil von B1:

```sh
git worktree add --detach /tmp/gk-b1-map-source b7b72a7f3f9ee61c792ce347b5092b25ca24f168
cat > /tmp/gk-b1-config.json <<'JSON'
{"objectCount":{"min":0,"max":7},"maxMapAttempts":1,"filters":{"routeSteps":[],"minLargestComponent":0}}
JSON
node /tmp/gk-b1-map-source/scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 --target-count 12 --max-attempts 40 \
  --seed-start 0 --assignment-seed-start 100000 \
  --config /tmp/gk-b1-config.json --out /tmp/gk-b1-input
```

Anschließend den fertigen Eingang mit dem aufgezeichneten B1-Programm lesen:

```sh
git worktree add --detach /tmp/gk-b1-program 644cd74
node /tmp/gk-b1-program/scripts/run-route-experiment.mjs \
  --batch /tmp/gk-b1-input --accepted-indices all \
  --max-nodes-per-start 100000 --out /tmp/gk-b1-exact
node /tmp/gk-b1-program/scripts/run-route-experiment.mjs \
  --batch /tmp/gk-b1-input --accepted-indices all \
  --max-nodes-per-start 1 --out /tmp/gk-b1-limited
node /tmp/gk-b1-program/scripts/run-route-experiment.mjs \
  --batch /tmp/gk-b1-input --accepted-indices all \
  --max-nodes-per-start 100000 --out /tmp/gk-b1-repeat
cmp /tmp/gk-b1-exact/manifest.json /tmp/gk-b1-repeat/manifest.json
cmp /tmp/gk-b1-exact/maps.jsonl /tmp/gk-b1-repeat/maps.jsonl
cmp /tmp/gk-b1-exact/summary.json /tmp/gk-b1-repeat/summary.json
```

Die vollständigen Quell-/Ergebnisdaten werden hier nicht als zweiter Kartenbestand
eingecheckt. Ihre Erzeugungsparameter, unveränderten Quellidentitäten, Hashes und
fachlichen Messergebnisse sind in der begleitenden JSON-Datei nachvollziehbar.
