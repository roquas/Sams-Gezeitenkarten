# PR #115 — gezielte Nachreview R1/R2

Vergleichen Sie den **im PR vollständig genannten neuen Head** ausschließlich mit
`617d84a6427de849a9c4c5861abc39c2614f2306`. Die vorherige unabhängige Prüfung
der Normalisierungsregeln, Solverbudgets, Integration und Spieltexte bleibt
maßgeblich. Kein Mergeauftrag.

1. Ist `verifyCandidateOrigins` vor den Solverprüfungen zwingend? Stammen Politik,
   Status und Inventar aus einem unabhängig bestätigten Vertrag? Scheitern
   Entfernen/`null` von `normalization`, Entfernen aller neuen Felder sowie ein
   konsistenter Status-/Versionsdowngrade, ohne alte gültige Zeilen abzulehnen?
2. Hasht `rawClueOrigin` ursprüngliche IDs und Parameter gemeinsam und
   reihenfolgeunabhängig? Gegen H2→`FORGED-ORIGIN` einschließlich Referenzen und
   selbst neu berechnetem Rohhash prüfen. Bleibt `logicalFingerprints` bytegleich?
3. Prüfen Sie den festen Git-Rohsatz und den unabhängig erwarteten Vertragsdigest.
   Könnten Kandidat und Belegdatei gemeinsam geändert werden, ohne diesen Anker
   zu ändern? Unterscheiden Dokumentation und API den echten Anker von bloßer
   Selbstkonsistenz? Die Grenzen stehen in [provenance-contract.md](provenance-contract.md).
4. Ist der separate Live-Erzeugerbeleg vor dem veränderbaren Evaluation-Callback
   kopiert? Werden die bestehenden eingefrorenen Einstiegspunkte ausdrücklich
   im Altvertrag geprüft, ohne historisches Material umzuschreiben?
5. Die 40 gezielten Tests und Reproduktionen aus der Vertragsdokumentation
   ausführen. Die 37 S04-A-Dateien und die historischen S03-Bytes müssen gleich
   bleiben. Für die Nachreview ist kein Generatorlauf erforderlich.

Die ursprünglichen drei Manipulationsproben mit dem vollständigen Vertrag:

```js
import {referenceOriginContext} from './scripts/report-count-clue-normalization.mjs';
// reference wie im ursprünglichen Review aus evidence.json laden;
// jede Probe unverändert in ihre temporäre JSONL-Datei schreiben.
verifyCandidates(file, referenceOriginContext());
```

Die Positivprobe muss bestehen; alle drei beschädigten Proben müssen werfen.
Für eine reine CLI-Prüfung nach Extraktion des Kandidaten:

```sh
node scripts/verify-puzzle-experiment.mjs candidate.jsonl \
  --origin-contract docs/verification/S04-B/origin-contract.json \
  --expect-origin-contract-sha256 334e17e2ade76e7bb8032d4b4ee00f05bd9fd8a4443747e6c983a88fc57b6b6c
```

Den erwarteten Digest aus dieser geprüften Fassung übernehmen, nicht aus einer
gemeinsam mit dem Kandidaten möglicherweise veränderten Datei neu berechnen.
