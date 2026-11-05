# B2: Suchstrategie und längere irredundante Hinweissätze

## Entscheidung

**Ein höheres Budget allein erschließt bereits längere Sätze.** Die begrenzte
Suche mit schwächeren Ergänzungen verschiebt die Verteilung zusätzlich, kostet
aber mehr und legt häufiger Stunde 1 durch einen einzelnen Hinweis fest.
Empfehlung: zunächst ein kleiner, kontrollierter menschlicher Paarvergleich auf
denselben Zielrouten. Noch keinen größeren neuen Spieltestbestand oder produktiven
Filter einführen. Hinweisanzahl ist eine Hypothese, kein bestätigtes Qualitätsmaß.

[Generierter Messbericht](B2-search-comparison/report.md) ·
[Alle Messdaten](B2-search-comparison/summary.json) ·
[Laufzeit und Ressourcen](B2-search-comparison/observations.json) ·
[Provenienz](B2-search-comparison/manifest.json) ·
[Private Kandidaten und Nachweise](B2-search-comparison/candidates.jsonl).
Die letzte Datei enthält Lösungen; die folgenden Kennungen verraten keine.

## Architekturprüfung (Schritt 1)

Untersucht wurden `puzzle-clues.mjs`, `puzzle-candidate-search.mjs`,
`puzzle-route-solver.mjs`, `puzzle-experiment.mjs` und der unabhängige Prüfer
`verify-puzzle-experiment.mjs` im aktuellen main
`7d5ca42c71e95f2fe6d59b24b68b2769a8727a6c` (auch über GitHub geprüft).

- Die sechs Parameterdomänen werden deterministisch aus dem Schema erzeugt.
  Round-robin über Typen verhindert, dass ein knappes Parameterbudget nur die erste
  Familie sieht. Nur auf der Zielroute wahre, parameterweise verschiedene Hinweise
  gelangen in den Pool. Die Domänen sind unterschiedlich groß: Typen werden in der
  Suche **nicht** gleich gewichtet. Große Familien erhalten mehr Lose.
- Alle legalen Routen werden je Start vollständig enumeriert. Für einen Hinweis
  wird seine Wahrheitsmaske auf diesen Routen bedarfsgesteuert berechnet.
  `check(indices)` bildet Schnittmengen; Ergebnisse werden je Zielsuche gecacht.
- Die Baseline mischt den gesamten Pool je Neustart mit einem getrennten,
  deterministischen Zufallsstrom. Sie nimmt die **erste** reduzierende Ergänzung
  in dieser Reihenfolge. Es gibt keine Rangfolge nach maximaler Reduktion,
  keine Qualitätsbewertung und keine Gewichtung nach Hinweistyp.
- `NO_PROGRESS` zählt einzelne geprüfte Ergänzungen, die keine überlebende Route
  entfernen. Es ist weder ein Neustartlimit noch ein eigenständiger Abbruchgrund.
  Solche Ergänzungen kosten gegebenenfalls Solver-, Match- und Filterbudget.
- Sobald eine Folge genau eine Route enthält, wird sie nicht weiter verlängert.
  Zufällig geordnete sequenzielle Löschungen entfernen nachträglich redundante
  Hinweise. Ein weiterer Nachweis kontrolliert jede einzelne Auslassung gegen den
  dann endgültigen Satz. Mehrere unterschiedliche minimale Sätze sind möglich.
- Nach Kandidatenannahme läuft die äußere Suche weiter bis zum Neustartbudget.
  Doppelte logische Varianten und gleiche Mengen von Einzelhinweiswirkungen werden
  verworfen. Eine bereits allein eindeutige Hintergrundkarte beendet die Suche.
  Es gibt kein Backtracking partieller Folgen; Alternativen entstehen durch neue
  Mischungen und Löschreihenfolgen.
- Solverbudget zählt **ungecachte** Kombinationen (auch Leer-, Einzel- und
  Nachweisprüfungen), nicht Funktionsaufrufe. Matchbudget zählt neue
  Hinweis-Routen-Paare. Filterbudget zählt einzelne Maskentests, mit frühem Abbruch
  je Route. Cachetreffer verbrauchen keines dieser drei Budgets. Irredundanz-,
  Identitäts- und Einzelstundenprüfungen verbrauchen dieselben Budgets.
  Ein Budgetfehler kann daher auch einen begonnenen Kandidaten noch verhindern.
  Nur vollständig nachgewiesene Kandidaten werden gespeichert.

