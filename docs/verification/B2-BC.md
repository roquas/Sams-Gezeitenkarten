# B2-BC: acht gespeicherte Varianten für qualitative Browser-Spieltests

Reproduzierbare redaktionelle Auswahl aus den 167 Kandidaten von PR #101. Keine Nachgenerierung, Änderung oder Umordnung der ursprünglichen Hinweise. Die Kriterien sind vorläufige Testhypothesen; weder Länge noch Routenzahlen beweisen spielerische Qualität. Keine neue Qualitätsmetrik oder Schwierigkeitseinstufung.

## Bindung und Kriterien

Quelle: [Suchvergleich](B2-search-comparison.md), Registry: [b2-playtest-bc.json](../../scripts/config/b2-playtest-bc.json).
Experiment: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849`.
Manifest SHA-256: `637550b0e953267b46d0e795240c0b1f9782556252cd6ec5d0bbd5001371028b`.
Kandidatenstrom SHA-256: `1984e96159b1aea61a1cc758903748ae7b40223a36463e181a47b2707511afbf` (167 unveränderte Zeilen).

- Genau vier Kandidaten je Sucharm B/C; pro Arm jede der vier gespeicherten Zielinstanzen einmal.
- Fünf bis sieben irredundante Hinweise; kein Einzelhinweis legt Stunde 1 exakt fest.
- Mehrere logische Typen und verschiedene Stunden; Einzelhinweise schränken nur teilweise ein, ausgewiesene Paare reduzieren zusätzlich.
- Fünfer- und Siebener-Sätze berücksichtigen; nicht nur Länge wählen. Flächige und punktuelle Ausschlüsse gesondert betrachten.
- Redaktionelle Testhypothesen, keine Schwierigkeitsskala, Qualitätsmetrik oder repräsentative Stichprobe.

Die Registry fixiert jede vollständige Kandidaten-ID, Fingerprints, Wirkungsschlüssel, Inhalts- und Datensatzhash, Begründung und hervorgehobene Paare. Die acht Einträge sind die vollständige Auswahl; es gibt keine Rangliste, automatische Nachfüllung oder erneute Suche. Reproduktion des Berichts: `node scripts/report-b2-bc-playtest.mjs`; Bytevergleich: `node scripts/report-b2-bc-playtest.mjs --check`.

## Verfügbare Alternativen und Zielkonflikte

| Quellziel (Zielroutenreferenz, keine Zellenfolge) | B: 5–7, ohne einzeln exakte Stunde 1 | C: 5–7, ohne einzeln exakte Stunde 1 |
| --- | --- | --- |
| B2-S02-M003-A5-R00-V02 | 7 | 6 |
| B2-S02-M005-E3-R00-V01 | 4 | 14 |
| B2-S02-M013-D4-R00-V01 | 12 | 14 |
| B2-S02-M017-A4-R00-V02 | 14 | 18 |

Es gibt nur vier gespeicherte Karten-/Start-/Zielinstanzen, je eine Zielroute mit Routenindex 0. Acht verschiedene Zielrouten sind damit unmöglich. Je ein B/C-Paar pro Instanz nutzt die maximale vorhandene Kartenvielfalt und erlaubt den qualitativen Vergleich auf gleicher Geometrie. Die V-Kennung der Quellreferenz benennt die ursprüngliche S02-Variante, nicht die neue Vergleichsvariante. Wiederholtes Spielen derselben Route durch dieselbe Person ist für diese Entwicklungsarbeit sinnvoll; Erinnerung und Lernen verhindern einen unverzerrten statistischen Strategievergleich.

Nicht allein die längsten Sätze wurden bevorzugt: zwei Fünfer-, vier Sechser- und zwei Siebener-Sätze. Alle acht enthalten mehrere logische Typen; kein Einzelhinweis bestimmt eine Position in den Stunden 1–6 exakt. Zählhinweise dominieren weiterhin. Die früher vorgeschlagenen C-Varianten `1bc4f128…` (M017, nur Zähltyp, zwei flächige Ausschlüsse) und `63bc61f3…` (M013, nur Zähltyp, vier flächige Ausschlüsse) wurden zugunsten gemischter Typen ersetzt; `501a55f3…` bleibt enthalten. Einige punktuelle und drei flächige Ausschlüsse im Gesamtbestand bleiben bewusst als beobachtbare Arbeit erhalten. Dies ist keine Aussage über gute oder schlechte Hinweisformen.

## Übersicht

| Testkennung | Arm | Karte / Start / Route | Hinweise / logische Typen | Flächige Niemals-Hinweise |
| --- | --- | --- | --- | --- |
| B2-BC-T01-M017-A4-R00 | B | M017-A4-R00 | 7: 4 × countDistanceToPlace, 1 × direction, 2 × distanceBetweenHours | 0 |
| B2-BC-T02-M017-A4-R00 | C | M017-A4-R00 | 6: 3 × countDistanceToPlace, 1 × direction, 2 × distanceBetweenHours | 1 |
| B2-BC-T03-M003-A5-R00 | C | M003-A5-R00 | 6: 5 × countDistanceToPlace, 1 × turn | 0 |
| B2-BC-T04-M003-A5-R00 | B | M003-A5-R00 | 6: 3 × countDistanceToPlace, 1 × turn, 1 × distanceToPlace, 1 × distanceBetweenHours | 1 |
| B2-BC-T05-M005-E3-R00 | B | M005-E3-R00 | 5: 3 × countDistanceToPlace, 1 × turn, 1 × direction | 1 |
| B2-BC-T06-M005-E3-R00 | C | M005-E3-R00 | 5: 4 × countDistanceToPlace, 1 × direction | 0 |
| B2-BC-T07-M013-D4-R00 | C | M013-D4-R00 | 7: 6 × countDistanceToPlace, 1 × turn | 0 |
| B2-BC-T08-M013-D4-R00 | B | M013-D4-R00 | 6: 4 × countDistanceToPlace, 1 × turn, 1 × distanceBetweenHours | 0 |

## Einzel- und Paarwirkungen

Rest = Zahl legaler Routen, die den Einzelhinweis bzw. beide Hinweise erfüllen. Ausschluss = Anteil am legalen Grundraum, auf eine Nachkommastelle gerundet. Die Zahlen werden aus den gespeicherten Diagnosen übernommen; sie messen keine menschlichen Denkschritte. Stunden nennen die Parameter des Hinweises, keine Positionen. „Exakt“ in der letzten Spalte meint eine durch den Einzelhinweis festgelegte Position in Stunden 1–6; Stunde 0 ist der vorgegebene Start. Auch Kurse und Drehungen verwenden die üblichen benachbarten Stunden. Alle Hinweise bleiben in ursprünglicher kanonischer Reihenfolge; diese ist kein menschlicher Lösungsweg.

### B2-BC-T01-M017-A4-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/B/B2-S02-M017-A4-R00-V02/gk-variant-v2-sha256:d2157d7e37fe6056ed66e9dc91416909170cc0b02f1635500a89a756a4cf203a`.
Arm **B**, Quellziel/Zielroutenreferenz `B2-S02-M017-A4-R00-V02`, Start **A4**, legaler Grundraum **1684**.
Kartenfingerprint: `gk-map-v2-sha256:827ab34c65a9a756bfd2baa22ed9779e6a2efc6a8237a9b7b0cd5a70ff305196`.
Instanzfingerprint: `gk-instance-v2-sha256:1804e9490574672c5a576a54b1b29937205511e028b41311b4ceb0e8bc58e754`.
Hinweise: **7**; 4 × countDistanceToPlace, 1 × direction, 2 × distanceBetweenHours.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / countDistanceToPlace | 0–5 | 715 | 57.5 % | keine |
| H2 | countDistanceToPlace / HasDistanceAt | 6–6 | 505 | 70.0 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 1–3 | 1114 | 33.8 % | keine |
| H4 | countDistanceToPlace / countDistanceToPlace | 1–2 | 1004 | 40.4 % | keine |
| H5 | direction / direction | 4 | 503 | 70.1 % | keine |
| H6 | distanceBetweenHours / distanceBetweenHours | 3/6 | 984 | 41.6 % | keine |
| H7 | distanceBetweenHours / distanceBetweenHours | 1/5 | 736 | 56.3 % | keine |

