# S03-v2 – eingefrorener Auswahl- und Laufvertrag

Vor dem ersten v2-Lauf festgelegt. Ausgangspunkt: v1 bis `7aa284d`, synchronisiert
mit main `70e563d` (freigegebener CD-Formatter aus PR #110, Mehrhex-Radar bereits
enthalten). Die main-Integration ist ein eigener Merge auf dem bestehenden
S03-Feature-Branch. Keine erneute Formatter-, GUI-, Solver- oder Regelentwicklung.

## Identische, vollständig materialisierte Kandidatenbasis

Die 80 unterschiedlichen Rohkandidaten aus `docs/verification/S03/run/raw.jsonl`
liegen vollständig vor. v2 erzeugt **keine** Karten, Zielrouten, Hinweispools oder
weiteren Kandidaten. Alle ursprünglichen Seeds, Routenindizes, Definitionen,
Motivbelegungen, Fingerprints, Wirkungsschlüssel, Eigenschaften und mathematischen
Nachweise bleiben erhalten. Der ursprüngliche Identitätsraum wird per
`sourceCandidateId`, Quellzeile und Recordhash gebunden. Neue v2-Lauf-/Testkennungen
sind ausdrücklich zusätzliche Identitäten, keine Änderung der logischen Varianten.

Quelle ist der feste v1-Snapshot `7aa284d19a20b5f31a8c1c454561698ad968c6fa`.
Alle Dateien des ursprünglichen v1-Laufs werden vor und nach v2 gegen ihre
Git-Bytes geprüft; Dateihashes kommen ins v2-Manifest. Vollständigkeit: genau
80 Kandidaten, vier je Karte, genau 20 Karten. Die bestehenden Fingerprints und
der unabhängige vorhandene Kandidatenprüfer sichern zusätzlich alle 80 Quellen ab.
Eine geänderte oder fehlende Quelle bricht v2 ab; keine Ersatzgenerierung.

v1-Diagnoseergebnisse, Signale und Ablehnungsentscheidungen werden **nicht** in die
v2-Entscheidung übernommen. Alle in v2 vorgesehenen Diagnosen werden neu aus der
unveränderten Logik berechnet. Keine Antwort wird in lokale Regeln eingespeist.
Der bestehende v1-Programmcommit und alle v1-Verträge/-Artefakte bleiben erhalten;
der v1-Replay führt nach wie vor ausschließlich das ursprüngliche Experiment aus.
Die vier v1-Kandidaten sind keine freigegebene neue menschliche Testserie.

## Unveränderte Qualitäts- und Vielfaltskriterien

v2 verwendet exakt `quality`, `maxSelected` und `maxPerSignature` aus der
v1-Konfiguration und unverändert `earlyRejection`, `qualitySignals`,
`lateRejection` und `selectSeries`. Es gibt keine Lockerung wegen der v1-Ausbeute.

Harte Gültigkeit: vollständige mathematische Beweise, Eindeutigkeit, Zielgleichheit,
Irredundanz, freigegebene Motivbelegung, richtige Kandidaten-/Quellidentitäten;
Mehrstunden-CD stets `fromHour >= 1`, Single-Hour S0 weiterhin grundsätzlich erlaubt.
Solver- und Hinweissemantik bleiben unverändert.

Experimentelle Filter: 3–7 Hinweise; höchstens drei durch einen Einzelhinweis exakt
festgelegte Folgestunden; markierbare Ein-/Zweihinweisfortschritte; höchstens zwei
lokal offene Folgestunden mit je höchstens drei Feldern; höchstens zwei gekoppelte
lokale Nachbarpaare. Die ursprünglichen Karten-/Startbaselines bleiben gebundene
Quellbedingungen (mindestens 16 Routen, höchstens zwei rein geometrisch feste
Folgestunden). Diese Indikatoren sind keine objektive Qualität oder Schwierigkeit.

Serienauswahl: maximal zehn, eine Variante pro Karte, höchstens zwei je vorhandener
Verlaufssignatur; derselbe deterministische Merkmalszuwachs und Identitäts-Tiebreak
wie v1. Keine Quote für Mechanismen, keine Garantie menschlicher Abwechslung.
Unbekannte Teilmengen und höhere Routenkorrelationen bleiben unbekannt.

## Faire, ergebnisunabhängige Diagnoseplanung

1. Alle 80 Quellen in ursprünglicher Reihenfolge prüfen und ausschließlich den
   vorhandenen günstigen v1-Frühfilter anwenden.
2. Geeignete Kandidaten nach ursprünglichem Kartenindex gruppieren. Innerhalb
   einer Karte nach ursprünglichem Rohkandidatenordinal V01, V02, V03, V04 sortieren
   (Quellzeile und Kandidaten-ID als stabile weitere Tiebreaks).
3. Runde 1: höchstens den ersten geeigneten Kandidaten jeder Karte, Karten 0–19.
   Runde 2: je den zweiten geeigneten Kandidaten. Weitere Runden nur, falls wegen
   leerer/kürzerer Kartengruppen noch Budget übrig ist, stets in derselben Ordnung.