**Ursache A:** S02 beendete jede Zielsuche nach nur zwei Neustarts. Ob ein größeres
Budget hilft, musste gemessen werden; der Vergleich bestätigt es auf der Stichprobe.
**Ursache B:** Eine explizite Bevorzugung maximaler Reduktion existiert nicht.
Das unmittelbare Übernehmen jeder reduzierenden Ergänzung und der Stopp bei
Eindeutigkeit erlauben starke Abkürzungen. Wie viel der S02-Verteilung gerade daraus
statt aus Karten, Zielrouten und Poolzusammensetzung folgt, ist hier nicht isoliert.
Die notwendige Irredundanzreduktion kann außerdem lange Folgen wieder verkürzen.

## Minimaler Versuch (Schritt 2)

Die vorhandene Strategie-Schnittstelle reicht aus; Baseline, Solver und
Generierungs-CLI wurden **nicht verändert**. Neu sind nur ein experimenteller
Strategiemodul, eine separate Vergleichs-CLI und deren Konfiguration/Tests.

C betrachtet je Schritt bis zu acht gültige reduzierende Alternativen in zufälliger
Reihenfolge. Es übernimmt die Ergänzung mit den meisten verbleibenden Routen.
Bei gleichem Restwert gewinnt der einzeln schwächere Hinweis, bei erneutem
Gleichstand die erste Option. Ungewählte gültige Optionen bleiben für den nächsten
Schritt verfügbar. Nicht reduzierende Hinweise können nach weiteren Schnittmengen
nicht wieder reduzierend werden und werden verworfen. Dieselbe sequenzielle
Minimalisierung und derselbe finale Nachweis wie in A gelten weiter. Keine neue
Optimierungsarchitektur, kein Typen-/Schwierigkeits-/Qualitätsscore.

| Einstellung je Ziel | A | B | C |
| --- | ---: | ---: | ---: |
| Strategie | original | original | schwächere Ergänzung, Fenster 8 |
| Neustarts maximal | 2 | 20 | 20 |
| Ungecachte Solverprüfungen maximal | 2.000 | 20.000 | 20.000 |
| Matchauswertungen maximal | 5.000.000 | 50.000.000 | 50.000.000 |
| Filterauswertungen maximal | 20.000.000 | 100.000.000 | 100.000.000 |

B/C multiplizieren die Budgets mit zehn, gedeckelt durch bestehende Suchlimits;
Filterbudget daher nur Faktor fünf. Enumeration (100.000 Knoten) und
Parameterbudget (100.000) bleiben identisch. Keine dieser beiden Grenzen und keine
Solver-, Match- oder Filtergrenze wurde ausgeschöpft; alle zwölf Suchen endeten am
Neustartbudget. `incomplete` bedeutet hier weiterhin: keine vollständige Aufzählung
aller möglichen Hinweissätze.

Vier vorher festgelegte Ziele: M017-A4 (1.684 Routen), M003-A5 (746),
M005-E3 (2.166), M013-D4 (2.145). Die ersten zwei sind die genannten menschlichen
Testfälle. Die weiteren sind die höchsten S02-Routenzahlen auf zwei verschiedenen
zusätzlichen Karten; Auswahl nach legalem Suchraum, nicht nach Ergebnis dieses
Experiments. Alle Ziele verwenden Routenindex 0. Karten, Starts, Zielrouten,
Motivbelegungen, Katalogrelease, Hintergrund und Regeln kommen unverändert aus
S02. Pool und Routenraum werden je Ziel gemeinsam vorbereitet; jeder Arm erhält
einen frischen Solvercache. Alle Arme verwenden den ursprünglichen S02-Zielseed.
A reproduziert zusätzlich alle Originalkandidaten **und sämtliche Suchzähler** exakt.

## Tatsächlicher Vergleich

| Messung über vier Ziele | A | B | C |
| --- | ---: | ---: | ---: |
| Generatoraufrufe | 4 | 4 | 4 |
| Gestartete Folgen / Neustarts | 8 | 80 | 80 |
| Eindeutige minimalisierte Sätze vor Deduplikation | 8 | 80 | 80 |
| Akzeptierte Kandidaten | 8 | 79 | 80 |
| 5 Hinweise | 0 (0 %) | 23 (29,11 %) | 21 (26,25 %) |
| 6 Hinweise | 1 (12,5 %) | 9 (11,39 %) | 26 (32,5 %) |
| 7 Hinweise | 0 (0 %) | 6 (7,59 %) | 15 (18,75 %) |
| Insgesamt 5–7 | 1 (12,5 %) | 38 (48,10 %) | 62 (77,5 %) |
| 8 Hinweise (nicht weggefiltert) | 0 | 0 | 7 |
| Solverprüfungen | 367 | 4.144 | 25.392 |
| Matchauswertungen | 431.223 | 3.272.991 | 6.504.946 |
| Filterauswertungen | 1.052.955 | 10.920.119 | 84.794.138 |
| NO_PROGRESS | 185 | 2.283 | 12.454 |
| Hinweise, die einzeln mindestens eine Stunde festlegen | 0 | 4 | 11 |
| Kandidaten mit einzeln exakter Stunde 1 | 0 | 3 | 11 |
| Reine Suchzeit (beobachtet) | 0,494 s | 3,304 s | 8,911 s |

