# S03 v1 – Auswertung und technische Abnahme

**Enthält Diagnoseinformationen. Für unbeeinflusste Spieltests ausschließlich die
[lösungsfreie Übersicht](../../S03-PLAYTEST.md) verwenden.**

## Ergebnis ohne Nachgenerierung

Der einmalige Pilot am 14.11.2026 läuft am sauberen Programmcommit
`6de21496772b2e4c34cea7429449d13dccb698ce` (vollständige SHA im [Manifest](run/manifest.json)), Node **v24.19.0**.
Experiment:
`gk-s03-run-sha256:7029ae823102e6f9d2bc07a063d2d61a59f45021cf6f13ed642e30059e2dae55`.
Der vorab festgelegte [Vertrag v1](contract.md) und dessen Parameter wurden nicht
nach Kenntnis der Ausbeute verändert.

| Stufe | Tatsächlich |
| --- | ---: |
| Quellenkarten / Zielversuche / neue Zielrouten | 20 / 20 / 20 |
| Neustarts / reduzierte Hinweissätze | 80 / 80 |
| Unterschiedliche mathematisch gültige Rohkandidaten | 80 |
| Frühe Ablehnung wegen Hinweiszahl | 8 |
| Lokale Diagnosen / gespeicherte Teilmengenzustände | 24 / 705 |
| Ablehnung wegen zu großer lokaler Restmengen | 19 |
| Nicht mehr diagnostiziert wegen globalem Budget | 48 |
| Finalisten, unabhängig auf Eindeutigkeit, Zielgleichheit und Irredundanz geprüft | 5 |
| Auswahl / unterschiedliche Karten / unterschiedliche Verlaufssignaturen | **4 / 4 / 4** |
| Weiterer Finalist durch Ein-Rätsel-pro-Karte-Grenze ausgeschieden | 1 |

Die Zuordnung aller 80 Kandidaten ist vollständig: 8 + 19 + 48 + 5 = 80;
4 ausgewählte plus 1 weiterer Finalist. Es gab keine doppelten reduzierten Sätze
oder äquivalenten Wirkungen in diesem Lauf. `NO_PROGRESS` zählt verworfene
Suchergänzungen, keine zusätzlichen fertigen Rätsel.

Die Suche verwendete 5.343 gecachte Solverchecks, 3.759.673 Matchauswertungen und
9.838.193 Routenfilterauswertungen. Alle 20 Ziele erreichten das vorab festgelegte
Vier-Neustart-Budget; keine Suche beansprucht Vollständigkeit über alle möglichen
Hinweissätze. Alle Hinweispools und Routenenumerationen waren vollständig.

Beobachtetes Messfenster für Generierung, Diagnosen und Verifikation:
**3,47 Sekunden**, davon **1,17 Sekunden** für Diagnosen einschließlich
Profilprojektion/Evidenzschreiben; längste Einzeldiagnose etwa 103 ms.
Quell-/Releaseprüfung liegt vor diesem Messfenster. Maximaler Prozess-RSS:
etwa 261 MiB. Diese Ressourcenbeobachtungen sind hardwareabhängig und von der
deterministischen Entscheidung getrennt. Der 600-Sekunden-Watchdog umfasst
auch Vorbereitung und Verifikation; er wurde nicht ausgelöst.

## Technisch begründete Auswahl

Diese Tabelle beschreibt vorhandene Belege und ist **keine Schwierigkeitsskala**.
Die Zahlen zu Wiederverwendung zählen ausreichende Zertifikate und deren
Nachfolger, keine notwendigen menschlichen Denkschritte.

| Kennung | Hinweise | Lokal offene Stunden im Vollzustand | Gekoppelte lokale Restpaare | Belegte gemischte Hinweisfixierungen | Wiederverwendete Feldschritte |
| --- | ---: | ---: | ---: | ---: | ---: |
| B2-S03-M001-A3-R751-V01 | 6 | 2 (Mengen 2/3) | 1 | 3 | 17 |
| B2-S03-M002-A1-R532-V03 | 3 | 0 | 0 | 0 | 19 |
| B2-S03-M003-A5-R436-V02 | 5 | 0 | 0 | 0 | 16 |
| B2-S03-M004-A1-R347-V03 | 4 | 0 | 0 | 2 | 23 |

Alle vier haben konkrete markierbare Ein-/Zweihinweisfortschritte. Jeweils
existieren auch Teilhinweissätze mit Ausschlüssen, aber noch ohne zusätzliche
Stundenfixierung. Kein Einzelhinweis bestimmt mehr als zwei Folgestunden exakt;
der vereinbarte Grenzwert wäre drei. Alle vier Ziele unterscheiden sich von den
historischen Varianten und von deren Routenindex-0-Auswahl.

Der Dreihinweiskandidat enthält ausschließlich CD-Hinweise, aber unterschiedliche
Zählmechanismen und mehrstufige lokale Weiterverwendung. Er wird nicht aufgrund
geringer Familienzahl verworfen. Andere Kandidaten verwenden unter anderem
Drehungen, Kurs oder Stundenabstand. Insgesamt sind acht vorhandene
Mechanismuskategorien vertreten; das ist keine Garantie verschiedener Erlebnisse.
Alle enthalten CD. Eine ausgewogene Familienverteilung wurde ausdrücklich nicht
erreicht und war keine feste Quote.

