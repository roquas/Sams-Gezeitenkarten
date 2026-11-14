# S03 v1 – Qualitätsgesteuerter Offline-Pilot

Vertrag und Implementierung bilden ein begrenztes Experiment. Maschinelle Auswahl
ist keine menschliche Bestätigung von Schwierigkeit, Spielspaß oder Abwechslung.
Der Tagesrätselbetrieb und historische Bestände werden nicht verändert.

- [Vorab festgelegter Architektur- und Auswahlvertrag](contract.md)
- [Auswertung, Grenzen und Abnahme](pilot-assessment.md) – enthält Diagnoseinformationen
- [Technischer Pilotbericht](run/report.md) – enthält Diagnoseinformationen
- [Lösungsfreie Spieltestübersicht](../../S03-PLAYTEST.md)
- `run/manifest.json`: Programmcommit, Node, Konfiguration, Vertrag und Quellhashes
- `run/attempts.jsonl`: alle Ziele, Vorfilter, Geometrie und Suchkosten
- `run/raw.jsonl`: alle unterschiedlichen mathematisch gültigen Rohkandidaten,
  experimentelle Ablehnungen und verbrauchtes Diagnosebudget
- `run/finalists.jsonl`: alle unabhängig verifizierten Finalisten
- `run/candidates.jsonl` und `run/registry.json`: ausschließlich die feste Auswahl
- `run/evidence/`: gebundene Definitionen, exakte Mengen und lokale Beweisgraphen
- `run/summary.json`: Vielfalt, Auswahlentscheidungen und nicht erreichte Ziele
- `run/observations.json`: beobachtete Laufzeiten/Ressourcen, keine deterministischen
  Auswahlparameter

## Reproduktion und read-only Prüfungen

Die genaue Node-Version steht im Manifest. Replay benutzt einen separaten,
sauberen Checkout des dort aufgezeichneten **Programmcommits**. Es erzeugt nur
noch einmal dasselbe eingefrorene Experiment, keinen neuen Bestand, und vergleicht
alle deterministischen Dateien einschließlich der Auswahl byteweise.

```sh
npm run test:s03:evidence
npm run test:s03:reproduction
```

Der einmalige ursprüngliche Lauf verwendet `node scripts/run-s03-pilot.mjs OUT`
mit noch nicht existierendem OUT. Die CLI hat keine Seed-, Budget- oder
Qualitätsüberschreibungen. Der Elternprozess erzwingt den 600-Sekunden-Watchdog.
Ein abgebrochener Ordner enthält `ABORTED.json` und ist kein exportierbarer Bestand.
Kein Wiederanlauf oder Nachfüllen gehört zu v1.

Die historischen POSITIVE/V2-Berichte enthalten den ursprünglichen Quellhash des
Hinweisproduzenten. Der optionale S03-Parametervertrag verändert diesen heutigen
Quellhash. Die Regression prüft deshalb den historischen Hash gegen den damaligen
Git-Stand und den aktuellen Hash gegen die aktuelle Datei; alle übrigen
Berichtsbytes, öffentlichen Exporte, mathematischen Ergebnisse und Beweisgraphen
müssen unverändert übereinstimmen. Alte Evidenzdateien werden nicht umgeschrieben.

## Grenzen

Die Geografie stammt aus dem freigegebenen S02-Batch, die Zielrouten und
Hinweissätze werden neu gesucht. S03 untersucht damit Hinweis-/Routenwahl auf
vorhandenen Karten, keine optimierte geografische Kartenerzeugung. Die Stichprobe
hat eine Start-/Kartenreihenfolge und ist nicht repräsentativ.

Baselineprojektionen erkennen globale, rein geometrische Vorfestlegungen und
Einzelhinweisprojektionen starke Anker. Sie erklären allein keine menschliche
Leichtigkeit. Lokale Regeln erfassen unter anderem Nachbarunterstützung,
Distanzpaare und Wiederbesuchsverbote, aber keine vollständige globale
Weglängenarithmetik oder höherstufige Routenkopplung. Profile speichern nur die
untersuchten Teilmengen und bekannte ausreichende Zertifikate. Quellen und
Beweisstatus werden übernommen, fehlende Teilmengen bleiben unbekannt.

Die Auswahl fördert neue beobachtete Merkmale und begrenzt gleiche Signaturen.
Es gibt keine validierte Schwierigkeitsskala, Mechanismusquote oder Garantie,
dass sich ausgewählte Rätsel für Menschen unterschiedlich anfühlen. Insbesondere
können geometrische Abschlüsse und wenig befriedigende lokale Auflösungen bleiben.
Zugänglichkeit, Belastung, auffindbare Wiederverwendung und Freude müssen die
anschließenden menschlichen Spieltests bewerten.