B verwirft einen wirkungsgleichen Satz. A ist vollständig in B enthalten, C hat in
diesem Lauf keine Wirkungsschlüssel mit A/B gemeinsam. Je Ziel akzeptiert A zwei,
B 19–20 und C 20 Kandidaten. Alle 167 gespeicherten Kandidaten wurden mit dem
bestehenden unabhängigen Prüfer nachgerechnet; die Auslassungszahlen, Zielroute,
Fingerprints und Wirkungsschlüssel stimmen. Die Zahl der durch Einzelhinweise
festgelegten Positionen je Stunde steht zusätzlich in `exactHours` (Vorkommen,
keine Deduplikation zwischen Kandidaten).

C benötigt gegenüber B etwa Faktor **2,70 Suchzeit**, **6,13 Solverprüfungen** und
**7,76 Filtertests**. Es liefert 62 statt 38 Sätze im Untersuchungsbereich (+63 %),
aber fast dieselbe gesamte Kandidatenzahl. Pro 5–7-Kandidat sind das etwa 144 ms
statt 87 ms Suchzeit. Der komplette Lauf einschließlich wiederholter unabhängiger
Einzel-/Paar-/Auslassungsdiagnose dauerte 45,31 s, nutzte 44,92 CPU-s und maximal
207,9 MiB RSS. Diese Prozessspitze ist keine getrennte Speichermessung je Arm.
Laufzeiten sind Einzelbeobachtungen unter wechselnder Hostlast, keine Benchmarks.

Jeder Kandidat enthält Einzelhinweis-Restzahlen und Eliminationsanteile, alle
Paarschnittmengen und Restzahlen nach jedem Präfix der **kanonischen** Reihenfolge.
So kann beispielsweise eine schwache Einzelbedingung mit einer zweiten gemeinsam
stark einschränken. Die kanonische Reihenfolge ist nicht die Generierungsfolge und
keine rekonstruierte menschliche Deduktion. Die echte inkrementelle Suchfolge wird
nicht zusätzlich gespeichert; diese optionale Diagnose bleibt eine Grenze.


## Hinweiszusammensetzung der akzeptierten Kandidaten

Jedes gespeicherte Vorkommen zählt; keine Deduplikation zwischen Kandidaten.

| Logischer Typ | A | B | C |
| --- | ---: | ---: | ---: |
| countDistanceToPlace | 21 | 273 | 391 |
| direction | 3 | 20 | 19 |
| distanceBetweenHours | 3 | 20 | 29 |
| distanceToPlace | 4 | 22 | 16 |
| turn | 1 | 15 | 11 |

| Darstellungsform | A | B | C |
| --- | ---: | ---: | ---: |
| CountDistanceNever | 3 | 40 | 99 |
| HasDistanceAt | 4 | 22 | 24 |
| NotDistanceAt | 0 | 19 | 49 |
| countDistanceToPlace | 14 | 192 | 219 |
| direction | 3 | 20 | 19 |
| distanceBetweenHours | 3 | 20 | 29 |
| distanceToPlace | 4 | 22 | 16 |
| turn | 1 | 15 | 11 |

| Einzeln exakt bestimmte Stundenposition | A | B | C |
| --- | ---: | ---: | ---: |
| Stunde 1 | 0 | 3 | 11 |
| Stunde 2 | 0 | 2 | 1 |
| Stunde 3 | 0 | 2 | 1 |
| Stunde 4 | 0 | 2 | 0 |
| Stunde 5 | 0 | 1 | 0 |
| Stunde 6 | 0 | 1 | 0 |

Eine Bedingung kann mehrere Stunden festlegen und zählt dann in mehreren Zeilen.

## Grenzen und nächste Entscheidung

Vier bewusst ausgewählte Instanzen, ein gepaarter Seed je Instanz und 20 Folgen
sind keine repräsentative Zufallsstichprobe. B ist ein Präfixvergleich zu A;
C nutzt einen eigenen Strategie-Zufallsstrom. Der Effekt umfasst somit Variation
und deren deterministische Mischfolge. Keine Aussage über global optimale Sätze,
allgemeine Schwierigkeit, menschliche Qualität oder Typenvielfalt ist bewiesen.
Die großen Zählhinweisfamilien dominieren auch C. Mehr einzeln exakte Stunde-1-
Hinweise in C zeigen gerade, warum Länge nicht als Qualitätsfilter taugt.

