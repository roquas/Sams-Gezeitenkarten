# PR #93: Nachprüfung der beiden P2-Korrekturen

Geprüfter Ausgangsstand: `c74899a3ba11b7b36ffb4a8cfd95f1f434644816`.
Implementierung: `20c39f73cd83bed5ecb92795128a7b5ec48f8b6b`.
[Tatsächlicher Implementierungsdiff](https://github.com/roquas/Sams-Gezeitenkarten/compare/c74899a3ba11b7b36ffb4a8cfd95f1f434644816...20c39f73cd83bed5ecb92795128a7b5ec48f8b6b).
Der folgende Nachweiscommit aktualisiert ausschließlich die abgeleiteten
B2-Ergebnisse und Dokumentation. Kein Merge.

## P2-1: gleiche Einzelhinweiswirkungen

Die [feste Regressionstestfixture](../../tests/fixtures/generation/b2-effect-equivalence.json)
enthält die vollständigen Logikdefinitionen der ursprünglichen Zeilen **73 und 77**,
deren ursprüngliche Fingerprints, Seed und Budgets. Beide betreffen E1, Routenindex 0.
Eine unabhängige Enumeration bestätigt **821 legale Routen** und identische Mengen
von Einzelhinweis-Treffervektoren trotz unterschiedlicher Parameterfingerprints.

Vor der Korrektur scheitert die gezielte Regression mit **5 verschiedenen
Wirkungskombinationen gegenüber 6 gespeicherten Kandidaten**. Nachher bleibt die
erste Repräsentation erhalten und die zweite wird mit `EQUIVALENT_CLUE_EFFECTS`
verworfen. Derselbe Seed und dieselben sechs Neustarts liefern fünf Kandidaten;
keine weitere Suche ersetzt das verworfene Ergebnis.

Der private `effectKey` enthält die sortierte Menge der gehashten **einzelnen**
Hinweis-Treffervektoren, gebunden an Karte, Start, Regelfassung, Etappen,
Routenreihenfolge und vollständige Routenmenge. Die Gesamt-Lösungsmenge wird nicht
als Deduplikationsschlüssel benutzt. Deshalb bleiben die anderen fünf Varianten
derselben Zielroute unterscheidbar. Der Schlüssel liest vorhandene Treffervektoren
und verbraucht keine zusätzlichen Solver- oder Hinweisprädikatprüfungen.

Bestehende Karten-, Instanz- und Variantenfingerprints wurden nicht geändert.
Alle 95 behalten exakt die Fingerprints des Ausgangsbestands. Entfallen ist allein
der Parameterfingerprint der alten Zeile 77:
`gk-variant-v2-sha256:89744b02e2968fd478e761ab209fce716bb20210d8e29fcdca077b5bae9ddd59`.

## P2-2: Herkunft an Originalbytes prüfen

B2 verlangt jetzt zusätzlich `--batch <ursprünglicher Quellbatch>`. B1 enthält
dessen Dateihashes, aber nicht alle Quellbytes. Eine belastbare Hashprüfung ohne
diese Dateien wäre nicht möglich. Der Leser bleibt mit unveränderten gültigen
B1-Experimenten im Format 1 kompatibel, auch bei unvollständigen Routenzählungen
oder einem abgeschlossenen Quellbatch ohne akzeptierte Karten.

`readContactBatch()` übernimmt dieselbe Validierung wie B1: Quellmanifest,
gepinnter Release samt Herkunft, Seedplan, beide vollständigen Eingabeströme,
Motivbelegungen und Summen, einschließlich nicht ausgewählter Karten. Der B2-Leser
vergleicht die vier tatsächlichen Dateihashes mit B1 und bindet die eingebetteten
Manifeste/Summen sowie sämtliche B1-Karten, Ursprungsindizes, Seeds und Belegungen
an diesen geprüften Bestand. Alles geschieht vor der Ausgabereservierung und Suche.
Es gibt keine zweite Implementierung der Release- oder Zuordnungssemantik.

Der unveränderte [B1-Beispieleingang](B2-example/b1/manifest.json) ist weiterhin
derselbe wie am geprüften Head. Neu gespeichert sind die vier ursprünglichen
Quellbatchdateien mit exakt den bereits aufgezeichneten Hashes. B1-/Batch-/Release-
Verträge und produktive Daten wurden nicht verändert. Nur der private B2-Ausgabevertrag
steigt auf Format 2; CLI und Bibliotheksleser verwenden den asynchronen Batchleser.

Die Regressionstests weisen nicht existierende Release-/Motiv-IDs, Seed `-1`,
falsche Generatorseeds und Ursprungsindizes, veränderte eingebettete Seedpläne/
Summen sowie abweichende Originalbytes zurück. Weitere Fälle verändern den
**Quellbatch selbst** und binden alle B1-Hashes/-IDs neu: Auch dann lehnt die
bestehende Batch-/Releasevalidierung gefälschten Release, Seedplan und die
Motivbelegung einer unselektierten Karte ab. Die CLI-Tests bestätigen, dass dabei
kein Ausgabeverzeichnis reserviert wird.

## Vorher-/Nachher-Nachweis und Tests

Die neuen Testdateien wurden zunächst gegen einen getrennten Checkout von
`c74899a` ausgeführt. Der konkrete Wirkungsfall war rot; die Herkunftstests
meldeten unter anderem `Missing expected rejection` für Release, Motiv und
Zuordnungsseed. Beim Einführen der Herkunftstests waren **11 von 13 Fällen rot**;
die beiden gültigen Kontrollfälle waren grün. Der damalige Wirkungs-Teststand
hatte einen grünen Faktennachweis und zwei rote Korrekturprüfungen. Danach wurden
die Kompatibilitäts- und CLI-Kontrollen ergänzt.

Auf dem korrigierten Stand bestehen **3 Wirkungsregressionen und 16 Herkunftstests**
sowie die bisherigen zehn Generierungs- und fünf Experimenttests. Ausführen:

```sh
node --test tests/engine/puzzle-effect-equivalence.test.mjs \
  tests/contracts/puzzle-provenance.test.mjs \
  tests/engine/puzzle-generation.test.mjs tests/contracts/puzzle-experiment.test.mjs
npm run test:unit
npm run test:content
npm run test:puzzles
python3 tests/test_package.py
```

Die Gesamtprüfungen und der GitHub-CI-Stand werden im PR nach Abschluss festgehalten.

## Korrigierter Beispielbatch

[Reproduktionsanleitung und alle Messwerte](B2-example.md) ·
[vollständige Ergebnisse und Dateihashes](B2-example/measurements.json).

| Messung | Geprüfter Head | Korrigierter Lauf |
| --- | ---: | ---: |
| Karten / Starts / Zielrouten | 4 / 8 / 16 | 4 / 8 / 16 |
| Kandidaten | 96 Parameterfingerprints | **95 Wirkungsvarianten** |
| Varianten je Zielroute | 16 × 6 behauptet | **15 × 6, 1 × 5** |
| Neustarts insgesamt | 96 | **96** |
| `EQUIVALENT_CLUE_EFFECTS` | nicht erfasst | **1** |
| Solverprüfungen | 5.529 | **5.528** |
| Trefferprädikate | 5.151.269 | **5.151.269** |

Die vier fachlichen Dateien sind bei Wiederholung bytegleich, auch bei verschobenem
B1- und Quellbatchverzeichnis. Alle 95 Kandidaten wurden mit dem bisherigen
detaillierten Solver auf Eindeutigkeit, Zielkonformität und Irredundanz geprüft.
Die Wirkungsschlüssel wurden anhand vollständiger Engine-Routen unabhängig
nachgerechnet. Ein unverändert knapp budgetierter Kontrolllauf ergibt weiterhin
acht unbekannte Starts und null Kandidaten. Laufzeiten bleiben getrennte,
nicht deterministische Messwerte.
