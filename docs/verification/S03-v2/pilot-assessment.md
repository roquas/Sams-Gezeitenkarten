# S03-v2 – Auswertung, v1-Vergleich und technische Abnahme

**Enthält Diagnoseinformationen. Für unbeeinflusste menschliche Tests nur die
[lösungsfreie Übersicht](../../S03-PLAYTEST.md) verwenden, und erst nach Freigabe.**

## Festgelegter Versuch und unveränderte Basis

Der einzige v2-Pilot am 15.11.2026 lief am sauberen Programmcommit, der im
[Manifest](run/manifest.json) vollständig gebunden ist, mit Node **v24.19.0**.
Experiment:
`gk-s03-v2-run-sha256:06482bf625006e10ce844b47105fbc54df23c232911cbc828833d96f7eae0f58`.

Der [Vertrag v2](contract.md) wurde in `772749f` vor dem Lauf fixiert.
Qualitätsfilter, Signale und Serienauswahl blieben unverändert. Die Implementierung
importiert dieselben 80 vollständig materialisierten v1-Kandidaten; sie erzeugt
keine neuen Karten, Zielrouten, Hinweispools oder Suchkandidaten. Definitionen,
Fingerprints, Wirkungsschlüssel, Motivbelegungen, Seeds und Routenindizes bleiben
identisch. v2-Kennungen binden zusätzlich die ursprüngliche Kandidaten-ID,
Quellzeile und Recordhash. Alle 80 Quellen wurden unabhängig verifiziert.

main `70e563d` wurde regulär in den bestehenden Branch integriert. Der dort
freigegebene CD-Formatter und Mehrhex-Radar wurden unverändert übernommen;
Solver, Geometrie und lokale Deduktionsregeln wurden nicht verändert.
[Integrationsnachweis](main-sync.md).

## Ergebnis gegenüber v1

| Messung | v1 | v2 |
| --- | ---: | ---: |
| Karten / ursprüngliche Zielrouten | 20 / 20 | dieselben 20 / 20 |
| Mathematisch gültige Rohkandidaten | 80 | dieselben 80 |
| Zusätzliche Kandidatengenerierung in v2 | – | **0** |
| Geeignet nach unverändertem Frühfilter | 72 | 72 |
| Lokale Diagnosen | 24 | 40 |
| Lokal untersuchte Karten | 7 | **20** |
| Diagnosen pro Karte | 0–4 | **genau 2 je Karte** |
| Gespeicherte Diagnosezustände | 705 | 1.096 |
| Ablehnung wegen Hinweiszahl | 8 | 8 |
| Ablehnung wegen lokaler Restmengen | 19 | 29 |
| Geeignet, aber lokal nicht diagnostiziert | 48 | 32 |
| Finalisten nach allen Filtern | 5 | 11 |
| Ausgewählte Rätsel / unterschiedliche Karten | 4 / 4 | **9 / 9** |
| Unterschiedliche Verlaufssignaturen der Auswahl | 4 | **9** |

Die neue Budgetverteilung behebt die frühe geografische Verengung des v1-Plans:
Die erste Runde untersuchte genau einen geeigneten Kandidaten jeder Karte, erst
danach folgte die zweite Runde. Der vollständige [Plan](run/plan.json) wurde vor
der ersten lokalen Diagnose gespeichert. Ergebnisse konnten weder Reihenfolge
noch Budget ändern. Die [Ausführung](run/diagnoses.jsonl) stimmt exakt mit diesem
Plan überein. [Bericht mit Einzelkosten je Karte](run/report.md).

Die Dispositionen sind vollständig: 8 frühe Ablehnungen + 29 Ablehnungen nach
Diagnose + 32 unbewertete Kandidaten + 11 Finalisten = 80 Quellen. Die elf
Finalisten liegen auf neun Karten. Zwei weitere Varianten wurden wegen der
unveränderten Ein-Rätsel-pro-Karte-Grenze nicht ausgewählt. Die Signaturgrenze
musste dafür nicht gelockert werden. Deshalb werden **neun statt zehn** geliefert.

Die 32 nicht geplanten Kandidaten bleiben im v2-Lauf lokal unbewertet. Ihre konkreten IDs
stehen in `plan.json`, `raw.jsonl` und `summary.json`; sie sind nicht als schlechte
Rätsel nachgewiesen. Es gab keine dritte Runde, zusätzliche Suche oder andere
Seeds. Zwei logische Varianten der v1-Auswahl sind auch in v2 enthalten. Die
anderen beiden damaligen Auswahlvarianten lagen außerhalb des ergebnisunabhängig
festgelegten 40er-Plans und wurden nicht nachträglich bevorzugt. v1 wurde nicht
menschlich als neue Serie eingesetzt und bleibt unverändertes technisches Archiv.

## Technisch beobachtete Vielfalt

Die Auswahl verwendet vorhandene Belege, keine Schwierigkeitsskala. In dieser
Tabelle bedeutet „gemischt“ eine lokal belegte Stundenfixierung mit unterschiedlichen
Hinweisfamilien im bekannten Zeugen; null bedeutet keinen solchen nachgewiesenen
Zeugen, nicht den Ausschluss anderer menschlicher Argumente.