Empfehlung: zuerst je getesteter Zielroute Original, einen B- und einen C-Kandidaten
blind in wechselnder Reihenfolge spielen lassen; schrittweise notierte Teilschlüsse,
mentale Routenprüfung und Stunde-1-Effekt beobachten. Erst bei einem wiederholbaren
menschlichen Vorteil mehrere Seeds und breitere Karten-/Zielroutenauswahl messen,
danach separat über einen neuen Spieltestbestand entscheiden. Keine automatische
Übernahme in S02, keine Veröffentlichung oder Freigabe durch diesen Versuch.

## Identitäten, Provenienz und Reproduktion

Die Vergleichskennung bindet Protokoll, **alle** Arme/Budgets/Fenster, Programmcommit,
Node-Version, Quellhashes und ursprüngliche S02-Experimentkennung. Die Eingaben
werden vor/nach dem Lauf gehasht; S02-Bindungen werden zuvor vollständig validiert.
Kandidatenkennung = Vergleichskennung / Arm / Quellziel / vollständiger logischer
Variantenfingerprint. Der Quellzielname bezeichnet nur die unveränderte Zielinstanz,
keine Ersetzung der alten Variante. Identische Logik behält ihren bisherigen
logischen Fingerprint; ein neuer Sucharm erhält eine neue Experimentprovenienz.
Es gibt keine versteckten Nachläufe, Auswahlfilter oder Nachfüllung.

Der vorhandene B2-Manifestvertrag hätte bei einer Strategieänderung auch seine
Strategie- und Seedidentität anpassen müssen. Die getrennte CLI verhindert, dass
unter `random-incremental-1` still eine andere Strategie ausgeführt wird. S01/S02,
Paketformate, UI, öffentliche Rätsel und Katalog bleiben unverändert.

Exakte Reproduktion unter Node v24.19.0 aus dem im Manifest gebundenen sauberen
Programmcommit `d9791b7` (vollständige SHA im Manifest):

```sh
git worktree add --detach /tmp/b2-search-program d9791b7
cd /tmp/b2-search-program
node scripts/run-b2-search-comparison.mjs /tmp/b2-search-result
```

Optional zweites Argument: vollständige JSON-Konfiguration nach dem Beispiel
`scripts/config/b2-search-comparison.json`. Neue Parameter/Programmstände bekommen
neue Identitäten. Ausgabeordner müssen neu sein. Zeit-/Ressourcenbeobachtungen
sind separat und nicht Teil der deterministischen Identität.

Automatisierte Prüfung im PR-Checkout:

```sh
npm run test:unit
node --test tests/reproduction/b2-search-comparison.test.mjs tests/reproduction/b2-s02.test.mjs
npm run test:content
npm run test:puzzles
```

Der neue Reproduktionstest klont den aufgezeichneten Programmcommit und vergleicht
Manifest, sämtliche Kandidaten, Nachweise, Suchzähler, Zusammenfassung und Bericht
byteweise. Der bestehende S02-Test reproduziert weiterhin seine elf fachlichen
Dateien. Die Strategietests prüfen einen künstlichen Suchraum mit nachweisbarer
Abkürzung, deterministische Exploration, Notwendigkeit, Budgetabbrüche sowie leere
und bereits eindeutige Hintergründe. Laufzeitdaten werden nicht auf Bytegleichheit
getestet.

## Kandidaten für menschliche Vergleichstests (noch keine Freigabe)

Folgende C-Kandidaten haben sechs/sieben Hinweise und keinen Hinweis, der allein
Stunde 1 festlegt. Diese transparente redaktionelle Vorschlagsauswahl verändert
keine Versuchszahlen; sämtliche erzeugten Kandidaten bleiben gespeichert.

- 7 Hinweise, Quelle B2-S02-M017-A4-R00-V02:
  `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M017-A4-R00-V02/gk-variant-v2-sha256:1bc4f128dfd8d906d990e1b3309850d66468e1113a6998402dde5ee56fd62d56`

- 6 Hinweise, Quelle B2-S02-M003-A5-R00-V02:
  `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M003-A5-R00-V02/gk-variant-v2-sha256:501a55f30edb6058856b2549672266f5b226c8bd4b63330be64e06f2bc8bfb72`

- 6 Hinweise, Quelle B2-S02-M013-D4-R00-V01:
  `gk-b2-search-run-sha256:6630f89033685ef231b0a841a803d7fde146249f1da9b4906e9644b57ab0c849/C/B2-S02-M013-D4-R00-V01/gk-variant-v2-sha256:63bc61f3048b94eb4096b12e14ddf819e666e181d0039dca3e1854772c7fd2e5`
