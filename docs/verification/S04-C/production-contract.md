# S04-C Phase C – Produktionsvertrag v1

Vor der ersten Generation fixiert, 22.11.2026. Konfiguration:
`scripts/config/s04-c-production-v1.json`. Keine Ergebnisse bei Festlegung.
Dieser Vertrag autorisiert genau einen neuen Produktionslauf; der getrennte
Replay wiederholt dieselben Seeds. Keine budgetabhängige Nachgenerierung.

## Programm, Quellen und Integration

Basis ist der am 22.11.2026 tatsächlich gelesene main
`63092cacd251229ec6adc2552e1a821c3a5b4545`, nach #120 (Merge `5b7c5da`)
und #119. Der vollständige Diff #120-Merge..Basis betrifft Oberfläche, Regeln,
Bilder, Landingrätsel und deren Tests/Hilfen. Keine Änderung an Engine,
Solver, Generator, B1-Routenproduzent, B2-Suche, S04-B, Identitäten oder
Quellenverträgen. Keine inkompatible Zwischenversion.

Programm, Konfiguration, dieser Vertrag und Prüfprogramme werden gemeinsam
**vor dem Lauf** committed. Dessen vollständigen Commit ermittelt
`programState()` zur Laufzeit; das unveränderliche Manifest bindet ihn und
Node exakt **v22.23.3**. Ein selbstreferenzieller Commit im Vertrag ist nicht
möglich. Ergebnisbericht/Receipt folgen in einem separaten Commit. Node
Standardbibliothek; kein zusätzlicher Paket-/Python-Laufzeitbedarf für Erzeugung.