Auffällige gespeicherte Paare:

- H2 + H5: einzeln 505 / 503 → gemeinsam **152** verbleibende Routen.
- H6 + H7: einzeln 984 / 736 → gemeinsam **398** verbleibende Routen.

Aufnahme: Sieben Hinweise ohne flächigen Niemals-Ausschluss; Kurs in Stunde 4 und zwei Stundenpaare ergänzen Zählintervalle und einen Endstundenabstand.

### B2-BC-T02-M017-A4-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M017-A4-R00-V02/gk-variant-v2-sha256:12746a2616361c6cf7ca27643591633b2e53004bd9979a3a880a251281ac273e`.
Arm **C**, Quellziel/Zielroutenreferenz `B2-S02-M017-A4-R00-V02`, Start **A4**, legaler Grundraum **1684**.
Kartenfingerprint: `gk-map-v2-sha256:827ab34c65a9a756bfd2baa22ed9779e6a2efc6a8237a9b7b0cd5a70ff305196`.
Instanzfingerprint: `gk-instance-v2-sha256:1804e9490574672c5a576a54b1b29937205511e028b41311b4ceb0e8bc58e754`.
Hinweise: **6**; 3 × countDistanceToPlace, 1 × direction, 2 × distanceBetweenHours.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / CountDistanceNever | 2–3 | 798 | 52.6 % | keine |
| H2 | countDistanceToPlace / countDistanceToPlace | 1–5 | 591 | 64.9 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 0–4 | 845 | 49.8 % | keine |
| H4 | direction / direction | 2 | 557 | 66.9 % | keine |
| H5 | distanceBetweenHours / distanceBetweenHours | 3/6 | 984 | 41.6 % | keine |
| H6 | distanceBetweenHours / distanceBetweenHours | 1/5 | 736 | 56.3 % | keine |

