# S03-v2 – identische Rohkandidaten, faire Diagnoseverteilung

v2 verwendet die 80 vollständig materialisierten v1-Kandidaten. Es erzeugt keine
neuen Karten, Zielrouten, Hinweise oder Suchkandidaten. Der vorab gespeicherte
Round-robin-Plan verteilt höchstens 40 Diagnosen über alle geeigneten Karten;
Qualitätskriterien, lokale Regeln und Serienauswahl bleiben unverändert.

- [Vorab festgelegter Vertrag v2](contract.md)
- [Reproduzierbarer Bericht und Vergleich](run/report.md) – Diagnoseinformationen
- [Strikt lösungsfreie Übersicht](../../S03-PLAYTEST.md)
- [v1-Vertrag und unveränderte Artefakte](../S03/contract.md)

`run/manifest.json` bindet Programm, Node, main-Formatter, Konfiguration und den
vollständigen v1-Quellsnapshot. `source-candidates.jsonl` enthält die unveränderten
logischen Kandidaten mit zusätzlichen v2- und expliziten v1-Quellidentitäten.
`plan.json` entsteht vor der ersten lokalen Diagnose. `diagnoses.jsonl` protokolliert
die Ausführung; `raw.jsonl` führt sämtliche Dispositionen einschließlich unbewerteter
Kandidaten. `summary.json` vergleicht Abdeckung, Ausbeute und Vielfalt mit v1.
`evidence/` enthält gehashte exakte Mengen und lokale Zertifikate. Zeiten und
Ressourcen liegen separat in `observations.json`.

Die Registry und `candidates.jsonl` binden ausschließlich die endgültige Auswahl.
`public-export.json` hält die Hashes der tatsächlich geprüften öffentlichen
Exportbytes mit dem freigegebenen Formatter fest; private Belege werden nicht in
die öffentlichen DTOs übernommen. Der übliche Entwicklungsaufruf
`npm run dev:b2:s03` verwendet jetzt ausdrücklich **S03-V2**. v1 bleibt technisches
Archiv und wird nicht als neue menschliche Testserie angeboten.

## Reproduktion und Prüfung

```sh
npm run test:s03:v2:evidence
npm run test:s03:v2:reproduction
```

Die Evidenzprüfung liest die Artefakte, prüft Quellen, Budgetverteilung, Beweise,
Auswahl und tatsächlichen Export erneut. Der Replay benutzt die genaue
Node-Version und einen temporären Checkout des ursprünglichen v2-Programmcommits;
alle deterministischen Dateien müssen bytegleich sein. Nur die beobachteten
Hardwarezeiten werden nicht verglichen. v1 besitzt weiterhin seinen separaten,
unveränderten Replay. Diese Prüfungen erzeugen keinen neuen Kandidatenbestand.

Der einmalige Pilotaufruf lautet `node scripts/run-s03-v2-pilot.mjs NEW_OUT`.
Keine Seed-/Budgetüberschreibungen, kein vorhandenes Ausgabeverzeichnis, kein
Wiederanlauf. Der Elternprozess erzwingt 120 Sekunden einschließlich Vorbereitung.
Abgebrochene Ausgaben mit `ABORTED.json` sind nicht exportierbar.

Die Signale sind experimentell: Zertifikatsnachfolger sind keine menschliche
Denktiefe, unterschiedliche Signaturen garantieren keine erlebte Abwechslung.
Unbekannte Teilmengen und nicht untersuchte Kandidaten bleiben ausdrücklich
unbekannt. Menschliche Tests erfordern nach technischer Abnahme eine Freigabe;
keine automatische Veröffentlichung, Zusammenführung oder Tagesbetriebsänderung.