Drei Vollzustände sind lokal vollständig aufgelöst; ein Vollzustand lässt einen
kleinen gekoppelten Rest. Die technisch beobachteten Unterschiede erlauben einen
Vergleich unterschiedlicher Spielcharaktere, aber keine Einstufung als leicht,
mittel oder schwer. Ein Zertifikatsgraph besitzt zwei Fixierungswurzeln; das
beweist keine unabhängigen menschlichen Teilstränge. Das verwendete
`chain-follow-ups`-Merkmal zählt nachfolgende Fixierungen eines Feldschritts,
nicht die längste Graphenpfadlänge oder menschliche Denktiefe.

Bei einem Fünfhinweiskandidaten sind minimale Stundenzeugen jenseits dreier
Hinweise nicht vollständig bestimmt (fünf unbekannte Teilmengen). Dort ist fünf
nur die kleinste **bekannte** Zeugenanzahl, kein bewiesenes Minimum. Beim
Sechshinweiskandidaten fehlen 21 Teilmengen. Die anderen beiden Profile haben
vollständige Teilmengenabdeckung. Die Auswahl übernimmt diese Statusinformationen.

## Nicht erreichte Ziele und erkannte Grenze von v1

**Es wurden vier statt bis zu zehn Rätseln geliefert.** Das globale
Diagnosebudget wurde in Entstehungsreihenfolge vergeben und war bereits bei
Karte 6 aufgebraucht: pro Karte 0–6 wurden 3/4/4/4/3/4/2 Diagnosen ausgeführt,
Karten 7–19 erhielten keine. Die 48 wegen Budget ausgesonderten Kandidaten sind
unbewertet, nicht als schlecht oder unlösbar nachgewiesen. Diese feste Reihenfolge
begrenzt die mögliche Serienvielfalt deutlich.

Das ist eine Grenze des v1-Auswahlplans, keine Grenze des vorhandenen Solvers.
Ein möglicher **künftiger, gesondert vorab festzulegender v2-Versuch** könnte das
Diagnosebudget über Karten verteilen. Hier wurden weder Budget noch Kriterien
geändert, keine Ersatzstarts gewählt und keine neuen Seeds ausprobiert. Der
Replay wiederholt ausschließlich v1 zur Byteprüfung und liefert keinen Nachschub.

## Geometrie: Erkenntnisse und Grenzen

Alle 20 Baselines besitzen mindestens 39 legale Routen und fixieren keine
Folgestunde ohne Hinweise. Deshalb griff der geometrische Vorfilter im Pilot
nicht. Vorhandene Sackgassen und Artikulationszellen wurden trotzdem je Karte
protokolliert. Das stützt die Architekturentscheidung: Die interessante Gefahr
liegt hier eher in der Kombination weniger Hinweise mit Geometrie als in einer
schon ohne Hinweise vollständig vorbestimmten Teilroute.

Der Einzelhinweisdominanzfilter war aktiviert, griff in diesen 80 Kandidaten aber
nicht zusätzlich. Seine gezielten Grenztests und das historische Gegenbeispiel A
sichern die Erkennung ab; dieser Pilot beweist keine empirische Verbesserung
gegenüber früheren Serien. Weder Knotenzahl noch Topologie werden als menschliche
Schwierigkeit ausgegeben. Neue spezielle Geometriemetriken wurden nicht benötigt.

## Abnahme nach dem Pilot

- Read-only Evidenzprüfung: **2 Tests bestanden**; alle 705 Zustände mit exakten
  Routenprojektionen und unabhängiger Prüfung erreichbarer Trace-Prämissen,
  Quellhashes, Signale, Budgets, Auswahl und historischen Identitätsausschlüssen.
- Replay: **1 Test bestanden**; alle deterministischen Dateien einschließlich
  Evidenz, Registry und Auswahl bytegleich am ursprünglichen Programmcommit.
  `observations.json` ist bewusst ausgenommen.
- S03-Browserprüfung: **2 bestanden**, Chromium Desktop und Pixel 7, einschließlich
  Auswahlwechsel, isolierter Markierungen, öffentlicher DTOs und Lösungskontrolle.
  Der erste Desktoplauf deckte eine fehlende Wartebedingung im neuen Test nach
  der asynchronen Auswahl auf. Nur der Test wurde korrigiert; Programm und
  Kandidaten blieben unverändert.
- Vorab bestanden: **340** Unit-/Vertrags-/Integrationstests, **20** Contenttests,
  reguläre Puzzlevalidierung, **24** B2-/Mehrhex-Radar-Browserprüfungen und
  **19** Paketregressionen; Details im [Vorprüfstand](preflight.md).

Erwartete Reduktion: neue S0-Mehrstunden-CD sind ausgeschlossen; extreme bekannte
Vorbestimmung und Dominanz werden gefiltert; belegbare Serienwiederholungen sind
begrenzt; große lokale Restmengen wurden tatsächlich ausgesondert. Offen bleiben
Spielspaß, Entdeckbarkeit, angemessene Gedächtnislast, höhere Routenkorrelationen,
Repräsentativität und tatsächliche menschliche Abwechslung. Erst die menschliche
Testserie kann bessere Rätsel bestätigen.

Keine Veröffentlichung, kein Merge, keine Umstellung der Tagesrätsel. Die offene
Formatter-PR #110 ist nicht integriert; spätere Bereitstellung erfolgt per neuem
Export mit dem dann freigegebenen Formatter.