Auffällige gespeicherte Paare:

- H2 + H4: einzeln 591 / 557 → gemeinsam **139** verbleibende Routen.
- H5 + H6: einzeln 984 / 736 → gemeinsam **398** verbleibende Routen.

Aufnahme: Sechs Hinweise auf derselben Zielroute wie T01; Kurs bereits in Stunde 2, nur ein kurzer Ausschluss in Stunden 2–3 und dieselben zwei Stundenpaare als Vergleich.

### B2-BC-T03-M003-A5-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M003-A5-R00-V02/gk-variant-v2-sha256:501a55f30edb6058856b2549672266f5b226c8bd4b63330be64e06f2bc8bfb72`.
Arm **C**, Quellziel/Zielroutenreferenz `B2-S02-M003-A5-R00-V02`, Start **A5**, legaler Grundraum **746**.
Kartenfingerprint: `gk-map-v2-sha256:f2f98818665e3dac22373438791482503f0f716ac4a53e5a115ba839bdcf3526`.
Instanzfingerprint: `gk-instance-v2-sha256:204aae9c5fe469c7f00e9ce5ebe84575a26cf2d9d2f8c15349d07b6178a16d56`.
Hinweise: **6**; 5 × countDistanceToPlace, 1 × turn.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / HasDistanceAt | 3–3 | 443 | 40.6 % | keine |
| H2 | countDistanceToPlace / countDistanceToPlace | 2–3 | 314 | 57.9 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 3–5 | 376 | 49.6 % | keine |
| H4 | countDistanceToPlace / HasDistanceAt | 5–5 | 242 | 67.6 % | keine |
| H5 | countDistanceToPlace / countDistanceToPlace | 2–5 | 404 | 45.8 % | keine |
| H6 | turn / turn | 2 | 201 | 73.1 % | keine |

Auffällige gespeicherte Paare:

- H4 + H6: einzeln 242 / 201 → gemeinsam **63** verbleibende Routen.
- H2 + H3: einzeln 314 / 376 → gemeinsam **109** verbleibende Routen.

Aufnahme: Sechs Hinweise ohne Niemals-Ausschluss; frühe Drehung und Abstände in Stunden 3 und 5 verbinden sich mit überlappenden Zählintervallen. Übernimmt den passenden früheren C-Vorschlag.

### B2-BC-T04-M003-A5-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/B/B2-S02-M003-A5-R00-V02/gk-variant-v2-sha256:3ca3325645736a077a887b2097d5ec1beffded6f0e38ad729e9c9f4c93f11dab`.
Arm **B**, Quellziel/Zielroutenreferenz `B2-S02-M003-A5-R00-V02`, Start **A5**, legaler Grundraum **746**.
Kartenfingerprint: `gk-map-v2-sha256:f2f98818665e3dac22373438791482503f0f716ac4a53e5a115ba839bdcf3526`.
Instanzfingerprint: `gk-instance-v2-sha256:204aae9c5fe469c7f00e9ce5ebe84575a26cf2d9d2f8c15349d07b6178a16d56`.
Hinweise: **6**; 3 × countDistanceToPlace, 1 × turn, 1 × distanceToPlace, 1 × distanceBetweenHours.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / NotDistanceAt | 4–4 | 485 | 35.0 % | keine |
| H2 | countDistanceToPlace / CountDistanceNever | 3–6 | 358 | 52.0 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 1–5 | 317 | 57.5 % | keine |
| H4 | turn / turn | 5 | 137 | 81.6 % | keine |
| H5 | distanceToPlace / distanceToPlace | 3 | 314 | 57.9 % | keine |
| H6 | distanceBetweenHours / distanceBetweenHours | 1/5 | 324 | 56.6 % | keine |