Die Manifestquellen binden den A/B-Vertrag, dessen README und Konfiguration,
S04-A/B-Dokumentation, menschliche Beobachtungen sowie den gespeicherten Inhalt
von [Issue #21](https://github.com/roquas/Sams-Gezeitenkarten/issues/21)
(`issue-21-source.json`, aktualisiert 19.11.2026). Die Git-Programmidentität
bindet alle Implementierungen. Vorherige Kandidaten-/Roh-/Finalisten-/akzeptierte
Batchdateien unter `docs/verification` werden aus der Basis inventarisiert,
mit Git-Originalbytes abgeglichen und mit SHA-256 gebunden; daraus kommen
historische Karten-/Variantenverbote, ausdrücklich einschließlich Pilotkarten
und deren Karten ohne Start. Keine dieser Dateien wird verändert.

Die neue Experimentidentität hasht kanonisches Manifest ohne `experimentId`;
die vollständig explizite Konfiguration steht darin als JSON-String, da die
bestehende kanonische Identitätsfunktion absichtlich nur Ganzzahlen unterstützt,
die Kartenkonfiguration aber Wahrscheinlichkeit 0,5 enthält. Die Original-
Konfigurationsbytes sind zusätzlich per SHA-256 gebunden. Keine Identitätsänderung
bestehender Rätsel.

## Karten, Starts, Ziele und Abbruch

Höchstens 24 vom unveränderten Release-Generator akzeptierte Karten, höchstens
48 äußere Versuche. Seeds Karte/Belegung 405000..405047, sequentiell, je ein
innerer Kartenversuch. Alle Optionen sind ausgeschrieben: 2..7 Objekte,
Größen 1/2/3/4, Passierbarkeitswahrscheinlichkeit 0,5, keine geografischen
Eignungsfilter, Analyse ohne Routenschritte mit 10.000 Knoten. Release und
Hintergrund wie Pilot (IDs in der Konfiguration). Alle Versuche einschließlich
Ablehnungen werden vom Batch unverändert protokolliert.

B1 zählt sämtliche zulässigen Starts mit je 100.000 Knoten, sechs Schritten,
Engine-Reihenfolge. Je Karte ausschließlich erster vollständig gezählter
positiver Start in B1-Reihenfolge. Keine Alternative bei schlechter Baseline.
Alte/doppelte Karten, fehlender Start, Baseline <16 Wege oder >2 geometrisch
feste Folgestunden bleiben protokolliert und werden **nicht ersetzt**. Nur
vollständige Routenräume/Pools werden gesucht. Unvollständigkeit bleibt
unbekannt; keine Qualitätsabwertung daraus.

Zielindex uniform aus vollständigem Raum, `randomStream(405,
's04-c-production-target-1/'+Kartenindex)`. Suchseed 405+Kartenindex.
Neue Namespace-/Karten-/Suchseeds, keine Pilot-/S02-/S03-Fälle.
Keine Auswahl nach beobachteter Ausbeute. Fehler/Quellenwiderspruch oder
Watchdog beenden den Lauf mit `ABORTED.json`; Teilbestände sind keine gültige
Auswahl. Keine Wiederholung mit neuen Seeds oder höheren Limits.

## Sämtliche Ressourcen und Ausführung

- Unveränderte Strategie explizit `random-incremental-1`, vier Neustarts/Ziel.
- Pro Ziel: 100.000 Enumerationsknoten, 100.000 Hinweisparameter,
  2.000 Solverchecks, 5.000.000 Matches, 20.000.000 Routenfilter.
- Unveränderte Politik `s03-no-multihour-zero-1`; aktive Normalisierung
  `count-distance-extremes-1` vor finaler Identität, Auslassungen und Signalen.
  Dieselben Suchbudgets für normalisierte Nachprüfung. Keine Füllhinweise.
- Maximal 48 Diagnosen/3.120 Zustände, höchstens 65 Zustände je Diagnose.
  Vor erster Diagnose persistierter Plan: bestehende kartenweise Rundenfolge
  nach ursprünglicher Variantenordinalzahl, **höchstens zwei Runden**.
  Keine dritte Variante bei verbleibender Kapazität. Die vorhandene API
  unterstützt 48 Diagnosen; die neue enge Planhülle begrenzt Runden explizit.
- Vorhandene Diagnosefunktion hat feste Grenzen 250.000 Knoten für ihren
  Grundraum und 250.000 für ihr Solver-Orakel. Vorhandener unabhängiger
  Kandidatenprüfer: 1.000.000 Knoten je Satz, zusätzlich je Karte/Start für
  Effektprüfung. Diese APIs nehmen keine überschreibbaren Parameter an;
  `implementationLimits` dokumentiert exakt die geprüften Konstanten. Keine
  vorgetäuschte Weitergabe nicht unterstützter Optionen, keine Engineänderung.
- Baseline-Orakel und Zielauswahl jeweils explizit 100.000 Knoten. B1-Replay
  über den vorhandenen B2-Leser vollständig, inklusive aller Karten/Belegungen.
- Äußerer Worker-Watchdog **900.000 ms**, Node-Heap **768 MiB** (kein behauptetes
  hartes RSS-Limit). Bei Überschreitung SIGKILL und Abbruch. Tatsächliche
  Wallzeit, Worker-CPU und Spitzen-RSS getrennt in `observations.json`;
  Git-Unterprozess-CPU wird nicht als mitgemessen behauptet.

Ableitung: Pilot gemessen 79,61 s, gemeinsame Vorbereitung 54,65 s, Viererarm
9,72 s. 24 statt 6 Karten entsprechen grob 4× Vorbereitung; 48 statt 12
Diagnosen grob 4× Viererarm. Rund 260 s sind eine **Schätzung**, kein Benchmark
für die neuen Karten. 900 s geben endliche Reserve für andere Routengrößen,
Release-I/O und Quellenprüfungen. Kein Übernehmen des 120-s-Pilotlimits und
keine pauschale Erhöhung einzelner Suchgrenzen. Maximal 24 Ziele, 96 Neustarts,
48.000 Solverchecks, 120 Mio. Matches und 480 Mio. Filter; Rohsätze höchstens 96.
B1 hat höchstens 24×25 Startprüfungen à 100.000 Knoten, einmal plus Replay.
Unabhängige spätere Prüfung und Replay sind getrennte Prüfprozesse; Replay
benutzt denselben 900-s-Worker-Watchdog, sein Harness höchstens 910 s.

## Unveränderte Präferenzen und Auswahl

P1–P4, ihre menschlichen Quellen, Gegenbeispiele und Grenzen aus dem geprüften
A/B-Vertrag gelten vollständig. P1: Ein-/Zweihinweis-Markierungseinstieg.
P2: höchstens zwei offene Stunden mit je drei Feldern und zwei lokalen
Kopplungen. P3: gemischte Kombination oder Wiederverwendung. P4: eine Karte
insgesamt und höchstens zwei Fälle je bestehender Verlaufssignatur. Kein
Gesamtscore, Gewicht, Schwierigkeitsalgorithmus oder menschlicher Qualitätsbeweis.

Harte Voraussetzungen: gültige Karte/Belegung, vollständiger legaler Raum,
gebundene Zielroute, eindeutige zielgleiche Lösung, logische Irredundanz,
korrekte Identitäten/Effekt-Deduplikation und S04-B-Provenienz. Sämtliche
Suchausgaben werden unabhängig geprüft, **auch** später früh abgelehnte.
Experimentelle Frühfilter unverändert: 3..7 finale Hinweise, höchstens drei
Folgestunden je Einzelhinweis. Erst danach Diagnosen; fehlende Diagnose ist
unbekannt, nie schlecht. Frühe Ablehnung, Diagnose-/Rundenlimit, bevorzugt,
kontrollberechtigt und gültig nicht ausgewählt bleiben getrennt.

Nach vollständiger Diagnose entsteht der Kontrollrahmen aus allen früh
zulässigen Fällen mit mindestens einem falschen P1/P2/P3, **vor** bevorzugter
Auswahl. Bestehendes `selectCohorts`: SHA-256(Salt + NUL + Variantenfingerprint),
neuer Salt `s04-c-production-cohorts-1`, aufsteigend. Höchstens vier Kontrollen
reservieren zuerst ihre Karten; danach höchstens zwölf bevorzugte Fälle,
insgesamt eine Karte und max. zwei je Signatur. Kontrollreservierungen mit
bevorzugten Geschwistern werden ausdrücklich privat protokolliert.
Ziel 9..12 bevorzugt und 3..4 Kontrollen ist keine Quote. Kein Auffüllen,
Nachjustieren oder Nachgenerieren bei Unterausbeute. Kontrollen bleiben
mathematisch gültig und unter denselben frühen Ausschlüssen.

## Prüfung, Bytebindung und private Übergabe

Ursprungsvertrag aus unverändertem Erzeuger im vertrauenswürdigen Speicher;
Digest wird vor untrusted Dateiprüfung gepinnt und im separaten stdout-Beleg
festgehalten. Kein Prüfer darf einen erwarteten Digest aus Kandidaten- oder
Belegdateien lernen. Der getrennte Replay am gepinnten Programm bestätigt
diesen Digest unabhängig erneut. Erst dieser bestätigte Receipt ist der
öffentliche Prüfanker (nur Hashes/Programmidentität, keine fallbezogenen Daten).

Das vollständige private Dateiinventar bindet Pfade, Größen und SHA-256.
Unabhängige Prüfung aller Sätze, B1-/Batchbindungen, gespeicherter Diagnosen,
Profilhashes, Präferenzen, Plan und Kohorten. v2-Präsentation und öffentliche
Allowlist werden nur im Speicher auf Kompatibilität geprüft; technische
Prüfformulierungen werden nicht als Flavor gespeichert. Replay vergleicht
**jede deterministische Datei bytegleich**, auch Gzip, Belege, Auswahl,
Manifeste, Übergabe und Inventar. Nur tatsächliche Ressourcenbeobachtungen
werden ausgenommen. Keine bloße JSON-Gleichheit.

Das Repository ist öffentlich. Der gesamte neue Ergebnisbestand einschließlich
Lösungen, Diagnosen, Fallgruppen und Auswahlgründen bleibt daher **außerhalb
des Git-Checkouts** im privaten Arbeitsbereich; keine GitHub-Uploads dieser
Dateien. PR: Programm/Vertrag, aggregierter Bericht und bestätigte Hashanker.
Das ist bewusst eine Grenze öffentlicher Review; der Projektverfasser erhält
ein lokales vollständiges Archiv und die Prüf-/Replaybefehle.

Neutrale IDs C-01 usw. folgen einer eigenen Hashreihenfolge mit Salt
`s04-c-production-neutral-1`, ohne Gruppenreihenfolge. Private technische
Definitionen/Belegungen werden unverändert übergeben; die neutrale Übersicht
nennt nur ID und ausstehende Redaktion. Keine Geschichten, Namen oder Flavor.
Spätere Redaktion nach #21: kleine zusammenhängende Geschichte, passende Namen,
Kompass-Qualitätsreferenz; unabhängige Rückübersetzung **jedes** Textes, auch
Einleitung/Namen auf Zusatzhinweise; Logikidentitäten unverändert binden.
Externe Freigabe und menschliche Schwierigkeitseinstufung stehen aus. Keine
Veröffentlichung, kein öffentlicher Export, kein Teststart, kein Merge.