| Kennung | Hinweise | Lokal offene Stunden | Lokale Restpaare | Gemischte Fixierungen | Wiederverwendete Feldschritte | Unbekannte Teilmengen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| B2-S03-V2-M001-A3-R751-V01 | 6 | 2 | 1 | 3 | 17 | 21 |
| B2-S03-V2-M003-A5-R436-V02 | 5 | 0 | 0 | 0 | 16 | 5 |
| B2-S03-V2-M008-A3-R51-V02 | 6 | 0 | 0 | 1 | 24 | 21 |
| B2-S03-V2-M010-E4-R568-V01 | 6 | 0 | 0 | 0 | 21 | 21 |
| B2-S03-V2-M011-A5-R787-V01 | 4 | 0 | 0 | 6 | 22 | 0 |
| B2-S03-V2-M014-A5-R160-V01 | 6 | 0 | 0 | 0 | 18 | 21 |
| B2-S03-V2-M016-A2-R116-V01 | 3 | 0 | 0 | 0 | 16 | 0 |
| B2-S03-V2-M017-A4-R74-V02 | 6 | 0 | 0 | 1 | 26 | 21 |
| B2-S03-V2-M018-A5-R30-V04 | 3 | 0 | 0 | 2 | 13 | 0 |

Alle neun besitzen markierbare Ein-/Zweihinweisfortschritte und belegte
Weiterverwendung. Acht Vollzustände sind lokal vollständig aufgelöst, einer
behält zwei kleine Stundenmengen (2/3 Felder) und ein gekoppeltes Nachbarpaar.
Ein Zertifikatsgraph hat zwei Fixierungswurzeln; das beweist keine unabhängigen
menschlichen Teilstränge. Zertifikatsnachfolger werden nicht als menschliche
Denktiefe oder zwingende Reihenfolge ausgegeben.

45 Hinweise verteilen sich logisch auf 33 CD-, sieben Drehungs-, zwei Ortsdistanz-,
zwei Kurs- und einen Stundenabstandshinweis. Neun vorhandene Mechanismuskategorien
sind vertreten; alle Rätsel enthalten CD. Das ist keine Mechanismusquote und
keine Garantie, dass Menschen neun verschiedene Lösungsverläufe erleben.

Bei sechs Profilen fehlen Teilmengen jenseits dreier Hinweise. Die vorhandenen
Minimum-/Zeugenstatus bleiben erhalten; „kleinster bekannter Zeuge“ ist nicht
pauschal ein bewiesenes Minimum. Bei den überlappend mit v1 diagnostizierten
Kandidaten sind die neu berechneten Qualitätssignale exakt dieselben wie zuvor.
Dies wird als Regression geprüft und zeigt, dass die main-Synchronisierung die
inhaltliche Diagnose nicht verändert hat.

## Kosten und Grenzen

Der Pilot benötigte **3,93 Sekunden insgesamt**, davon **0,93 Sekunden** für
Vorbereitung/Quellprüfung und **2,13 Sekunden** für die 40 Diagnosen einschließlich
Evidenz- und Profilverarbeitung. Der maximale Prozess-RSS betrug rund **327 MiB**.
Die 120-Sekunden-Grenze und das 2.600-Zustände-Budget wurden eingehalten. Zeiten
und Ressourcen sind Beobachtungen aus [observations.json](run/observations.json)
und keine deterministischen Qualitätsparameter.

Die v1-Zeit von ungefähr 3,47 Sekunden begann erst nach der Quellvorbereitung;
sie ist daher mit dem vollständigen v2-Messfenster nicht direkt gleichzusetzen.
Diagnosebudgets und Zustandszahlen bleiben die nachvollziehbaren Operationsgrenzen.
Die größere technische Ausbeute auf derselben festen Basis belegt keine bessere
menschliche Rätselqualität oder statistisch repräsentative Tagesrätselserie.

Weiter offen: höherstufige Routenkorrelationen, Entdeckbarkeit, Bedien-/Gedächtnislast,
tatsächliche Schwierigkeit, Freude und erlebte Abwechslung. Die unveränderten
Filter können weiter Rätsel mit ähnlichem geometrischem Abschluss bevorzugen.
Eine komplett lokale Auflösung allein gilt weiterhin nicht als Spielspaßbeweis.

## Abnahme und aktueller Spieltestexport

- Vorprüfung: **364** Unit-/Vertrags-/Integrationstests, **20** Contenttests,
  reguläre Puzzlevalidierung, **30** vorhandene B2-/H1-/Radar-Browserprüfungen und
  **19** Paketregressionen bestanden; [Vorprüfstand](preflight.md).
- Neue v2-Evidenz-/Exportprüfung: **3 Tests bestanden**, alle 1.096 Zustände mit
  exakten Projektionen und erreichbaren Trace-Prämissen geprüft, alle Quellen,
  Dispositionen, Budgets, Auswahl und tatsächlich exportierten Bytes kontrolliert.
- v2-Replay: **1 Test bestanden**, alle **91 deterministischen Dateien** am
  aufgezeichneten Programmcommit bytegleich; nur `observations.json` ausgenommen.
- Neue v2-Browserprüfung: **6 bestanden**, Chromium Desktop und Pixel 7, alle
  ausgewählten Hinweistexte in beiden Ansichten, Auswahl/Persistenz/öffentliche
  Daten/Lösungskontrolle sowie Radar an tatsächlicher Mehrhexgeometrie.
- v1-Evidenz und ursprünglicher Replay weiterhin bestanden und bytegleich.

[Geprüfter Export und konkrete sprachliche Sonderfälle](export-audit.md).
Die tatsächlichen neun öffentlichen Rätsel enthalten „nie“, „in jeder Stunde“,
„auf“, „neben“, positive und negative Einzelstunden sowie Mehrhexbezüge; kein
Mehrstunden-CD enthält S0. Alle zugrunde liegenden Hinweisprädikate und
Lösungsmengen bleiben unverändert. Keine neue GUI oder Formatterkopie.

Die [lösungsfreie Übersicht](../../S03-PLAYTEST.md) führt ausschließlich S03-V2 als
vorbereitete Serie. Die technische Abnahme ersetzt keine menschliche Freigabe
oder Qualitätsbestätigung. Kein automatischer Merge, keine Veröffentlichung,
keine Umstellung des Tagesbetriebs.