Auffällige gespeicherte Paare:

- H4 + H6: einzeln 137 / 324 → gemeinsam **44** verbleibende Routen.
- H3 + H5: einzeln 317 / 314 → gemeinsam **96** verbleibende Routen.

Aufnahme: Vier logische Typen bei sechs Hinweisen; späte Drehung, Ortsabstand in Stunde 3 und Stundenpaar 1/5 ergänzen sich. Ein flächiger Ausschluss und ein Einzelstundenausschluss bleiben als beobachtbarer Aufwand erhalten.

### B2-BC-T05-M005-E3-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/B/B2-S02-M005-E3-R00-V01/gk-variant-v2-sha256:ba0503ee6beb577b67555f658bee59903d991d84e5141678d15fc1d1d707b800`.
Arm **B**, Quellziel/Zielroutenreferenz `B2-S02-M005-E3-R00-V01`, Start **E3**, legaler Grundraum **2166**.
Kartenfingerprint: `gk-map-v2-sha256:a90f1e307a1d5f2d587ee88f82d6e2da3c3ee527f9d619150637ad88d69b846b`.
Instanzfingerprint: `gk-instance-v2-sha256:92c444fb26e39fd354ec355aa96ced7f54d689a77082680240f1ebf9f7198f0a`.
Hinweise: **5**; 3 × countDistanceToPlace, 1 × turn, 1 × direction.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / CountDistanceNever | 1–6 | 1169 | 46.0 % | keine |
| H2 | countDistanceToPlace / countDistanceToPlace | 0–6 | 529 | 75.6 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 2–4 | 1074 | 50.4 % | keine |
| H4 | turn / turn | 6 | 438 | 79.8 % | keine |
| H5 | direction / direction | 6 | 301 | 86.1 % | keine |

Auffällige gespeicherte Paare:

- H1 + H2: einzeln 1169 / 529 → gemeinsam **87** verbleibende Routen.
- H2 + H5: einzeln 529 / 301 → gemeinsam **79** verbleibende Routen.

Aufnahme: Fünfer-Satz als Längenkontrast: Zählintervalle sowie Drehung und Kurs der letzten Stunde. Nur ein flächiger Ausschluss; auch die letzte Stunde wird einzeln nicht festgelegt.

### B2-BC-T06-M005-E3-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M005-E3-R00-V01/gk-variant-v2-sha256:7ecddd88a69ece8bd07c42736f97f646f1fc2c490cd3da242914e5429a517e79`.
Arm **C**, Quellziel/Zielroutenreferenz `B2-S02-M005-E3-R00-V01`, Start **E3**, legaler Grundraum **2166**.
Kartenfingerprint: `gk-map-v2-sha256:a90f1e307a1d5f2d587ee88f82d6e2da3c3ee527f9d619150637ad88d69b846b`.
Instanzfingerprint: `gk-instance-v2-sha256:92c444fb26e39fd354ec355aa96ced7f54d689a77082680240f1ebf9f7198f0a`.
Hinweise: **5**; 4 × countDistanceToPlace, 1 × direction.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / countDistanceToPlace | 2–3 | 502 | 76.8 % | keine |
| H2 | countDistanceToPlace / countDistanceToPlace | 2–4 | 966 | 55.4 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 0–3 | 372 | 82.8 % | keine |
| H4 | countDistanceToPlace / countDistanceToPlace | 1–6 | 634 | 70.7 % | keine |
| H5 | direction / direction | 5 | 576 | 73.4 % | keine |

Auffällige gespeicherte Paare:

- H3 + H4: einzeln 372 / 634 → gemeinsam **36** verbleibende Routen.
- H1 + H2: einzeln 502 / 966 → gemeinsam **264** verbleibende Routen.

Aufnahme: Fünfer-Satz ohne Niemals-Ausschluss; überlappende kurze Intervalle und zwei weitere Zählbedingungen werden mit einem Kurs in Stunde 5 kombiniert. Direkter Vergleich zur gleichen B-Zielroute.

