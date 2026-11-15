# main-Synchronisierung und unveränderte Kandidatenbasis

Am 15.11.2026 wurde main `70e563d` mit einem regulären Merge (`1d80d0c`)
in den bestehenden Branch `feature/s03-quality-pilot` integriert. Die Integration
war konfliktfrei. main enthält den Mehrhex-Radar (#109) und den freigegebenen
CD-Textformatter (#110, Implementierung `3677769`). Keine Formatter- oder
GUI-Entwicklung wurde nachgebaut.

Der zusätzliche Entwicklungsbestand S03-V2 benötigt nur die vorhandene Bestands-
Positivliste im Exportadapter und UI-Loader. Der normale Tagesbetrieb, die
reguläre Auswahl und alle bisherigen Bestandskennungen bleiben erhalten.
`npm run dev:b2:s03` verweist für die vorbereitete Serie künftig auf S03-V2.

## Quellen- und Semantikschutz

Die vollständigen 80 v1-Rohkandidaten sind materialisiert. Keine Reproduktion
oder neue Generierung ist für den v2-Kandidatenimport nötig. Alle 62 Dateien unter
`docs/verification/S03/` einschließlich der 57 Laufdateien stimmen mit Snapshot
`7aa284d19a20b5f31a8c1c454561698ad968c6fa` überein. Definitionen, Motivbelegungen,
Fingerprints, Wirkungsschlüssel, mathematische Nachweise, Seeds und Routenindizes
werden unverändert importiert. Neue v2-Kennungen enthalten explizite v1-Quellzeilen,
Recordhashes und ursprüngliche Kandidaten-IDs. Die Synchronisierung verändert
somit **nicht** die logische Kandidatenmenge.

`src/engine/solver.mjs`, `src/engine/puzzle.mjs`, lokale Deduktionsregeln und
Diagnosemodul sind bytegleich zu main. Dasselbe gilt für den Radarzustandsdienst
und den freigegebenen CD-Formatter. `s03-quality.mjs` und sämtliche v1-Kriterien
sind bytegleich zum v1-Snapshot. `loadV2Sources` erzwingt diese Bindungen vor dem
Lauf; der unabhängige vorhandene Prüfer kontrolliert zusätzlich alle 80 Quellen.
Neue lokale Diagnosebelege dürfen keine gespeicherte Antwort als Eingang nutzen.

Die S03-Regel für neue Mehrstunden-CD bleibt im Parameteriterator erhalten.
Beim v2-Import und Export wird zusätzlich geprüft, dass kein solcher Hinweis
S0 enthält. Die grundsätzliche Zulässigkeit von Single-Hour S0 und die historische
Solversemantik werden nicht verändert.

## Plan vor lokalen Diagnosen

Die günstige Vorprüfung findet wie v1 72 geeignete Kandidaten und acht
Ablehnungen wegen Hinweiszahl. Mit dem vorab festgelegten 40er-Budget erhält
jede der 20 Karten genau zwei geplante Diagnosen. Die Auswahl folgt ausschließlich
der ursprünglichen Kandidatenreihenfolge V01–V04. v1-Diagnoseergebnisse und
v1-Ablehnungsentscheidungen gehen nicht in den Plan ein.

Diese Mengen stammen aus Quell- und Frühfilterprüfungen, **nicht aus einem
vorgezogenen v2-Diagnoselauf**. Der vollständige Ausführungsplan wird im eigentlichen
Lauf vor dessen erster lokalen Diagnose geschrieben. Nicht geplante geeignete
Kandidaten bleiben lokal unbewertet.

## Prüfungen vor dem Pilot

Gezielte Tests sichern Planreihenfolge, Fairness bei ungleichen Kartengruppen,
Budgetgrenzen, Unabhängigkeit von alten Ergebnissen, Quellidentitäten,
unveränderte Kriterien und Exporttrennung. Die synchronisierten H1-Integrationstests
vergleichen weiter die Hinweiswahrheit auf sämtlichen legalen Routen der alten
Bestände. Radar-/B2-/H1-Browserregressionen bestehen mit 30 Prüfungen auf Chromium
Desktop und Pixel 7; die 19 Paketregressionen bestehen ebenfalls.

Ein von main übernommener Negativtest führte S03 noch als unbekannten Bestand.
Er wurde auf die tatsächlich unbekannte Kennung `UNKNOWN` umgestellt; die
betroffenen 13 Tests bestehen danach. Dies korrigiert eine Testannahme der
Integration und verändert keine Produktionsregeln. Die vollständige Unitsuite
wird vor dem Pilot erneut am korrigierten Stand ausgeführt; ihr Ergebnis steht
im separaten Vorprüfstand.

Auch die ursprünglichen v1-Evidenzprüfungen (alle 705 Zustände) und der Replay am
v1-Programmcommit bestehen nach der Synchronisierung. Alle deterministischen
v1-Laufdateien bleiben bytegleich. v1 bleibt ein technisches Experiment und wird
nicht als neue menschliche Serie freigegeben.
