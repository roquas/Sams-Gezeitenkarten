# S03 Pilot – Architektur- und Auswahlvertrag v1

Vor dem ersten S03-Generatorlauf festgelegt. Basis: main `6445021`
(PR #109 Mehrhex-Radar; #108 markierbare Fortschritte). Keine CD-Formatteränderung,
keine Veröffentlichung, kein Merge. Der später freigegebene Formatter wird beim
Export aus dem dann aktuellen Programm benutzt. Menschliche Tests fehlen noch.

## Architekturentscheidung

Der vorhandene Engine-Solver genügt unverändert. `createRouteWorkspace` enumeriert
legale Routen vollständig und begrenzt; `searchPuzzleCandidates` prüft Zielgleichheit,
Eindeutigkeit, Einzelhinweisauslassungen, logische Fingerprints und Wirkungsschlüssel.
`verifyCandidates` prüft unabhängig mit dem bestehenden detaillierten Solver.
Es gibt keine belegte Solvergrenze, die einen neuen Solver rechtfertigt.

Wiederverwendung: freigegebener kataloggerechter S02-Kartenbatch, Motivbelegung,
Engine-Prädikate und Hexgeometrie, bestehende Zufallsstreams, B2-Suche,
`diagnosePuzzle`, Deduktionsprofil V1 und markierbares Profil V2,
Positivlistenexport und Compiler. Alte S02-Rätsel sind ausschließlich gebundene
Quellen für Geografie/Starts, niemals umzuschreibende Rätsel. Neue Zielroute:
seedbestimmter Index in der vollständigen Engine-Reihenfolge. Kein Anspruch auf
unabhängige oder repräsentative Kartenstichprobe.

Minimale Ergänzungen: explizite S03-Parameterpolitik im Hinweisproduzenten;
optionaler Bewertungs-Hook nach gültigem reduziertem Kandidaten in der Suche;
kleiner Offline-Orchestrator mit Journal, Diagnosebudget und Serienauswahl;
Anmeldung eines Entwicklungsbestands in bestehendem Export und UI-Loader.
Keine neue Suchengine, lokalen Regeln, GUI oder Geometriemetriken.

## Geometrie und menschliche Fehlerbilder

Der bestehende Kartenbatch enthält `deadEnds`, `articulationCells`, Komponenten
und Routenpotenzial. Diese sind Warnsignale, keine Spielspaßbeweise. Die exakte
hinweisfreie Routenprojektion zeigt geometrisch erzwungene Stunden und Übergänge
unter Start, sechs Schritten und Wiederbesuchsverbot. Einzelhinweisprojektionen
zeigen, wie ein Anker mit Geometrie/Weglänge fast die Route bestimmt. Lokale
Baseline und exakte Baseline bleiben getrennt: Vollroutenwissen ist kein lokaler
Beweis. Distanzpaarregeln, Nachbarunterstützung, Wiederbesuch und deren Zertifikate
zeigen vorhandene lokale Weglängen-/Geometrieeffekte. Globale, höherstufige
Routenkorrelationen werden durch Projektionen nicht vollständig erfasst.

Zu prüfen: zu viele vorgegebene Teilrouten; einzelner dominanter Hinweis;
scheinbar verschiedene Hinweisarten mit gleichem Verlauf; nicht markierbarer
Einstieg; Restalternativen, deren Kopplung die UI nur an Endpunkten zeigen kann.
Befriedigende Wiederverwendung und getrennte Stränge sind Hypothesen: Zertifikat-
Abhängigkeiten belegen bekannte Beweiswege, keine menschliche Entdeckbarkeit oder
notwendige Reihenfolge. Die Quellenprüfung unterscheidet fehlende Teilmengen
explizit von nicht vorhandenen Schlüssen.

## Drei getrennte Ebenen

1. **Harte technische/mathematische Gültigkeit:** sechs Schritte, vollständige
   Routenenumeration und Hinweisproduktion; Engine-wahre Hinweise; eindeutige
   Zielroute; jeder Hinweis notwendig; vollständige Motivbelegung; unveränderte
   Release-/Quellbindungen; Fingerprints und Wirkungsschlüssel; neue Mehrstunden-
   `countDistanceToPlace`-Parameter stets `fromHour >= 1`. Single-Hour S0 bleibt
   zulässig. Historische B2-Produktion bleibt über ihren alten Vertrag reproduzierbar.
   Unabhängige Verifikation vor Export. Keine Solverergebnisse als lokale Beweise.
2. **Experimentelle Kandidatenfilter (keine objektiven Qualitätsgesetze):**
   hinweisfreie exakte Projektion legt höchstens zwei der sechs Folgestunden fest;
   mindestens 16 legale Routen; drei bis sieben Hinweise; kein Einzelhinweis legt
   mehr als drei Folgestunden exakt fest. Nach Diagnose mindestens ein lokal
   markierbarer Einstieg mit einem oder zwei Hinweisen relativ zur lokalen
   Baseline. Höchstens zwei lokal offene Folgestunden, jede mit höchstens drei
   Feldern; höchstens zwei gekoppelte lokale Nachbarstundenpaare im Vollzustand.
   Vollständige lokale Auflösung ist weder zwingend noch hinreichend für Spaß.
   Keine Pflicht zu einem bestimmten Einstieg, Mechanismus oder Zählschluss.
3. **Serienvielfalt:** höchstens ein Rätsel pro Karte und höchstens zwei pro
   belegbarer Verlaufssignatur. Signatur: minimale bekannte lokale Hinweisanzahl
   je Stunde samt Vollständigkeitsstatus, Stunden direkter Einzelhinweisanker und
   Abschlussregeln der lokalen Fixierungen, Zahl lokal offener Stunden. Sie ist
   ein begrenzter Wiederholungsindikator. Gleiche Signatur beweist keine gleiche
   menschliche Lösung, verschiedene Signaturen garantieren keine Abwechslung.
   Greedy-Auswahl bis zehn: zuerst größter Zuwachs an beobachteten Merkmalen
   (Mechanismen, Einstiegsstunden, Kombinationen, Wiederverwendung, getrennte
   Zertifikatwurzeln, Kettenlänge, offene Restalternativen); Gleichstand nach
   Kandidaten-ID. Keine Mechanismusquote und kein summierter Schwierigkeitsscore.

## Zeitpunkt der Prüfung und feste Budgets

| Stufe | Budget / Entscheidung |
| --- | --- |
| Eingabe | S02-Registry und deren manifestgebundene Kandidaten; alle 20 Karten in ursprünglicher M-Reihenfolge; je Karte lexikografisch erster registrierter Start; keine Ersatzstarts |
| Zielroute | Seed 303, Stream `s03-target-v1/<Kartenindex>`; ein Index pro Karte; maximal 20 Ziele, kein Wiederholungs-/Ersatzlauf |
| Vorprüfung | höchstens 100.000 Engineknoten je Enumeration; exakte Baseline vor Hinweissuche; topologische Warnsignale aus gespeichertem Batch |
| Hinweisproduktion | höchstens 100.000 Parameter pro Ziel; S03-Regel schon im Parameteriterator, vor Wahrheitstest und ID-Vergabe |
| Suche | vorhandene random-incremental-1; Zielseed 303 + Kartenindex; vier Neustarts pro Ziel (maximal 80 reduzierte Sätze); 2.000 Solverchecks, 5.000.000 Matchauswertungen, 20.000.000 Filterauswertungen je Ziel |
| Frühe Kandidatenfilter | Hinweiszahl und bestehende Einzelhinweis-Exaktheit vor lokaler Diagnose |
| Teure Diagnose | höchstens 24 Kandidaten insgesamt, in Entstehungsreihenfolge; je höchstens 65 Teilmengenzustände (alle bis drei Hinweise plus Vollzustand bei sieben Hinweisen); bestehende Diagnose mit 250.000 Enumerationsknoten; keine zusätzlichen Teilmengen |
| Diagnose-Evidenz | exakte/lokale Mengen, Trace und Quellhash je Zustand; Profile V1/V2 daraus; keine Antwort als Eingang der lokalen Diagnose |
| Verifikation | höchstens 24 gültige Finalisten mit unabhängigem bestehendem Prüfer; je max. 1.000.000 Engineknoten; Exportkompilierung nur Auswahl (maximal zehn) |
| Laufzeit | harter Watchdog 600 Sekunden für gesamten Pilot-Unterprozess inklusive Diagnose/Verifikation; Ausgabe wird fortlaufend geschrieben; Timeout ist abgebrochenes Experiment, niemals eine reguläre Auswahl |

Die Operationsbudgets bestimmen reguläre Entscheidungen deterministisch. Laufzeit,
CPU und Speicher sind separate Beobachtungen; Watchdog-Abbrüche beanspruchen keine
Byte-Reproduktion. Bei globalem Diagnosebudget werden weitere aussichtsreiche
Kandidaten mit `DIAGNOSIS_BUDGET_EXHAUSTED` protokolliert; keine versteckten
Folgeversuche. Die Suche darf nach zehn ausgewählten Rätseln nicht neu anlaufen.

Alle reduzierten Sätze werden gezählt, auch Wiederholungen. Unterschiedliche gültige
Rohkandidaten, Ablehnungen, Suchabbrüche, tatsächliche Diagnosezustände, ausgewählte
IDs und Vielfalt werden gespeichert. Nicht ausgewählte Finalisten sind mit
`SERIES_NOT_SELECTED` getrennt von technischen und experimentellen Ablehnungen.
Keine Kriterienänderung nach Sichtung der Ausbeute. Änderungen erfordern einen
neuen Vertrag und eine neue Experimentversion, nicht v1-Nachgenerierung.

## Abnahme und Liefergrenzen

Vor dem Lauf: gezielte Parameter-, Hook-, Budget-, Determinismus-, Quellbindungs-
und Regressionstests; bestehende Unit-/Content-/Puzzleprüfungen. Programm und
Vertrag werden vor dem Lauf committed. Manifest bindet Programmcommit, Node,
Vertrag, Konfiguration und Quelldateihashes. Separater Replay am Programmcommit
vergleicht deterministische Dateien; Ressourcenbeobachtungen sind ausgenommen.

Spieltestübersicht enthält nur Kennungen, Start-/Exportanleitung und neutrale
Beobachtungsfragen: keine Mechanismen, Anker, Bewertungen, Reihenfolgetipps oder
Lösung. Private Diagnosen bleiben aus öffentlichen DTOs und Standardpaket heraus.
Erwartete Reduktion: S0-Mehrstunden-CD, extreme geometrische Vorbestimmung,
Einzelhinweisdominanz und einige messbare Serienwiederholungen. Offen bleiben
menschliche Schwierigkeit, Freude, Auffindbarkeit, Belastung durch höhere
Korrelationen und nicht beobachtete Lösungswege. Die tägliche Serie bleibt unberührt.