### B2-BC-T07-M013-D4-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M013-D4-R00-V01/gk-variant-v2-sha256:deaf5d4808d7e1ab2f2e221d1301f215548bf51aa9c4ae253f10f6d547e4a768`.
Arm **C**, Quellziel/Zielroutenreferenz `B2-S02-M013-D4-R00-V01`, Start **D4**, legaler Grundraum **2145**.
Kartenfingerprint: `gk-map-v2-sha256:736139c12559a4c8547fc5012ceb27b7e916107d11a1f16bf7e3d31be4f852b1`.
Instanzfingerprint: `gk-instance-v2-sha256:3c1f049067cde52e2cf85e06d2206b48f8046a140692bc9cf91f175577c57afc`.
Hinweise: **7**; 6 × countDistanceToPlace, 1 × turn.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / NotDistanceAt | 6–6 | 1931 | 10.0 % | keine |
| H2 | countDistanceToPlace / NotDistanceAt | 5–5 | 1460 | 31.9 % | keine |
| H3 | countDistanceToPlace / NotDistanceAt | 6–6 | 1511 | 29.6 % | keine |
| H4 | countDistanceToPlace / countDistanceToPlace | 0–2 | 619 | 71.1 % | keine |
| H5 | countDistanceToPlace / HasDistanceAt | 2–2 | 610 | 71.6 % | keine |
| H6 | countDistanceToPlace / countDistanceToPlace | 0–6 | 557 | 74.0 % | keine |
| H7 | turn / turn | 5 | 472 | 78.0 % | keine |

Auffällige gespeicherte Paare:

- H4 + H6: einzeln 619 / 557 → gemeinsam **93** verbleibende Routen.
- H6 + H7: einzeln 557 / 472 → gemeinsam **118** verbleibende Routen.

Aufnahme: Sieben Hinweise mit Drehung, frühen Stunden und späteren Einzelstunden; drei punktuelle Ausschlüsse, aber kein flächiger Niemals-Ausschluss. Bewusste Alternative zum früheren C-Vorschlag mit vier flächigen Ausschlüssen.

### B2-BC-T08-M013-D4-R00

Vollständige Kandidatenidentität: `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/B/B2-S02-M013-D4-R00-V01/gk-variant-v2-sha256:57b9fa89b14a42c2f0125055fbcc588596adffd3d4dc6bfb7701554542d057b6`.
Arm **B**, Quellziel/Zielroutenreferenz `B2-S02-M013-D4-R00-V01`, Start **D4**, legaler Grundraum **2145**.
Kartenfingerprint: `gk-map-v2-sha256:736139c12559a4c8547fc5012ceb27b7e916107d11a1f16bf7e3d31be4f852b1`.
Instanzfingerprint: `gk-instance-v2-sha256:3c1f049067cde52e2cf85e06d2206b48f8046a140692bc9cf91f175577c57afc`.
Hinweise: **6**; 4 × countDistanceToPlace, 1 × turn, 1 × distanceBetweenHours.

| Hinweis | Logischer Typ / Darstellungsform | Stunden | Rest | Ausschluss | Einzeln exakte Stunden |
| --- | --- | --- | --- | --- | --- |
| H1 | countDistanceToPlace / HasDistanceAt | 1–1 | 947 | 55.9 % | keine |
| H2 | countDistanceToPlace / countDistanceToPlace | 2–5 | 741 | 65.5 % | keine |
| H3 | countDistanceToPlace / countDistanceToPlace | 1–6 | 581 | 72.9 % | keine |
| H4 | countDistanceToPlace / countDistanceToPlace | 1–6 | 828 | 61.4 % | keine |
| H5 | turn / turn | 6 | 442 | 79.4 % | keine |
| H6 | distanceBetweenHours / distanceBetweenHours | 0/3 | 433 | 79.8 % | keine |

Auffällige gespeicherte Paare:

- H5 + H6: einzeln 442 / 433 → gemeinsam **85** verbleibende Routen.
- H2 + H3: einzeln 741 / 581 → gemeinsam **302** verbleibende Routen.

Aufnahme: Sechs Hinweise ohne Niemals-Ausschluss; nicht eindeutiger Abstand in Stunde 1, überlappende Zählintervalle, späte Drehung und Distanz zwischen Start und Stunde 3. Kontrast zum Siebener-Satz T07.

## Spielen und Beobachten

[Export, Navigation und manuelles Uberspace-Deployment](../B2-PLAYTEST.md#bc-acht-varianten-aus-dem-suchvergleich). [Validierungsnachweis](B2-BC-validation.md). Der Bericht enthält weder Zielzellenfolge noch Lösung. Die private Originaldatei und `inspect:b2` enthalten dagegen Lösungen und gehören nicht zur Spieltestauslieferung.

Beim Spielen Testkennung, beobachtete Teilschlüsse, hilfreiche Kombinationen, mentale Routenprüfung, Ausschlussaufwand und mögliche Erinnerung notieren. S02 kann separat als bisheriger Vergleichsbestand geöffnet werden. Keine Telemetrie oder automatische Auswertung.