4. Den gesamten Plan **vor der ersten lokalen Diagnose** speichern. Die ersten
   maximal 40 Positionen bilden den festen Diagnoseplan. Weder gute noch schlechte
   Diagnoseergebnisse ändern diesen Plan. Auch nach zehn Finalisten läuft nur der
   vorab festgelegte Plan zu Ende; keine Zusatzdiagnose und kein Auffüllen.

Damit wird breite Kartenabdeckung vor wiederholten Diagnosen einer Karte
priorisiert. Ohne geeigneten Rohkandidaten bekommt eine Karte keine Diagnose;
das wird ausdrücklich dokumentiert. Nicht geplante Kandidaten sind **untersucht
bis zum Frühfilter, lokal unbewertet**, nicht als schlechte Rätsel nachgewiesen.

## Budgets und Begründung der moderaten Erhöhung

24 Diagnosen erlauben bei 20 Karten nur eine breite Runde und vier weitere
Diagnosen. v1 maß etwa 1,17 Sekunden Diagnosekosten für 24 Kandidaten. v2 legt
**40 Diagnosen** fest: im Normalfall zwei Runden über alle 20 Karten, ohne
Ergebnissteuerung der Budgetvergabe. Das ist eine begrenzte Erhöhung um 16 und
keine Suche nach maximaler Ausbeute. Aus der Laufzeit wird kein Qualitätsanspruch
abgeleitet.

| Größe | Harte v2-Grenze |
| --- | ---: |
| Karten / Zielrouten / Rohkandidaten | 20 / dieselben 20 / dieselben 80 |
| Neue Generator-/Hinweispool-/Suchaufrufe | **0** |
| Lokale Diagnosen | **40** |
| Zustände je Diagnose | höchstens 65, bestehende Teilmengen bis drei Hinweise plus Vollzustand |
| Diagnosezustände gesamt | **2.600**, vor jeder Diagnose reserviert |
| Enumeration je bestehender Diagnose | 250.000 Engineknoten, unveränderter Diagnosevertrag |
| Unabhängige Quellenprüfung | alle 80, vorhandener Prüfer, je höchstens 1.000.000 Engineknoten |
| Öffentliche Exportkompilierung im Pilot | höchstens zehn ausgewählte Rätsel |
| Gesamter Pilot-Unterprozess | **120 Sekunden**, harter Watchdog einschließlich Vorbereitung und Verifikation |

Die Operationsbudgets bestimmen reguläre Entscheidungen; Hardwarezeiten bleiben
separate Beobachtungen. Ein Watchdog-/Validierungsfehler markiert den Lauf als
abgebrochen und verbietet den Spieltestexport. Keine automatische Wiederholung.
Der spätere explizite Replay wiederholt nur denselben eingefrorenen v2-Lauf zur
Byteprüfung, erzeugt keine neue Kandidatenbasis und keinen Nachschub.

## Aufzeichnung und Abnahme

Vor dem Lauf: Vertrag und Programm committen; gezielte Tests für Reihenfolge,
Fairness, Ergebnisunabhängigkeit, Budgetgrenzen, Identitäten, unveränderte Kriterien
und Quelle; Generator-/Diagnose-/Bestandsregressionen einschließlich main-Formatter.
Erst danach genau ein v2-Lauf in neuem Verzeichnis `docs/verification/S03-v2/run`.

Manifest: Programmcommit, Node, Vertrag, Konfiguration, main-Formatterhash, v1-Snapshot
und Quellhashes. Daten: vollständiger Diagnoseplan vor Ausführung, alle 80
Dispositionen, tatsächliche Diagnosen und Zustände je Karte, Ablehnungsgründe,
Finalisten, Auswahl, Vielfalt, unbekannte Kandidaten, Vergleich zu v1, getrennte
Gesamt-/Diagnosekosten. Belege bleiben außerhalb öffentlicher DTOs.

Nach dem Lauf: Quellen-/Traceprüfung aller gespeicherten Zustände, unabhängige
Finalistenprüfung, Byte-Replay am Programmcommit und tatsächlicher öffentlicher
Export über den bestehenden Adapter. Gespeicherte Exporthashes binden die geprüften
Bytes des freigegebenen Formatters. Reale Hinweistexte auf Sonderfälle prüfen:
`nie`, vollständige Intervalle (`in jeder Stunde`, semantisch „immer“), `auf`,
`neben`, Einzelstunden. Nicht im Auswahlbestand vorkommende Fälle als solche
benennen; sie sind kein Grund, Auswahl oder Hinweise zu verändern. Bestehende
Formattertests sichern zusätzliche Randfälle ab. Mehrhexobjekte und ihr Radar
werden an echten exportierten Daten und in bestehenden Regressionen geprüft.

Die neue strikt lösungsfreie Übersicht führt ausschließlich v2 als vorgesehenen
Spieltestbestand, keine Diagnosehinweise oder Schwierigkeitsbehauptungen. Vor
menschlichen Tests bleibt technische Prüfung und Freigabe erforderlich. PR #111
wird aktualisiert; kein Merge, keine Veröffentlichung, keine Tagesbetriebsänderung.
